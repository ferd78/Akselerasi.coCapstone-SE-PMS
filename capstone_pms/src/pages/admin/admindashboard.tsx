import { useEffect, useMemo, useState } from "react";
import { Card } from "@heroui/react";
import { Link } from "react-router-dom";
import { Users, Calendar, Activity, FileText } from "lucide-react";
import { db } from "../../firebase";
import {
  collection,
  getCountFromServer,
  getDocs,
  query,
  where,
  Timestamp,
  orderBy,
  limit,
} from "firebase/firestore";

type ReviewCycleDoc = {
  id: string;
  name?: string;
  type?: string;
  status?: string;
  isActive?: boolean;
  startDate?: any;
  endDate?: any;
  participants?: number;
  completed?: number;
};

type AuditLogDoc = {
  id: string;
  timestamp?: any;
  action?: string;
  user?: string;
  ipAddress?: string;
  details?: string;
};

function safeToDate(v: any): Date | null {
  if (!v) return null;
  if (typeof v?.toDate === "function") {
    const d = v.toDate();
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof v?._seconds === "number") {
    const d = new Date(v._seconds * 1000);
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof v?.seconds === "number") {
    const d = new Date(v.seconds * 1000);
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof v === "string") {
    let d = new Date(v);
    if (!isNaN(d.getTime())) return d;
    const normalized = v.replace(" ", "T");
    d = new Date(normalized);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

function formatDateRange(start: any, end: any) {
  const s = safeToDate(start);
  const e = safeToDate(end);
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
  if (!s || !e) return "—";
  return `${fmt(s)} - ${fmt(e)}`;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [activeReviewCyclesCount, setActiveReviewCyclesCount] = useState<number>(0);
  const [activitiesToday, setActivitiesToday] = useState<number>(0);
  const [activeCycles, setActiveCycles] = useState<ReviewCycleDoc[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadDashboard = async () => {
      setLoading(true);
      setError(null);

      try {
        const usersCountSnap = await getCountFromServer(collection(db, "users"));
        const usersCount = usersCountSnap.data().count;
        const activeCyclesQuery = query(
          collection(db, "reviewCycles"),
          where("status", "==", "active")
        );
        const activeCyclesCountSnap = await getCountFromServer(activeCyclesQuery);
        const activeCount = activeCyclesCountSnap.data().count;
        let cyclesList: ReviewCycleDoc[] = [];
        try {
          const activeCyclesListSnap = await getDocs(
            query(
              collection(db, "reviewCycles"),
              where("status", "==", "active"),
              orderBy("startDate", "desc"),
              limit(6)
            )
          );

          cyclesList = activeCyclesListSnap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as any),
          }));
        } catch {
          const activeCyclesListSnap = await getDocs(
            query(collection(db, "reviewCycles"), where("status", "==", "active"), limit(6))
          );
          cyclesList = activeCyclesListSnap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as any),
          }));
        }

        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);

        let todayCount = 0;
        try {
          const qToday = query(
            collection(db, "auditLogs"),
            where("timestamp", ">=", Timestamp.fromDate(startOfDay)),
            orderBy("timestamp", "asc")
          );
          const c = await getCountFromServer(qToday);
          todayCount = c.data().count;
        } catch {
          const all = await getDocs(collection(db, "auditLogs"));
          todayCount = all.docs.reduce((acc, docSnap) => {
            const data = docSnap.data() as AuditLogDoc;
            const d = safeToDate((data as any)?.timestamp);
            if (!d) return acc;
            return d >= startOfDay ? acc + 1 : acc;
          }, 0);
        }

        if (!mounted) return;
        setTotalUsers(usersCount);
        setActiveReviewCyclesCount(activeCount);
        setActiveCycles(cyclesList);
        setActivitiesToday(todayCount);
      } catch (e: any) {
        console.error("[ADMIN DASH] Failed to load dashboard:", e);
        if (mounted) {
          setError(e?.message || "Failed to load admin dashboard data.");
          setTotalUsers(0);
          setActiveReviewCyclesCount(0);
          setActiveCycles([]);
          setActivitiesToday(0);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadDashboard();
    return () => {
      mounted = false;
    };
  }, []);

  const stats = useMemo(
    () => [
      {
        title: "Total Users",
        value: loading ? "—" : totalUsers.toLocaleString(),
        icon: <Users className="size-6 text-blue-600" />,
        bg: "bg-blue-100",
        link: "/admin/users",
        linkText: "Manage →",
      },
      {
        title: "Active Review Cycles",
        value: loading ? "—" : String(activeReviewCyclesCount),
        icon: <Calendar className="size-6 text-green-600" />,
        bg: "bg-green-100",
        status: activeReviewCyclesCount > 0 ? "Active" : undefined,
        link: "/admin/performance",
        linkText: "View →",
      },
      {
        title: "System Activities Today",
        value: loading ? "—" : activitiesToday.toLocaleString(),
        icon: <Activity className="size-6 text-purple-600" />,
        bg: "bg-purple-100",
        link: "/admin/audit",
        linkText: "View log →",
      },
    ],
    [loading, totalUsers, activeReviewCyclesCount, activitiesToday]
  );

  return (
    <div className="max-w mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">System Administration</h1>
        <p className="text-gray-600 mt-1">Manage system configuration and users</p>
      </div>

      {error && (
        <Card className="p-4 border border-red-200 bg-red-50 text-red-700">{error}</Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <Card key={stat.title} className="p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className={`${stat.bg} p-3 rounded-lg`}>{stat.icon}</div>

              {stat.status && (
                <span className="text-sm bg-green-50 text-green-700 px-3 py-1 rounded-full">
                  {stat.status}
                </span>
              )}
            </div>

            <div className="text-3xl mb-1">{stat.value}</div>
            <div className="text-gray-600 mb-2">{stat.title}</div>

            {stat.link && (
              <Link to={stat.link} className="text-blue-600 text-sm">
                {stat.linkText}
              </Link>
            )}
          </Card>
        ))}
      </div>

      {/* Active Review Cycles */}
      <Card className="p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl">Active Review Cycles</h2>
          <Link to="/admin/performance" className="text-blue-600 text-sm">
            Manage all
          </Link>
        </div>

        {loading ? (
          <div className="p-10 text-center text-gray-500">Loading…</div>
        ) : activeCycles.length === 0 ? (
          <div className="p-10 text-center text-gray-500">
            No active review cycles found (status = "active").
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {activeCycles.map((cycle) => {
              const participants = Number(cycle.participants || 0);
              const completed = Number(cycle.completed || 0);
              const pct = participants > 0 ? (completed / participants) * 100 : 0;

              return (
                <Card key={cycle.id} className="p-5 border border-gray-200">
                  <div className="mb-3">
                    <div className="font-medium">{cycle.name || "Review Cycle"}</div>
                    <div className="text-sm text-gray-600">
                      {formatDateRange(cycle.startDate, cycle.endDate)}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="text-sm text-gray-600">Progress</div>
                      <div className="text-lg">{`${clamp(Math.round(pct), 0, 100)}%`}</div>
                    </div>

                    <div>
                      <div className="text-sm text-gray-600">Completion</div>
                      <div className="text-lg">
                        {participants > 0 ? `${completed}/${participants}` : "—"}
                      </div>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="flex items-center justify-between">
                    <span className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm">
                      Active
                    </span>

                    <Link to="/admin/performance" className="text-blue-600 text-sm">
                      View →
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          {
            title: "User Management",
            desc: "Create and manage user accounts",
            icon: <Users className="size-6 text-blue-600" />,
            link: "/admin/users",
            bg: "bg-blue-100",
          },
          {
            title: "Review Cycles",
            desc: "Configure review periods",
            icon: <Calendar className="size-6 text-green-600" />,
            link: "/admin/performance",
            bg: "bg-green-100",
          },
          {
            title: "System Config",
            desc: "Manage system settings",
            icon: <FileText className="size-6 text-orange-600" />,
            link: "/admin/settings",
            bg: "bg-orange-100",
          },
          {
            title: "Audit Log",
            desc: "View system activity",
            icon: <FileText className="size-6 text-orange-600" />,
            link: "/admin/audit",
            bg: "bg-orange-100",
          },
        ].map((action) => (
          <Link to={action.link} key={action.title}>
            <Card className="p-6 border border-gray-200 hover:border-blue-300 transition-colors">
              <div className={`${action.bg} p-3 rounded-lg w-fit mb-4`}>{action.icon}</div>
              <h3 className="text-lg mb-2">{action.title}</h3>
              <p className="text-gray-600 text-sm">{action.desc}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;