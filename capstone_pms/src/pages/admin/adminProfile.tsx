import { useState } from "react";
import { Card } from "@heroui/react";
import {
  User as UserIcon,
  Mail,
  Building,
  Shield,
  Lock,
  CheckCircle,
  XCircle,
} from "lucide-react";

const adminProfile = () => {
  const [passwordForm, setPasswordForm] = useState({
    current: "",
    new: "",
    confirm: "",
  });

  const [passwordStatus, setPasswordStatus] = useState<
    "idle" | "success" | "error"
  >("idle");

  const [passwordError, setPasswordError] = useState("");

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();

    setPasswordStatus("idle");
    setPasswordError("");

    if (passwordForm.new !== passwordForm.confirm) {
      setPasswordStatus("error");
      setPasswordError("New passwords do not match.");
      return;
    }


    setPasswordStatus("success");
    setPasswordForm({ current: "", new: "", confirm: "" });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold">Profile Settings</h1>
        <p className="text-gray-600 mt-1">
          Manage your account details
        </p>
      </div>

      {/* Profile Info */}
      <Card className="p-6">
        <h2 className="text-xl mb-6">Profile Information</h2>

        <div className="flex items-start gap-6">
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white size-24 rounded-xl flex items-center justify-center text-3xl">
            ?
          </div>

          <div className="flex-1 grid grid-cols-2 gap-4">
            {[
              ["Full Name", <UserIcon className="size-5 text-gray-400" />, "—"],
              ["Email Address", <Mail className="size-5 text-gray-400" />, "—"],
              ["Department", <Building className="size-5 text-gray-400" />, "—"],
              ["Role", <Shield className="size-5 text-gray-400" />, "—"],
            ].map(([label, icon, value]) => (
              <div key={label as string}>
                <label className="block text-sm text-gray-600 mb-1">
                  {label}
                </label>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  {icon}
                  <span>{value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Change Password */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <Lock className="size-6 text-gray-600" />
          <h2 className="text-xl">Change Password</h2>
        </div>

        <form onSubmit={handlePasswordChange} className="space-y-4">
          {/* Error */}
          {passwordStatus === "error" && (
            <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg">
              <XCircle className="size-5" />
              <span>{passwordError}</span>
            </div>
          )}

          {/* Success */}
          {passwordStatus === "success" && (
            <div className="flex items-center gap-2 p-3 bg-green-50 text-green-700 rounded-lg">
              <CheckCircle className="size-5" />
              <span>Password updated successfully.</span>
            </div>
          )}

          {[
            ["Current Password", "current"],
            ["New Password", "new"],
            ["Confirm New Password", "confirm"],
          ].map(([label, key]) => (
            <div key={key}>
              <label className="block mb-2">{label}</label>
              <input
                type="password"
                value={(passwordForm as any)[key]}
                onChange={(e) =>
                  setPasswordForm({
                    ...passwordForm,
                    [key]: e.target.value,
                  })
                }
                className="w-full px-4 py-3 bg-primary rounded-lg"
                required
              />
            </div>
          ))}

          <button
            type="submit"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
          >
            Update Password
          </button>
        </form>
      </Card>
    </div>
  );
};

export default adminProfile;
