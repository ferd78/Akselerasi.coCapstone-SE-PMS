import { useEffect, useMemo, useState } from "react";
import { Card } from "@heroui/react";
import { Award, Send, X, CheckCircle } from "lucide-react";
import { db, auth } from "../../firebase";
import {
  addDoc,
  collection,
  getDocs,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
interface RewardRecommendationProps {
  user?: any;
}

type EmployeeRow = {
  docId: string;
  employeeId: string;
  name: string;
  role?: string;
  position?: string;
  department?: string;
  email?: string;
};

type RewardForm = {
  type: "spot_bonus" | "performance_bonus" | "recognition_award" | "promotion";
  amount: string;
  reason: string;
  justification: string;
  approvedBy: string;
  status: "pending" | "approved";
  date: string;
};

const getInitials = (name: string) => {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? "U";
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
};

const todayISO = () => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const typeToDbLabel = (t: RewardForm["type"]) => {
  if (t === "spot_bonus") return "Spot Bonus";
  if (t === "performance_bonus") return "Performance Bonus";
  if (t === "recognition_award") return "Recognition Award";
  if (t === "promotion") return "Promotion Recommendation";
  return "Reward";
};

const ManagerRewards = ({ user: _user }: RewardRecommendationProps) => {
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeRow | null>(
    null
  );
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState<RewardForm>({
    type: "spot_bonus",
    amount: "Rp 0",
    reason: "",
    justification: "",
    approvedBy: "Emily Rodriguez",
    status: "pending",
    date: todayISO(),
  });

  const managerName = useMemo(() => {
    const fallback = "Manager";
    const u = auth.currentUser as any;
    return String(u?.displayName || u?.email || fallback);
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadEmployees = async () => {
      setLoading(true);
      setError(null);

      try {
        const snap = await getDocs(query(collection(db, "users")));
        if (!mounted) return;

        const rows: EmployeeRow[] = snap.docs.map((d) => {
          const data = d.data() as any;
          const legacy = String(data?.legacyId || data?.employeeId || data?.id || d.id);
          return {
            docId: d.id,
            employeeId: legacy,
            name: String(data?.name || data?.displayName || "Unknown"),
            role: data?.role,
            position: data?.position || data?.jobTitle,
            department: data?.department,
            email: data?.email,
          };
        });

        const filtered = rows.filter((u) => {
          const r = String(u.role || "").toLowerCase();
          if (!r) return true;
          return !r.includes("manager") && !r.includes("hr") && !r.includes("admin");
        });

        setEmployees(filtered);
      } catch (e: any) {
        console.error(e);
        if (mounted) {
          setEmployees([]);
          setError(e?.message || "Failed to load employees");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadEmployees();
    return () => {
      mounted = false;
    };
  }, []);

  const resetForm = () => {
    setSelectedEmployee(null);
    setSubmitted(false);
    setSubmitting(false);
    setError(null);
    setFormData({
      type: "spot_bonus",
      amount: "Rp 0",
      reason: "",
      justification: "",
      approvedBy: "Emily Rodriguez",
      status: "pending",
      date: todayISO(),
    });
  };

  const openForm = (emp: EmployeeRow) => {
    setSelectedEmployee(emp);
    setSubmitted(false);
    setSubmitting(false);
    setError(null);
    setFormData((prev) => ({
      ...prev,
      type: "spot_bonus",
      amount: "Rp 0",
      reason: "",
      justification: "",
      approvedBy: "Emily Rodriguez",
      status: "pending",
      date: todayISO(),
    }));
  };

  const handleSubmit = async () => {
    if (!selectedEmployee) return;

    setError(null);
    if (!formData.reason.trim() || !formData.justification.trim() || !formData.date.trim()) {
      setError("Please fill in all required fields.");
      return;
    }
    if (formData.type.includes("bonus") && !String(formData.amount || "").trim()) {
      setError("Amount is required for bonuses.");
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        employeeId: selectedEmployee.employeeId,
        type: typeToDbLabel(formData.type),
        amount: formData.type.includes("bonus")
          ? String(formData.amount || "Rp 0")
          : String(formData.amount || "Rp 0"), // keep "Rp 0" for non-bonus too
        reason: formData.reason.trim(),
        awardedBy: managerName,
        approvedBy: formData.approvedBy.trim() || "—",
        date: formData.date.trim(), // "YYYY-MM-DD"
        status: formData.status,
        description: formData.justification.trim(),
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, "rewards"), payload);

      setSubmitted(true);
    } catch (e: any) {
      console.error(e);
      setError(e?.message || "Failed to submit recommendation.");
    } finally {
      setSubmitting(false);
    }
  };
  if (selectedEmployee) {
    const needsAmount = formData.type.includes("bonus");
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold">Recommend Reward</h1>
              <p className="text-gray-600 mt-1">
                Create reward recommendation for{" "}
                <span className="font-medium">{selectedEmployee.name}</span>
              </p>
            </div>
            <button onClick={resetForm} className="p-2 hover:bg-gray-100 rounded-lg">
              <X className="size-6" />
            </button>
          </div>

          <div className="border rounded-xl p-4 bg-purple-50 mb-6">
            <div className="flex items-center gap-4">
              <div className="size-12 rounded-xl bg-blue-600 text-white flex items-center justify-center font-semibold">
                {getInitials(selectedEmployee.name)}
              </div>
              <div>
                <div className="font-semibold">{selectedEmployee.name}</div>
                <div className="text-sm text-gray-600">
                  {selectedEmployee.position || "Employee"}
                </div>
              </div>
            </div>
          </div>

          {submitted && (
            <div className="flex items-center gap-2 p-4 mb-6 bg-green-50 text-green-700 rounded-lg">
              <CheckCircle className="size-5" />
              <span>Reward recommendation submitted for HR approval</span>
            </div>
          )}

          {error && (
            <div className="p-4 mb-6 bg-red-50 text-red-700 rounded-lg border border-red-200">
              {error}
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
                      amount: e.target.value.includes("bonus") ? formData.amount : "Rp 0",
                    })
                  }
                >
                  <option value="spot_bonus">Spot Bonus</option>
                  <option value="performance_bonus">Performance Bonus</option>
                  <option value="recognition_award">Recognition Award</option>
                  <option value="promotion">Promotion Recommendation</option>
                </select>
              </div>

              {needsAmount && (
                <div>
                  <label className="block mb-2">
                    Amount <span className="text-red-500">*</span>
                  </label>
                  <input
                    className="w-full px-4 py-3 border rounded-lg"
                    placeholder="Rp 0"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Use format like: <span className="font-mono">Rp 15.000.000</span>
                  </p>
                </div>
              )}

              <div>
                <label className="block mb-2">
                  Reason <span className="text-red-500">*</span>
                </label>
                <input
                  className="w-full px-4 py-3 border rounded-lg"
                  placeholder="e.g., Outstanding project delivery"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                />
              </div>

              <div>
                <label className="block mb-2">
                  Detailed Justification <span className="text-red-500">*</span>
                </label>
                <textarea
                  className="w-full px-4 py-3 border rounded-lg resize-none"
                  rows={5}
                  placeholder="Provide detailed justification for this reward recommendation..."
                  value={formData.justification}
                  onChange={(e) =>
                    setFormData({ ...formData, justification: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block mb-2">Approved By</label>
                  <input
                    className="w-full px-4 py-3 border rounded-lg"
                    placeholder="e.g., Emily Rodriguez"
                    value={formData.approvedBy}
                    onChange={(e) => setFormData({ ...formData, approvedBy: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block mb-2">
                    Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    className="w-full px-4 py-3 border rounded-lg"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block mb-2">Status</label>
                  <select
                    className="w-full px-4 py-3 border rounded-lg"
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        status: e.target.value as RewardForm["status"],
                      })
                    }
                  >
                    <option value="pending">pending</option>
                    <option value="approved">approved</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-2">Awarded By</label>
                  <input
                    className="w-full px-4 py-3 border rounded-lg bg-gray-50"
                    value={managerName}
                    readOnly
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <button
                  onClick={handleSubmit}
                  disabled={submitting || !formData.reason || !formData.justification}
                  className="flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-lg disabled:opacity-50"
                >
                  <Send className="size-5" />
                  {submitting ? "Submitting..." : "Submit Recommendation"}
                </button>
                <button onClick={resetForm} className="px-6 py-3 border rounded-lg">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </Card>
      </div>
    );
  }
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Reward Recommendations</h1>
        <p className="text-gray-600 mt-1">
          Recommend team members for rewards and recognition
        </p>
      </div>

      <div className="rounded-2xl p-6 bg-purple-700 text-white">
        <div className="flex items-center gap-4">
          <div className="size-12 rounded-xl bg-white/15 flex items-center justify-center">
            <Award className="size-7" />
          </div>
          <div>
            <div className="text-2xl font-semibold">Identify High Performers</div>
            <div className="text-sm text-white/80 mt-1">
              Recognize outstanding contributions
            </div>
          </div>
        </div>
      </div>

      {error && (
        <Card className="p-4 border border-red-200 bg-red-50 text-red-700">
          {error}
        </Card>
      )}

      {loading ? (
        <div className="text-center text-gray-500">Loading...</div>
      ) : employees.length === 0 ? (
        <Card className="p-10 text-center text-gray-500">
          <Award className="size-12 mx-auto mb-4 text-purple-500" />
          <p className="text-lg">No eligible employees found</p>
          <p className="text-sm mt-1">
            Employees will appear here once user data is available
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {employees.map((emp) => (
            <Card key={emp.employeeId} className="p-6 border border-purple-200">
              <div className="flex items-center gap-4">
                <div className="size-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-semibold">
                  {getInitials(emp.name)}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-lg">{emp.name}</div>
                  <div className="text-sm text-gray-600">{emp.position || "Employee"}</div>
                  <div className="mt-2 inline-flex text-xs px-2 py-1 rounded bg-purple-50 text-purple-700">
                    High Performer
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => openForm(emp)}
                className="w-full mt-6 bg-purple-700 hover:bg-purple-800 text-white py-3 rounded-lg"
              >
                Recommend for Reward
              </button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ManagerRewards;