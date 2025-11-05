'use client';

import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, RadialBarChart, RadialBar } from 'recharts';
import { useRouter } from 'next/navigation';
import Spline from '@splinetool/react-spline';

export default function HRDashboard() {
    const router = useRouter();
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [form, setForm] = useState({ name: '', gender: '', age: '', department: '' });
    const [image, setImage] = useState(null);
    const [editing, setEditing] = useState(null);
    const [showEditSidebar, setShowEditSidebar] = useState(false);
    const [editForm, setEditForm] = useState({ name: '', gender: '', age: '', department: '' });
    const [editImage, setEditImage] = useState(null);
    const [activeTab, setActiveTab] = useState('employees'); // 'employees', 'management', 'attendance', 'emotions'
    const [employeeDepartmentFilter, setEmployeeDepartmentFilter] = useState('all');
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

    useEffect(() => { fetchEmployees(); }, []);

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
        if (image) fd.append('image', image);
        try {
            const res = await fetch('/api/employees', { method: 'POST', body: fd });
            if (!res.ok) throw new Error('Create failed');
            setForm({ name: '', gender: '', age: '', department: '' });
            setImage(null);
            await fetchEmployees();
        } catch (e) {
            setError('Failed to create employee');
        }
    };

    const startEdit = (emp) => {
        setEditing(emp);
        setEditForm({ name: emp.name || '', gender: emp.gender || '', age: emp.age || '', department: emp.department || '' });
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
        if (editImage) fd.append('image', editImage);
        try {
            const res = await fetch(`/api/employees/${editing.id}`, { method: 'PUT', body: fd });
            if (!res.ok) throw new Error('Update failed');
            setEditing(null);
            setEditForm({ name: '', gender: '', age: '', department: '' });
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
        setEditForm({ name: '', gender: '', age: '', department: '' });
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
        <div className="h-screen bg-[#0f0f23] text-white flex flex-col overflow-hidden">
            {/* Header */}
            <div className="bg-[#1a1a2e] border-b border-[#1e293b] flex-shrink-0">
                <div className="max-w-full mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-bold text-white">HR Dashboard</h1>
                        <button onClick={logout} className="px-3 py-1 bg-[#16213e] rounded hover:bg-[#1e293b] border border-[#1e293b] transition-colors text-white">Logout</button>
                    </div>
                </div>
            </div>

            {error && <div className="max-w-full mx-auto px-4 pt-4 text-red-400 bg-red-900/20 border border-red-800/50 rounded-lg p-3 flex-shrink-0">{error}</div>}

            <div className="flex flex-1 overflow-hidden">
                {/* Left Sidebar */}
                <div className="w-64 bg-[#0d1117] border-r border-[#1e293b] flex-shrink-0 flex flex-col">
                    <nav className="p-4 flex-1">
                        <button
                            onClick={() => setActiveTab('employees')}
                            className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors mb-2 ${
                                activeTab === 'employees'
                                    ? 'bg-gradient-to-r from-[#2563eb] to-[#1e40af] text-white shadow-lg shadow-blue-500/20'
                                    : 'text-slate-300 hover:bg-[#16213e] hover:text-white'
                            }`}
                        >
                            Employee Database
                        </button>
                        <button
                            onClick={() => setActiveTab('management')}
                            className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors mb-2 ${
                                activeTab === 'management'
                                    ? 'bg-gradient-to-r from-[#2563eb] to-[#1e40af] text-white shadow-lg shadow-blue-500/20'
                                    : 'text-slate-300 hover:bg-[#16213e] hover:text-white'
                            }`}
                        >
                            Add Employee
                        </button>
                        <button
                            onClick={() => setActiveTab('attendance')}
                            className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors mb-2 ${
                                activeTab === 'attendance'
                                    ? 'bg-gradient-to-r from-[#2563eb] to-[#1e40af] text-white shadow-lg shadow-blue-500/20'
                                    : 'text-slate-300 hover:bg-[#16213e] hover:text-white'
                            }`}
                        >
                            Attendance Status
                        </button>
                        <button
                            onClick={() => setActiveTab('emotions')}
                            className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors ${
                                activeTab === 'emotions'
                                    ? 'bg-gradient-to-r from-[#2563eb] to-[#1e40af] text-white shadow-lg shadow-blue-500/20'
                                    : 'text-slate-300 hover:bg-[#16213e] hover:text-white'
                            }`}
                        >
                            MoodLens
                        </button>
                    </nav>
                    
                    {/* Spline 3D Viewer */}
                    <div className="w-full h-64 border-t border-[#1e293b] overflow-hidden relative">
                        <div className="absolute inset-0" style={{ transform: 'translateX(-10%)', width: '120%' }}>
                            <Spline 
                                scene="https://prod.spline.design/e1REzfr4Htu1fYPj/scene.splinecode"
                                className="w-full h-full"
                                onLoad={(spline) => {
                                    // Adjust camera to show full model, especially the right side
                                    if (spline) {
                                        // Try to find and adjust the camera
                                        const camera = spline.findObjectByName('Camera') || spline.findObjectByName('camera');
                                        if (camera) {
                                            // Move camera left to show more of the right side
                                            camera.position.x -= 30;
                                            // Zoom out slightly to see more
                                            if (camera.zoom !== undefined) {
                                                camera.zoom = 0.85;
                                            }
                                        }
                                        // Alternative: adjust through spline's camera methods
                                        try {
                                            if (spline.setZoom) {
                                                spline.setZoom(0.85);
                                            }
                                        } catch (e) {
                                            console.log('Could not set zoom:', e);
                                        }
                                    }
                                }}
                            />
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 px-6 py-6 bg-[#0f0f23] overflow-y-auto relative">
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
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold">Employee Database</h2>
                        <div className="flex items-center gap-3">
                            <span className="text-sm text-slate-400">
                                ({employeeDepartmentFilter === 'all' ? employees.length : employees.filter(emp => emp.department === employeeDepartmentFilter).length} employees)
                            </span>
                            <div className="relative employee-filter-container">
                                <button
                                    onClick={() => setShowEmployeeFilter(!showEmployeeFilter)}
                                    className={`p-2 border rounded hover:bg-[#334155] transition-colors ${
                                        showEmployeeFilter ? 'bg-[#334155] border-[#475569]' : 'bg-[#1e293b] border-[#334155]'
                                    }`}
                                    title="Filter by Department"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-white">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                                    </svg>
                                </button>
                                {showEmployeeFilter && (
                                    <div className="absolute right-0 mt-2 bg-[#16213e] border border-[#1e293b] rounded-lg shadow-xl z-10 min-w-[180px]">
                                        <div className="p-2">
                                            <select
                                                value={employeeDepartmentFilter}
                                                onChange={(e) => {
                                                    setEmployeeDepartmentFilter(e.target.value);
                                                    setShowEmployeeFilter(false);
                                                }}
                                                className="w-full px-2 py-1.5 border border-[#334155] rounded bg-[#1e293b] text-white text-sm"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <option value="all" className="bg-[#1e293b] text-white">All Departments</option>
                                                {[...new Set(employees.map(emp => emp.department).filter(Boolean))].map(dept => (
                                                    <option key={dept} value={dept} className="bg-[#1e293b] text-white">{dept}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    {loading ? (
                        <div className="text-center py-12 text-slate-400">Loading...</div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {employees
                                .filter(emp => employeeDepartmentFilter === 'all' || emp.department === employeeDepartmentFilter)
                                .map(emp => (
                                <div key={emp.id} className="border border-[#1e293b] rounded-xl p-3 bg-[#16213e] hover:bg-[#1a1a2e] transition-all hover:border-[#334155] shadow-sm flex gap-3 min-h-[180px]">
                                    {/* Employee Image - Left Side */}
                                    <div className="flex-shrink-0">
                                        {emp.employee_image ? (
                                            <img 
                                                src={emp.employee_image} 
                                                alt={emp.name} 
                                                className="w-20 h-full min-h-[160px] object-cover rounded-lg border border-[#334155]" 
                                            />
                                        ) : (
                                            <div className="w-20 h-full min-h-[160px] rounded-lg bg-[#1e293b] flex items-center justify-center border border-[#334155]">
                                                <span className="text-4xl">👤</span>
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* Employee Details - Right Side */}
                                    <div className="flex-1 flex flex-col justify-between min-w-0">
                                        <div className="space-y-2">
                                            <h3 className="font-semibold text-base text-white truncate">{emp.name}</h3>
                                            <div className="text-blue-400 font-medium text-sm">{emp.department || 'No Department'}</div>
                                            <div className="text-xs space-y-1.5">
                                                <div>
                                                    <span className="text-slate-500">Gender: </span>
                                                    <span className="text-slate-300">{emp.gender || 'N/A'}</span>
                                                </div>
                                                <div>
                                                    <span className="text-slate-500">Age: </span>
                                                    <span className="text-slate-300">{emp.age || 'N/A'}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 mt-3">
                                            <button 
                                                onClick={() => startEdit(emp)} 
                                                className="p-2 bg-gradient-to-br from-[#2563eb] to-[#1e40af] text-white rounded-lg hover:from-[#1d4ed8] hover:to-[#1e3a8a] transition-all shadow-md shadow-blue-500/20 flex items-center justify-center"
                                                title="Edit Employee"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                                </svg>
                                            </button>
                                            <button 
                                                onClick={() => remove(emp)} 
                                                className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center"
                                                title="Delete Employee"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Add Employee Tab */}
            {activeTab === 'management' && (
                <div className="space-y-6 flex flex-col items-center justify-center min-h-[60vh]">
                    <h2 className="text-xl font-bold w-full text-center">Add Employee</h2>
                    <div className="w-full max-w-lg">
                        <form onSubmit={createEmployee} className="border border-[#1e293b] rounded-2xl p-6 bg-[#16213e] shadow-xl">
                            <div className="mb-4 text-center">
                                <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-gradient-to-br from-[#2563eb] to-[#1e40af] shadow-lg shadow-blue-500/20 mx-auto mb-3">
                                    <span className="text-2xl">➕</span>
                                </div>
                                <h2 className="text-xl font-bold text-white">Add New Employee</h2>
                            </div>
                            
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Full Name</label>
                                    <input 
                                        className="border border-[#334155] rounded-lg p-3 w-full bg-[#1e293b] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
                                        placeholder="Enter employee name" 
                                        value={form.name} 
                                        onChange={e => setForm({ ...form, name: e.target.value })} 
                                        required
                                    />
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">Gender</label>
                                        <select
                                            className="border border-[#334155] rounded-lg p-3 w-full bg-[#1e293b] text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                            value={form.gender}
                                            onChange={e => setForm({ ...form, gender: e.target.value })}
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
                                            value={form.age} 
                                            onChange={e => setForm({ ...form, age: e.target.value })} 
                                            required
                                        />
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Department</label>
                                    <input 
                                        className="border border-[#334155] rounded-lg p-3 w-full bg-[#1e293b] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
                                        placeholder="Enter department name" 
                                        value={form.department} 
                                        onChange={e => setForm({ ...form, department: e.target.value })} 
                                        required
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Employee Photo</label>
                                    <div className="border border-[#334155] rounded-lg p-3 bg-[#1e293b] hover:border-blue-500/50 transition-colors">
                                        <input 
                                            className="w-full text-sm text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 file:cursor-pointer cursor-pointer" 
                                            type="file" 
                                            accept="image/*" 
                                            onChange={e => setImage(e.target.files?.[0] || null)} 
                                        />
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1">Upload a clear photo of the employee's face</p>
                                </div>
                            </div>
                            
                            <div className="flex gap-3 mt-4">
                                <button 
                                    type="submit"
                                    className="flex-1 px-6 py-3 bg-gradient-to-r from-[#2563eb] to-[#1e40af] text-white rounded-lg font-semibold hover:from-[#1d4ed8] hover:to-[#1e3a8a] transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30"
                                >
                                    Add Employee
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Attendance Status Tab - Section 1 */}
            {activeTab === 'attendance' && (
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold">Attendance Status</h2>
                        <div className="flex items-center gap-3">
                            <label className="text-sm font-medium">Date:</label>
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="border border-[#334155] rounded px-3 py-2 bg-[#1e293b] text-white"
                            />
                            <select
                                value={attendanceFilter}
                                onChange={(e) => setAttendanceFilter(e.target.value)}
                                className="border border-[#334155] rounded px-3 py-2 bg-[#1e293b] text-white"
                            >
                                <option value="all">All</option>
                                <option value="present">Present</option>
                                <option value="absent">Absent</option>
                            </select>
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
                                .map(emp => (
                                <div
                                    key={emp.id}
                                    onClick={() => fetchEmployeeHistory(emp.id, emp.name)}
                                    className={`border rounded-xl p-4 shadow-sm transition-all cursor-pointer hover:shadow-md ${
                                        emp.present
                                            ? 'bg-green-900/20 border-green-700/50 hover:border-green-600/50'
                                            : 'bg-[#16213e] border-[#1e293b] hover:border-[#334155]'
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
                                            <div className="font-semibold text-white">{emp.name}</div>
                                            <div className="text-xs text-slate-400">{emp.department}</div>
                                        </div>
                                        <div
                                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                                emp.present
                                                    ? 'bg-green-500 text-white'
                                                    : 'bg-slate-400 text-white'
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
            )}

            {/* Employee Attendance History Modal */}
            {selectedEmployee && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={closeEmployeeModal}>
                    <div className="bg-[#1a1a2e] rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden border border-[#1e293b]" onClick={(e) => e.stopPropagation()}>
                        <div className="p-6 border-b border-[#1e293b] flex items-center justify-between">
                            <h2 className="text-2xl font-bold text-white">Attendance History - {selectedEmployee.name}</h2>
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
                                            <h3 className="text-sm font-semibold mb-2 text-white">Calendar View</h3>
                                            
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
                <div className="space-y-6">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <h2 className="text-xl font-bold">MoodLens</h2>
                        <div className="flex items-center gap-3 flex-wrap">
                            <label className="text-sm font-medium">View:</label>
                            <select
                                value={dateRange}
                                onChange={(e) => setDateRange(e.target.value)}
                                className="border border-[#334155] rounded px-3 py-2 bg-[#1e293b] text-white"
                            >
                                <option value="day" className="bg-[#1e293b] text-white">Today</option>
                                <option value="week" className="bg-[#1e293b] text-white">This Week</option>
                                <option value="month" className="bg-[#1e293b] text-white">This Month</option>
                            </select>
                            
                            {dateRange === 'day' && (
                                <input
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    className="border border-[#334155] rounded px-3 py-2 bg-[#1e293b] text-white"
                                />
                            )}
                            
                            {(dateRange === 'week' || dateRange === 'month') && (
                                <>
                                    <label className="text-xs text-slate-400">From:</label>
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="border border-[#334155] rounded px-3 py-2 bg-[#1e293b] text-white"
                                    />
                                    <label className="text-xs text-slate-400">To:</label>
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="border border-[#334155] rounded px-3 py-2 bg-[#1e293b] text-white"
                                    />
                                </>
                            )}
                            
                            {/* Advanced Filter Toggle Button */}
                            <button
                                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                                className={`p-2 border rounded hover:bg-[#334155] transition-colors ${
                                    showAdvancedFilters ? 'bg-[#334155] border-[#475569]' : 'bg-[#1e293b] border-[#334155]'
                                }`}
                                title="Advanced Filters"
                            >
                                <svg 
                                    xmlns="http://www.w3.org/2000/svg" 
                                    fill="none" 
                                    viewBox="0 0 24 24" 
                                    strokeWidth={1.5} 
                                    stroke="currentColor" 
                                    className="w-5 h-5 text-slate-600"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Advanced Filters (Gender and Department) */}
                    {showAdvancedFilters && (
                        <div className="bg-[#16213e] p-4 rounded-lg border border-[#1e293b]">
                            <div className="flex items-center gap-4 flex-wrap">
                                <div className="flex items-center gap-2">
                                    <label className="text-sm font-medium text-white">Gender:</label>
                                    <select
                                        value={emotionGenderFilter}
                                        onChange={(e) => setEmotionGenderFilter(e.target.value)}
                                        className="border border-[#334155] rounded px-3 py-2 bg-[#1e293b] text-white"
                                    >
                                        <option value="all" className="bg-[#1e293b] text-white">All Genders</option>
                                        {[...new Set(employees.map(emp => emp.gender).filter(Boolean))].map(gender => (
                                            <option key={gender} value={gender} className="bg-[#1e293b] text-white">{gender}</option>
                                        ))}
                                    </select>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                    <label className="text-sm font-medium text-white">Department:</label>
                                    <select
                                        value={emotionDepartmentFilter}
                                        onChange={(e) => setEmotionDepartmentFilter(e.target.value)}
                                        className="border border-[#334155] rounded px-3 py-2 bg-[#1e293b] text-white"
                                    >
                                        <option value="all" className="bg-[#1e293b] text-white">All Departments</option>
                                        {[...new Set(employees.map(emp => emp.department).filter(Boolean))].map(dept => (
                                            <option key={dept} value={dept} className="bg-[#1e293b] text-white">{dept}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {attendanceLoading ? (
                        <div className="text-center py-12 text-slate-500">Loading emotion data...</div>
                    ) : emotionData.length > 0 ? (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="bg-[#16213e] border border-[#1e293b] rounded-xl p-6 shadow-sm">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold text-white">
                                        {emotionViewMode === 'positiveNegative' ? 'Feeling Distribution' : 'Emotion Distribution'}
                                    </h3>
                                    {emotionViewMode === 'individual' && (
                                        <button
                                            onClick={() => setEmotionViewMode('positiveNegative')}
                                            className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                                        >
                                            ← Back to Overview
                                        </button>
                                    )}
                                </div>
                                <div 
                                    className="cursor-pointer"
                                    onClick={() => {
                                        if (emotionViewMode === 'positiveNegative') {
                                            setEmotionViewMode('individual');
                                        }
                                    }}
                                >
                                    <ResponsiveContainer width="100%" height={400}>
                                        <PieChart>
                                            <Pie
                                                data={emotionViewMode === 'positiveNegative' ? getPositiveNegativeData() : emotionData}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={false}
                                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                                outerRadius={120}
                                                fill="#8884d8"
                                                dataKey="value"
                                            >
                                                {(emotionViewMode === 'positiveNegative' ? getPositiveNegativeData() : emotionData).map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    {emotionViewMode === 'positiveNegative' && (
                                        <p className="text-center text-sm text-slate-400 mt-2">Click on the chart to see individual emotions</p>
                                    )}
                                </div>
                            </div>
                            
                            <div className="bg-[#16213e] border border-[#1e293b] rounded-xl p-6 shadow-sm">
                                <h3 className="text-lg font-semibold mb-4 text-white">Emotion Summary</h3>
                                <div className="space-y-3">
                                    {emotionData.map((emotion, index) => {
                                        const totalCheckIns = emotionData.reduce((sum, e) => sum + e.value, 0);
                                        return (
                                            <div key={index} className="flex items-center justify-between p-3 bg-[#1e293b] rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className="w-4 h-4 rounded-full"
                                                        style={{ backgroundColor: emotion.color }}
                                                    />
                                                    <span className="font-medium text-white">{emotion.name}</span>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <span className="text-slate-300">{emotion.value} check-ins</span>
                                                    <span className="text-slate-400">
                                                        ({totalCheckIns > 0 ? ((emotion.value / totalCheckIns) * 100).toFixed(1) : 0}%)
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="mt-6 p-4 bg-blue-900/20 rounded-lg border border-blue-700/50">
                                    <div className="text-sm font-semibold text-blue-300 mb-1">
                                        Total Check-ins {dateRange === 'day' ? 'Today' : dateRange === 'week' ? 'This Week' : 'This Month'}
                                    </div>
                                    <div className="text-2xl font-bold text-blue-400">
                                        {emotionData.reduce((sum, e) => sum + e.value, 0)}
                                    </div>
                                    {dateRange !== 'day' && (
                                        <div className="text-xs text-blue-300 mt-1">
                                            {startDate} to {endDate}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-[#16213e] rounded-xl border border-[#1e293b]">
                            <p className="text-slate-300">
                                No emotion data found {dateRange === 'day' ? 'for this date' : `for ${dateRange === 'week' ? 'this week' : 'this month'}`}.
                            </p>
                            <p className="text-sm text-slate-500 mt-2">Employees need to check in at the kiosk to see emotion data.</p>
                        </div>
                    )}
                        </div>
                    )}
                    </div>
                </div>
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
                    <div className={`fixed right-0 top-0 h-full w-full max-w-md bg-[#16213e] border-l border-[#1e293b] shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
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
                                    
                                    <div className="grid grid-cols-2 gap-4">
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
    );
}
