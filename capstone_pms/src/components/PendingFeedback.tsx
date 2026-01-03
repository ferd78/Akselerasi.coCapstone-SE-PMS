import { Card } from "@heroui/react";
import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { db, auth } from "../firebase";

type FeedbackRequest = {
  id: string;

  // requests for logedd in user
  revieweeId?: string;
  employeeName?: string;

  // who initiated the request by id
  requestedById?: string;
  requestedBy?: string;
  requestedByRole?: string;

  dueDate?: any;
  status?: string;
  cycleType?: string;
  isAnonymous?: boolean;
};

function formatDate(v: any): string {
  if (!v) return "—";

  if (typeof v?.toDate === "function") {
    const d = v.toDate();
    return isNaN(d.getTime()) ? "—" : d.toLocaleDateString();
  }

  if (typeof v?.seconds === "number") {
    const d = new Date(v.seconds * 1000);
    return isNaN(d.getTime()) ? "—" : d.toLocaleDateString();
  }

  if (typeof v === "string") {
    const d = new Date(v);
    return isNaN(d.getTime()) ? v : d.toLocaleDateString();
  }

  return "—";
}

const PendingFeedback = () => {
  const [legacyId, setLegacyId] = useState<string | null>(null);
  const [items, setItems] = useState<FeedbackRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const resolveLegacyId = async () => {
      try {
        const user = auth.currentUser;
        if (!user?.email) {
          if (mounted) setLegacyId(null);
          return;
        }
        try {
          const uidDoc = await getDoc(doc(db, "users", user.uid));
          if (uidDoc.exists()) {
            const data = uidDoc.data() as any;
            const lid = data?.legacyId || data?.id;
            if (lid) {
              if (mounted) setLegacyId(String(lid));
              return;
            }
          }
        } catch {
          // empty
        }

        const usersSnap = await getDocs(
          query(collection(db, "users"), where("email", "==", user.email))
        );

        if (usersSnap.empty) {
          if (mounted) setLegacyId(null);
          return;
        }

        const userDoc = usersSnap.docs[0];
        const data = userDoc.data() as any;

        const lid = data?.legacyId || data?.id || userDoc.id;
        if (mounted) setLegacyId(lid ? String(lid) : null);
      } catch (e) {
        console.error("Failed to resolve legacyId:", e);
        if (mounted) setLegacyId(null);
      }
    };

    resolveLegacyId();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    const fetchPending = async () => {
      setLoading(true);
      try {
        if (!legacyId) {
          if (mounted) setItems([]);
          return;
        }

        const snap = await getDocs(
          query(collection(db, "feedbackRequests"), where("revieweeId", "==", legacyId))
        );

        const data = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as any),
        })) as FeedbackRequest[];
        const pendingOnly = data.filter((x) => String(x.status).toLowerCase() !== "completed");
        pendingOnly.sort((a, b) => {
          const ad = a?.dueDate?.toDate ? a.dueDate.toDate().getTime() : new Date(a.dueDate as any).getTime();
          const bd = b?.dueDate?.toDate ? b.dueDate.toDate().getTime() : new Date(b.dueDate as any).getTime();
          return (isNaN(ad) ? 0 : ad) - (isNaN(bd) ? 0 : bd);
        });

        if (mounted) setItems(pendingOnly);
      } catch (err) {
        console.error("Failed to load pending feedback", err);
        if (mounted) setItems([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchPending();
    return () => {
      mounted = false;
    };
  }, [legacyId]);

  const count = useMemo(() => items.length, [items]);

  return (
    <Card className="p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl">Pending Feedback Tasks</h2>
        <Link to="/employee/feedback" className="text-blue-600 text-sm">
          View all
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-500">Loading...</div>
      ) : count > 0 ? (
        <div className="space-y-4">
          {items.map((it) => (
            <div key={it.id} className="p-4 border rounded-md flex items-center justify-between">
              <div>
                <div className="font-medium">{it.employeeName || "—"}</div>

                <div className="text-sm text-gray-500">{it.cycleType || "360 Feedback"}</div>

                <div className="text-xs text-gray-400 mt-1">Due: {formatDate(it.dueDate)}</div>

                <div className="text-xs text-gray-500 mt-1">
                  Requested by: <span className="font-medium">{it.requestedBy || "—"}</span>{" "}
                  {it.requestedByRole ? <span className="text-gray-400">({it.requestedByRole})</span> : null}
                </div>
              </div>

              <Link
                to={`/employee/feedback/${it.id}`}
                className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm"
              >
                Provide Feedback
              </Link>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-10 text-gray-500">
          <p>No pending feedback tasks</p>
        </div>
      )}
    </Card>
  );
};

export default PendingFeedback;