import { useEffect, useState } from "react";
import { Card } from "@heroui/react";
import { Plus, ArrowLeft, Save, Users, Clock } from "lucide-react";
import { auth, db } from "../../firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  setDoc,
  where,
} from "firebase/firestore";

type UserRow = {
  id: string;
  legacyId: string;
  name: string;
  role?: string;
  department?: string;
  position?: string;
  email?: string;
};

type Priority = "high" | "medium" | "low";
type PlanStatus = "active" | "archived" | string;
type ActionStatus = "not_started" | "in_progress" | "completed" | string;

type ActionItem = {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  status: ActionStatus;
  owner: string;
  progress: number;
};

type FocusArea = {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  actionItems: ActionItem[];
};

type DevelopmentPlanDoc = {
  id: string;
  employeeId: string;
  employeeName: string;
  status: PlanStatus;
  createdDate: string;
  lastUpdated: string;
  focusAreas: FocusArea[];
};

const uid = (prefix = "id") =>
  `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;

const todayISO = () => new Date().toISOString().slice(0, 10);

const getInitials = (name: string) => {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? "U";
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
};

const ManagerDevelopmentPlanning = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [manager, setManager] = useState<UserRow | null>(null);
  const [team, setTeam] = useState<UserRow[]>([]);

  const [selectedEmployee, setSelectedEmployee] = useState<UserRow | null>(null);
  const [plan, setPlan] = useState<DevelopmentPlanDoc | null>(null);
  useEffect(() => {
    const loadManager = async () => {
      setError(null);
      try {
        const user = auth.currentUser;
        if (!user?.email) {
          setManager(null);
          setError("Not logged in / missing email.");
          return;
        }
        const uidDoc = await getDoc(doc(db, "users", user.uid));
        if (uidDoc.exists()) {
          const data = uidDoc.data() as any;
          setManager({
            id: uidDoc.id,
            legacyId: String(data?.legacyId || data?.id || uidDoc.id),
            name: String(data?.name || data?.displayName || "Manager"),
            role: data?.role,
            department: data?.department,
            position: data?.position || data?.jobTitle,
            email: data?.email,
          });
          return;
        }
        const snap = await getDocs(
          query(collection(db, "users"), where("email", "==", user.email), limit(1))
        );

        if (snap.empty) {
          setManager(null);
          setError(`No user profile found in Firestore for ${user.email}.`);
          return;
        }

        const d = snap.docs[0];
        const data = d.data() as any;
        setManager({
          id: d.id,
          legacyId: String(data?.legacyId || data?.id || d.id),
          name: String(data?.name || data?.displayName || "Manager"),
          role: data?.role,
          department: data?.department,
          position: data?.position || data?.jobTitle,
          email: data?.email,
        });
      } catch (e: any) {
        console.error(e);
        setError(e?.message || "Failed to load manager profile");
        setManager(null);
      }
    };

    loadManager();
  }, []);

  useEffect(() => {
    const loadTeam = async () => {
      setLoading(true);
      setError(null);

      try {
        if (!manager) {
          setTeam([]);
          return;
        }

        let qy = query(collection(db, "users"));
        if (manager.department) {
          qy = query(collection(db, "users"), where("department", "==", manager.department));
        }
        const snap = await getDocs(qy);
        const rows: UserRow[] = snap.docs.map((d) => {
          const data = d.data() as any;
          return {
            id: d.id,
            legacyId: String(data?.legacyId || data?.id || d.id),
            name: String(data?.name || data?.displayName || "Unknown"),
            role: data?.role,
            department: data?.department,
            position: data?.position || data?.jobTitle,
            email: data?.email,
          };
        });

        const employees = rows.filter((u) => {
          const r = String(u.role || "").toLowerCase();
          if (!r) return true;
          return r.includes("employee") || r.includes("staff") || r.includes("dev");
        });

        setTeam(employees);
      } catch (e: any) {
        console.error(e);
        setError(e?.message || "Failed to load team members");
        setTeam([]);
      } finally {
        setLoading(false);
      }
    };

    loadTeam();
  }, [manager]);

  const openEmployeePlan = async (emp: UserRow) => {
    setSelectedEmployee(emp);
    setError(null);
    setPlan(null);
    try {
      const deterministicDocId = `dp_${emp.legacyId}`;
      const planRef = doc(db, "developmentPlans", deterministicDocId);
      const snap = await getDoc(planRef);
      if (snap.exists()) {
        const data = snap.data() as any;
        const normalized: DevelopmentPlanDoc = {
          id: String(data?.id || deterministicDocId),
          employeeId: String(data?.employeeId || emp.legacyId),
          employeeName: String(data?.employeeName || emp.name),
          status: String(data?.status || "active"),
          createdDate: String(data?.createdDate || todayISO()),
          lastUpdated: String(data?.lastUpdated || todayISO()),
          focusAreas: Array.isArray(data?.focusAreas)
            ? data.focusAreas.map((fa: any) => ({
                id: String(fa?.id || uid("fa")),
                title: String(fa?.title || ""),
                description: String(fa?.description || ""),
                priority: (String(fa?.priority || "medium") as Priority) ?? "medium",
                actionItems: Array.isArray(fa?.actionItems)
                  ? fa.actionItems.map((ai: any) => ({
                      id: String(ai?.id || uid("ai")),
                      title: String(ai?.title || ""),
                      description: String(ai?.description || ""),
                      dueDate: String(ai?.dueDate || ""),
                      status: String(ai?.status || "not_started"),
                      owner: String(ai?.owner || emp.name),
                      progress:
                        typeof ai?.progress === "number"
                          ? ai.progress
                          : Number(ai?.progress || 0),
                    }))
                  : [],
              }))
            : [],
        };

        setPlan(normalized);
        return;
      }
      const empty: DevelopmentPlanDoc = {
        id: deterministicDocId,
        employeeId: emp.legacyId,
        employeeName: emp.name,
        status: "active",
        createdDate: todayISO(),
        lastUpdated: todayISO(),
        focusAreas: [],
      };

      setPlan(empty);
    } catch (e: any) {
      console.error(e);
      setError(e?.message || "Failed to load development plan");
      const empty: DevelopmentPlanDoc = {
        id: `dp_${emp.legacyId}`,
        employeeId: emp.legacyId,
        employeeName: emp.name,
        status: "active",
        createdDate: todayISO(),
        lastUpdated: todayISO(),
        focusAreas: [],
      };
      setPlan(empty);
    }
  };

  const closeEditor = () => {
    setSelectedEmployee(null);
    setPlan(null);
    setError(null);
  };

  const addFocusArea = () => {
    if (!plan) return;
    const next: FocusArea = {
      id: uid("fa"),
      title: "",
      description: "",
      priority: "medium",
      actionItems: [],
    };
    setPlan({ ...plan, focusAreas: [...plan.focusAreas, next] });
  };

  const updateFocusArea = (focusId: string, patch: Partial<FocusArea>) => {
    if (!plan) return;
    setPlan({
      ...plan,
      focusAreas: plan.focusAreas.map((fa) =>
        fa.id === focusId ? { ...fa, ...patch } : fa
      ),
    });
  };

  const addActionItem = (focusId: string) => {
    if (!plan || !selectedEmployee) return;

    const next: ActionItem = {
      id: uid("ai"),
      title: "",
      description: "",
      dueDate: "",
      status: "not_started",
      owner: selectedEmployee.name,
      progress: 0,
    };

    setPlan({
      ...plan,
      focusAreas: plan.focusAreas.map((fa) =>
        fa.id === focusId ? { ...fa, actionItems: [...fa.actionItems, next] } : fa
      ),
    });
  };

  const updateActionItem = (focusId: string, actionId: string, patch: Partial<ActionItem>) => {
    if (!plan) return;
    setPlan({
      ...plan,
      focusAreas: plan.focusAreas.map((fa) => {
        if (fa.id !== focusId) return fa;
        return {
          ...fa,
          actionItems: fa.actionItems.map((ai) =>
            ai.id === actionId ? { ...ai, ...patch } : ai
          ),
        };
      }),
    });
  };

  const savePlan = async () => {
    if (!selectedEmployee || !plan) return;

    setSaving(true);
    setError(null);

    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error("Not logged in. Firestore write blocked.");
      }
      await user.getIdToken(true);
      const deterministicDocId = `dp_${selectedEmployee.legacyId}`;
      const planRef = doc(db, "developmentPlans", deterministicDocId);
      const payload: DevelopmentPlanDoc = {
        ...plan,
        id: deterministicDocId,
        employeeId: selectedEmployee.legacyId,
        employeeName: selectedEmployee.name,
        status: plan.status || "active",
        createdDate: plan.createdDate || todayISO(),
        lastUpdated: todayISO(),
        focusAreas: plan.focusAreas,
      };

      console.log("[DEV PLAN] Saving to:", `developmentPlans/${deterministicDocId}`);
      console.log("[DEV PLAN] Payload:", payload);

      await setDoc(planRef, payload, { merge: true });

      const after = await getDoc(planRef);
      console.log("[DEV PLAN] Saved doc exists:", after.exists(), after.data());
      if (after.exists()) {
        const data = after.data() as any;
        setPlan({
          id: String(data?.id || deterministicDocId),
          employeeId: String(data?.employeeId || selectedEmployee.legacyId),
          employeeName: String(data?.employeeName || selectedEmployee.name),
          status: String(data?.status || "active"),
          createdDate: String(data?.createdDate || todayISO()),
          lastUpdated: String(data?.lastUpdated || todayISO()),
          focusAreas: Array.isArray(data?.focusAreas) ? data.focusAreas : [],
        });
      }
    } catch (e: any) {
      console.error("[DEV PLAN] Save failed:", e);
      setError(e?.message || "Failed to save development plan");
    } finally {
      setSaving(false);
    }
  };

  if (selectedEmployee && plan) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={closeEditor}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="size-4" />
            Back to list
          </button>

          <button
            type="button"
            onClick={addFocusArea}
            className="flex items-center gap-2 bg-blue-600 text-white px-5 py-3 rounded-lg"
          >
            <Plus className="size-5" />
            Add Focus Area
          </button>
        </div>

        <div>
          <h1 className="text-3xl font-semibold">
            Development Plan - {selectedEmployee.name}
          </h1>
          <p className="text-gray-600 mt-1">Create and manage development objectives</p>
        </div>

        {error && (
          <Card className="p-4 border border-red-200 bg-red-50 text-red-700">
            {error}
            <div className="text-xs mt-2 text-red-600">
              Open DevTools Console to see the detailed Firestore error.
            </div>
          </Card>
        )}

        {plan.focusAreas.length === 0 ? (
          <Card className="p-10 text-center text-gray-500">
            <div className="font-medium">No focus areas yet</div>
            <div className="text-sm mt-1">
              Click <span className="font-medium">Add Focus Area</span> to start.
            </div>
          </Card>
        ) : (
          <div className="space-y-6">
            {plan.focusAreas.map((fa) => (
              <Card key={fa.id} className="p-6">
                <div className="space-y-4">
                  <div className="flex flex-col md:flex-row gap-4">
                    <input
                      className="w-full border rounded-xl px-4 py-3"
                      placeholder="Focus Area Title"
                      value={fa.title}
                      onChange={(e) => updateFocusArea(fa.id, { title: e.target.value })}
                    />

                    <select
                      className="md:w-56 w-full border rounded-xl px-4 py-3"
                      value={fa.priority}
                      onChange={(e) =>
                        updateFocusArea(fa.id, { priority: e.target.value as Priority })
                      }
                    >
                      <option value="high">High Priority</option>
                      <option value="medium">Medium Priority</option>
                      <option value="low">Low Priority</option>
                    </select>
                  </div>

                  <textarea
                    className="w-full border rounded-xl px-4 py-3 min-h-[90px]"
                    placeholder="Describe the development focus area..."
                    value={fa.description}
                    onChange={(e) =>
                      updateFocusArea(fa.id, { description: e.target.value })
                    }
                  />

                  <div className="flex items-center justify-between mt-2">
                    <div className="text-lg font-semibold">Action Items</div>
                    <button
                      type="button"
                      onClick={() => addActionItem(fa.id)}
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      + Add Action
                    </button>
                  </div>

                  <div className="space-y-4">
                    {fa.actionItems?.length ? (
                      fa.actionItems.map((ai) => (
                        <div key={ai.id} className="border rounded-xl p-4 space-y-3">
                          <div className="flex flex-col md:flex-row gap-4">
                            <input
                              className="w-full border rounded-xl px-4 py-3"
                              placeholder="Action item title"
                              value={ai.title}
                              onChange={(e) =>
                                updateActionItem(fa.id, ai.id, { title: e.target.value })
                              }
                            />

                            <input
                              className="md:w-56 w-full border rounded-xl px-4 py-3"
                              type="date"
                              value={ai.dueDate}
                              onChange={(e) =>
                                updateActionItem(fa.id, ai.id, { dueDate: e.target.value })
                              }
                            />
                          </div>

                          <textarea
                            className="w-full border rounded-xl px-4 py-3 min-h-[80px]"
                            placeholder="Describe the action item..."
                            value={ai.description}
                            onChange={(e) =>
                              updateActionItem(fa.id, ai.id, { description: e.target.value })
                            }
                          />

                          <div className="flex flex-col md:flex-row gap-4">
                            <select
                              className="md:w-56 w-full border rounded-xl px-4 py-3"
                              value={ai.status}
                              onChange={(e) =>
                                updateActionItem(fa.id, ai.id, { status: e.target.value })
                              }
                            >
                              <option value="not_started">Not Started</option>
                              <option value="in_progress">In Progress</option>
                              <option value="completed">Completed</option>
                            </select>

                            <input
                              className="w-full border rounded-xl px-4 py-3"
                              placeholder="Owner"
                              value={ai.owner}
                              onChange={(e) =>
                                updateActionItem(fa.id, ai.id, { owner: e.target.value })
                              }
                            />

                            <input
                              className="md:w-40 w-full border rounded-xl px-4 py-3"
                              type="number"
                              min={0}
                              max={100}
                              placeholder="Progress"
                              value={ai.progress}
                              onChange={(e) =>
                                updateActionItem(fa.id, ai.id, {
                                  progress: Number(e.target.value || 0),
                                })
                              }
                            />
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-gray-500 text-sm">
                        No action items yet. Click <span className="font-medium">+ Add Action</span>.
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        <div className="flex items-center gap-4 pt-2">
          <button
            type="button"
            onClick={savePlan}
            disabled={saving}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-4 rounded-xl disabled:opacity-50"
          >
            <Save className="size-5" />
            {saving ? "Saving..." : "Save Development Plan"}
          </button>

          <button
            type="button"
            onClick={closeEditor}
            className="px-6 py-4 rounded-xl border hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Development Planning</h1>
      </div>

      {error && (
        <Card className="p-4 border border-red-200 bg-red-50 text-red-700">{error}</Card>
      )}

      {loading ? (
        <Card className="p-10 text-center text-gray-500">Loading…</Card>
      ) : team.length === 0 ? (
        <Card className="p-10 text-center text-gray-500">
          <Users className="size-10 mx-auto mb-3 text-gray-400" />
          <div className="font-medium">No team members available</div>
          <div className="text-sm mt-1">Team data will appear here once loaded</div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {team.map((emp) => (
            <button
              key={emp.legacyId}
              type="button"
              onClick={() => openEmployeePlan(emp)}
              className="text-left"
            >
              <Card className="p-5 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4">
                  <div className="size-12 rounded-xl bg-blue-600 text-white flex items-center justify-center font-semibold">
                    {getInitials(emp.name)}
                  </div>
                  <div>
                    <div className="font-semibold">{emp.name}</div>
                    <div className="text-sm text-gray-600">{emp.position || "Employee"}</div>
                  </div>
                </div>
              </Card>
            </button>
          ))}
        </div>
      )}

      <div className="text-sm text-gray-500 flex items-center gap-2">
        <Clock className="size-4" />
        Select an employee to view and edit their development plan.
      </div>
    </div>
  );
};

export default ManagerDevelopmentPlanning;