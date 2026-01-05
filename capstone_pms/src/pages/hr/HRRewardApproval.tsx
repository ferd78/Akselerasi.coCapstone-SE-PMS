import React, { useEffect, useMemo, useState } from "react";
import { Check, X, Award } from "lucide-react";
import { Card } from "@heroui/react";
import {
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";

import { db } from "../../firebase";
import { useAuth } from "../../contexts/AuthContext";

type RewardDoc = {
  id: string;
  employeeId?: string;
  type?: string;
  amount?: any;
  reason?: string;
  description?: string;
  awardedBy?: string;
  approvedBy?: string;
  status?: string;
  createdAt?: any;
  date?: any;
};

type UserDoc = {
  id: string;
  name?: string;
  role?: string;
  department?: string;
  email?: string;
  avatar?: string;
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

function safeToDate(v: any): Date | null {
  if (!v) return null;
  if (typeof v?.toDate === "function") {
    const d = v.toDate();
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

function formatDMY(d: Date | null): string {
  if (!d) return "—";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

const HRRewardApproval = () => {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [pendingRewards, setPendingRewards] = useState<RewardDoc[]>([]);
  const [employeesById, setEmployeesById] = useState<Record<string, UserDoc>>(
    {}
  );
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      setLoading(true);
      try {
        const usersSnap = await getDocs(
          query(collection(db, "users"), where("role", "==", "employee"))
        );
        const map: Record<string, UserDoc> = {};
        usersSnap.docs.forEach((d) => {
          map[d.id] = { id: d.id, ...(d.data() as any) };
        });

        const rewardsSnap = await getDocs(
          query(collection(db, "rewards"), where("status", "==", "pending"))
        );
        const rewards: RewardDoc[] = rewardsSnap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as any),
        }));

        rewards.sort((a, b) => {
          const da =
            safeToDate(a.createdAt) ||
            safeToDate(a.date) ||
            new Date(0);
          const dbb =
            safeToDate(b.createdAt) ||
            safeToDate(b.date) ||
            new Date(0);
          return dbb.getTime() - da.getTime();
        });

        if (!mounted) return;
        setEmployeesById(map);
        setPendingRewards(rewards);
      } catch (e) {
        console.warn("Failed to load HR reward approvals", e);
        if (mounted) {
          setEmployeesById({});
          setPendingRewards([]);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchData();
    return () => {
      mounted = false;
    };
  }, []);

  const pendingCount = pendingRewards.length;

  const hrName = useMemo(() => {
    const anyUser: any = user as any;
    return (
      anyUser?.name ||
      anyUser?.displayName ||
      anyUser?.email ||
      "HR"
    );
  }, [user]);

  const onApprove = async (reward: RewardDoc) => {
    setSavingId(reward.id);
    try {
      await updateDoc(doc(db, "rewards", reward.id), {
        status: "approved",
        approvedBy: hrName,
        approvedAt: serverTimestamp(),
      });
      setPendingRewards((prev) => prev.filter((r) => r.id !== reward.id));
    } catch (e) {
      console.warn("Approve reward failed", e);
    } finally {
      setSavingId(null);
    }
  };

  const onReject = async (reward: RewardDoc) => {
    setSavingId(reward.id);
    try {
      await updateDoc(doc(db, "rewards", reward.id), {
        status: "rejected",
        rejectedBy: hrName,
        rejectedAt: serverTimestamp(),
      });
      setPendingRewards((prev) => prev.filter((r) => r.id !== reward.id));
    } catch (e) {
      console.warn("Reject reward failed", e);
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Reward Approvals</h1>
        <p className="text-gray-600 mt-1">
          Review and approve reward recommendations
        </p>
      </div>

      <Card className="p-6 bg-gradient-to-br from-purple-600 to-indigo-700 text-white">
        <div className="flex items-center gap-3">
          <div className="bg-white/15 p-3 rounded-xl">
            <Award className="size-7" />
          </div>
          <div>
            <div className="text-3xl font-semibold">
              {loading ? "—" : pendingCount}
            </div>
            <div className="text-white/85 text-sm">Pending Approvals</div>
          </div>
        </div>
      </Card>

      {loading ? (
        <Card className="p-12 text-center text-gray-500">Loading...</Card>
      ) : pendingRewards.length === 0 ? (
        <Card className="p-12 text-center text-gray-500">
          No pending reward approvals.
        </Card>
      ) : (
        <div className="space-y-6">
          {pendingRewards.map((r) => {
            const empName =
              (r.employeeId && employeesById[r.employeeId]?.name) ||
              r.employeeId ||
              "Unknown Employee";

            const submitted =
              safeToDate(r.createdAt) || safeToDate(r.date);

            return (
              <Card key={r.id} className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg truncate">
                        {empName}
                      </h3>
                      <span className="px-2 py-1 rounded-full text-[11px] font-semibold bg-purple-100 text-purple-700 uppercase">
                        {r.type || "Reward"}
                      </span>
                    </div>

                    <div className="text-xs text-gray-500">
                      Recommended by:{" "}
                      <span className="text-gray-700 font-medium">
                        {r.awardedBy || "—"}
                      </span>{" "}
                      • Submitted:{" "}
                      <span className="text-gray-700 font-medium">
                        {formatDMY(submitted)}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-purple-700 font-semibold text-xl">
                      {formatIDR(r.amount)}
                    </div>
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  <div>
                    <div className="text-[11px] tracking-wide text-gray-500 font-semibold">
                      REASON:
                    </div>
                    <div className="text-gray-800 font-medium">
                      {r.reason || "—"}
                    </div>
                  </div>

                  <div>
                    <div className="text-[11px] tracking-wide text-gray-500 font-semibold">
                      JUSTIFICATION:
                    </div>
                    <div className="text-gray-700">
                      {r.description || "—"}
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-5 border-t flex gap-3">
                  <button
                    className="px-5 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 inline-flex items-center gap-2 disabled:opacity-60"
                    onClick={() => onApprove(r)}
                    disabled={savingId === r.id}
                  >
                    <Check className="size-4" />
                    Approve
                  </button>

                  <button
                    className="px-5 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 inline-flex items-center gap-2 disabled:opacity-60"
                    onClick={() => onReject(r)}
                    disabled={savingId === r.id}
                  >
                    <X className="size-4" />
                    Reject
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default HRRewardApproval;