import { memo } from "react";
import { Link } from "react-router-dom";
import type { LiveStats } from "../types";

interface AttentionAlertRowProps {
  stats: LiveStats;
  can: (module: string) => boolean;
}

export const AttentionAlertRow = memo(function AttentionAlertRow({
  stats,
  can,
}: AttentionAlertRowProps) {
  const showLeave = can("leave");
  const showOnboarding = can("onboarding");
  const showNotifications = can("notifications");

  if (!showLeave && !showOnboarding && !showNotifications) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mb-6">
      {showLeave && (
        <Link
          to="/leave"
          className="bg-white border border-gray-200/80 hover:border-amber-300 rounded-2xl p-4 shadow-2xs hover:shadow-xs transition-all flex items-center gap-3.5"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <i className="ri-time-line text-lg" />
          </div>
          <div className="min-w-0">
            <p className="text-lg font-black text-gray-900">{stats.leavePending}</p>
            <p className="text-[11px] font-semibold text-gray-500 truncate">
              {stats.leavePending === 1 ? "leave request awaiting review" : "leave requests awaiting review"}
            </p>
          </div>
        </Link>
      )}

      {showOnboarding && (
        <Link
          to="/onboarding"
          className="bg-white border border-gray-200/80 hover:border-violet-300 rounded-2xl p-4 shadow-2xs hover:shadow-xs transition-all flex items-center gap-3.5"
        >
          <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">
            <i className="ri-user-add-line text-lg" />
          </div>
          <div className="min-w-0">
            <p className="text-lg font-black text-gray-900">{stats.onboardingPending}</p>
            <p className="text-[11px] font-semibold text-gray-500 truncate">
              {stats.onboardingPending === 1 ? "onboarding case in progress" : "onboarding cases in progress"}
            </p>
          </div>
        </Link>
      )}

      {showNotifications && (
        <Link
          to="/notifications"
          className="bg-white border border-gray-200/80 hover:border-rose-300 rounded-2xl p-4 shadow-2xs hover:shadow-xs transition-all flex items-center gap-3.5"
        >
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <i className="ri-notification-3-line text-lg" />
          </div>
          <div className="min-w-0">
            <p className="text-lg font-black text-gray-900">{stats.notificationsUnread}</p>
            <p className="text-[11px] font-semibold text-gray-500 truncate">
              {stats.notificationsUnread === 1 ? "unread notification" : "unread notifications"}
            </p>
          </div>
        </Link>
      )}
    </div>
  );
});
