import { useState } from "react";
import { MoreVertical, Search, X } from "lucide-react";

type User = {
  id: number;
  name: string;
  email: string;
  role: "Employee" | "Manager" | "HR" | "Admin";
  department: string;
  status: "Active" | "Inactive";
  initials: string;
};

const initialUsers: User[] = [
  {
    id: 1,
    name: "Sarah Johnson",
    email: "sarah.johnson@company.com",
    role: "Employee",
    department: "Engineering",
    status: "Active",
    initials: "SJ",
  },
  {
    id: 2,
    name: "Michael Chen",
    email: "michael.chen@company.com",
    role: "Manager",
    department: "Engineering",
    status: "Active",
    initials: "MC",
  },
  {
    id: 3,
    name: "Emily Rodriguez",
    email: "emily.rodriguez@company.com",
    role: "HR",
    department: "Human Resources",
    status: "Active",
    initials: "ER",
  },
  {
    id: 4,
    name: "David Kim",
    email: "david.kim@company.com",
    role: "Admin",
    department: "IT",
    status: "Active",
    initials: "DK",
  },
];

const roleColor = {
  Employee: "bg-blue-100 text-blue-600",
  Manager: "bg-indigo-100 text-indigo-600",
  HR: "bg-purple-100 text-purple-600",
  Admin: "bg-gray-200 text-gray-700",
};


const AdminUserManagement = () => {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [isOpen, setIsOpen] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "Employee",
    department: "",
  });

  const handleAddUser = () => {
    if (!form.name || !form.email || !form.department) return;

    const initials = form.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();

    setUsers([
      ...users,
      {
        id: users.length + 1,
        name: form.name,
        email: form.email,
        role: form.role as User["role"],
        department: form.department,
        status: "Active",
        initials,
      },
    ]);

    setForm({ name: "", email: "", role: "Employee", department: "" });
    setIsOpen(false);
  };

  const [searchTerm, setSearchTerm] = useState("");

  const filteredUsers = users.filter((user) =>
  `${user.name} ${user.email}`
    .toLowerCase()
    .includes(searchTerm.toLowerCase())
  
);

const [openMenuId, setOpenMenuId] = useState<number | null>(null);
const [editingUser, setEditingUser] = useState<User | null>(null);


const handleSaveUser = () => {
  if (!form.name || !form.email || !form.department) return;

  const initials = form.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  if (editingUser) {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === editingUser.id
          ? {
              ...u,
              name: form.name,
              email: form.email,
              role: form.role as User["role"],
              department: form.department,
              initials,
            }
          : u
      )
    );
  } else {
    setUsers((prev) => [
      ...prev,
      {
        id: prev.length + 1,
        name: form.name,
        email: form.email,
        role: form.role as User["role"],
        department: form.department,
        status: "Active",
        initials,
      },
    ]);
  }

  setForm({ name: "", email: "", role: "Employee", department: "" });
  setEditingUser(null);
  setIsOpen(false);
};

const handleEdit = (user: User) => {
  setForm({
    name: user.name,
    email: user.email,
    role: user.role,
    department: user.department,
  });
  setEditingUser(user);
  setIsOpen(true);
  setOpenMenuId(null);
};

const handleDelete = (id: number) => {
  setUsers((prev) => prev.filter((u) => u.id !== id));
  setOpenMenuId(null);
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
          onClick={() => setIsOpen(true)}
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
        <p className="text-sm text-gray-500">
            {filteredUsers.length} users found
         </p>

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
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${roleColor[user.role]}`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-4 py-3">{user.department}</td>
                <td className="px-4 py-3">
                  <span className="bg-green-100 text-green-600 px-3 py-1 rounded-full text-xs font-medium">
                    Active
                  </span>
                </td>

                <td className="px-4 py-3 text-center relative">
                  <button
                    onClick={() =>
                      setOpenMenuId(openMenuId === user.id ? null : user.id)
                    }
                    className="inline-flex items-center justify-center text-gray-500 hover:text-gray-700"
                  >
                    <MoreVertical size={18} />
                  </button>

                  {openMenuId === user.id && (
                    <div className="absolute right-4 mt-2 w-32 bg-white border rounded-lg shadow-lg z-10">
                      <button
                        onClick={() => handleEdit(user)}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </td>


              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-md p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">
                {editingUser ? "Edit User" : "Add New User"}
              </h2>
              <button onClick={() => setIsOpen(false)}>
                <X />
              </button>
            </div>


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

            <select
              className="w-full border rounded-lg px-3 py-2"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            >
              <option>Employee</option>
              <option>Manager</option>
              <option>HR</option>
              <option>Admin</option>
            </select>

            <input
              placeholder="Department"
              className="w-full border rounded-lg px-3 py-2"
              value={form.department}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 border rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveUser}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg"
              >
                Add User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUserManagement;
