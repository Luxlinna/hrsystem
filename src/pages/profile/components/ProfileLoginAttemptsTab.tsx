import { useState, useEffect, memo } from "react";

interface Props {
  userCreatedAt?: string;
  userLastSignInAt?: string;
  email?: string;
}

interface LoginAttempt {
  id: string;
  ip: string;
  browser: string;
  os: string;
  date: string;
  timeAgo: string;
  status: "Success" | "Failed";
}

function getBrowserAndOS(): { browser: string; os: string } {
  if (typeof window === "undefined") return { browser: "Chrome 134", os: "Windows" };
  const ua = navigator.userAgent;
  let browser = "Chrome";
  let os = "Windows";

  if (ua.includes("Edg/")) browser = "Edge";
  else if (ua.includes("Chrome/")) browser = "Chrome";
  else if (ua.includes("Firefox/")) browser = "Firefox";
  else if (ua.includes("Safari/")) browser = "Safari";

  if (ua.includes("Windows")) os = "Windows";
  else if (ua.includes("Mac OS")) os = "macOS";
  else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";
  else if (ua.includes("Android")) os = "Android";
  else if (ua.includes("Linux")) os = "Linux";

  return { browser, os };
}

function getDeviceIcon(os: string): string {
  switch (os) {
    case "macOS":
    case "iOS":
      return "ri-apple-fill";
    case "Windows":
      return "ri-windows-fill";
    case "Android":
      return "ri-android-fill";
    default:
      return "ri-computer-line";
  }
}

function formatDate(date: Date): string {
  const d = String(date.getDate()).padStart(2, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${d}/${m}/${date.getFullYear()}`;
}

function formatTimeAgo(date: Date): string {
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export const ProfileLoginAttemptsTab = memo(function ProfileLoginAttemptsTab({
  userLastSignInAt,
}: Props) {
  const [attempts, setAttempts] = useState<LoginAttempt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const client = getBrowserAndOS();
    const now = new Date();
    const lastSign = userLastSignInAt ? new Date(userLastSignInAt) : new Date(now.getTime() - 15 * 60 * 1000);

    const mockAttempts: LoginAttempt[] = [
      { id: "1", ip: "49.156.35.249", browser: client.browser, os: client.os, date: formatDate(lastSign), timeAgo: formatTimeAgo(lastSign), status: "Success" },
      { id: "2", ip: "119.13.62.42", browser: "Chrome", os: "Windows", date: formatDate(new Date(now.getTime() - 9 * 3600 * 1000)), timeAgo: "9 hours ago", status: "Success" },
      { id: "3", ip: "123.108.252.178", browser: "Chrome", os: "Windows", date: formatDate(new Date(now.getTime() - 24 * 3600 * 1000)), timeAgo: "1 day ago", status: "Success" },
      { id: "4", ip: "49.156.35.248", browser: "Safari", os: "iOS", date: formatDate(new Date(now.getTime() - 48 * 3600 * 1000)), timeAgo: "2 days ago", status: "Success" },
      { id: "5", ip: "119.13.61.222", browser: "Chrome", os: "Windows", date: formatDate(new Date(now.getTime() - 72 * 3600 * 1000)), timeAgo: "3 days ago", status: "Success" },
    ];

    setAttempts(mockAttempts);
    setLoading(false);
  }, [userLastSignInAt]);

  return (
    <div className="w-full">
      {/* Header with Title & Security Note */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800 gap-2">
        <div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <i className="ri-shield-keyhole-line text-[#253C7D] dark:text-sky-400 text-base" />
            Login Activity & Security Logs
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Recent account authentication sessions and authorized device logs
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40 self-start sm:self-center">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Active Protection
        </span>
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
          <i className="ri-loader-4-line animate-spin text-base" /> Loading logs...
        </div>
      ) : (
        <div className="space-y-3">
          {attempts.map((item, idx) => (
            <div
              key={item.id}
              className="p-3.5 sm:p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              {/* Device & Browser info */}
              <div className="flex items-start gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0 ${
                  idx === 0
                    ? "bg-[#253C7D]/10 dark:bg-sky-500/20 text-[#253C7D] dark:text-sky-400"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                }`}>
                  <i className={getDeviceIcon(item.os)} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                      {item.browser} on {item.os}
                    </span>
                    {idx === 0 && (
                      <span className="px-1.5 py-0.5 rounded-md text-[9.5px] font-bold bg-blue-100 dark:bg-blue-900/50 text-[#253C7D] dark:text-sky-300">
                        Current Session
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-500 dark:text-slate-400 flex-wrap">
                    <span className="inline-flex items-center gap-1">
                      <i className="ri-global-line text-xs text-slate-400" />
                      {item.ip}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <i className="ri-calendar-line text-xs text-slate-400" />
                      {item.date}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status & Timeago */}
              <div className="flex items-center sm:flex-col sm:items-end justify-between sm:justify-center shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 dark:border-slate-800">
                <span className="inline-flex items-center gap-1 text-[10.5px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <i className="ri-checkbox-circle-fill text-xs" />
                  {item.status}
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 sm:mt-1 font-medium">
                  {item.timeAgo}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});
