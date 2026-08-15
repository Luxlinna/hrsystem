import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [done, setDone] = useState(false);
  const { updatePassword } = useAuth();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setHasSession(!!data.session);
      setChecking(false);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      await updatePassword(password);
      setDone(true);
    } catch (err: any) {
      setError(err.message || "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F5F0]">
      <div className="w-full max-w-md bg-white rounded-2xl p-8 md:p-10 border border-gray-100">
        <div className="text-center mb-8">
          <img src="/logo-mark.png" alt="HRM_OPS Logo" className="w-14 h-14 object-contain mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-[#1A1A1A]">
            {done ? "Password Updated" : "Reset Password"}
          </h1>
          <p className="text-[13px] text-gray-500 mt-1">
            {done ? "You can now sign in with your new password" : "Choose a new password for your account"}
          </p>
        </div>

        {checking ? (
          <div className="flex flex-col items-center py-8 text-gray-400">
            <span className="w-6 h-6 border-2 border-[#253C7D] border-t-transparent rounded-full animate-spin" />
            <p className="text-[12px] mt-3">Verifying your reset link...</p>
          </div>
        ) : done ? (
          <>
            <div className="flex flex-col items-center text-center p-6 bg-emerald-50 border border-emerald-100 rounded-xl">
              <i className="ri-checkbox-circle-line text-3xl text-emerald-600 mb-3" />
              <p className="text-[13px] text-emerald-800 leading-relaxed">
                Your password has been changed successfully.
              </p>
            </div>
            <Link
              to="/login"
              className="mt-8 w-full block text-center py-2.5 bg-[#253C7D] text-white rounded-lg text-[13px] font-semibold hover:bg-[#1F336A] active:scale-[0.98] transition-all"
            >
              Back to Sign In
            </Link>
          </>
        ) : !hasSession ? (
          <>
            <div className="flex flex-col items-center text-center p-6 bg-amber-50 border border-amber-100 rounded-xl">
              <i className="ri-error-warning-line text-3xl text-amber-500 mb-3" />
              <p className="text-[13px] text-amber-800 leading-relaxed">
                This reset link is invalid or has expired. Request a new link to reset your password.
              </p>
            </div>
            <Link
              to="/forgot-password"
              className="mt-8 w-full block text-center py-2.5 bg-[#253C7D] text-white rounded-lg text-[13px] font-semibold hover:bg-[#1F336A] active:scale-[0.98] transition-all"
            >
              Request New Link
            </Link>
          </>
        ) : (
          <>
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg text-[12px] text-red-600">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <i className="ri-lock-line absolute left-3.5 top-1/2 -translate-y-1/2 text-base text-gray-400 pointer-events-none" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 text-[13px] text-gray-900 focus:outline-none focus:border-[#253C7D] focus:ring-1 focus:ring-[#253C7D]/20 transition-all"
                    placeholder="At least 6 characters"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">
                  Confirm New Password
                </label>
                <div className="relative">
                  <i className="ri-lock-line absolute left-3.5 top-1/2 -translate-y-1/2 text-base text-gray-400 pointer-events-none" />
                  <input
                    type="password"
                    required
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 text-[13px] text-gray-900 focus:outline-none focus:border-[#253C7D] focus:ring-1 focus:ring-[#253C7D]/20 transition-all"
                    placeholder="Re-enter your password"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-[#253C7D] text-white rounded-lg text-[13px] font-semibold hover:bg-[#1F336A] active:scale-[0.98] transition-all disabled:opacity-60"
              >
                {loading ? "Updating..." : "Update Password"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
