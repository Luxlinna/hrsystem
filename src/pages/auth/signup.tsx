import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signup(email, password, displayName);
      navigate("/");
    } catch (err: any) {
      setError(err.message || "Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F5F0]">
      <div className="w-full max-w-md bg-white rounded-2xl p-8 md:p-10 border border-gray-100">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-[#0D7377] flex items-center justify-center text-white mx-auto mb-4">
            <i className="ri-user-add-line text-xl" />
          </div>
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Create Account</h1>
          <p className="text-[13px] text-gray-500 mt-1">Join HR Nexus</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg text-[12px] text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Full Name</label>
            <input
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-[13px] text-gray-900 focus:outline-none focus:border-[#0D7377] focus:ring-1 focus:ring-[#0D7377]/20 transition-all"
              placeholder="Jane Doe"
            />
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-[13px] text-gray-900 focus:outline-none focus:border-[#0D7377] focus:ring-1 focus:ring-[#0D7377]/20 transition-all"
              placeholder="jane@hrnexus.com"
            />
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-[13px] text-gray-900 focus:outline-none focus:border-[#0D7377] focus:ring-1 focus:ring-[#0D7377]/20 transition-all"
              placeholder="At least 6 characters"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-[#0D7377] text-white rounded-lg text-[13px] font-semibold hover:bg-[#0a5c60] active:scale-[0.98] transition-all disabled:opacity-60"
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="text-center text-[12px] text-gray-500 mt-6">
          Already have an account?{" "}
          <Link to="/login" className="text-[#0D7377] font-semibold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}