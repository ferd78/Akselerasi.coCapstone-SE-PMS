import { useState } from "react";
import { Card } from "@heroui/react";
import {
  TrendingUp,
  Users,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

const EmployeePerformanceReview = () => {
  const [selectedPeriod, setSelectedPeriod] = useState("Q4 2024");
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Performance Review</h1>
          <p className="text-gray-600 mt-1">
            View your performance summary and feedback
          </p>
        </div>

        <select
          value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(e.target.value)}
          className="px-4 py-2 border rounded-lg"
        >
          <option>Q4 2024</option>
          <option disabled>More periods coming</option>
        </select>
      </div>

      {/* Overall Rating */}
      <Card className="p-8 bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
        <div className="flex items-center gap-4">
          <div className="bg-white/20 p-3 rounded-lg">
            <TrendingUp className="size-8" />
          </div>

          <div>
            <div className="text-white/80 mb-1">
              Overall Performance Rating
            </div>
            <div className="text-3xl font-semibold">—</div>
          </div>
        </div>

        <p className="text-white/90 mt-4">
          Review period: {selectedPeriod}
        </p>
      </Card>

      {/* 360 Feedback */}
      <Card className="overflow-hidden">
        <button
          onClick={() =>
            setExpanded(expanded === "feedback" ? null : "feedback")
          }
          className="w-full flex items-center justify-between p-6 hover:bg-gray-50"
        >
          <div className="flex items-center gap-3">
            <Users className="size-6 text-blue-600" />
            <div className="text-left">
              <h2 className="text-xl">360 Feedback Summary</h2>
              <p className="text-gray-600 text-sm mt-1">
                No feedback collected yet
              </p>
            </div>
          </div>

          {expanded === "feedback" ? (
            <ChevronUp className="size-6" />
          ) : (
            <ChevronDown className="size-6" />
          )}
        </button>

        {expanded === "feedback" && (
          <div className="p-6 pt-0 text-gray-500 text-sm">
            Feedback data will appear here once available.
          </div>
        )}
      </Card>

      {/* Manager Evaluation */}
      <Card className="overflow-hidden">
        <button
          onClick={() =>
            setExpanded(expanded === "manager" ? null : "manager")
          }
          className="w-full flex items-center justify-between p-6 hover:bg-gray-50"
        >
          <div className="flex items-center gap-3">
            <TrendingUp className="size-6 text-green-600" />
            <div className="text-left">
              <h2 className="text-xl">Manager Evaluation</h2>
              <p className="text-gray-600 text-sm mt-1">
                Manager feedback not available yet
              </p>
            </div>
          </div>

          {expanded === "manager" ? (
            <ChevronUp className="size-6" />
          ) : (
            <ChevronDown className="size-6" />
          )}
        </button>

        {expanded === "manager" && (
          <div className="p-6 pt-0 text-gray-500 text-sm">
            Manager evaluation will appear here after review completion.
          </div>
        )}
      </Card>

      {/* Performance History */}
      <Card className="p-6">
        <h2 className="text-xl mb-4">Performance History</h2>

        <div className="text-gray-500 text-sm">
          No historical performance records found.
        </div>
      </Card>
    </div>
  );
};

export default EmployeePerformanceReview;
