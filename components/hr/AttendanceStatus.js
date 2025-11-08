'use client';

import { useState } from 'react';

export default function AttendanceStatus({
    selectedDate,
    setSelectedDate,
    attendanceFilter,
    setAttendanceFilter,
    attendanceLoading,
    attendanceStatus,
    fetchEmployeeHistory
}) {
    const [sortBy, setSortBy] = useState('name'); // 'name', 'department', 'status', 'time'
    const [sortOrder, setSortOrder] = useState('asc'); // 'asc', 'desc'
    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h2 className="text-2xl md:text-3xl font-extrabold orbitron">Attendance Status</h2>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium whitespace-nowrap">Date:</label>
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="border border-[#334155] rounded px-2 md:px-3 py-2 bg-[#1e293b] text-white text-sm flex-1"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <select
                            value={attendanceFilter}
                            onChange={(e) => setAttendanceFilter(e.target.value)}
                            className="border border-[#334155] rounded px-2 md:px-3 py-2 bg-[#1e293b] text-white text-sm flex-1"
                        >
                            <option value="all">All</option>
                            <option value="present">Present</option>
                            <option value="absent">Absent</option>
                        </select>
                        <div className="relative">
                            <button
                                onClick={() => {
                                    const sortOptions = ['name', 'department', 'status', 'time'];
                                    const currentIndex = sortOptions.indexOf(sortBy);
                                    const nextIndex = (currentIndex + 1) % sortOptions.length;
                                    const nextSort = sortOptions[nextIndex];
                                    
                                    if (nextSort === sortBy) {
                                        // Toggle sort order if same option
                                        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                                    } else {
                                        setSortBy(nextSort);
                                        setSortOrder('asc');
                                    }
                                }}
                                className="p-2 border border-[#334155] rounded hover:bg-[#334155] transition-colors bg-[#1e293b] text-white"
                                title={`Sort by ${sortBy} (${sortOrder === 'asc' ? 'ascending' : 'descending'})`}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5" />
                                </svg>
                            </button>
                            {sortBy !== 'name' && (
                                <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full"></div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {attendanceLoading ? (
                <div className="text-center py-12 text-slate-500">Loading attendance records...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {attendanceStatus
                        .filter(emp => {
                            if (attendanceFilter === 'all') return true;
                            if (attendanceFilter === 'present') return emp.present === true;
                            if (attendanceFilter === 'absent') return emp.present === false;
                            return true;
                        })
                        .sort((a, b) => {
                            let comparison = 0;
                            
                            switch (sortBy) {
                                case 'name':
                                    comparison = (a.name || '').localeCompare(b.name || '');
                                    break;
                                case 'department':
                                    comparison = (a.department || '').localeCompare(b.department || '');
                                    break;
                                case 'status':
                                    // Present first, then absent
                                    if (a.present && !b.present) comparison = -1;
                                    else if (!a.present && b.present) comparison = 1;
                                    else comparison = 0;
                                    break;
                                case 'time':
                                    const timeA = a.attendanceRecord?.timestamp ? new Date(a.attendanceRecord.timestamp).getTime() : 0;
                                    const timeB = b.attendanceRecord?.timestamp ? new Date(b.attendanceRecord.timestamp).getTime() : 0;
                                    comparison = timeA - timeB;
                                    break;
                                default:
                                    comparison = 0;
                            }
                            
                            return sortOrder === 'asc' ? comparison : -comparison;
                        })
                        .map(emp => (
                        <div
                            key={emp.id}
                            onClick={() => fetchEmployeeHistory(emp.id, emp.name)}
                            className={`border rounded-xl p-4 shadow-sm transition-all cursor-pointer hover:shadow-md ${
                                emp.present
                                    ? 'bg-green-900/20 border-green-700/50 hover:border-green-600/50'
                                    : 'bg-red-900/20 border-red-700/50 hover:border-red-600/50'
                            }`}
                        >
                            <div className="flex items-center gap-3 mb-2">
                                {emp.employee_image && (
                                    <img
                                        src={emp.employee_image}
                                        alt={emp.name}
                                        className="w-12 h-12 object-cover rounded-full"
                                    />
                                )}
                                <div className="flex-1">
                                    <div className="font-semibold text-white orbitron">{emp.name}</div>
                                    <div className="text-xs text-slate-400">{emp.department}</div>
                                </div>
                                <div
                                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                        emp.present
                                            ? 'bg-green-500 text-white'
                                            : 'bg-red-500 text-white'
                                    }`}
                                >
                                    {emp.present ? '✓ Present' : '✗ Absent'}
                                </div>
                            </div>
                            {emp.attendanceRecord && (
                                <div className="mt-3 pt-3">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-slate-600">Time:</span>
                                        <span className="text-xs text-slate-500">
                                            {new Date(emp.attendanceRecord.timestamp).toLocaleTimeString()}
                                        </span>
                                    </div>
                                </div>
                            )}
                            <div className="mt-2 pt-2">
                                <p className="text-xs text-slate-500 text-center">Click to view history</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {attendanceStatus.filter(emp => {
                if (attendanceFilter === 'all') return true;
                if (attendanceFilter === 'present') return emp.present === true;
                if (attendanceFilter === 'absent') return emp.present === false;
                return true;
            }).length === 0 && !attendanceLoading && (
                <div className="text-center py-12 bg-[#16213e] rounded-xl border border-[#1e293b]">
                    <p className="text-slate-300">
                        {attendanceFilter === 'all' 
                            ? 'No employees found. Add employees first.' 
                            : `No ${attendanceFilter} employees found for this date.`}
                    </p>
                </div>
            )}
        </div>
    );
}

