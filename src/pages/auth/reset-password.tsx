import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

function ExpiredInvitePanel() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("loading");
    setErrorMsg("");
    try {
      const res = await fetch(
        `${import.meta.env.VITE_PUBLIC_SUPABASE_URL}/functions/v1/request-password-reset`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({ email: email.trim() }),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok && data.error) throw new Error(data.error);
      setStatus("sent");
    } catch (err: any) {
      setErrorMsg(err.message || "Could not submit request. Please try again.");
      setStatus("error");
    }
  };

  if (status === "sent") {
    return (
      <>
        <div className="flex flex-col items-center text-center p-6 bg-emerald-50 border border-emerald-100 rounded-xl">
          <i className="ri-mail-check-line text-3xl text-emerald-500 mb-3" />
          <p className="text-[14px] font-semibold text-emerald-800 mb-1">Request Sent!</p>
          <p className="text-[12px] text-emerald-700 leading-relaxed">
            Your request for a new invitation has been sent to the administrator.
            Once approved, you'll receive a fresh invite link in your email within 24 hours.
          </p>
        </div>
        <Link
          to="/login"
          className="mt-6 w-full block text-center py-2.5 bg-[#253C7D] text-white rounded-lg text-[13px] font-semibold hover:bg-[#1F336A] active:scale-[0.98] transition-all"
        >
          Back to Sign In
        </Link>
      </>
    );
  }

  return (
    <>
      {/* Expired notice */}
      <div className="flex flex-col items-center text-center p-5 bg-amber-50 border border-amber-100 rounded-xl mb-6">
        <i className="ri-timer-flash-line text-2xl text-amber-500 mb-2" />
        <p className="text-[13px] font-semibold text-amber-800 mb-1">Invitation link expired</p>
        <p className="text-[12px] text-amber-700 leading-relaxed">
          Invite links are valid for <strong>24 hours</strong>. This link has expired or already been used.
        </p>
      </div>

      {/* Request new invite form */}
      <div className="bg-gray-50 border border-gray-100 rounded-xl p-5">
        <p className="text-[13px] font-semibold text-gray-800 mb-1">Request a new invitation</p>
        <p className="text-[12px] text-gray-500 mb-4 leading-relaxed">
          Enter your work email below. An administrator will be notified and can send you a fresh invite link.
        </p>
        <form onSubmit={handleRequest} className="space-y-3">
          <div className="relative">
            <i className="ri-mail-line absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-gray-400 pointer-events-none" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@company.com"
              className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-gray-200 text-[13px] text-gray-900 bg-white focus:outline-none focus:border-[#253C7D] focus:ring-1 focus:ring-[#253C7D]/20 transition-all"
            />
          </div>
          {status === "error" && (
            <p className="text-[12px] text-red-600">{errorMsg}</p>
          )}
          <button
            type="submit"
            disabled={status === "loading"}
            className="w-full py-2.5 bg-[#253C7D] text-white rounded-lg text-[13px] font-semibold hover:bg-[#1F336A] active:scale-[0.98] transition-all disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {status === "loading" ? (
              <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Sending...</>
            ) : (
              <><i className="ri-mail-send-line" /> Request New Invite</>
            )}
          </button>
        </form>
      </div>

      <Link
        to="/login"
        className="mt-4 w-full block text-center py-2.5 border border-gray-200 text-gray-600 rounded-lg text-[13px] font-medium hover:bg-gray-50 active:scale-[0.98] transition-all"
      >
        Back to Sign In
      </Link>
    </>
  );
}

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [done, setDone] = useState(false);
  const [invitedEmail, setInvitedEmail] = useState("");
  const { updatePassword } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setHasSession(!!data.session);
      setInvitedEmail(data.session?.user.email || "");
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
      // The invitation token has already established an authenticated
      // session. After setting the password, take the user straight in.
      navigate("/", { replace: true });
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
            {done ? "Account Ready" : "Sign Up Account"}
          </h1>
          <p className="text-[13px] text-gray-500 mt-1">
            {done ? "You can now sign in with your new password" : "Create a password to activate your account"}
          </p>
        </div>

        {checking ? (
          <div className="flex flex-col items-center py-8 text-gray-400">
            <span className="w-6 h-6 border-2 border-[#253C7D] border-t-transparent rounded-full animate-spin" />
            <p className="text-[12px] mt-3">Verifying your invitation...</p>
          </div>
        ) : done ? (
          <>
            <div className="flex flex-col items-center text-center p-6 bg-emerald-50 border border-emerald-100 rounded-xl">
              <i className="ri-checkbox-circle-line text-3xl text-emerald-600 mb-3" />
              <p className="text-[13px] text-emerald-800 leading-relaxed">
                Your account password has been created successfully.
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
          <ExpiredInvitePanel />
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
                  Invited Email
                </label>
                <div className="relative">
                  <i className="ri-mail-line absolute left-3.5 top-1/2 -translate-y-1/2 text-base text-gray-400 pointer-events-none" />
                  <input
                    type="email"
                    value={invitedEmail}
                    readOnly
                    aria-label="Invited email"
                    className="w-full cursor-not-allowed bg-gray-50 pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 text-[13px] text-gray-600"
                    placeholder="Loading invited email..."
                  />
                </div>
              </div>
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
                  Confirm Password
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
                {loading ? "Creating Account..." : "Create Account"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
