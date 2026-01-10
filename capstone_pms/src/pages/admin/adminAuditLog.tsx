import { useEffect, useMemo, useState } from "react";
import { Eye, X, Download } from "lucide-react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "../../firebase";

type AuditLog = {
  id: string;
  timestamp: any;
  actor: string;
  action: string;
  details: string;
  meta?: Record<string, any>;
};

function formatDateTime(ts: any) {
  if (!ts) return "—";
  if (typeof ts?.toDate === "function") {
    return ts.toDate().toLocaleString();
  }
  if (ts instanceof Date) {
    return ts.toLocaleString();
  }
  if (typeof ts === "number") {
    return new Date(ts).toLocaleString();
  }
  if (typeof ts === "string") {
    const d = new Date(ts);
    if (!isNaN(d.getTime())) return d.toLocaleString();
    return ts;
  }
  if (typeof ts?.seconds === "number") {
    return new Date(ts.seconds * 1000).toLocaleString();
  }
  return "—";
}

function downloadCsv(filename: string, rows: Record<string, any>[]) {
  if (!rows.length) return;

  const headers = Object.keys(rows[0]);
  const escape = (v: any) => `"${String(v ?? "").replace(/"/g, '""')}"`;

  const csv = [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => escape(r[h])).join(",")),
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

const AdminAuditLog = () => {
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("All Actions");
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setErr(null);

    const q = query(collection(db, "auditLogs"), orderBy("timestamp", "desc"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const items: AuditLog[] = snap.docs.map((d) => {
          const data = d.data() as any;

          return {
            id: d.id,
            timestamp: data.timestamp ?? data.createdAt ?? null,
            actor:
              data.actor ??
              data.user ??
              data.performedBy ??
              data.createdBy ??
              data.userName ??
              "—",
            action: data.action ?? data.event ?? data.type ?? "—",
            details: data.details ?? data.description ?? data.message ?? "—",
            meta: data.meta ?? {},
          };
        });

        setLogs(items);
        setLoading(false);
      },
      (e) => {
        setErr(e.message || "Failed to load audit logs");
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  const actionOptions = useMemo(() => {
    const s = new Set<string>();
    logs.forEach((l) => s.add(l.action));
    return ["All Actions", ...Array.from(s).sort()];
  }, [logs]);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesSearch =
        log.actor.toLowerCase().includes(search.toLowerCase()) ||
        log.details.toLowerCase().includes(search.toLowerCase());

      const matchesAction =
        actionFilter === "All Actions" || log.action === actionFilter;

      return matchesSearch && matchesAction;
    });
  }, [logs, search, actionFilter]);

  const handleExport = () => {
    const rows = filteredLogs.map((l) => ({
      timestamp: formatDateTime(l.timestamp),
      user: l.actor,
      action: l.action,
      details: l.details,
    }));
    downloadCsv(`audit_logs_${new Date().toISOString().slice(0, 10)}.csv`, rows);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold">Audit Log</h1>
        <p className="text-sm text-gray-500">
          View system activity and user actions
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <input
          type="text"
          placeholder="Search by user or details..."
          className="w-full md:w-[420px] rounded-lg border px-4 py-2 text-sm focus:outline-none focus:ring"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="flex items-center gap-3">
          <select
            className="rounded-lg border px-3 py-2 text-sm"
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
          >
            {actionOptions.map((opt) => (
              <option key={opt}>{opt}</option>
            ))}
          </select>

          <button
            onClick={handleExport}
            className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm hover:bg-gray-100"
          >
            <Download size={16} />
            Export Logs
          </button>
        </div>
      </div>

      {/* State */}
      {loading && <div className="text-sm text-gray-500">Loading logs…</div>}
      {err && <div className="text-sm text-red-600">{err}</div>}

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="px-4 py-3">Timestamp</th>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Details</th>
              <th className="px-4 py-3 text-right"></th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.map((log) => (
              <tr key={log.id} className="border-t">
                <td className="px-4 py-3">{formatDateTime(log.timestamp)}</td>
                <td className="px-4 py-3">{log.actor}</td>
                <td className="px-4 py-3 font-medium">{log.action}</td>
                <td className="px-4 py-3 text-gray-600">{log.details}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => setSelectedLog(log)}
                    className="rounded-md p-2 hover:bg-gray-100"
                    aria-label="View log details"
                    title="View details"
                  >
                    <Eye size={18} />
                  </button>
                </td>
              </tr>
            ))}
            {!loading && filteredLogs.length === 0 && (
              <tr className="border-t">
                <td className="px-4 py-6 text-gray-500" colSpan={5}>
                  No logs found.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="px-4 py-3 text-sm text-gray-500">
          {filteredLogs.length} entries
        </div>
      </div>

      {/* Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-lg font-semibold">Audit Log Details</h2>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Close"
                title="Close"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <div>
                <p className="text-gray-500">Timestamp</p>
                <p className="font-medium">{formatDateTime(selectedLog.timestamp)}</p>
              </div>
              <div>
                <p className="text-gray-500">User</p>
                <p className="font-medium">{selectedLog.actor}</p>
              </div>
              <div>
                <p className="text-gray-500">Action</p>
                <p className="font-medium">{selectedLog.action}</p>
              </div>
              <div>
                <p className="text-gray-500">Details</p>
                <p className="font-medium">{selectedLog.details}</p>
              </div>

              {selectedLog.action === "USER_CREATED" &&
                selectedLog.meta?.createdUser && (
                  <div className="pt-3 border-t space-y-3">
                    <p className="text-sm font-semibold">Created User</p>

                    <div>
                      <p className="text-gray-500">Name</p>
                      <p className="font-medium">
                        {selectedLog.meta.createdUser.name ?? "—"}
                      </p>
                    </div>

                    <div>
                      <p className="text-gray-500">Email</p>
                      <p className="font-medium">
                        {selectedLog.meta.createdUser.email ?? "—"}
                      </p>
                    </div>

                    <div>
                      <p className="text-gray-500">Password</p>
                      <p className="font-medium">
                        {selectedLog.meta.createdUser.password ?? "—"}
                      </p>
                    </div>

                    <div>
                      <p className="text-gray-500">Role</p>
                      <p className="font-medium">
                        {selectedLog.meta.createdUser.role ?? "—"}
                      </p>
                    </div>

                    <div>
                      <p className="text-gray-500">Department</p>
                      <p className="font-medium">
                        {selectedLog.meta.createdUser.department ?? "—"}
                      </p>
                    </div>
                  </div>
                )}
            </div>

            <div className="flex justify-end pt-4 border-t">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 rounded-lg border hover:bg-gray-100 text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAuditLog;