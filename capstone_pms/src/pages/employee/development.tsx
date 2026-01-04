import { useEffect, useMemo, useState } from "react";
import { Card } from "@heroui/react";
import { Target, ChevronDown, ChevronUp, CheckCircle } from "lucide-react";

import { useAuth } from "../../contexts/AuthContext";
import { resolveEmployeeId } from "../../utils/resolveEmployeeId";
import { db } from "../../firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";

type ActionItem = {
  id: string;
  title?: string;
  description?: string;
  dueDate?: any;
  status?: string;
  owner?: string;
  progress?: number;
};

type FocusArea = {
  id: string;
  title?: string;
  description?: string;
  priority?: string;
  actionItems: ActionItem[];
};

type DevPlan = {
  id: string; // firestore doc id (dp_emp1)
  employeeId: string; // emp1
  employeeName?: string;
  status?: string;
  createdDate?: any;
  lastUpdated?: any;

  // ✅ IMPORTANT: your DB stores arrays in the SAME DOC
  focusAreas?: FocusArea[];
};

function formatDate(v: any): string {
  if (!v) return "—";

  // Firestore Timestamp
  if (typeof v?.toDate === "function") return v.toDate().toLocaleDateString();

  // Sometimes Timestamp-like { seconds }
  if (typeof v?.seconds === "number") {
    const d = new Date(v.seconds * 1000);
    return isNaN(d.getTime()) ? "—" : d.toLocaleDateString();
  }

  // String ISO or yyyy-mm-dd
  if (typeof v === "string") {
    const d = new Date(v);
    return isNaN(d.getTime()) ? v : d.toLocaleDateString();
  }

  // Date
  if (v instanceof Date) return v.toLocaleDateString();

  return "—";
}

function statusLabel(s?: string) {
  const v = (s || "").toLowerCase();
  if (v === "completed") return "Completed";
  if (v === "in_progress" || v === "in progress") return "In Progress";
  if (v === "not_started" || v === "not started") return "Not Started";
  if (v === "active") return "Active";
  return s ? s : "—";
}

function priorityLabel(p?: string) {
  const v = (p || "").toLowerCase();
  if (v === "high") return "High Priority";
  if (v === "medium") return "Medium Priority";
  if (v === "low") return "Low Priority";
  return p ? p : "Priority";
}

function priorityBadgeClasses(p?: string) {
  const v = (p || "").toLowerCase();
  if (v === "high") return "bg-red-50 text-red-700";
  if (v === "medium") return "bg-orange-50 text-orange-700";
  if (v === "low") return "bg-green-50 text-green-700";
  return "bg-gray-100 text-gray-700";
}

function itemStatusBadgeClasses(s?: string) {
  const v = (s || "").toLowerCase();
  if (v === "completed") return "bg-green-50 text-green-700";
  if (v === "in_progress" || v === "in progress")
    return "bg-blue-50 text-blue-700";
  return "bg-gray-100 text-gray-700";
}

function clamp01(n: number) {
  return Math.max(0, Math.min(100, n));
}

function itemProgress(ai: ActionItem): number {
  if (typeof ai.progress === "number") return clamp01(ai.progress);
  const s = (ai.status || "").toLowerCase();
  if (s === "completed") return 100;
  if (s === "in_progress" || s === "in progress") return 50;
  return 0;
}

const EmployeeDevelopmentPlan = () => {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState<DevPlan | null>(null);
  const [focusAreas, setFocusAreas] = useState<FocusArea[]>([]);
  const [expandedArea, setExpandedArea] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchPlan = async () => {
      if (!user) return;

      setLoading(true);

      try {
        const employeeId = await resolveEmployeeId(user); // should be legacyId like "emp1"
        if (!employeeId) {
          if (!mounted) return;
          setPlan(null);
          setFocusAreas([]);
          setExpandedArea(null);
          return;
        }

        // ✅ 1) Prefer exact doc id: dp_emp1
        const expectedDocId = `dp_${employeeId}`;
        const exactSnap = await getDoc(doc(db, "developmentPlans", expectedDocId));

        let planDocId: string | null = null;
        let planData: any = null;

        if (exactSnap.exists()) {
          planDocId = exactSnap.id;
          planData = exactSnap.data();
        } else {
          // ✅ 2) Fallback: query by employeeId
          const dpSnap = await getDocs(
            query(collection(db, "developmentPlans"), where("employeeId", "==", employeeId))
          );

          if (dpSnap.empty) {
            if (!mounted) return;
            setPlan(null);
            setFocusAreas([]);
            setExpandedArea(null);
            return;
          }

          // Pick active if exists, else first
          const picked =
            dpSnap.docs.find((d) => String((d.data() as any)?.status || "").toLowerCase() === "active") ??
            dpSnap.docs[0];

          planDocId = picked.id;
          planData = picked.data();
        }

        if (!mounted) return;

        const resolvedPlan: DevPlan = {
          id: String(planDocId),
          employeeId: String(planData?.employeeId || employeeId),
          employeeName: planData?.employeeName,
          status: planData?.status,
          createdDate: planData?.createdDate ?? planData?.createdAt,
          lastUpdated: planData?.lastUpdated ?? planData?.updatedAt,
          focusAreas: Array.isArray(planData?.focusAreas) ? planData.focusAreas : [],
        };

        // ✅ Read focusAreas from the doc arrays (NOT subcollections)
        const rawFocusAreas = Array.isArray(resolvedPlan.focusAreas) ? resolvedPlan.focusAreas : [];

        const faList: FocusArea[] = rawFocusAreas.map((fa: any) => ({
          id: String(fa?.id || crypto.randomUUID()),
          title: fa?.title,
          description: fa?.description,
          priority: fa?.priority,
          actionItems: Array.isArray(fa?.actionItems)
            ? fa.actionItems.map((ai: any) => ({
                id: String(ai?.id || crypto.randomUUID()),
                title: ai?.title,
                description: ai?.description,
                dueDate: ai?.dueDate,
                status: ai?.status,
                owner: ai?.owner,
                progress: ai?.progress,
              }))
            : [],
        }));

        // Sort by priority: high -> medium -> low
        const priorityRank = (p?: string) => {
          const v = (p || "").toLowerCase();
          if (v === "high") return 1;
          if (v === "medium") return 2;
          if (v === "low") return 3;
          return 99;
        };
        faList.sort((a, b) => priorityRank(a.priority) - priorityRank(b.priority));

        setPlan(resolvedPlan);
        setFocusAreas(faList);
        setExpandedArea((prev) => prev ?? (faList[0]?.id ?? null));
      } catch (err) {
        console.warn("Failed to load development plan page", err);
        if (mounted) {
          setPlan(null);
          setFocusAreas([]);
          setExpandedArea(null);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchPlan();
    return () => {
      mounted = false;
    };
  }, [user]);

  const summary = useMemo(() => {
    let total = 0;
    let done = 0;

    for (const fa of focusAreas) {
      for (const ai of fa.actionItems) {
        total++;
        const s = (ai.status || "").toLowerCase();
        const p = itemProgress(ai);
        if (s === "completed" || p === 100) done++;
      }
    }

    const percent = total ? Math.round((done / total) * 100) : null;
    return { total, done, percent };
  }, [focusAreas]);

  const overallStatus = plan?.status ? statusLabel(plan.status) : "Not Started";
  const overallPercentText =
    summary.percent === null ? "—% Complete" : `${summary.percent}% Complete`;

  return (
    <div className="w-full space-y-6 px-6 lg:px-10">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Development Plan</h1>
          <p className="text-gray-600 mt-1">
            Track your professional growth and action items
          </p>
        </div>

        <Card className="p-8 bg-gradient-to-br from-green-600 to-emerald-700 text-white">
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <Target className="size-8" />
                <h2 className="text-3xl">{overallPercentText}</h2>
              </div>

              {loading ? (
                <p className="text-white/90">Loading...</p>
              ) : plan && summary.total > 0 ? (
                <p className="text-white/90">
                  {summary.done} of {summary.total} action items completed
                </p>
              ) : plan ? (
                <p className="text-white/90">No action items available yet</p>
              ) : (
                <p className="text-white/90">No development plan assigned</p>
              )}
            </div>

            <span className="px-4 py-2 bg-white/20 rounded-lg">
              {overallStatus}
            </span>
          </div>

          <div className="h-3 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full"
              style={{
                width: summary.percent === null ? "0%" : `${summary.percent}%`,
              }}
            />
          </div>

          <div className="flex items-center justify-between mt-4 text-sm text-white/80">
            <span>Last updated: {formatDate(plan?.lastUpdated)}</span>
            <span>Created: {formatDate(plan?.createdDate)}</span>
          </div>
        </Card>

        <div className="space-y-4">
          {!loading && (!plan || focusAreas.length === 0) ? (
            <Card className="p-10 text-center text-gray-500">
              <CheckCircle className="size-12 mx-auto mb-3 text-green-500" />
              <p>No development plan has been assigned yet.</p>
              <p className="text-sm mt-1">
                Your manager or HR will create one for you.
              </p>
            </Card>
          ) : null}

          {focusAreas.map((fa) => {
            const isOpen = expandedArea === fa.id;

            const areaTotal = fa.actionItems.length;
            const areaDone = fa.actionItems.filter(
              (ai) =>
                (ai.status || "").toLowerCase() === "completed" ||
                itemProgress(ai) === 100
            ).length;

            const areaPercent = areaTotal
              ? Math.round((areaDone / areaTotal) * 100)
              : 0;

            return (
              <Card key={fa.id} className="overflow-hidden">
                <button
                  onClick={() => setExpandedArea(isOpen ? null : fa.id)}
                  className="w-full flex items-center justify-between p-6 hover:bg-gray-50"
                  type="button"
                >
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-xl">{fa.title ?? "Focus Area"}</h2>
                      <span
                        className={`text-xs px-2 py-1 rounded ${priorityBadgeClasses(
                          fa.priority
                        )}`}
                      >
                        {priorityLabel(fa.priority)}
                      </span>
                    </div>

                    <p className="text-gray-600 mb-3">{fa.description ?? "—"}</p>

                    <div className="flex items-center gap-4">
                      <div className="flex-1 max-w-xs">
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-600 rounded-full"
                            style={{ width: `${areaPercent}%` }}
                          />
                        </div>
                      </div>

                      <span className="text-sm text-gray-600">
                        {areaDone} / {areaTotal} completed
                      </span>
                    </div>
                  </div>

                  {isOpen ? (
                    <ChevronUp className="size-6 ml-4" />
                  ) : (
                    <ChevronDown className="size-6 ml-4" />
                  )}
                </button>

                {isOpen && (
                  <div className="p-6 pt-0 space-y-4">
                    {fa.actionItems.length === 0 ? (
                      <div className="text-gray-500 text-sm">
                        No action items for this focus area yet.
                      </div>
                    ) : (
                      fa.actionItems.map((ai) => {
                        const p = itemProgress(ai);
                        return (
                          <Card key={ai.id} className="p-5 border border-gray-200">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex items-start gap-3">
                                <div className="mt-1 size-4 rounded-full border border-gray-300" />
                                <div>
                                  <div className="font-medium">
                                    {ai.title ?? "Action Item"}
                                  </div>
                                  <div className="text-sm text-gray-600 mt-1">
                                    {ai.description ?? "—"}
                                  </div>
                                </div>
                              </div>

                              <span
                                className={`text-xs px-2 py-1 rounded ${itemStatusBadgeClasses(
                                  ai.status
                                )}`}
                              >
                                {statusLabel(ai.status)}
                              </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 text-sm text-gray-600">
                              <div>
                                Owner: {ai.owner ?? plan?.employeeName ?? "—"}
                              </div>
                              <div>Due Date: {formatDate(ai.dueDate)}</div>
                            </div>

                            <div className="mt-4">
                              <div className="text-xs text-gray-500 mb-2">
                                Progress
                              </div>
                              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-blue-600 rounded-full"
                                  style={{ width: `${p}%` }}
                                />
                              </div>
                              <div className="text-right text-xs text-gray-500 mt-1">
                                {p}%
                              </div>
                            </div>
                          </Card>
                        );
                      })
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default EmployeeDevelopmentPlan;
