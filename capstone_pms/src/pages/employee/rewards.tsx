import { useState } from "react";
import { Card } from "@heroui/react";
import { Award, CheckCircle, X } from "lucide-react";

const EmployeeRewards = () => {
  const [selectedReward, setSelectedReward] = useState<boolean>(false);

  if (selectedReward) {
    return (
      <div className="max-w-3xl mx-auto">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-semibold">
              Reward Details
            </h1>
            <button
              onClick={() => setSelectedReward(false)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <X className="size-6" />
            </button>
          </div>

          <Card className="p-6 mb-6 bg-gradient-to-br from-purple-50 to-indigo-50">
            <div className="flex items-start gap-4">
              <div className="bg-purple-600 p-3 rounded-lg">
                <Award className="size-8 text-white" />
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl">Reward Title</h2>
                  <span className="px-3 py-1 rounded-full text-sm bg-gray-100">
                    Pending
                  </span>
                </div>

                <div className="text-gray-700">
                  Reward details will appear here.
                </div>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-2 gap-6 mb-6">
            {[
              "Awarded By",
              "Approved By",
              "Award Date",
              "Status",
            ].map((label) => (
              <Card key={label} className="p-4">
                <div className="text-sm text-gray-600 mb-1">
                  {label}
                </div>
                <div className="text-gray-700">—</div>
              </Card>
            ))}
          </div>

          <Card className="p-4 mb-6">
            <div className="text-sm text-gray-600 mb-2">
              Justification
            </div>
            <p className="text-gray-700">
              No justification provided.
            </p>
          </Card>

          <button
            onClick={() => setSelectedReward(false)}
            className="w-full px-6 py-3 border rounded-lg hover:bg-gray-50"
          >
            Close
          </button>
        </Card>
      </div>
    );
  }

  
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold">
          Rewards & Recognition
        </h1>
        <p className="text-gray-600 mt-1">
          View your rewards and recognition history
        </p>
      </div>

      {/* Summary */}
      <Card className="p-8 bg-gradient-to-br from-purple-600 to-indigo-700 text-white">
        <div className="flex items-center gap-3 mb-4">
          <Award className="size-10" />
          <div>
            <h2 className="text-3xl">—</h2>
            <p className="text-white/90">
              Total Rewards Received
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6 mt-6 pt-6 border-t border-white/20">
          <div>
            <div className="text-2xl">—</div>
            <div className="text-white/80 text-sm">
              Approved
            </div>
          </div>
          <div>
            <div className="text-2xl">—</div>
            <div className="text-white/80 text-sm">
              Pending
            </div>
          </div>
        </div>
      </Card>

      {/* Empty List */}
      <Card className="p-12 text-center text-gray-500">
        <CheckCircle className="size-12 mx-auto mb-3 text-green-500" />
        <p>No rewards have been issued yet.</p>
        <p className="text-sm mt-1">
          Rewards will appear here once approved.
        </p>
      </Card>

      {/* TEMPLATE FOR FUTURE FIRESTORE DATA */}
      {false && (
        <Card
          className="p-6 cursor-pointer hover:border-purple-300"
          onClick={() => setSelectedReward(true)}
        >
          <div className="flex items-start gap-4">
            <div className="bg-purple-100 p-3 rounded-lg">
              <Award className="size-6 text-purple-600" />
            </div>

            <div className="flex-1">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="text-xl">Reward Type</h3>
                  <p className="text-gray-600">
                    Reason for reward
                  </p>
                </div>

                <span className="px-3 py-1 rounded-full text-sm bg-gray-100">
                  Pending
                </span>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default EmployeeRewards;
