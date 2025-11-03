import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

export default function AttendanceKiosk() {
    const [darkMode, setDarkMode] = useState(false);
    const [isCapturing, setIsCapturing] = useState(false);
    const [stream, setStream] = useState(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');
    const [attendanceLog, setAttendanceLog] = useState([]);
    const [autoCapture, setAutoCapture] = useState(false);
    const [captureInterval, setCaptureInterval] = useState(5);
    const [employeeName, setEmployeeName] = useState('');
    const [capturedImage, setCapturedImage] = useState(null);
    const [showNameInput, setShowNameInput] = useState(false);

    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const intervalRef = useRef(null);

    // Initialize dark mode
    useEffect(() => {
        const prefersDark = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        setDarkMode(prefersDark);
    }, []);

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
                    // Wait for video to be ready
                    await new Promise((resolve) => {
                        const video = videoRef.current;
                        if (video.readyState >= video.HAVE_CURRENT_DATA) {
                            resolve();
                        } else {
                            video.onloadeddata = resolve;
                        }
                    });
                }
                setIsCapturing(true);
                speak('Webcam started. Ready for attendance.');
            } catch (err) {
                setStatusMessage('Error accessing webcam: ' + err.message);
                speak('Error accessing webcam');
            }
        };
        
        initializeWebcam();
        
        // Cleanup on unmount
        return () => {
            if (mediaStream) {
                mediaStream.getTracks().forEach(track => track.stop());
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
                // Wait for video to be ready
                await new Promise((resolve) => {
                    const video = videoRef.current;
                    if (video.readyState >= video.HAVE_CURRENT_DATA) {
                        resolve();
                    } else {
                        video.onloadeddata = resolve;
                    }
                });
            }
            setIsCapturing(true);
            speak('Webcam started. Ready for attendance.');
        } catch (err) {
            setStatusMessage('Error accessing webcam: ' + err.message);
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

            // Store the captured image
            setCapturedImage(blob);
            setShowNameInput(true);
            setEmployeeName(''); // Clear previous name
            setAnalyzing(false);
            setStatusMessage('✓ Image captured! Please enter your name.');
            playSound('success');
            speak('Image captured. Please enter your name.');

        } catch (err) {
            playSound('error');
            setStatusMessage('Error capturing image: ' + err.message);
            setAnalyzing(false);
        }
    };

    // Submit attendance with captured image and name
    const submitAttendance = async () => {
        if (!capturedImage || !employeeName.trim()) {
            setStatusMessage('⚠ Please enter your name');
            playSound('error');
            return;
        }

        setAnalyzing(true);
        setStatusMessage('Analyzing and recording attendance...');
        try {
            // Create form data
            const formData = new FormData();
            formData.append('image', capturedImage, 'capture.jpg');
            formData.append('name', employeeName.trim());

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
                setEmployeeName('');
                setCapturedImage(null);
                setShowNameInput(false);

                playSound('success');
                speak(`Attendance marked for ${data.employee.name}. Have a great day!`);
                setStatusMessage(`✓ Attendance marked successfully for ${data.employee.name}!`);
            } else {
                playSound('error');
                const errorMsg = data.error || 'Failed to record attendance';
                const displayMsg = data.message || errorMsg;
                speak(displayMsg);
                setStatusMessage(`⚠ ${displayMsg}`);
                
                // If duplicate entry, clear the form so they can try again
                if (data.error === 'Attendance already recorded') {
                    setTimeout(() => {
                        setShowNameInput(false);
                        setCapturedImage(null);
                        setEmployeeName('');
                    }, 3000);
                }
            }
        } catch (err) {
            playSound('error');
            speak('Error processing attendance');
            setStatusMessage('Error: ' + err.message);
        } finally {
            setAnalyzing(false);
            setTimeout(() => {
                setStatusMessage('');
                if (showNameInput) {
                    setShowNameInput(false);
                    setCapturedImage(null);
                }
            }, 5000);
        }
    };

    // Auto-capture effect
    useEffect(() => {
        if (autoCapture && isCapturing) {
            intervalRef.current = setInterval(() => {
                captureAndAnalyze();
            }, captureInterval * 1000);
        } else {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        }
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [autoCapture, isCapturing, captureInterval]);

    const themeClasses = 'min-h-screen bg-[#0f0f23] text-white';

    return (
        <div className={themeClasses}>
            {/* Header */}
            <div className="bg-[#1a1a2e]/80 backdrop-blur-sm border-b border-[#1e293b]">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-[#9333ea] to-[#ec4899] shadow-lg shadow-purple-500/20">
                                <span className="text-2xl">👤</span>
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold">Smart Attendance Kiosk</h1>
                                <p className="text-sm text-slate-400">
                                    AI-Powered Check-In System
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Link href="/hr/login" className="px-3 py-2 rounded-lg text-white transition-colors bg-[#16213e] hover:bg-[#1e293b] border border-[#1e293b]">
                                🔐 HR Login
                            </Link>
                            <button
                                onClick={() => setDarkMode(!darkMode)}
                                className="px-4 py-2 rounded-lg bg-[#16213e] hover:bg-[#1e293b] border border-[#1e293b] transition-colors"
                            >
                                🌙
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Camera View */}
                    <div className="lg:col-span-2">
                        <div className="rounded-2xl p-6 bg-[#16213e] border border-[#1e293b] shadow-xl">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold text-white">Camera View</h2>
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
                                                className="px-6 py-3 bg-gradient-to-r from-[#9333ea] to-[#ec4899] hover:from-[#7e22ce] hover:to-[#db2777] text-white rounded-lg font-semibold transition-all shadow-lg shadow-purple-500/20"
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
                                            className="w-full h-full object-cover"
                                        />
                                        {analyzing && (
                                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                                <div className="text-center">
                                                    <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                                                    <p className="text-white font-semibold">
                                                        {showNameInput ? 'Processing...' : 'Capturing...'}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>

                            <canvas ref={canvasRef} className="hidden" />

                            {/* Captured Image Preview & Name Input */}
                            {showNameInput && capturedImage && (
                                <div className="mb-4 p-4 rounded-lg bg-[#1e293b] border border-[#334155]">
                                    <div className="mb-4">
                                        <label className="block text-sm font-semibold mb-2 text-white">
                                            Captured Image
                                        </label>
                                        <img 
                                            src={URL.createObjectURL(capturedImage)} 
                                            alt="Captured" 
                                            className="w-full max-h-48 object-contain rounded-lg border border-slate-300"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold mb-2 text-white">
                                            Enter Your Name
                                        </label>
                                        <input
                                            type="text"
                                            value={employeeName}
                                            onChange={(e) => setEmployeeName(e.target.value)}
                                            placeholder="Type your full name"
                                            className="w-full px-4 py-2 rounded-lg border bg-[#0f0f23] border-[#1e293b] text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                            disabled={analyzing}
                                            autoFocus
                                        />
                                        <p className="text-xs mt-2 text-slate-400">
                                            Enter your name exactly as it appears in the employee records
                                        </p>
                                        <div className="flex gap-2 mt-3">
                                            <button
                                                onClick={submitAttendance}
                                                disabled={analyzing || !employeeName.trim()}
                                                className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-lg font-semibold transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                ✓ Submit Attendance
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setShowNameInput(false);
                                                    setCapturedImage(null);
                                                    setEmployeeName('');
                                                    setStatusMessage('');
                                                }}
                                                disabled={analyzing}
                                                className="px-4 py-2 bg-[#1e293b] hover:bg-[#334155] border border-[#334155] text-white rounded-lg font-semibold transition-all disabled:opacity-50"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

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
                                {isCapturing && !showNameInput && (
                                    <>
                                        <div className="flex flex-wrap gap-3">
                                            <button
                                                onClick={captureImage}
                                                disabled={analyzing}
                                                className="flex-1 px-6 py-3 bg-gradient-to-r from-[#9333ea] to-[#ec4899] hover:from-[#7e22ce] hover:to-[#db2777] text-white rounded-lg font-semibold transition-all shadow-lg shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                📸 Capture & Mark Attendance
                                            </button>
                                            <button
                                                onClick={stopWebcam}
                                                className="px-6 py-3 rounded-lg font-semibold transition-all bg-[#16213e] hover:bg-[#1e293b] border border-[#1e293b] text-white"
                                            >
                                                Stop Camera
                                            </button>
                                        </div>

                                        {/* Auto-capture Settings */}
                                        <div className="p-4 rounded-lg bg-[#1e293b]">
                                            <div className="flex items-center justify-between mb-3">
                                                <label className="font-semibold">Auto-Capture Mode</label>
                                                <button
                                                    onClick={() => setAutoCapture(!autoCapture)}
                                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${autoCapture ? 'bg-green-500' : 'bg-[#1e293b]'}`}
                                                >
                                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${autoCapture ? 'translate-x-6' : 'translate-x-1'}`} />
                                                </button>
                                            </div>
                                            {autoCapture && (
                                                <div>
                                                    <label className="text-sm mb-2 block">Interval: {captureInterval}s</label>
                                                    <input
                                                        type="range"
                                                        min="3"
                                                        max="30"
                                                        value={captureInterval}
                                                        onChange={(e) => setCaptureInterval(Number(e.target.value))}
                                                        className="w-full"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar - Instructions & Log */}
                    <div className="space-y-6">
                        {/* Instructions */}
                        <div className="rounded-2xl p-6 bg-[#16213e] border border-[#1e293b] shadow-xl">
                            <h3 className="text-lg font-bold mb-4 text-white">Instructions</h3>
                            <ul className="space-y-2 text-sm text-slate-300">
                                <li className="flex items-start">
                                    <span className="mr-2">1.</span>
                                    <span>Position your face clearly in the frame (camera starts automatically)</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="mr-2">2.</span>
                                    <span>Click "Capture & Mark Attendance"</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="mr-2">3.</span>
                                    <span>Enter your name exactly as it appears in employee records</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="mr-2">4.</span>
                                    <span>Click "Submit Attendance" and wait for confirmation</span>
                                </li>
                            </ul>
                        </div>

                        {/* Attendance Log */}
                        <div className="rounded-2xl p-6 bg-[#16213e] border border-[#1e293b] shadow-xl">
                            <h3 className="text-lg font-bold mb-4 text-white">Recent Check-Ins</h3>
                            {attendanceLog.length === 0 ? (
                                <p className="text-center py-8 text-slate-400">
                                    No check-ins yet
                                </p>
                            ) : (
                                <div className="space-y-3 max-h-96 overflow-y-auto">
                                    {attendanceLog.map((log) => (
                                        <div
                                            key={log.id}
                                            className="p-3 rounded-lg bg-[#1e293b] border border-[#334155]"
                                        >
                                            <div className="flex justify-between items-start mb-1">
                                                <span className="text-sm font-semibold">
                                                    {log.name || 'Unknown'}
                                                </span>
                                            </div>
                                            <p className="text-slate-400 text-xs">
                                                {log.timestamp}
                                            </p>
                                            {log.department && (
                                                <p className="text-slate-500 text-xs">
                                                    {log.department}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}


