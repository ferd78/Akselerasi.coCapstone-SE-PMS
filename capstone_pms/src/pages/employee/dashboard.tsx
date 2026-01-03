import StatGrid from "../../components/StatGrid";
import PendingFeedback from "../../components/PendingFeedback";
import PerformanceSnapshot from "../../components/PerformanceSnapshot";
import DevelopmentPlanSummary from "../../components/DevelopmentPlanSummary";

const EmployeeDashboard = () => {
  return (
    <div className="max-w mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Welcome back!</h1>
        <p className="text-gray-600 mt-1">
          Here's your performance overview
        </p>
      </div>

      <StatGrid />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PendingFeedback />
        <PerformanceSnapshot />
      </div>

      <DevelopmentPlanSummary />
    </div>
  );
};

export default EmployeeDashboard;