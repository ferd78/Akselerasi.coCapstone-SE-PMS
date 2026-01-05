import React, { useEffect, useMemo, useState } from "react";
import { Users, Award, TrendingUp } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

import { db } from "../../firebase";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";

type UserDoc = {
  id: string;
  role?: string;
  name?: string;
  department?: string;
  avatar?: string;
  email?: string;
};

type TeamMemberDoc = {
  id: string;
  performanceOutcome?: string;
  department?: string;
  name?: string;
};

type ReviewSnapshotDoc = {
  id: string;
  employeeId?: string;
  overallOutcome?: string;
  finalScore?: number;
  updatedAt?: any;
};

type Bucket =
  | "outstanding"
  | "exceeds"
  | "meets"
  | "needs_improvement"
  | "unsatisfactory"
  | "unknown";

const COLORS = {
  meets: "#22C55E",
  exceeds: "#3B82F6",
  outstanding: "#A855F7",
  needs_improvement: "#EAB308",
  unsatisfactory: "#EF4444",
  unknown: "#9CA3AF",
};

function toBucket(outcome?: string): Bucket {
  const v = String(outcome || "").trim().toLowerCase();
  if (v.includes("outstanding")) return "outstanding";
  if (v.includes("exceed")) return "exceeds";
  if (v.includes("meet")) return "meets";
  if (v.includes("needs improvement") || v.includes("need improvement"))
    return "needs_improvement";
  if (v.includes("unsatisfactory")) return "unsatisfactory";
  return "unknown";
}

function monthLabel(d: Date): string {
  return d.toLocaleString("en-US", { month: "short" });
}

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
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function addMonths(d: Date, months: number) {
  const x = new Date(d);
  x.setMonth(x.getMonth() + months);
  return x;
}

function subMonths(d: Date, months: number) {
  return addMonths(d, -months);
}

function last6MonthsLabelsAnchored(endDate: Date): string[] {
  const end = startOfMonth(endDate);
  const labels: string[] = [];
  for (let i = 5; i >= 0; i--) {
    labels.push(monthLabel(addMonths(end, -i)));
  }
  return labels;
}

const HRTalentAnalytics = () => {
  const [loading, setLoading] = useState(true);

  const [employees, setEmployees] = useState<UserDoc[]>([]);
  const [teamMembers, setTeamMembers] = useState<Record<string, TeamMemberDoc>>(
    {}
  );
  const [snapshotsAll, setSnapshotsAll] = useState<ReviewSnapshotDoc[]>([]);

  useEffect(() => {
    let mounted = true;

    const fetchAll = async () => {
      setLoading(true);
      try {
        const usersSnap = await getDocs(
          query(collection(db, "users"), where("role", "==", "employee"))
        );
        const users: UserDoc[] = usersSnap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as any),
        }));
        const tmSnap = await getDocs(collection(db, "teamMembers"));
        const tmMap: Record<string, TeamMemberDoc> = {};
        tmSnap.docs.forEach((d) => {
          tmMap[d.id] = { id: d.id, ...(d.data() as any) };
        });
        const snapSnap = await getDocs(
          query(collection(db, "reviewSnapshots"), orderBy("updatedAt", "asc"))
        );
        const snapList: ReviewSnapshotDoc[] = snapSnap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as any),
        }));

        if (!mounted) return;

        setEmployees(users);
        setTeamMembers(tmMap);
        setSnapshotsAll(snapList);
      } catch (e) {
        console.warn("Failed to load talent analytics from Firestore", e);
        if (mounted) {
          setEmployees([]);
          setTeamMembers({});
          setSnapshotsAll([]);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchAll();
    return () => {
      mounted = false;
    };
  }, []);

  const totalEmployees = employees.length;
  const latestSnapshotDate = useMemo(() => {
    const dates = snapshotsAll
      .map((s) => safeToDate(s.updatedAt))
      .filter((d): d is Date => !!d)
      .sort((a, b) => a.getTime() - b.getTime());

    return dates[dates.length - 1] ?? null;
  }, [snapshotsAll]);

  const windowEnd = latestSnapshotDate ?? new Date();
  const windowStart = startOfMonth(subMonths(windowEnd, 5));

  const snapshots = useMemo(() => {
    return snapshotsAll.filter((s) => {
      const d = safeToDate(s.updatedAt);
      if (!d) return false;
      return d >= windowStart && d <= addMonths(startOfMonth(windowEnd), 1);
    });
  }, [snapshotsAll, windowStart, windowEnd]);

  const latestSnapshotByEmployee = useMemo(() => {
    const map: Record<string, ReviewSnapshotDoc> = {};
    for (const s of snapshotsAll) {
      const empId = s.employeeId;
      if (!empId) continue;
      const d = safeToDate(s.updatedAt);
      if (!d) continue;

      const cur = map[empId];
      if (!cur) {
        map[empId] = s;
        continue;
      }
      const curD = safeToDate(cur.updatedAt);
      if (!curD || d.getTime() > curD.getTime()) map[empId] = s;
    }
    return map;
  }, [snapshotsAll]);

  const currentBuckets = useMemo(() => {
    const buckets: Bucket[] = [];

    for (const u of employees) {
      const tm = teamMembers[u.id];
      const outcome =
        tm?.performanceOutcome ??
        latestSnapshotByEmployee[u.id]?.overallOutcome ??
        undefined;

      buckets.push(toBucket(outcome));
    }

    return buckets;
  }, [employees, teamMembers, latestSnapshotByEmployee]);

  const talentDistribution = useMemo(() => {
    const dist = {
      outstanding: 0,
      exceeds: 0,
      meets: 0,
      needs_improvement: 0,
      unsatisfactory: 0,
      unknown: 0,
    };

    for (const b of currentBuckets) {
      (dist as any)[b] += 1;
    }

    return dist;
  }, [currentBuckets]);

  const highPerformersPercent = useMemo(() => {
    if (!totalEmployees) return 0;
    const high = talentDistribution.outstanding + talentDistribution.exceeds;
    return (high / totalEmployees) * 100;
  }, [talentDistribution, totalEmployees]);

  const avgPerformance = useMemo(() => {
    const employeeSet = new Set(employees.map((e) => e.id));

    const valid = snapshots.filter(
      (s) => s.employeeId && employeeSet.has(s.employeeId)
    );

    const scores = valid
      .map((s) => (typeof s.finalScore === "number" ? s.finalScore : null))
      .filter((n): n is number => n !== null && Number.isFinite(n));

    if (scores.length === 0) return 0;

    const avg100 = scores.reduce((a, b) => a + b, 0) / scores.length;
    return avg100 / 20;
  }, [snapshots, employees]);

  const deptPerformance = useMemo(() => {
    const byDept: Record<
      string,
      { employees: number; scoreSum: number; scoreCount: number }
    > = {};

    for (const u of employees) {
      const dept = (u.department || "Unknown").trim() || "Unknown";
      if (!byDept[dept])
        byDept[dept] = { employees: 0, scoreSum: 0, scoreCount: 0 };

      byDept[dept].employees += 1;

      const s = latestSnapshotByEmployee[u.id];
      const fs = typeof s?.finalScore === "number" ? s.finalScore : null;
      if (fs !== null && Number.isFinite(fs)) {
        byDept[dept].scoreSum += fs;
        byDept[dept].scoreCount += 1;
      }
    }

    const rows = Object.entries(byDept).map(([dept, v]) => {
      const avg100 = v.scoreCount ? v.scoreSum / v.scoreCount : 0;
      const avg5 = avg100 / 20;
      return {
        name: dept,
        count: v.employees,
        score: avg5,
      };
    });

    rows.sort((a, b) => b.count - a.count);
    return rows;
  }, [employees, latestSnapshotByEmployee]);

  const performanceTrends = useMemo(() => {
    const months = last6MonthsLabelsAnchored(windowEnd);

    const rows = months.map((m) => ({
      name: m,
      Exceeds: 0,
      Meets: 0,
      NeedsImprovement: 0,
      Outstanding: 0,
      Unsatisfactory: 0,
    }));

    const idx: Record<string, number> = {};
    rows.forEach((r, i) => (idx[r.name] = i));

    for (const s of snapshots) {
      const d = safeToDate(s.updatedAt);
      if (!d) continue;

      const m = monthLabel(d);
      if (idx[m] === undefined) continue;

      const b = toBucket(s.overallOutcome);
      const row = rows[idx[m]];

      if (b === "exceeds") row.Exceeds += 1;
      else if (b === "meets") row.Meets += 1;
      else if (b === "needs_improvement") row.NeedsImprovement += 1;
      else if (b === "outstanding") row.Outstanding += 1;
      else if (b === "unsatisfactory") row.Unsatisfactory += 1;
    }

    return rows;
  }, [snapshots, windowEnd]);

  const distributionData = useMemo(
    () => [
      { name: "meets", value: talentDistribution.meets, color: COLORS.meets },
      {
        name: "exceeds",
        value: talentDistribution.exceeds,
        color: COLORS.exceeds,
      },
      {
        name: "outstanding",
        value: talentDistribution.outstanding,
        color: COLORS.outstanding,
      },
      {
        name: "needs improvement",
        value: talentDistribution.needs_improvement,
        color: COLORS.needs_improvement,
      },
      {
        name: "unsatisfactory",
        value: talentDistribution.unsatisfactory,
        color: COLORS.unsatisfactory,
      },
      ...(talentDistribution.unknown > 0
        ? [
            {
              name: "unknown",
              value: talentDistribution.unknown,
              color: COLORS.unknown,
            },
          ]
        : []),
    ],
    [talentDistribution]
  );

  const statTotalEmployees = loading ? "—" : String(totalEmployees);
  const statHighPerformers = loading
    ? "—"
    : `${highPerformersPercent.toFixed(1)}%`;
  const statAvgPerformance = loading
    ? "—"
    : avgPerformance
    ? avgPerformance.toFixed(1)
    : "0.0";

  const windowLabel = useMemo(() => {
    const endLabel = monthLabel(windowEnd);
    const startLabel = monthLabel(windowStart);
    return `${startLabel} → ${endLabel}`;
  }, [windowEnd, windowStart]);

  return (
    <div className="p-8 bg-gray-50 min-h-screen font-sans text-gray-800 flex flex-col items-center">
      <div className="w-full max-w-6xl">
        <header className="mb-8 w-full">
          <h1 className="text-2xl font-bold text-gray-900">Talent Analytics</h1>
          <p className="text-gray-500">
            Comprehensive workforce performance insights
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            icon={<Users className="text-blue-600" size={20} />}
            label="Total Employees"
            value={statTotalEmployees}
            bgColor="bg-blue-50"
          />
          <StatCard
            icon={<Award className="text-purple-600" size={20} />}
            label="High Performers"
            value={statHighPerformers}
            bgColor="bg-purple-50"
          />
          <StatCard
            icon={<TrendingUp className="text-green-600" size={20} />}
            label="Avg Performance"
            value={statAvgPerformance}
            bgColor="bg-green-50"
          />
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm mb-8">
          <div className="flex items-baseline justify-between gap-4">
            <h3 className="text-lg font-bold mb-6 text-gray-900">
              Performance Trends (Last 6 Months)
            </h3>
            {!loading && (
              <div className="text-xs text-gray-500">
                Window: {windowLabel} (anchored to latest snapshot)
              </div>
            )}
          </div>

          {loading ? (
            <div className="h-[400px] w-full flex items-center justify-center text-gray-500">
              Loading...
            </div>
          ) : snapshots.length === 0 ? (
            <div className="h-[400px] w-full flex items-center justify-center text-gray-500">
              No snapshot data found (reviewSnapshots).
            </div>
          ) : (
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={performanceTrends}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f3f4f6"
                  />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#9ca3af", fontSize: 12 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#9ca3af", fontSize: 12 }}
                  />
                  <Tooltip
                    cursor={{ fill: "#f9fafb" }}
                    contentStyle={{
                      borderRadius: "8px",
                      border: "none",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: "20px" }} />
                  <Bar
                    dataKey="Exceeds"
                    fill={COLORS.exceeds}
                    radius={[4, 4, 0, 0]}
                    barSize={20}
                  />
                  <Bar
                    dataKey="Meets"
                    fill={COLORS.meets}
                    radius={[4, 4, 0, 0]}
                    barSize={20}
                  />
                  <Bar
                    dataKey="NeedsImprovement"
                    fill={COLORS.needs_improvement}
                    radius={[4, 4, 0, 0]}
                    barSize={20}
                  />
                  <Bar
                    dataKey="Outstanding"
                    fill={COLORS.outstanding}
                    radius={[4, 4, 0, 0]}
                    barSize={20}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <h3 className="text-lg font-bold mb-6 text-gray-900">
              Current Talent Distribution
            </h3>

            {loading ? (
              <div className="h-[300px] w-full flex items-center justify-center text-gray-500">
                Loading...
              </div>
            ) : totalEmployees === 0 ? (
              <div className="h-[300px] w-full flex items-center justify-center text-gray-500">
                No employees found in users.
              </div>
            ) : (
              <div className="h-[300px] w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={distributionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {distributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend layout="vertical" align="right" verticalAlign="middle" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <h3 className="text-lg font-bold mb-6 text-gray-900">
              Department Performance
            </h3>

            {loading ? (
              <div className="text-gray-500">Loading...</div>
            ) : deptPerformance.length === 0 ? (
              <div className="text-gray-500">No department data available.</div>
            ) : (
              <div className="space-y-5">
                {deptPerformance.map((dept) => (
                  <div key={dept.name} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-gray-700">
                        {dept.name}{" "}
                        <span className="text-gray-400 font-normal">
                          ({dept.count} employees)
                        </span>
                      </span>
                      <span className="font-bold text-gray-900">
                        {dept.score ? dept.score.toFixed(1) : "0.0"}/5.0
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-blue-600 h-full rounded-full"
                        style={{
                          width: `${Math.max(
                            0,
                            Math.min(100, (dept.score / 5) * 100)
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!loading &&
            employees.length > 0 &&
            Object.values(latestSnapshotByEmployee).length === 0 ? (
              <div className="mt-4 text-xs text-gray-500">
                Note: no reviewSnapshots found for current employees, so
                department scores may show as 0.0.
              </div>
            ) : null}
          </div>
        </div>

        {!loading && employees.length > 0 && talentDistribution.unknown > 0 ? (
          <div className="mt-6 text-xs text-gray-500">
            Note: {talentDistribution.unknown} employee(s) have no current
            performance outcome in{" "}
            <code className="px-1 py-0.5 bg-gray-100 rounded">teamMembers</code>{" "}
            or latest{" "}
            <code className="px-1 py-0.5 bg-gray-100 rounded">
              reviewSnapshots
            </code>
            .
          </div>
        ) : null}
      </div>
    </div>
  );
};

const StatCard = ({
  icon,
  label,
  value,
  bgColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  bgColor: string;
}) => (
  <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
    <div
      className={`w-12 h-12 rounded-lg ${bgColor} flex items-center justify-center`}
    >
      {icon}
    </div>
    <div>
      <p className="text-sm text-gray-500 font-medium">{label}</p>
      <h4 className="text-2xl font-bold text-gray-900">{value}</h4>
    </div>
  </div>
);

export default HRTalentAnalytics;