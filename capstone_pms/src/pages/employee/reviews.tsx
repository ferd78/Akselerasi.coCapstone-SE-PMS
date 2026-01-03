import { useEffect, useMemo, useState } from "react";
import { Card } from "@heroui/react";
import {
  TrendingUp,
  Users,
  ChevronDown,
  ChevronUp,
  Star,
  CheckCircle,
} from "lucide-react";

import { useAuth } from "../../contexts/AuthContext";
import { resolveEmployeeId } from "../../utils/resolveEmployeeId";
import { db } from "../../firebase";
import {
  collection,
  getDocs,
  query,
  where,
  Timestamp,
} from "firebase/firestore";

type FeedbackHighlight = {
  category?: string;
  score?: number; // 0-5
  feedback?: string;
};

type PerformanceReviewDoc = {
  id: string;
  employeeId: string;
  period?: string;
  overallOutcome?: string;
  createdAt?: any;
  feedback360?: {
    totalResponses?: number;
    highlights?: FeedbackHighlight[];
  };

  managerEvaluation?: {
    summary?: string;
    strengths?: string[];
    areasForDevelopment?: string[];
  };

  previousReviews?: { period?: string; outcome?: string }[];
};

function formatDate(v: any): string {
  if (!v) return "—";
  if (v instanceof Timestamp) return v.toDate().toLocaleDateString();
  if (typeof v?.toDate === "function") return v.toDate().toLocaleDateString();
  if (typeof v === "string") {
    const d = new Date(v);
    return isNaN(d.getTime()) ? v : d.toLocaleDateString();
  }
  return "—";
}

function outcomeBadge(outcome?: string) {
  const v = (outcome || "").toLowerCase();

  if (v.includes("outstanding"))
    return "bg-purple-100 text-purple-700 border-purple-200";
  if (v.includes("exceeds"))
    return "bg-blue-100 text-blue-700 border-blue-200";
  if (v.includes("meets"))
    return "bg-green-100 text-green-700 border-green-200";
  if (v.includes("needs"))
    return "bg-yellow-100 text-yellow-800 border-yellow-200";
  if (v.includes("unsatisfactory"))
    return "bg-red-100 text-red-700 border-red-200";

  return "bg-gray-100 text-gray-700 border-gray-200";
}

function safeScore(n: any) {
  const x = Number(n);
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(5, x));
}

function calcAverageScore(highlights: FeedbackHighlight[]) {
  if (!highlights.length) return 0;
  const sum = highlights.reduce((a, h) => a + safeScore(h.score), 0);
  return sum / highlights.length;
}

function stars(scoreOutOf5: number) {
  const filled = Math.round(scoreOutOf5);
  return Array.from({ length: 5 }).map((_, i) => {
    const isFilled = i < filled;
    return (
      <Star
        key={i}
        className={
          isFilled
            ? "size-4 text-yellow-400 fill-yellow-400"
            : "size-4 text-gray-300"
        }
      />
    );
  });
}

const EmployeePerformanceReview = () => {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<PerformanceReviewDoc[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<string>("");

  const [expanded, setExpanded] = useState<string | null>("feedback"); // default open like figma

  useEffect(() => {
    let mounted = true;

    const fetchReviews = async () => {
      try {
        if (!user) return;

        setLoading(true);
        const employeeId = await resolveEmployeeId(user);

        const snap = await getDocs(
          query(
            collection(db, "performanceReviews"),
            where("employeeId", "==", employeeId)
          )
        );

        const list: PerformanceReviewDoc[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as any),
        }));

        const periodToKey = (p?: string) => {
          const m = (p || "").match(/Q([1-4])\s*(\d{4})/i);
          if (!m) return 0;
          const q = Number(m[1]);
          const y = Number(m[2]);
          return y * 10 + q;
        };
        list.sort((a, b) => periodToKey(b.period) - periodToKey(a.period));

        if (!mounted) return;

        setReviews(list);
        setSelectedPeriod((prev) => prev || list[0]?.period || "Q4 2024");
      } catch (e) {
        console.warn("Failed to load performance reviews", e);
        if (mounted) {
          setReviews([]);
          setSelectedPeriod("Q4 2024");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchReviews();
    return () => {
      mounted = false;
    };
  }, [user]);

  const periodOptions = useMemo(() => {
    const periods = reviews.map((r) => r.period).filter(Boolean) as string[];
    return Array.from(new Set(periods));
  }, [reviews]);

  const current = useMemo(() => {
    return reviews.find((r) => r.period === selectedPeriod) || reviews[0] || null;
  }, [reviews, selectedPeriod]);

  const highlights = current?.feedback360?.highlights || [];
  const avg = useMemo(() => calcAverageScore(highlights), [highlights]);
  const avgText = `${avg.toFixed(2)}/5.00`;

  const history = useMemo(() => {
    return reviews.map((r) => ({
      period: r.period || "—",
      outcome: r.overallOutcome || "—",
    }));
  }, [reviews]);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Performance Review</h1>
          <p className="text-gray-600 mt-1">
            View your performance summary and feedback
          </p>
        </div>

        <select
          value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-lg bg-white"
          disabled={loading || periodOptions.length === 0}
        >
          {periodOptions.length === 0 ? (
            <option>Q4 2024</option>
          ) : (
            periodOptions.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))
          )}
        </select>
      </div>

      <Card className="p-8 text-white bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl">
        <div className="flex items-center gap-4">
          <div className="bg-white/15 p-3 rounded-xl">
            <TrendingUp className="size-7" />
          </div>

          <div>
            <div className="text-white/85 text-sm mb-1">
              Overall Performance Rating
            </div>
            <div className="text-3xl font-semibold">
              {current?.overallOutcome || "—"}
            </div>
            <div className="text-white/85 text-sm mt-3">
              Review Period: {selectedPeriod}
            </div>
          </div>
        </div>
      </Card>

      <Card className="rounded-2xl overflow-hidden border border-gray-100">
        <button
          onClick={() => setExpanded(expanded === "feedback" ? null : "feedback")}
          className="w-full flex items-center justify-between p-6 hover:bg-gray-50"
        >
          <div className="flex items-start gap-3">
            <Users className="size-6 text-blue-600 mt-0.5" />
            <div className="text-left">
              <h2 className="text-lg font-semibold">360 Feedback Summary</h2>
              <p className="text-gray-600 text-sm mt-1">
                {current?.feedback360?.totalResponses
                  ? `${current.feedback360.totalResponses} responses collected`
                  : "No feedback collected yet"}
              </p>
            </div>
          </div>

          {expanded === "feedback" ? (
            <ChevronUp className="size-5 text-gray-600" />
          ) : (
            <ChevronDown className="size-5 text-gray-600" />
          )}
        </button>

        {expanded === "feedback" && (
          <div className="px-6 pb-6 space-y-3">
            {highlights.length === 0 ? (
              <div className="text-sm text-gray-500">
                Feedback data will appear here once available.
              </div>
            ) : (
              <>
                {highlights.map((h, idx) => (
                  <div
                    key={`${h.category || "item"}-${idx}`}
                    className="border border-gray-200 rounded-xl p-4 bg-white"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="font-semibold text-sm text-gray-900">
                          {h.category || "Category"}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          {h.feedback || "—"}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <div className="flex items-center gap-0.5">
                          {stars(safeScore(h.score))}
                        </div>
                        <div className="text-sm text-gray-700">
                          {safeScore(h.score).toFixed(1)}/5.0
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                <div className="border border-blue-200 bg-blue-50 rounded-xl p-4">
                  <div className="text-sm text-blue-700">
                    Average 360 Score
                  </div>
                  <div className="text-lg font-semibold text-blue-700 mt-1">
                    {avgText}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </Card>

      <Card className="rounded-2xl overflow-hidden border border-gray-100">
        <button
          onClick={() => setExpanded(expanded === "manager" ? null : "manager")}
          className="w-full flex items-center justify-between p-6 hover:bg-gray-50"
        >
          <div className="flex items-start gap-3">
            <TrendingUp className="size-6 text-green-600 mt-0.5" />
            <div className="text-left">
              <h2 className="text-lg font-semibold">Manager Evaluation</h2>
              <p className="text-gray-600 text-sm mt-1">
                Direct manager&apos;s assessment
              </p>
            </div>
          </div>

          {expanded === "manager" ? (
            <ChevronUp className="size-5 text-gray-600" />
          ) : (
            <ChevronDown className="size-5 text-gray-600" />
          )}
        </button>

        {expanded === "manager" && (
          <div className="px-6 pb-6 text-sm text-gray-700 space-y-4">
            <div className="text-gray-700">
              {current?.managerEvaluation?.summary || "No manager summary yet."}
            </div>

            <div>
              <div className="font-semibold text-gray-900 mb-2">
                Top Strengths
              </div>
              <ul className="space-y-2">
                {(current?.managerEvaluation?.strengths || []).length ? (
                  current!.managerEvaluation!.strengths!.map((s, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle className="size-4 text-green-600 mt-0.5" />
                      <span>{s}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-gray-500">—</li>
                )}
              </ul>
            </div>

            <div>
              <div className="font-semibold text-gray-900 mb-2">
                Areas for Development
              </div>
              <ul className="list-disc pl-5 space-y-1">
                {(current?.managerEvaluation?.areasForDevelopment || []).length ? (
                  current!.managerEvaluation!.areasForDevelopment!.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))
                ) : (
                  <li className="text-gray-500">—</li>
                )}
              </ul>
            </div>

            <div className="text-xs text-gray-500">
              Created: {formatDate(current?.createdAt)}
            </div>
          </div>
        )}
      </Card>

      <Card className="p-6 rounded-2xl border border-gray-100">
        <h2 className="text-lg font-semibold mb-4">Performance History</h2>

        {history.length === 0 ? (
          <div className="text-sm text-gray-500">
            No historical performance records found.
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((h, idx) => (
              <div
                key={`${h.period}-${idx}`}
                className="border border-gray-200 rounded-xl p-4 flex items-center justify-between"
              >
                <div className="text-sm font-semibold text-gray-900">
                  {h.period}
                </div>

                <span
                  className={`text-xs px-3 py-1 rounded-full border ${outcomeBadge(
                    h.outcome
                  )}`}
                >
                  {h.outcome}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default EmployeePerformanceReview;