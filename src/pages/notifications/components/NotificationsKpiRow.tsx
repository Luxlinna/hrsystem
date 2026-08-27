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
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mb-6">
      {/* Total Card */}
      <div
        onClick={onResetFilters}
        className={`bg-white border rounded-2xl p-4 transition-all cursor-pointer shadow-2xs hover:shadow-xs relative overflow-hidden ${
          !filtersActive ? "border-[#253C7D] ring-2 ring-[#253C7D]/10" : "border-gray-200/80"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-[#253C7D] uppercase tracking-wider">Total</span>
          <div className="w-6 h-6 rounded-lg bg-[#253C7D]/10 text-[#253C7D] flex items-center justify-center">
            <i className="ri-notification-3-line text-xs" />
          </div>
        </div>
        <p className="text-2xl font-black text-gray-900 mt-2">{totalCount}</p>
        <p className="text-[10px] text-gray-400 mt-0.5">All notifications</p>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#253C7D]" />
      </div>

      {/* Unread Card */}
      <div
        onClick={() => onFilterChange(filter === "unread" ? "all" : "unread")}
        className={`bg-white border rounded-2xl p-4 transition-all cursor-pointer shadow-2xs hover:shadow-xs relative overflow-hidden ${
          filter === "unread" ? "border-amber-500 ring-2 ring-amber-500/10" : "border-gray-200/80"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Unread</span>
          <div className="w-6 h-6 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <i className="ri-mail-unread-line text-xs" />
          </div>
        </div>
        <p className="text-2xl font-black text-amber-700 mt-2">{unreadCount}</p>
        <p className="text-[10px] text-gray-400 mt-0.5">Needs your review</p>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500" />
      </div>

      {/* Today Card */}
      <div
        onClick={onToggleTodayOnly}
        className={`bg-white border rounded-2xl p-4 transition-all cursor-pointer shadow-2xs hover:shadow-xs relative overflow-hidden ${
          todayOnly ? "border-slate-500 ring-2 ring-slate-500/10" : "border-gray-200/80"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Today</span>
          <div className="w-6 h-6 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
            <i className="ri-calendar-2-line text-xs" />
          </div>
        </div>
        <p className="text-2xl font-black text-slate-700 mt-2">{todayCount}</p>
        <p className="text-[10px] text-gray-400 mt-0.5">Received today</p>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-500" />
      </div>

      {/* Needs Review / Urgent Card */}
      <div
        onClick={() => onFilterChange(filter === "urgent" ? "all" : "urgent")}
        className={`bg-white border rounded-2xl p-4 transition-all cursor-pointer shadow-2xs hover:shadow-xs relative overflow-hidden ${
          filter === "urgent" ? "border-rose-500 ring-2 ring-rose-500/10" : "border-gray-200/80"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">Needs Review</span>
          <div className="w-6 h-6 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
            <i className="ri-alert-line text-xs" />
          </div>
        </div>
        <p className="text-2xl font-black text-rose-700 mt-2">{urgentCount}</p>
        <p className="text-[10px] text-gray-400 mt-0.5">Warnings & errors</p>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-rose-500" />
      </div>
    </div>
  );
});
