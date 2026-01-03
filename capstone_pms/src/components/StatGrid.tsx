import StatCard from "./StatCard";
import { Clock, TrendingUp, Target, CheckCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { resolveEmployeeId } from "../utils/resolveEmployeeId";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "../firebase";

type Stats = {
  pending: number;
  rating: string;
  progress: string;
  completed: string;
};

function normalizeStatus(v: any) {
  return String(v || "").toLowerCase().replace(/\s+/g, "_");
}

function isDone(ai: any) {
  const s = normalizeStatus(ai?.status);
  const p = typeof ai?.progress === "number" ? ai.progress : undefined;
  return s === "completed" || p === 100;
}

export default function StatGrid() {
  const { user } = useAuth();

  const [stats, setStats] = useState<Stats>({
    pending: 0,
    rating: "—",
    progress: "—",
    completed: "—",
  });

  useEffect(() => {
    let mounted = true;

    const fetchStats = async () => {
      try {
        if (!user) {
          if (mounted) {
            setStats({ pending: 0, rating: "—", progress: "—", completed: "—" });
          }
          return;
        }

        const employeeId = await resolveEmployeeId(user);

        const pendingSnap = await getDocs(
          query(
            collection(db, "feedbackRequests"),
            where("revieweeId", "==", employeeId),
            where("status", "==", "pending")
          )
        );
        const pending = pendingSnap.size;

        let rating = "—";
        try {
          const prSnap = await getDocs(
            query(
              collection(db, "performanceReviews"),
              where("employeeId", "==", employeeId),
              orderBy("createdAt", "desc"),
              limit(1)
            )
          );

          if (!prSnap.empty) {
            const pr = prSnap.docs[0].data() as any;
            rating =
              pr?.overallOutcome ??
              pr?.finalScore ??
              pr?.managerEvaluation?.rating ??
              "—";
          } else {
            rating = "—";
          }
        } catch {
          const prSnap = await getDocs(
            query(
              collection(db, "performanceReviews"),
              where("employeeId", "==", employeeId),
              limit(1)
            )
          );
          if (!prSnap.empty) {
            const pr = prSnap.docs[0].data() as any;
            rating =
              pr?.overallOutcome ??
              pr?.finalScore ??
              pr?.managerEvaluation?.rating ??
              "—";
          }
        }

        let total = 0;
        let done = 0;

        const dpSnap = await getDocs(
          query(
            collection(db, "developmentPlans"),
            where("employeeId", "==", employeeId),
            limit(5)
          )
        );

        if (!dpSnap.empty) {
          const planDoc =
            dpSnap.docs.find((d) => normalizeStatus((d.data() as any)?.status) === "active") ??
            dpSnap.docs[0];

          const planId = planDoc.id;
          const planData = planDoc.data() as any;

          const faSnap = await getDocs(
            collection(db, "developmentPlans", planId, "focusAreas")
          );

          if (!faSnap.empty) {
            for (const faDoc of faSnap.docs) {
              const aiSnap = await getDocs(
                collection(
                  db,
                  "developmentPlans",
                  planId,
                  "focusAreas",
                  faDoc.id,
                  "actionItems"
                )
              );
              aiSnap.forEach((d) => {
                const ai = d.data();
                total++;
                if (isDone(ai)) done++;
              });
            }
          } else {
            const focusAreas = Array.isArray(planData?.focusAreas) ? planData.focusAreas : [];
            for (const fa of focusAreas) {
              const actionItems = Array.isArray(fa?.actionItems) ? fa.actionItems : [];
              for (const ai of actionItems) {
                total++;
                if (isDone(ai)) done++;
              }
            }
          }
        }

        const progress = total > 0 ? `${Math.round((done / total) * 100)}%` : "0%";
        const completed = total > 0 ? `${done}/${total}` : "0/0";

        if (mounted) {
          setStats({ pending, rating: String(rating), progress, completed });
        }
      } catch (err) {
        console.warn("Failed to load stat grid", err);
        if (mounted) {
          setStats((s) => s);
        }
      }
    };

    fetchStats();
    return () => {
      mounted = false;
    };
  }, [user]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard
        title="Pending Feedback Requests"
        value={stats.pending}
        subtitle="View all"
        to="/employee/feedback"
        icon={Clock}
        iconBg="bg-orange-100 text-orange-600"
      />

      <StatCard
        title="Latest Performance Rating"
        value={stats.rating}
        subtitle="View details"
        to="/employee/performance"
        icon={TrendingUp}
        iconBg="bg-blue-100 text-blue-600"
      />

      <StatCard
        title="Development Plan Progress"
        value={stats.progress}
        subtitle="View plan"
        to="/employee/development"
        icon={Target}
        iconBg="bg-green-100 text-green-600"
      />

      <StatCard
        title="Action Items Completed"
        value={stats.completed}
        subtitle="Continue"
        to="/employee/development"
        icon={CheckCircle}
        iconBg="bg-purple-100 text-purple-600"
      />
    </div>
  );
}