'use client';

export default function AddEmployeeForm({ form, setForm, image, setImage, createEmployee }) {
    return (
        <div className="space-y-6 flex flex-col items-center justify-center min-h-[60vh]">
            <h2 className="text-2xl md:text-3xl font-extrabold w-full text-center orbitron">Add Employee</h2>
            <div className="w-full max-w-lg">
                <form onSubmit={createEmployee} className="border border-[#1e293b] rounded-2xl p-6 bg-[#16213e] shadow-xl">
                    <div className="mb-4 text-center">
                        <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-gradient-to-br from-[#2563eb] to-[#1e40af] shadow-lg shadow-blue-500/20 mx-auto mb-3">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-7 h-7 text-white">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM3 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 019.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
                            </svg>
                        </div>
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
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                            <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
                            <input 
                                className="border border-[#334155] rounded-lg p-3 w-full bg-[#1e293b] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
                                placeholder="Enter email address" 
                                type="email"
                                value={form.email} 
                                onChange={e => setForm({ ...form, email: e.target.value })} 
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
    );
}

