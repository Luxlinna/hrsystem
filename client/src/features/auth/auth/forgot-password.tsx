import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";

export default function ForgotPasswordPage() {
  const [identifier, setIdentifier] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [requestStatus, setRequestStatus] = useState<"pending" | "approved" | "rejected" | null>(null);
  const navigate = useNavigate();
  const pollTimerRef = useRef<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("request-password-reset", {
        body: { identifier: identifier.trim() },
      });
      if (fnError || data?.error) {
        throw new Error(data?.error || fnError?.message || "Failed to submit password reset request");
      }
      setRequestId(data?.requestId || null);
      setRequestStatus("pending");
    } catch (err: any) {
      setError(err.message || "Failed to submit reset request");
    } finally {
      setLoading(false);
    }
  };

  const handleApprovedRedirect = useCallback((link: string) => {
    setRequestStatus("approved");
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    if (link.includes("token_hash=")) {
      const urlObj = new URL(link, window.location.origin);
      navigate(`/reset-password${urlObj.search}`, { replace: true });
    } else if (link.startsWith("http")) {
      window.location.href = link;
    } else {
      navigate(link, { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    if (!requestId || requestStatus !== "pending") return;
    let isMounted = true;

    const checkStatus = async () => {
      try {
        const { data } = await supabase.functions.invoke("request-password-reset", {
          body: { action: "check_status", requestId },
        });
        if (!isMounted) return;
        if (data?.status === "approved" && data?.resetLink) {
          handleApprovedRedirect(data.resetLink);
        } else if (data?.status === "rejected") {
          setRequestStatus("rejected");
          if (pollTimerRef.current) clearInterval(pollTimerRef.current);
        }
      } catch (err) {
        console.warn("Status check notice:", err);
      }
    };

    pollTimerRef.current = setInterval(checkStatus, 2500);

    const channel = supabase
      .channel(`pwd-reset-${requestId}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "password_reset_requests", filter: `id=eq.${requestId}` }, (payload: any) => {
        if (payload.new?.status === "approved" && payload.new?.admin_note) {
          handleApprovedRedirect(payload.new.admin_note);
        } else if (payload.new?.status === "rejected") {
          setRequestStatus("rejected");
        }
      })
      .subscribe();

    return () => {
      isMounted = false;
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      supabase.removeChannel(channel);
    };
  }, [requestId, requestStatus, handleApprovedRedirect]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F5F0] p-4 font-sans">
      <div className="w-full max-w-md bg-white rounded-2xl p-8 md:p-10 border border-gray-100 shadow-xs">
        <div className="text-center mb-8">
          <img src="/logo-mark.png" alt="HRM_OPS Logo" className="w-14 h-14 object-contain mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Forgot Password</h1>
          <p className="text-[13px] text-gray-500 mt-1">
            {requestStatus === "pending" ? "Awaiting Admin Approval" : requestStatus === "rejected" ? "Request Declined" : "Ask an admin to approve your reset"}
          </p>
        </div>

        {requestStatus === "pending" ? (
          <div className="space-y-6">
            <div className="flex flex-col items-center text-center p-6 bg-blue-50/60 border border-blue-100 rounded-2xl">
              <div className="w-12 h-12 rounded-full bg-blue-100 text-[#253C7D] flex items-center justify-center text-xl mb-3 animate-pulse">
                <i className="ri-shield-user-line" />
              </div>
              <h3 className="text-sm font-bold text-[#253C7D]">Waiting for Admin Approval</h3>
              <p className="text-[12.5px] text-slate-600 mt-2 leading-relaxed">
                Request for <span className="font-semibold text-slate-900">{identifier}</span> is pending in the Admin Portal.
              </p>
              <div className="mt-4 flex items-center gap-2 px-3 py-1.5 bg-white rounded-full border border-blue-200/80 shadow-2xs text-xs text-[#253C7D] font-medium">
                <i className="ri-loader-4-line animate-spin text-sm" />
                <span>Keep this page open — it will auto-redirect once approved</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => { setRequestId(null); setRequestStatus(null); }}
              className="w-full py-2.5 bg-slate-100 text-slate-700 rounded-lg text-[13px] font-semibold hover:bg-slate-200 transition-all cursor-pointer"
            >
              Cancel & Try Another Number/Email
            </button>
          </div>
        ) : requestStatus === "rejected" ? (
          <div className="space-y-6">
            <div className="flex flex-col items-center text-center p-6 bg-rose-50 border border-rose-100 rounded-2xl">
              <i className="ri-close-circle-line text-3xl text-rose-500 mb-2" />
              <h3 className="text-sm font-bold text-rose-800">Request Declined</h3>
              <p className="text-[12.5px] text-rose-600 mt-1 leading-relaxed">Your reset request was declined by an administrator. Please reach out to HR.</p>
            </div>
            <Link to="/login" className="w-full block text-center py-2.5 bg-[#253C7D] text-white rounded-lg text-[13px] font-semibold hover:bg-[#1F336A] transition-all">Back to Sign In</Link>
          </div>
        ) : (
          <>
            {error && <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg text-[12px] text-red-600">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Phone Number or Email</label>
                <div className="relative">
                  <i className="ri-user-shared-line absolute left-3.5 top-1/2 -translate-y-1/2 text-base text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 text-[13px] text-gray-900 focus:outline-none focus:border-[#253C7D] focus:ring-1 focus:ring-[#253C7D]/20 transition-all"
                    placeholder="e.g. 0882446786 or admin@company.com"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading || !identifier.trim()}
                className="w-full py-2.5 bg-[#253C7D] text-white rounded-lg text-[13px] font-semibold hover:bg-[#1F336A] active:scale-[0.98] transition-all disabled:opacity-60 cursor-pointer"
              >
                {loading ? "Submitting..." : "Request Admin Approval"}
              </button>
            </form>
            <p className="text-center text-[12px] text-gray-500 mt-6">
              Remembered your password? <Link to="/login" className="text-[#253C7D] font-semibold hover:underline">Sign in</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
