import { useEffect, useMemo, useState } from "react";
import { Card } from "@heroui/react";
import { Award, CheckCircle, X } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { resolveEmployeeId } from "../../utils/resolveEmployeeId";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../firebase";

type Reward = {
  id: string;
  title?: string;
  reason?: string;
  status?: string;
  awardedBy?: string;
  approvedBy?: string;
  awardedAt?: any;
  justification?: string;
  amount?: any;
  type?: string;
  description?: string;
  date?: any;
};

function parseToNumberIDR(value: any): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string") {
    const s = value.trim();
    if (!s) return null;

    const lower = s.toLowerCase();
    if (lower === "n/a" || lower === "na" || lower === "none") return null;
    const digitsOnly = s.replace(/[^\d.,-]/g, "");
    if (!digitsOnly) return null;
    const normalized = digitsOnly.replace(/[.,]/g, "");
    const n = Number(normalized);
    return Number.isFinite(n) ? n : null;
  }

  return null;
}

function formatIDR(value: any): string {
  const n = parseToNumberIDR(value);
  if (n === null) return "—";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);
}

const EmployeeRewards = () => {
  const { user } = useAuth();

  const [rewards, setRewards] = useState<Reward[]>([]);
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchRewards = async () => {
      if (!user) return;
      setLoading(true);

      try {
        const employeeId = await resolveEmployeeId(user);

        const snap = await getDocs(
          query(collection(db, "rewards"), where("employeeId", "==", employeeId))
        );

        if (!mounted) return;

        const data = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as any),
        }));

        setRewards(data);
      } catch (err) {
        console.warn("Failed to load rewards", err);
        if (mounted) setRewards([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchRewards();
    return () => {
      mounted = false;
    };
  }, [user]);

  const total = rewards.length;
  const approved = rewards.filter((r) => String(r.status).toLowerCase() === "approved").length;
  const pending = rewards.filter((r) => String(r.status).toLowerCase() === "pending").length;

  const sortedRewards = useMemo(() => {
    const score = (s?: string) => {
      const v = String(s || "").toLowerCase();
      if (v === "approved") return 0;
      if (v === "pending") return 1;
      return 2;
    };
    return [...rewards].sort((a, b) => score(a.status) - score(b.status));
  }, [rewards]);

  if (selectedReward) {
    const displayTitle = selectedReward.type || selectedReward.title || "Reward";
    const displayReason = selectedReward.description || selectedReward.reason || "No description provided.";
    const displayDate =
      selectedReward.awardedAt?.toDate?.().toLocaleDateString?.() ||
      selectedReward.date?.toDate?.().toLocaleDateString?.() ||
      (typeof selectedReward.date === "string" ? selectedReward.date : "—");

    return (
      <div className="max-w-3xl mx-auto">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-semibold">Reward Details</h1>
            <button
              onClick={() => setSelectedReward(null)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <X className="size-6" />
            </button>
          </div>

          <Card className="p-6 mb-6 bg-gradient-to-br from-purple-50 to-indigo-50">
            <div className="flex items-start gap-4">
              <div className="bg-purple-600 p-3 rounded-lg">
                <Award className="size-8 text-white" />
              </div>

              <div className="flex-1">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-2xl">{displayTitle}</h2>
                      <span className="px-3 py-1 rounded-full text-sm bg-gray-100">
                        {selectedReward.status || "—"}
                      </span>
                    </div>

                    <div className="text-gray-700">{displayReason}</div>
                  </div>

                  <div className="text-right">
                    <div className="text-purple-700 font-semibold text-2xl leading-none">
                      {formatIDR(selectedReward.amount)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">Amount</div>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-2 gap-6 mb-6">
            {[
              ["Awarded By", selectedReward.awardedBy],
              ["Approved By", selectedReward.approvedBy],
              ["Award Date", displayDate],
              ["Status", selectedReward.status],
            ].map(([label, value]) => (
              <Card key={label} className="p-4">
                <div className="text-sm text-gray-600 mb-1">{label}</div>
                <div className="text-gray-700">{(value as any) || "—"}</div>
              </Card>
            ))}
          </div>

          <Card className="p-4 mb-6">
            <div className="text-sm text-gray-600 mb-2">Justification</div>
            <p className="text-gray-700">
              {selectedReward.justification || "No justification provided."}
            </p>
          </Card>

          <button
            onClick={() => setSelectedReward(null)}
            className="w-full px-6 py-3 border rounded-lg hover:bg-gray-50"
          >
            Close
          </button>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Rewards & Recognition</h1>
        <p className="text-gray-600 mt-1">View your rewards and recognition history</p>
      </div>

      {/* Summary */}
      <Card className="p-8 bg-gradient-to-br from-purple-600 to-indigo-700 text-white">
        <div className="flex items-center gap-3 mb-4">
          <Award className="size-10" />
          <div>
            <h2 className="text-3xl">{total}</h2>
            <p className="text-white/90">Total Rewards Received</p>
          </div>
        </div>

        <div className="flex items-center gap-6 mt-6 pt-6 border-t border-white/20">
          <div>
            <div className="text-2xl">{approved}</div>
            <div className="text-white/80 text-sm">Approved</div>
          </div>
          <div>
            <div className="text-2xl">{pending}</div>
            <div className="text-white/80 text-sm">Pending</div>
          </div>
        </div>
      </Card>

      {loading ? (
        <Card className="p-12 text-center text-gray-500">Loading...</Card>
      ) : rewards.length === 0 ? (
        <Card className="p-12 text-center text-gray-500">
          <CheckCircle className="size-12 mx-auto mb-3 text-green-500" />
          <p>No rewards have been issued yet.</p>
          <p className="text-sm mt-1">Rewards will appear here once approved.</p>
        </Card>
      ) : (
        sortedRewards.map((reward) => {
          const displayTitle = reward.type || reward.title || "Reward";
          const displayReason = reward.description || reward.reason || "—";

          return (
            <Card
              key={reward.id}
              className="p-6 cursor-pointer hover:border-purple-300"
              onClick={() => setSelectedReward(reward)}
            >
              <div className="flex items-start gap-4">
                <div className="bg-purple-100 p-3 rounded-lg">
                  <Award className="size-6 text-purple-600" />
                </div>

                <div className="flex-1">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div>
                      <h3 className="text-xl">{displayTitle}</h3>
                      <p className="text-gray-600">{displayReason}</p>
                    </div>

                    <div className="text-right">
                      <div className="text-purple-700 font-semibold text-lg">
                        {formatIDR(reward.amount)}
                      </div>
                      <span className="mt-2 inline-block px-3 py-1 rounded-full text-sm bg-gray-100">
                        {reward.status || "—"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          );
        })
      )}
    </div>
  );
};

export default EmployeeRewards;