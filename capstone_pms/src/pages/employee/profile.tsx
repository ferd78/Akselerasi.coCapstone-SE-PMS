import { useEffect, useMemo, useState } from "react";
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

import { useAuth } from "../../contexts/AuthContext";
import { resolveEmployeeId } from "../../utils/resolveEmployeeId";
import { db, auth } from "../../firebase";
import { doc, getDoc } from "firebase/firestore";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from "firebase/auth";

type ProfileData = {
  fullName?: string;
  name?: string;
  displayName?: string;
  email?: string;
  department?: string;
  role?: string;
};

const EmployeeProfile = () => {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileData | null>(null);

  const [passwordForm, setPasswordForm] = useState({
    current: "",
    new: "",
    confirm: "",
  });

  const [passwordStatus, setPasswordStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    let mounted = true;

    const fetchProfile = async () => {
      if (!user) return;
      setLoading(true);

      try {
        const uid = await resolveEmployeeId(user);

        const userDoc = await getDoc(doc(db, "users", uid));
        const userData = (userDoc.exists() ? (userDoc.data() as any) : {}) as any;

        const merged: ProfileData = {
          fullName:
            userData.fullName ??
            userData.name ??
            userData.displayName ??
            user.displayName ??
            undefined,
          email: userData.email ?? user.email ?? undefined,
          department: userData.department ?? userData.team ?? userData.division ?? undefined,
          role: userData.role ?? undefined,
        };

        if (!mounted) return;
        setProfile(merged);
      } catch (err) {
        console.warn("Failed to load profile", err);
        if (mounted) setProfile(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchProfile();
    return () => {
      mounted = false;
    };
  }, [user]);

  const avatarLetter = useMemo(() => {
    const name =
      profile?.fullName?.trim() ||
      user?.displayName?.trim() ||
      profile?.email?.trim() ||
      user?.email?.trim() ||
      "";
    return name ? name[0].toUpperCase() : "?";
  }, [profile, user]);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    setPasswordStatus("idle");
    setPasswordError("");

    if (passwordForm.new !== passwordForm.confirm) {
      setPasswordStatus("error");
      setPasswordError("New passwords do not match.");
      return;
    }

    if (!user?.email) {
      setPasswordStatus("error");
      setPasswordError("Missing email on the current session. Please re-login.");
      return;
    }

    try {
      const cred = EmailAuthProvider.credential(user.email, passwordForm.current);
      await reauthenticateWithCredential(auth.currentUser!, cred);
      await updatePassword(auth.currentUser!, passwordForm.new);

      setPasswordStatus("success");
      setPasswordForm({ current: "", new: "", confirm: "" });
    } catch (err: any) {
      console.warn("Password update failed", err);

      const code = err?.code as string | undefined;
      if (code === "auth/wrong-password") {
        setPasswordError("Current password is incorrect.");
      } else if (code === "auth/weak-password") {
        setPasswordError("New password is too weak. Try 6+ characters.");
      } else if (code === "auth/requires-recent-login") {
        setPasswordError("Please log in again, then try changing your password.");
      } else {
        setPasswordError("Failed to update password. Please try again.");
      }

      setPasswordStatus("error");
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Profile Settings</h1>
        <p className="text-gray-600 mt-1">Manage your account details</p>
      </div>

      <Card className="p-6">
        <h2 className="text-xl mb-6">Profile Information</h2>

        {loading ? (
          <div className="text-gray-500 text-sm text-center py-6">Loading...</div>
        ) : (
          <div className="flex items-start gap-6">
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white size-24 rounded-xl flex items-center justify-center text-3xl">
              {avatarLetter}
            </div>

            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                ["Full Name", <UserIcon className="size-5 text-gray-400" />, profile?.fullName || "—"],
                ["Email Address", <Mail className="size-5 text-gray-400" />, profile?.email || "—"],
                ["Department", <Building className="size-5 text-gray-400" />, profile?.department || "—"],
                ["Role", <Shield className="size-5 text-gray-400" />, profile?.role || "—"],
              ].map(([label, icon, value]) => (
                <div key={label as string}>
                  <label className="block text-sm text-gray-600 mb-1">{label}</label>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    {icon}
                    <span className="text-gray-800">{value as string}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <Lock className="size-6 text-gray-600" />
          <h2 className="text-xl">Change Password</h2>
        </div>

        <form onSubmit={handlePasswordChange} className="space-y-4">
          {passwordStatus === "error" && (
            <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg">
              <XCircle className="size-5" />
              <span>{passwordError}</span>
            </div>
          )}

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
            <div key={key as string}>
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
            disabled={!user}
          >
            Update Password
          </button>
        </form>
      </Card>
    </div>
  );
};

export default EmployeeProfile;