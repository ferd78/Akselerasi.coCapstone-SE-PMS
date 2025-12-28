import { Card } from "@heroui/react";

const PerformanceSnapshot = () => {
  return (
    <Card className="p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl">Performance Snapshot</h2>
      </div>

      <div className="text-gray-500 text-sm text-center py-4">
        No performance data available yet
      </div>
    </Card>
  );
};

export default PerformanceSnapshot;
