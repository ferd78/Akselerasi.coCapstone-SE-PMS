import { useState } from "react";
import { Link } from "react-router-dom";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../firebase";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    const cleaned = email.trim().toLowerCase();
    if (!cleaned) {
      setError("Please enter your email.");
      return;
    }

    setSending(true);
    try {
      await sendPasswordResetEmail(auth, cleaned);
      setSuccess(
        "If an account exists for that email, a password reset link has been sent."
      );
      setEmail("");
    } catch (err: any) {
      const code = err?.code as string | undefined;
      if (code === "auth/invalid-email") {
        setError("Invalid email address.");
      } else if (code === "auth/too-many-requests") {
        setError("Too many requests. Please wait a bit and try again.");
      } else {
        setSuccess(
          "If an account exists for that email, a password reset link has been sent."
        );
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <div className="p-6">
        <div className="flex items-center gap-2">
          <div className="text-xl font-bold text-sky-600">AKSELERASI</div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl border bg-white shadow-sm p-8">
          <h1 className="text-2xl font-semibold text-center">Reset Password</h1>
          <p className="text-sm text-gray-500 text-center mt-2">
            Enter your email and we’ll send you a reset link.
          </p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div className="space-y-2">
              <label className="text-sm text-gray-600">Email</label>
              <input
                className="w-full rounded-lg border px-4 py-3 text-sm focus:outline-none focus:ring"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={sending}
              />
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            {success && (
              <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={sending}
              className="w-full rounded-lg bg-sky-500 text-white py-3 text-sm font-semibold hover:bg-sky-600 disabled:opacity-60"
            >
              {sending ? "Sending..." : "Send reset link"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link to="/" className="text-sm text-gray-600 hover:underline">
              Back to login
            </Link>
          </div>
        </div>
      </div>
      <div className="h-40 bg-gradient-to-r from-sky-500 to-sky-400 rounded-t-[60px]" />
    </div>
  );
};

export default ForgotPassword;