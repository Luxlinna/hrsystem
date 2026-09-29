import { memo } from "react";

interface NotificationsKpiRowProps {
  totalCount: number;
  unreadCount: number;
  todayCount: number;
  urgentCount: number;
  filter: string;
  todayOnly: boolean;
  filtersActive: boolean;
  onResetFilters: () => void;
  onFilterChange: (filter: string) => void;
  onToggleTodayOnly: () => void;
}

export const NotificationsKpiRow = memo(function NotificationsKpiRow({
  totalCount,
  unreadCount,
  todayCount,
  urgentCount,
  filter,
  todayOnly,
  filtersActive,
  onResetFilters,
  onFilterChange,
  onToggleTodayOnly,
}: NotificationsKpiRowProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mb-4 sm:mb-5">
      {/* Total Card */}
      <div
        onClick={onResetFilters}
        className={`bg-white border rounded-lg sm:rounded-xl p-2.5 sm:p-3 transition-all cursor-pointer shadow-2xs hover:shadow-xs flex flex-col justify-between ${
          !filtersActive && !todayOnly
            ? "border-[#253C7D] ring-1 ring-[#253C7D]/20 bg-blue-50/10"
            : "border-slate-200/80 hover:border-slate-300"
        }`}
      >
        <div className="flex items-center justify-between gap-1.5">
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider truncate">Total</span>
          <i className="ri-notification-3-line text-slate-400 text-xs shrink-0" />
        </div>
        <div className="mt-1.5">
          <p className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight leading-tight">{totalCount}</p>
          <p className="text-[10px] text-slate-400 mt-0.5 font-medium truncate">All notifications</p>
        </div>
      </div>

      {/* Unread Card */}
      <div
        onClick={() => onFilterChange(filter === "unread" ? "all" : "unread")}
        className={`bg-white border rounded-lg sm:rounded-xl p-2.5 sm:p-3 transition-all cursor-pointer shadow-2xs hover:shadow-xs flex flex-col justify-between ${
          filter === "unread"
            ? "border-amber-500 ring-1 ring-amber-500/20 bg-amber-50/10"
            : "border-slate-200/80 hover:border-slate-300"
        }`}
      >
        <div className="flex items-center justify-between gap-1.5">
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider truncate">Unread</span>
          <i className="ri-mail-unread-line text-amber-500 text-xs shrink-0" />
        </div>
        <div className="mt-1.5">
          <p className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight leading-tight">{unreadCount}</p>
          <p className="text-[10px] text-amber-600 mt-0.5 font-medium truncate">Needs your review</p>
        </div>
      </div>

      {/* Today Card */}
      <div
        onClick={onToggleTodayOnly}
        className={`bg-white border rounded-lg sm:rounded-xl p-2.5 sm:p-3 transition-all cursor-pointer shadow-2xs hover:shadow-xs flex flex-col justify-between ${
          todayOnly
            ? "border-slate-700 ring-1 ring-slate-700/20 bg-slate-50/50"
            : "border-slate-200/80 hover:border-slate-300"
        }`}
      >
        <div className="flex items-center justify-between gap-1.5">
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider truncate">Today</span>
          <i className="ri-calendar-2-line text-slate-400 text-xs shrink-0" />
        </div>
        <div className="mt-1.5">
          <p className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight leading-tight">{todayCount}</p>
          <p className="text-[10px] text-slate-400 mt-0.5 font-medium truncate">Received today</p>
        </div>
      </div>

      {/* Needs Review / Urgent Card */}
      <div
        onClick={() => onFilterChange(filter === "urgent" ? "all" : "urgent")}
        className={`bg-white border rounded-lg sm:rounded-xl p-2.5 sm:p-3 transition-all cursor-pointer shadow-2xs hover:shadow-xs flex flex-col justify-between ${
          filter === "urgent"
            ? "border-rose-500 ring-1 ring-rose-500/20 bg-rose-50/10"
            : "border-slate-200/80 hover:border-slate-300"
        }`}
      >
        <div className="flex items-center justify-between gap-1.5">
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider truncate">Needs Review</span>
          <i className="ri-alert-line text-rose-500 text-xs shrink-0" />
        </div>
        <div className="mt-1.5">
          <p className="text-lg sm:text-xl font-bold text-rose-700 tracking-tight leading-tight">{urgentCount}</p>
          <p className="text-[10px] text-rose-500 mt-0.5 font-medium truncate">Warnings & errors</p>
        </div>
      </div>
    </div>
  );
});
