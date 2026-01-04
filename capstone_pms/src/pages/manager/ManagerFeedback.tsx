import { useEffect, useMemo, useState } from "react";
import { Card } from "@heroui/react";
import {
  MessageSquare,
  Users,
  Clock,
  ArrowLeft,
  Send,
  Plus,
} from "lucide-react";
import { db, auth } from "../../firebase";
import { formatDate } from "../../utils/formatDate";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  where,
  Timestamp,
  writeBatch,
} from "firebase/firestore";

type UserRow = {
  id: string;
  legacyId: string;
  name: string;
  role?: string;
  department?: string;
  position?: string;
  email?: string;
};

type ReviewCycle = {
  id: string;
  title: string;
  startDate?: any;
  endDate?: any;
  isActive?: boolean;
  status?: string;
  type?: string; // "360"
  isAnonymous?: boolean;
};

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
  cycleId?: string;
  isAnonymous: boolean;
  createdAt?: any;
};

const getInitials = (name: string) => {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? "U";
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
};

const safeTitle = (cycle: Partial<ReviewCycle> | null) => {
  if (!cycle) return "360 Feedback Cycle";
  return (
    (cycle as any).title ||
    (cycle as any).name ||
    (cycle as any).cycleName ||
    "360 Feedback Cycle"
  );
};

const chunk = <T,>(arr: T[], size: number) =>
  Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
    arr.slice(i * size, i * size + size)
  );

const parseDateInputToTimestamp = (value: string) => {
  const v = String(value || "").trim();
  if (!v) return null;

  let yyyy = 0,
    mm = 0,
    dd = 0;

  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) {
    const [Y, M, D] = v.split("-");
    yyyy = Number(Y);
    mm = Number(M);
    dd = Number(D);
  } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(v)) {
    const [M, D, Y] = v.split("/");
    yyyy = Number(Y);
    mm = Number(M);
    dd = Number(D);
  } else {
    return null;
  }

  if (!yyyy || !mm || !dd) return null;
  const dt = new Date(yyyy, mm - 1, dd, 0, 0, 0, 0);
  if (Number.isNaN(dt.getTime())) return null;
  return Timestamp.fromDate(dt);
};

const ManagerFeedback = () => {
  const [loading, setLoading] = useState(true);
  const [loadingAssign, setLoadingAssign] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manager, setManager] = useState<UserRow | null>(null);
  const [team, setTeam] = useState<UserRow[]>([]);
  const [activeCycle, setActiveCycle] = useState<ReviewCycle | null>(null);
  const [cycleRequests, setCycleRequests] = useState<FeedbackRequest[]>([]);
  const [cycleResponsesCount, setCycleResponsesCount] = useState<number>(0);
  const [selectedEmployee, setSelectedEmployee] = useState<UserRow | null>(null);
  const [selectedReviewers, setSelectedReviewers] = useState<
    Record<string, boolean>
  >({});
  const [showNewCycle, setShowNewCycle] = useState(false);
  const [creatingCycle, setCreatingCycle] = useState(false);
  const [cycleName, setCycleName] = useState("");
  const [startDateInput, setStartDateInput] = useState("");
  const [endDateInput, setEndDateInput] = useState("");
  const [anonymousFeedback, setAnonymousFeedback] = useState(true);

  useEffect(() => {
    const loadManager = async () => {
      setError(null);

      try {
        const user = auth.currentUser;
        if (!user?.email) {
          setManager(null);
          setError("Not logged in / missing email.");
          return;
        }
        try {
          const uidDoc = await getDoc(doc(db, "users", user.uid));
          if (uidDoc.exists()) {
            const data = uidDoc.data() as any;
            const legacyId = String(data?.legacyId || data?.id || uidDoc.id);
            const name = String(data?.name || data?.displayName || "Manager");
            setManager({
              id: uidDoc.id,
              legacyId,
              name,
              role: data?.role,
              department: data?.department,
              position: data?.position || data?.jobTitle,
              email: data?.email,
            });
            return;
          }
        } catch {
          // empty
        }
        const snap = await getDocs(
          query(collection(db, "users"), where("email", "==", user.email))
        );

        if (snap.empty) {
          setManager(null);
          setError(`No user profile found in Firestore for ${user.email}.`);
          return;
        }

        const d = snap.docs[0];
        const data = d.data() as any;

        setManager({
          id: d.id,
          legacyId: String(data?.legacyId || data?.id || d.id),
          name: String(data?.name || data?.displayName || "Manager"),
          role: data?.role,
          department: data?.department,
          position: data?.position || data?.jobTitle,
          email: data?.email,
        });
      } catch (e: any) {
        console.error(e);
        setManager(null);
        setError(e?.message || "Failed to load manager profile");
      }
    };

    loadManager();
  }, []);

  const refreshActiveCycle = async () => {
    try {
      const snap = await getDocs(collection(db, "reviewCycles"));
      if (snap.empty) {
        setActiveCycle(null);
        return;
      }

      const cycles = snap.docs.map((d) => {
        const data = d.data() as any;
        const title = data?.title || data?.name || data?.cycleName || "360 Feedback Cycle";
        return {
          id: d.id,
          title,
          startDate: data?.startDate,
          endDate: data?.endDate,
          isActive: Boolean(data?.isActive),
          status: data?.status,
          type: data?.type,
          isAnonymous: data?.isAnonymous,
        } as ReviewCycle;
      });

      const is360Cycle = (c: ReviewCycle) => {
        const type = String(c.type || "").toLowerCase();
        const title = String(c.title || "").toLowerCase();
        return (
          type === "360" ||
          type.includes("360") ||
          type.includes("feedback") ||
          title.includes("360") ||
          title.includes("feedback")
        );
      };

      const cycles360 = cycles.filter(is360Cycle);

      const active360 =
        cycles360.find((c) => c.isActive) ||
        cycles360.find((c) => String(c.status).toLowerCase() === "active") ||
        null;

      const activeAny =
        cycles.find((c) => c.isActive) ||
        cycles.find((c) => String(c.status).toLowerCase() === "active") ||
        null;

      setActiveCycle(active360 || activeAny);
    } catch (e) {
      console.error(e);
      setActiveCycle(null);
    }
  };

  useEffect(() => {
    refreshActiveCycle();
  }, []);

  useEffect(() => {
    const loadTeam = async () => {
      setLoading(true);
      setError(null);

      try {
        if (!manager) {
          setTeam([]);
          setLoading(false);
          return;
        }

        let qy = query(collection(db, "users"));
        if (manager.department) {
          qy = query(collection(db, "users"), where("department", "==", manager.department));
        }

        const snap = await getDocs(qy);

        const rows: UserRow[] = snap.docs.map((d) => {
          const data = d.data() as any;
          return {
            id: d.id,
            legacyId: String(data?.legacyId || data?.id || d.id),
            name: String(data?.name || data?.displayName || "Unknown"),
            role: data?.role,
            department: data?.department,
            position: data?.position || data?.jobTitle,
            email: data?.email,
          };
        });

        const employees = rows.filter((u) => {
          const r = String(u.role || "").toLowerCase();
          if (!r) return true;
          return r.includes("employee") || r.includes("staff") || r.includes("dev") || r.includes("peer");
        });

        setTeam(employees);
      } catch (e: any) {
        console.error(e);
        setTeam([]);
        setError(e?.message || "Failed to load team members");
      } finally {
        setLoading(false);
      }
    };

    loadTeam();
  }, [manager]);

  useEffect(() => {
    const loadCycleStats = async () => {
      try {
        if (!activeCycle) {
          setCycleRequests([]);
          setCycleResponsesCount(0);
          return;
        }

        const cycleType = safeTitle(activeCycle);
        const reqCol = collection(db, "feedbackRequests");

        const byCycleId = await getDocs(query(reqCol, where("cycleId", "==", activeCycle.id)));
        let reqRows: FeedbackRequest[] = byCycleId.docs.map((d) => ({
          id: d.id,
          ...(d.data() as any),
        }));

        if (reqRows.length === 0) {
          const byCycleType = await getDocs(query(reqCol, where("cycleType", "==", cycleType)));
          reqRows = byCycleType.docs.map((d) => ({
            id: d.id,
            ...(d.data() as any),
          }));
        }
        setCycleRequests(reqRows);
        const requestIds = reqRows.map((r) => r.id).filter(Boolean);
        if (requestIds.length === 0) {
          setCycleResponsesCount(0);
          return;
        }
        const respCol = collection(db, "feedbackResponses");
        let totalResponses = 0;
        for (const group of chunk(requestIds, 10)) {
          const respSnap = await getDocs(query(respCol, where("requestId", "in", group)));
          totalResponses += respSnap.size;
        }

        setCycleResponsesCount(totalResponses);
      } catch (e) {
        console.error(e);
        setCycleRequests([]);
        setCycleResponsesCount(0);
      }
    };

    loadCycleStats();
  }, [activeCycle]);

  const cycleTitle = safeTitle(activeCycle);
  const cycleStart = activeCycle?.startDate ? formatDate(activeCycle.startDate) : "—";
  const cycleEnd = activeCycle?.endDate ? formatDate(activeCycle.endDate) : "—";
  const totalRequests = cycleRequests.length;
  const totalResponses = cycleResponsesCount;
  const completionPct =
    totalRequests > 0 ? Math.round((totalResponses / totalRequests) * 100) : 0;

  const assignedCountByEmployeeId = useMemo(() => {
    const map: Record<string, number> = {};
    cycleRequests.forEach((r) => {
      const id = String(r.revieweeId || "");
      if (!id) return;
      map[id] = (map[id] || 0) + 1;
    });
    return map;
  }, [cycleRequests]);

  const availableReviewers = useMemo(() => {
    if (!selectedEmployee) return [];
    return team.filter((u) => u.legacyId !== selectedEmployee.legacyId);
  }, [team, selectedEmployee]);

  const selectedReviewerIds = useMemo(() => {
    return Object.entries(selectedReviewers)
      .filter(([_, v]) => v)
      .map(([k]) => k);
  }, [selectedReviewers]);

  const openAssign = (employee: UserRow) => {
    setSelectedEmployee(employee);
    setSelectedReviewers({});
  };

  const closeAssign = () => {
    setSelectedEmployee(null);
    setSelectedReviewers({});
  };

  const toggleReviewer = (legacyId: string) => {
    setSelectedReviewers((prev) => ({ ...prev, [legacyId]: !prev[legacyId] }));
  };

  const sendRequests = async () => {
    if (!selectedEmployee || !activeCycle) return;
    if (selectedReviewerIds.length === 0) return;

    setLoadingAssign(true);
    setError(null);

    try {
      const dueDate = activeCycle.endDate || serverTimestamp();
      const existingForReviewee = cycleRequests.filter((r) => {
        const sameReviewee = String(r.revieweeId) === selectedEmployee.legacyId;
        const sameCycle =
          String((r as any).cycleId || "") === activeCycle.id || String(r.cycleType) === cycleTitle;
        return sameReviewee && sameCycle;
      });

      const existingPairs = new Set(
        existingForReviewee.map((r) => `${String(r.revieweeId)}::${String(r.requestedById)}`)
      );

      for (const reviewerLegacyId of selectedReviewerIds) {
        const key = `${selectedEmployee.legacyId}::${reviewerLegacyId}`;
        if (existingPairs.has(key)) continue;
        const reviewer = team.find((t) => t.legacyId === reviewerLegacyId);
        const reviewerName = reviewer?.name || "Reviewer";
        const reviewerRole = "Peer";

        await addDoc(collection(db, "feedbackRequests"), {
          revieweeId: selectedEmployee.legacyId,
          employeeName: selectedEmployee.name,

          requestedById: reviewerLegacyId,
          requestedBy: reviewerName,
          requestedByRole: reviewerRole,

          dueDate,
          status: "pending",
          cycleType: cycleTitle,
          cycleId: activeCycle.id,

          isAnonymous: true,
          createdAt: serverTimestamp(),
        });
      }

      const reqCol = collection(db, "feedbackRequests");
      const byCycleId = await getDocs(query(reqCol, where("cycleId", "==", activeCycle.id)));
      let reqRows: FeedbackRequest[] = byCycleId.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      }));

      if (reqRows.length === 0) {
        const byCycleType = await getDocs(query(reqCol, where("cycleType", "==", cycleTitle)));
        reqRows = byCycleType.docs.map((d) => ({
          id: d.id,
          ...(d.data() as any),
        }));
      }

      setCycleRequests(reqRows);
      setSelectedReviewers({});
    } catch (e: any) {
      console.error(e);
      setError(e?.message || "Failed to send requests");
    } finally {
      setLoadingAssign(false);
    }
  };

  const createNewCycle = async () => {
    setError(null);

    const name = cycleName.trim();
    if (!name) {
      setError("Cycle Name is required.");
      return;
    }

    const startTs = parseDateInputToTimestamp(startDateInput);
    const endTs = parseDateInputToTimestamp(endDateInput);

    if (!startTs) {
      setError("Start Date is invalid. Use YYYY-MM-DD or MM/DD/YYYY.");
      return;
    }
    if (!endTs) {
      setError("End Date is invalid. Use YYYY-MM-DD or MM/DD/YYYY.");
      return;
    }

    if (startTs.toDate().getTime() > endTs.toDate().getTime()) {
      setError("Start Date cannot be after End Date.");
      return;
    }

    setCreatingCycle(true);

    try {
      const batch = writeBatch(db);
      const cyclesSnap = await getDocs(collection(db, "reviewCycles"));
      cyclesSnap.docs.forEach((d) => {
        batch.update(doc(db, "reviewCycles", d.id), { isActive: false, status: "inactive" });
      });

      const newCycleRef = doc(collection(db, "reviewCycles"));
      batch.set(newCycleRef, {
        title: name,
        type: "360",
        startDate: startTs,
        endDate: endTs,
        isAnonymous: anonymousFeedback,
        isActive: true,
        status: "active",
        createdAt: serverTimestamp(),
      });

      await batch.commit();

      setShowNewCycle(false);
      setCycleName("");
      setStartDateInput("");
      setEndDateInput("");
      setAnonymousFeedback(true);

      await refreshActiveCycle();
    } catch (e: any) {
      console.error(e);
      setError(e?.message || "Failed to create cycle (check Firestore rules).");
    } finally {
      setCreatingCycle(false);
    }
  };

  if (showNewCycle) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowNewCycle(false)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="size-4" />
            Back
          </button>
        </div>

        <Card className="p-6">
          <h1 className="text-2xl font-semibold">Initiate 360 Feedback Cycle</h1>
          <p className="text-gray-600 mt-1">Create a new feedback collection cycle</p>

          <div className="mt-6 space-y-5">
            <div>
              <label className="block text-sm font-medium">
                Cycle Name <span className="text-red-500">*</span>
              </label>
              <input
                value={cycleName}
                onChange={(e) => setCycleName(e.target.value)}
                placeholder="e.g., Q4 2024 360 Feedback"
                className="mt-2 w-full border rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium">
                  Start Date <span className="text-red-500">*</span>
                </label>
                <input
                  value={startDateInput}
                  onChange={(e) => setStartDateInput(e.target.value)}
                  placeholder="mm/dd/yyyy or yyyy-mm-dd"
                  className="mt-2 w-full border rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium">
                  End Date <span className="text-red-500">*</span>
                </label>
                <input
                  value={endDateInput}
                  onChange={(e) => setEndDateInput(e.target.value)}
                  placeholder="mm/dd/yyyy or yyyy-mm-dd"
                  className="mt-2 w-full border rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>
            </div>

            <div className="border rounded-xl p-4 flex items-center justify-between">
              <div>
                <div className="font-medium">Anonymous Feedback</div>
                <div className="text-sm text-gray-600">Keep reviewer identities confidential</div>
              </div>

              <button
                type="button"
                onClick={() => setAnonymousFeedback((v) => !v)}
                className={`w-14 h-8 rounded-full relative transition ${
                  anonymousFeedback ? "bg-blue-600" : "bg-gray-300"
                }`}
                aria-label="Toggle anonymous feedback"
              >
                <span
                  className={`absolute top-1 size-6 rounded-full bg-white transition ${
                    anonymousFeedback ? "left-7" : "left-1"
                  }`}
                />
              </button>
            </div>

            <div className="pt-4 border-t flex items-center gap-3">
              <button
                type="button"
                onClick={createNewCycle}
                disabled={creatingCycle}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg disabled:opacity-50"
              >
                {creatingCycle ? "Creating..." : "Create Cycle"}
              </button>

              <button
                type="button"
                onClick={() => setShowNewCycle(false)}
                className="px-6 py-3 rounded-lg border hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>

            {error && (
              <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
                {error}
              </div>
            )}
          </div>
        </Card>
      </div>
    );
  }

  if (selectedEmployee) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={closeAssign}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="size-4" />
            Back to list
          </button>
        </div>

        <Card className="p-6">
          <h1 className="text-2xl font-semibold">Assign Reviewers</h1>
          <p className="text-gray-600 mt-1">
            Select reviewers for <span className="font-medium">{selectedEmployee.name}</span>
          </p>

          <div className="mt-6 border rounded-xl p-4 bg-blue-50">
            <div className="flex items-center gap-4">
              <div className="size-12 rounded-xl bg-blue-600 text-white flex items-center justify-center font-semibold">
                {getInitials(selectedEmployee.name)}
              </div>
              <div>
                <div className="font-semibold">{selectedEmployee.name}</div>
                <div className="text-sm text-gray-600">{selectedEmployee.position || "Employee"}</div>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <div className="font-semibold mb-3">Available Reviewers</div>

            {availableReviewers.length === 0 ? (
              <div className="text-gray-500">No reviewers available.</div>
            ) : (
              <div className="space-y-3">
                {availableReviewers.map((rev) => {
                  const isSelected = Boolean(selectedReviewers[rev.legacyId]);
                  return (
                    <div
                      key={rev.legacyId}
                      className="flex items-center justify-between border rounded-xl p-4"
                    >
                      <div className="flex items-center gap-4">
                        <div className="size-12 rounded-xl bg-blue-600 text-white flex items-center justify-center font-semibold">
                          {getInitials(rev.name)}
                        </div>
                        <div>
                          <div className="font-semibold">{rev.name}</div>
                          <div className="text-sm text-gray-600">{rev.position || "Employee"}</div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => toggleReviewer(rev.legacyId)}
                        className={`px-4 py-2 rounded-lg border ${
                          isSelected
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-white hover:bg-gray-50"
                        }`}
                      >
                        {isSelected ? "Selected" : "Select"}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-6 pt-4 border-t flex items-center gap-3">
              <button
                type="button"
                onClick={sendRequests}
                disabled={loadingAssign || selectedReviewerIds.length === 0}
                className="flex items-center gap-2 bg-blue-600 text-white px-5 py-3 rounded-lg disabled:opacity-50"
              >
                <Send className="size-5" />
                Send Requests ({selectedReviewerIds.length})
              </button>

              <button
                type="button"
                onClick={closeAssign}
                className="px-5 py-3 rounded-lg border hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>

            {error && (
              <div className="mt-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
                {error}
              </div>
            )}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">360 Feedback Management</h1>
          <p className="text-gray-600 mt-1">Manage feedback cycles and reviewer assignments</p>
        </div>

        <button
          type="button"
          onClick={() => setShowNewCycle(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-5 py-3 rounded-lg"
        >
          <Plus className="size-5" />
          New Cycle
        </button>
      </div>

      {error && (
        <Card className="p-4 border border-red-200 bg-red-50 text-red-700">{error}</Card>
      )}

      {!activeCycle ? (
        <Card className="p-10 text-center text-gray-500">
          <MessageSquare className="size-10 mx-auto mb-3 text-gray-400" />
          <div className="font-medium">No active feedback cycle</div>
          <div className="text-sm mt-1">Create a cycle to start collecting feedback</div>
        </Card>
      ) : (
        <div className="rounded-2xl p-6 bg-blue-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-semibold">{cycleTitle}</div>
              <div className="text-sm text-blue-100 mt-1">
                {cycleStart} - {cycleEnd}
              </div>
            </div>

            <div className="px-4 py-2 rounded-full bg-white/15 text-white text-sm">
              Active
            </div>
          </div>

          <div className="mt-6 flex items-end gap-10">
            <div>
              <div className="text-3xl font-semibold">
                {totalResponses}/{totalRequests || 0}
              </div>
              <div className="text-sm text-blue-100">Responses</div>
            </div>

            <div>
              <div className="text-3xl font-semibold">{completionPct}%</div>
              <div className="text-sm text-blue-100">Completion</div>
            </div>
          </div>
        </div>
      )}

      <Card className="p-6">
        <h2 className="text-xl font-semibold">Assign Reviewers</h2>

        {loading ? (
          <div className="mt-6 text-center text-gray-500">Loading…</div>
        ) : team.length === 0 ? (
          <div className="mt-6 text-center text-gray-500">
            <Users className="size-10 mx-auto mb-3 text-gray-400" />
            <div className="font-medium">No team members available</div>
            <div className="text-sm mt-1">Team data will appear here once loaded</div>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {team.map((emp) => {
              const assigned = assignedCountByEmployeeId[emp.legacyId] || 0;
              return (
                <div
                  key={emp.legacyId}
                  className="flex items-center justify-between border rounded-xl p-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="size-12 rounded-xl bg-blue-600 text-white flex items-center justify-center font-semibold">
                      {getInitials(emp.name)}
                    </div>
                    <div>
                      <div className="font-semibold">{emp.name}</div>
                      <div className="text-sm text-gray-600">{emp.position || "Employee"}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-sm text-gray-600">{assigned} reviewers assigned</div>
                    <button
                      type="button"
                      onClick={() => openAssign(emp)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg"
                    >
                      Manage Reviewers
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!activeCycle && (
          <div className="mt-4 text-sm text-orange-700 bg-orange-50 border border-orange-200 rounded-lg p-3 flex items-start gap-2">
            <Clock className="size-5 mt-0.5" />
            <div>
              You don't have an active 360 cycle yet. You can still assign reviewers, but it's
              best to create and activate a cycle first.
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default ManagerFeedback;