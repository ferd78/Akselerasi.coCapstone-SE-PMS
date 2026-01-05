import React, { useEffect, useMemo, useState } from "react";
import { Download, Search } from "lucide-react";
import { db } from "../../firebase";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
} from "firebase/firestore";

type UserDoc = {
  id: string;
  legacyId?: string;
  name?: string;
  displayName?: string;
  role?: string;
  department?: string;
  position?: string;
  jobTitle?: string;
  email?: string;
};

type ReviewSnapshotDoc = {
  id: string;
  employeeId?: string;
  overallOutcome?: string;
  finalScore?: number;
  updatedAt?: any;
  cycleId?: string;
};

type Row = {
  key: string;
  empId: string;
  name: string;
  department: string;
  position: string;
  performance: string;
  lastReview: string;
  status: "Pending" | "In Progress" | "Completed";
};

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

function formatDDMMYYYY(d: Date | null): string {
  if (!d) return "—";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? "U";
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

function outcomeBadge(outcome: string) {
  const v = (outcome || "").toLowerCase();
  if (v.includes("outstanding")) return "bg-purple-50 text-purple-700 border-purple-200";
  if (v.includes("exceed")) return "bg-blue-50 text-blue-700 border-blue-200";
  if (v.includes("meet")) return "bg-green-50 text-green-700 border-green-200";
  if (v.includes("need")) return "bg-yellow-50 text-yellow-700 border-yellow-200";
  if (v.includes("unsatisfactory")) return "bg-red-50 text-red-700 border-red-200";
  return "bg-gray-50 text-gray-700 border-gray-200";
}

function statusBadge(status: Row["status"]) {
  if (status === "Completed") return "bg-green-50 text-green-700 border-green-200";
  if (status === "In Progress") return "bg-yellow-50 text-yellow-700 border-yellow-200";
  return "bg-orange-50 text-orange-700 border-orange-200"; // Pending
}

function downloadCSV(filename: string, rows: Row[]) {
  const header = ["Employee", "Department", "Position", "Performance", "Last Review", "Status"];
  const csv = [
    header.join(","),
    ...rows.map((r) =>
      [
        `"${r.name.replaceAll('"', '""')}"`,
        `"${r.department.replaceAll('"', '""')}"`,
        `"${r.position.replaceAll('"', '""')}"`,
        `"${r.performance.replaceAll('"', '""')}"`,
        `"${r.lastReview.replaceAll('"', '""')}"`,
        `"${r.status.replaceAll('"', '""')}"`,
      ].join(",")
    ),
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const HRPerformanceOversight: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserDoc[]>([]);
  const [snapshots, setSnapshots] = useState<ReviewSnapshotDoc[]>([]);

  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState<string>("All Departments");
  const [outcomeFilter, setOutcomeFilter] = useState<string>("All Outcomes");

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      try {
        const usersSnap = await getDocs(
          query(collection(db, "users"), where("role", "==", "employee"))
        );
        const u: UserDoc[] = usersSnap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as any),
        }));
        const snapSnap = await getDocs(
          query(collection(db, "reviewSnapshots"), orderBy("updatedAt", "desc"))
        );

        const s: ReviewSnapshotDoc[] = snapSnap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as any),
        }));

        if (!mounted) return;
        setUsers(u);
        setSnapshots(s);
      } catch (e) {
        console.error("Failed to load performance oversight data:", e);
        if (!mounted) return;
        setUsers([]);
        setSnapshots([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const latestSnapshotByEmp = useMemo(() => {
    const map: Record<string, ReviewSnapshotDoc> = {};
    for (const s of snapshots) {
      const emp = String(s.employeeId || "").trim();
      if (!emp) continue;
      if (!map[emp]) map[emp] = s;
    }
    return map;
  }, [snapshots]);

  const rows: Row[] = useMemo(() => {
    return users.map((u) => {
      const empLegacy = String(u.legacyId || u.id);
      const name = String(u.name || u.displayName || "Unknown");
      const department = String(u.department || "Unknown");
      const position = String(u.position || u.jobTitle || "Employee");
      const snap = latestSnapshotByEmp[empLegacy];
      const perf = String(snap?.overallOutcome || "—");
      const last = formatDDMMYYYY(safeToDate(snap?.updatedAt));
      const status: Row["status"] = snap ? "Completed" : "Pending";
      return {
        key: u.id,
        empId: empLegacy,
        name,
        department,
        position,
        performance: perf,
        lastReview: last,
        status,
      };
    });
  }, [users, latestSnapshotByEmp]);

  const departments = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r) => set.add(r.department));
    return ["All Departments", ...Array.from(set).sort()];
  }, [rows]);

  const outcomes = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r) => {
      if (r.performance && r.performance !== "—") set.add(r.performance);
    });
    return ["All Outcomes", ...Array.from(set).sort()];
  }, [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      const matchesSearch =
        !q ||
        r.name.toLowerCase().includes(q) ||
        r.department.toLowerCase().includes(q) ||
        r.position.toLowerCase().includes(q);

      const matchesDept =
        deptFilter === "All Departments" || r.department === deptFilter;

      const matchesOutcome =
        outcomeFilter === "All Outcomes" || r.performance === outcomeFilter;

      return matchesSearch && matchesDept && matchesOutcome;
    });
  }, [rows, search, deptFilter, outcomeFilter]);

  return (
    <div className="p-8 bg-gray-50 min-h-screen font-sans text-gray-800">
      <div className="max-w-6xl mx-auto space-y-6">
        <header>
          <h1 className="text-2xl font-bold text-gray-900">Performance Oversight</h1>
          <p className="text-gray-500">Organization-wide performance reports</p>
        </header>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex-1 relative">
              <Search className="size-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search employees..."
                className="w-full border rounded-xl pl-10 pr-4 py-3"
              />
            </div>

            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="md:w-56 w-full border rounded-xl px-4 py-3"
            >
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>

            <select
              value={outcomeFilter}
              onChange={(e) => setOutcomeFilter(e.target.value)}
              className="md:w-56 w-full border rounded-xl px-4 py-3"
            >
              {outcomes.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => downloadCSV("performance_report.csv", filtered)}
              className="md:ml-auto flex items-center gap-2 text-blue-600 font-semibold hover:text-blue-700"
              disabled={loading}
              title="Export Report"
            >
              <Download className="size-4" />
              Export Report
            </button>
          </div>
          <div className="mt-4 text-sm text-gray-500">
            {loading ? "Loading..." : `${filtered.length} results`}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-700">
                <tr>
                  <th className="text-left font-semibold px-6 py-4">Employee</th>
                  <th className="text-left font-semibold px-6 py-4">Department</th>
                  <th className="text-left font-semibold px-6 py-4">Position</th>
                  <th className="text-left font-semibold px-6 py-4">Performance</th>
                  <th className="text-left font-semibold px-6 py-4">Last Review</th>
                  <th className="text-left font-semibold px-6 py-4">Status</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                      Loading…
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                      No results found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((r) => (
                    <tr key={r.key} className="border-t">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <div className="size-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-semibold">
                            {initials(r.name)}
                          </div>
                          <div className="font-semibold text-gray-900">{r.name}</div>
                        </div>
                      </td>

                      <td className="px-6 py-5">{r.department}</td>
                      <td className="px-6 py-5">{r.position}</td>

                      <td className="px-6 py-5">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full border text-xs font-semibold ${outcomeBadge(
                            r.performance
                          )}`}
                        >
                          {r.performance}
                        </span>
                      </td>

                      <td className="px-6 py-5">{r.lastReview}</td>

                      <td className="px-6 py-5">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full border text-xs font-semibold ${statusBadge(
                            r.status
                          )}`}
                        >
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {!loading && users.length > 0 && snapshots.length === 0 ? (
          <div className="text-xs text-gray-500">
            Note: No documents found in <code className="px-1 py-0.5 bg-gray-100 rounded">reviewSnapshots</code>.
            If you have snapshots but all show Pending, check that <code className="px-1 py-0.5 bg-gray-100 rounded">users.legacyId</code>{" "}
            matches <code className="px-1 py-0.5 bg-gray-100 rounded">reviewSnapshots.employeeId</code>.
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default HRPerformanceOversight;