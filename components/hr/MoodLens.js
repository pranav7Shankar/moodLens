'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

export default function MoodLens({
  dateRange,
  setDateRange,
  selectedDate,
  setSelectedDate,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  showAdvancedFilters,
  setShowAdvancedFilters,
  emotionGenderFilter,
  setEmotionGenderFilter,
  emotionDepartmentFilter,
  setEmotionDepartmentFilter,
  employees,
  attendanceLoading,
  emotionData,
  emotionViewMode,
  setEmotionViewMode,
  getPositiveNegativeData
}) {
  return (
    <div className="space-y-6">
      <div className="w-full">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h2 className="text-2xl md:text-3xl font-extrabold orbitron">Mood Dashboard</h2>

          <div className="w-full md:w-auto">
            <div className="flex flex-col md:flex-row md:items-center gap-3">
              <div className="flex items-center gap-2 w-full md:w-40">
                <label className="sr-only">View</label>
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="w-full border border-[#334155] rounded px-2 md:px-3 py-2 bg-[#1e293b] text-white text-sm"
                >
                  <option value="day">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                </select>

                {/* Filter Icon for small devices */}
                <button
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className={`w-10 h-10 flex-none rounded border border-[#334155] flex items-center justify-center transition-colors sm:hidden ${
                    showAdvancedFilters ? 'bg-[#334155]' : 'bg-[#1e293b]'
                  }`}
                  title="Advanced Filters"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-white">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
                  </svg>
                </button>
              </div>

              <div className="flex items-center gap-3 w-full">
                {dateRange === 'day' ? (
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="flex-1 border border-[#334155] rounded px-2 md:px-3 py-2 bg-[#1e293b] text-white text-sm"
                  />
                ) : (
                  <div className="flex gap-3 flex-1">
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="flex-1 border border-[#334155] rounded px-2 md:px-3 py-2 bg-[#1e293b] text-white text-sm"
                    />
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="flex-1 border border-[#334155] rounded px-2 md:px-3 py-2 bg-[#1e293b] text-white text-sm"
                    />
                  </div>
                )}

                {/* Filter Icon for medium+ devices */}
                <button
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className={`w-10 h-10 flex-none rounded border border-[#334155] items-center justify-center transition-colors hidden sm:flex ${
                    showAdvancedFilters ? 'bg-[#334155]' : 'bg-[#1e293b]'
                  }`}
                  title="Advanced Filters"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-white">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Filters Section */}
      {showAdvancedFilters && (
        <div className="bg-[#16213e] p-4 rounded-lg border border-[#1e293b]">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 flex-1">
              <label className="text-sm font-medium text-white whitespace-nowrap">Gender:</label>
              <select
                value={emotionGenderFilter}
                onChange={(e) => setEmotionGenderFilter(e.target.value)}
                className="border border-[#334155] rounded px-2 md:px-3 py-2 bg-[#1e293b] text-white text-sm flex-1"
              >
                <option value="all">All Genders</option>
                {[...new Set(employees.map(emp => emp.gender).filter(Boolean))].map(gender => (
                  <option key={gender} value={gender}>{gender}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-2 flex-1">
              <label className="text-sm font-medium text-white whitespace-nowrap">Department:</label>
              <select
                value={emotionDepartmentFilter}
                onChange={(e) => setEmotionDepartmentFilter(e.target.value)}
                className="border border-[#334155] rounded px-2 md:px-3 py-2 bg-[#1e293b] text-white text-sm flex-1"
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

      {/* Chart Section */}
      {attendanceLoading ? (
        <div className="text-center py-12 text-slate-500">Loading emotion data...</div>
      ) : emotionData.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          <div className="bg-[#16213e] border border-[#1e293b] rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white orbitron">
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
                if (emotionViewMode === 'positiveNegative') setEmotionViewMode('individual');
              }}
            >
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={emotionViewMode === 'positiveNegative' ? getPositiveNegativeData() : emotionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={
                        typeof window !== "undefined" && window.innerWidth >= 768
                        ? ({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`
                        : false
                    }
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
            <h3 className="text-lg font-semibold mb-4 text-white orbitron">Emotion Summary</h3>
            <div className="space-y-3">
              {emotionData.map((emotion, index) => {
                const totalCheckIns = emotionData.reduce((sum, e) => sum + e.value, 0);
                return (
                  <div key={index} className="flex items-center justify-between p-3 bg-[#1e293b] rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: emotion.color }} />
                      <span className="font-medium text-white orbitron">{emotion.name}</span>
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
  );
}
