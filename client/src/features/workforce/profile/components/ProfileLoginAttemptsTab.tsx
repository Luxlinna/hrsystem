import { useState, useEffect, memo } from "react";
import {
  getDeviceIcon,
  getClientPublicIp,
  getInitialOrCachedSessions,
  recordCurrentDeviceLogin,
  type CachedDeviceSession,
} from "@/lib/deviceSessionCache";

interface Props {
  userCreatedAt?: string;
  userLastSignInAt?: string;
  email?: string;
}

export const ProfileLoginAttemptsTab = memo(function ProfileLoginAttemptsTab({
  userLastSignInAt,
  email,
}: Props) {
  const [attempts, setAttempts] = useState<CachedDeviceSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const initSessions = async () => {
      // 1. Resolve client public IP
      const liveIp = await getClientPublicIp();
      if (!isMounted) return;

      // 2. Parse current device with UAParser and cache it for this user
      recordCurrentDeviceLogin(email, liveIp);

      // 3. Retrieve all cached device sessions for this user
      const sessions = getInitialOrCachedSessions(email, userLastSignInAt, liveIp);
      if (!isMounted) return;

      setAttempts(sessions);
      setLoading(false);
    };

    initSessions();

    return () => {
      isMounted = false;
    };
  }, [userLastSignInAt, email]);

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
          {attempts.map((item, idx) => {
            const isCurrent = item.isCurrent || idx === 0;
            return (
              <div
                key={item.id}
                className="p-3.5 sm:p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                {/* Device & Browser info */}
                <div className="flex items-start gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0 ${
                      isCurrent
                        ? "bg-[#253C7D]/10 dark:bg-sky-500/20 text-[#253C7D] dark:text-sky-400"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    <i className={getDeviceIcon(item.os, item.deviceType)} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                        {item.browser} on {item.os}
                      </span>
                      {isCurrent && (
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
            );
          })}
        </div>
      )}
    </div>
  );
});
