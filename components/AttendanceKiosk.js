import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import EmployeeDashboard from './EmployeeDashboard';

export default function AttendanceKiosk() {
    const [isCapturing, setIsCapturing] = useState(false);
    const [stream, setStream] = useState(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');
    const [attendanceLog, setAttendanceLog] = useState([]);
    const [autoCapture, setAutoCapture] = useState(true); // Auto-capture enabled by default
    const [captureInterval, setCaptureInterval] = useState(3); // Auto-capture every 3 seconds
    const [capturedImage, setCapturedImage] = useState(null);
    const [showCapturedImage, setShowCapturedImage] = useState(false);
    const [lastProcessedTime, setLastProcessedTime] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);

    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const intervalRef = useRef(null);
    const autoCaptureRef = useRef(null);


    // Start webcam (auto-start on mount)
    useEffect(() => {
        let mediaStream = null;
        
        const initializeWebcam = async () => {
            try {
                mediaStream = await navigator.mediaDevices.getUserMedia({
                    video: { width: 1280, height: 720, facingMode: 'user' }
                });
                setStream(mediaStream);
                if (videoRef.current) {
                    videoRef.current.srcObject = mediaStream;
                    videoRef.current.muted = true; // Required for autoplay in some browsers
                    // Wait for video to be ready
                    await new Promise((resolve) => {
                        const video = videoRef.current;
                        if (video.readyState >= video.HAVE_CURRENT_DATA) {
                            resolve();
                        } else {
                            video.onloadeddata = resolve;
                            video.onloadedmetadata = resolve;
                            // Fallback timeout
                            setTimeout(resolve, 2000);
                        }
                    });
                    // Force play
                    try {
                        await videoRef.current.play();
                    } catch (playErr) {
                        console.warn('Autoplay prevented:', playErr);
                    }
                }
                setIsCapturing(true);
                speak('Webcam started. Automatic face recognition is active.');
            } catch (err) {
                console.error('Webcam error:', err);
                let errorMsg = 'Error accessing webcam: ' + err.message;
                
                // Provide helpful error messages
                if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                    errorMsg = 'Camera permission denied. Please allow camera access in your browser settings.';
                } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
                    errorMsg = 'No camera found. Please connect a camera device.';
                } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
                    errorMsg = 'Camera is being used by another application. Please close other apps using the camera.';
                } else if (err.name === 'OverconstrainedError' || err.name === 'ConstraintNotSatisfiedError') {
                    errorMsg = 'Camera does not support the required settings. Trying with default settings...';
                    // Retry with simpler constraints
                    try {
                        const fallbackStream = await navigator.mediaDevices.getUserMedia({
                            video: true
                        });
                        setStream(fallbackStream);
                        if (videoRef.current) {
                            videoRef.current.srcObject = fallbackStream;
                        }
                        setIsCapturing(true);
                        speak('Webcam started with default settings.');
                        return;
                    } catch (fallbackErr) {
                        errorMsg = 'Unable to access camera. Please check your browser permissions and ensure you are using HTTPS.';
                    }
                } else if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
                    errorMsg = 'Camera requires HTTPS. Please access this site via HTTPS.';
                }
                
                setStatusMessage(errorMsg);
                speak('Error accessing webcam');
            }
        };
        
        initializeWebcam();
        
        // Cleanup on unmount
        return () => {
            if (mediaStream) {
                mediaStream.getTracks().forEach(track => track.stop());
            }
            if (autoCaptureRef.current) {
                clearInterval(autoCaptureRef.current);
            }
        };
    }, []);

    const startWebcam = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { width: 1280, height: 720, facingMode: 'user' }
            });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
                videoRef.current.muted = true; // Required for autoplay in some browsers
                // Wait for video to be ready
                await new Promise((resolve) => {
                    const video = videoRef.current;
                    if (video.readyState >= video.HAVE_CURRENT_DATA) {
                        resolve();
                    } else {
                        video.onloadeddata = resolve;
                        video.onloadedmetadata = resolve;
                        // Fallback timeout
                        setTimeout(resolve, 2000);
                    }
                });
                // Force play
                try {
                    await videoRef.current.play();
                } catch (playErr) {
                    console.warn('Autoplay prevented:', playErr);
                }
            }
            setIsCapturing(true);
            speak('Webcam started. Ready for attendance.');
        } catch (err) {
            console.error('Webcam error:', err);
            let errorMsg = 'Error accessing webcam: ' + err.message;
            
            // Provide helpful error messages
            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                errorMsg = 'Camera permission denied. Please allow camera access in your browser settings.';
            } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
                errorMsg = 'No camera found. Please connect a camera device.';
            } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
                errorMsg = 'Camera is being used by another application. Please close other apps using the camera.';
            } else if (err.name === 'OverconstrainedError' || err.name === 'ConstraintNotSatisfiedError') {
                errorMsg = 'Camera does not support the required settings. Trying with default settings...';
                // Retry with simpler constraints
                try {
                    const fallbackStream = await navigator.mediaDevices.getUserMedia({
                        video: true
                    });
                    setStream(fallbackStream);
                    if (videoRef.current) {
                        videoRef.current.srcObject = fallbackStream;
                    }
                    setIsCapturing(true);
                    speak('Webcam started with default settings.');
                    return;
                } catch (fallbackErr) {
                    errorMsg = 'Unable to access camera. Please check your browser permissions and ensure you are using HTTPS.';
                }
            } else if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
                errorMsg = 'Camera requires HTTPS. Please access this site via HTTPS.';
            }
            
            setStatusMessage(errorMsg);
            speak('Error accessing webcam');
        }
    };

    // Stop webcam
    const stopWebcam = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
            setIsCapturing(false);
            setAutoCapture(false);
            speak('Webcam stopped');
        }
    };

    // Text-to-speech function
    const speak = (text) => {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 1;
            utterance.pitch = 1;
            utterance.volume = 1;
            window.speechSynthesis.speak(utterance);
        }
    };

    // Play sound effect
    const playSound = (type) => {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        const audioContext = new AudioCtx();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        if (type === 'success') {
            oscillator.frequency.value = 800;
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
        } else if (type === 'error') {
            oscillator.frequency.value = 200;
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        }
    };

    // Capture image first
    const captureImage = async () => {
        if (!videoRef.current || analyzing) return;

        const video = videoRef.current;
        
        // Check if video is ready
        if (!video || !video.videoWidth || !video.videoHeight) {
            setStatusMessage('⚠ Camera not ready. Please wait a moment.');
            playSound('error');
            return;
        }
        
        if (video.readyState < video.HAVE_CURRENT_DATA) {
            setStatusMessage('⚠ Camera is still initializing. Please wait a moment.');
            playSound('error');
            return;
        }

        setAnalyzing(true);
        setStatusMessage('Capturing image...');
        try {
            // Capture frame from video
            const canvas = canvasRef.current;
            
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0);

            // Convert to blob
            const blob = await new Promise((resolve, reject) => {
                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            resolve(blob);
                        } else {
                            reject(new Error('Failed to create image blob'));
                        }
                    },
                    'image/jpeg',
                    0.95
                );
            });

            if (!blob || !(blob instanceof Blob)) {
                throw new Error('Invalid blob created from canvas');
            }

            // Store the captured image and automatically submit for face recognition
            setCapturedImage(blob);
            setShowCapturedImage(true);
            setAnalyzing(false);
            setLastProcessedTime(Date.now());
            
            // Automatically submit for face recognition (pass blob directly to avoid state timing issue)
            submitAttendance(blob);

        } catch (err) {
            playSound('error');
            setStatusMessage('Error capturing image: ' + err.message);
            setAnalyzing(false);
        }
    };

    // Submit attendance with captured image (face recognition will identify employee)
    const submitAttendance = async (imageBlob = null) => {
        // Use provided blob or fall back to state
        const imageToUse = imageBlob || capturedImage;
        
        if (!imageToUse) {
            setStatusMessage('⚠ Please capture an image first');
            playSound('error');
            return;
        }

        setAnalyzing(true);
        setStatusMessage('Recognizing face...');
        try {
            // Create form data (no name needed - face recognition will identify employee)
            const formData = new FormData();
            formData.append('image', imageToUse, 'capture.jpg');

            // Send to attendance API
            const response = await fetch('/api/attendance', {
                method: 'POST',
                body: formData,
            });
            const data = await response.json();

            if (response.ok) {
                const record = {
                    id: Date.now(),
                    timestamp: new Date().toLocaleString(),
                    name: data.employee.name,
                    department: data.employee.department || 'N/A'
                };
                
                setAttendanceLog(prev => [record, ...prev.slice(0, 9)]);
                setCapturedImage(null);
                setShowCapturedImage(false);
                setLastProcessedTime(Date.now());

                playSound('success');
                
                // Show face recognition info
                let successMsg = `✓ Attendance marked for ${data.employee.name}!`;
                if (data.face_match && data.face_match.recognized) {
                    successMsg += ` (${data.face_match.similarity}% match)`;
                }
                
                speak(`Attendance marked for ${data.employee.name}. Have a great day!`);
                setStatusMessage(successMsg);
                
                // Clear message after 5 seconds
                setTimeout(() => {
                    setStatusMessage('');
                }, 5000);
            } else {
                playSound('error');
                const errorMsg = data.error || 'Failed to record attendance';
                let displayMsg = data.message || errorMsg;
                
                // Enhance face recognition error messages
                if (data.error === 'Employee not recognized') {
                    if (data.similarity && data.similarity > 0) {
                        displayMsg = `Face not recognized (${data.similarity}% similarity). ${data.message || 'Please ensure your face is clearly visible and try again with better lighting.'}`;
                    } else {
                        displayMsg = data.message || 'Face not recognized. Please ensure your face is clearly visible, or contact HR if your photo needs to be updated.';
                    }
                } else if (data.error === 'No employees found') {
                    displayMsg = data.message || 'No employees with registered photos found. Please contact HR to register your photo.';
                }
                
                speak(displayMsg);
                setStatusMessage(`⚠ ${displayMsg}`);
                
                // For duplicate entry, show a shorter message
                if (data.error === 'Attendance already recorded') {
                    setStatusMessage(`✓ ${data.employee?.name || 'You'} already checked in today`);
                    setTimeout(() => {
                        setStatusMessage('');
                    }, 3000);
                } else {
                    // For other errors, show message briefly then clear
                    setTimeout(() => {
                        setStatusMessage('');
                    }, 4000);
                }
                
                // Always clear captured image after processing
                setShowCapturedImage(false);
                setCapturedImage(null);
                setLastProcessedTime(Date.now());
            }
        } catch (err) {
            playSound('error');
            speak('Error processing attendance');
            setStatusMessage('Error: ' + err.message);
        } finally {
            setAnalyzing(false);
        }
    };

    // Start automatic capture
    const startAutoCapture = () => {
        if (autoCaptureRef.current) {
            clearInterval(autoCaptureRef.current);
        }
        
        if (isCapturing && !isProcessing) {
            autoCaptureRef.current = setInterval(() => {
                // Only capture if not currently processing and enough time has passed
                const now = Date.now();
                if (!isProcessing && (now - lastProcessedTime) >= (captureInterval * 1000)) {
                    autoCaptureAndProcess();
                }
            }, captureInterval * 1000);
        }
    };

    // Stop automatic capture
    const stopAutoCapture = () => {
        if (autoCaptureRef.current) {
            clearInterval(autoCaptureRef.current);
            autoCaptureRef.current = null;
        }
    };

    // Automatic capture and process
    const autoCaptureAndProcess = async () => {
        if (!videoRef.current || isProcessing || !isCapturing) return;

        const video = videoRef.current;
        
        // Check if video is ready
        if (!video || !video.videoWidth || !video.videoHeight) return;
        
        if (video.readyState < video.HAVE_CURRENT_DATA) return;

        setIsProcessing(true);
        
        try {
            // Capture frame from video
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0);

            // Convert to blob
            const blob = await new Promise((resolve, reject) => {
                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            resolve(blob);
        } else {
                            reject(new Error('Failed to create image blob'));
                        }
                    },
                    'image/jpeg',
                    0.95
                );
            });

            if (!blob || !(blob instanceof Blob)) {
                throw new Error('Invalid blob created from canvas');
            }

            // Update state
            setCapturedImage(blob);
            setLastProcessedTime(Date.now());
            
            // Automatically process the image
            await submitAttendance(blob);
            
        } catch (err) {
            console.error('Auto-capture error:', err);
            // Don't show error message for every failed auto-capture, just log it
        } finally {
            setIsProcessing(false);
        }
    };

    // Effect to manage auto-capture
    useEffect(() => {
        if (autoCapture && isCapturing && !isProcessing) {
            startAutoCapture();
        } else {
            stopAutoCapture();
        }
        
        return () => {
            stopAutoCapture();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [autoCapture, isCapturing, captureInterval, isProcessing]);

    const themeClasses = 'min-h-screen bg-[#0f0f23] text-white relative overflow-hidden';

    return (
        <div className={themeClasses}>
            {/* Animated Background Elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                {/* Animated gradient orbs - Professional blue/slate tones */}
                <div className="absolute top-20 left-10 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute top-40 right-20 w-80 h-80 bg-slate-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
                <div className="absolute bottom-20 left-1/3 w-72 h-72 bg-slate-700/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
                <div className="absolute bottom-40 right-1/4 w-96 h-96 bg-blue-700/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }}></div>
                
                {/* Floating particles - Subtle gray/blue tones */}
                <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-slate-400/20 rounded-full animate-bounce" style={{ animationDuration: '3s', animationDelay: '0s' }}></div>
                <div className="absolute top-1/3 left-1/3 w-1.5 h-1.5 bg-blue-400/20 rounded-full animate-bounce" style={{ animationDuration: '4s', animationDelay: '1s' }}></div>
                <div className="absolute top-1/2 left-1/5 w-2 h-2 bg-slate-500/20 rounded-full animate-bounce" style={{ animationDuration: '3.5s', animationDelay: '0.5s' }}></div>
                <div className="absolute top-2/3 left-1/4 w-1.5 h-1.5 bg-blue-500/20 rounded-full animate-bounce" style={{ animationDuration: '4.5s', animationDelay: '1.5s' }}></div>
                <div className="absolute top-1/5 right-1/4 w-2 h-2 bg-slate-400/20 rounded-full animate-bounce" style={{ animationDuration: '3.2s', animationDelay: '0.8s' }}></div>
                <div className="absolute top-1/3 right-1/3 w-1.5 h-1.5 bg-blue-400/20 rounded-full animate-bounce" style={{ animationDuration: '4.2s', animationDelay: '1.2s' }}></div>
                <div className="absolute top-1/2 right-1/5 w-2 h-2 bg-slate-500/20 rounded-full animate-bounce" style={{ animationDuration: '3.8s', animationDelay: '0.3s' }}></div>
                <div className="absolute top-2/3 right-1/4 w-1.5 h-1.5 bg-blue-500/20 rounded-full animate-bounce" style={{ animationDuration: '4.8s', animationDelay: '1.8s' }}></div>
                
                {/* Grid pattern overlay - Professional gray grid */}
                <div className="absolute inset-0" style={{
                    backgroundImage: `
                        linear-gradient(rgba(100,116,139,0.05) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(100,116,139,0.05) 1px, transparent 1px)
                    `,
                    backgroundSize: '50px 50px'
                }}></div>
                
                {/* Radial gradient overlay - Subtle blue */}
                <div className="absolute inset-0" style={{
                    background: 'radial-gradient(circle at center, rgba(37,99,235,0.08) 0%, transparent 70%)'
                }}></div>
                
                {/* Animated lines - Professional blue/gray */}
                <div className="absolute top-0 left-0 w-full h-full">
                    <div className="absolute top-1/4 left-0 w-px h-64 bg-gradient-to-b from-transparent via-blue-600/15 to-transparent animate-pulse"></div>
                    <div className="absolute top-1/2 right-0 w-px h-64 bg-gradient-to-b from-transparent via-slate-600/15 to-transparent animate-pulse" style={{ animationDelay: '1s' }}></div>
                    <div className="absolute bottom-1/4 left-1/4 w-64 h-px bg-gradient-to-r from-transparent via-blue-500/15 to-transparent animate-pulse" style={{ animationDelay: '2s' }}></div>
                </div>
            </div>
            
            {/* Content with relative positioning */}
            <div className="relative z-10">
            {/* Header */}
            <div className="bg-[#1a1a2e]/80 backdrop-blur-sm border-b border-[#1e293b]">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-3">
                            <div className="flex items-center justify-center">
                                <img src="/logo.png" alt="MoodLens Logo" className="w-16 h-16 md:w-24 md:h-24 object-contain" />
                            </div>
                            <div className="hidden md:block">
                                <h1 className="text-3xl md:text-4xl">MoodLens Kiosk</h1>
                                <p className="text-sm text-slate-400">
                                    AI-Powered Check-In System
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Link href="/hr/login" className="px-3 py-2 rounded-lg text-white transition-colors bg-[#16213e] hover:bg-[#1e293b] border border-[#1e293b]">
                                🔐 HR Login
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Side - Dashboard (Full Height) */}
                    <div className="lg:col-span-1">
                        <EmployeeDashboard />
                    </div>

                    {/* Right Side - Camera, Recent Check-ins & Instructions */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Main Camera View */}
                        <div className="rounded-2xl p-6 bg-[#16213e] border border-[#1e293b] shadow-xl">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold text-white orbitron">Attendance Kiosk</h2>
                                <div className="flex items-center space-x-2">
                                    {isCapturing && (
                                        <span className="flex items-center">
                                            <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse mr-2"></span>
                                            <span className="text-sm">Live</span>
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Video Container */}
                            <div className="relative aspect-video bg-slate-900 rounded-xl overflow-hidden mb-4">
                                {!isCapturing ? (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <div className="text-6xl mb-4">📷</div>
                                        <p className="text-lg mb-6 text-slate-400">
                                            {statusMessage.includes('Error') ? 'Camera failed to start' : 'Starting camera...'}
                                        </p>
                                        {statusMessage.includes('Error') && (
                                        <button
                                            onClick={startWebcam}
                                                className="px-6 py-3 bg-gradient-to-r from-[#2563eb] to-[#1e40af] hover:from-[#1d4ed8] hover:to-[#1e3a8a] text-white rounded-lg font-semibold transition-all shadow-lg shadow-blue-500/20"
                                        >
                                                Retry Start Webcam
                                        </button>
                                        )}
                                    </div>
                                ) : (
                                    <>
                                        <video
                                            ref={videoRef}
                                            autoPlay
                                            playsInline
                                            muted
                                            className="w-full h-full object-cover"
                                            style={{ backgroundColor: '#000' }}
                                        />
                                        {isProcessing && (
                                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                                <div className="text-center">
                                                    <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                                                    <p className="text-white font-semibold">
                                                        {analyzing ? 'Recognizing face...' : 'Processing...'}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>

                            <canvas ref={canvasRef} className="hidden" />

                            {/* Status Message */}
                            {statusMessage && (
                                <div className={`mb-4 p-4 rounded-lg ${
                                    statusMessage.includes('✓') 
                                        ? 'bg-green-500/20 border border-green-500 text-green-300'
                                        : 'bg-orange-500/20 border border-orange-500 text-orange-300'
                                }`}>
                                    <p className="font-semibold text-center">{statusMessage}</p>
                                </div>
                            )}

                            {/* Controls */}
                            <div className="space-y-4">
                                {isCapturing && (
                                    <>
                                        <div className="flex flex-wrap gap-3">
                                            <button
                                                onClick={stopWebcam}
                                                className="px-6 py-3 rounded-lg font-semibold transition-all bg-[#16213e] hover:bg-[#1e293b] border border-[#1e293b] text-white"
                                            >
                                                Stop Camera
                                            </button>
                                        </div>

                                        {/* Auto-capture Status */}
                                        <div className="p-4 rounded-lg bg-[#1e293b]">
                                            <div className="flex items-center justify-between mb-3">
                                                <div>
                                                    <label className="font-semibold block">Automatic Recognition</label>
                                                    <p className="text-xs text-slate-400 mt-1">Capturing and processing every {captureInterval} seconds</p>
                                                </div>
                                                <div className="flex items-center">
                                                    <span className={`w-3 h-3 rounded-full mr-2 ${isProcessing ? 'bg-blue-600 animate-pulse' : 'bg-green-500'}`}></span>
                                                    <span className="text-sm">{isProcessing ? 'Processing...' : 'Active'}</span>
                                                </div>
                                            </div>
                                                <div>
                                                <label className="text-sm mb-2 block">Capture Interval: {captureInterval}s</label>
                                                    <input
                                                        type="range"
                                                    min="2"
                                                    max="10"
                                                        value={captureInterval}
                                                        onChange={(e) => setCaptureInterval(Number(e.target.value))}
                                                        className="w-full"
                                                    />
                                                </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Recent Check-ins & Instructions - Horizontal Layout */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Attendance Log */}
                            <div className="rounded-2xl p-6 bg-[#16213e] border border-[#1e293b] shadow-xl">
                                <h3 className="text-lg font-bold mb-4 text-white orbitron">Recent Check-Ins</h3>
                                {attendanceLog.length === 0 ? (
                                    <p className="text-center py-8 text-slate-400">
                                        No check-ins yet
                                    </p>
                                ) : (
                                    <div className="flex flex-wrap gap-3">
                                        {attendanceLog.map((log) => (
                                            <div
                                                key={log.id}
                                                className="p-3 rounded-lg bg-[#1e293b] border border-[#334155] min-w-[150px] flex-shrink-0"
                                            >
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-semibold text-white mb-1 orbitron">
                                                        {log.name || 'Unknown'}
                                                    </span>
                                                    <p className="text-slate-400 text-xs">
                                                        {log.timestamp}
                                                    </p>
                                                    {log.department && (
                                                        <p className="text-slate-500 text-xs mt-1">
                                                            {log.department}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Instructions */}
                            <div className="rounded-2xl p-6 bg-[#16213e] border border-[#1e293b] shadow-xl">
                                <h3 className="text-lg font-bold mb-4 text-white orbitron">Instructions</h3>
                                <ul className="space-y-2 text-sm text-slate-300">
                                    <li className="flex items-start">
                                        <span className="mr-2">1.</span>
                                        <span>Position your face clearly in the frame</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="mr-2">2.</span>
                                        <span>The system automatically captures and recognizes your face every {captureInterval} seconds</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="mr-2">3.</span>
                                        <span>No button clicks needed - just stand in front of the camera!</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="mr-2">4.</span>
                                        <span>Attendance is automatically recorded when your face is recognized</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="mr-2">5.</span>
                                        <span>Look for the green status message when attendance is marked</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            </div>
        </div>
    );
}


