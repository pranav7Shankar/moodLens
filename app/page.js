'use client';

import { useState, useEffect } from 'react';
import { BarChart, Bar, ResponsiveContainer, PieChart, Pie, Cell, RadialBarChart, RadialBar } from 'recharts';
import Link from 'next/link';

export default function Home() {
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [darkMode, setDarkMode] = useState(false);
    const [showTips, setShowTips] = useState(false);
    const [stats, setStats] = useState({
        totalAnalyses: 2847,
        accuracyRate: 96.2,
        facesProcessed: 1453,
        processingTime: 127,
        activeModels: 8,
        successRate: 98.7
    });

    // Initialize dark mode from system preference
    useEffect(() => {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setDarkMode(prefersDark);
    }, []);

    // Apply theme attribute to document
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    }, [darkMode]);

    const toggleDarkMode = () => {
        setDarkMode(!darkMode);
    };
    

    const handleFileSelect = (event) => {
        const file = event.target.files[0];
        if (file) {
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
            setResults(null);
            setError(null);
        }
    };

    const handleAnalyze = async () => {
        if (!selectedFile) {
            setError('Please select an image first');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append('image', selectedFile);

            const response = await fetch('/api/analyze', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (response.ok) {
                setResults(data);
                setStats(prev => ({
                    ...prev,
                    totalAnalyses: prev.totalAnalyses + 1,
                    facesProcessed: prev.facesProcessed + (data.facesDetected || 0)
                }));
            } else {
                setError(data.error || 'Failed to analyze image');
            }
        } catch (err) {
            setError('Network error: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const resetAnalysis = () => {
        setSelectedFile(null);
        setPreviewUrl(null);
        setResults(null);
        setError(null);
        if (typeof document !== 'undefined') {
            const fileInput = document.getElementById('fileInput');
            if (fileInput) fileInput.value = '';
        }
    };

    const getCurrentDate = () => {
        return new Date().toLocaleDateString('en-US', {
            month: 'long',
            year: 'numeric'
        });
    };

    const themeClasses = 'min-h-screen bg-[#0f0f23] text-white';

    

    return (
        <div className={themeClasses}>
            {/* Banner Header */}
            <div className="relative overflow-hidden bg-gradient-to-r from-[#1a1a2e] via-[#16213e] to-[#1a1a2e] border-b border-[#1e293b]">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute inset-0" style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                    }} />
                </div>

                <div className="relative max-w-7xl mx-auto px-4 py-8">
                    <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                        {/* Logo Section */}
                        <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 glass-effect rounded-xl flex items-center justify-center">
                                <img
                                    src="/network-detection.svg"
                                    alt="Logo"
                                    className="h-8 w-8 object-contain"
                                />
                            </div>
                            <div>
                                <div className="flex items-center space-x-2">
                                    <span className="text-2xl font-light text-white/90">Mood</span>
                                    <span className="text-2xl font-bold text-white">LENS</span>
                                    <span className="text-xs text-white/70 align-top">™</span>
                                </div>
                                <p className="text-sm text-white/80">AI-Powered Recognition System</p>
                            </div>
                        </div>

                        {/* Center Title */}
                        <div className="text-center">
                            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                                Analysis at Your Fingertips
                            </h1>
                            <p className="text-white/90 text-sm">
                                {getCurrentDate()} • Advanced Detection Engine
                            </p>
                        </div>

                        {/* Dark Mode Toggle */}
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={toggleDarkMode}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 focus-ring ${
                                    darkMode ? 'bg-gradient-warm' : 'bg-white/30'
                                }`}
                                aria-label="Toggle dark mode"
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 shadow-lg ${
                                        darkMode ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                                />
                            </button>
                            <span className="text-sm font-medium text-white/90">
                                {darkMode ? '🌙' : '☀️'}
                            </span>
                            <Link href="/kiosk" className="px-4 py-2 bg-gradient-to-r from-[#9333ea] to-[#ec4899] hover:from-[#7e22ce] hover:to-[#db2777] text-white rounded-lg font-semibold transition-all shadow-lg text-sm shadow-purple-500/20">
                                📸 Attendance Kiosk
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    {/* Upload Section */}
                    <div className="dashboard-card">
                        <h2 className="section-title">
                            <span className="inline-flex items-center">
                                <span className="w-2 h-2 bg-gradient-warm rounded-full mr-3"></span>
                                Image Upload & Analysis
                            </span>
                        </h2>

                        <div className="text-center">
                            {!previewUrl ? (
                                <div className="space-y-6">
                                    <div className={`border-2 border-dashed rounded-2xl p-8 transition-all duration-300 interactive-hover ${
                                        darkMode
                                            ? 'border-slate-600 hover:border-orange-400 glass-effect-dark'
                                            : 'border-slate-400 hover:border-orange-400 glass-effect'
                                    }`}>
                                        <div className="space-y-4">
                                            <div className="text-6xl text-orange-400/70">
                                                📸
                                            </div>
                                            <div>
                                                <h3 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                                                    Upload Your Image
                                                </h3>
                                                <p className={`text-sm mb-4 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                                    Select a clear image with visible faces for analysis
                                                </p>
                                            </div>

                                            <input
                                                id="fileInput"
                                                type="file"
                                                accept="image/*"
                                                onChange={handleFileSelect}
                                                className="hidden"
                                            />
                                            <label
                                                htmlFor="fileInput"
                                                className="inline-flex items-center btn-primary cursor-pointer"
                                            >
                                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
                                                Choose Image
                                            </label>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-4 mt-6">
                                        <div className="feature-card">
                                            <div className="text-2xl mb-1">⚡</div>
                                            <div className={`${darkMode ? 'text-slate-300' : 'text-slate-600'} text-xs font-medium`}>
                                                Fast Analysis
                                            </div>
                                        </div>
                                        <div className="feature-card">
                                            <div className="text-2xl mb-1">🎯</div>
                                            <div className={`${darkMode ? 'text-slate-300' : 'text-slate-600'} text-xs font-medium`}>
                                                High Accuracy
                                            </div>
                                        </div>
                                        <div className="feature-card">
                                            <div className="text-2xl mb-1">🔒</div>
                                            <div className={`${darkMode ? 'text-slate-300' : 'text-slate-600'} text-xs font-medium`}>
                                                Privacy First
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="flex justify-center">
                                        <img
                                            src={previewUrl}
                                            alt="Preview"
                                            className={`max-w-full max-h-48 rounded-2xl border-2 object-cover shadow-lg transition-all duration-300 ${
                                                darkMode ? 'border-slate-600' : 'border-orange-200'
                                            }`}
                                        />
                                    </div>
                                    <div className="flex justify-center space-x-3">
                                        <button
                                            onClick={handleAnalyze}
                                            disabled={loading}
                                            className="btn-warm disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {loading ? 'Analyzing...' : 'Analyze'}
                                        </button>
                                        <button
                                            onClick={resetAnalysis}
                                            className="btn-secondary"
                                        >
                                            Clear
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Tips/About Toggle Card */}
                    <div className="dashboard-card bg-[#16213e] border border-[#1e293b] shadow-xl flex flex-col justify-between h-full">
                        <div>
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center space-x-1">
                                    <button
                                        onClick={() => setShowTips(false)}
                                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                                            !showTips
                                                ? 'bg-gradient-to-r from-[#9333ea] to-[#ec4899] text-white shadow-lg shadow-purple-500/20'
                                                : 'text-slate-400 hover:text-slate-200 hover:bg-[#1e293b]'
                                        }`}
                                    >
                                        About
                                    </button>
                                    <button
                                        onClick={() => setShowTips(true)}
                                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                                            showTips
                                                ? 'bg-gradient-to-r from-[#ec4899] to-[#d946ef] text-white shadow-lg shadow-pink-500/20'
                                                : 'text-slate-400 hover:text-slate-200 hover:bg-[#1e293b]'
                                        }`}
                                    >
                                        Tips
                                    </button>
                                </div>
                            </div>

                            {showTips ? (
                                <div>
                                    <h2 className="section-title">
                                        <span className="inline-flex items-center">
                                            Analysis Tips
                                        </span>
                                    </h2>
                                    <ul className={`space-y-4 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                                        {[
                                            { text: "Use clear, well-lit images for better detection accuracy.", color: "bg-blue-600" },
                                            { text: "Ensure the face is fully visible and facing the camera.", color: "bg-indigo-600" },
                                            { text: "Higher resolution images give more precise emotion and feature analysis.", color: "bg-orange-500" },
                                            { text: "Multiple faces in a single image may reduce accuracy per face.", color: "bg-amber-500" },
                                            { text: "Be patient — complex images might take a few extra seconds to analyze.", color: "bg-slate-600" }
                                        ].map((tip, index) => (
                                            <li key={index} className="flex items-center space-x-3">
                                                <span className={`w-2 h-2 ${tip.color} rounded-full`}></span>
                                                <span>{tip.text}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ) : (
                                <div>
                                    <h2 className="section-title">
                                        <span className="inline-flex items-center">
                                            About Facial Analysis
                                        </span>
                                    </h2>
                                    <p className={`mb-6 leading-relaxed ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                                        Advanced AI-powered facial recognition and emotion detection system providing accurate insights
                                        for research, security, and personal applications.
                                    </p>
                                    <div>
                                        <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>
                                            Features
                                        </h3>
                                        <ul className={`space-y-3 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                                            <li className="flex items-center space-x-3">
                                                <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                                                <span>Real-time Face Detection</span>
                                            </li>
                                            <li className="flex items-center space-x-3">
                                                <span className="w-2 h-2 bg-indigo-600 rounded-full"></span>
                                                <span>Emotion Recognition</span>
                                            </li>
                                            <li className="flex items-center space-x-3">
                                                <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                                                <span>Age & Gender Analysis</span>
                                            </li>
                                            <li className="flex items-center space-x-3">
                                                <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                                                <span>Privacy-First Approach</span>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="mt-8">
                            <p className="text-2xl font-bold text-gradient-warm text-center">
                                {showTips ? "Ready to analyze with confidence" : "Unlock the power of facial insights"}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className={`border rounded-xl p-4 mb-8 transition-all duration-300 ${
                        darkMode
                            ? 'bg-red-900/50 border-red-700 text-red-300'
                            : 'bg-red-50 border-red-200 text-red-700'
                    }`}>
                        <div className="flex items-center">
                            <svg className="h-5 w-5 mr-2 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            <p className="font-medium">{error}</p>
                        </div>
                    </div>
                )}

                {/* Results Section */}
                {results && (
                    <div className="dashboard-card">
                        <h2 className={`text-2xl font-bold text-center mb-6 ${darkMode ? 'text-white' : 'text-slate-600'}`}>
                            Analysis Results
                        </h2>

                        {results.facesDetected === 0 ? (
                            <div className="text-center py-12">
                                <div className="text-4xl mb-4">🤔</div>
                                <p className={`text-lg ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                    No faces detected in the image.
                                </p>
                            </div>
                        ) : (
                            <>
                                <div className="text-center mb-8">
                                    <div className="success-badge inline-block">
                                        Detected {results.facesDetected} face{results.facesDetected > 1 ? 's' : ''}
                                    </div>
                                </div>

                                <div className="space-y-8">
                                    {results.results.map((face, index) => (
                                        <div key={index} className={`rounded-2xl p-6 border transition-all duration-300 ${
                                            darkMode ? 'bg-slate-800/50 border-slate-600' : 'bg-gradient-to-br from-slate-50 to-orange-50/30 border-slate-200'
                                        }`}>
                                            <div className="flex items-center justify-between mb-6">
                                                <h3 className={`text-xl font-bold ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>
                                                    Face {face.faceId}
                                                </h3>
                                                <span className="confidence-badge">
                                                    {face.confidence}% confidence
                                                </span>
                                            </div>

                                            {/* Key Metrics with Charts */}
                                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
                                                {/* Age Range Card with Bar Chart */}
                                                <div className="metric-card">
                                                    <div className={`text-sm font-medium mb-2 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                                        Age Range
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <div className="text-lg font-bold text-blue-600">
                                                                {face.ageRange.Low} - {face.ageRange.High}
                                                            </div>
                                                            <div className="text-xs text-slate-500">years</div>
                                                        </div>
                                                        <div className="w-16 h-12">
                                                            <ResponsiveContainer width="100%" height="100%">
                                                                <BarChart data={[
                                                                    { name: 'Min', value: face.ageRange.Low },
                                                                    { name: 'Max', value: face.ageRange.High }
                                                                ]}>
                                                                    <Bar dataKey="value" fill="#52b788" />
                                                                </BarChart>
                                                            </ResponsiveContainer>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Gender Card with Pie Chart */}
                                                <div className="metric-card">
                                                    <div className={`text-sm font-medium mb-2 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                                        Gender
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <div className="text-lg font-bold text-orange-500">
                                                                {face.gender.value}
                                                            </div>
                                                            <div className={`text-xs ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                                                                {face.gender.confidence}% confidence
                                                            </div>
                                                        </div>
                                                        <div className="w-12 h-12">
                                                            <ResponsiveContainer width="100%" height="100%">
                                                                <PieChart>
                                                                    <Pie
                                                                        data={[
                                                                            { name: face.gender.value, value: face.gender.confidence },
                                                                            { name: 'Uncertainty', value: 100 - face.gender.confidence }
                                                                        ]}
                                                                        dataKey="value"
                                                                        cx="50%"
                                                                        cy="50%"
                                                                        innerRadius={8}
                                                                        outerRadius={20}
                                                                        startAngle={90}
                                                                        endAngle={450}
                                                                    >
                                                                        <Cell fill="#F4A261" />
                                                                        <Cell fill={darkMode ? '#374151' : '#E5E7EB'} />
                                                                    </Pie>
                                                                </PieChart>
                                                            </ResponsiveContainer>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Quality Card with Radial Chart */}
                                                <div className="metric-card">
                                                    <div className={`text-sm font-medium mb-2 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                                        Image Quality
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <div className={`text-sm ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                                                                Brightness: {face.quality.brightness}/100
                                                            </div>
                                                            <div className={`text-sm ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                                                                Sharpness: {face.quality.sharpness}/100
                                                            </div>
                                                        </div>
                                                        <div className="w-16 h-12">
                                                            <ResponsiveContainer width="100%" height="100%">
                                                                <RadialBarChart
                                                                    cx="50%"
                                                                    cy="50%"
                                                                    innerRadius="20%"
                                                                    outerRadius="80%"
                                                                    data={[
                                                                        { name: 'Brightness', value: face.quality.brightness, fill: '#95d5b2' },
                                                                        { name: 'Sharpness', value: face.quality.sharpness, fill: '#F4A261' }
                                                                    ]}
                                                                >
                                                                    <RadialBar dataKey="value" cornerRadius={2} />
                                                                </RadialBarChart>
                                                            </ResponsiveContainer>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Top Emotions */}
                                            <div className="mb-6">
                                                <h4 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>
                                                    <span className="inline-flex items-center">
                                                        <span className="w-2 h-2 bg-gradient-warm rounded-full mr-3"></span>
                                                        Top Emotions
                                                    </span>
                                                </h4>
                                                <div className="space-y-3">
                                                    {face.emotions.slice(0, 3).map((emotion, i) => (
                                                        <div key={i} className="flex items-center space-x-4">
                                                            <div className={`w-16 text-sm font-medium capitalize ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                                                                {emotion.type.toLowerCase()}
                                                            </div>
                                                            <div className="progress-bar">
                                                                <div
                                                                    className="progress-fill-warm progress-animate"
                                                                    style={{ width: `${Math.max(emotion.confidence, 5)}%` }}
                                                                />
                                                            </div>
                                                            <div className={`w-10 text-sm font-semibold ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                                                                {emotion.confidence}%
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Facial Features */}
                                            <div>
                                                <h4 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>
                                                    <span className="inline-flex items-center">
                                                        <span className="w-2 h-2 bg-gradient-primary rounded-full mr-3"></span>
                                                        Facial Features
                                                    </span>
                                                </h4>
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                                    {Object.entries(face.attributes).map(([key, value]) => {
                                                        if (value && typeof value === 'object') {
                                                            return (
                                                                <div key={key} className="feature-card">
                                                                    <div className={`font-medium text-sm mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                                                                        {key.replace(/([A-Z])/g, ' $1').trim()}
                                                                    </div>
                                                                    <div className={`text-lg mb-1 ${value.value ? 'text-green-500' : 'text-orange-500'}`}>
                                                                        {value.value ? '✓' : '✗'}
                                                                    </div>
                                                                    <div className={`text-xs ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                                                                        {value.confidence}%
                                                                    </div>
                                                                </div>
                                                            );
                                                        }
                                                        return null;
                                                    })}
                                                </div>
                                            </div>

                                            {/* Emoji Highlights Section */}
                                            <div className="mt-6">
                                                <h4 className={`text-lg font-semibold mb-4 text-center ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>
                                                    <span className="text-gradient-warm">
                                                        Emoji Highlights
                                                    </span>
                                                </h4>

                                                <div className="flex flex-col md:flex-row gap-6">
                                                    {/* Facial Features */}
                                                    <div className={`flex-1 border rounded-xl p-4 transition-all duration-300 ${
                                                        darkMode ? 'border-slate-600 glass-effect-dark' : 'border-orange-200 glass-effect'
                                                    }`}>
                                                        <h5 className={`text-sm font-medium mb-2 text-center ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                                            Facial Features
                                                        </h5>
                                                        <div className="flex flex-wrap gap-4 justify-center">
                                                            {Object.entries(face.attributes).map(([key, value]) => {
                                                                let emoji = '';
                                                                switch (key.toLowerCase()) {
                                                                    case 'smile':
                                                                        emoji = value.value ? '😊' : '😐';
                                                                        break;
                                                                    case 'eyeglasses':
                                                                        emoji = value.value ? '👓' : '😶';
                                                                        break;
                                                                    case 'sunglasses':
                                                                        emoji = value.value ? '😎' : '😶';
                                                                        break;
                                                                    case 'beard':
                                                                        emoji = value.value ? '🧔' : '👨';
                                                                        break;
                                                                    case 'mustache':
                                                                        emoji = value.value ? '👨‍🦰' : '👱';
                                                                        break;
                                                                    case 'eyesopen':
                                                                        emoji = value.value ? '👀' : '😴';
                                                                        break;
                                                                    case 'mouthopen':
                                                                        emoji = value.value ? '😮' : '😶';
                                                                        break;
                                                                    default:
                                                                        emoji = '✨';
                                                                }

                                                                return (
                                                                    <div
                                                                        key={key}
                                                                        className="text-2xl flex items-center justify-center w-12 h-12 rounded-lg hover:scale-110 transition-transform duration-200 cursor-pointer"
                                                                        title={key.replace(/([A-Z])/g, ' $1').trim()}
                                                                    >
                                                                        {emoji}
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>

                                                    {/* Emotions */}
                                                    <div className={`flex-1 border rounded-xl p-4 transition-all duration-300 ${
                                                        darkMode ? 'border-slate-600 glass-effect-dark' : 'border-yellow-400 glass-effect'
                                                    }`}>
                                                        <h5 className={`text-sm font-medium mb-2 text-center ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                                            Emotions
                                                        </h5>
                                                        <div className="flex flex-wrap gap-4 justify-center">
                                                            {face.emotions.slice(0, 5).map((emotion, i) => (
                                                                <div
                                                                    key={i}
                                                                    className="text-2xl flex items-center justify-center w-12 h-12 rounded-lg hover:scale-110 transition-transform duration-200 cursor-pointer"
                                                                    title={`${emotion.type} - ${emotion.confidence}%`}
                                                                >
                                                                    {emotion.type === 'HAPPY' ? '😄' :
                                                                        emotion.type === 'SAD' ? '😢' :
                                                                            emotion.type === 'ANGRY' ? '😠' :
                                                                                emotion.type === 'CONFUSED' ? '😕' :
                                                                                    emotion.type === 'SURPRISED' ? '😲' :
                                                                                        emotion.type === 'DISGUSTED' ? '🤢' :
                                                                                            emotion.type === 'FEAR' ? '😨' :
                                                                                                '🙂'}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* Footer */}
                <footer className={`text-center mt-8 pt-8 border-t transition-colors duration-300 ${darkMode ? 'border-slate-700' : 'border-slate-200'}`}>
                    <div className={`flex flex-col md:flex-row justify-center items-center space-y-2 md:space-y-0 md:space-x-4 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                        <div className="flex items-center space-x-2 text-sm">
                            <span>Powered by</span>
                            <span className="font-semibold text-gradient-primary">Next.js</span>
                            <span>&</span>
                            <span className="font-semibold text-gradient-warm">AWS Rekognition</span>
                        </div>
                        <div className={`flex items-center px-3 py-1 rounded-full text-xs font-medium transition-all duration-300 ${
                            darkMode ? 'bg-slate-800/50 text-orange-400 border border-slate-700' : 'bg-orange-100 text-orange-800 border border-orange-200'
                        }`}>
                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                            </svg>
                            Privacy Protected
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    );
}

