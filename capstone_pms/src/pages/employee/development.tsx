import { useState } from "react";
import { Card } from "@heroui/react";
import {
  Target,
  ChevronDown,
  ChevronUp,
  CheckCircle,
} from "lucide-react";

const EmployeeDevelopmentPlan = () => {
  const [expandedArea, setExpandedArea] = useState<string | null>(null);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold">Development Plan</h1>
        <p className="text-gray-600 mt-1">
          Track your professional growth and action items
        </p>
      </div>

      {/* Progress Overview */}
      <Card className="p-8 bg-gradient-to-br from-green-600 to-emerald-700 text-white">
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <Target className="size-8" />
              <h2 className="text-3xl">—% Complete</h2>
            </div>
            <p className="text-white/90">
              No action items available yet
            </p>
          </div>

          <span className="px-4 py-2 bg-white/20 rounded-lg">
            Not Started
          </span>
        </div>

        <div className="h-3 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-white rounded-full"
            style={{ width: "0%" }}
          />
        </div>

        <div className="flex items-center justify-between mt-4 text-sm text-white/80">
          <span>Last updated: —</span>
          <span>Created: —</span>
        </div>
      </Card>

      {/* Focus Areas */}
      <div className="space-y-4">
        {/* EMPTY STATE */}
        <Card className="p-10 text-center text-gray-500">
          <CheckCircle className="size-12 mx-auto mb-3 text-green-500" />
          <p>No development plan has been assigned yet.</p>
          <p className="text-sm mt-1">
            Your manager or HR will create one for you.
          </p>
        </Card>

        {/* TEMPLATE (kept for future Firestore mapping) */}
        {false && (
          <Card className="overflow-hidden">
            <button
              onClick={() =>
                setExpandedArea(expandedArea ? null : "area-id")
              }
              className="w-full flex items-center justify-between p-6 hover:bg-gray-50"
            >
              <div className="flex-1 text-left">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-xl">Focus Area Title</h2>
                  <span className="text-xs px-2 py-1 rounded bg-gray-100">
                    Priority
                  </span>
                </div>

                <p className="text-gray-600 mb-3">
                  Focus area description
                </p>

                <div className="flex items-center gap-4">
                  <div className="flex-1 max-w-xs">
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-600 rounded-full"
                        style={{ width: "0%" }}
                      />
                    </div>
                  </div>

                  <span className="text-sm text-gray-600">
                    0 / 0 completed
                  </span>
                </div>
              </div>

              {expandedArea ? (
                <ChevronUp className="size-6 ml-4" />
              ) : (
                <ChevronDown className="size-6 ml-4" />
              )}
            </button>

            {expandedArea && (
              <div className="p-6 pt-0 text-gray-500 text-sm">
                Action items will appear here.
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
};

export default EmployeeDevelopmentPlan;
