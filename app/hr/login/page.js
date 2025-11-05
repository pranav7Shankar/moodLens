'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function HRLoginPage() {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const submit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await fetch('/api/hr/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password }),
                credentials: 'include'
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || data.details || 'Invalid password');
                setLoading(false);
                return;
            }
            // Redirect on success - add a small delay to ensure cookie is set
            setTimeout(() => {
                window.location.href = '/hr';
            }, 100);
        } catch (e) {
            console.error('Login error:', e);
            setError('Network error. Please check your connection and try again.');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0f0f23] relative overflow-hidden">
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
            <div className="relative z-10 w-full flex items-center justify-center">
            <form onSubmit={submit} className="w-full max-w-sm bg-[#1a1a2e]/90 backdrop-blur-sm border border-[#1e293b] rounded-xl p-6 shadow-xl">
                <div className="mb-6 text-center">
                    <div className="w-16 h-16 rounded-xl flex items-center justify-center bg-gradient-to-br from-[#2563eb] to-[#1e40af] shadow-lg shadow-blue-500/20 mx-auto mb-4">
                        <span className="text-3xl">🔐</span>
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">HR Admin Login</h1>
                    <p className="text-sm text-slate-400">Enter your credentials to access the dashboard</p>
                </div>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                            className="w-full border border-[#1e293b] rounded-lg p-3 bg-[#0f0f23] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Enter Admin Password"
                    required
                            autoFocus
                />
                    </div>
                    {error && <div className="text-red-400 text-sm bg-red-900/20 border border-red-800/50 rounded-lg p-3">{error}</div>}
                    <button disabled={loading} className="w-full px-4 py-3 bg-gradient-to-r from-[#2563eb] to-[#1e40af] hover:from-[#1d4ed8] hover:to-[#1e3a8a] text-white rounded-lg font-semibold transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed">
                    {loading ? 'Signing in...' : 'Sign In'}
                </button>
                </div>
            </form>
            </div>
        </div>
    );
}

