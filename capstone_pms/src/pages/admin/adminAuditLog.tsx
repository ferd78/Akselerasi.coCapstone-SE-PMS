import { useState } from "react";
import { Eye, X, Download } from "lucide-react";

type AuditLog = {
  timestamp: string;
  user: string;
  action: string;
  details: string;
  ip: string;
};

const auditLogs: AuditLog[] = [
  {
    timestamp: "2024-12-22 10:35:22",
    user: "Michael Chen",
    action: "EVALUATION SUBMITTED",
    details: "Submitted performance evaluation for Sarah Johnson",
    ip: "192.168.1.45",
  },
  {
    timestamp: "2024-12-22 09:15:10",
    user: "Emily Rodriguez",
    action: "REWARD APPROVED",
    details: "Approved spot bonus of $1,000 for Sarah Johnson",
    ip: "192.168.1.52",
  },
  {
    timestamp: "2024-12-22 08:42:33",
    user: "David Kim",
    action: "USER CREATED",
    details: "Created new user account: robert.taylor@company.com",
    ip: "192.168.1.100",
  },
  {
    timestamp: "2024-12-21 16:28:45",
    user: "Michael Chen",
    action: "FEEDBACK REQUEST SENT",
    details: "Initiated 360 feedback cycle for 5 team members",
    ip: "192.168.1.45",
  },
  {
    timestamp: "2024-12-21 14:12:18",
    user: "Sarah Johnson",
    action: "FEEDBACK SUBMITTED",
    details: "Submitted anonymous feedback for peer review",
    ip: "192.168.1.73",
  },
];

const AdminAuditLog = () => {
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("All Actions");
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const filteredLogs = auditLogs.filter((log) => {
    const matchesSearch =
      log.user.toLowerCase().includes(search.toLowerCase()) ||
      log.details.toLowerCase().includes(search.toLowerCase());

    const matchesAction =
      actionFilter === "All Actions" || log.action === actionFilter;

    return matchesSearch && matchesAction;
  });

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
            <option>All Actions</option>
            <option>EVALUATION SUBMITTED</option>
            <option>REWARD APPROVED</option>
            <option>USER CREATED</option>
            <option>FEEDBACK REQUEST SENT</option>
            <option>FEEDBACK SUBMITTED</option>
          </select>

          <button className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm hover:bg-gray-100">
            <Download size={16} />
            Export Logs
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="px-4 py-3">Timestamp</th>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Details</th>
              <th className="px-4 py-3">IP Address</th>
              <th className="px-4 py-3 text-right"></th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.map((log, index) => (
              <tr key={index} className="border-t">
                <td className="px-4 py-3">{log.timestamp}</td>
                <td className="px-4 py-3">{log.user}</td>
                <td className="px-4 py-3 font-medium">{log.action}</td>
                <td className="px-4 py-3 text-gray-600">{log.details}</td>
                <td className="px-4 py-3">{log.ip}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => setSelectedLog(log)}
                    className="rounded-md p-2 hover:bg-gray-100"
                  >
                    <Eye size={18} />
                  </button>
                </td>
              </tr>
            ))}
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
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <div>
                <p className="text-gray-500">Timestamp</p>
                <p className="font-medium">{selectedLog.timestamp}</p>
              </div>
              <div>
                <p className="text-gray-500">User</p>
                <p className="font-medium">{selectedLog.user}</p>
              </div>
              <div>
                <p className="text-gray-500">Action</p>
                <p className="font-medium">{selectedLog.action}</p>
              </div>
              <div>
                <p className="text-gray-500">IP Address</p>
                <p className="font-medium">{selectedLog.ip}</p>
              </div>
              <div>
                <p className="text-gray-500">Details</p>
                <p className="font-medium">{selectedLog.details}</p>
              </div>
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
