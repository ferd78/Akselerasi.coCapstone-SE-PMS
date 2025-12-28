import StatCard from "./StatCard";
import { Clock, TrendingUp, Target, CheckCircle } from "lucide-react";

const StatGrid = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard
        title="Pending Feedback Requests"
        value="—"
        subtitle="View all"
        to="/employee/feedback"
        icon={Clock}
        iconBg="bg-orange-100 text-orange-600"
      />

      <StatCard
        title="Latest Performance Rating"
        value="—"
        subtitle="View details"
        to="/employee/performance"
        icon={TrendingUp}
        iconBg="bg-blue-100 text-blue-600"
      />

      <StatCard
        title="Development Plan Progress"
        value="—%"
        subtitle="View plan"
        to="/employee/development"
        icon={Target}
        iconBg="bg-green-100 text-green-600"
      />

      <StatCard
        title="Action Items Completed"
        value="— / —"
        subtitle="Continue"
        to="/employee/development"
        icon={CheckCircle}
        iconBg="bg-purple-100 text-purple-600"
      />
    </div>
  );
};

export default StatGrid;
