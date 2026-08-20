import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await resetPassword(email);
      setSent(true);
    } catch (err: any) {
      setError(err.message || "Failed to send reset link");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F5F0]">
      <div className="w-full max-w-md bg-white rounded-2xl p-8 md:p-10 border border-gray-100">
        <div className="text-center mb-8">
          <img src="/logo-mark.png" alt="HRM_OPS Logo" className="w-14 h-14 object-contain mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Forgot Password</h1>
          <p className="text-[13px] text-gray-500 mt-1">
            {sent ? "Request submitted" : "Ask an admin to approve your reset"}
          </p>
        </div>

        {sent ? (
          <>
            <div className="flex flex-col items-center text-center p-6 bg-emerald-50 border border-emerald-100 rounded-xl">
              <i className="ri-mail-check-line text-3xl text-emerald-600 mb-3" />
              <p className="text-[13px] text-emerald-800 leading-relaxed">
                If an account exists for <span className="font-semibold">{email}</span>, your request has been submitted to an administrator for approval.
              </p>
              <p className="text-[12px] text-emerald-700 mt-2 leading-relaxed">
                Once approved, you will receive a password reset link via email. Please check your inbox.
              </p>
            </div>
            <Link
              to="/login"
              className="mt-8 w-full block text-center py-2.5 bg-[#253C7D] text-white rounded-lg text-[13px] font-semibold hover:bg-[#1F336A] active:scale-[0.98] transition-all"
            >
              Back to Sign In
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
                <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Email</label>
                <div className="relative">
                  <i className="ri-mail-line absolute left-3.5 top-1/2 -translate-y-1/2 text-base text-gray-400 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 text-[13px] text-gray-900 focus:outline-none focus:border-[#253C7D] focus:ring-1 focus:ring-[#253C7D]/20 transition-all"
                    placeholder="admin@hrmops.com"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-[#253C7D] text-white rounded-lg text-[13px] font-semibold hover:bg-[#1F336A] active:scale-[0.98] transition-all disabled:opacity-60"
              >
                {loading ? "Submitting..." : "Request Admin Approval"}
              </button>
            </form>

            <p className="text-center text-[12px] text-gray-500 mt-6">
              Remembered your password?{" "}
              <Link to="/login" className="text-[#253C7D] font-semibold hover:underline">
                Sign in
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
