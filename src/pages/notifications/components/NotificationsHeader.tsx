import { memo } from "react";
import { Link } from "react-router-dom";

interface NotificationsHeaderProps {
  realtimeEnabled: boolean;
  unreadCount: number;
  onRefresh: () => void;
  onMarkAllRead: () => void;
}

export const NotificationsHeader = memo(function NotificationsHeader({
  realtimeEnabled,
  unreadCount,
  onRefresh,
  onMarkAllRead,
}: NotificationsHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
          <span>Workspace</span>
          <i className="ri-arrow-right-s-line text-xs" />
          <span className="text-[#253C7D] font-bold">Notifications</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2.5">
          <span>Notifications</span>
          {realtimeEnabled && (
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live
            </span>
          )}
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          Stay on top of activity across recruitment, leave, payroll, and every module you have access to.
        </p>
      </div>

      <div className="flex items-center gap-2.5 flex-wrap">
        <Link
          to="/settings"
          title="Notification preferences"
          className="p-2.5 bg-white border border-gray-200/80 hover:bg-gray-50 text-gray-500 rounded-xl shadow-2xs transition-all cursor-pointer"
        >
          <i className="ri-settings-4-line text-sm w-4 h-4 flex items-center justify-center" />
        </Link>
        <button
          onClick={onRefresh}
          title="Refresh"
          className="p-2.5 bg-white border border-gray-200/80 hover:bg-gray-50 text-gray-500 rounded-xl shadow-2xs transition-all cursor-pointer"
        >
          <i className="ri-refresh-line text-sm w-4 h-4 flex items-center justify-center" />
        </button>
        <button
          onClick={onMarkAllRead}
          disabled={unreadCount === 0}
          className="inline-flex items-center gap-2 bg-[#253C7D] hover:bg-[#1E3064] text-white px-4 py-2.5 rounded-xl text-xs sm:text-[13px] font-bold transition-all shadow-sm hover:shadow-md cursor-pointer active:scale-98 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none whitespace-nowrap"
        >
          <i className="ri-mail-open-line text-base" />
          Mark All Read
        </button>
      </div>
    </div>
  );
});
