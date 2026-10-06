import { memo } from "react";
import type { LeaveStats } from "../types";

interface LeaveStatsRowProps {
  stats: LeaveStats;
  onSelectTab: (tab: "requests" | "balances" | "calendar") => void;
  onFilterStatus: (status: string) => void;
}

export const LeaveStatsRow = memo(function LeaveStatsRow({
  stats,
  onSelectTab,
  onFilterStatus,
}: LeaveStatsRowProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 sm:gap-2.5">
      {/* My Annual Leave Balance */}
      <div
        onClick={() => onSelectTab("balances")}
        className="bg-white border border-slate-200/80 rounded-xl p-2 sm:p-2.5 shadow-2xs hover:shadow-xs hover:border-slate-300 transition-all cursor-pointer flex flex-col justify-between min-h-[58px]"
      >
        <div className="flex items-center justify-between gap-1">
          <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-tight truncate">Leave Balance</span>
          <i className="ri-calendar-check-line text-slate-400 text-[11px] shrink-0" />
        </div>
        <div className="mt-1">
          <p className="text-sm sm:text-base font-black text-slate-900 tracking-tight leading-none">
            {stats.myAnnualRemaining}
            <span className="text-[10px] font-normal text-slate-400 ml-0.5">/ {stats.myAnnualEntitlement}d</span>
          </p>
          <p className="text-[9px] text-slate-400 mt-0.5 font-medium truncate">
            <span>{stats.myAnnualUsed} used</span>
            <span className="mx-0.5 text-slate-300">&bull;</span>
            <span>{stats.myAnnualPending} pending</span>
          </p>
        </div>
      </div>

      {/* On Leave Today */}
      <div
        onClick={() => onSelectTab("calendar")}
        className="bg-white border border-slate-200/80 rounded-xl p-2 sm:p-2.5 shadow-2xs hover:shadow-xs hover:border-slate-300 transition-all cursor-pointer flex flex-col justify-between min-h-[58px]"
      >
        <div className="flex items-center justify-between gap-1">
          <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-tight truncate">On Leave Today</span>
          <i className="ri-user-unfollow-line text-slate-400 text-[11px] shrink-0" />
        </div>
        <div className="mt-1">
          <p className="text-sm sm:text-base font-black text-slate-900 tracking-tight leading-none">{stats.onLeaveToday}</p>
          <p className="text-[9px] text-slate-400 mt-0.5 font-medium truncate">Employees out today</p>
        </div>
      </div>

      {/* Pending Approvals */}
      <div
        onClick={() => {
          onSelectTab("requests");
          onFilterStatus("pending");
        }}
        className="bg-white border border-slate-200/80 rounded-xl p-2 sm:p-2.5 shadow-2xs hover:shadow-xs hover:border-slate-300 transition-all cursor-pointer flex flex-col justify-between min-h-[58px]"
      >
        <div className="flex items-center justify-between gap-1">
          <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-tight truncate">Pending Review</span>
          <i className="ri-time-line text-amber-500 text-[11px] shrink-0" />
        </div>
        <div className="mt-1">
          <p className="text-sm sm:text-base font-black text-slate-900 tracking-tight leading-none">{stats.pending}</p>
          <p className="text-[9px] text-amber-600 mt-0.5 font-medium truncate">Awaiting action</p>
        </div>
      </div>

      {/* Approved Leave Total */}
      <div
        onClick={() => {
          onSelectTab("requests");
          onFilterStatus("approved");
        }}
        className="bg-white border border-slate-200/80 rounded-xl p-2 sm:p-2.5 shadow-2xs hover:shadow-xs hover:border-slate-300 transition-all cursor-pointer flex flex-col justify-between min-h-[58px]"
      >
        <div className="flex items-center justify-between gap-1">
          <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-tight truncate">Total Approved</span>
          <i className="ri-checkbox-circle-line text-slate-400 text-[11px] shrink-0" />
        </div>
        <div className="mt-1">
          <p className="text-sm sm:text-base font-black text-slate-900 tracking-tight leading-none">
            {stats.approved}
            <span className="text-[10px] font-normal text-slate-400 ml-0.5">({stats.totalApprovedDays}d)</span>
          </p>
          <p className="text-[9px] text-slate-400 mt-0.5 font-medium truncate">Approved this period</p>
        </div>
      </div>
    </div>
  );
});
