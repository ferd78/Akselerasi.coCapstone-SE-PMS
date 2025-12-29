import { useState } from "react";
import { Card } from "@heroui/react";
import { Award, Send, X, CheckCircle } from "lucide-react";

interface RewardRecommendationProps {
  user?: any;
}

interface RewardForm {
  type: "spot_bonus" | "performance_bonus" | "recognition_award" | "promotion";
  amount: string;
  reason: string;
  justification: string;
}

const ManagerRewards = ({ user: _user }: RewardRecommendationProps) => {
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [submitted, setSubmitted] = useState(false);

  const [formData, setFormData] = useState<RewardForm>({
    type: "spot_bonus",
    amount: "",
    reason: "",
    justification: "",
  });

  const handleSubmit = () => {
    // 🔥 Firestore submit later
    setSubmitted(true);
  };

  const resetForm = () => {
    setSelectedEmployee(null);
    setSubmitted(false);
    setFormData({
      type: "spot_bonus",
      amount: "",
      reason: "",
      justification: "",
    });
  };

  /* ================================
     FORM VIEW (future employee)
     ================================ */
  if (selectedEmployee) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold">
                Recommend Reward
              </h1>
              <p className="text-gray-600 mt-1">
                Create reward recommendation
              </p>
            </div>
            <button
              onClick={resetForm}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <X className="size-6" />
            </button>
          </div>

          {submitted && (
            <div className="flex items-center gap-2 p-4 mb-6 bg-green-50 text-green-700 rounded-lg">
              <CheckCircle className="size-5" />
              <span>
                Reward recommendation submitted for HR approval
              </span>
            </div>
          )}

          {!submitted && (
            <div className="space-y-4">
              <div>
                <label className="block mb-2">
                  Reward Type <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full px-4 py-3 border rounded-lg"
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      type: e.target.value as RewardForm["type"],
                    })
                  }
                >
                  <option value="spot_bonus">Spot Bonus</option>
                  <option value="performance_bonus">
                    Performance Bonus
                  </option>
                  <option value="recognition_award">
                    Recognition Award
                  </option>
                  <option value="promotion">
                    Promotion Recommendation
                  </option>
                </select>
              </div>

              {formData.type.includes("bonus") && (
                <div>
                  <label className="block mb-2">
                    Amount <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    className="w-full px-4 py-3 border rounded-lg"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        amount: e.target.value,
                      })
                    }
                  />
                </div>
              )}

              <div>
                <label className="block mb-2">
                  Reason <span className="text-red-500">*</span>
                </label>
                <input
                  className="w-full px-4 py-3 border rounded-lg"
                  placeholder="Reason for reward"
                  value={formData.reason}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      reason: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label className="block mb-2">
                  Detailed Justification{" "}
                  <span className="text-red-500">*</span>
                </label>
                <textarea
                  className="w-full px-4 py-3 border rounded-lg resize-none"
                  rows={5}
                  placeholder="Provide justification..."
                  value={formData.justification}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      justification: e.target.value,
                    })
                  }
                />
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <button
                  onClick={handleSubmit}
                  disabled={!formData.reason || !formData.justification}
                  className="flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-lg disabled:opacity-50"
                >
                  <Send className="size-5" />
                  Submit Recommendation
                </button>
                <button
                  onClick={resetForm}
                  className="px-6 py-3 border rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </Card>
      </div>
    );
  }

  /* ================================
     EMPTY STATE
     ================================ */
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">
          Reward Recommendations
        </h1>
        <p className="text-gray-600 mt-1">
          Recommend team members for rewards and recognition
        </p>
      </div>

      <Card className="p-10 text-center text-gray-500">
        <Award className="size-12 mx-auto mb-4 text-purple-500" />
        <p className="text-lg">No eligible employees found</p>
        <p className="text-sm mt-1">
          Employees will appear here once performance data is available
        </p>
      </Card>
    </div>
  );
};

export default ManagerRewards;
