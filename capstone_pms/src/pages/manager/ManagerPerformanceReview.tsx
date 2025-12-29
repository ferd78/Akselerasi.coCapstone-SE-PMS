import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@heroui/react";
import {
  Save,
  ArrowLeft,
  CheckCircle,
  XCircle,
} from "lucide-react";

const performanceOutcomes = [
  { value: "outstanding", label: "Outstanding" },
  { value: "exceeds", label: "Exceeds Expectations" },
  { value: "meets", label: "Meets Expectations" },
  { value: "needs_improvement", label: "Needs Improvement" },
];

const ManagerPerformanceReview = () => {
  const navigate = useNavigate();

  const [selectedEmployee, setSelectedEmployee] =
    useState<boolean>(false);

  const [formData, setFormData] = useState({
    summary: "",
    strengths: "",
    improvements: "",
    outcome: "meets",
    goals: "",
  });

  const [status, setStatus] = useState<
    "idle" | "saved" | "submitted" | "error"
  >("idle");

  const handleSave = () => {
    setStatus("saved");
  };

  const handleSubmit = () => {
    if (
      !formData.summary ||
      !formData.strengths ||
      !formData.improvements
    ) {
      setStatus("error");
      return;
    }

    // 🔥 Firestore submit later
    setStatus("submitted");
    setTimeout(() => navigate("/manager"), 1000);
  };

  
  if (!selectedEmployee) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <h1 className="text-2xl font-semibold">
          Employee Evaluation
        </h1>

        <Card className="p-12 text-center text-gray-500">
          <p>No employee selected</p>
          <p className="text-sm mt-1">
            Select a team member to begin evaluation
          </p>

          <button
            onClick={() => setSelectedEmployee(true)}
            className="mt-6 bg-blue-600 text-white px-6 py-3 rounded-lg"
          >
            Select Employee
          </button>
        </Card>
      </div>
    );
  }

  /* ================================
     EVALUATION FORM
     ================================ */
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <button
        onClick={() => setSelectedEmployee(false)}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="size-5" />
        Back to list
      </button>

      <Card className="p-6">
        {/* Employee Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white size-16 rounded-xl flex items-center justify-center text-xl">
            ?
          </div>
          <div>
            <h1 className="text-xl font-semibold">
              Employee Name
            </h1>
            <p className="text-gray-600">
              Position / Department
            </p>
          </div>
        </div>

        {/* Status messages */}
        {status === "saved" && (
          <div className="flex items-center gap-2 p-3 mb-4 bg-blue-50 text-blue-700 rounded-lg">
            <CheckCircle className="size-5" />
            Draft saved
          </div>
        )}

        {status === "submitted" && (
          <div className="flex items-center gap-2 p-3 mb-4 bg-green-50 text-green-700 rounded-lg">
            <CheckCircle className="size-5" />
            Evaluation submitted
          </div>
        )}

        {status === "error" && (
          <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 text-red-700 rounded-lg">
            <XCircle className="size-5" />
            Please fill all required fields
          </div>
        )}

        {/* Form */}
        <div className="space-y-6">
          <div>
            <label className="block mb-2">
              Performance Outcome *
            </label>
            <select
              value={formData.outcome}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  outcome: e.target.value,
                })
              }
              className="w-full px-4 py-3 border rounded-lg"
            >
              {performanceOutcomes.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          {[
            ["Evaluation Summary *", "summary"],
            ["Key Strengths *", "strengths"],
            ["Areas for Improvement *", "improvements"],
            ["Goals for Next Period", "goals"],
          ].map(([label, key]) => (
            <div key={key}>
              <label className="block mb-2">
                {label}
              </label>
              <textarea
                rows={4}
                value={(formData as any)[key]}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    [key]: e.target.value,
                  })
                }
                className="w-full px-4 py-3 border rounded-lg resize-none"
              />
            </div>
          ))}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4 border-t">
            <button
              onClick={handleSubmit}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
            >
              Submit Evaluation
            </button>

            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-6 py-3 border rounded-lg"
            >
              <Save className="size-5" />
              Save Draft
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ManagerPerformanceReview;
