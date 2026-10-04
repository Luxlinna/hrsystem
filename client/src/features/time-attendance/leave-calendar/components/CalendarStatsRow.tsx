import { memo } from "react";
import { MONTHS } from "../constants";

interface CalendarStatsRowProps {
  leavesTodayCount: number;
  approvedInMonthCount: number;
  totalDaysInMonth: number;
  pendingLeavesCount: number;
  month: number;
  onFilterStatus: (status: "approved" | "pending" | "all") => void;
}

export const CalendarStatsRow = memo(function CalendarStatsRow({
  leavesTodayCount,
  approvedInMonthCount,
  totalDaysInMonth,
  pendingLeavesCount,
  month,
  onFilterStatus,
}: CalendarStatsRowProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
      {/* On Leave Today */}
      <div
        onClick={() => onFilterStatus("approved")}
        className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-2xs hover:shadow-xs transition-all cursor-pointer relative overflow-hidden group"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">On Leave Today</span>
          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <i className="ri-user-unfollow-line text-sm" />
          </div>
        </div>
        <p className="text-2xl font-black text-gray-900 mt-2">{leavesTodayCount}</p>
        <p className="text-[11px] text-gray-500 mt-0.5">Employees out of office today</p>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500" />
      </div>

      {/* Month Absences */}
      <div
        onClick={() => onFilterStatus("approved")}
        className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-2xs hover:shadow-xs transition-all cursor-pointer relative overflow-hidden group"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
            {MONTHS[month].slice(0, 3)} Absences
          </span>
          <div className="w-7 h-7 rounded-lg bg-[#253C7D]/10 text-[#253C7D] flex items-center justify-center">
            <i className="ri-calendar-check-line text-sm" />
          </div>
        </div>
        <p className="text-2xl font-black text-gray-900 mt-2">{approvedInMonthCount}</p>
        <p className="text-[11px] text-gray-500 mt-0.5">Approved leave blocks</p>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#253C7D]" />
      </div>

      {/* Total Days Taken */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-2xs relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Days Away</span>
          <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
            <i className="ri-time-line text-sm" />
          </div>
        </div>
        <p className="text-2xl font-black text-gray-900 mt-2">{totalDaysInMonth}</p>
        <p className="text-[11px] text-gray-500 mt-0.5">Total working days in {MONTHS[month].slice(0, 3)}</p>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-600" />
      </div>

      {/* Pending Decisons */}
      <div
        onClick={() => onFilterStatus("pending")}
        className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-2xs hover:shadow-xs transition-all cursor-pointer relative overflow-hidden group"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">Pending Decisions</span>
          <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <i className="ri-hourglass-2-line text-sm" />
          </div>
        </div>
        <p className="text-2xl font-black text-amber-700 mt-2">{pendingLeavesCount}</p>
        <p className="text-[11px] text-gray-500 mt-0.5">Awaiting manager decision</p>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500" />
      </div>
    </div>
  );
});
