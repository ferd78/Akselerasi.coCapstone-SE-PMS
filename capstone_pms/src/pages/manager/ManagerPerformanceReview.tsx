import { useEffect, useMemo, useState } from "react";
import { Card } from "@heroui/react";
import { CheckCircle, Clock, ArrowLeft, Save, Plus } from "lucide-react";
import { db, auth } from "../../firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  Timestamp,
  addDoc,
  limit,
} from "firebase/firestore";

type TeamMember = {
  id: string;
  name: string;
  department: string;
  position: string;
  avatar: string;
};

type ReviewCycle = {
  id: string;
  title?: string;
  name?: string;
  type?: string;
  status?: string;
  startDate?: any;
  endDate?: any;
  isAnonymous?: boolean;
  isActive?: boolean;
};

type PerformanceReview = {
  id: string;
  employeeId: string;
  cycleId: string;
  cycleTitle?: string;
  period?: string;
  overallOutcome: string;
  ratings?: {
    technical?: number;
    collaboration?: number;
    leadership?: number;
    communication?: number;
  };
  managerEvaluation?: {
    summary?: string;
    strengths?: string[];
    areasForDevelopment?: string[];
    goalsNextPeriod?: string[];
  };
  createdAt?: any;
  updatedAt?: any;
  status?: "pending" | "in_progress" | "completed" | string;
};

function toLinesArray(text: string): string[] {
  return text
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

function fromArrayToTextarea(arr?: string[]): string {
  return (arr || []).join("\n");
}

function safeToDate(v: any): Date | null {
  if (!v) return null;
  if (typeof v?.toDate === "function") return v.toDate();
  if (typeof v?.seconds === "number") return new Date(v.seconds * 1000);
  if (typeof v?._seconds === "number") return new Date(v._seconds * 1000);
  if (typeof v === "string") {
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

function formatDateRange(start: any, end: any) {
  const s = safeToDate(start);
  const e = safeToDate(end);
  if (!s || !e) return "—";
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
  return `${fmt(s)} - ${fmt(e)}`;
}

function clampInt(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, Math.round(n)));
}

function makePerfDocId(employeeId: string, cycleId: string) {
  return `perf_${employeeId}_${cycleId}`;
}

const ManagerPerformanceReview = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [managerDept, setManagerDept] = useState<string | null>(null);
  const [managerLegacyId, setManagerLegacyId] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [cycles, setCycles] = useState<ReviewCycle[]>([]);
  const [selectedCycleId, setSelectedCycleId] = useState<string>("");
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [reviewsByEmployeeId, setReviewsByEmployeeId] = useState<Record<string, PerformanceReview>>(
    {}
  );
  const [selectedEmployee, setSelectedEmployee] = useState<TeamMember | null>(null);
  const [activeReview, setActiveReview] = useState<PerformanceReview | null>(null);
  const [saving, setSaving] = useState(false);
  const [showCreateCycle, setShowCreateCycle] = useState(false);
  const [creatingCycle, setCreatingCycle] = useState(false);
  const [cycleForm, setCycleForm] = useState({
    title: "",
    type: "Quarterly Review",
    startDate: "",
    endDate: "",
  });

  const [form, setForm] = useState({
    overallOutcome: "Meets Expectations",
    summary: "",
    strengths: "",
    improvements: "",
    goals: "",
    ratings: {
      technical: 3,
      collaboration: 3,
      leadership: 3,
      communication: 3,
    },
  });

  const selectedCycle = useMemo(
    () => cycles.find((c) => c.id === selectedCycleId) || null,
    [cycles, selectedCycleId]
  );

  const cycleLabel = (c: ReviewCycle) => c.title || c.name || "Review Cycle";

  const canCreateCycle = useMemo(() => {
    const r = String(role || "").toLowerCase();
    return r === "manager" || r === "admin";
  }, [role]);

  useEffect(() => {
    const run = async () => {
      setError(null);
      try {
        const user = auth.currentUser;
        if (!user) {
          setError("Not logged in.");
          return;
        }
        try {
          const uidDoc = await getDoc(doc(db, "users", user.uid));
          if (uidDoc.exists()) {
            const data = uidDoc.data() as any;
            if (data?.department) setManagerDept(String(data.department));
            if (data?.legacyId || data?.id) setManagerLegacyId(String(data.legacyId || data.id));
            if (data?.role) setRole(String(data.role));
          }
        } catch {
          // empty
        }
        if (user.email) {
          const snap = await getDocs(
            query(collection(db, "users"), where("email", "==", user.email), limit(1))
          );
          if (!snap.empty) {
            const d = snap.docs[0];
            const data = d.data() as any;
            setManagerDept((prev) => prev ?? (data?.department ? String(data.department) : null));
            setManagerLegacyId((prev) => prev ?? String(data?.legacyId || data?.id || d.id));
            setRole((prev) => prev ?? (data?.role ? String(data.role) : null));
          }
        }
      } catch (e: any) {
        console.error(e);
        setError(e?.message || "Failed to resolve manager profile");
      }
    };

    run();
  }, []);

  useEffect(() => {
    const loadCycles = async () => {
      try {
        const snap = await getDocs(query(collection(db, "reviewCycles"), where("status", "==", "active")));
        const list: ReviewCycle[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
        list.sort((a, b) => {
          const da = safeToDate(a.startDate)?.getTime() ?? 0;
          const dbt = safeToDate(b.startDate)?.getTime() ?? 0;
          return dbt - da;
        });
        setCycles(list);
        setSelectedCycleId((prev) => (prev && list.some((c) => c.id === prev) ? prev : (list[0]?.id || "")));
      } catch (e: any) {
        console.error(e);
        setCycles([]);
        setError((prev) => prev ?? (e?.message || "Failed to load review cycles"));
      }
    };
    loadCycles();
  }, []);

  useEffect(() => {
    const loadTeam = async () => {
      setLoading(true);
      setError(null);
      try {
        if (!managerDept) {
          setTeam([]);
          return;
        }
        const snap = await getDocs(
          query(collection(db, "teamMembers"), where("department", "==", managerDept))
        );
        const rows: TeamMember[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as any),
        }));
        rows.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
        setTeam(rows);
      } catch (e: any) {
        console.error(e);
        setError(e?.message || "Failed to load team members");
      } finally {
        setLoading(false);
      }
    };
    loadTeam();
  }, [managerDept]);

  useEffect(() => {
    const loadCycleReviews = async () => {
      setError(null);

      try {
        if (!selectedCycleId) {
          setReviewsByEmployeeId({});
          return;
        }

        const snap = await getDocs(
          query(collection(db, "performanceReviews"), where("cycleId", "==", selectedCycleId))
        );

        const map: Record<string, PerformanceReview> = {};
        snap.docs.forEach((d) => {
          const data = d.data() as any;
          const empId = String(data.employeeId || "");
          if (!empId) return;
          map[empId] = { id: d.id, ...(data as any) };
        });

        setReviewsByEmployeeId(map);
      } catch (e: any) {
        console.error(e);
        try {
          const title = selectedCycle?.title || selectedCycle?.name || "";
          if (!title) {
            setReviewsByEmployeeId({});
            return;
          }
          const snap2 = await getDocs(
            query(collection(db, "performanceReviews"), where("period", "==", title))
          );
          const map2: Record<string, PerformanceReview> = {};
          snap2.docs.forEach((d) => {
            const data = d.data() as any;
            const empId = String(data.employeeId || "");
            if (!empId) return;
            map2[empId] = { id: d.id, ...(data as any) };
          });
          setReviewsByEmployeeId(map2);
        } catch (fallbackErr: any) {
          setError(fallbackErr?.message || e?.message || "Failed to load performance reviews for this cycle");
          setReviewsByEmployeeId({});
        }
      }
    };
    loadCycleReviews();
  }, [selectedCycleId, selectedCycle?.title, selectedCycle?.name]);

  const teamWithStatus = useMemo(() => {
    return team.map((t) => {
      const review = reviewsByEmployeeId[t.id];
      if (!review) return { ...t, _status: "pending" as const };
      const st = String(review.status || "in_progress").toLowerCase();
      if (st === "completed") return { ...t, _status: "completed" as const };
      return { ...t, _status: "in_progress" as const };
    });
  }, [team, reviewsByEmployeeId]);

  const openEmployee = async (emp: TeamMember) => {
    setError(null);
    setSelectedEmployee(emp);
    setActiveReview(null);

    if (!selectedCycleId || !selectedCycle) {
      setError("No active review cycle selected.");
      return;
    }

    try {
      const docId = makePerfDocId(emp.id, selectedCycleId);
      const ref = doc(db, "performanceReviews", docId);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const review = { id: snap.id, ...(snap.data() as any) } as PerformanceReview;
        setActiveReview(review);
        setForm({
          overallOutcome: review.overallOutcome || "Meets Expectations",
          summary: review.managerEvaluation?.summary || "",
          strengths: fromArrayToTextarea(review.managerEvaluation?.strengths),
          improvements: fromArrayToTextarea(review.managerEvaluation?.areasForDevelopment),
          goals: fromArrayToTextarea(review.managerEvaluation?.goalsNextPeriod),
          ratings: {
            technical: clampInt(Number(review.ratings?.technical ?? 3), 1, 5),
            collaboration: clampInt(Number(review.ratings?.collaboration ?? 3), 1, 5),
            leadership: clampInt(Number(review.ratings?.leadership ?? 3), 1, 5),
            communication: clampInt(Number(review.ratings?.communication ?? 3), 1, 5),
          },
        });
        return;
      }

      setForm({
        overallOutcome: "Meets Expectations",
        summary: "",
        strengths: "",
        improvements: "",
        goals: "",
        ratings: { technical: 3, collaboration: 3, leadership: 3, communication: 3 },
      });
    } catch (e: any) {
      console.error(e);
      setError(e?.message || "Failed to open employee evaluation");
    }
  };

  const closeEmployee = () => {
    setSelectedEmployee(null);
    setActiveReview(null);
  };

  const upsertReview = async (finalStatus: "in_progress" | "completed") => {
    if (!selectedEmployee) return;
    if (!selectedCycleId || !selectedCycle) {
      setError("No active review cycle selected.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const employeeId = selectedEmployee.id;
      const cycleId = selectedCycleId;
      const cycleTitle = cycleLabel(selectedCycle);
      const payload: any = {
        employeeId,
        cycleId,
        cycleTitle,
        period: cycleTitle,
        overallOutcome: form.overallOutcome,
        ratings: {
          technical: clampInt(Number(form.ratings.technical), 1, 5),
          collaboration: clampInt(Number(form.ratings.collaboration), 1, 5),
          leadership: clampInt(Number(form.ratings.leadership), 1, 5),
          communication: clampInt(Number(form.ratings.communication), 1, 5),
        },
        managerEvaluation: {
          summary: form.summary,
          strengths: toLinesArray(form.strengths),
          areasForDevelopment: toLinesArray(form.improvements),
          goalsNextPeriod: toLinesArray(form.goals),
        },
        status: finalStatus,
        updatedAt: serverTimestamp(),
      };

      const docId = makePerfDocId(employeeId, cycleId);
      const ref = doc(db, "performanceReviews", docId);
      const existing = await getDoc(ref);
      if (!existing.exists()) {
        payload.createdAt = serverTimestamp();
      }

      await setDoc(ref, payload, { merge: true });

      setReviewsByEmployeeId((prev) => ({
        ...prev,
        [employeeId]: {
          id: docId,
          employeeId,
          cycleId,
          cycleTitle,
          period: cycleTitle,
          overallOutcome: payload.overallOutcome,
          ratings: payload.ratings,
          managerEvaluation: payload.managerEvaluation,
          status: finalStatus,
        },
      }));

      const after = await getDoc(ref);
      if (after.exists()) {
        setActiveReview({ id: after.id, ...(after.data() as any) });
      }
    } catch (e: any) {
      console.error(e);
      setError(e?.message || "Failed to save evaluation");
    } finally {
      setSaving(false);
    }
  };

  const createNewCycle = async () => {
    setError(null);

    if (!cycleForm.title.trim()) {
      setError("Cycle title is required.");
      return;
    }
    if (!cycleForm.startDate || !cycleForm.endDate) {
      setError("Start date and end date are required.");
      return;
    }

    const start = new Date(cycleForm.startDate);
    const end = new Date(cycleForm.endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      setError("Invalid start/end date.");
      return;
    }
    if (end < start) {
      setError("End date must be after start date.");
      return;
    }

    setCreatingCycle(true);
    try {
      const user = auth.currentUser;
      const docRef = await addDoc(collection(db, "reviewCycles"), {
        title: cycleForm.title.trim(),
        type: cycleForm.type,
        status: "active",
        isActive: true,
        startDate: Timestamp.fromDate(start),
        endDate: Timestamp.fromDate(end),
        createdBy: user?.uid || null,
        createdAt: serverTimestamp(),
      });
      const snap = await getDocs(query(collection(db, "reviewCycles"), where("status", "==", "active")));
      const list: ReviewCycle[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      list.sort((a, b) => {
        const da = safeToDate(a.startDate)?.getTime() ?? 0;
        const dbt = safeToDate(b.startDate)?.getTime() ?? 0;
        return dbt - da;
      });
      setCycles(list);
      setSelectedCycleId(docRef.id);
      setShowCreateCycle(false);
      setCycleForm({ title: "", type: "Quarterly Review", startDate: "", endDate: "" });
    } catch (e: any) {
      console.error(e);
      setError(e?.message || "Failed to create review cycle");
    } finally {
      setCreatingCycle(false);
    }
  };

  if (selectedEmployee) {
    const reviewExists = !!activeReview?.id;
    const status = String(activeReview?.status || (reviewExists ? "in_progress" : "pending")).toLowerCase();
    const isCompleted = status === "completed";

    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <button
            onClick={closeEmployee}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="size-4" />
            Back to list
          </button>
        </div>

        {error && (
          <Card className="p-4 border border-red-200 bg-red-50 text-red-700">{error}</Card>
        )}

        <Card className="p-6">
          <div className="flex items-start gap-4">
            <div className="size-12 rounded-xl bg-blue-600 text-white flex items-center justify-center font-semibold">
              {selectedEmployee.avatar || selectedEmployee.name?.slice(0, 2).toUpperCase()}
            </div>

            <div className="flex-1">
              <div className="text-xl font-semibold">{selectedEmployee.name}</div>
              <div className="text-sm text-gray-600">{selectedEmployee.position}</div>
              {selectedCycle && (
                <div className="text-xs text-gray-500 mt-2">
                  Cycle: <span className="font-medium">{cycleLabel(selectedCycle)}</span> •{" "}
                  {formatDateRange(selectedCycle.startDate, selectedCycle.endDate)}
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <select
                value={selectedCycleId}
                onChange={async (e) => {
                  const next = e.target.value;
                  setSelectedCycleId(next);
                  setTimeout(() => openEmployee(selectedEmployee), 0);
                }}
                className="border rounded-lg px-3 py-2 bg-white"
              >
                {cycles.map((c) => (
                  <option key={c.id} value={c.id}>
                    {cycleLabel(c)}
                  </option>
                ))}
              </select>

              {isCompleted ? (
                <span className="text-xs px-2 py-1 rounded bg-green-50 text-green-700 border border-green-200">
                  Completed
                </span>
              ) : status === "in_progress" ? (
                <span className="text-xs px-2 py-1 rounded bg-yellow-50 text-yellow-700 border border-yellow-200">
                  In Progress
                </span>
              ) : (
                <span className="text-xs px-2 py-1 rounded bg-orange-50 text-orange-700 border border-orange-200">
                  Pending
                </span>
              )}
            </div>
          </div>

          <div className="mt-6">
            <div className="text-sm font-medium mb-2">Ratings (out of 5)</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(
                [
                  ["technical", "Technical"],
                  ["collaboration", "Collaboration"],
                  ["leadership", "Leadership"],
                  ["communication", "Communication"],
                ] as const
              ).map(([key, label]) => (
                <div key={key} className="border rounded-lg p-3">
                  <div className="text-xs text-gray-500 mb-2">{label}</div>
                  <input
                    type="range"
                    min={1}
                    max={5}
                    step={1}
                    value={form.ratings[key]}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        ratings: { ...p.ratings, [key]: clampInt(Number(e.target.value), 1, 5) },
                      }))
                    }
                    className="w-full"
                  />
                  <div className="text-sm mt-1">{form.ratings[key]} / 5</div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 space-y-5">
            <div>
              <label className="block text-sm font-medium mb-2">
                Performance Outcome <span className="text-red-500">*</span>
              </label>

              <select
                value={form.overallOutcome}
                onChange={(e) => setForm((p) => ({ ...p, overallOutcome: e.target.value }))}
                className="w-full border rounded-lg px-3 py-3 bg-white"
              >
                <option>Outstanding</option>
                <option>Exceeds Expectations</option>
                <option>Meets Expectations</option>
                <option>Needs Improvement</option>
                <option>Unsatisfactory</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Evaluation Summary <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={4}
                value={form.summary}
                onChange={(e) => setForm((p) => ({ ...p, summary: e.target.value }))}
                placeholder="Provide an overall summary of performance..."
                className="w-full border rounded-lg px-3 py-3 bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Key Strengths <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={4}
                value={form.strengths}
                onChange={(e) => setForm((p) => ({ ...p, strengths: e.target.value }))}
                placeholder="List key strengths... (one per line)"
                className="w-full border rounded-lg px-3 py-3 bg-white"
              />
              <div className="text-xs text-gray-500 mt-1">Tip: one bullet per line.</div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Areas for Improvement <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={4}
                value={form.improvements}
                onChange={(e) => setForm((p) => ({ ...p, improvements: e.target.value }))}
                placeholder="Areas for improvement... (one per line)"
                className="w-full border rounded-lg px-3 py-3 bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Goals for Next Period</label>
              <textarea
                rows={3}
                value={form.goals}
                onChange={(e) => setForm((p) => ({ ...p, goals: e.target.value }))}
                placeholder="Goals... (one per line)"
                className="w-full border rounded-lg px-3 py-3 bg-white"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => upsertReview("completed")}
                disabled={saving || !form.summary || !form.strengths || !form.improvements}
                className="bg-blue-600 text-white px-5 py-3 rounded-lg font-medium disabled:opacity-50"
              >
                {saving ? "Saving..." : "Submit Evaluation"}
              </button>

              <button
                onClick={() => upsertReview("in_progress")}
                disabled={saving}
                className="flex items-center gap-2 border px-5 py-3 rounded-lg font-medium disabled:opacity-50"
              >
                <Save className="size-4" />
                {saving ? "Saving..." : "Save Draft"}
              </button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Employee Evaluation</h1>
          <p className="text-gray-600 mt-1">
            {managerDept ? `Department: ${managerDept}` : "Loading department..."}
          </p>
          {managerLegacyId && (
            <p className="text-xs text-gray-400 mt-2">Resolved legacyId: {managerLegacyId}</p>
          )}
          {role && <p className="text-xs text-gray-400 mt-1">Role: {role}</p>}
        </div>

        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-600">Cycle</label>

          <select
            value={selectedCycleId}
            onChange={(e) => setSelectedCycleId(e.target.value)}
            className="border rounded-lg px-3 py-2 bg-white min-w-[220px]"
            disabled={cycles.length === 0}
          >
            {cycles.length === 0 ? (
              <option value="">No active cycles</option>
            ) : (
              cycles.map((c) => (
                <option key={c.id} value={c.id}>
                  {cycleLabel(c)}
                </option>
              ))
            )}
          </select>

          {canCreateCycle && (
            <button
              onClick={() => setShowCreateCycle(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium"
            >
              <Plus className="size-4" />
              New Cycle
            </button>
          )}
        </div>
      </div>

      {selectedCycle && (
        <div className="text-sm text-gray-600">
          <span className="font-medium">{cycleLabel(selectedCycle)}</span>{" "}
          <span className="text-gray-400">•</span>{" "}
          {formatDateRange(selectedCycle.startDate, selectedCycle.endDate)}{" "}
          {selectedCycle.type ? (
            <>
              <span className="text-gray-400">•</span> {selectedCycle.type}
            </>
          ) : null}
        </div>
      )}

      {error && (
        <Card className="p-4 border border-red-200 bg-red-50 text-red-700">{error}</Card>
      )}

      {loading ? (
        <Card className="p-10 text-center text-gray-500">Loading…</Card>
      ) : teamWithStatus.length === 0 ? (
        <Card className="p-10 text-center text-gray-500">No team members found.</Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {teamWithStatus.map((emp: any) => {
            const status = emp._status as "pending" | "in_progress" | "completed";
            const isCompleted = status === "completed";
            const isInProgress = status === "in_progress";

            const badgeClass = isCompleted
              ? "bg-green-50 text-green-700 border-green-200"
              : isInProgress
              ? "bg-yellow-50 text-yellow-700 border-yellow-200"
              : "bg-orange-50 text-orange-700 border-orange-200";

            const badgeText = isCompleted ? "completed" : isInProgress ? "in progress" : "pending";

            return (
              <Card
                key={emp.id}
                className="p-5 cursor-pointer hover:shadow-md transition"
                onClick={() => openEmployee(emp)}
              >
                <div className="flex items-center gap-4">
                  <div className="size-12 rounded-xl bg-blue-600 text-white flex items-center justify-center font-semibold">
                    {emp.avatar || emp.name?.slice(0, 2).toUpperCase()}
                  </div>

                  <div className="flex-1">
                    <div className="font-semibold">{emp.name}</div>
                    <div className="text-sm text-gray-600">{emp.position}</div>

                    <div className="mt-2 inline-flex items-center">
                      <span className={`text-xs px-2 py-1 rounded border ${badgeClass}`}>
                        {badgeText}
                      </span>
                    </div>
                  </div>

                  <div className="text-sm text-gray-600">{isCompleted ? "View / Edit" : "Evaluate"}</div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {showCreateCycle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-lg font-semibold">Create Review Cycle</h2>
              <button
                onClick={() => setShowCreateCycle(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <div>
                <label className="block text-gray-600 mb-2">
                  Cycle Title <span className="text-red-500">*</span>
                </label>
                <input
                  value={cycleForm.title}
                  onChange={(e) => setCycleForm((p) => ({ ...p, title: e.target.value }))}
                  placeholder="e.g., Q2 2026"
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-gray-600 mb-2">Type</label>
                <select
                  value={cycleForm.type}
                  onChange={(e) => setCycleForm((p) => ({ ...p, type: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 bg-white"
                >
                  <option>Quarterly Review</option>
                  <option>Annual Review</option>
                  <option>360</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-600 mb-2">
                    Start Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={cycleForm.startDate}
                    onChange={(e) => setCycleForm((p) => ({ ...p, startDate: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-gray-600 mb-2">
                    End Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={cycleForm.endDate}
                    onChange={(e) => setCycleForm((p) => ({ ...p, endDate: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
              </div>

              <div className="text-xs text-gray-500">
                This creates a global active cycle in <span className="font-medium">reviewCycles</span>.
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                onClick={() => setShowCreateCycle(false)}
                className="px-4 py-2 rounded-lg border hover:bg-gray-100 text-sm"
                disabled={creatingCycle}
              >
                Cancel
              </button>
              <button
                onClick={createNewCycle}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm disabled:opacity-50"
                disabled={creatingCycle}
              >
                {creatingCycle ? "Creating..." : "Create Cycle"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerPerformanceReview;