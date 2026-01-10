import { useEffect, useState } from "react";
import { MoreVertical, Search, X } from "lucide-react";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  doc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../firebase";
import { writeAuditLog } from "../../utils/writeAuditLogs"; // <- you already created this
import { adminCreateAuthUser } from "../../utils/adminCreateUser";

type Role = "Employee" | "Manager" | "HR" | "Admin";

type UserRow = {
  id: string; // uid
  name: string;
  email: string;
  role: Role;
  department: string;
  status: "Active" | "Inactive";
  initials: string;
};

const roleColor: Record<Role, string> = {
  Employee: "bg-blue-100 text-blue-600",
  Manager: "bg-indigo-100 text-indigo-600",
  HR: "bg-purple-100 text-purple-600",
  Admin: "bg-gray-200 text-gray-700",
};

const AdminUserManagement = () => {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "Employee" as Role,
    department: "",
  });

  // Load users from Firestore
  useEffect(() => {
    const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const list: UserRow[] = snap.docs.map((d) => {
        const data: any = d.data();
        return {
          id: d.id,
          name: data.name ?? "—",
          email: data.email ?? "—",
          role: (data.role ?? "Employee") as Role,
          department: data.department ?? "—",
          status: (data.status ?? "Active") as "Active" | "Inactive",
          initials: data.initials ?? "—",
        };
      });
      setUsers(list);
    });

    return () => unsub();
  }, []);

  const filteredUsers = users.filter((u) =>
    `${u.name} ${u.email}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const resetForm = () => {
    setForm({ name: "", email: "", password: "", role: "Employee", department: "" });
    setFormError(null);
    setSubmitting(false);
  };

  const handleCreateUser = async () => {
    setFormError(null);

    const name = form.name.trim();
    const email = form.email.trim().toLowerCase();
    const password = form.password;
    const department = form.department.trim();
    const role = form.role;

    if (!name || !email || !password || !department) {
      setFormError("Please fill in name, email, password, and department.");
      return;
    }

    if (password.length < 6) {
      setFormError("Password must be at least 6 characters.");
      return;
    }

    setSubmitting(true);

    try {
      // 1) Create Auth user (secondary auth so admin stays logged in)
      const newUser = await adminCreateAuthUser(email, password);

      const initials = name
        .split(" ")
        .filter(Boolean)
        .map((n) => n[0])
        .join("")
        .toUpperCase();

      // 2) Create Firestore user profile doc keyed by UID
      await setDoc(doc(db, "users", newUser.uid), {
        uid: newUser.uid,
        name,
        email,
        role,
        department,
        status: "Active",
        initials,
        createdAt: serverTimestamp(),
      });

      // 3) Audit log
      await writeAuditLog({
        action: "USER_CREATED",
        details: `Created new user account: ${email}`,
        meta: {
          createdUser: {
            name,
            email,
            password, // ⚠️ demo only
            role,
            department,
          },
        },
      });

      // Done
      setIsOpen(false);
      resetForm();
    } catch (e: any) {
      // Common Firebase auth errors
      const msg =
        e?.code === "auth/email-already-in-use"
          ? "This email is already in use."
          : e?.code === "auth/invalid-email"
          ? "Invalid email."
          : e?.code === "auth/weak-password"
          ? "Password is too weak."
          : e?.message || "Failed to create user.";

      setFormError(msg);
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">User Management</h1>
          <p className="text-sm text-gray-500">
            Manage system users and permissions
          </p>
        </div>

        <button
          onClick={() => {
            resetForm();
            setIsOpen(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          + New User
        </button>
      </div>

      {/* Search */}
      <div className="bg-white border rounded-xl p-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search users by name or email..."
            className="w-full border rounded-lg pl-10 pr-4 py-2 focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <p className="text-sm text-gray-500">{filteredUsers.length} users found</p>
      </div>

      {/* Table */}
      <div className="bg-white border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3">User</th>
              <th className="text-left px-4 py-3">Email</th>
              <th className="text-left px-4 py-3">Role</th>
              <th className="text-left px-4 py-3">Department</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-center px-4 py-3">Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id} className="border-b last:border-none">
                <td className="px-4 py-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold">
                    {user.initials}
                  </div>
                  <span className="font-medium">{user.name}</span>
                </td>

                <td className="px-4 py-3">{user.email}</td>

                <td className="px-4 py-3">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${roleColor[user.role]}`}
                  >
                    {user.role}
                  </span>
                </td>

                <td className="px-4 py-3">{user.department}</td>

                <td className="px-4 py-3">
                  <span className="bg-green-100 text-green-600 px-3 py-1 rounded-full text-xs font-medium">
                    {user.status}
                  </span>
                </td>

                <td className="px-4 py-3 text-center relative">
                  <button
                    onClick={() =>
                      setOpenMenuId(openMenuId === user.id ? null : user.id)
                    }
                    className="inline-flex items-center justify-center text-gray-500 hover:text-gray-700"
                    aria-label="Actions"
                  >
                    <MoreVertical size={18} />
                  </button>

                  {openMenuId === user.id && (
                    <div className="absolute right-4 mt-2 w-32 bg-white border rounded-lg shadow-lg z-10">
                      <button
                        onClick={() => setOpenMenuId(null)}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                      >
                        Close
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}

            {filteredUsers.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-md p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Add New User</h2>
              <button
                onClick={() => {
                  setIsOpen(false);
                  resetForm();
                }}
                aria-label="Close"
              >
                <X />
              </button>
            </div>

            {formError && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {formError}
              </div>
            )}

            <input
              placeholder="Full Name"
              className="w-full border rounded-lg px-3 py-2"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />

            <input
              placeholder="Email"
              className="w-full border rounded-lg px-3 py-2"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />

            <input
              placeholder="Password"
              type="text"
              className="w-full border rounded-lg px-3 py-2"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />

            <select
              className="w-full border rounded-lg px-3 py-2"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
            >
              <option value="Employee">Employee</option>
              <option value="Manager">Manager</option>
              <option value="HR">HR</option>
              <option value="Admin">Admin</option>
            </select>

            <input
              placeholder="Department"
              className="w-full border rounded-lg px-3 py-2"
              value={form.department}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  setIsOpen(false);
                  resetForm();
                }}
                className="px-4 py-2 border rounded-lg"
                disabled={submitting}
              >
                Cancel
              </button>

              <button
                onClick={handleCreateUser}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-60"
                disabled={submitting}
              >
                {submitting ? "Creating..." : "Add User"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUserManagement;
