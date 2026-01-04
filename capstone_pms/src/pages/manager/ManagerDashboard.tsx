import { useEffect, useMemo, useState } from "react";
import { Card } from "@heroui/react";
import { Link } from "react-router-dom";
import {
  Users,
  Clock,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

import { collection, getDoc, getDocs, query, where, doc } from "firebase/firestore";
import { db, auth } from "../../firebase"; // ✅ adjust path if needed (e.g. "../../firebase")

type TeamMember = {
  id: string;
  name?: string;
  department?: string;
  position?: string;
  avatar?: string; // "SJ"
  performanceOutcome?: string; // "Exceeds Expectations" etc
  reviewStatus?: "pending" | "in_progress" | "completed" | string;
  lastReviewDate?: any;
};

function pillClassByOutcome(outcome?: string) {
  const o = String(outcome || "").toLowerCase();

  if (o.includes("outstanding"))
    return "bg-purple-100 text-purple-700";
  if (o.includes("exceeds"))
    return "bg-blue-100 text-blue-700";
  if (o.includes("meets"))
    return "bg-green-100 text-green-700";
  if (o.includes("needs"))
    return "bg-yellow-100 text-yellow-800";

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

const ManagerDashboard = () => {
  const [department, setDepartment] = useState<string>("Engineering");
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);

      try {
        const user = auth.currentUser;

        // 1) Try to load manager dept from users/{uid}
        if (user?.uid) {
          try {
            const udoc = await getDoc(doc(db, "users", user.uid));
            if (udoc.exists()) {
              const u = udoc.data() as any;
              if (u?.department && mounted) setDepartment(String(u.department));
            }
          } catch {
            // ignore
          }
        }

        // 2) Load team members for that department
        const dept = department || "Engineering";
        const snap = await getDocs(
          query(collection(db, "teamMembers"), where("department", "==", dept))
        );

        if (!mounted) return;

        const rows: TeamMember[] = snap.docs.map((d) => {
          // If your doc IDs are the member ids, keep both safe:
          const data = d.data() as any;
          return {
            id: data?.id || d.id,
            ...(data as any),
          };
        });

        // Optional sort (match figma order a bit)
        rows.sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));

        setTeam(rows);
      } catch (e) {
        console.error("ManagerDashboard load failed:", e);
        if (mounted) setTeam([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [department]);

  const stats = useMemo(() => {
    const total = team.length;
    const pending = team.filter((m) => String(m.reviewStatus).toLowerCase() === "pending").length;
    const inProgress = team.filter((m) => String(m.reviewStatus).toLowerCase() === "in_progress").length;
    const completed = team.filter((m) => String(m.reviewStatus).toLowerCase() === "completed").length;
    return { total, pending, inProgress, completed };
  }, [team]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Manager Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Manage your team&apos;s performance and development
        </p>
        <p className="text-xs text-gray-400 mt-2">
          Department: {department || "—"}
        </p>
      </div>

      {/* Top stats */}
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
                <Link to="/manager/performance-review" className="text-blue-600 text-sm">
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

      {/* Team overview */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Team Overview</h2>
          <Link to="/manager/performance-review" className="text-blue-600 text-sm">
            Manage all
          </Link>
        </div>

        {loading ? (
          <div className="py-10 text-center text-gray-500">Loading…</div>
        ) : team.length === 0 ? (
          <div className="py-10 text-center text-gray-500">
            No team data available
            <div className="text-sm text-gray-400 mt-1">
              Team members will appear here once loaded
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {team.map((m) => {
              const isCompleted = String(m.reviewStatus).toLowerCase() === "completed";
              const actionText = isCompleted ? "View" : "Evaluate";

              // ✅ change this route if your app uses a different one
              const actionTo = `/manager/performance/${m.id}`;

              return (
                <div
                  key={m.id}
                  className="border rounded-xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="size-12 rounded-lg bg-blue-600 text-white flex items-center justify-center font-semibold">
                      {m.avatar || (m.name ? m.name.split(" ").map((x) => x[0]).slice(0, 2).join("") : "—")}
                    </div>

                    <div>
                      <div className="font-semibold">{m.name || "—"}</div>
                      <div className="text-sm text-gray-600">{m.position || "—"}</div>
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8">
                    <div className="flex items-center gap-3">
                      <div className="text-xs text-gray-500">Performance</div>
                      <span className={`text-xs px-3 py-1 rounded-full ${pillClassByOutcome(m.performanceOutcome)}`}>
                        {m.performanceOutcome || "—"}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-xs text-gray-500">Review Status</div>
                      <div className="flex items-center gap-2">
                        {statusIcon(m.reviewStatus)}
                        <span className="text-sm">{statusLabel(m.reviewStatus)}</span>
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

      {/* Quick links cards (optional like figma bottom row) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="font-semibold mb-1">360 Feedback</div>
          <div className="text-sm text-gray-600 mb-4">
            Initiate and manage feedback cycles
          </div>
          <Link to="/manager/feedback" className="text-blue-600 text-sm">
            Open →
          </Link>
        </Card>

        <Card className="p-6">
          <div className="font-semibold mb-1">Development Planning</div>
          <div className="text-sm text-gray-600 mb-4">
            Create and manage development plans
          </div>
          <Link to="/manager/development" className="text-blue-600 text-sm">
            Open →
          </Link>
        </Card>

        <Card className="p-6">
          <div className="font-semibold mb-1">Reward Recommendations</div>
          <div className="text-sm text-gray-600 mb-4">
            Recommend team members for rewards
          </div>
          <Link to="/manager/rewards" className="text-blue-600 text-sm">
            Open →
          </Link>
        </Card>
      </div>
    </div>
  );
};

export default ManagerDashboard;
