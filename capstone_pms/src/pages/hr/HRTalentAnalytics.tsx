import React from 'react';
import { Users, Award, TrendingUp } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell 
} from 'recharts';

// --- Mock Data ---
const performanceTrends = [
  { name: 'Jul', Outstanding: 12, Exceeds: 38, Meets: 125, NeedsImprovement: 20 },
  { name: 'Aug', Outstanding: 14, Exceeds: 41, Meets: 122, NeedsImprovement: 18 },
  { name: 'Sep', Outstanding: 15, Exceeds: 43, Meets: 120, NeedsImprovement: 19 },
  { name: 'Oct', Outstanding: 15, Exceeds: 44, Meets: 118, NeedsImprovement: 19 },
  { name: 'Nov', Outstanding: 16, Exceeds: 44, Meets: 120, NeedsImprovement: 18 },
  { name: 'Dec', Outstanding: 15, Exceeds: 45, Meets: 120, NeedsImprovement: 18 },
];

const distributionData = [
  { name: 'meets', value: 60, color: '#22C55E' },
  { name: 'exceeds', value: 23, color: '#3B82F6' },
  { name: 'outstanding', value: 8, color: '#A855F7' },
  { name: 'needs improvement', value: 9, color: '#EAB308' },
  { name: 'unsatisfactory', value: 1, color: '#EF4444' },
];

const deptPerformance = [
  { name: 'Engineering', count: 65, score: 4.2 },
  { name: 'Product', count: 28, score: 4.1 },
  { name: 'Sales', count: 42, score: 3.9 },
  { name: 'Marketing', count: 22, score: 4.0 },
  { name: 'Customer Success', count: 31, score: 4.3 },
  { name: 'Operations', count: 12, score: 3.8 },
];

const HRTalentAnalytics = () => {
  return (
    <div className="p-8 bg-gray-50 min-h-screen font-sans text-gray-800 flex flex-col items-center">
      <div className="w-full max-w-6xl">
        {/* Header */}
        <header className="mb-8 w-full">
          <h1 className="text-2xl font-bold text-gray-900">Talent Analytics</h1>
          <p className="text-gray-500">Comprehensive workforce performance insights</p>
        </header>

        {/* Top Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard icon={<Users className="text-blue-600" size={20} />} label="Total Employees" value="200" bgColor="bg-blue-50" />
          <StatCard icon={<Award className="text-purple-600" size={20} />} label="High Performers" value="30.0%" bgColor="bg-purple-50" />
          <StatCard icon={<TrendingUp className="text-green-600" size={20} />} label="Avg Performance" value="4.2" bgColor="bg-green-50" />
        </div>

        {/* Main Performance Trends Chart */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm mb-8">
          <h3 className="text-lg font-bold mb-6 text-gray-900">Performance Trends (Last 6 Months)</h3>
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={performanceTrends} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                <Tooltip cursor={{fill: '#f9fafb'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Legend iconType="circle" wrapperStyle={{paddingTop: '20px'}} />
                <Bar dataKey="Exceeds" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={20} />
                <Bar dataKey="Meets" fill="#22C55E" radius={[4, 4, 0, 0]} barSize={20} />
                <Bar dataKey="NeedsImprovement" fill="#EAB308" radius={[4, 4, 0, 0]} barSize={20} />
                <Bar dataKey="Outstanding" fill="#A855F7" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bottom Section: Distribution & Dept Performance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Pie Chart Card */}
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <h3 className="text-lg font-bold mb-6 text-gray-900">Current Talent Distribution</h3>
            <div className="h-[300px] w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={distributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {distributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend layout="vertical" align="right" verticalAlign="middle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Dept Performance Card */}
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <h3 className="text-lg font-bold mb-6 text-gray-900">Department Performance</h3>
            <div className="space-y-5">
              {deptPerformance.map((dept) => (
                <div key={dept.name} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-gray-700">
                      {dept.name} <span className="text-gray-400 font-normal">({dept.count} employees)</span>
                    </span>
                    <span className="font-bold text-gray-900">{dept.score}/5.0</span>
                  </div>
                  <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-blue-600 h-full rounded-full" 
                      style={{ width: `${(dept.score / 5) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper Stat Card Component
const StatCard = ({ icon, label, value, bgColor }: { icon: React.ReactNode, label: string, value: string, bgColor: string }) => (
  <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
    <div className={`w-12 h-12 rounded-lg ${bgColor} flex items-center justify-center`}>
      {icon}
    </div>
    <div>
      <p className="text-sm text-gray-500 font-medium">{label}</p>
      <h4 className="text-2xl font-bold text-gray-900">{value}</h4>
    </div>
  </div>
);

export default HRTalentAnalytics;