import { Card } from "@heroui/react";

const DevelopmentPlanSummary = () => {
  return (
    <Card className="p-6 border-border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl">Development Plan Status</h2>
      </div>

      <div className="text-gray-500 text-sm text-center py-4">
        No development plan assigned
      </div>
    </Card>
  );
};

export default DevelopmentPlanSummary;
