import { useState } from "react";
import { Calendar, Play } from "lucide-react";

type ReviewCycleStatus = "active" | "scheduled" | "closed";

type ReviewCycle = {
  id: number;
  title: string;
  type: string;
  startDate: string;
  endDate: string;
  participants?: number;
  completed?: number;
  status: ReviewCycleStatus;
};

const initialCycles: ReviewCycle[] = [
  {
    id: 1,
    title: "Q4 2024 Performance Review",
    type: "Quarterly Review",
    startDate: "01/12/2024",
    endDate: "31/12/2024",
    participants: 156,
    completed: 89,
    status: "active",
  },
  {
    id: 2,
    title: "360 Feedback - Q4 2024",
    type: "360 Feedback",
    startDate: "10/12/2024",
    endDate: "28/12/2024",
    participants: 134,
    completed: 67,
    status: "active",
  },
  {
    id: 3,
    title: "Annual Review 2024",
    type: "Annual Review",
    startDate: "01/01/2025",
    endDate: "31/01/2025",
    status: "scheduled",
  },
];

const AdminReviewCycle = () => {
  const [cycles, setCycles] = useState<ReviewCycle[]>(initialCycles);
  const [confirmCloseId, setConfirmCloseId] = useState<number | null>(null);
  const [editingCycle, setEditingCycle] = useState<ReviewCycle | null>(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCycleForm, setNewCycleForm] = useState({
    title: "",
    type: "Quarterly Review",
    startDate: "",
    endDate: "",
  });

  const handleCloseCycle = () => {
    if (!confirmCloseId) return;

    setCycles((prev) =>
      prev.map((cycle) =>
        cycle.id === confirmCloseId
          ? { ...cycle, status: "closed" }
          : cycle
      )
    );
    setConfirmCloseId(null);
  };

  const handleActivateCycle = (id: number) => {
    setCycles((prev) =>
      prev.map((cycle) =>
        cycle.id === id ? { ...cycle, status: "active" } : cycle
      )
    );
  };

  const handleCreateCycle = () => {
    if (
      !newCycleForm.title ||
      !newCycleForm.startDate ||
      !newCycleForm.endDate
    )
      return;

    const newCycle: ReviewCycle = {
      id: cycles.length + 1,
      title: newCycleForm.title,
      type: newCycleForm.type,
      startDate: newCycleForm.startDate,
      endDate: newCycleForm.endDate,
      status: "scheduled",
    };

    setCycles((prev) => [...prev, newCycle]);
    setShowCreateModal(false);
    setNewCycleForm({
      title: "",
      type: "Quarterly Review",
      startDate: "",
      endDate: "",
    });
  };

  const activeCycles = cycles.filter((c) => c.status === "active");
  const scheduledCycles = cycles.filter((c) => c.status === "scheduled");

  return (
    <div className="p-6 space-y-8">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Review Cycle Management</h1>
          <p className="text-sm text-gray-500">
            Manage performance review cycles
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          + New Cycle
        </button>
      </div>

      {/* ACTIVE CYCLES */}
      <div className="space-y-6">
        <h2 className="text-lg font-semibold">Active Cycles</h2>

        {activeCycles.map((cycle) => {
          const progress =
            cycle.participants && cycle.completed
              ? Math.round((cycle.completed / cycle.participants) * 100)
              : 0;

          return (
            <div
              key={cycle.id}
              className="bg-white border rounded-2xl p-6 space-y-6"
            >
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold">{cycle.title}</h3>
                  <span className="bg-green-100 text-green-600 text-xs px-2 py-0.5 rounded-full">
                    active
                  </span>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                  <Calendar size={14} />
                  <span>
                    {cycle.startDate} - {cycle.endDate}
                  </span>
                  <span>•</span>
                  <span>{cycle.type}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="border rounded-xl p-4 bg-gray-50">
                  <p className="text-sm text-gray-500">Participants</p>
                  <p className="text-2xl font-semibold">{cycle.participants}</p>
                </div>

                <div className="border rounded-xl p-4 bg-gray-50">
                  <p className="text-sm text-gray-500">Completed</p>
                  <p className="text-2xl font-semibold">{cycle.completed}</p>
                </div>

                <div className="border rounded-xl p-4 bg-gray-50">
                  <p className="text-sm text-gray-500">Progress</p>
                  <p className="text-2xl font-semibold">{progress}%</p>
                </div>
              </div>

              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div className="flex gap-3">
                <button className="border px-4 py-2 rounded-lg hover:bg-gray-100">
                  ✏️ Edit
                </button>

                <button
                  onClick={() => setConfirmCloseId(cycle.id)}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                >
                  ⏹ Close Cycle
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* SCHEDULED CYCLES */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Scheduled Cycles</h2>

        {scheduledCycles.map((cycle) => (
          <div
            key={cycle.id}
            className="bg-white border rounded-2xl p-5 flex justify-between items-center"
          >
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{cycle.title}</h3>
                <span className="bg-blue-100 text-blue-600 text-xs px-2 py-0.5 rounded-full">
                  scheduled
                </span>
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                <Calendar size={14} />
                <span>
                  {cycle.startDate} - {cycle.endDate}
                </span>
                <span>•</span>
                <span>{cycle.type}</span>
              </div>
            </div>

            <button
              onClick={() => handleActivateCycle(cycle.id)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
            >
              <Play size={16} />
              Activate
            </button>
          </div>
        ))}
      </div>

      {/* CREATE CYCLE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-[420px] space-y-6">
            <h2 className="text-lg font-semibold">Create Review Cycle</h2>

            <div className="space-y-1">
              <label className="text-sm font-medium">
                Cycle Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g., Q1 2025 Performance Review"
                value={newCycleForm.title}
                onChange={(e) =>
                  setNewCycleForm({ ...newCycleForm, title: e.target.value })
                }
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">
                Cycle Type <span className="text-red-500">*</span>
              </label>
              <select
                value={newCycleForm.type}
                onChange={(e) =>
                  setNewCycleForm({ ...newCycleForm, type: e.target.value })
                }
                className="w-full border rounded-lg px-3 py-2"
              >
                <option>Quarterly Review</option>
                <option>Annual Review</option>
                <option>360 Feedback</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium">
                  Start Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={newCycleForm.startDate}
                  onChange={(e) =>
                    setNewCycleForm({
                      ...newCycleForm,
                      startDate: e.target.value,
                    })
                  }
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">
                  End Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={newCycleForm.endDate}
                  onChange={(e) =>
                    setNewCycleForm({
                      ...newCycleForm,
                      endDate: e.target.value,
                    })
                  }
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowCreateModal(false)}
                className="border px-4 py-2 rounded-lg hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCycle}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Create Cycle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CLOSE CONFIRMATION MODAL */}
      {confirmCloseId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-[400px] space-y-4">
            <h2 className="text-lg font-semibold">Close Review Cycle</h2>
            <p className="text-sm text-gray-600">
              Are you sure you want to close this review cycle? This action
              cannot be undone.
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmCloseId(null)}
                className="border px-4 py-2 rounded-lg hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleCloseCycle}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
              >
                Yes, Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReviewCycle;
