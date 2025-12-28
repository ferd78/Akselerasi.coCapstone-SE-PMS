import { Card } from "@heroui/react";
import { Link } from "react-router-dom";

const PendingFeedback = () => {
  return (
    <Card className="p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl">Pending Feedback Tasks</h2>
        <Link to="/employee/feedback" className="text-blue-600 text-sm">
          View all
        </Link>
      </div>

      <div className="text-center py-10 text-gray-500">
        <p>No pending feedback tasks</p>
      </div>
    </Card>
  );
};

export default PendingFeedback;
