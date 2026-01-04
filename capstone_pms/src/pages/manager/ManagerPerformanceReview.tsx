import { useEffect, useMemo, useState } from "react";
import { Card } from "@heroui/react";
import { CheckCircle, Clock, ArrowLeft, Save } from "lucide-react";
import { db, auth } from "../../firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";

type TeamMember = {
  id: string;
  name: string;
  department: string;
  position: string;
  avatar: string;
  performanceOutcome?: string;
  reviewStatus?: "pending" | "in_progress" | "completed" | string;
  lastReviewDate?: any;
};

type PerformanceReview = {
  id: string;
  employeeId: string;
  period: string;
  overallOutcome: string;
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

const PERIOD_FALLBACK = ["Q4 2024", "Q3 2024", "Q2 2024", "Q1 2024"];

function normalizePeriodToId(period: string) {
  return period.trim().toLowerCase().replace(/\s+/g, "_");
}

function makePerfDocId(employeeId: string, period: string) {
  return `perf_${employeeId}_${normalizePeriodToId(period)}`;
}

function toLinesArray(text: string): string[] {
  return text
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

function fromArrayToTextarea(arr?: string[]): string {
  return (arr || []).join("\n");
}

function formatDateSafe(value: any) {
  try {
    if (!value) return "-";
    if (value?.toDate) return value.toDate().toLocaleDateString();
    const d = new Date(value);
    if (isNaN(d.getTime())) return "-";
    return d.toLocaleDateString();
  } catch {
    return "-";
  }
}

const ManagerPerformanceReview = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [managerDept, setManagerDept] = useState<string | null>(null);
  const [managerLegacyId, setManagerLegacyId] = useState<string | null>(null);
  const [periods, setPeriods] = useState<string[]>(PERIOD_FALLBACK);
  const [selectedPeriod, setSelectedPeriod] = useState<string>(PERIOD_FALLBACK[0]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [reviewsByEmployeeId, setReviewsByEmployeeId] = useState<Record<string, PerformanceReview>>(
    {}
  );
  const [selectedEmployee, setSelectedEmployee] = useState<TeamMember | null>(null);
  const [activeReview, setActiveReview] = useState<PerformanceReview | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    overallOutcome: "Meets Expectations",
    summary: "",
    strengths: "",
    improvements: "",
    goals: "",
  });

  useEffect(() => {
    const run = async () => {
      setError(null);

      try {
        const user = auth.currentUser;
        if (!user?.email) {
          setManagerDept(null);
          setManagerLegacyId(null);
          setError("Not logged in / missing email.");
          return;
        }

        try {
          const uidDoc = await getDoc(doc(db, "users", user.uid));
          if (uidDoc.exists()) {
            const data = uidDoc.data() as any;
            const dept = data?.department;
            const lid = data?.legacyId || data?.id;
            if (dept) setManagerDept(String(dept));
            if (lid) setManagerLegacyId(String(lid));
          }
        } catch {
          // empty
        }
        const snap = await getDocs(query(collection(db, "users"), where("email", "==", user.email), limit(1)));
        if (!snap.empty) {
          const d = snap.docs[0];
          const data = d.data() as any;

          setManagerDept((prev) => prev ?? (data?.department ? String(data.department) : null));
          setManagerLegacyId((prev) => prev ?? String(data?.legacyId || data?.id || d.id));
        }
      } catch (e: any) {
        console.error(e);
        setError(e?.message || "Failed to resolve manager profile");
      }
    };

    run();
  }, []);

  useEffect(() => {
    const loadPeriods = async () => {
      try {
        const snap = await getDocs(collection(db, "reviewCycles"));
        if (snap.empty) return;

        const found: string[] = [];
        snap.docs.forEach((d) => {
          const data = d.data() as any;
          const name = String(data?.name || "");
          const type = String(data?.type || "");
          if (!name) return;
          if (type.toLowerCase().includes("quarter") || name.toLowerCase().includes("q")) {
            const m = name.match(/(Q[1-4]\s*20\d{2})/i);
            if (m?.[1]) found.push(m[1].replace(/\s+/g, " ").toUpperCase().replace("Q", "Q"));
          }
        });

        const uniq = Array.from(new Set(found));
        if (uniq.length > 0) {
          uniq.sort((a, b) => {
            const [qa, ya] = a.split(" ");
            const [qb, yb] = b.split(" ");
            const yearA = Number(ya);
            const yearB = Number(yb);
            if (yearA !== yearB) return yearB - yearA;
            const qA = Number(qa.replace("Q", ""));
            const qB = Number(qb.replace("Q", ""));
            return qB - qA;
          });

          setPeriods(uniq);
          setSelectedPeriod((prev) => (uniq.includes(prev) ? prev : uniq[0]));
        }
      } catch {
        // empty
      }
    };

    loadPeriods();
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
    const loadPeriodReviews = async () => {
      setError(null);

      try {
        if (!selectedPeriod || team.length === 0) {
          setReviewsByEmployeeId({});
          return;
        }
        const ids = team.map((t) => t.id);
        const snap = await getDocs(
          query(
            collection(db, "performanceReviews"),
            where("period", "==", selectedPeriod),
            where("employeeId", "in", ids)
          )
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
          const fallbackMap: Record<string, PerformanceReview> = {};
          for (const t of team) {
            const snap2 = await getDocs(
              query(
                collection(db, "performanceReviews"),
                where("employeeId", "==", t.id),
                where("period", "==", selectedPeriod),
                limit(1)
              )
            );
            if (!snap2.empty) {
              const d = snap2.docs[0];
              fallbackMap[t.id] = { id: d.id, ...(d.data() as any) };
            }
          }
          setReviewsByEmployeeId(fallbackMap);
        } catch (fallbackErr: any) {
          setError(
            fallbackErr?.message ||
              e?.message ||
              "Failed to load performance reviews for this period"
          );
        }
      }
    };

    loadPeriodReviews();
  }, [selectedPeriod, team]);

  const teamWithStatus = useMemo(() => {
    return team.map((t) => {
      const hasReview = !!reviewsByEmployeeId[t.id];
      const status = hasReview ? "completed" : (t.reviewStatus || "pending");
      return { ...t, reviewStatus: status };
    });
  }, [team, reviewsByEmployeeId]);

  const openEmployee = async (emp: TeamMember) => {
    setError(null);
    setSelectedEmployee(emp);
    setActiveReview(null);

    try {
      const snap = await getDocs(
        query(
          collection(db, "performanceReviews"),
          where("employeeId", "==", emp.id),
          where("period", "==", selectedPeriod),
          limit(1)
        )
      );

      if (!snap.empty) {
        const d = snap.docs[0];
        const review = { id: d.id, ...(d.data() as any) } as PerformanceReview;
        setActiveReview(review);

        setForm({
          overallOutcome: review.overallOutcome || "Meets Expectations",
          summary: review.managerEvaluation?.summary || "",
          strengths: fromArrayToTextarea(review.managerEvaluation?.strengths),
          improvements: fromArrayToTextarea(review.managerEvaluation?.areasForDevelopment),
          goals: fromArrayToTextarea(review.managerEvaluation?.goalsNextPeriod),
        });
        return;
      }

      setForm({
        overallOutcome: emp.performanceOutcome || "Meets Expectations",
        summary: "",
        strengths: "",
        improvements: "",
        goals: "",
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

    setSaving(true);
    setError(null);

    try {
      const employeeId = selectedEmployee.id;
      const period = selectedPeriod;

      const payload: any = {
        employeeId,
        period,
        overallOutcome: form.overallOutcome,
        managerEvaluation: {
          summary: form.summary,
          strengths: toLinesArray(form.strengths),
          areasForDevelopment: toLinesArray(form.improvements),
          goalsNextPeriod: toLinesArray(form.goals),
        },
        status: finalStatus,
        updatedAt: serverTimestamp(),
      };

      if (!activeReview?.id) {
        payload.createdAt = serverTimestamp();
      }

      if (activeReview?.id) {
        await updateDoc(doc(db, "performanceReviews", activeReview.id), payload);
      } else {
        const newId = makePerfDocId(employeeId, period);
        await setDoc(doc(db, "performanceReviews", newId), payload, { merge: true });
        const newDoc = await getDoc(doc(db, "performanceReviews", newId));
        if (newDoc.exists()) {
          setActiveReview({ id: newDoc.id, ...(newDoc.data() as any) });
        }
      }

      await updateDoc(doc(db, "teamMembers", employeeId), {
        reviewStatus: finalStatus === "completed" ? "completed" : "in_progress",
        performanceOutcome: form.overallOutcome,
        lastReviewDate: new Date().toISOString().slice(0, 10),
      });

      setTeam((prev) =>
        prev.map((t) =>
          t.id === employeeId
            ? {
                ...t,
                reviewStatus: finalStatus === "completed" ? "completed" : "in_progress",
                performanceOutcome: form.overallOutcome,
                lastReviewDate: new Date().toISOString().slice(0, 10),
              }
            : t
        )
      );

      setReviewsByEmployeeId((prev) => ({
        ...prev,
        [employeeId]: {
          id: activeReview?.id || makePerfDocId(employeeId, period),
          employeeId,
          period,
          overallOutcome: form.overallOutcome,
          managerEvaluation: payload.managerEvaluation,
          status: finalStatus,
        },
      }));
    } catch (e: any) {
      console.error(e);
      setError(e?.message || "Failed to save evaluation");
    } finally {
      setSaving(false);
    }
  };

  if (selectedEmployee) {
    const createdAt = activeReview?.createdAt;
    const isCompleted = (activeReview?.status || "pending").toLowerCase() === "completed";

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
            </div>

            <div className="flex items-center gap-3">
              <select
                value={selectedPeriod}
                onChange={async (e) => {
                  const next = e.target.value;
                  setSelectedPeriod(next);
                  setTimeout(() => openEmployee(selectedEmployee), 0);
                }}
                className="border rounded-lg px-3 py-2 bg-white"
              >
                {periods.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>

              {isCompleted ? (
                <span className="text-xs px-2 py-1 rounded bg-green-50 text-green-700 border border-green-200">
                  Completed
                </span>
              ) : (
                <span className="text-xs px-2 py-1 rounded bg-orange-50 text-orange-700 border border-orange-200">
                  {activeReview?.status ? String(activeReview.status) : "Draft / New"}
                </span>
              )}
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
                placeholder="List key strengths and accomplishments... (one per line)"
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
                placeholder="Identify areas that need development... (one per line)"
                className="w-full border rounded-lg px-3 py-3 bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Goals for Next Period</label>
              <textarea
                rows={3}
                value={form.goals}
                onChange={(e) => setForm((p) => ({ ...p, goals: e.target.value }))}
                placeholder="Set goals and expectations for the next review period... (one per line)"
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

        {activeReview?.managerEvaluation?.summary && (
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-semibold">Manager Evaluation</div>
                <div className="text-sm text-gray-600">Direct manager's assessment</div>
              </div>

              <div className="flex items-center gap-2">
                {isCompleted ? (
                  <div className="flex items-center gap-2 text-green-700">
                    <CheckCircle className="size-5" />
                    <span className="text-sm font-medium">Completed</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-orange-700">
                    <Clock className="size-5" />
                    <span className="text-sm font-medium">{String(activeReview.status || "Draft")}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 text-gray-800">{activeReview.managerEvaluation.summary}</div>

            <div className="mt-6">
              <div className="font-semibold mb-2">Top Strengths</div>
              <ul className="space-y-2">
                {(activeReview.managerEvaluation.strengths || []).map((s, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle className="size-5 text-green-600 mt-0.5" />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-6">
              <div className="font-semibold mb-2">Areas for Development</div>
              <ul className="list-disc ml-5 space-y-1">
                {(activeReview.managerEvaluation.areasForDevelopment || []).map((s, idx) => (
                  <li key={idx}>{s}</li>
                ))}
              </ul>
            </div>

            <div className="mt-6 text-xs text-gray-500">
              Created: {formatDateSafe(createdAt)}
            </div>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Employee Evaluation</h1>
          <p className="text-gray-600 mt-1">
            {managerDept ? `Department: ${managerDept}` : "Loading department..."}
          </p>
          {managerLegacyId && (
            <p className="text-xs text-gray-400 mt-2">Resolved legacyId: {managerLegacyId}</p>
          )}
        </div>

        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-600">Quarter</label>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="border rounded-lg px-3 py-2 bg-white"
          >
            {periods.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <Card className="p-4 border border-red-200 bg-red-50 text-red-700">{error}</Card>
      )}

      {loading ? (
        <Card className="p-10 text-center text-gray-500">Loading…</Card>
      ) : teamWithStatus.length === 0 ? (
        <Card className="p-10 text-center text-gray-500">No team members found.</Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {teamWithStatus.map((emp) => {
            const status = String(emp.reviewStatus || "pending").toLowerCase();
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

                  <div className="text-sm text-gray-600">
                    {isCompleted ? "View / Edit" : "Evaluate"}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ManagerPerformanceReview;