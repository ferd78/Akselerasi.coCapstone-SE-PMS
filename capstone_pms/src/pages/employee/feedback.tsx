import { useEffect, useMemo, useState } from "react";
import { Card } from "@heroui/react";
import { MessageSquare, Clock, CheckCircle, X, Send } from "lucide-react";
import { formatDate } from "../../utils/formatDate";
import { db, auth } from "../../firebase";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";

type FeedbackRequest = {
  id: string;
  revieweeId: string;
  employeeName: string;
  requestedById: string;
  requestedBy: string;
  requestedByRole: string;
  dueDate: any;
  status: "pending" | "completed" | "in_progress" | string;
  cycleType: string;
  isAnonymous: boolean;
  createdAt?: any;
};

type FeedbackResponse = {
  id: string;
  requestId: string;
  revieweeId: string;
  reviewerId: string;
  reviewerRole: string;
  cycleType: string;
  submittedAt?: any;
  scores?: {
    technical?: number;
    collaboration?: number;
    leadership?: number;
    communication?: number;
  };
  strengths?: string[];
  improvements?: string[];
  comment?: string;
};

const EmployeeFeedbackRequests = () => {
  const [selectedRequest, setSelectedRequest] = useState<FeedbackRequest | null>(null);

  const [legacyId, setLegacyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [requests, setRequests] = useState<FeedbackRequest[]>([]);
  const [responsesByRequestId, setResponsesByRequestId] =
    useState<Record<string, FeedbackResponse>>({});

  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    technicalSkills: "",
    collaboration: "",
    leadership: "",
    communication: "",
    strengths: "",
    improvements: "",
    additionalComments: "",
    rating: 0,
  });

  useEffect(() => {
    const resolveLegacyId = async () => {
      setError(null);

      try {
        const user = auth.currentUser;
        if (!user?.email) {
          setLegacyId(null);
          setError("Not logged in / missing email.");
          return;
        }

        try {
          const uidDoc = await getDoc(doc(db, "users", user.uid));
          if (uidDoc.exists()) {
            const data = uidDoc.data() as any;
            const lid = data?.legacyId || data?.id;
            if (lid) {
              setLegacyId(String(lid));
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
          setLegacyId(null);
          setError(`No user profile found in Firestore for ${user.email}.`);
          return;
        }

        const userDoc = usersSnap.docs[0];
        const data = userDoc.data() as any;

        const lid = data?.legacyId || data?.id || userDoc.id;

        if (!lid) {
          setLegacyId(null);
          setError(`User doc found for ${user.email} but legacyId is missing.`);
          return;
        }

        setLegacyId(String(lid));
      } catch (e: any) {
        console.error(e);
        setLegacyId(null);
        setError(e?.message || "Failed to resolve legacyId");
      }
    };

    resolveLegacyId();
  }, []);

  useEffect(() => {
    const loadMyRequests = async () => {
      setLoading(true);
      setError(null);

      try {
        if (!legacyId) {
          setRequests([]);
          setResponsesByRequestId({});
          setLoading(false);
          return;
        }

        const reqSnap = await getDocs(
          query(collection(db, "feedbackRequests"), where("revieweeId", "==", legacyId))
        );

        let rows: FeedbackRequest[] = reqSnap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as any),
        }));

        rows = rows.sort((a, b) => {
          const ad = a?.dueDate?.toDate ? a.dueDate.toDate().getTime() : new Date(a.dueDate).getTime();
          const bd = b?.dueDate?.toDate ? b.dueDate.toDate().getTime() : new Date(b.dueDate).getTime();
          return ad - bd;
        });

        setRequests(rows);
        const requestIds = new Set(rows.map((r) => r.id));
        if (requestIds.size === 0) {
          setResponsesByRequestId({});
          setLoading(false);
          return;
        }
        const respSnap = await getDocs(
          query(collection(db, "feedbackResponses"), where("revieweeId", "==", legacyId))
        );

        const map: Record<string, FeedbackResponse> = {};
        respSnap.docs.forEach((d) => {
          const data = d.data() as any;
          const rid = String(data.requestId || "");
          if (rid && requestIds.has(rid)) {
            map[rid] = { id: d.id, ...(data as any) };
          }
        });

        setResponsesByRequestId(map);
      } catch (e: any) {
        console.error("Failed to load feedback requests:", e);
        setError(e?.message || "Failed to load feedback requests");
      } finally {
        setLoading(false);
      }
    };

    loadMyRequests();
  }, [legacyId]);

  const pending = useMemo(
    () => requests.filter((r) => String(r.status).toLowerCase() !== "completed"),
    [requests]
  );

  const completed = useMemo(
    () => requests.filter((r) => String(r.status).toLowerCase() === "completed"),
    [requests]
  );

  const resetForm = () => {
    setFormData({
      technicalSkills: "",
      collaboration: "",
      leadership: "",
      communication: "",
      strengths: "",
      improvements: "",
      additionalComments: "",
      rating: 0,
    });
  };

  const handleOpenForm = (req: FeedbackRequest) => {
    resetForm();
    setSelectedRequest(req);
  };

  const handleSubmit = async () => {
    if (!selectedRequest || !legacyId) return;
    if (!formData.strengths || !formData.improvements) return;

    try {
      await addDoc(collection(db, "feedbackResponses"), {
        requestId: selectedRequest.id,
        revieweeId: selectedRequest.revieweeId,
        reviewerId: legacyId, // (your app logic: the logged-in user submits)
        reviewerRole: selectedRequest.requestedByRole || "Peer",
        cycleType: selectedRequest.cycleType,
        submittedAt: serverTimestamp(),

        scores: {
          technical: formData.rating,
          collaboration: formData.rating,
          leadership: formData.rating,
          communication: formData.rating,
        },

        text: {
          technicalSkills: formData.technicalSkills,
          collaboration: formData.collaboration,
          leadership: formData.leadership,
          communication: formData.communication,
        },

        strengths: [formData.strengths],
        improvements: [formData.improvements],
        comment: formData.additionalComments || "",
      });

      await updateDoc(doc(db, "feedbackRequests", selectedRequest.id), {
        status: "completed",
        completedAt: serverTimestamp(),
      });

      setRequests((prev) =>
        prev.map((r) => (r.id === selectedRequest.id ? { ...r, status: "completed" } : r))
      );

      setSelectedRequest(null);
      resetForm();
    } catch (e: any) {
      console.error("Submit failed:", e);
      alert(e?.message || "Failed to submit feedback");
    }
  };

  if (selectedRequest) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold">Provide Feedback</h1>
              <p className="text-gray-600 mt-1">
                Confidential feedback form for{" "}
                <span className="font-medium">{selectedRequest.employeeName}</span>
              </p>
            </div>

            <button
              onClick={() => setSelectedRequest(null)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <X className="size-6" />
            </button>
          </div>

          <Card className="p-4 mb-6 bg-blue-50">
            <div className="flex items-start gap-3">
              <MessageSquare className="size-5 text-blue-600 mt-0.5" />
              <div>
                <div className="text-blue-900 mb-1">Anonymous Feedback</div>
                <p className="text-sm text-blue-800">
                  Your identity will not be shared with the recipient.
                </p>
              </div>
            </div>
          </Card>

          <div className="space-y-6">
            <div>
              <label className="block mb-2">Overall Rating</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setFormData({ ...formData, rating: r })}
                    className={`size-12 rounded-lg border-2 ${
                      formData.rating >= r
                        ? "bg-blue-600 border-blue-600 text-white"
                        : "border-gray-300"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {[
              ["Technical Skills", "technicalSkills"],
              ["Collaboration", "collaboration"],
              ["Leadership", "leadership"],
              ["Communication", "communication"],
            ].map(([label, key]) => (
              <div key={key}>
                <label className="block mb-2">{label}</label>
                <textarea
                  rows={3}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-gray-50 text-gray-900
                  placeholder:text-gray-400
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={(formData as any)[key]}
                  onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                />
              </div>
            ))}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block mb-2">Key Strengths *</label>
                <textarea
                  rows={4}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-gray-50 text-gray-900
                  placeholder:text-gray-400
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.strengths}
                  onChange={(e) => setFormData({ ...formData, strengths: e.target.value })}
                />
              </div>

              <div>
                <label className="block mb-2">Areas for Improvement *</label>
                <textarea
                  rows={4}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-gray-50 text-gray-900
                  placeholder:text-gray-400
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.improvements}
                  onChange={(e) => setFormData({ ...formData, improvements: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block mb-2">Additional Comments</label>
              <textarea
                rows={3}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-gray-50 text-gray-900
                placeholder:text-gray-400
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={formData.additionalComments}
                onChange={(e) => setFormData({ ...formData, additionalComments: e.target.value })}
              />
            </div>

            <div className="flex items-center gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!formData.strengths || !formData.improvements}
                className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg disabled:opacity-50"
              >
                <Send className="size-5" />
                Submit Feedback
              </button>

              <button
                type="button"
                onClick={() => setSelectedRequest(null)}
                className="px-6 py-3 border rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">360 Feedback Requests</h1>
        <p className="text-gray-600 mt-1">Provide feedback for your colleagues</p>
        {legacyId && <p className="text-xs text-gray-400 mt-2">Resolved legacyId: {legacyId}</p>}
      </div>

      {error && (
        <Card className="p-4 border border-red-200 bg-red-50 text-red-700">{error}</Card>
      )}

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">
          Pending Requests ({loading ? "…" : pending.length})
        </h2>

        {loading ? (
          <Card className="p-10 text-center text-gray-500">Loading…</Card>
        ) : pending.length === 0 ? (
          <Card className="p-10 text-center text-gray-500">
            <Clock className="size-12 mx-auto mb-3 text-orange-500" />
            <p>No pending feedback requests</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pending.map((req) => (
              <Card key={req.id} className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <div className="font-semibold">{req.employeeName}</div>
                      {req.isAnonymous && (
                        <span className="text-xs px-2 py-1 rounded bg-blue-50 text-blue-700">
                          Anonymous
                        </span>
                      )}
                    </div>

                    <div className="text-sm text-gray-600 mt-2">{req.cycleType}</div>

                    <div className="text-sm text-gray-600 mt-4">
                      Requested by:{" "}
                      <span className="font-medium">{req.requestedBy}</span>{" "}
                      <span className="text-gray-500">({req.requestedByRole})</span>
                    </div>

                    <div className="text-sm mt-1">
                      Due date:{" "}
                      <span className="text-red-600 font-medium">{formatDate(req.dueDate)}</span>
                    </div>
                  </div>

                  <div className="p-2 rounded-lg bg-orange-50">
                    <Clock className="size-5 text-orange-500" />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenForm(req)}
                  className="mt-4 w-full bg-blue-600 text-white py-3 rounded-lg font-medium"
                >
                  Provide Feedback
                </button>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-3 pt-2">
        <h2 className="text-lg font-semibold">Completed ({loading ? "…" : completed.length})</h2>

        {loading ? null : completed.length === 0 ? (
          <Card className="p-10 text-center text-gray-500">
            <CheckCircle className="size-12 mx-auto mb-3 text-green-500" />
            <p>No completed feedback records</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {completed.map((req) => {
              const resp = responsesByRequestId[req.id];
              return (
                <Card key={req.id} className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <div className="font-semibold">{req.employeeName}</div>
                        {req.isAnonymous && (
                          <span className="text-xs px-2 py-1 rounded bg-blue-50 text-blue-700">
                            Anonymous
                          </span>
                        )}
                      </div>

                      <div className="text-sm text-gray-600 mt-2">{req.cycleType}</div>

                      {resp?.scores && (
                        <div className="text-sm text-gray-700 mt-4">
                          Scores — Tech: {resp.scores.technical ?? "-"}, Collab:{" "}
                          {resp.scores.collaboration ?? "-"}, Lead:{" "}
                          {resp.scores.leadership ?? "-"}, Comms:{" "}
                          {resp.scores.communication ?? "-"}
                        </div>
                      )}

                      {resp?.comment && (
                        <div className="text-sm text-gray-700 mt-2">
                          <span className="font-medium">Comment:</span> {resp.comment}
                        </div>
                      )}

                      <div className="text-sm text-green-700 mt-3 font-medium">
                        Feedback submitted
                      </div>
                    </div>

                    <div className="p-2 rounded-lg bg-green-50">
                      <CheckCircle className="size-5 text-green-500" />
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeFeedbackRequests;