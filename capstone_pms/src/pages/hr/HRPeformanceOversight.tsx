import React, { useState, useMemo } from 'react';
import { Search, ChevronDown, Download } from 'lucide-react';

const HRPerformanceOversight = () => {
  // State for filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('All Departments');
  const [selectedOutcome, setSelectedOutcome] = useState('All Outcomes');

  const employees = [
    { id: 1, name: 'Sarah Johnson', initials: 'SJ', dept: 'Engineering', pos: 'Senior Developer', performance: 'Exceeds Expectations', lastReview: '15/12/2024', status: 'Pending' },
    { id: 2, name: 'James Wilson', initials: 'JW', dept: 'Engineering', pos: 'Frontend Developer', performance: 'Meets Expectations', lastReview: '10/12/2024', status: 'Completed' },
    { id: 3, name: 'Lisa Martinez', initials: 'LM', dept: 'Engineering', pos: 'Backend Developer', performance: 'Outstanding', lastReview: '12/12/2024', status: 'Completed' },
    { id: 4, name: 'Robert Taylor', initials: 'RT', dept: 'Engineering', pos: 'DevOps Engineer', performance: 'Meets Expectations', lastReview: '20/11/2024', status: 'In Progress' },
    { id: 5, name: 'Michael Chen', initials: 'MC', dept: 'Product', pos: 'Product Manager', performance: 'Exceeds Expectations', lastReview: '05/01/2025', status: 'Completed' },
  ];

  // Filter Logic
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const matchesSearch = emp.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDept = selectedDept === 'All Departments' || emp.dept === selectedDept;
      const matchesOutcome = selectedOutcome === 'All Outcomes' || emp.performance === selectedOutcome;
      return matchesSearch && matchesDept && matchesOutcome;
    });
  }, [searchTerm, selectedDept, selectedOutcome]);

  return (
    <div className="p-8 bg-gray-50 min-h-screen font-sans text-gray-800">
      {/* Header */}
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Performance Oversight</h1>
        <p className="text-gray-500">Organization-wide performance reports</p>
      </header>

      {/* Filter Bar Card */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search employees..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>

          {/* Dropdowns */}
          <div className="flex gap-4">
            <FilterSelect 
              value={selectedDept}
              onChange={setSelectedDept}
              options={['All Departments', 'Engineering', 'Product', 'Sales', 'Marketing']}
            />
            <FilterSelect 
              value={selectedOutcome}
              onChange={setSelectedOutcome}
              options={['All Outcomes', 'Outstanding', 'Exceeds Expectations', 'Meets Expectations']}
            />
          </div>
        </div>

        <div className="flex justify-between items-center mt-6">
          <span className="text-sm text-gray-500 font-medium">{filteredEmployees.length} results</span>
          <button className="flex items-center gap-2 text-blue-600 text-sm font-semibold hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors">
            <Download size={16} />
            Export Report
          </button>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="px-6 py-4 text-sm font-bold text-gray-700">Employee</th>
              <th className="px-6 py-4 text-sm font-bold text-gray-700">Department</th>
              <th className="px-6 py-4 text-sm font-bold text-gray-700">Position</th>
              <th className="px-6 py-4 text-sm font-bold text-gray-700">Performance</th>
              <th className="px-6 py-4 text-sm font-bold text-gray-700">Last Review</th>
              <th className="px-6 py-4 text-sm font-bold text-gray-700">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredEmployees.length > 0 ? (
              filteredEmployees.map((emp) => (
                <tr key={emp.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-xs">
                        {emp.initials}
                      </div>
                      <span className="font-medium text-gray-900">{emp.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{emp.dept}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{emp.pos}</td>
                  <td className="px-6 py-4">
                    <PerformanceBadge label={emp.performance} />
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{emp.lastReview}</td>
                  <td className="px-6 py-4">
                    <StatusBadge label={emp.status} />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  No employees found matching your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* Helper Components */

const FilterSelect = ({ value, onChange, options }: { value: string, onChange: (val: string) => void, options: string[] }) => (
  <div className="relative min-w-[180px]">
    <select 
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="appearance-none w-full px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 bg-white hover:bg-gray-50 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/20"
    >
      {options.map(opt => (
        <option key={opt} value={opt}>{opt}</option>
      ))}
    </select>
    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
  </div>
);

const PerformanceBadge = ({ label }: { label: string }) => {
  const styles: Record<string, string> = {
    'Exceeds Expectations': 'bg-blue-50 text-blue-600 border-blue-100',
    'Meets Expectations': 'bg-green-50 text-green-600 border-green-100',
    'Outstanding': 'bg-purple-50 text-purple-600 border-purple-100',
  };
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${styles[label] || 'bg-gray-50 text-gray-600 border-gray-100'}`}>
      {label}
    </span>
  );
};

const StatusBadge = ({ label }: { label: string }) => {
  const styles: Record<string, string> = {
    'Pending': 'bg-orange-50 text-orange-600 border-orange-100',
    'Completed': 'bg-green-50 text-green-600 border-green-100',
    'In Progress': 'bg-yellow-50 text-yellow-700 border-yellow-100',
  };
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${styles[label]}`}>
      {label}
    </span>
  );
};

export default HRPerformanceOversight;