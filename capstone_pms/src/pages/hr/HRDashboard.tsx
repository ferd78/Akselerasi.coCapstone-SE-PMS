import React, { useEffect, useMemo, useState } from "react";
import {
  Users,
  TrendingUp,
  CheckCircle2,
  BarChart3,
  ArrowRight,
  Award,
} from "lucide-react";
import { Link } from "react-router-dom";
import { db } from "../../firebase";
import {
  collection,
  getCountFromServer,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from "firebase/firestore";

type TeamMember = {
  id: string;
  name?: string;
  department?: string;
  position?: string;
  performanceOutcome?: string;
  reviewStatus?: string;
  lastReviewDate?: any;
};

type Reward = {
  id: string;
  employeeId: string;
  status?: string; 
  type?: string;
  amount?: any;
  reason?: string;
  description?: string;
  date?: any;
  createdAt?: any;
};

type ReviewCycle = {
  id: string;
  name?: string;
  type?: string;
  completed?: number;
  participants?: number;
  status?: string;
  isActive?: boolean;
  startDate?: any;
  endDate?: any;
};

type DistributionKey =
  | "outstanding"
  | "exceeds"
  | "meets"
  | "needs_improvement"
  | "unsatisfactory";

const DISTRIBUTION_META: Array<{
  key: DistributionKey;
  label: string;
  color: string;
}> = [
  { key: "outstanding", label: "Outstanding", color: "bg-purple-600" },
  { key: "exceeds", label: "Exceeds", color: "bg-blue-600" },
  { key: "meets", label: "Meets", color: "bg-green-600" },
  {
    key: "needs_improvement",
    label: "Needs Improvement",
    color: "bg-orange-500",
  },
  { key: "unsatisfactory", label: "Unsatisfactory", color: "bg-red-600" },
];

function normalizeOutcomeToBucket(outcome?: string): DistributionKey {
  const v = String(outcome || "").toLowerCase().trim();
  if (v.includes("outstanding")) return "outstanding";
  if (v.includes("exceeds")) return "exceeds";
  if (v.includes("meets")) return "meets";
  if (v.includes("needs")) return "needs_improvement";
  if (v.includes("unsatisfactory")) return "unsatisfactory";
  return "meets";
}

const HRDashboard = () => {
  const [loading, setLoading] = useState(true);

  const [totalEmployees, setTotalEmployees] = useState<number>(0);
  const [highPerformers, setHighPerformers] = useState<number>(0);
  const [pendingRewardApprovals, setPendingRewardApprovals] =
    useState<number>(0);
  const [reviewCompletion, setReviewCompletion] = useState<number>(0);

  const [distributionCounts, setDistributionCounts] = useState<
    Record<DistributionKey, number>
  >({
    outstanding: 0,
    exceeds: 0,
    meets: 0,
    needs_improvement: 0,
    unsatisfactory: 0,
  });

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      try {
        const teamSnap = await getDocs(collection(db, "teamMembers"));
        if (!mounted) return;
        const team: TeamMember[] = teamSnap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as any),
        }));
        const total = team.length;
        const counts: Record<DistributionKey, number> = {
          outstanding: 0,
          exceeds: 0,
          meets: 0,
          needs_improvement: 0,
          unsatisfactory: 0,
        };
        for (const tm of team) {
          const bucket = normalizeOutcomeToBucket(tm.performanceOutcome);
          counts[bucket] += 1;
        }

        const hp = counts.outstanding + counts.exceeds;

        setTotalEmployees(total);
        setDistributionCounts(counts);
        setHighPerformers(hp);
        const pendingRewardsCountSnap = await getCountFromServer(
          query(collection(db, "rewards"), where("status", "==", "pending"))
        );

        if (!mounted) return;
        setPendingRewardApprovals(pendingRewardsCountSnap.data().count);
        const cycleSnap = await getDocs(
          query(collection(db, "reviewCycles"), orderBy("startDate", "desc"), limit(1))
        );

        if (!mounted) return;
        if (!cycleSnap.empty) {
          const latest = cycleSnap.docs[0].data() as ReviewCycle;
          const pct =
            typeof latest.completed === "number" && Number.isFinite(latest.completed)
              ? latest.completed
              : 0;
          setReviewCompletion(Math.max(0, Math.min(100, Math.round(pct))));
        } else {
          setReviewCompletion(0);
        }
      } catch (err) {
        console.warn("Failed to load HR dashboard metrics", err);
        if (mounted) {
          setTotalEmployees(0);
          setHighPerformers(0);
          setPendingRewardApprovals(0);
          setReviewCompletion(0);
          setDistributionCounts({
            outstanding: 0,
            exceeds: 0,
            meets: 0,
            needs_improvement: 0,
            unsatisfactory: 0,
          });
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const distributionData = useMemo(() => {
    const total = totalEmployees || 0;

    return DISTRIBUTION_META.map((m) => {
      const count = distributionCounts[m.key] || 0;
      const percentage = total ? Number(((count / total) * 100).toFixed(1)) : 0;

      return {
        label: m.label,
        count,
        percentage,
        color: m.color,
      };
    });
  }, [distributionCounts, totalEmployees]);

  return (
    <div className="p-8 bg-gray-50 min-h-screen font-sans text-gray-800">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">HR Dashboard</h1>
        <p className="text-gray-500">Organization-wide performance insights</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={<Users className="text-blue-600" size={20} />}
          iconBg="bg-blue-50"
          value={loading ? "—" : String(totalEmployees)}
          label="Total Employees"
        />
        <StatCard
          icon={<TrendingUp className="text-purple-600" size={20} />}
          iconBg="bg-purple-50"
          value={loading ? "—" : String(highPerformers)}
          label="High Performers"
          linkText="View details"
          linkHref="/hr/performance"
        />
        <StatCard
          icon={<CheckCircle2 className="text-orange-600" size={20} />}
          iconBg="bg-orange-50"
          value={loading ? "—" : String(pendingRewardApprovals)}
          label="Reward Approvals"
          badge="Pending"
          linkText="Review"
          linkHref="/hr/reward-approvals"
        />
        <StatCard
          icon={<BarChart3 className="text-green-600" size={20} />}
          iconBg="bg-green-50"
          value={loading ? "—" : `${reviewCompletion}%`}
          label="Review Completion"
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold">Talent Distribution</h2>
          <Link
            to="/hr/analytics"
            className="text-blue-600 text-sm font-medium hover:underline"
          >
            View full analytics
          </Link>
        </div>

        {loading ? (
          <div className="text-gray-500 text-sm">Loading distribution...</div>
        ) : (
          <div className="space-y-6">
            {distributionData.map((item) => (
              <div key={item.label} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-gray-700">{item.label}</span>
                  <span className="text-gray-500">
                    {item.count} ({item.percentage}%)
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5">
                  <div
                    className={`${item.color} h-2.5 rounded-full transition-all duration-500`}
                    style={{ width: `${item.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ActionCard
          icon={<TrendingUp className="text-blue-600" size={20} />}
          iconBg="bg-blue-50"
          title="Performance Reports"
          description="View organization-wide performance data"
          to="/hr/performance"
        />
        <ActionCard
          icon={<BarChart3 className="text-green-600" size={20} />}
          iconBg="bg-green-50"
          title="Talent Analytics"
          description="Deep dive into workforce metrics"
          to="/hr/talent-analytics"
        />
        <ActionCard
          icon={<Award className="text-purple-600" size={20} />}
          iconBg="bg-purple-50"
          title="Reward Approvals"
          description="Review and approve reward recommendations"
          to="/hr/reward-approvals"
        />
      </div>
    </div>
  );
};

const StatCard = ({ icon, iconBg, value, label, linkText, linkHref, badge }: any) => (
  <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between h-48">
    <div className="flex justify-between items-start">
      <div className={`${iconBg} p-2.5 rounded-lg`}>{icon}</div>
      {badge && (
        <span className="bg-orange-50 text-orange-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-orange-100">
          {badge}
        </span>
      )}
    </div>
    <div>
      <div className="text-3xl font-bold text-gray-900 mb-1">{value}</div>
      <div className="text-gray-500 text-sm">{label}</div>
    </div>
    {linkText && (
      <Link
        to={linkHref}
        className="text-blue-600 text-sm font-medium flex items-center gap-1 hover:underline mt-2"
      >
        {linkText} <ArrowRight size={14} />
      </Link>
    )}
  </div>
);

const ActionCard = ({ icon, iconBg, title, description, to }: any) => (
  <Link
    to={to || "#"}
    className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer group block"
  >
    <div className={`${iconBg} w-fit p-2.5 rounded-lg mb-4 group-hover:scale-110 transition-transform`}>
      {icon}
    </div>
    <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
    <p className="text-gray-500 text-sm leading-relaxed">{description}</p>
  </Link>
);

export default HRDashboard;