import  { useState } from "react";
import { useParams } from "react-router-dom";
import { Card } from "@heroui/react";
import { Plus, Save, XCircle, CheckCircle } from "lucide-react";

interface DevelopmentPlanningProps {
  user: any;
}

interface ActionItem {
  id: string;
  title: string;
  description: string;
  dueDate: string;
}

interface FocusArea {
  id: string;
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  actionItems: ActionItem[];
}

const uid = () =>
  crypto.randomUUID?.() ?? Math.random().toString(36).slice(2);

const ManagerDevelopmentPlanning = ({ user: _user }: DevelopmentPlanningProps) => {
  const { employeeId } = useParams();

  // 🔥 Firestore later
  const [selectedEmployee, setSelectedEmployee] = useState<{
    id: string;
    name: string;
  } | null>(employeeId ? { id: employeeId, name: "Employee" } : null);

  const [focusAreas, setFocusAreas] = useState<FocusArea[]>([]);
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");

  /* ================================
     FOCUS AREAS
     ================================ */
  const addFocusArea = () => {
    setStatus("idle");
    setFocusAreas((prev) => [
      ...prev,
      {
        id: uid(),
        title: "",
        description: "",
        priority: "medium",
        actionItems: [],
      },
    ]);
  };

  const addActionItem = (areaId: string) => {
    setStatus("idle");
    setFocusAreas((prev) =>
      prev.map((area) =>
        area.id === areaId
          ? {
              ...area,
              actionItems: [
                ...area.actionItems,
                {
                  id: uid(),
                  title: "",
                  description: "",
                  dueDate: "",
                },
              ],
            }
          : area
      )
    );
  };

  /* ================================
     SAVE
     ================================ */
  const handleSave = () => {
    const hasValidData =
      focusAreas.length > 0 &&
      focusAreas.some(
        (fa) =>
          fa.title.trim() ||
          fa.description.trim() ||
          fa.actionItems.length > 0
      );

    if (!hasValidData) {
      setStatus("error");
      return;
    }

    // 🔥 Firestore save goes here
    setStatus("saved");
  };

  /* ================================
     EMPLOYEE SELECTION PLACEHOLDER
     ================================ */
  if (!selectedEmployee) {
    return (
      <div className="max-w-6xl mx-auto">
        <Card className="p-10 text-center text-gray-500">
          <p className="text-lg">No employee selected</p>
          <p className="text-sm mt-1">
            Select an employee to create a development plan
          </p>
        </Card>
      </div>
    );
  }

  /* ================================
     MAIN VIEW
     ================================ */
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">
            Development Plan – {selectedEmployee.name}
          </h1>
          <p className="text-gray-600 mt-1">
            Create and manage development objectives
          </p>
        </div>

        <button
          onClick={addFocusArea}
          className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg"
        >
          <Plus className="size-5" />
          Add Focus Area
        </button>
      </div>

      {/* Status */}
      {status === "error" && (
        <div className="flex items-center gap-2 p-4 bg-red-50 text-red-700 rounded-lg">
          <XCircle className="size-5" />
          <span>Add at least one valid focus area before saving</span>
        </div>
      )}

      {status === "saved" && (
        <div className="flex items-center gap-2 p-4 bg-green-50 text-green-700 rounded-lg">
          <CheckCircle className="size-5" />
          <span>Development plan saved successfully</span>
        </div>
      )}

      {/* Focus Areas */}
      {focusAreas.length === 0 ? (
        <Card className="p-10 text-center text-gray-500">
          <p>No focus areas added</p>
          <p className="text-sm mt-1">Click “Add Focus Area” to begin</p>
        </Card>
      ) : (
        focusAreas.map((area, areaIndex) => (
          <Card key={area.id} className="p-6 space-y-4">
            <div className="flex gap-4">
              <input
                className="flex-1 px-4 py-3 border rounded-lg"
                placeholder="Focus area title"
                value={area.title}
                onChange={(e) => {
                  const next = [...focusAreas];
                  next[areaIndex].title = e.target.value;
                  setFocusAreas(next);
                }}
              />

              <select
                className="px-4 py-3 border rounded-lg"
                value={area.priority}
                onChange={(e) => {
                  const next = [...focusAreas];
                  next[areaIndex].priority =
                    e.target.value as FocusArea["priority"];
                  setFocusAreas(next);
                }}
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <textarea
              className="w-full px-4 py-3 border rounded-lg resize-none"
              rows={2}
              placeholder="Describe this development focus area"
              value={area.description}
              onChange={(e) => {
                const next = [...focusAreas];
                next[areaIndex].description = e.target.value;
                setFocusAreas(next);
              }}
            />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Action Items</h3>
                <button
                  onClick={() => addActionItem(area.id)}
                  className="text-blue-600 text-sm flex items-center gap-1"
                >
                  <Plus className="size-4" />
                  Add Action
                </button>
              </div>

              {area.actionItems.length === 0 && (
                <p className="text-sm text-gray-500">No action items added</p>
              )}

              {area.actionItems.map((item, itemIndex) => (
                <div key={item.id} className="border rounded-lg p-4 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      className="px-4 py-2 border rounded-lg"
                      placeholder="Action title"
                      value={item.title}
                      onChange={(e) => {
                        const next = [...focusAreas];
                        next[areaIndex].actionItems[itemIndex].title =
                          e.target.value;
                        setFocusAreas(next);
                      }}
                    />
                    <input
                      type="date"
                      className="px-4 py-2 border rounded-lg"
                      value={item.dueDate}
                      onChange={(e) => {
                        const next = [...focusAreas];
                        next[areaIndex].actionItems[itemIndex].dueDate =
                          e.target.value;
                        setFocusAreas(next);
                      }}
                    />
                  </div>

                  <textarea
                    className="w-full px-4 py-2 border rounded-lg resize-none"
                    rows={2}
                    placeholder="Describe the action"
                    value={item.description}
                    onChange={(e) => {
                      const next = [...focusAreas];
                      next[areaIndex].actionItems[itemIndex].description =
                        e.target.value;
                      setFocusAreas(next);
                    }}
                  />
                </div>
              ))}
            </div>
          </Card>
        ))
      )}

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg"
        >
          <Save className="size-5" />
          Save Development Plan
        </button>

        <button
          onClick={() => setSelectedEmployee(null)}
          className="px-6 py-3 border rounded-lg"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default ManagerDevelopmentPlanning;
