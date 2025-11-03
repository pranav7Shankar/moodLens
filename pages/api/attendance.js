import formidable from 'formidable';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import AWS from 'aws-sdk';
import fs from 'fs';

const rekognition = new AWS.Rekognition({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION || 'us-east-1'
});

export const config = {
    api: {
        bodyParser: false,
    },
};

export default async function handler(req, res) {
    if (req.method === 'POST') {
        try {
            // Parse form data
            const form = formidable({});
            const [fields, files] = await form.parse(req);

            const employeeName = (fields.name && fields.name[0])?.trim() || '';
            const uploadedFile = files.image && files.image[0];

            if (!employeeName) {
                return res.status(400).json({ error: 'Employee name is required' });
            }

            if (!uploadedFile) {
                return res.status(400).json({ error: 'No image file provided' });
            }

            // Find employee by name (case-insensitive)
            const { data: employees, error: empError } = await supabaseAdmin
                .from('employees')
                .select('*')
                .ilike('name', employeeName);

            if (empError) throw empError;

            if (!employees || employees.length === 0) {
                return res.status(404).json({ error: 'Employee not found. Please check the name.' });
            }

            // Get the first matching employee (or could handle multiple matches differently)
            const employee = employees[0];

            // Read the image file
            const imageBuffer = fs.readFileSync(uploadedFile.filepath);

            // Analyze the face using AWS Rekognition
            const params = {
                Image: {
                    Bytes: imageBuffer
                },
                Attributes: ['ALL']
            };

            const rekognitionResult = await rekognition.detectFaces(params).promise();

            // Clean up the temporary file
            fs.unlinkSync(uploadedFile.filepath);

            if (!rekognitionResult.FaceDetails || rekognitionResult.FaceDetails.length === 0) {
                return res.status(400).json({ error: 'No face detected in the image' });
            }

            const face = rekognitionResult.FaceDetails[0];
            const primaryEmotion = face.Emotions.sort((a, b) => b.Confidence - a.Confidence)[0];
            
            const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

            // Check if attendance already exists for this employee today
            const { data: existingRecord, error: checkError } = await supabaseAdmin
                .from('attendance')
                .select('id, timestamp')
                .eq('employee_id', employee.id)
                .eq('date', today)
                .single();

            if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows found (which is OK)
                throw checkError;
            }

            if (existingRecord) {
                return res.status(400).json({
                    error: 'Attendance already recorded',
                    message: `Attendance for ${employee.name} has already been recorded today at ${new Date(existingRecord.timestamp).toLocaleTimeString()}`,
                    existing_record: existingRecord
                });
            }

            // Store attendance record (without emotion data - emotions are only in anonymous_emotions table)
            const attendanceRecord = {
                employee_id: employee.id,
                employee_name: employee.name,
                date: today,
                timestamp: new Date().toISOString(),
                gender: face.Gender.Value,
                age_range_low: face.AgeRange.Low,
                age_range_high: face.AgeRange.High,
                present: true
            };

            const { data: attendanceData, error: attendanceError } = await supabaseAdmin
                .from('attendance')
                .insert([attendanceRecord])
                .select()
                .single();

            if (attendanceError) {
                // If table doesn't exist, provide helpful error
                if (attendanceError.message.includes('relation') && attendanceError.message.includes('does not exist')) {
                    return res.status(500).json({ 
                        error: 'Attendance table not found. Please create the attendance table in Supabase.',
                        details: attendanceError.message
                    });
                }
                throw attendanceError;
            }

            // Store/update emotion record (upsert - update if exists, insert if not)
            // Check if emotion record exists for this employee today
            const { data: existingEmotion, error: checkEmotionError } = await supabaseAdmin
                .from('emotion_records')
                .select('id')
                .eq('employee_id', employee.id)
                .eq('date', today)
                .single();

            const emotionRecord = {
                employee_id: employee.id,
                employee_name: employee.name,
                date: today,
                emotion: primaryEmotion.Type,
                emotion_confidence: Math.round(primaryEmotion.Confidence * 100) / 100,
                timestamp: new Date().toISOString()
            };

            let emotionData = null;
            let emotionError = null;

            if (checkEmotionError && checkEmotionError.code === 'PGRST116') {
                // No existing record - insert new
                const { data: newEmotion, error: insertError } = await supabaseAdmin
                    .from('emotion_records')
                    .insert([emotionRecord])
                    .select()
                    .single();
                emotionData = newEmotion;
                emotionError = insertError;
            } else if (!checkEmotionError && existingEmotion) {
                // Existing record - update it
                const { data: updatedEmotion, error: updateError } = await supabaseAdmin
                    .from('emotion_records')
                    .update({
                        emotion: primaryEmotion.Type,
                        emotion_confidence: Math.round(primaryEmotion.Confidence * 100) / 100,
                        timestamp: new Date().toISOString()
                    })
                    .eq('id', existingEmotion.id)
                    .select()
                    .single();
                emotionData = updatedEmotion;
                emotionError = updateError;
            } else {
                emotionError = checkEmotionError;
            }

            // Don't fail the attendance record if emotion record fails (log it)
            if (emotionError) {
                console.error('Error storing emotion record:', emotionError);
                // Continue anyway - attendance is already recorded
            }

            // Store anonymous emotion data (increment count for this emotion/gender/department on this date)
            const emotionConfidence = Math.round(primaryEmotion.Confidence * 100) / 100;
            const { data: existingAnonymous, error: checkAnonymousError } = await supabaseAdmin
                .from('anonymous_emotions')
                .select('id, count, confidence')
                .eq('date', today)
                .eq('emotion', primaryEmotion.Type)
                .eq('gender', employee.gender || null)
                .eq('department', employee.department || null)
                .single();

            if (checkAnonymousError && checkAnonymousError.code === 'PGRST116') {
                // No existing record - insert new
                const { error: insertAnonymousError } = await supabaseAdmin
                    .from('anonymous_emotions')
                    .insert([{
                        date: today,
                        emotion: primaryEmotion.Type,
                        gender: employee.gender || null,
                        department: employee.department || null,
                        confidence: emotionConfidence,
                        count: 1,
                        timestamp: new Date().toISOString()
                    }]);

                if (insertAnonymousError) {
                    console.error('Error storing anonymous emotion:', insertAnonymousError);
                }
            } else if (!checkAnonymousError && existingAnonymous) {
                // Existing record - increment count and update confidence (average or max, using average for better representation)
                const newCount = existingAnonymous.count + 1;
                const existingConfidence = existingAnonymous.confidence || 0;
                // Calculate weighted average confidence
                const averageConfidence = ((existingConfidence * existingAnonymous.count) + emotionConfidence) / newCount;
                
                const { error: updateAnonymousError } = await supabaseAdmin
                    .from('anonymous_emotions')
                    .update({
                        count: newCount,
                        confidence: Math.round(averageConfidence * 100) / 100,
                        timestamp: new Date().toISOString()
                    })
                    .eq('id', existingAnonymous.id);

                if (updateAnonymousError) {
                    console.error('Error updating anonymous emotion:', updateAnonymousError);
                }
            } else {
                console.error('Error checking anonymous emotion:', checkAnonymousError);
            }

            return res.status(200).json({
                success: true,
                message: 'Attendance recorded successfully',
                attendance: attendanceData,
                emotion_record: emotionData || null,
                employee: employee,
                // Include emotion data from analysis for display purposes
                emotion: primaryEmotion.Type,
                emotion_confidence: Math.round(primaryEmotion.Confidence * 100) / 100
            });

        } catch (error) {
            console.error('Error recording attendance:', error);
            return res.status(500).json({
                error: 'Failed to record attendance',
                details: error.message
            });
        }
    }

    if (req.method === 'GET') {
        try {
            const { date, start_date, end_date, employee_id } = req.query;

            let query = supabaseAdmin
                .from('attendance')
                .select(`
                    *,
                    employees (
                        id,
                        name,
                        department,
                        employee_image
                    )
                `)
                .order('timestamp', { ascending: false });

            // Support date range or single date
            if (start_date && end_date) {
                query = query.gte('date', start_date).lte('date', end_date);
            } else if (date) {
                query = query.eq('date', date);
            }

            if (employee_id) {
                query = query.eq('employee_id', employee_id);
            }

            const { data, error } = await query;

            if (error) throw error;

            return res.status(200).json({ attendance: data || [] });

        } catch (error) {
            console.error('Error fetching attendance:', error);
            return res.status(500).json({
                error: 'Failed to fetch attendance records',
                details: error.message
            });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
}

