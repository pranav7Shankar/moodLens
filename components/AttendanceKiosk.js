import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import EmployeeDashboard from './EmployeeDashboard';

export default function AttendanceKiosk() {
    const [isCapturing, setIsCapturing] = useState(false);
    const [stream, setStream] = useState(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');
    const [attendanceLog, setAttendanceLog] = useState([]);
    const [autoCapture, setAutoCapture] = useState(true);
    const [captureInterval, setCaptureInterval] = useState(3);
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
                console.log('🎥 Initializing camera...');
                console.log('Protocol:', window.location.protocol);
                console.log('Hostname:', window.location.hostname);
                
                // Check if getUserMedia is available
                if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                    throw new Error('Camera API not supported in this browser. Please use Chrome, Firefox, or Safari.');
                }

                console.log('✅ getUserMedia available');

                // List available devices for debugging
                try {
                    const devices = await navigator.mediaDevices.enumerateDevices();
                    const videoDevices = devices.filter(device => device.kind === 'videoinput');
                    console.log('📹 Video devices found:', videoDevices.length);
                    videoDevices.forEach((device, i) => {
                        console.log(`  ${i + 1}. ${device.label || 'Camera ' + (i + 1)} (${device.deviceId})`);
                    });
                } catch (enumError) {
                    console.warn('Could not enumerate devices:', enumError);
                }

                // Start with the most basic constraint
                console.log('🎬 Requesting camera access with basic constraints...');
                
                let constraints = { 
                    video: true,
                    audio: false 
                };
                
                try {
                    mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
                    console.log('✅ Camera access granted!');
                } catch (basicError) {
                    console.error('❌ Basic constraints failed:', basicError);
                    throw basicError;
                }
                
                if (!videoRef.current) {
                    console.error('❌ Video ref not available');
                    throw new Error('Video element not found');
                }
                
                console.log('📺 Setting up video element...');
                const video = videoRef.current;
                
                setStream(mediaStream);
                    
                video.srcObject = mediaStream;
                video.muted = true;
                video.playsInline = true;
                video.autoplay = true;
                video.setAttribute('playsinline', 'true');
                video.setAttribute('autoplay', 'true');
                video.setAttribute('muted', 'true');
                
                console.log('Video element properties:', {
                    srcObject: !!video.srcObject,
                    muted: video.muted,
                    playsInline: video.playsInline,
                    autoplay: video.autoplay
                });
                
                console.log('⏳ Waiting for video to be ready...');
                
                // More robust ready detection
                await new Promise((resolve, reject) => {
                    const timeout = setTimeout(() => {
                        console.warn('⚠️ Video load timeout (5s) - proceeding anyway');
                        resolve();
                    }, 5000);
                    
                    const onReady = () => {
                        console.log('✅ Video ready!', {
                            readyState: video.readyState,
                            videoWidth: video.videoWidth,
                            videoHeight: video.videoHeight,
                            paused: video.paused
                        });
                        clearTimeout(timeout);
                        resolve();
                    };
                    
                    const onError = (e) => {
                        console.error('❌ Video error:', e);
                        clearTimeout(timeout);
                        reject(e);
                    };
                    
                    video.addEventListener('error', onError, { once: true });
                    
                    if (video.readyState >= 2) { // HAVE_CURRENT_DATA
                        onReady();
                    } else {
                        video.addEventListener('loadeddata', onReady, { once: true });
                        video.addEventListener('loadedmetadata', onReady, { once: true });
                    }
                });
                
                // Force play
                try {
                    console.log('▶️ Attempting to play video...');
                    const playPromise = video.play();
                    await playPromise;
                    console.log('✅ Video playing successfully!', {
                        paused: video.paused,
                        currentTime: video.currentTime,
                        readyState: video.readyState
                    });
                } catch (playErr) {
                    console.error('❌ Autoplay failed:', playErr.name, playErr.message);
                    
                    // Try multiple recovery strategies
                    console.log('🔄 Attempting recovery strategies...');
                    
                    // Strategy 1: Wait and retry
                    await new Promise(resolve => setTimeout(resolve, 500));
                    try {
                        await video.play();
                        console.log('✅ Video playing after retry!');
                    } catch (retry1Err) {
                        console.warn('Retry 1 failed:', retry1Err);
                        
                        // Strategy 2: Reset srcObject and try again
                        console.log('🔄 Trying srcObject reset...');
                        video.srcObject = null;
                        await new Promise(resolve => setTimeout(resolve, 100));
                        video.srcObject = mediaStream;
                        
                        await new Promise(resolve => setTimeout(resolve, 500));
                        try {
                            await video.play();
                            console.log('✅ Video playing after srcObject reset!');
                        } catch (retry2Err) {
                            console.error('All retry strategies failed:', retry2Err);
                            // Don't throw - camera is working, just might not autoplay
                            console.log('⚠️ Proceeding without autoplay - user interaction may be needed');
                        }
                    }
                }
                
                // Final check
                console.log('📊 Final video state:', {
                    isCapturing: true,
                    videoRef: !!videoRef.current,
                    srcObject: !!video.srcObject,
                    paused: video.paused,
                    muted: video.muted,
                    readyState: video.readyState,
                    videoWidth: video.videoWidth,
                    videoHeight: video.videoHeight
                });
                
                setIsCapturing(true);
                setStatusMessage('');
                speak('Webcam started. Automatic face recognition is active.');
                console.log('✅ Camera initialization complete!');
                
            } catch (err) {
                console.error('❌ Webcam error:', err.name, err.message);
                let errorMsg = 'Error accessing webcam: ' + err.message;
                
                if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                    errorMsg = '⚠️ Camera permission denied. Please click "Allow" when prompted, or check your browser settings.';
                } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
                    errorMsg = '⚠️ No camera found. Please connect a camera device and refresh the page.';
                } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
                    errorMsg = '⚠️ Camera is being used by another application. Please close other apps using the camera and refresh.';
                } else if (err.name === 'OverconstrainedError' || err.name === 'ConstraintNotSatisfiedError') {
                    errorMsg = '⚠️ Camera does not support the required settings.';
                } else if (err.name === 'TypeError') {
                    errorMsg = '⚠️ Camera initialization error. Please refresh the page and try again.';
                } else if (window.location.protocol !== 'https:' && 
                          window.location.hostname !== 'localhost' && 
                          window.location.hostname !== '127.0.0.1') {
                    errorMsg = '⚠️ Camera requires HTTPS. Please access this site via HTTPS.';
                }
                
                setStatusMessage(errorMsg);
                speak('Error accessing webcam');
            }
        };
        
        // Small delay to ensure DOM is ready
        const timer = setTimeout(() => {
            initializeWebcam();
        }, 100);
        
        // Cleanup on unmount
        return () => {
            clearTimeout(timer);
            if (mediaStream) {
                console.log('🛑 Stopping camera...');
                mediaStream.getTracks().forEach(track => {
                    track.stop();
                    console.log('Stopped track:', track.kind, track.label);
                });
            }
            if (autoCaptureRef.current) {
                clearInterval(autoCaptureRef.current);
            }
        };
    }, []);

    const startWebcam = async () => {
        try {
            console.log('🔄 Manual camera start...');
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: false
            });
            
            setStream(mediaStream);
            
            if (videoRef.current) {
                const video = videoRef.current;
                video.srcObject = mediaStream;
                video.muted = true;
                video.playsInline = true;
                video.autoplay = true;
                
                await new Promise((resolve) => {
                    if (video.readyState >= 2) {
                        resolve();
                    } else {
                        video.addEventListener('loadeddata', resolve, { once: true });
                        setTimeout(resolve, 3000);
                    }
                });
                
                try {
                    await video.play();
                } catch (playErr) {
                    console.warn('Autoplay prevented:', playErr);
                }
            }
            
            setIsCapturing(true);
            setStatusMessage('');
            speak('Webcam started. Ready for attendance.');
        } catch (err) {
            console.error('Manual webcam start error:', err);
            let errorMsg = 'Error accessing webcam: ' + err.message;
            
            if (err.name === 'NotAllowedError') {
                errorMsg = '⚠️ Camera permission denied. Please allow camera access.';
            } else if (err.name === 'NotFoundError') {
                errorMsg = '⚠️ No camera found. Please connect a camera device.';
            }
            
            setStatusMessage(errorMsg);
            speak('Error accessing webcam');
        }
    };

    const stopWebcam = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
            setIsCapturing(false);
            setAutoCapture(false);
            speak('Webcam stopped');
        }
    };

    const speak = (text) => {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 1;
            utterance.pitch = 1;
            utterance.volume = 1;
            window.speechSynthesis.speak(utterance);
        }
    };

    const playSound = (type) => {
        try {
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
        } catch (err) {
            console.warn('Sound playback error:', err);
        }
    };

    const captureImage = async () => {
        if (!videoRef.current || analyzing) return;

        const video = videoRef.current;
        
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
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0);

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

            setCapturedImage(blob);
            setShowCapturedImage(true);
            setAnalyzing(false);
            setLastProcessedTime(Date.now());
            
            submitAttendance(blob);

        } catch (err) {
            playSound('error');
            setStatusMessage('Error capturing image: ' + err.message);
            setAnalyzing(false);
        }
    };

    const submitAttendance = async (imageBlob = null) => {
        const imageToUse = imageBlob || capturedImage;
        
        if (!imageToUse) {
            setStatusMessage('⚠ Please capture an image first');
            playSound('error');
            return;
        }

        setAnalyzing(true);
        setStatusMessage('Recognizing face...');
        try {
            const formData = new FormData();
            formData.append('image', imageToUse, 'capture.jpg');

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
                
                let successMsg = `✓ Attendance marked for ${data.employee.name}!`;
                if (data.face_match && data.face_match.recognized) {
                    successMsg += ` (${data.face_match.similarity}% match)`;
                }
                
                speak(`Attendance marked for ${data.employee.name}. Have a great day!`);
                setStatusMessage(successMsg);
                
                setTimeout(() => {
                    setStatusMessage('');
                }, 5000);
            } else {
                playSound('error');
                const errorMsg = data.error || 'Failed to record attendance';
                let displayMsg = data.message || errorMsg;
                
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
                
                if (data.error === 'Attendance already recorded') {
                    setStatusMessage(`✓ ${data.employee?.name || 'You'} already checked in today`);
                    setTimeout(() => {
                        setStatusMessage('');
                    }, 3000);
                } else {
                    setTimeout(() => {
                        setStatusMessage('');
                    }, 4000);
                }
                
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

    const startAutoCapture = () => {
        if (autoCaptureRef.current) {
            clearInterval(autoCaptureRef.current);
        }
        
        if (isCapturing && !isProcessing) {
            autoCaptureRef.current = setInterval(() => {
                const now = Date.now();
                if (!isProcessing && (now - lastProcessedTime) >= (captureInterval * 1000)) {
                    autoCaptureAndProcess();
                }
            }, captureInterval * 1000);
        }
    };

    const stopAutoCapture = () => {
        if (autoCaptureRef.current) {
            clearInterval(autoCaptureRef.current);
            autoCaptureRef.current = null;
        }
    };

    const autoCaptureAndProcess = async () => {
        if (!videoRef.current || isProcessing || !isCapturing) return;

        const video = videoRef.current;
        
        if (!video || !video.videoWidth || !video.videoHeight) return;
        if (video.readyState < video.HAVE_CURRENT_DATA) return;

        setIsProcessing(true);
        
        try {
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0);

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

            setCapturedImage(blob);
            setLastProcessedTime(Date.now());
            
            await submitAttendance(blob);
            
        } catch (err) {
            console.error('Auto-capture error:', err);
        } finally {
            setIsProcessing(false);
        }
    };

    useEffect(() => {
        if (autoCapture && isCapturing && !isProcessing) {
            startAutoCapture();
        } else {
            stopAutoCapture();
        }
        
        return () => {
            stopAutoCapture();
        };
    }, [autoCapture, isCapturing, captureInterval, isProcessing]);

    const themeClasses = 'min-h-screen bg-[#0f0f23] text-white relative overflow-hidden';

    return (
        <div className={themeClasses}>
            {/* Animated Background Elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-20 left-10 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute top-40 right-20 w-80 h-80 bg-slate-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
                <div className="absolute bottom-20 left-1/3 w-72 h-72 bg-slate-700/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
                <div className="absolute bottom-40 right-1/4 w-96 h-96 bg-blue-700/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }}></div>
                
                <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-slate-400/20 rounded-full animate-bounce" style={{ animationDuration: '3s', animationDelay: '0s' }}></div>
                <div className="absolute top-1/3 left-1/3 w-1.5 h-1.5 bg-blue-400/20 rounded-full animate-bounce" style={{ animationDuration: '4s', animationDelay: '1s' }}></div>
                <div className="absolute top-1/2 left-1/5 w-2 h-2 bg-slate-500/20 rounded-full animate-bounce" style={{ animationDuration: '3.5s', animationDelay: '0.5s' }}></div>
                <div className="absolute top-2/3 left-1/4 w-1.5 h-1.5 bg-blue-500/20 rounded-full animate-bounce" style={{ animationDuration: '4.5s', animationDelay: '1.5s' }}></div>
                <div className="absolute top-1/5 right-1/4 w-2 h-2 bg-slate-400/20 rounded-full animate-bounce" style={{ animationDuration: '3.2s', animationDelay: '0.8s' }}></div>
                <div className="absolute top-1/3 right-1/3 w-1.5 h-1.5 bg-blue-400/20 rounded-full animate-bounce" style={{ animationDuration: '4.2s', animationDelay: '1.2s' }}></div>
                <div className="absolute top-1/2 right-1/5 w-2 h-2 bg-slate-500/20 rounded-full animate-bounce" style={{ animationDuration: '3.8s', animationDelay: '0.3s' }}></div>
                <div className="absolute top-2/3 right-1/4 w-1.5 h-1.5 bg-blue-500/20 rounded-full animate-bounce" style={{ animationDuration: '4.8s', animationDelay: '1.8s' }}></div>
                
                <div className="absolute inset-0" style={{
                    backgroundImage: `
                        linear-gradient(rgba(100,116,139,0.05) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(100,116,139,0.05) 1px, transparent 1px)
                    `,
                    backgroundSize: '50px 50px'
                }}></div>
                
                <div className="absolute inset-0" style={{
                    background: 'radial-gradient(circle at center, rgba(37,99,235,0.08) 0%, transparent 70%)'
                }}></div>
                
                <div className="absolute top-0 left-0 w-full h-full">
                    <div className="absolute top-1/4 left-0 w-px h-64 bg-gradient-to-b from-transparent via-blue-600/15 to-transparent animate-pulse"></div>
                    <div className="absolute top-1/2 right-0 w-px h-64 bg-gradient-to-b from-transparent via-slate-600/15 to-transparent animate-pulse" style={{ animationDelay: '1s' }}></div>
                    <div className="absolute bottom-1/4 left-1/4 w-64 h-px bg-gradient-to-r from-transparent via-blue-500/15 to-transparent animate-pulse" style={{ animationDelay: '2s' }}></div>
                </div>
            </div>
            
            <div className="relative z-10">
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
                                🔒 HR Login
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-1">
                        <EmployeeDashboard />
                    </div>

                    <div className="lg:col-span-2 space-y-6">
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

                            <div className="relative aspect-video bg-slate-900 rounded-xl overflow-hidden mb-4">
                                {/* Always render video element - just hide it when not capturing */}
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    muted
                                    className={`w-full h-full object-cover ${!isCapturing ? 'hidden' : ''}`}
                                    style={{ backgroundColor: '#000' }}
                                />
                                
                                {!isCapturing && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <div className="text-6xl mb-4">📷</div>
                                        <p className="text-lg mb-6 text-slate-400">
                                            {statusMessage.includes('Error') || statusMessage.includes('⚠️') ? 'Camera failed to start' : 'Starting camera...'}
                                        </p>
                                        {(statusMessage.includes('Error') || statusMessage.includes('⚠️')) && (
                                        <button
                                            onClick={startWebcam}
                                            className="px-6 py-3 bg-gradient-to-r from-[#2563eb] to-[#1e40af] hover:from-[#1d4ed8] hover:to-[#1e3a8a] text-white rounded-lg font-semibold transition-all shadow-lg shadow-blue-500/20"
                                        >
                                            Retry Start Webcam
                                        </button>
                                        )}
                                    </div>
                                )}
                                
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
                            </div>

                            <canvas ref={canvasRef} className="hidden" />

                            {statusMessage && (
                                <div className={`mb-4 p-4 rounded-lg ${
                                    statusMessage.includes('✓') 
                                        ? 'bg-green-500/20 border border-green-500 text-green-300'
                                        : 'bg-orange-500/20 border border-orange-500 text-orange-300'
                                }`}>
                                    <p className="font-semibold text-center">{statusMessage}</p>
                                </div>
                            )}

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

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
