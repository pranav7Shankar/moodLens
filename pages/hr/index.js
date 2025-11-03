import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, RadialBarChart, RadialBar } from 'recharts';

export async function getServerSideProps({ req }) {
    const cookies = req.headers.cookie || '';
    const authed = cookies.includes('hr_auth=1');
    if (!authed) {
        return { redirect: { destination: '/hr/login', permanent: false } };
    }
    return { props: {} };
}

export default function HRDashboard() {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [form, setForm] = useState({ name: '', gender: '', age: '', department: '' });
    const [image, setImage] = useState(null);
    const [editing, setEditing] = useState(null);
    const [activeTab, setActiveTab] = useState('employees'); // 'employees', 'attendance', 'emotions'
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
        setForm({ name: emp.name || '', gender: emp.gender || '', age: emp.age || '', department: emp.department || '' });
        setImage(null);
    };

    const saveEdit = async (e) => {
        e.preventDefault();
        if (!editing) return;
        const fd = new FormData();
        if (form.name) fd.append('name', form.name);
        if (form.gender) fd.append('gender', form.gender);
        if (form.age) fd.append('age', form.age);
        if (form.department) fd.append('department', form.department);
        if (image) fd.append('image', image);
        try {
            const res = await fetch(`/api/employees/${editing.id}`, { method: 'PUT', body: fd });
            if (!res.ok) throw new Error('Update failed');
            setEditing(null);
            setForm({ name: '', gender: '', age: '', department: '' });
            setImage(null);
            await fetchEmployees();
        } catch (e) {
            setError('Failed to update employee');
        }
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
        window.location.href = '/hr/login';
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
                    color: COLORS[emotionStr.toUpperCase()] || COLORS.UNKNOWN
                };
            });
    };

    const attendanceStatus = getAttendanceStatus();
    const emotionData = getEmotionData();

    return (
        <div className="min-h-screen bg-[#0f0f23] text-white">
            {/* Header */}
            <div className="bg-[#1a1a2e] border-b border-[#1e293b]">
                <div className="max-w-full mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-bold text-white">HR Dashboard</h1>
                        <button onClick={logout} className="px-3 py-1 bg-[#16213e] rounded hover:bg-[#1e293b] border border-[#1e293b] transition-colors text-white">Logout</button>
                    </div>
                </div>
            </div>

            {error && <div className="max-w-full mx-auto px-4 pt-4 text-red-400 bg-red-900/20 border border-red-800/50 rounded-lg p-3">{error}</div>}

            <div className="flex">
                {/* Left Sidebar */}
                <div className="w-64 bg-[#0d1117] border-r border-[#1e293b] min-h-[calc(100vh-80px)]">
                    <nav className="p-4">
                        <button
                            onClick={() => setActiveTab('employees')}
                            className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors mb-2 ${
                                activeTab === 'employees'
                                    ? 'bg-gradient-to-r from-[#9333ea] to-[#ec4899] text-white shadow-lg shadow-purple-500/20'
                                    : 'text-slate-300 hover:bg-[#16213e] hover:text-white'
                            }`}
                        >
                            Employees
                        </button>
                        <button
                            onClick={() => setActiveTab('attendance')}
                            className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors mb-2 ${
                                activeTab === 'attendance'
                                    ? 'bg-gradient-to-r from-[#9333ea] to-[#ec4899] text-white shadow-lg shadow-purple-500/20'
                                    : 'text-slate-300 hover:bg-[#16213e] hover:text-white'
                            }`}
                        >
                            Attendance Status
                        </button>
                        <button
                            onClick={() => setActiveTab('emotions')}
                            className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors ${
                                activeTab === 'emotions'
                                    ? 'bg-gradient-to-r from-[#9333ea] to-[#ec4899] text-white shadow-lg shadow-purple-500/20'
                                    : 'text-slate-300 hover:bg-[#16213e] hover:text-white'
                            }`}
                        >
                            Collective Emotions
                        </button>
                    </nav>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 px-6 py-6 bg-[#0f0f23]">

            {/* Employees Tab */}
            {activeTab === 'employees' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <form onSubmit={editing ? saveEdit : createEmployee} className="border border-[#1e293b] rounded-xl p-4 bg-[#16213e] shadow-sm">
                    <h2 className="font-semibold mb-3 text-white">{editing ? 'Edit Employee' : 'Add Employee'}</h2>
                    <input className="border border-[#1e293b] rounded p-2 mb-2 w-full bg-[#1e293b] text-white placeholder-slate-400" placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                    <input className="border border-[#1e293b] rounded p-2 mb-2 w-full bg-[#1e293b] text-white placeholder-slate-400" placeholder="Gender" value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })} />
                    <input className="border border-[#1e293b] rounded p-2 mb-2 w-full bg-[#1e293b] text-white placeholder-slate-400" placeholder="Age" type="number" value={form.age} onChange={e => setForm({ ...form, age: e.target.value })} />
                    <input className="border border-[#1e293b] rounded p-2 mb-2 w-full bg-[#1e293b] text-white placeholder-slate-400" placeholder="Department" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} />
                    <input className="border border-[#1e293b] rounded p-2 mb-3 w-full bg-[#1e293b] text-white" type="file" accept="image/*" onChange={e => setImage(e.target.files?.[0] || null)} />
                    <div className="flex gap-2">
                            <button className="px-4 py-2 bg-gradient-to-r from-[#9333ea] to-[#ec4899] text-white rounded hover:from-[#7e22ce] hover:to-[#db2777] transition-colors shadow-lg shadow-purple-500/20">{editing ? 'Save' : 'Add'}</button>
                            {editing && <button type="button" onClick={() => { setEditing(null); setForm({ name:'', gender:'', age:'', department:'' }); setImage(null); }} className="px-4 py-2 bg-[#1e293b] border border-[#334155] rounded hover:bg-[#334155] transition-colors text-white">Cancel</button>}
                    </div>
                </form>

                    <div className="border border-[#1e293b] rounded-xl p-4 bg-[#16213e] shadow-sm">
                    <h2 className="font-semibold mb-3 text-white">Employees ({employees.length})</h2>
                        {loading ? <div className="text-center py-8 text-slate-400">Loading...</div> : (
                        <div className="space-y-3 max-h-[32rem] overflow-y-auto">
                            {employees.map(emp => (
                                    <div key={emp.id} className="border border-[#1e293b] rounded p-3 flex items-center gap-3 hover:bg-[#1e293b] transition-colors">
                                    {emp.employee_image && <img src={emp.employee_image} alt={emp.name} className="w-16 h-16 object-cover rounded" />}
                                    <div className="flex-1">
                                        <div className="font-semibold text-white">{emp.name}</div>
                                        <div className="text-sm text-slate-400">{emp.gender} • {emp.age} • {emp.department}</div>
                                    </div>
                                        <button onClick={() => startEdit(emp)} className="px-3 py-1 bg-[#f59e0b] text-white rounded hover:bg-[#d97706] transition-colors">Edit</button>
                                        <button onClick={() => remove(emp)} className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors">Delete</button>
                                    </div>
                                ))}
                            </div>
                        )}
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
                                className="border rounded px-3 py-2"
                            />
                        </div>
                    </div>

                    {attendanceLoading ? (
                        <div className="text-center py-12 text-slate-500">Loading attendance records...</div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {attendanceStatus.map(emp => (
                                <div
                                    key={emp.id}
                                    onClick={() => fetchEmployeeHistory(emp.id, emp.name)}
                                    className={`border rounded-xl p-4 shadow-sm transition-all cursor-pointer hover:shadow-md ${
                                        emp.present
                                            ? 'bg-green-50 border-green-200 hover:border-green-300'
                                            : 'bg-slate-50 border-slate-200 hover:border-slate-300'
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
                                            <div className="font-semibold text-slate-900">{emp.name}</div>
                                            <div className="text-xs text-slate-600">{emp.department}</div>
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
                                        <div className="mt-3 pt-3 border-t border-slate-200">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-slate-600">Time:</span>
                                                <span className="text-xs text-slate-500">
                                                    {new Date(emp.attendanceRecord.timestamp).toLocaleTimeString()}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                    <div className="mt-2 pt-2 border-t border-slate-200">
                                        <p className="text-xs text-slate-500 text-center">Click to view history</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {attendanceStatus.length === 0 && !attendanceLoading && (
                        <div className="text-center py-12 bg-slate-50 rounded-xl border border-slate-200">
                            <p className="text-slate-600">No employees found. Add employees first.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Employee Attendance History Modal */}
            {selectedEmployee && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={closeEmployeeModal}>
                    <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                            <h2 className="text-2xl font-bold">Attendance History - {selectedEmployee.name}</h2>
                            <button
                                onClick={closeEmployeeModal}
                                className="text-slate-500 hover:text-slate-700 text-2xl font-bold"
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
                                        <div className="border rounded-xl p-3 bg-slate-50 flex-shrink-0 overflow-hidden">
                                            <h3 className="text-sm font-semibold mb-2">Calendar View</h3>
                                            
                                            {/* Calendar Controls - Disabled when filter is active */}
                                            <div className="flex items-center justify-between mb-2 gap-1">
                                                <button
                                                    onClick={() => changeMonth('prev')}
                                                    disabled={historyFilter !== 'all'}
                                                    className="px-1.5 py-0.5 bg-white border border-slate-300 rounded hover:bg-slate-100 transition-colors text-xs disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                                                >
                                                    ←
                                                </button>
                                                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                                    <select
                                                        value={calendarMonth}
                                                        onChange={(e) => setCalendarMonth(Number(e.target.value))}
                                                        disabled={historyFilter !== 'all'}
                                                        className="px-1.5 py-0.5 border border-slate-300 rounded bg-white text-xs disabled:opacity-50 disabled:cursor-not-allowed flex-1 min-w-0"
                                                    >
                                                        {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((month, idx) => (
                                                            <option key={idx} value={idx}>{month}</option>
                                                        ))}
                                                    </select>
                                                    <select
                                                        value={calendarYear}
                                                        onChange={(e) => setCalendarYear(Number(e.target.value))}
                                                        disabled={historyFilter !== 'all'}
                                                        className="px-1.5 py-0.5 border border-slate-300 rounded bg-white text-xs disabled:opacity-50 disabled:cursor-not-allowed flex-1 min-w-0"
                                                    >
                                                        {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 1 + i).map(year => (
                                                            <option key={year} value={year}>{year}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <button
                                                    onClick={() => changeMonth('next')}
                                                    disabled={historyFilter !== 'all'}
                                                    className="px-1.5 py-0.5 bg-white border border-slate-300 rounded hover:bg-slate-100 transition-colors text-xs disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                                                >
                                                    →
                                                </button>
                                            </div>

                                            {/* Calendar Grid - Prevent overflow */}
                                            <div className="bg-white rounded-lg border border-slate-200 p-2 w-full overflow-hidden">
                                                {/* Day Headers */}
                                                <div className="grid grid-cols-7 gap-0.5 mb-1">
                                                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
                                                        <div key={day} className="text-center text-xs font-semibold text-slate-600 py-0.5 truncate">
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
                                                                className={`aspect-square p-0.5 text-center text-xs rounded transition-all flex items-center justify-center ${
                                                                    attendance?.present
                                                                        ? 'bg-green-100 border border-green-500 font-semibold'
                                                                        : attendance || absent
                                                                            ? 'bg-red-100 border border-red-300'
                                                                            : isSelectedMonth
                                                                                ? 'hover:bg-slate-100'
                                                                                : 'text-slate-300'
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
                                                    <div className="w-2.5 h-2.5 bg-green-100 border border-green-500 rounded flex-shrink-0"></div>
                                                    <span className="truncate">Present</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <div className="w-2.5 h-2.5 bg-red-100 border border-red-300 rounded flex-shrink-0"></div>
                                                    <span className="truncate">Absent</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <div className="w-2.5 h-2.5 bg-white border border-slate-200 rounded flex-shrink-0"></div>
                                                    <span className="truncate">None</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right Side - Attendance Rate and Records */}
                                    <div className="overflow-y-auto max-h-[calc(90vh-180px)] min-w-0">
                                        {/* Attendance Percentage Graph */}
                                        <div className="p-3 bg-white border border-slate-200 rounded-lg mb-4 flex-shrink-0">
                                            <div className="text-xs text-slate-600 mb-2">Attendance Rate</div>
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
                                                        <span className="text-sm font-bold text-slate-900">
                                                            {calculateAttendancePercentage()}%
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-2xl font-bold text-slate-900 truncate">
                                                        {calculateAttendancePercentage()}%
                                                    </div>
                                                    <div className="text-xs text-slate-500 mt-1 truncate">
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
                                                    className="px-2 py-1 border border-slate-300 rounded bg-white text-xs"
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
                                                            className="px-2 py-1 border border-slate-300 rounded bg-white text-xs"
                                                        >
                                                            {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map((month, idx) => (
                                                                <option key={idx} value={idx}>{month}</option>
                                                            ))}
                                                        </select>
                                                        <select
                                                            value={historyFilterYear}
                                                            onChange={(e) => setHistoryFilterYear(Number(e.target.value))}
                                                            className="px-2 py-1 border border-slate-300 rounded bg-white text-xs"
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
                                                        className="px-2 py-1 border border-slate-300 rounded bg-white text-xs"
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
                                                                ? 'bg-green-50 border-green-200'
                                                                : 'bg-red-50 border-red-200'
                                                        }`}
                                                    >
                                                        <div className="flex items-center gap-3 min-w-0 flex-1">
                                                            <span className="font-medium text-slate-900 truncate">
                                                                {formatDate(record.date)}
                                                            </span>
                                                            {record.present && (
                                                                <span className="text-slate-600 flex-shrink-0">
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

            {/* Collective Emotions Tab - Section 2 */}
            {activeTab === 'emotions' && (
                <div className="space-y-6">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <h2 className="text-xl font-bold">Collective Employee Emotions</h2>
                        <div className="flex items-center gap-3 flex-wrap">
                            <label className="text-sm font-medium">View:</label>
                            <select
                                value={dateRange}
                                onChange={(e) => setDateRange(e.target.value)}
                                className="border rounded px-3 py-2"
                            >
                                <option value="day">Today</option>
                                <option value="week">This Week</option>
                                <option value="month">This Month</option>
                            </select>
                            
                            {dateRange === 'day' && (
                                <input
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    className="border rounded px-3 py-2"
                                />
                            )}
                            
                            {(dateRange === 'week' || dateRange === 'month') && (
                                <>
                                    <label className="text-xs text-slate-600">From:</label>
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="border rounded px-3 py-2"
                                    />
                                    <label className="text-xs text-slate-600">To:</label>
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="border rounded px-3 py-2"
                                    />
                                </>
                            )}
                            
                            {/* Advanced Filter Toggle Button */}
                            <button
                                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                                className={`p-2 border rounded hover:bg-slate-100 transition-colors ${
                                    showAdvancedFilters ? 'bg-slate-100 border-slate-300' : 'bg-white border-slate-300'
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
                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                            <div className="flex items-center gap-4 flex-wrap">
                                <div className="flex items-center gap-2">
                                    <label className="text-sm font-medium">Gender:</label>
                                    <select
                                        value={emotionGenderFilter}
                                        onChange={(e) => setEmotionGenderFilter(e.target.value)}
                                        className="border rounded px-3 py-2 bg-white"
                                    >
                                        <option value="all">All Genders</option>
                                        {[...new Set(employees.map(emp => emp.gender).filter(Boolean))].map(gender => (
                                            <option key={gender} value={gender}>{gender}</option>
                                        ))}
                                    </select>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                    <label className="text-sm font-medium">Department:</label>
                                    <select
                                        value={emotionDepartmentFilter}
                                        onChange={(e) => setEmotionDepartmentFilter(e.target.value)}
                                        className="border rounded px-3 py-2 bg-white"
                                    >
                                        <option value="all">All Departments</option>
                                        {[...new Set(employees.map(emp => emp.department).filter(Boolean))].map(dept => (
                                            <option key={dept} value={dept}>{dept}</option>
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
                            <div className="bg-white border rounded-xl p-6 shadow-sm">
                                <h3 className="text-lg font-semibold mb-4">Emotion Distribution</h3>
                                <ResponsiveContainer width="100%" height={400}>
                                    <PieChart>
                                        <Pie
                                            data={emotionData}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                            outerRadius={120}
                                            fill="#8884d8"
                                            dataKey="value"
                                        >
                                            {emotionData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            
                            <div className="bg-white border rounded-xl p-6 shadow-sm">
                                <h3 className="text-lg font-semibold mb-4">Emotion Summary</h3>
                                <div className="space-y-3">
                                    {emotionData.map((emotion, index) => {
                                        const totalCheckIns = emotionData.reduce((sum, e) => sum + e.value, 0);
                                        return (
                                            <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className="w-4 h-4 rounded-full"
                                                        style={{ backgroundColor: emotion.color }}
                                                    />
                                                    <span className="font-medium">{emotion.name}</span>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <span className="text-slate-600">{emotion.value} check-ins</span>
                                                    <span className="text-slate-400">
                                                        ({totalCheckIns > 0 ? ((emotion.value / totalCheckIns) * 100).toFixed(1) : 0}%)
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                    <div className="text-sm font-semibold text-blue-900 mb-1">
                                        Total Check-ins {dateRange === 'day' ? 'Today' : dateRange === 'week' ? 'This Week' : 'This Month'}
                                    </div>
                                    <div className="text-2xl font-bold text-blue-600">
                                        {emotionData.reduce((sum, e) => sum + e.value, 0)}
                                    </div>
                                    {dateRange !== 'day' && (
                                        <div className="text-xs text-blue-700 mt-1">
                                            {startDate} to {endDate}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-slate-50 rounded-xl border border-slate-200">
                            <p className="text-slate-600">
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
    );
}
