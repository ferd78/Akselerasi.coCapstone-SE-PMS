import { useEffect, useMemo, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  Timestamp,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "../../firebase";

type ReviewCycle = {
  id: string;
  name: string;
  type: string;
  status: "active" | "scheduled" | "closed" | string;
  startDate: any;
  endDate: any;
};

type CycleStats = {
  total: number;
  pending: number;
  completed: number;
  progressPct: number;
};

function formatDate(ts: any) {
  if (!ts) return "—";
  if (typeof ts?.toDate === "function") return ts.toDate().toLocaleDateString();
  if (ts instanceof Date) return ts.toLocaleDateString();
  if (typeof ts === "number") return new Date(ts).toLocaleDateString();
  if (typeof ts === "string") {
    const d = new Date(ts);
    if (!isNaN(d.getTime())) return d.toLocaleDateString();
    return ts;
  }
  if (typeof ts?.seconds === "number") return new Date(ts.seconds * 1000).toLocaleDateString();
  return "—";
}

function toMillis(ts: any): number {
  if (!ts) return 0;
  if (typeof ts?.toDate === "function") return ts.toDate().getTime();
  if (ts instanceof Date) return ts.getTime();
  if (typeof ts === "number") return ts;
  if (typeof ts === "string") {
    const d = new Date(ts);
    return isNaN(d.getTime()) ? 0 : d.getTime();
  }
  if (typeof ts?.seconds === "number") return ts.seconds * 1000;
  return 0;
}

async function countDocs(q: any): Promise<number> {
  const mod = await import("firebase/firestore").catch(() => null as any);
  if (mod?.getCountFromServer) {
    const snap = await mod.getCountFromServer(q);
    return snap.data().count ?? 0;
  }
  const snap = await getDocs(q);
  return snap.size;
}

async function deleteFeedbackRequestsForCycle(cycleId: string): Promise<number> {
  const colRef = collection(db, "feedbackRequests");
  const qA = query(colRef, where("cycleId", "==", cycleId));
  const qB = query(colRef, where("reviewCycleId", "==", cycleId));
  const [snapA, snapB] = await Promise.all([getDocs(qA), getDocs(qB)]);
  const unique = new Map<string, (typeof snapA.docs)[number]>();
  snapA.docs.forEach((d) => unique.set(d.id, d));
  snapB.docs.forEach((d) => unique.set(d.id, d));
  const docs = Array.from(unique.values());
  if (docs.length === 0) return 0;

  const CHUNK = 450;
  let deleted = 0;

  for (let i = 0; i < docs.length; i += CHUNK) {
    const slice = docs.slice(i, i + CHUNK);
    const batch = writeBatch(db);
    slice.forEach((d) => batch.delete(d.ref));
    await batch.commit();
    deleted += slice.length;
  }

  return deleted;
}

const AdminReviewCycle = () => {
  const [cycles, setCycles] = useState<ReviewCycle[]>([]);
  const [statsByCycle, setStatsByCycle] = useState<Record<string, CycleStats>>({});
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [openCreate, setOpenCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState("Quarterly Review");
  const [newStart, setNewStart] = useState("");
  const [newEnd, setNewEnd] = useState("");
  const [createBusy, setCreateBusy] = useState(false);
  const [createErr, setCreateErr] = useState<string | null>(null);
  const [closingId, setClosingId] = useState<string | null>(null);
  const [closeErr, setCloseErr] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setErr(null);

    const qCycles = query(
      collection(db, "reviewCycles"),
      where("status", "==", "active")
    );

    const unsub = onSnapshot(
      qCycles,
      (snap) => {
        const items: ReviewCycle[] = snap.docs.map((d) => {
          const data = d.data() as any;
          return {
            id: d.id,
            name: data.name ?? "—",
            type: data.type ?? "—",
            status: data.status ?? "active",
            startDate: data.startDate ?? null,
            endDate: data.endDate ?? null,
          };
        });

        items.sort((a, b) => toMillis(b.startDate) - toMillis(a.startDate));
        setCycles(items);
        setLoading(false);
      },
      (e) => {
        setErr(e.message || "Failed to load review cycles");
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!cycles.length) {
        setStatsByCycle({});
        return;
      }

      setStatsLoading(true);

      try {
        const results: Record<string, CycleStats> = {};
        const COMPLETED = "completed";
        const PENDING = "pending";
        await Promise.all(
          cycles.map(async (cycle) => {
            const reqCol = collection(db, "feedbackRequests");
            const totalA = query(reqCol, where("cycleId", "==", cycle.id));
            const totalB = query(reqCol, where("reviewCycleId", "==", cycle.id));
            const completedA = query(reqCol, where("cycleId", "==", cycle.id), where("status", "==", COMPLETED));
            const completedB = query(reqCol, where("reviewCycleId", "==", cycle.id), where("status", "==", COMPLETED));
            const pendingA = query(reqCol, where("cycleId", "==", cycle.id), where("status", "==", PENDING));
            const pendingB = query(reqCol, where("reviewCycleId", "==", cycle.id), where("status", "==", PENDING));
            const [t1, t2, c1, c2, p1, p2] = await Promise.all([
              countDocs(totalA).catch(() => 0),
              countDocs(totalB).catch(() => 0),
              countDocs(completedA).catch(() => 0),
              countDocs(completedB).catch(() => 0),
              countDocs(pendingA).catch(() => 0),
              countDocs(pendingB).catch(() => 0),
            ]);

            const total = t1 + t2;
            const completed = c1 + c2;
            const pending = p1 + p2;
            const progressPct = total > 0 ? Math.round((completed / total) * 100) : 0;
            results[cycle.id] = { total, pending, completed, progressPct };
          })
        );

        if (!cancelled) setStatsByCycle(results);
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) setStatsLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [cycles]);

  const handleCreateCycle = async () => {
    setCreateErr(null);

    const name = newName.trim();
    if (!name) return setCreateErr("Cycle name is required.");
    if (!newStart) return setCreateErr("Start date is required.");
    if (!newEnd) return setCreateErr("End date is required.");

    const start = new Date(newStart);
    const end = new Date(newEnd);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return setCreateErr("Invalid date.");
    if (end < start) return setCreateErr("End date must be after start date.");

    setCreateBusy(true);
    try {
      await addDoc(collection(db, "reviewCycles"), {
        name,
        type: newType,
        status: "active",
        startDate: Timestamp.fromDate(start),
        endDate: Timestamp.fromDate(end),
        createdAt: Timestamp.now(),
      });

      setOpenCreate(false);
      setNewName("");
      setNewType("Quarterly Review");
      setNewStart("");
      setNewEnd("");
    } catch (e: any) {
      setCreateErr(e?.message || "Failed to create review cycle");
    } finally {
      setCreateBusy(false);
    }
  };

  const handleCloseCycle = async (cycle: ReviewCycle) => {
    const ok = window.confirm(
      `Close cycle "${cycle.name}"?\n\nThis will delete:\n- the review cycle\n- ALL feedbackRequests linked to it\n\nThis cannot be undone.`
    );
    if (!ok) return;

    setCloseErr(null);
    setClosingId(cycle.id);

    try {
      const deletedCount = await deleteFeedbackRequestsForCycle(cycle.id);
      await deleteDoc(doc(db, "reviewCycles", cycle.id));
      console.log(`Closed cycle ${cycle.id}. Deleted ${deletedCount} feedbackRequests.`);
    } catch (e: any) {
      setCloseErr(e?.message || "Failed to close cycle");
    } finally {
      setClosingId(null);
    }
  };

  const activeCycles = useMemo(() => cycles, [cycles]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Review Cycle Management</h1>
          <p className="text-sm text-gray-500">Manage performance review cycles</p>
        </div>

        <button
          onClick={() => setOpenCreate(true)}
          className="rounded-lg bg-blue-600 text-white px-4 py-2 text-sm font-semibold hover:bg-blue-700"
        >
          + New Cycle
        </button>
      </div>

      {loading && <div className="text-sm text-gray-500">Loading cycles…</div>}
      {err && <div className="text-sm text-red-600">{err}</div>}
      {closeErr && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {closeErr}
        </div>
      )}

      <div className="space-y-4">
        <h2 className="font-semibold">Active Cycles</h2>

        {activeCycles.map((cycle) => {
          const stats = statsByCycle[cycle.id] ?? {
            total: 0,
            pending: 0,
            completed: 0,
            progressPct: 0,
          };

          const isClosing = closingId === cycle.id;

          return (
            <div key={cycle.id} className="rounded-xl border bg-white p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{cycle.name}</h3>
                    <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">
                      active
                    </span>
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    {formatDate(cycle.startDate)} - {formatDate(cycle.endDate)} • {cycle.type}
                  </div>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-lg bg-gray-50 p-4">
                  <div className="text-xs text-gray-500">Assigned (Total Requests)</div>
                  <div className="text-xl font-semibold">{stats.total}</div>
                </div>

                <div className="rounded-lg bg-gray-50 p-4">
                  <div className="text-xs text-gray-500">Pending</div>
                  <div className="text-xl font-semibold">{stats.pending}</div>
                </div>

                <div className="rounded-lg bg-gray-50 p-4">
                  <div className="text-xs text-gray-500">Completed</div>
                  <div className="text-xl font-semibold">{stats.completed}</div>
                </div>
              </div>

              <div className="mt-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Progress</span>
                  <span className="font-semibold">{stats.progressPct}%</span>
                </div>

                <div className="mt-2 h-2 w-full rounded-full bg-gray-200 overflow-hidden">
                  <div
                    className="h-full bg-green-500"
                    style={{ width: `${Math.min(100, Math.max(0, stats.progressPct))}%` }}
                  />
                </div>

                <div className="mt-2 text-xs text-gray-500">
                  {statsLoading ? "Updating stats…" : "Progress is based on pending vs completed feedbackRequests (per cycle)."}
                </div>
              </div>

              <div className="mt-4 flex items-center gap-3">
                <button className="text-sm text-blue-600 hover:underline">Edit</button>

                <button
                  onClick={() => handleCloseCycle(cycle)}
                  disabled={isClosing}
                  className="text-sm text-white bg-red-600 hover:bg-red-700 rounded-md px-3 py-1.5 disabled:opacity-60"
                >
                  {isClosing ? "Closing…" : "Close Cycle"}
                </button>
              </div>
            </div>
          );
        })}

        {!loading && activeCycles.length === 0 && (
          <div className="text-sm text-gray-500">No active review cycles found.</div>
        )}
      </div>

      {/* Create Modal */}
      {openCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl p-6">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Create Review Cycle</h3>
              <button onClick={() => setOpenCreate(false)} className="text-gray-500 hover:text-gray-700">
                ✕
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <label className="text-sm font-medium">Cycle Name *</label>
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                  placeholder="e.g., Q1 2025 Performance Review"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Cycle Type *</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                >
                  <option>Quarterly Review</option>
                  <option>Annual Review</option>
                  <option>360 Feedback</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Start Date *</label>
                  <input
                    type="date"
                    value={newStart}
                    onChange={(e) => setNewStart(e.target.value)}
                    className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">End Date *</label>
                  <input
                    type="date"
                    value={newEnd}
                    onChange={(e) => setNewEnd(e.target.value)}
                    className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                  />
                </div>
              </div>

              {createErr && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {createErr}
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setOpenCreate(false)}
                className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50"
                disabled={createBusy}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCycle}
                className="rounded-lg bg-blue-600 text-white px-4 py-2 text-sm font-semibold hover:bg-blue-700 disabled:opacity-60"
                disabled={createBusy}
              >
                {createBusy ? "Creating…" : "Create Cycle"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReviewCycle;