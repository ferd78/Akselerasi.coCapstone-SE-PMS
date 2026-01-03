import { Card } from "@heroui/react";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { resolveEmployeeId } from "../utils/resolveEmployeeId";
import { db } from "../firebase";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  Timestamp,
} from "firebase/firestore";
import { CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";

type PerformanceReviewDoc = {
  employeeId: string;
  period?: string;
  overallOutcome?: string;
  createdAt?: any;
  feedback360?: {
    totalResponses?: number;
    highlights?: { category?: string; score?: number; feedback?: string }[];
  };
  managerEvaluation?: {
    strengths?: string[];
  };
};

type ReviewSnapshotDoc = {
  employeeId: string;
  cycleId?: string;
  period?: string;
  finalScore?: number;
  subjectiveScore?: number;
  overallOutcome?: string;
  createdAt?: any;
};

function toDateSafe(v: any): Date | null {
  if (!v) return null;
  if (v instanceof Timestamp) return v.toDate();
  if (typeof v?.toDate === "function") return v.toDate();
  if (typeof v === "string") {
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

function outcomeBadgeClasses(outcome?: string) {
  const v = (outcome || "").toLowerCase();
  if (v.includes("exceed")) return "bg-blue-50 text-blue-700";
  if (v.includes("outstanding")) return "bg-purple-50 text-purple-700";
  if (v.includes("meet")) return "bg-green-50 text-green-700";
  if (v.includes("need")) return "bg-yellow-50 text-yellow-800";
  if (v.includes("unsatisfactory")) return "bg-red-50 text-red-700";
  return "bg-gray-100 text-gray-700";
}

const PerformanceSnapshot = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  const [perfReview, setPerfReview] = useState<PerformanceReviewDoc | null>(null);
  const [snapshot, setSnapshot] = useState<ReviewSnapshotDoc | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      setLoading(true);
      try {
        if (!user) return;

        const employeeId = await resolveEmployeeId(user);
        const prQ = query(
          collection(db, "performanceReviews"),
          where("employeeId", "==", employeeId),
          orderBy("createdAt", "desc"),
          limit(1)
        );

        let prSnap;
        try {
          prSnap = await getDocs(prQ);
        } catch {
          prSnap = await getDocs(
            query(
              collection(db, "performanceReviews"),
              where("employeeId", "==", employeeId),
              limit(1)
            )
          );
        }
        if (!mounted) return;

        if (!prSnap.empty) {
          setPerfReview(prSnap.docs[0].data() as PerformanceReviewDoc);
          setSnapshot(null);
          return;
        }
        const rsSnap = await getDocs(
          query(
            collection(db, "reviewSnapshots"),
            where("employeeId", "==", employeeId),
            limit(1)
          )
        );

        if (!mounted) return;

        if (!rsSnap.empty) {
          setSnapshot(rsSnap.docs[0].data() as ReviewSnapshotDoc);
          setPerfReview(null);
        } else {
          setPerfReview(null);
          setSnapshot(null);
        }
      } catch (err) {
        console.warn("Failed to load performance snapshot", err);
        if (mounted) {
          setPerfReview(null);
          setSnapshot(null);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchData();
    return () => {
      mounted = false;
    };
  }, [user]);

  const viewModel = useMemo(() => {
    if (perfReview) {
      const outcome = perfReview.overallOutcome || "—";
      const period = perfReview.period || "—";
      const scores = (perfReview.feedback360?.highlights || [])
        .map((h) => (typeof h.score === "number" ? h.score : null))
        .filter((x): x is number => x !== null);
      const avg =
        scores.length > 0
          ? scores.reduce((a, b) => a + b, 0) / scores.length
          : null;
      const scoreText = avg === null ? "— / 5.0" : `${avg.toFixed(1)} / 5.0`;
      const barPct = avg === null ? 0 : Math.max(0, Math.min(100, (avg / 5) * 100));
      const strengthsRaw = perfReview.managerEvaluation?.strengths || [];
      const strengths = strengthsRaw.slice(0, 3);
      return {
        outcome,
        period,
        scoreText,
        barPct,
        strengths,
        usesPerfReview: true,
      };
    }

    if (snapshot) {
      const outcome = snapshot.overallOutcome || "—";
      const period = snapshot.period || snapshot.cycleId || "—";
      const scoreText =
        typeof snapshot.finalScore === "number"
          ? String(snapshot.finalScore)
          : typeof snapshot.subjectiveScore === "number"
          ? String(snapshot.subjectiveScore)
          : "—";

      return {
        outcome,
        period,
        scoreText,
        barPct: 0,
        strengths: [],
        usesPerfReview: false,
      };
    }

    return {
      outcome: "—",
      period: "—",
      scoreText: "— / 5.0",
      barPct: 0,
      strengths: [],
      usesPerfReview: true,
    };
  }, [perfReview, snapshot]);

  return (
    <Card className="p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl">Performance Snapshot</h2>
        <Link
          to="/employee/performance"
          className="text-sm text-blue-600 hover:underline"
        >
          Full review
        </Link>
      </div>

      {loading ? (
        <div className="text-gray-500 text-sm text-center py-4">Loading...</div>
      ) : !perfReview && !snapshot ? (
        <div className="text-gray-500 text-sm text-center py-4">
          No performance data available yet
        </div>
      ) : (
        <div className="text-sm">
          <div className="flex items-center justify-between">
            <div className="font-medium">Overall Rating</div>
            <span
              className={`text-xs px-3 py-1 rounded-full ${outcomeBadgeClasses(
                viewModel.outcome
              )}`}
            >
              {viewModel.outcome}
            </span>
          </div>

          <div className="text-xs text-gray-500 mt-1">
            Period: {viewModel.period}
          </div>
          {viewModel.usesPerfReview ? (
            <>
              <div className="mt-4 text-xs text-gray-600">360 Feedback Score</div>

              <div className="mt-2 flex items-center gap-3">
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full"
                    style={{ width: `${viewModel.barPct}%` }}
                  />
                </div>
                <div className="text-xs text-gray-600 w-14 text-right">
                  {viewModel.scoreText}
                </div>
              </div>

              <div className="mt-4">
                <div className="text-xs text-gray-600 mb-2">Top Strengths:</div>

                {viewModel.strengths.length === 0 ? (
                  <div className="text-xs text-gray-500">—</div>
                ) : (
                  <ul className="space-y-2">
                    {viewModel.strengths.map((s, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle className="size-4 text-green-600 mt-[2px]" />
                        <span className="text-sm text-gray-700">{s}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          ) : (
            <div className="mt-4 text-gray-700">
              Final Score: {viewModel.scoreText}
            </div>
          )}
        </div>
      )}
    </Card>
  );
};

export default PerformanceSnapshot;