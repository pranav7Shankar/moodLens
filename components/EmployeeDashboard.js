'use client';

import { useState, useEffect } from 'react';

export default function EmployeeDashboard() {
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAnnouncements();
        // Refresh announcements every 30 seconds
        const interval = setInterval(fetchAnnouncements, 30000);
        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchAnnouncements = async () => {
        try {
            const res = await fetch('/api/announcements');
            if (res.ok) {
                const data = await res.json();
                setAnnouncements(data.announcements || []);
            }
        } catch (e) {
            console.error('Failed to fetch announcements:', e);
        } finally {
            setLoading(false);
        }
    };

    const priorityColors = {
        low: 'bg-slate-500/20 border-slate-500/50',
        normal: 'bg-blue-500/20 border-blue-500/50',
        high: 'bg-orange-500/20 border-orange-500/50',
        urgent: 'bg-red-500/20 border-red-500/50'
    };

    const priorityIcons = {
        low: '📌',
        normal: '📢',
        high: '⚠️',
        urgent: '🚨'
    };

    if (loading) {
        return (
            <div className="rounded-2xl p-6 bg-[#16213e] border border-[#1e293b] shadow-xl h-full">
                <h3 className="text-2xl md:text-3xl font-extrabold mb-4 text-white orbitron">Announcements</h3>
                <div className="flex items-center justify-center py-8">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-2xl p-6 bg-[#16213e] border border-[#1e293b] shadow-xl h-full flex flex-col animate-[fadeIn_0.5s_ease-out]">
            <h3 className="text-2xl md:text-3xl font-extrabold mb-4 text-white flex items-center gap-2 animate-[slideInLeft_0.4s_ease-out] orbitron">
                Announcements
            </h3>
            {announcements.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full min-h-[400px] animate-[fadeIn_0.6s_ease-out]">
                    <div className="mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 text-slate-500">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                        </svg>
                    </div>
                    <p className="text-slate-400 animate-[fadeIn_0.8s_ease-out]">No messages at this time</p>
                </div>
            ) : (
                <div className="space-y-3 overflow-y-auto flex-1">
                    {announcements.map((announcement, index) => (
                        <div
                            key={announcement.id}
                            className={`p-4 rounded-lg border ${priorityColors[announcement.priority] || priorityColors.normal} transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-blue-500/10 cursor-pointer animate-[slideInUp_0.5s_ease-out]`}
                            style={{ 
                                animationDelay: `${index * 0.1}s`,
                                animationFillMode: 'both'
                            }}
                        >
                            <div className="flex items-start gap-3 mb-2">
                                <span 
                                    className={`text-2xl transition-transform duration-300 hover:scale-110 ${
                                        announcement.priority === 'urgent' ? 'animate-[pulse_2s_ease-in-out_infinite]' :
                                        announcement.priority === 'high' ? 'animate-[pulse_3s_ease-in-out_infinite]' :
                                        ''
                                    }`}
                                >
                                    {priorityIcons[announcement.priority] || priorityIcons.normal}
                                </span>
                                <div className="flex-1">
                                    <h4 className="font-semibold text-white mb-1 animate-[fadeIn_0.4s_ease-out] orbitron">{announcement.title}</h4>
                                    <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed animate-[fadeIn_0.5s_ease-out]">
                                        {announcement.message}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 mt-3 text-xs text-slate-400 animate-[fadeIn_0.6s_ease-out]">
                                <span className={`px-2 py-1 rounded capitalize transition-all duration-300 hover:scale-110 ${
                                    announcement.priority === 'urgent' ? 'bg-red-500/30 text-red-300' :
                                    announcement.priority === 'high' ? 'bg-orange-500/30 text-orange-300' :
                                    announcement.priority === 'normal' ? 'bg-blue-500/30 text-blue-300' :
                                    'bg-slate-500/30 text-slate-300'
                                }`}>
                                    {announcement.priority}
                                </span>
                                <span>•</span>
                                <span>{new Date(announcement.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

