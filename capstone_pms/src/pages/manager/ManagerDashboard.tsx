import { useEffect, useMemo, useState } from "react";
import { Card } from "@heroui/react";
import { Link } from "react-router-dom";
import { Users, Clock, TrendingUp, CheckCircle2, AlertCircle } from "lucide-react";
import {
  collection,
  getDoc,
  getDocs,
  query,
  where,
  doc,
} from "firebase/firestore";
import { db, auth } from "../../firebase";

type TeamMember = {
  id: string;
  name?: string;
  department?: string;
  position?: string;
  avatar?: string;
  performanceOutcome?: string;
};

type ReviewCycle = {
  id: string;
  title?: string;
  name?: string;
  type?: string;
  status?: string;
  startDate?: any;
  endDate?: any;
};

type PerformanceReview = {
  id: string;
  employeeId?: string;
  cycleId?: string;
  cycleTitle?: string;
  period?: string;
  status?: string;
  overallOutcome?: string;
};

function pillClassByOutcome(outcome?: string) {
  const o = String(outcome || "").toLowerCase();

  if (o.includes("outstanding")) return "bg-purple-100 text-purple-700";
  if (o.includes("exceeds")) return "bg-blue-100 text-blue-700";
  if (o.includes("meets")) return "bg-green-100 text-green-700";
  if (o.includes("needs")) return "bg-yellow-100 text-yellow-800";

  return "bg-gray-100 text-gray-700";
}

function statusLabel(status?: string) {
  const s = String(status || "").toLowerCase();
  if (s === "pending") return "Pending";
  if (s === "in_progress") return "In Progress";
  if (s === "completed") return "Completed";
  return status || "—";
}

function statusIcon(status?: string) {
  const s = String(status || "").toLowerCase();
  if (s === "pending") return <AlertCircle className="size-4 text-orange-500" />;
  if (s === "in_progress") return <TrendingUp className="size-4 text-yellow-600" />;
  if (s === "completed") return <CheckCircle2 className="size-4 text-green-600" />;
  return <Clock className="size-4 text-gray-500" />;
}

function safeCycleLabel(c: ReviewCycle) {
  return c.title || c.name || "Quarter";
}

function isQuarterLabel(label: string) {
  return /Q[1-4]\s*20\d{2}/i.test(label);
}

function quarterSortDesc(a: string, b: string) {
  const ma = a.match(/(Q[1-4])\s*(20\d{2})/i);
  const mb = b.match(/(Q[1-4])\s*(20\d{2})/i);
  if (!ma || !mb) return b.localeCompare(a);
  const qa = Number(ma[1].toUpperCase().replace("Q", ""));
  const qb = Number(mb[1].toUpperCase().replace("Q", ""));
  const ya = Number(ma[2]);
  const yb = Number(mb[2]);
  if (ya !== yb) return yb - ya;
  return qb - qa;
}

const ManagerDashboard = () => {
  const [department, setDepartment] = useState<string>("");
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [cycles, setCycles] = useState<ReviewCycle[]>([]);
  const [selectedCycleId, setSelectedCycleId] = useState<string>("");
  const [reviewsByEmployeeId, setReviewsByEmployeeId] = useState<Record<string, PerformanceReview>>(
    {}
  );

  useEffect(() => {
    let mounted = true;
    const loadDept = async () => {
      try {
        const user = auth.currentUser;
        if (!user?.uid) return;
        const udoc = await getDoc(doc(db, "users", user.uid));
        if (udoc.exists() && mounted) {
          const u = udoc.data() as any;
          if (u?.department) setDepartment(String(u.department));
        }
      } catch (e) {
        console.error("Failed to load manager dept:", e);
      }
    };

    loadDept();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadTeam = async () => {
      setLoading(true);
      try {
        const dept = department || "Engineering";
        const snap = await getDocs(
          query(collection(db, "teamMembers"), where("department", "==", dept))
        );
        if (!mounted) return;
        const rows: TeamMember[] = snap.docs.map((d) => {
          const data = d.data() as any;
          return {
            id: data?.id || d.id,
            ...(data as any),
          };
        });
        rows.sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
        setTeam(rows);
      } catch (e) {
        console.error("ManagerDashboard load team failed:", e);
        if (mounted) setTeam([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadTeam();
    return () => {
      mounted = false;
    };
  }, [department]);

  useEffect(() => {
    let mounted = true;

    const loadCycles = async () => {
      try {
        const snap = await getDocs(collection(db, "reviewCycles"));
        if (!mounted) return;

        const all: ReviewCycle[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as any),
        }));

        const filtered = all.filter((c) => {
          const label = safeCycleLabel(c);
          const t = String(c.type || "").toLowerCase();
          return t.includes("quarter") || isQuarterLabel(label);
        });

        filtered.sort((a, b) => quarterSortDesc(safeCycleLabel(a), safeCycleLabel(b)));
        setCycles(filtered);
        setSelectedCycleId((prev) => {
          if (prev && filtered.some((c) => c.id === prev)) return prev;
          return filtered[0]?.id || "";
        });
      } catch (e) {
        console.error("Failed to load reviewCycles:", e);
        if (mounted) setCycles([]);
      }
    };

    loadCycles();
    return () => {
      mounted = false;
    };
  }, []);

  const selectedCycle = useMemo(
    () => cycles.find((c) => c.id === selectedCycleId) || null,
    [cycles, selectedCycleId]
  );

  useEffect(() => {
    let mounted = true;

    const loadReviewsForCycle = async () => {
      try {
        if (!selectedCycleId || team.length === 0) {
          if (mounted) setReviewsByEmployeeId({});
          return;
        }
        const teamIds = team.map((t) => t.id);
        let map: Record<string, PerformanceReview> = {};
        try {
          const chunkSize = 10;
          for (let i = 0; i < teamIds.length; i += chunkSize) {
            const chunk = teamIds.slice(i, i + chunkSize);
            const snap = await getDocs(
              query(
                collection(db, "performanceReviews"),
                where("cycleId", "==", selectedCycleId),
                where("employeeId", "in", chunk)
              )
            );
            snap.docs.forEach((d) => {
              const data = d.data() as any;
              const empId = String(data.employeeId || "");
              if (!empId) return;
              map[empId] = { id: d.id, ...(data as any) };
            });
          }

          if (mounted) setReviewsByEmployeeId(map);
          return;
        } catch (e) {
          // empty
          console.warn("cycleId query failed, falling back to period:", e);
        }

        const label = selectedCycle ? safeCycleLabel(selectedCycle) : "";
        if (!label) {
          if (mounted) setReviewsByEmployeeId({});
          return;
        }

        map = {};
        const chunkSize = 10;
        for (let i = 0; i < teamIds.length; i += chunkSize) {
          const chunk = teamIds.slice(i, i + chunkSize);
          const snap2 = await getDocs(
            query(
              collection(db, "performanceReviews"),
              where("period", "==", label),
              where("employeeId", "in", chunk)
            )
          );
          snap2.docs.forEach((d) => {
            const data = d.data() as any;
            const empId = String(data.employeeId || "");
            if (!empId) return;
            map[empId] = { id: d.id, ...(data as any) };
          });
        }

        if (mounted) setReviewsByEmployeeId(map);
      } catch (e) {
        console.error("Failed to load reviews for selected cycle:", e);
        if (mounted) setReviewsByEmployeeId({});
      }
    };

    loadReviewsForCycle();
    return () => {
      mounted = false;
    };
  }, [selectedCycleId, team, selectedCycle]);

  const teamWithQuarterStatus = useMemo(() => {
    return team.map((m) => {
      const review = reviewsByEmployeeId[m.id];
      if (!review) {
        return { ...m, _quarterStatus: "pending" as const };
      }
      const st = String(review.status || "in_progress").toLowerCase();
      if (st === "completed") return { ...m, _quarterStatus: "completed" as const };
      return { ...m, _quarterStatus: "in_progress" as const };
    });
  }, [team, reviewsByEmployeeId]);

  const stats = useMemo(() => {
    const total = teamWithQuarterStatus.length;
    const pending = teamWithQuarterStatus.filter((m: any) => m._quarterStatus === "pending").length;
    const inProgress = teamWithQuarterStatus.filter((m: any) => m._quarterStatus === "in_progress").length;
    const completed = teamWithQuarterStatus.filter((m: any) => m._quarterStatus === "completed").length;
    return { total, pending, inProgress, completed };
  }, [teamWithQuarterStatus]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Manager Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage your team&apos;s performance and development</p>
          <p className="text-xs text-gray-400 mt-2">Department: {department || "—"}</p>
        </div>

        <Card className="p-4 border border-gray-200 w-full md:w-auto">
          <div className="flex items-center gap-3">
            <div className="text-sm text-gray-600">Quarter</div>
            <select
              value={selectedCycleId}
              onChange={(e) => setSelectedCycleId(e.target.value)}
              className="border rounded-lg px-3 py-2 bg-white min-w-[220px]"
              disabled={cycles.length === 0}
            >
              {cycles.length === 0 ? (
                <option value="">No quarters</option>
              ) : (
                cycles.map((c) => (
                  <option key={c.id} value={c.id}>
                    {safeCycleLabel(c)}
                  </option>
                ))
              )}
            </select>
          </div>

          {selectedCycle && (
            <div className="text-xs text-gray-500 mt-2">
              Type: {selectedCycle.type || "—"}
            </div>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-blue-100">
              <Users className="size-6 text-blue-700" />
            </div>
            <div>
              <div className="text-3xl font-semibold">{loading ? "—" : stats.total}</div>
              <div className="text-gray-600">Team Members</div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-orange-100">
              <Clock className="size-6 text-orange-700" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <div className="text-3xl font-semibold">{loading ? "—" : stats.pending}</div>
                {stats.pending > 0 && (
                  <span className="text-xs px-2 py-1 rounded-full bg-orange-50 text-orange-700">
                    Action Needed
                  </span>
                )}
              </div>
              <div className="text-gray-600">Pending Reviews</div>

              <div className="mt-2">
                <Link to="/manager/performance" className="text-blue-600 text-sm">
                  Start reviews →
                </Link>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-yellow-100">
              <TrendingUp className="size-6 text-yellow-700" />
            </div>
            <div>
              <div className="text-3xl font-semibold">{loading ? "—" : stats.inProgress}</div>
              <div className="text-gray-600">In Progress</div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-green-100">
              <CheckCircle2 className="size-6 text-green-700" />
            </div>
            <div>
              <div className="text-3xl font-semibold">{loading ? "—" : stats.completed}</div>
              <div className="text-gray-600">Completed</div>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Team Overview</h2>
          <Link to="/manager/performance" className="text-blue-600 text-sm">
            Manage all
          </Link>
        </div>

        {loading ? (
          <div className="py-10 text-center text-gray-500">Loading…</div>
        ) : teamWithQuarterStatus.length === 0 ? (
          <div className="py-10 text-center text-gray-500">
            No team data available
            <div className="text-sm text-gray-400 mt-1">Team members will appear here once loaded</div>
          </div>
        ) : (
          <div className="space-y-3">
            {teamWithQuarterStatus.map((m: any) => {
              const status = String(m._quarterStatus || "pending").toLowerCase();
              const isCompleted = status === "completed";

              const actionText = isCompleted ? "View" : "Evaluate";
              const actionTo = `/manager/performance/${m.id}`;

              return (
                <div
                  key={m.id}
                  className="border rounded-xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="size-12 rounded-lg bg-blue-600 text-white flex items-center justify-center font-semibold">
                      {m.avatar ||
                        (m.name
                          ? m.name.split(" ").map((x: string) => x[0]).slice(0, 2).join("")
                          : "—")}
                    </div>

                    <div>
                      <div className="font-semibold">{m.name || "—"}</div>
                      <div className="text-sm text-gray-600">{m.position || "—"}</div>
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8">
                    <div className="flex items-center gap-3">
                      <div className="text-xs text-gray-500">Performance</div>
                      <span
                        className={`text-xs px-3 py-1 rounded-full ${pillClassByOutcome(
                          m.performanceOutcome
                        )}`}
                      >
                        {m.performanceOutcome || "—"}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-xs text-gray-500">Review Status</div>
                      <div className="flex items-center gap-2">
                        {statusIcon(status)}
                        <span className="text-sm">{statusLabel(status)}</span>
                      </div>
                    </div>

                    <Link
                      to={actionTo}
                      className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium text-center"
                    >
                      {actionText}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="font-semibold mb-1">360 Feedback</div>
          <div className="text-sm text-gray-600 mb-4">Initiate and manage feedback cycles</div>
          <Link to="/manager/feedback" className="text-blue-600 text-sm">
            Open →
          </Link>
        </Card>

        <Card className="p-6">
          <div className="font-semibold mb-1">Development Planning</div>
          <div className="text-sm text-gray-600 mb-4">Create and manage development plans</div>
          <Link to="/manager/development" className="text-blue-600 text-sm">
            Open →
          </Link>
        </Card>

        <Card className="p-6">
          <div className="font-semibold mb-1">Reward Recommendations</div>
          <div className="text-sm text-gray-600 mb-4">Recommend team members for rewards</div>
          <Link to="/manager/rewards" className="text-blue-600 text-sm">
            Open →
          </Link>
        </Card>
      </div>
    </div>
  );
};

export default ManagerDashboard;