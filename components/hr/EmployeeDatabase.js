'use client';

export default function EmployeeDatabase({ 
    employees, 
    loading, 
    employeeDepartmentFilter, 
    setEmployeeDepartmentFilter,
    showEmployeeFilter,
    setShowEmployeeFilter,
    startEdit,
    remove
}) {
    return (
        <div className="space-y-4 md:space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 relative">
                <div className="flex items-center gap-3">
                    <h2 className="text-2xl md:text-3xl font-extrabold orbitron">Employee Database</h2>
                    <span className="text-sm text-slate-400">
                        ({employeeDepartmentFilter === 'all' ? employees.length : employees.filter(emp => emp.department === employeeDepartmentFilter).length} employees)
                    </span>
                </div>
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
            {loading ? (
                <div className="text-center py-12 text-slate-400">Loading...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {employees
                        .filter(emp => employeeDepartmentFilter === 'all' || emp.department === employeeDepartmentFilter)
                        .map(emp => (
                        <div key={emp.id} className="border border-[#1e293b] rounded-xl p-3 bg-[#16213e] hover:bg-[#1a1a2e] transition-all hover:border-[#334155] shadow-sm flex gap-3 h-[200px] relative">
                            {/* Employee Image - Left Side (1/3 width) */}
                            <div className="w-1/3 flex-shrink-0 h-full">
                                {emp.employee_image ? (
                                    <img 
                                        src={emp.employee_image} 
                                        alt={emp.name} 
                                        className="w-full h-full object-cover rounded-lg border border-[#334155]" 
                                    />
                                ) : (
                                    <div className="w-full h-full rounded-lg bg-[#1e293b] flex items-center justify-center border border-[#334155]">
                                        <span className="text-4xl">👤</span>
                                    </div>
                                )}
                            </div>
                            
                            {/* Employee Details - Right Side (2/3 width) */}
                            <div className="w-2/3 flex flex-col min-w-0 pr-12">
                                <div className="space-y-2 flex-1">
                                    <h3 className="font-semibold text-lg text-white truncate orbitron">{emp.name}</h3>
                                    <div className="text-blue-400 font-medium text-base">{emp.department || 'No Department'}</div>
                                    <div className="text-sm space-y-2">
                                        <div>
                                            <span className="text-slate-500">Gender: </span>
                                            <span className="text-slate-300">{emp.gender || 'N/A'}</span>
                                        </div>
                                        <div>
                                            <span className="text-slate-500">Age: </span>
                                            <span className="text-slate-300">{emp.age || 'N/A'}</span>
                                        </div>
                                        <div className="relative mb-4">
                                            <span className="text-slate-500">Email: </span>
                                            <div className="mt-1 relative w-full max-w-[calc(100%-0.5rem)]">
                                                <div className="absolute inset-0 bg-slate-300/10 rounded border border-slate-600/30 animate-pulse transition-all duration-300"></div>
                                                <span className="relative text-slate-300 block truncate pr-2 py-1 min-h-[24px]">{emp.email || 'N/A'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Action Buttons - Bottom Right, Stacked Vertically */}
                            <div className="absolute bottom-3 right-3 flex flex-col gap-2">
                                <button 
                                    onClick={() => startEdit(emp)} 
                                    className="p-2 bg-blue-900/40 border border-blue-800/50 text-blue-300 rounded-lg hover:bg-blue-900/60 hover:border-blue-700/50 transition-colors flex items-center justify-center"
                                    title="Edit Employee"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                    </svg>
                                </button>
                                <button 
                                    onClick={() => remove(emp)} 
                                    className="p-2 bg-red-900/40 border border-red-800/50 text-red-300 rounded-lg hover:bg-red-900/60 hover:border-red-700/50 transition-colors flex items-center justify-center"
                                    title="Delete Employee"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

