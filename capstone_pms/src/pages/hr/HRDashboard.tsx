import React from 'react';
import { 
  Users, 
  TrendingUp, 
  CheckCircle2, 
  BarChart3, 
  ArrowRight, 
  FileText, 
  PieChart, 
  Award 
} from 'lucide-react';
import { Link } from 'react-router-dom';

const HRDashboard = () => {
  const distributionData = [
    { label: 'Outstanding', count: 15, percentage: 7.5, color: 'bg-purple-600' },
    { label: 'Exceeds', count: 45, percentage: 22.5, color: 'bg-blue-600' },
    { label: 'Meets', count: 120, percentage: 60.0, color: 'bg-green-600' },
    { label: 'Needs Improvement', count: 18, percentage: 9.0, color: 'bg-orange-500' },
    { label: 'Unsatisfactory', count: 2, percentage: 1.0, color: 'bg-red-600' },
  ];

  return (
    <div className="p-8 bg-gray-50 min-h-screen font-sans text-gray-800">
      {/* Header */}
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">HR Dashboard</h1>
        <p className="text-gray-500">Organization-wide performance insights</p>
      </header>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
          icon={<Users className="text-blue-600" size={20} />} 
          iconBg="bg-blue-50"
          value="200" 
          label="Total Employees" 
        />
        <StatCard 
          icon={<TrendingUp className="text-purple-600" size={20} />} 
          iconBg="bg-purple-50"
          value="60" 
          label="High Performers" 
          linkText="View details"
          linkHref="#"
        />
        <StatCard 
          icon={<CheckCircle2 className="text-orange-600" size={20} />} 
          iconBg="bg-orange-50"
          value="8" 
          label="Reward Approvals" 
          badge="Pending"
          linkText="Review"
          linkHref="#"
        />
        <StatCard 
          icon={<BarChart3 className="text-green-600" size={20} />} 
          iconBg="bg-green-50"
          value="89%" 
          label="Review Completion" 
        />
      </div>

      {/* Talent Distribution Section */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold">Talent Distribution</h2>
          <button className="text-blue-600 text-sm font-medium hover:underline">View full analytics</button>
        </div>
        
        <div className="space-y-6">
          {distributionData.map((item) => (
            <div key={item.label} className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium text-gray-700">{item.label}</span>
                <span className="text-gray-500">{item.count} ({item.percentage}%)</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5">
                <div 
                  className={`${item.color} h-2.5 rounded-full transition-all duration-500`} 
                  style={{ width: `${item.percentage}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ActionCard 
          icon={<TrendingUp className="text-blue-600" size={20} />} 
          iconBg="bg-blue-50"
          title="Performance Reports"
          description="View organization-wide performance data"
        />
        <ActionCard 
          icon={<BarChart3 className="text-green-600" size={20} />} 
          iconBg="bg-green-50"
          title="Talent Analytics"
          description="Deep dive into workforce metrics"
        />
        <ActionCard 
          icon={<Award className="text-purple-600" size={20} />} 
          iconBg="bg-purple-50"
          title="Reward Approvals"
          description="Review and approve reward recommendations"
        />
      </div>
    </div>
  );
};

/* Sub-components for cleaner code */

const StatCard = ({ icon, iconBg, value, label, linkText, linkHref, badge }: any) => (
  <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between h-48">
    <div className="flex justify-between items-start">
      <div className={`${iconBg} p-2.5 rounded-lg`}>
        {icon}
      </div>
      {badge && (
        <span className="bg-orange-50 text-orange-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-orange-100">
          {badge}
        </span>
      )}
    </div>
    <div>
      <div className="text-3xl font-bold text-gray-900 mb-1">{value}</div>
      <div className="text-gray-500 text-sm">{label}</div>
    </div>
    {linkText && (
      <Link to={linkHref} className="text-blue-600 text-sm font-medium flex items-center gap-1 hover:underline mt-2">
        {linkText} <ArrowRight size={14} />
      </Link>
    )}
  </div>
);

const ActionCard = ({ icon, iconBg, title, description }: any) => (
  <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
    <div className={`${iconBg} w-fit p-2.5 rounded-lg mb-4 group-hover:scale-110 transition-transform`}>
      {icon}
    </div>
    <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
    <p className="text-gray-500 text-sm leading-relaxed">{description}</p>
  </div>
);

export default HRDashboard;