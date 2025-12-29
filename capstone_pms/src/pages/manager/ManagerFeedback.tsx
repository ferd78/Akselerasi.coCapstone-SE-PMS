import { useState } from "react";
import { Card } from "@heroui/react";
import {
  MessageSquare,
  Plus,
  Users,
  Send,
  XCircle,
} from "lucide-react";

const Manager360Feedback = () => {
  const [view, setView] = useState<
    "list" | "newCycle" | "assignReviewers"
  >("list");

  const [cycleForm, setCycleForm] = useState({
    name: "",
    startDate: "",
    endDate: "",
    isAnonymous: true,
  });

  const [reviewers, setReviewers] = useState<string[]>([]);
  const [status, setStatus] = useState<
    "idle" | "error" | "created" | "sent"
  >("idle");

  /* ================================
     CREATE NEW CYCLE
     ================================ */
  const handleCreateCycle = () => {
    if (!cycleForm.name || !cycleForm.startDate || !cycleForm.endDate) {
      setStatus("error");
      return;
    }

    // 🔥 Firestore create cycle later
    setStatus("created");
    setView("list");
    setCycleForm({
      name: "",
      startDate: "",
      endDate: "",
      isAnonymous: true,
    });
  };

  /* ================================
     SEND REQUESTS
     ================================ */
  const handleSendRequests = () => {
    if (reviewers.length === 0) {
      setStatus("error");
      return;
    }

    // 🔥 Firestore send requests later
    setStatus("sent");
    setReviewers([]);
    setView("list");
  };

  /* ================================
     NEW CYCLE VIEW
     ================================ */
  if (view === "newCycle") {
    return (
      <div className="max-w-3xl mx-auto">
        <Card className="p-6">
          <h1 className="text-2xl font-semibold mb-1">
            Initiate 360 Feedback Cycle
          </h1>
          <p className="text-gray-600 mb-6">
            Create a new feedback collection cycle
          </p>

          {status === "error" && (
            <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 text-red-700 rounded-lg">
              <XCircle className="size-5" />
              <span>Please fill all required fields</span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block mb-2">
                Cycle Name *
              </label>
              <input
                value={cycleForm.name}
                onChange={(e) =>
                  setCycleForm({
                    ...cycleForm,
                    name: e.target.value,
                  })
                }
                className="w-full px-4 py-3 border rounded-lg"
                placeholder="e.g. Q4 2024 360 Feedback"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block mb-2">
                  Start Date *
                </label>
                <input
                  type="date"
                  value={cycleForm.startDate}
                  onChange={(e) =>
                    setCycleForm({
                      ...cycleForm,
                      startDate: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 border rounded-lg"
                />
              </div>

              <div>
                <label className="block mb-2">
                  End Date *
                </label>
                <input
                  type="date"
                  value={cycleForm.endDate}
                  onChange={(e) =>
                    setCycleForm({
                      ...cycleForm,
                      endDate: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 border rounded-lg"
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <div className="mb-1">
                  Anonymous Feedback
                </div>
                <p className="text-sm text-gray-600">
                  Keep reviewer identities confidential
                </p>
              </div>

              <button
                onClick={() =>
                  setCycleForm({
                    ...cycleForm,
                    isAnonymous: !cycleForm.isAnonymous,
                  })
                }
                className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                  cycleForm.isAnonymous
                    ? "bg-blue-600"
                    : "bg-gray-300"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                    cycleForm.isAnonymous
                      ? "translate-x-6"
                      : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-6 border-t mt-6">
            <button
              onClick={handleCreateCycle}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg"
            >
              Create Cycle
            </button>
            <button
              onClick={() => setView("list")}
              className="px-6 py-3 border rounded-lg"
            >
              Cancel
            </button>
          </div>
        </Card>
      </div>
    );
  }

  /* ================================
     ASSIGN REVIEWERS VIEW
     ================================ */
  if (view === "assignReviewers") {
    return (
      <div className="max-w-4xl mx-auto">
        <Card className="p-6">
          <h1 className="text-2xl font-semibold mb-1">
            Assign Reviewers
          </h1>
          <p className="text-gray-600 mb-6">
            Select reviewers for this employee
          </p>

          {status === "error" && (
            <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 text-red-700 rounded-lg">
              <XCircle className="size-5" />
              <span>Select at least one reviewer</span>
            </div>
          )}

          <Card className="p-10 text-center text-gray-500 mb-6">
            <Users className="size-12 mx-auto mb-3" />
            <p>No reviewers loaded</p>
            <p className="text-sm mt-1">
              Reviewers will appear once team data is
              available
            </p>
          </Card>

          <div className="flex items-center gap-3 pt-4 border-t">
            <button
              onClick={handleSendRequests}
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg"
            >
              <Send className="size-5" />
              Send Requests
            </button>
            <button
              onClick={() => setView("list")}
              className="px-6 py-3 border rounded-lg"
            >
              Cancel
            </button>
          </div>
        </Card>
      </div>
    );
  }

  /* ================================
     MAIN LIST VIEW
     ================================ */
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">
            360 Feedback Management
          </h1>
          <p className="text-gray-600 mt-1">
            Manage feedback cycles and reviewer
            assignments
          </p>
        </div>

        <button
          onClick={() => {
            setStatus("idle");
            setView("newCycle");
          }}
          className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg"
        >
          <Plus className="size-5" />
          New Cycle
        </button>
      </div>

      {/* Active Cycle Placeholder */}
      <Card className="p-8 text-center text-gray-500">
        <MessageSquare className="size-12 mx-auto mb-3" />
        <p>No active feedback cycle</p>
        <p className="text-sm mt-1">
          Create a cycle to start collecting feedback
        </p>
      </Card>

      {/* Assign Reviewers Placeholder */}
      <Card className="p-6">
        <h2 className="text-xl mb-4">
          Assign Reviewers
        </h2>

        <Card className="p-10 text-center text-gray-500">
          <Users className="size-12 mx-auto mb-3" />
          <p>No team members available</p>
          <p className="text-sm mt-1">
            Team data will appear here once loaded
          </p>

          <button
            onClick={() => {
              setStatus("idle");
              setView("assignReviewers");
            }}
            className="mt-6 bg-blue-600 text-white px-6 py-3 rounded-lg"
          >
            Manage Reviewers
          </button>
        </Card>
      </Card>
    </div>
  );
};

export default Manager360Feedback;
