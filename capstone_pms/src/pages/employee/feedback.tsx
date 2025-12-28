import { useState } from "react";
import { Card } from "@heroui/react";
import {
  MessageSquare,
  Clock,
  CheckCircle,
  X,
  Send,
} from "lucide-react";

const EmployeeFeedbackRequests = () => {
  const [selectedRequest, setSelectedRequest] = useState<null | "FORM">(null);

  const [formData, setFormData] = useState({
    technicalSkills: "",
    collaboration: "",
    leadership: "",
    communication: "",
    strengths: "",
    improvements: "",
    additionalComments: "",
    rating: 0,
  });

  if (selectedRequest) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold">
                Provide Feedback
              </h1>
              <p className="text-gray-600 mt-1">
                Confidential feedback form
              </p>
            </div>

            <button
              onClick={() => setSelectedRequest(null)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <X className="size-6" />
            </button>
          </div>

          {/* Info Banner */}
          <Card className="p-4 mb-6 bg-blue-50">
            <div className="flex items-start gap-3">
              <MessageSquare className="size-5 text-blue-600 mt-0.5" />
              <div>
                <div className="text-blue-900 mb-1">
                  Anonymous Feedback
                </div>
                <p className="text-sm text-blue-800">
                  Your identity will not be shared with the recipient.
                </p>
              </div>
            </div>
          </Card>

          {/* Form */}
          <div className="space-y-6">
            {/* Rating */}
            <div>
              <label className="block mb-2">
                Overall Rating
              </label>

              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((r) => (
                  <button
                    key={r}
                    onClick={() =>
                      setFormData({ ...formData, rating: r })
                    }
                    className={`size-12 rounded-lg border-2 ${
                      formData.rating >= r
                        ? "bg-blue-600 border-blue-600 text-white"
                        : "border-gray-300"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Text Areas */}
            {[
              ["Technical Skills", "technicalSkills"],
              ["Collaboration", "collaboration"],
              ["Leadership", "leadership"],
              ["Communication", "communication"],
            ].map(([label, key]) => (
              <div key={key}>
                <label className="block mb-2">
                  {label}
                </label>
                <textarea
                  rows={3}
                  className="w-full px-4 py-3 border rounded-lg"
                  value={(formData as any)[key]}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      [key]: e.target.value,
                    })
                  }
                />
              </div>
            ))}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block mb-2">
                  Key Strengths *
                </label>
                <textarea
                  rows={4}
                  className="w-full px-4 py-3 border rounded-lg"
                  value={formData.strengths}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      strengths: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label className="block mb-2">
                  Areas for Improvement *
                </label>
                <textarea
                  rows={4}
                  className="w-full px-4 py-3 border rounded-lg"
                  value={formData.improvements}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      improvements: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div>
              <label className="block mb-2">
                Additional Comments
              </label>
              <textarea
                rows={3}
                className="w-full px-4 py-3 border rounded-lg"
                value={formData.additionalComments}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    additionalComments: e.target.value,
                  })
                }
              />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-4 border-t">
              <button
                disabled={
                  !formData.strengths || !formData.improvements
                }
                className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg disabled:opacity-50"
              >
                <Send className="size-5" />
                Submit Feedback
              </button>

              <button
                onClick={() => setSelectedRequest(null)}
                className="px-6 py-3 border rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  /* ================================
     REQUEST LIST VIEW (EMPTY)
     ================================ */
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">
          360 Feedback Requests
        </h1>
        <p className="text-gray-600 mt-1">
          Provide feedback for your colleagues
        </p>
      </div>

      {/* Pending */}
      <Card className="p-10 text-center text-gray-500">
        <Clock className="size-12 mx-auto mb-3 text-orange-500" />
        <p>No pending feedback requests</p>
      </Card>

      {/* Completed */}
      <Card className="p-10 text-center text-gray-500">
        <CheckCircle className="size-12 mx-auto mb-3 text-green-500" />
        <p>No completed feedback records</p>
      </Card>
    </div>
  );
};

export default EmployeeFeedbackRequests;
