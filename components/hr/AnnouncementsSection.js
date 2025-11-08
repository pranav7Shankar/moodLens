'use client';

export default function AnnouncementsSection({
    announcements,
    announcementTitle,
    setAnnouncementTitle,
    announcementMessage,
    setAnnouncementMessage,
    announcementPriority,
    setAnnouncementPriority,
    announcementSaving,
    setAnnouncementSaving,
    error,
    setError,
    fetchAnnouncements
}) {
    const priorityColors = {
        low: 'bg-slate-500/20 border-slate-500/50 text-slate-300',
        normal: 'bg-blue-500/20 border-blue-500/50 text-blue-300',
        high: 'bg-orange-500/20 border-orange-500/50 text-orange-300',
        urgent: 'bg-red-500/20 border-red-500/50 text-red-300'
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <h2 className="text-2xl md:text-3xl font-extrabold orbitron">Announcements</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Create New Announcement - 2/3 width */}
                <div className="lg:col-span-2">
                    <div className="border border-[#1e293b] rounded-2xl p-6 bg-[#16213e] shadow-xl">
                        <div className="mb-4 text-center">
                            <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-gradient-to-br from-[#2563eb] to-[#1e40af] shadow-lg shadow-blue-500/20 mx-auto mb-3">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-7 h-7 text-white">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                </svg>
                            </div>
                            <h2 className="text-xl font-bold text-white orbitron">Post New Message</h2>
                            <p className="text-sm text-slate-400 mt-2">Messages will be displayed on the employee dashboard at the kiosk</p>
                        </div>

                        <form onSubmit={async (e) => {
                            e.preventDefault();
                            setAnnouncementSaving(true);
                            setError('');
                            
                            try {
                                if (!announcementTitle.trim() || !announcementMessage.trim()) {
                                    setError('Title and message are required');
                                    setAnnouncementSaving(false);
                                    return;
                                }
                                
                                const res = await fetch('/api/announcements', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        title: announcementTitle.trim(),
                                        message: announcementMessage.trim(),
                                        priority: announcementPriority
                                    }),
                                    credentials: 'include'
                                });
                                
                                const data = await res.json();
                                
                                if (!res.ok) {
                                    setError(data.error || 'Failed to post message');
                                    setAnnouncementSaving(false);
                                    return;
                                }
                                
                                // Success - clear form and refresh announcements
                                setAnnouncementTitle('');
                                setAnnouncementMessage('');
                                setAnnouncementPriority('normal');
                                setError('');
                                await fetchAnnouncements();
                                alert('Message posted successfully!');
                            } catch (err) {
                                console.error('Error posting message:', err);
                                setError('Failed to post message. Please try again.');
                            } finally {
                                setAnnouncementSaving(false);
                            }
                        }} className="space-y-4">
                            {/* Title */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Title</label>
                                <input 
                                    className="border border-[#334155] rounded-lg p-3 w-full bg-[#1e293b] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                                    placeholder="Enter message title" 
                                    value={announcementTitle} 
                                    onChange={e => setAnnouncementTitle(e.target.value)} 
                                    required
                                />
                            </div>

                            {/* Priority */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Priority</label>
                                <select
                                    className="border border-[#334155] rounded-lg p-3 w-full bg-[#1e293b] text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    value={announcementPriority}
                                    onChange={e => setAnnouncementPriority(e.target.value)}
                                >
                                    <option value="low" className="bg-[#1e293b] text-white">Low</option>
                                    <option value="normal" className="bg-[#1e293b] text-white">Normal</option>
                                    <option value="high" className="bg-[#1e293b] text-white">High</option>
                                    <option value="urgent" className="bg-[#1e293b] text-white">Urgent</option>
                                </select>
                            </div>

                            {/* Message */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Message</label>
                                <textarea 
                                    className="border border-[#334155] rounded-lg p-3 w-full bg-[#1e293b] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[200px] resize-y" 
                                    placeholder="Enter your message here..." 
                                    value={announcementMessage} 
                                    onChange={e => setAnnouncementMessage(e.target.value)} 
                                    required
                                />
                            </div>

                            {/* Error Display */}
                            {error && (
                                <div className="bg-red-900/20 border border-red-800/50 rounded-lg p-3 text-red-400 text-sm">
                                    <div className="flex items-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                                        </svg>
                                        <span>{error}</span>
                                    </div>
                                </div>
                            )}

                            {/* Submit Button */}
                            <div className="flex gap-3 pt-4 border-t border-[#334155]">
                                <button 
                                    type="submit"
                                    disabled={announcementSaving}
                                    className="flex-1 px-6 py-3 bg-gradient-to-r from-[#2563eb] to-[#1e40af] text-white rounded-lg font-semibold hover:from-[#1d4ed8] hover:to-[#1e3a8a] shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {announcementSaving ? 'Posting...' : 'Post Message'}
                                </button>
                                <button 
                                    type="button"
                                    onClick={() => {
                                        setAnnouncementTitle('');
                                        setAnnouncementMessage('');
                                        setAnnouncementPriority('normal');
                                        setError('');
                                    }}
                                    className="px-6 py-3 bg-[#1e293b] border border-[#334155] rounded-lg hover:bg-[#334155] text-white font-semibold"
                                >
                                    Clear
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Existing Announcements - 1/3 width */}
                <div className="lg:col-span-1">
                    <div className="border border-[#1e293b] rounded-2xl p-6 bg-[#16213e] shadow-xl h-full flex flex-col">
                        <h3 className="text-lg font-bold mb-4 text-white orbitron">Active Messages</h3>
                        {announcements.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full min-h-[300px] animate-[fadeIn_0.6s_ease-out]">
                                <div className="mb-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 text-slate-500">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                                    </svg>
                                </div>
                                <p className="text-slate-400 animate-[fadeIn_0.8s_ease-out]">No active messages</p>
                                <p className="text-xs text-slate-500 mt-2 animate-[fadeIn_1s_ease-out]">Post a message to display it here</p>
                            </div>
                        ) : (
                            <div className="space-y-4 overflow-y-auto flex-1">
                                {announcements.map((announcement) => (
                                    <div
                                        key={announcement.id}
                                        className={`p-4 rounded-lg border ${priorityColors[announcement.priority] || priorityColors.normal}`}
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex-1">
                                                <h4 className="font-semibold text-white mb-1 orbitron">{announcement.title}</h4>
                                                <p className="text-sm text-slate-300 whitespace-pre-wrap">{announcement.message}</p>
                                            </div>
                                            <button
                                                onClick={async () => {
                                                    if (confirm('Are you sure you want to remove this message?')) {
                                                        try {
                                                            const res = await fetch(`/api/announcements/${announcement.id}`, {
                                                                method: 'DELETE',
                                                                credentials: 'include'
                                                            });
                                                            if (res.ok) {
                                                                await fetchAnnouncements();
                                                            }
                                                        } catch (err) {
                                                            console.error('Error deleting announcement:', err);
                                                        }
                                                    }
                                                }}
                                                className="ml-4 p-2 hover:bg-red-500/20 rounded-lg"
                                                aria-label="Delete"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-red-400">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                                </svg>
                                            </button>
                                        </div>
                                        <div className="text-xs text-slate-400 mt-2">
                                            {new Date(announcement.created_at).toLocaleString()}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

