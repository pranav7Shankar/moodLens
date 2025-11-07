import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { RekognitionClient, DetectFacesCommand, CompareFacesCommand } from '@aws-sdk/client-rekognition';
import https from 'https';
import http from 'http';

function getRekognitionClient() {
    return new RekognitionClient({
        region: process.env.AWS_REGION || 'us-east-1',
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        }
    });
}

export async function POST(request) {
    try {
        // Get form data
        const formData = await request.formData();
        const imageFile = formData.get('image');

        if (!imageFile || !(imageFile instanceof File)) {
            return NextResponse.json({ error: 'No image file provided' }, { status: 400 });
        }

        // Convert File to Buffer
        const arrayBuffer = await imageFile.arrayBuffer();
        const capturedImageBuffer = Buffer.from(arrayBuffer);

        // First, detect if there's a face in the captured image
        const detectParams = {
            Image: {
                Bytes: capturedImageBuffer
            },
            Attributes: ['ALL']
        };

        const rekognitionClient = getRekognitionClient();
        const detectCommand = new DetectFacesCommand(detectParams);
        const rekognitionResult = await rekognitionClient.send(detectCommand);

        if (!rekognitionResult.FaceDetails || rekognitionResult.FaceDetails.length === 0) {
            return NextResponse.json({ error: 'No face detected in the image' }, { status: 400 });
        }

        // Fetch all employees with images for face matching
        const { data: allEmployees, error: empError } = await supabaseAdmin
            .from('employees')
            .select('*')
            .not('employee_image', 'is', null);

        if (empError) {
            throw empError;
        }

        if (!allEmployees || allEmployees.length === 0) {
            return NextResponse.json({ 
                error: 'No employees found',
                message: 'No employees with registered photos found in the database. Please contact HR to register your photo.'
            }, { status: 404 });
        }

        // Face recognition: Compare captured face against all employee images
        const SIMILARITY_THRESHOLD = 70; // Minimum similarity percentage required
        const HIGH_CONFIDENCE_THRESHOLD = 95; // Early exit if we find a match this high
        let bestMatch = null;
        let matchedEmployee = null;
        let bestSimilarity = 0;

        // Comparing face against employees for recognition

        // Filter employees with images
        const employeesWithImages = allEmployees.filter(emp => emp.employee_image);
        
        // Process employees in parallel batches (10 at a time to avoid overwhelming AWS)
        const BATCH_SIZE = 10;
        let foundHighConfidenceMatch = false;

        for (let i = 0; i < employeesWithImages.length && !foundHighConfidenceMatch; i += BATCH_SIZE) {
            const batch = employeesWithImages.slice(i, i + BATCH_SIZE);
            
            // Process batch in parallel
            const batchResults = await Promise.allSettled(
                batch.map(async (employee) => {
                    try {
                        // Download the employee's stored image from Supabase storage
                        const employeeImageBuffer = await downloadImage(employee.employee_image);
                        
                        if (!employeeImageBuffer) {
                            return null;
                        }

                        // Compare faces using AWS Rekognition
                        const compareParams = {
                            SourceImage: {
                                Bytes: capturedImageBuffer
                            },
                            TargetImage: {
                                Bytes: employeeImageBuffer
                            },
                            SimilarityThreshold: SIMILARITY_THRESHOLD
                        };

                        const rekognitionClient = getRekognitionClient();
                        const compareCommand = new CompareFacesCommand(compareParams);
                        const faceMatchResult = await rekognitionClient.send(compareCommand);
                    
                        if (faceMatchResult.FaceMatches && faceMatchResult.FaceMatches.length > 0) {
                            // Get the highest similarity match for this employee
                            const match = faceMatchResult.FaceMatches.reduce((best, current) => 
                                current.Similarity > best.Similarity ? current : best
                            );

                            return {
                                employee,
                                match,
                                similarity: match.Similarity
                            };
                        }
                        return null;
                    } catch (error) {
                        console.error(`Error processing ${employee.name}:`, error.message);
                        return null;
                    }
                })
            );

            // Process batch results
            for (const result of batchResults) {
                if (result.status === 'fulfilled' && result.value) {
                    const { employee, match, similarity } = result.value;
                    
                    // Track the best match across all employees
                    if (similarity > bestSimilarity) {
                        bestSimilarity = similarity;
                        bestMatch = match;
                        matchedEmployee = employee;
                        
                        // Early exit if we found a very high confidence match
                        if (similarity >= HIGH_CONFIDENCE_THRESHOLD) {
                            // High confidence match found - stopping search
                            foundHighConfidenceMatch = true;
                            break;
                        }
                    }
                }
            }
        }

        // Check if we found a match above threshold
        if (!matchedEmployee || bestSimilarity < SIMILARITY_THRESHOLD) {
            return NextResponse.json({ 
                error: 'Employee not recognized',
                message: `No matching employee found. Face recognition confidence: ${bestSimilarity > 0 ? Math.round(bestSimilarity) + '%' : 'N/A'}. Please ensure your face is clearly visible and try again, or contact HR if your photo needs to be updated.`,
                similarity: bestSimilarity > 0 ? Math.round(bestSimilarity) : 0
            }, { status: 404 });
        }

        // Found a match! Use the matched employee
        const employee = matchedEmployee;
        // Face recognition successful

        // Use the face detection result from earlier
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
            return NextResponse.json({
                error: 'Attendance already recorded',
                message: `Attendance for ${employee.name} has already been recorded today at ${new Date(existingRecord.timestamp).toLocaleTimeString()}`,
                existing_record: existingRecord,
                employee: employee
            }, { status: 400 });
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
                return NextResponse.json({ 
                    error: 'Attendance table not found. Please create the attendance table in Supabase.',
                    details: attendanceError.message
                }, { status: 500 });
            }
            throw attendanceError;
        }

        // Store/update emotion records in parallel (they don't depend on each other)
        const emotionConfidence = Math.round(primaryEmotion.Confidence * 100) / 100;
        const emotionRecord = {
            employee_id: employee.id,
            employee_name: employee.name,
            date: today,
            emotion: primaryEmotion.Type,
            emotion_confidence: emotionConfidence,
            timestamp: new Date().toISOString()
        };

        // Run emotion record checks in parallel
        const [emotionCheckResult, anonymousCheckResult] = await Promise.allSettled([
            supabaseAdmin
                .from('emotion_records')
                .select('id')
                .eq('employee_id', employee.id)
                .eq('date', today)
                .single(),
            supabaseAdmin
                .from('anonymous_emotions')
                .select('id, count, confidence')
                .eq('date', today)
                .eq('emotion', primaryEmotion.Type)
                .eq('gender', employee.gender || null)
                .eq('department', employee.department || null)
                .single()
        ]);

        // Process emotion record
        let emotionData = null;
        let emotionError = null;

        if (emotionCheckResult.status === 'fulfilled') {
            const { data: existingEmotion, error: checkEmotionError } = emotionCheckResult.value;
            
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
                        emotion_confidence: emotionConfidence,
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
        } else {
            emotionError = emotionCheckResult.reason;
        }

        // Don't fail the attendance record if emotion record fails (log it)
        if (emotionError) {
            console.error('Error storing emotion record:', emotionError);
        }

        // Process anonymous emotion record
        if (anonymousCheckResult.status === 'fulfilled') {
            const { data: existingAnonymous, error: checkAnonymousError } = anonymousCheckResult.value;

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
                // Existing record - increment count and update confidence
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
            } else if (checkAnonymousError) {
                console.error('Error checking anonymous emotion:', checkAnonymousError);
            }
        } else {
            console.error('Error checking anonymous emotion:', anonymousCheckResult.reason);
        }

        return NextResponse.json({
            success: true,
            message: 'Attendance recorded successfully',
            attendance: attendanceData,
            emotion_record: emotionData || null,
            employee: employee,
            // Include emotion data from analysis for display purposes
            emotion: primaryEmotion.Type,
            emotion_confidence: Math.round(primaryEmotion.Confidence * 100) / 100,
            // Include face recognition information
            face_match: {
                matched: true,
                similarity: Math.round(bestSimilarity),
                recognized: true
            }
        });

    } catch (error) {
        console.error('Error recording attendance:', error);
        return NextResponse.json({
            error: 'Failed to record attendance',
            details: error.message
        }, { status: 500 });
    }
}

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const date = searchParams.get('date');
        const start_date = searchParams.get('start_date');
        const end_date = searchParams.get('end_date');
        const employee_id = searchParams.get('employee_id');

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

        return NextResponse.json({ attendance: data || [] });

    } catch (error) {
        console.error('Error fetching attendance:', error);
        return NextResponse.json({
            error: 'Failed to fetch attendance records',
            details: error.message
        }, { status: 500 });
    }
}

// Helper function to download image from URL
function downloadImage(url) {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https') ? https : http;
        
        protocol.get(url, (response) => {
            if (response.statusCode !== 200) {
                reject(new Error(`Failed to download image: ${response.statusCode}`));
                return;
            }

            const chunks = [];
            response.on('data', (chunk) => chunks.push(chunk));
            response.on('end', () => {
                const buffer = Buffer.concat(chunks);
                resolve(buffer);
            });
            response.on('error', (error) => reject(error));
        }).on('error', (error) => reject(error));
    });
}

