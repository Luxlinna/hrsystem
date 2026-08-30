import { useState } from "react";
import { Link } from "react-router-dom";

export function ExpiredInvitePanel() {
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
      <div className="flex flex-col items-center text-center p-5 bg-amber-50 border border-amber-100 rounded-xl mb-6">
        <i className="ri-timer-flash-line text-2xl text-amber-500 mb-2" />
        <p className="text-[13px] font-semibold text-amber-800 mb-1">Invitation link expired</p>
        <p className="text-[12px] text-amber-700 leading-relaxed">
          Invite links are valid for <strong>24 hours</strong>. This link has expired or already been used.
        </p>
      </div>

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
          {status === "error" && <p className="text-[12px] text-red-600">{errorMsg}</p>}
          <button
            type="submit"
            disabled={status === "loading"}
            className="w-full py-2.5 bg-[#253C7D] text-white rounded-lg text-[13px] font-semibold hover:bg-[#1F336A] active:scale-[0.98] transition-all disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
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
