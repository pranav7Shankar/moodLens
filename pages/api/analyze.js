import AWS from 'aws-sdk';
import formidable from 'formidable';
import fs from 'fs';

// Configure AWS
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
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Parse the uploaded file
        const form = formidable({});
        const [fields, files] = await form.parse(req);

        const uploadedFile = files.image;
        if (!uploadedFile || uploadedFile.length === 0) {
            return res.status(400).json({ error: 'No image file provided' });
        }

        const file = uploadedFile[0];

        // Read the image file
        const imageBuffer = fs.readFileSync(file.filepath);

        // Analyze the face using AWS Rekognition
        const params = {
            Image: {
                Bytes: imageBuffer
            },
            Attributes: [
                'ALL' // This includes age, gender, emotions, etc.
            ]
        };

        const result = await rekognition.detectFaces(params).promise();

        // Clean up the temporary file
        fs.unlinkSync(file.filepath);

        if (result.FaceDetails && result.FaceDetails.length > 0) {
            // Process the results to make them more readable
            const processedResults = result.FaceDetails.map((face, index) => ({
                faceId: index + 1,
                ageRange: face.AgeRange,
                gender: {
                    value: face.Gender.Value,
                    confidence: Math.round(face.Gender.Confidence * 100) / 100
                },
                emotions: face.Emotions.map(emotion => ({
                    type: emotion.Type,
                    confidence: Math.round(emotion.Confidence * 100) / 100
                })).sort((a, b) => b.confidence - a.confidence),
                attributes: {
                    smile: face.Smile ? {
                        value: face.Smile.Value,
                        confidence: Math.round(face.Smile.Confidence * 100) / 100
                    } : null,
                    eyeglasses: face.Eyeglasses ? {
                        value: face.Eyeglasses.Value,
                        confidence: Math.round(face.Eyeglasses.Confidence * 100) / 100
                    } : null,
                    sunglasses: face.Sunglasses ? {
                        value: face.Sunglasses.Value,
                        confidence: Math.round(face.Sunglasses.Confidence * 100) / 100
                    } : null,
                    beard: face.Beard ? {
                        value: face.Beard.Value,
                        confidence: Math.round(face.Beard.Confidence * 100) / 100
                    } : null,
                    mustache: face.Mustache ? {
                        value: face.Mustache.Value,
                        confidence: Math.round(face.Mustache.Confidence * 100) / 100
                    } : null,
                    eyesOpen: face.EyesOpen ? {
                        value: face.EyesOpen.Value,
                        confidence: Math.round(face.EyesOpen.Confidence * 100) / 100
                    } : null,
                    mouthOpen: face.MouthOpen ? {
                        value: face.MouthOpen.Value,
                        confidence: Math.round(face.MouthOpen.Confidence * 100) / 100
                    } : null
                },
                quality: {
                    brightness: Math.round(face.Quality.Brightness * 100) / 100,
                    sharpness: Math.round(face.Quality.Sharpness * 100) / 100
                },
                confidence: Math.round(face.Confidence * 100) / 100,
                boundingBox: face.BoundingBox
            }));

            // No push side-effects; return JSON only

            res.status(200).json({
                success: true,
                facesDetected: result.FaceDetails.length,
                results: processedResults
            });
        } else {
            res.status(200).json({
                success: true,
                facesDetected: 0,
                message: 'No faces detected in the image'
            });
        }

    } catch (error) {
        console.error('Error analyzing image:', error);
        res.status(500).json({
            error: 'Failed to analyze image',
            details: error.message
        });
    }
}