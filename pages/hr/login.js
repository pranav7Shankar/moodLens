import { useState } from 'react';

export default function HRLoginPage() {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

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
            // Redirect on success
            window.location.href = '/hr';
        } catch (e) {
            console.error('Login error:', e);
            setError('Network error. Please check your connection and try again.');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0f0f23]">
            <form onSubmit={submit} className="w-full max-w-sm bg-[#1a1a2e] border border-[#1e293b] rounded-xl p-6 shadow-xl">
                <div className="mb-6 text-center">
                    <div className="w-16 h-16 rounded-xl flex items-center justify-center bg-gradient-to-br from-[#9333ea] to-[#ec4899] shadow-lg shadow-purple-500/20 mx-auto mb-4">
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
                            className="w-full border border-[#1e293b] rounded-lg p-3 bg-[#0f0f23] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="Enter Admin Password"
                            required
                            autoFocus
                        />
                    </div>
                    {error && <div className="text-red-400 text-sm bg-red-900/20 border border-red-800/50 rounded-lg p-3">{error}</div>}
                    <button disabled={loading} className="w-full px-4 py-3 bg-gradient-to-r from-[#9333ea] to-[#ec4899] hover:from-[#7e22ce] hover:to-[#db2777] text-white rounded-lg font-semibold transition-all shadow-lg shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed">
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </div>
            </form>
        </div>
    );
}


