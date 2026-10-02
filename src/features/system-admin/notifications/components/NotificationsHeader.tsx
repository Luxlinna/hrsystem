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
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-5">
      <div>
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">
          <span>Portal</span>
          <span className="text-slate-300">/</span>
          <span className="text-slate-600">Notifications</span>
        </div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Notifications
          </h1>
          {realtimeEnabled && (
            <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 self-start sm:self-auto">
        <Link
          to="/settings"
          title="Notification preferences"
          className="p-2 bg-white border border-slate-200/90 hover:bg-slate-50 text-slate-500 hover:text-slate-800 rounded-lg sm:rounded-xl shadow-2xs transition-all cursor-pointer"
        >
          <i className="ri-settings-4-line text-sm w-4 h-4 flex items-center justify-center" />
        </Link>
        <button
          onClick={onRefresh}
          title="Refresh"
          className="p-2 bg-white border border-slate-200/90 hover:bg-slate-50 text-slate-500 hover:text-slate-800 rounded-lg sm:rounded-xl shadow-2xs transition-all cursor-pointer"
        >
          <i className="ri-refresh-line text-sm w-4 h-4 flex items-center justify-center" />
        </button>
        <button
          onClick={onMarkAllRead}
          disabled={unreadCount === 0}
          className="inline-flex items-center gap-1.5 bg-[#253C7D] hover:bg-[#1E3064] text-white px-3 py-2 rounded-lg sm:rounded-xl text-xs font-semibold transition-all shadow-2xs cursor-pointer active:scale-98 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none whitespace-nowrap"
        >
          <i className="ri-mail-open-line text-xs" />
          <span>Mark All Read</span>
        </button>
      </div>
    </div>
  );
});
