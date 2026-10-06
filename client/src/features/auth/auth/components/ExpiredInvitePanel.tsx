import { useState } from "react";
import { Link } from "react-router-dom";

export function ExpiredInvitePanel() {
  const [identifier, setIdentifier] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [showRequestForm, setShowRequestForm] = useState(false);

  const isPhone = !identifier.includes("@") && identifier.replace(/\D/g, "").length >= 3;

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = identifier.trim();
    if (!clean) return;
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
          body: JSON.stringify({ identifier: clean }),
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
          <i className={isPhone ? "ri-phone-check-line text-3xl text-emerald-500 mb-3" : "ri-mail-check-line text-3xl text-emerald-500 mb-3"} />
          <p className="text-[14px] font-semibold text-emerald-800 mb-1">Request Sent!</p>
          <p className="text-[12px] text-emerald-700 leading-relaxed">
            {isPhone
              ? "Your request has been submitted to your administrator. Once approved, you will receive a new setup link via Telegram."
              : "Your request has been sent to the administrator. Once approved, you'll receive a fresh invite link in your email within 24 hours."}
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
      <div className="flex flex-col items-center text-center p-5 bg-emerald-50/80 border border-emerald-200/80 rounded-xl mb-5">
        <div className="w-12 h-12 rounded-full bg-emerald-100/90 flex items-center justify-center mb-2.5">
          <i className="ri-shield-check-line text-2xl text-emerald-600" />
        </div>
        <p className="text-[14px] font-semibold text-emerald-900 mb-1">This link has already been used</p>
        <p className="text-[12px] text-emerald-800 leading-relaxed">
          For security, setup links can only be used <strong>once</strong>. If you have already set up your password, please sign in below.
        </p>
      </div>

      <Link
        to="/login"
        className="w-full py-2.5 bg-[#253C7D] text-white rounded-lg text-[13px] font-semibold hover:bg-[#1F336A] active:scale-[0.98] transition-all block text-center shadow-xs"
      >
        Sign In to Your Account
      </Link>

      <div className="mt-4 pt-3 border-t border-gray-100 text-center">
        {!showRequestForm ? (
          <button
            type="button"
            onClick={() => setShowRequestForm(true)}
            className="text-[12px] text-gray-500 hover:text-[#253C7D] hover:underline cursor-pointer"
          >
            Didn't set your password yet? Request a fresh link
          </button>
        ) : (
          <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 text-left mt-2">
            <p className="text-[12px] font-medium text-gray-700 mb-2">Request a fresh invitation link:</p>
            <form onSubmit={handleRequest} className="space-y-2.5">
              <div className="relative">
                <i
                  className={`${
                    isPhone ? "ri-phone-line" : "ri-mail-line"
                  } absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-gray-400 pointer-events-none`}
                />
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Work email or phone number"
                  className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 text-[12px] text-gray-900 bg-white focus:outline-none focus:border-[#253C7D] focus:ring-1 focus:ring-[#253C7D]/20 transition-all font-sans"
                />
              </div>
              {status === "error" && <p className="text-[12px] text-red-600">{errorMsg}</p>}
              <button
                type="submit"
                disabled={status === "loading"}
                className="w-full py-2 bg-[#253C7D] text-white rounded-lg text-[12px] font-semibold hover:bg-[#1F336A] transition-all disabled:opacity-60 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {status === "loading" ? "Sending..." : "Request Fresh Link"}
              </button>
            </form>
          </div>
        )}
      </div>
    </>
  );
}
