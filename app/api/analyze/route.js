import { NextResponse } from 'next/server';
import AWS from 'aws-sdk';

// Configure AWS - lazy initialization
function getRekognition() {
    return new AWS.Rekognition({
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        region: process.env.AWS_REGION || 'us-east-1'
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
        const imageBuffer = Buffer.from(arrayBuffer);

        // Analyze the face using AWS Rekognition
        const params = {
            Image: {
                Bytes: imageBuffer
            },
            Attributes: [
                'ALL' // This includes age, gender, emotions, etc.
            ]
        };

        const rekognition = getRekognition();
        const result = await rekognition.detectFaces(params).promise();

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

            return NextResponse.json({
                success: true,
                facesDetected: result.FaceDetails.length,
                results: processedResults
            });
        } else {
            return NextResponse.json({
                success: true,
                facesDetected: 0,
                message: 'No faces detected in the image'
            });
        }

    } catch (error) {
        console.error('Error analyzing image:', error);
        return NextResponse.json({
            error: 'Failed to analyze image',
            details: error.message
        }, { status: 500 });
    }
}

