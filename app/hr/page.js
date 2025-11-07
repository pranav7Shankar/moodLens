'use client';

import { useEffect, useState } from 'react';
import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import EmployeeDatabase from '@/components/hr/EmployeeDatabase';
import AddEmployeeForm from '@/components/hr/AddEmployeeForm';
import AttendanceStatus from '@/components/hr/AttendanceStatus';
import MoodLens from '@/components/hr/MoodLens';
import AnnouncementsSection from '@/components/hr/AnnouncementsSection';

export default function HRDashboard() {
    const router = useRouter();
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [currentUser, setCurrentUser] = useState(null);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [form, setForm] = useState({ name: '', gender: '', age: '', department: '', email: '' });
    const [image, setImage] = useState(null);
    const [editing, setEditing] = useState(null);
    const [showEditSidebar, setShowEditSidebar] = useState(false);
    const [editForm, setEditForm] = useState({ name: '', gender: '', age: '', department: '', email: '' });
    const [editImage, setEditImage] = useState(null);
    const [activeTab, setActiveTab] = useState('employees'); // 'employees', 'management', 'attendance', 'emotions', 'dashboard'
    const [employeeDepartmentFilter, setEmployeeDepartmentFilter] = useState('all');
    const [announcements, setAnnouncements] = useState([]);
    const [announcementTitle, setAnnouncementTitle] = useState('');
    const [announcementMessage, setAnnouncementMessage] = useState('');
    const [announcementPriority, setAnnouncementPriority] = useState('normal');
    const [announcementSaving, setAnnouncementSaving] = useState(false);
    const [showEmployeeFilter, setShowEmployeeFilter] = useState(false);
    const [attendanceRecords, setAttendanceRecords] = useState([]);
    const [attendanceLoading, setAttendanceLoading] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [dateRange, setDateRange] = useState('day'); // 'day', 'week', 'month'
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [employeeAttendanceHistory, setEmployeeAttendanceHistory] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
    const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
    const [employeeCreatedAt, setEmployeeCreatedAt] = useState(null);
    const [historyFilter, setHistoryFilter] = useState('all'); // 'all', 'month', 'year'
    const [historyFilterMonth, setHistoryFilterMonth] = useState(new Date().getMonth());
    const [historyFilterYear, setHistoryFilterYear] = useState(new Date().getFullYear());
    const [emotionGenderFilter, setEmotionGenderFilter] = useState('all');
    const [emotionDepartmentFilter, setEmotionDepartmentFilter] = useState('all');
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const [attendanceFilter, setAttendanceFilter] = useState('all'); // 'all', 'present', 'absent'
    const [emotionViewMode, setEmotionViewMode] = useState('positiveNegative'); // 'positiveNegative' or 'individual'
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

    const fetchEmployees = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/employees');
            const data = await res.json();
            setEmployees(data.employees || []);
        } catch (e) {
            setError('Failed to load employees');
        } finally {
            setLoading(false);
        }
    };

    const fetchCurrentUser = async () => {
        try {
            const res = await fetch('/api/hr/me', { credentials: 'include' });
            if (res.ok) {
                const data = await res.json();
                if (data && !data.error) {
                    setCurrentUser(data);
                }
            }
        } catch (e) {
            console.error('Failed to fetch current user:', e);
        }
    };

    const fetchAnnouncements = async () => {
        try {
            const res = await fetch('/api/announcements');
            if (res.ok) {
                const data = await res.json();
                setAnnouncements(data.announcements || []);
            }
        } catch (e) {
            console.error('Failed to fetch announcements:', e);
        }
    };

    useEffect(() => { 
        fetchEmployees();
        fetchCurrentUser();
    }, []);

    // Close employee filter dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showEmployeeFilter && !event.target.closest('.employee-filter-container')) {
                setShowEmployeeFilter(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showEmployeeFilter]);

    const fetchAttendance = async (dateOrRange) => {
        setAttendanceLoading(true);
        try {
            let url = '';
            
            // Use anonymous_emotions table for emotions tab, attendance table for attendance tab
            if (activeTab === 'emotions') {
                url = '/api/anonymous-emotions?';
            } else {
                url = '/api/attendance?';
            }
            
            if (dateOrRange === 'day') {
                url += `date=${selectedDate}`;
            } else if (dateOrRange === 'week' || dateOrRange === 'month') {
                url += `start_date=${startDate}&end_date=${endDate}`;
            } else {
                url += `date=${selectedDate}`;
            }
            
            // Add gender and department filters for emotions tab
            if (activeTab === 'emotions') {
                if (emotionGenderFilter && emotionGenderFilter !== 'all') {
                    url += `&gender=${encodeURIComponent(emotionGenderFilter)}`;
                }
                if (emotionDepartmentFilter && emotionDepartmentFilter !== 'all') {
                    url += `&department=${encodeURIComponent(emotionDepartmentFilter)}`;
                }
            }
            
            const res = await fetch(url);
            const data = await res.json();
            
            // Handle both response formats
            if (data.anonymous_emotions) {
                setAttendanceRecords(data.anonymous_emotions || []);
            } else {
                setAttendanceRecords(data.attendance || []);
            }
        } catch (e) {
            setError('Failed to load records');
        } finally {
            setAttendanceLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'attendance') {
            fetchAttendance('day');
        } else if (activeTab === 'emotions') {
            fetchAttendance(dateRange);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab, selectedDate, dateRange, startDate, endDate, emotionGenderFilter, emotionDepartmentFilter]);

    // Update date range when range type changes
    useEffect(() => {
        if (activeTab === 'emotions') {
            const today = new Date();
            const todayStr = today.toISOString().split('T')[0];
            
            if (dateRange === 'day') {
                setStartDate(todayStr);
                setEndDate(todayStr);
            } else if (dateRange === 'week') {
                const weekStart = new Date(today);
                weekStart.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekStart.getDate() + 6);
                setStartDate(weekStart.toISOString().split('T')[0]);
                setEndDate(weekEnd.toISOString().split('T')[0]);
            } else if (dateRange === 'month') {
                const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
                const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                setStartDate(monthStart.toISOString().split('T')[0]);
                setEndDate(monthEnd.toISOString().split('T')[0]);
            }
        }
    }, [dateRange, activeTab]);

    const createEmployee = async (e) => {
        e.preventDefault();
        setError('');
        const fd = new FormData();
        fd.append('name', form.name);
        fd.append('gender', form.gender);
        fd.append('age', form.age);
        fd.append('department', form.department);
        fd.append('email', form.email);
        if (image) fd.append('image', image);
        try {
            const res = await fetch('/api/employees', { method: 'POST', body: fd });
            if (!res.ok) throw new Error('Create failed');
            setForm({ name: '', gender: '', age: '', department: '', email: '' });
            setImage(null);
            await fetchEmployees();
        } catch (e) {
            setError('Failed to create employee');
        }
    };

    const startEdit = (emp) => {
        setEditing(emp);
        setEditForm({ name: emp.name || '', gender: emp.gender || '', age: emp.age || '', department: emp.department || '', email: emp.email || '' });
        setEditImage(null);
        setShowEditSidebar(true);
    };

    const saveEdit = async (e) => {
        e.preventDefault();
        if (!editing) return;
        const fd = new FormData();
        if (editForm.name) fd.append('name', editForm.name);
        if (editForm.gender) fd.append('gender', editForm.gender);
        if (editForm.age) fd.append('age', editForm.age);
        if (editForm.department) fd.append('department', editForm.department);
        if (editForm.email) fd.append('email', editForm.email);
        if (editImage) fd.append('image', editImage);
        try {
            const res = await fetch(`/api/employees/${editing.id}`, { method: 'PUT', body: fd });
            if (!res.ok) throw new Error('Update failed');
            setEditing(null);
            setEditForm({ name: '', gender: '', age: '', department: '', email: '' });
            setEditImage(null);
            setShowEditSidebar(false);
            await fetchEmployees();
        } catch (e) {
            setError('Failed to update employee');
        }
    };

    const closeEditSidebar = () => {
        setShowEditSidebar(false);
        setEditing(null);
        setEditForm({ name: '', gender: '', age: '', department: '', email: '' });
        setEditImage(null);
    };

    const remove = async (emp) => {
        if (!confirm('Delete this employee?')) return;
        try {
            const res = await fetch(`/api/employees/${emp.id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Delete failed');
            await fetchEmployees();
        } catch (e) {
            setError('Failed to delete employee');
        }
    };

    const logout = async () => {
        await fetch('/api/hr/logout', { method: 'POST' });
        setCurrentUser(null);
        router.push('/hr/login');
    };

    // Fetch attendance history for a specific employee
    const fetchEmployeeHistory = async (employeeId, employeeName) => {
        setSelectedEmployee({ id: employeeId, name: employeeName });
        setLoadingHistory(true);
        // Reset calendar to current month/year
        const now = new Date();
        setCalendarMonth(now.getMonth());
        setCalendarYear(now.getFullYear());
        setHistoryFilterMonth(now.getMonth());
        setHistoryFilterYear(now.getFullYear());
        
        try {
            // Fetch employee data to get creation date
            const empRes = await fetch('/api/employees');
            const empData = await empRes.json();
            const employee = empData.employees?.find(e => e.id === employeeId);
            if (employee?.created_at) {
                setEmployeeCreatedAt(employee.created_at);
            }

            // Fetch last 90 days of attendance for better calendar view
            const ninetyDaysAgo = new Date();
            ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
            const start = ninetyDaysAgo.toISOString().split('T')[0];
            const end = new Date().toISOString().split('T')[0];

            const res = await fetch(`/api/attendance?employee_id=${employeeId}&start_date=${start}&end_date=${end}`);
            const data = await res.json();
            setEmployeeAttendanceHistory(data.attendance || []);
        } catch (e) {
            setError('Failed to load attendance history');
            setEmployeeAttendanceHistory([]);
            setEmployeeCreatedAt(null);
        } finally {
            setLoadingHistory(false);
        }
    };

    // Sync calendar when filter changes
    useEffect(() => {
        if (selectedEmployee) {
            if (historyFilter === 'month') {
                setCalendarMonth(historyFilterMonth);
                setCalendarYear(historyFilterYear);
            } else if (historyFilter === 'year') {
                // For year view, show the first month of the year in calendar
                setCalendarYear(historyFilterYear);
                setCalendarMonth(0);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [historyFilter, historyFilterMonth, historyFilterYear]);

    const closeEmployeeModal = () => {
        setSelectedEmployee(null);
        setEmployeeAttendanceHistory([]);
        setEmployeeCreatedAt(null);
    };

    // Get attendance status for a specific date
    const getAttendanceForDate = (dateString) => {
        return employeeAttendanceHistory.find(r => r.date === dateString);
    };

    // Calendar helper functions
    const getDaysInMonth = (month, year) => {
        return new Date(year, month + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (month, year) => {
        return new Date(year, month, 1).getDay();
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            year: 'numeric'
        });
    };

    const formatTime = (timestamp) => {
        return new Date(timestamp).toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    };

    // Check if date should be marked as absent (after employee creation, no record exists)
    const isAbsentDay = (dateString) => {
        if (!employeeCreatedAt) return false;
        const date = new Date(dateString);
        const createdDate = new Date(employeeCreatedAt);
        createdDate.setHours(0, 0, 0, 0);
        const checkDate = new Date(dateString);
        checkDate.setHours(0, 0, 0, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Only mark as absent if:
        // 1. Date is after employee creation
        // 2. Date is today or before
        // 3. No attendance record exists for this date
        return checkDate >= createdDate && checkDate <= today && !getAttendanceForDate(dateString);
    };

    // Filter attendance records by month/year
    const getFilteredRecords = () => {
        let filtered = [...employeeAttendanceHistory].sort((a, b) => new Date(b.date) - new Date(a.date));
        
        if (historyFilter === 'month') {
            filtered = filtered.filter(record => {
                const recordDate = new Date(record.date);
                return recordDate.getMonth() === historyFilterMonth && recordDate.getFullYear() === historyFilterYear;
            });
        } else if (historyFilter === 'year') {
            filtered = filtered.filter(record => {
                const recordDate = new Date(record.date);
                return recordDate.getFullYear() === historyFilterYear;
            });
        }
        
        return filtered;
    };

    // Calculate attendance percentage for filtered period (synced with calendar)
    const calculateAttendancePercentage = () => {
        if (!employeeCreatedAt) return 0;
        
        let startDate, endDate;
        
        if (historyFilter === 'month') {
            // Use the same month/year as the filter
            startDate = new Date(historyFilterYear, historyFilterMonth, 1);
            endDate = new Date(historyFilterYear, historyFilterMonth + 1, 0);
        } else if (historyFilter === 'year') {
            // Use the same year as the filter
            startDate = new Date(historyFilterYear, 0, 1);
            endDate = new Date(historyFilterYear, 11, 31);
        } else {
            // For 'all', use employee creation date to today
            startDate = new Date(employeeCreatedAt);
            endDate = new Date();
        }
        
        const createdDate = new Date(employeeCreatedAt);
        if (startDate < createdDate) startDate = createdDate;
        
        const today = new Date();
        if (endDate > today) endDate = today;
        
        // Count total days
        let totalDays = 0;
        let presentDays = 0;
        const currentDate = new Date(startDate);
        
        while (currentDate <= endDate) {
            totalDays++;
            const dateStr = currentDate.toISOString().split('T')[0];
            const record = getAttendanceForDate(dateStr);
            if (record?.present) {
                presentDays++;
            }
            currentDate.setDate(currentDate.getDate() + 1);
        }
        
        return totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;
    };

    // Generate calendar days
    const generateCalendarDays = () => {
        const daysInMonth = getDaysInMonth(calendarMonth, calendarYear);
        const firstDay = getFirstDayOfMonth(calendarMonth, calendarYear);
        const days = [];
        
        // Add empty cells for days before month starts
        for (let i = 0; i < firstDay; i++) {
            days.push(null);
        }
        
        // Add all days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            days.push(dateStr);
        }
        
        return days;
    };

    const changeMonth = (direction) => {
        if (direction === 'prev') {
            if (calendarMonth === 0) {
                setCalendarMonth(11);
                setCalendarYear(calendarYear - 1);
            } else {
                setCalendarMonth(calendarMonth - 1);
            }
        } else {
            if (calendarMonth === 11) {
                setCalendarMonth(0);
                setCalendarYear(calendarYear + 1);
            } else {
                setCalendarMonth(calendarMonth + 1);
            }
        }
    };

    // Calculate attendance status for each employee
    const getAttendanceStatus = () => {
        const attendanceMap = {};
        
        attendanceRecords.forEach(record => {
            // Handle both attendance records (has 'present' field) and emotion_records
            if (record.present !== false) { // true or undefined (for emotion_records)
                attendanceMap[record.employee_id] = true;
            }
        });

        return employees.map(emp => ({
            ...emp,
            present: attendanceMap[emp.id] || false,
            attendanceRecord: attendanceRecords.find(r => r.employee_id === emp.id)
        }));
    };

    // Calculate collective emotions for pie chart from anonymous emotions data
    const getEmotionData = () => {
        const emotionCounts = {};
        
        // Sum up counts from anonymous_emotions records
        // Each record has emotion and count (aggregated data without employee info)
        attendanceRecords.forEach(record => {
            // Only process records that have emotion field (anonymous_emotions records)
            if (record.emotion) {
                const emotion = record.emotion || 'UNKNOWN';
                const count = record.count || 1; // Use the count from anonymous_emotions table
                emotionCounts[emotion] = (emotionCounts[emotion] || 0) + count;
            }
        });

        const COLORS = {
            'HAPPY': '#10B981',
            'SAD': '#3B82F6',
            'ANGRY': '#EF4444',
            'CONFUSED': '#F59E0B',
            'SURPRISED': '#8B5CF6',
            'DISGUSTED': '#EC4899',
            'FEAR': '#6366F1',
            'CALM': '#14B8A6',
            'UNKNOWN': '#6B7280'
        };

        return Object.entries(emotionCounts)
            .filter(([emotion]) => emotion && typeof emotion === 'string' && emotion.length > 0)
            .map(([emotion, count]) => {
                const emotionStr = emotion || 'UNKNOWN';
                const lowerPart = emotionStr.length > 1 ? emotionStr.slice(1).toLowerCase() : '';
                return {
                    name: emotionStr.charAt(0).toUpperCase() + lowerPart,
                    value: count,
                    color: COLORS[emotionStr.toUpperCase()] || COLORS.UNKNOWN,
                    originalEmotion: emotionStr.toUpperCase()
                };
            });
    };

    // Categorize emotions into Positive/Negative
    const getPositiveNegativeData = () => {
        const individualEmotions = getEmotionData();
        let positiveCount = 0;
        let negativeCount = 0;

        // Positive emotions
        const positiveEmotions = ['HAPPY', 'CALM', 'SURPRISED'];
        // Negative emotions
        const negativeEmotions = ['SAD', 'ANGRY', 'CONFUSED', 'DISGUSTED', 'FEAR', 'UNKNOWN'];

        individualEmotions.forEach(emotion => {
            if (positiveEmotions.includes(emotion.originalEmotion)) {
                positiveCount += emotion.value;
            } else if (negativeEmotions.includes(emotion.originalEmotion)) {
                negativeCount += emotion.value;
            }
        });

        return [
            {
                name: 'Positive',
                value: positiveCount,
                color: '#10B981' // Green for positive
            },
            {
                name: 'Negative',
                value: negativeCount,
                color: '#EF4444' // Red for negative
            }
        ].filter(item => item.value > 0); // Only show categories with data
    };

    const attendanceStatus = getAttendanceStatus();
    const emotionData = getEmotionData();

    return (
        <>
            <Script 
                src="https://unpkg.com/@splinetool/viewer@1.10.96/build/spline-viewer.js" 
                strategy="lazyOnload"
                type="module"
            />
            <div className="h-screen bg-[#0f0f23] text-white flex flex-col overflow-hidden">
            {/* Header */}
            <div className="bg-[#1a1a2e] border-b border-[#1e293b] flex-shrink-0">
                <div className="max-w-full mx-auto px-2 py-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            {/* Hamburger Menu Button for Mobile */}
                            <button
                                onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
                                className="lg:hidden p-2 rounded hover:bg-[#16213e] transition-colors text-white"
                                aria-label="Toggle sidebar"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth={2}
                                    stroke="currentColor"
                                    className="w-6 h-6"
                                >
                                    {mobileSidebarOpen ? (
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    ) : (
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                                    )}
                                </svg>
                            </button>
                            <img src="/logo.png" alt="MoodLens Logo" className="w-16 h-16 md:w-20 md:h-20 object-contain" />
                            <div className="hidden md:block">
                                <h1 className="text-3xl md:text-4xl text-white">MoodLens</h1>
                            </div>
                        </div>
                        {/* User Menu */}
                        <div className="relative">
                            <button 
                                onClick={() => setShowUserMenu(!showUserMenu)}
                                className="relative p-2 rounded-lg hover:bg-[#16213e] transition-all duration-300 group"
                                aria-label="User menu"
                            >
                                {/* Animated User Icon */}
                                <div className="relative w-10 h-10">
                                    {currentUser ? (
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#2563eb] to-[#1e40af] flex items-center justify-center text-white font-semibold shadow-lg shadow-blue-500/20 transition-transform duration-300 group-hover:scale-110 group-hover:shadow-blue-500/40">
                                            <span className="text-base">{currentUser.name.charAt(0).toUpperCase()}</span>
                                        </div>
                                    ) : (
                                        <svg 
                                            xmlns="http://www.w3.org/2000/svg" 
                                            fill="none" 
                                            viewBox="0 0 24 24" 
                                            strokeWidth={2} 
                                            stroke="currentColor" 
                                            className="w-10 h-10 text-slate-400 group-hover:text-white transition-colors duration-300 animate-pulse"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                                        </svg>
                                    )}
                                    {/* Animated ring indicator */}
                                    <div className="absolute inset-0 rounded-full border-2 border-blue-500/50 opacity-0 group-hover:opacity-100 animate-ping"></div>
                                </div>
                            </button>

                            {/* User Menu Dropdown */}
                            {showUserMenu && (
                                <>
                                    {/* Backdrop */}
                                    <div 
                                        className="fixed inset-0 z-40"
                                        onClick={() => setShowUserMenu(false)}
                                    ></div>
                                    {/* Dropdown */}
                                    <div className="absolute right-0 mt-2 w-64 bg-[#16213e] border border-[#1e293b] rounded-xl shadow-2xl z-50 overflow-hidden">
                                        {/* User Info Section */}
                                        {currentUser ? (
                                            <div className="p-4 border-b border-[#1e293b]">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#2563eb] to-[#1e40af] flex items-center justify-center text-white font-semibold text-lg shadow-lg shadow-blue-500/20">
                                                        {currentUser.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-semibold text-white truncate">{currentUser.name}</p>
                                                        {currentUser.email && (
                                                            <p className="text-xs text-slate-400 truncate">{currentUser.email}</p>
                                                        )}
                                                        {currentUser.department && (
                                                            <p className="text-xs text-blue-400 mt-1">{currentUser.department}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="p-4 border-b border-[#1e293b]">
                                                <p className="text-sm text-slate-400">Loading user info...</p>
                                            </div>
                                        )}
                                        
                                        {/* Logout Button */}
                                        <div className="p-2">
                                            <button
                                                onClick={logout}
                                                className="w-full px-4 py-3 bg-red-600/20 hover:bg-red-600/30 border border-red-600/50 rounded-lg text-red-400 font-medium transition-all duration-300 flex items-center justify-center gap-2 group"
                                            >
                                                <svg 
                                                    xmlns="http://www.w3.org/2000/svg" 
                                                    fill="none" 
                                                    viewBox="0 0 24 24" 
                                                    strokeWidth={2} 
                                                    stroke="currentColor" 
                                                    className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300"
                                                >
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                                                </svg>
                                                <span>Logout</span>
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {error && <div className="max-w-full mx-auto px-4 pt-4 text-red-400 bg-red-900/20 border border-red-800/50 rounded-lg p-3 flex-shrink-0">{error}</div>}

            <div className="flex flex-1 overflow-hidden relative">
                {/* Mobile Overlay */}
                {mobileSidebarOpen && (
                    <div
                        className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                        onClick={() => setMobileSidebarOpen(false)}
                    />
                )}

                {/* Left Sidebar */}
                <div className={`fixed lg:static inset-y-0 left-0 z-50 lg:z-auto w-64 bg-[#0d1117] border-r border-[#1e293b] flex-shrink-0 flex flex-col transform transition-transform duration-300 ease-in-out ${
                    mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
                }`}>
                    {/* Mobile Sidebar Header */}
                    <div className="lg:hidden p-4 border-b border-[#1e293b] flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <img src="/logo.png" alt="MoodLens Logo" className="w-10 h-10 object-contain" />
                            <h2 className="text-lg font-semibold text-white orbitron">Menu</h2>
                        </div>
                        <button
                            onClick={() => setMobileSidebarOpen(false)}
                            className="p-2 rounded hover:bg-[#16213e] transition-colors text-white"
                            aria-label="Close sidebar"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    <nav className="p-4 flex-1 overflow-y-auto">
                        <button
                            onClick={() => {
                                setActiveTab('employees');
                                setMobileSidebarOpen(false);
                            }}
                            className={`w-full text-left px-4 py-3 rounded-lg transition-colors mb-2 text-xs md:text-sm orbitron ${
                                activeTab === 'employees'
                                    ? 'bg-gradient-to-r from-[#2563eb] to-[#1e40af] text-black shadow-lg shadow-blue-500/20'
                                    : 'text-slate-300 hover:bg-[#16213e] hover:text-white'
                            }`}
                        >
                            Employee Database
                        </button>
                        <button
                            onClick={() => {
                                setActiveTab('management');
                                setMobileSidebarOpen(false);
                            }}
                            className={`w-full text-left px-4 py-3 rounded-lg transition-colors mb-2 text-xs md:text-sm orbitron ${
                                activeTab === 'management'
                                    ? 'bg-gradient-to-r from-[#2563eb] to-[#1e40af] text-black shadow-lg shadow-blue-500/20'
                                    : 'text-slate-300 hover:bg-[#16213e] hover:text-white'
                            }`}
                        >
                            Add Employee
                        </button>
                        <button
                            onClick={() => {
                                setActiveTab('attendance');
                                setMobileSidebarOpen(false);
                            }}
                            className={`w-full text-left px-4 py-3 rounded-lg transition-colors mb-2 text-xs md:text-sm orbitron ${
                                activeTab === 'attendance'
                                    ? 'bg-gradient-to-r from-[#2563eb] to-[#1e40af] text-black shadow-lg shadow-blue-500/20'
                                    : 'text-slate-300 hover:bg-[#16213e] hover:text-white'
                            }`}
                        >
                            Attendance Status
                        </button>
                        <button
                            onClick={() => {
                                setActiveTab('emotions');
                                setMobileSidebarOpen(false);
                            }}
                            className={`w-full text-left px-4 py-3 rounded-lg transition-colors mb-2 text-xs md:text-sm orbitron ${
                                activeTab === 'emotions'
                                    ? 'bg-gradient-to-r from-[#2563eb] to-[#1e40af] text-black shadow-lg shadow-blue-500/20'
                                    : 'text-slate-300 hover:bg-[#16213e] hover:text-white'
                            }`}
                        >
                            Mood Dashboard
                        </button>
                        <button
                            onClick={() => {
                                setActiveTab('dashboard');
                                setMobileSidebarOpen(false);
                                fetchAnnouncements();
                            }}
                            className={`w-full text-left px-4 py-3 rounded-lg transition-colors text-xs md:text-sm orbitron ${
                                activeTab === 'dashboard'
                                    ? 'bg-gradient-to-r from-[#2563eb] to-[#1e40af] text-black shadow-lg shadow-blue-500/20'
                                    : 'text-slate-300 hover:bg-[#16213e] hover:text-white'
                            }`}
                        >
                            Announcements
                        </button>
                    </nav>
                    
                    {/* Spline 3D Viewer - Hidden on mobile, visible on larger screens */}
                    <div className="hidden lg:block w-full h-64 overflow-hidden p-0 m-0 relative">
                        <spline-viewer 
                            url="https://prod.spline.design/e1REzfr4Htu1fYPj/scene.splinecode"
                            style={{ width: '100%', height: '100%', margin: 0, padding: 0 }}
                        />
                        {/* Gradient overlay to blend with sidebar */}
                        <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-[#0d1117] to-transparent pointer-events-none"></div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 px-3 md:px-6 py-4 md:py-6 bg-[#0f0f23] overflow-y-auto relative w-full">
                    {/* Animated Background Elements */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
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

            {/* Employee Database Tab */}
            {activeTab === 'employees' && (
                <EmployeeDatabase
                    employees={employees}
                    loading={loading}
                    employeeDepartmentFilter={employeeDepartmentFilter}
                    setEmployeeDepartmentFilter={setEmployeeDepartmentFilter}
                    showEmployeeFilter={showEmployeeFilter}
                    setShowEmployeeFilter={setShowEmployeeFilter}
                    startEdit={startEdit}
                    remove={remove}
                />
            )}

            {/* Add Employee Tab */}
            {activeTab === 'management' && (
                <AddEmployeeForm
                    form={form}
                    setForm={setForm}
                    image={image}
                    setImage={setImage}
                    createEmployee={createEmployee}
                />
            )}

            {/* Attendance Status Tab - Section 1 */}
            {activeTab === 'attendance' && (
                <AttendanceStatus
                    selectedDate={selectedDate}
                    setSelectedDate={setSelectedDate}
                    attendanceFilter={attendanceFilter}
                    setAttendanceFilter={setAttendanceFilter}
                    attendanceLoading={attendanceLoading}
                    attendanceStatus={attendanceStatus}
                    fetchEmployeeHistory={fetchEmployeeHistory}
                />
            )}

            {/* Employee Attendance History Modal */}
            {selectedEmployee && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={closeEmployeeModal}>
                    <div className="bg-[#1a1a2e] rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden border border-[#1e293b]" onClick={(e) => e.stopPropagation()}>
                        <div className="p-6 border-b border-[#1e293b] flex items-center justify-between">
                            <h2 className="text-2xl font-bold text-white orbitron">Attendance History - {selectedEmployee.name}</h2>
                            <button
                                onClick={closeEmployeeModal}
                                className="text-slate-400 hover:text-white text-2xl font-bold"
                            >
                                ×
                            </button>
                        </div>
                        <div className="p-6 overflow-hidden max-h-[calc(90vh-120px)]">
                            {loadingHistory ? (
                                <div className="text-center py-12 text-slate-500">Loading attendance history...</div>
                            ) : (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
                                    {/* Left Side - Calendar */}
                                    <div className="flex flex-col gap-4 min-w-0">
                                        {/* Calendar */}
                                        <div className="border rounded-xl p-3 bg-[#16213e] border-[#1e293b] flex-shrink-0 overflow-hidden">
                                            <h3 className="text-sm font-semibold mb-2 text-white orbitron">Calendar View</h3>
                                            
                                            {/* Calendar Controls - Disabled when filter is active */}
                                            <div className="flex items-center justify-between mb-2 gap-1">
                                                <button
                                                    onClick={() => changeMonth('prev')}
                                                    disabled={historyFilter !== 'all'}
                                                    className="px-1.5 py-0.5 bg-[#1e293b] border border-[#334155] rounded hover:bg-[#334155] transition-colors text-xs disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 text-white"
                                                >
                                                    ←
                                                </button>
                                                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                                    <select
                                                        value={calendarMonth}
                                                        onChange={(e) => setCalendarMonth(Number(e.target.value))}
                                                        disabled={historyFilter !== 'all'}
                                                        className="px-1.5 py-0.5 border border-[#334155] rounded bg-[#1e293b] text-white text-xs disabled:opacity-50 disabled:cursor-not-allowed flex-1 min-w-0"
                                                    >
                                                        {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((month, idx) => (
                                                            <option key={idx} value={idx}>{month}</option>
                                                        ))}
                                                    </select>
                                                    <select
                                                        value={calendarYear}
                                                        onChange={(e) => setCalendarYear(Number(e.target.value))}
                                                        disabled={historyFilter !== 'all'}
                                                        className="px-1.5 py-0.5 border border-[#334155] rounded bg-[#1e293b] text-white text-xs disabled:opacity-50 disabled:cursor-not-allowed flex-1 min-w-0"
                                                    >
                                                        {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 1 + i).map(year => (
                                                            <option key={year} value={year}>{year}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <button
                                                    onClick={() => changeMonth('next')}
                                                    disabled={historyFilter !== 'all'}
                                                    className="px-1.5 py-0.5 bg-[#1e293b] border border-[#334155] rounded hover:bg-[#334155] transition-colors text-xs disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 text-white"
                                                >
                                                    →
                                                </button>
                                            </div>

                                            {/* Calendar Grid - Prevent overflow */}
                                            <div className="bg-[#0f0f23] rounded-lg border border-[#1e293b] p-2 w-full overflow-hidden">
                                                {/* Day Headers */}
                                                <div className="grid grid-cols-7 gap-0.5 mb-1">
                                                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
                                                        <div key={day} className="text-center text-xs font-semibold text-slate-300 py-0.5 truncate">
                                                            {day}
                                                        </div>
                                                    ))}
                                                </div>
                                                
                                                {/* Calendar Days - Responsive sizing */}
                                                <div className="grid grid-cols-7 gap-0.5 w-full">
                                                    {generateCalendarDays().map((dateStr, idx) => {
                                                        if (!dateStr) {
                                                            return <div key={idx} className="aspect-square p-0.5"></div>;
                                                        }
                                                        
                                                        const attendance = getAttendanceForDate(dateStr);
                                                        const absent = isAbsentDay(dateStr);
                                                        const isToday = dateStr === new Date().toISOString().split('T')[0];
                                                        const isSelectedMonth = new Date(dateStr).getMonth() === calendarMonth;
                                                        
                                                        return (
                                                            <div
                                                                key={dateStr}
                                                                className={`aspect-square p-0.5 text-center text-xs rounded transition-all flex items-center justify-center text-white ${
                                                                    attendance?.present
                                                                        ? 'bg-green-700/30 border border-green-500 font-semibold'
                                                                        : attendance || absent
                                                                            ? 'bg-red-900/30 border border-red-600'
                                                                            : isSelectedMonth
                                                                                ? 'hover:bg-[#1e293b]'
                                                                                : 'text-slate-500'
                                                                } ${
                                                                    isToday && isSelectedMonth ? 'ring-1 ring-blue-500' : ''
                                                                }`}
                                                                title={attendance ? (attendance.present ? 'Present' : 'Absent') : absent ? 'Absent' : 'No record'}
                                                            >
                                                                <span className="truncate">{new Date(dateStr).getDate()}</span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            {/* Legend */}
                                            <div className="mt-2 flex flex-wrap gap-2 text-xs">
                                                <div className="flex items-center gap-1">
                                                    <div className="w-2.5 h-2.5 bg-green-700/30 border border-green-500 rounded flex-shrink-0"></div>
                                                    <span className="truncate text-slate-300">Present</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <div className="w-2.5 h-2.5 bg-red-900/30 border border-red-600 rounded flex-shrink-0"></div>
                                                    <span className="truncate text-slate-300">Absent</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <div className="w-2.5 h-2.5 bg-[#1e293b] border border-[#334155] rounded flex-shrink-0"></div>
                                                    <span className="truncate text-slate-300">None</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right Side - Attendance Rate and Records */}
                                    <div className="overflow-y-auto max-h-[calc(90vh-180px)] min-w-0">
                                        {/* Attendance Percentage Graph */}
                                        <div className="p-3 bg-[#16213e] border border-[#1e293b] rounded-lg mb-4 flex-shrink-0">
                                            <div className="text-xs text-slate-300 mb-2">Attendance Rate</div>
                                            <div className="flex items-center gap-4">
                                                <div className="w-20 h-20 relative flex-shrink-0">
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <RadialBarChart 
                                                            innerRadius="75%" 
                                                            outerRadius="95%" 
                                                            data={[{ 
                                                                name: 'Attendance', 
                                                                value: calculateAttendancePercentage()
                                                            }]}
                                                            startAngle={90}
                                                            endAngle={-270}
                                                        >
                                                            <RadialBar 
                                                                dataKey="value" 
                                                                cornerRadius={10}
                                                                fill={calculateAttendancePercentage() >= 80 ? '#10B981' : calculateAttendancePercentage() >= 60 ? '#F59E0B' : '#EF4444'}
                                                            />
                                                        </RadialBarChart>
                                                    </ResponsiveContainer>
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <span className="text-sm font-bold text-white">
                                                            {calculateAttendancePercentage()}%
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-2xl font-bold text-white truncate">
                                                        {calculateAttendancePercentage()}%
                                                    </div>
                                                    <div className="text-xs text-slate-400 mt-1 truncate">
                                                        {historyFilter === 'month' 
                                                            ? `${['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][historyFilterMonth]} ${historyFilterYear}`
                                                            : historyFilter === 'year'
                                                            ? `${historyFilterYear}`
                                                            : 'All Time'
                                                        }
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
                                            <h3 className="text-lg font-semibold">Attendance Records</h3>
                                            
                                            {/* Filter Controls */}
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <select
                                                    value={historyFilter}
                                                    onChange={(e) => setHistoryFilter(e.target.value)}
                                                    className="px-2 py-1 border border-[#334155] rounded bg-[#1e293b] text-white text-xs"
                                                >
                                                    <option value="all">All Time</option>
                                                    <option value="month">By Month</option>
                                                    <option value="year">By Year</option>
                                                </select>
                                                
                                                {historyFilter === 'month' && (
                                                    <>
                                                        <select
                                                            value={historyFilterMonth}
                                                            onChange={(e) => setHistoryFilterMonth(Number(e.target.value))}
                                                            className="px-2 py-1 border border-[#334155] rounded bg-[#1e293b] text-white text-xs"
                                                        >
                                                            {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map((month, idx) => (
                                                                <option key={idx} value={idx}>{month}</option>
                                                            ))}
                                                        </select>
                                                        <select
                                                            value={historyFilterYear}
                                                            onChange={(e) => setHistoryFilterYear(Number(e.target.value))}
                                                            className="px-2 py-1 border border-[#334155] rounded bg-[#1e293b] text-white text-xs"
                                                        >
                                                            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 1 + i).map(year => (
                                                                <option key={year} value={year}>{year}</option>
                                                            ))}
                                                        </select>
                                                    </>
                                                )}
                                                
                                                {historyFilter === 'year' && (
                                                    <select
                                                        value={historyFilterYear}
                                                        onChange={(e) => setHistoryFilterYear(Number(e.target.value))}
                                                        className="px-2 py-1 border border-[#334155] rounded bg-[#1e293b] text-white text-xs"
                                                    >
                                                        {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 1 + i).map(year => (
                                                            <option key={year} value={year}>{year}</option>
                                                        ))}
                                                    </select>
                                                )}
                                            </div>
                                        </div>

                                        {getFilteredRecords().length > 0 ? (
                                            <div className="space-y-2">
                                                {getFilteredRecords().map((record) => (
                                                    <div
                                                        key={record.id}
                                                        className={`border rounded px-3 py-2 text-sm flex items-center justify-between transition-all min-w-0 ${
                                                            record.present
                                                                ? 'bg-green-900/20 border-green-700/50'
                                                                : 'bg-red-900/20 border-red-700/50'
                                                        }`}
                                                    >
                                                        <div className="flex items-center gap-3 min-w-0 flex-1">
                                                            <span className="font-medium text-white truncate">
                                                                {formatDate(record.date)}
                                                            </span>
                                                            {record.present && (
                                                                <span className="text-slate-300 flex-shrink-0">
                                                                    {formatTime(record.timestamp)}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <span className={`px-2 py-1 rounded text-xs font-semibold flex-shrink-0 ${
                                                            record.present
                                                                ? 'bg-green-500 text-white'
                                                                : 'bg-red-500 text-white'
                                                        }`}>
                                                            {record.present ? 'Present' : 'Absent'}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-12 bg-slate-50 rounded-lg border border-slate-200">
                                                <p className="text-slate-600">No attendance records found for selected period.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* MoodLens Tab - Section 2 */}
            {activeTab === 'emotions' && (
                <MoodLens
                    dateRange={dateRange}
                    setDateRange={setDateRange}
                    selectedDate={selectedDate}
                    setSelectedDate={setSelectedDate}
                    startDate={startDate}
                    setStartDate={setStartDate}
                    endDate={endDate}
                    setEndDate={setEndDate}
                    showAdvancedFilters={showAdvancedFilters}
                    setShowAdvancedFilters={setShowAdvancedFilters}
                    emotionGenderFilter={emotionGenderFilter}
                    setEmotionGenderFilter={setEmotionGenderFilter}
                    emotionDepartmentFilter={emotionDepartmentFilter}
                    setEmotionDepartmentFilter={setEmotionDepartmentFilter}
                    employees={employees}
                    attendanceLoading={attendanceLoading}
                    emotionData={emotionData}
                    emotionViewMode={emotionViewMode}
                    setEmotionViewMode={setEmotionViewMode}
                    getPositiveNegativeData={getPositiveNegativeData}
                />
            )}

            {/* Announcements Tab */}
            {activeTab === 'dashboard' && (
                <AnnouncementsSection
                    announcements={announcements}
                    announcementTitle={announcementTitle}
                    setAnnouncementTitle={setAnnouncementTitle}
                    announcementMessage={announcementMessage}
                    setAnnouncementMessage={setAnnouncementMessage}
                    announcementPriority={announcementPriority}
                    setAnnouncementPriority={setAnnouncementPriority}
                    announcementSaving={announcementSaving}
                    setAnnouncementSaving={setAnnouncementSaving}
                    error={error}
                    setError={setError}
                    fetchAnnouncements={fetchAnnouncements}
                />
            )}
                    </div>

            {/* Edit Employee Sidebar */}
            {showEditSidebar && editing && (
                <>
                    {/* Backdrop */}
                    <div 
                        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
                        onClick={closeEditSidebar}
                    ></div>
                    
                    {/* Sidebar */}
                    <div className={`fixed right-0 top-0 h-full w-full sm:max-w-md bg-[#16213e] border-l border-[#1e293b] shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
                        showEditSidebar ? 'translate-x-0' : 'translate-x-full'
                    }`}>
                        <div className="h-full overflow-y-auto">
                            <div className="p-6">
                                {/* Header */}
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-[#2563eb] to-[#1e40af] shadow-lg shadow-blue-500/20">
                                            <span className="text-2xl">✏️</span>
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-white">Edit Employee</h2>
                                            <p className="text-sm text-slate-400">{editing.name}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={closeEditSidebar}
                                        className="p-2 hover:bg-[#1e293b] rounded-lg transition-colors"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-white">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>

                                {/* Form */}
                                <form onSubmit={saveEdit} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">Full Name</label>
                                        <input 
                                            className="border border-[#334155] rounded-lg p-3 w-full bg-[#1e293b] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
                                            placeholder="Enter employee name" 
                                            value={editForm.name} 
                                            onChange={e => setEditForm({ ...editForm, name: e.target.value })} 
                                            required
                                        />
                                    </div>
                                    
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-300 mb-2">Gender</label>
                                            <select
                                                className="border border-[#334155] rounded-lg p-3 w-full bg-[#1e293b] text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                                value={editForm.gender}
                                                onChange={e => setEditForm({ ...editForm, gender: e.target.value })}
                                                required
                                            >
                                                <option value="" className="bg-[#1e293b] text-white">Select Gender</option>
                                                <option value="Male" className="bg-[#1e293b] text-white">Male</option>
                                                <option value="Female" className="bg-[#1e293b] text-white">Female</option>
                                                <option value="Other" className="bg-[#1e293b] text-white">Other</option>
                                            </select>
                                        </div>
                                        
                                        <div>
                                            <label className="block text-sm font-medium text-slate-300 mb-2">Age</label>
                                            <input 
                                                className="border border-[#334155] rounded-lg p-3 w-full bg-[#1e293b] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
                                                placeholder="Age" 
                                                type="number" 
                                                min="18"
                                                max="100"
                                                value={editForm.age} 
                                                onChange={e => setEditForm({ ...editForm, age: e.target.value })} 
                                                required
                                            />
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">Department</label>
                                        <input 
                                            className="border border-[#334155] rounded-lg p-3 w-full bg-[#1e293b] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
                                            placeholder="Enter department name" 
                                            value={editForm.department} 
                                            onChange={e => setEditForm({ ...editForm, department: e.target.value })} 
                                            required
                                        />
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
                                        <input 
                                            className="border border-[#334155] rounded-lg p-3 w-full bg-[#1e293b] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
                                            placeholder="Enter email address" 
                                            type="email"
                                            value={editForm.email} 
                                            onChange={e => setEditForm({ ...editForm, email: e.target.value })} 
                                            required
                                        />
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">Employee Photo</label>
                                        {editing.employee_image && (
                                            <div className="mb-3">
                                                <img 
                                                    src={editing.employee_image} 
                                                    alt={editing.name} 
                                                    className="w-24 h-24 object-cover rounded-lg border border-[#334155] mb-2"
                                                />
                                                <p className="text-xs text-slate-500">Current photo</p>
                                            </div>
                                        )}
                                        <div className="border border-[#334155] rounded-lg p-3 bg-[#1e293b] hover:border-blue-500/50 transition-colors">
                                            <input 
                                                className="w-full text-sm text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 file:cursor-pointer cursor-pointer" 
                                                type="file" 
                                                accept="image/*" 
                                                onChange={e => setEditImage(e.target.files?.[0] || null)} 
                                            />
                                        </div>
                                        <p className="text-xs text-slate-500 mt-1">Upload a new photo to replace the current one</p>
                                    </div>
                                    
                                    <div className="flex gap-3 pt-4 border-t border-[#334155]">
                                        <button 
                                            type="submit"
                                            className="flex-1 px-6 py-3 bg-gradient-to-r from-[#2563eb] to-[#1e40af] text-white rounded-lg font-semibold hover:from-[#1d4ed8] hover:to-[#1e3a8a] transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30"
                                        >
                                            Save Changes
                                        </button>
                                        <button 
                                            type="button" 
                                            onClick={closeEditSidebar}
                                            className="px-6 py-3 bg-[#1e293b] border border-[#334155] rounded-lg hover:bg-[#334155] transition-colors text-white font-semibold"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </>
            )}
                    </div>
                </div>
            </div>
        </>
    );
}
