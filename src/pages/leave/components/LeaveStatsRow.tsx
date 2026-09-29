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
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
      {/* My Annual Leave Balance */}
      <div
        onClick={() => onSelectTab("balances")}
        className="bg-white border border-slate-200/80 rounded-lg sm:rounded-xl p-2.5 sm:p-3 shadow-2xs hover:shadow-xs hover:border-slate-300 transition-all cursor-pointer flex flex-col justify-between"
      >
        <div className="flex items-center justify-between gap-1.5">
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider truncate">Leave Balance</span>
          <i className="ri-calendar-check-line text-slate-400 text-xs shrink-0" />
        </div>
        <div className="mt-1.5">
          <p className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight leading-tight">
            {stats.myAnnualRemaining}
            <span className="text-[11px] font-normal text-slate-400 ml-1">/ {stats.myAnnualEntitlement}d</span>
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5 font-medium truncate">
            <span>{stats.myAnnualUsed} used</span>
            <span className="mx-1 text-slate-300">&bull;</span>
            <span>{stats.myAnnualPending} pending</span>
          </p>
        </div>
      </div>

      {/* On Leave Today */}
      <div
        onClick={() => onSelectTab("calendar")}
        className="bg-white border border-slate-200/80 rounded-lg sm:rounded-xl p-2.5 sm:p-3 shadow-2xs hover:shadow-xs hover:border-slate-300 transition-all cursor-pointer flex flex-col justify-between"
      >
        <div className="flex items-center justify-between gap-1.5">
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider truncate">On Leave Today</span>
          <i className="ri-user-unfollow-line text-slate-400 text-xs shrink-0" />
        </div>
        <div className="mt-1.5">
          <p className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight leading-tight">{stats.onLeaveToday}</p>
          <p className="text-[10px] text-slate-400 mt-0.5 font-medium truncate">Employees out today</p>
        </div>
      </div>

      {/* Pending Approvals */}
      <div
        onClick={() => {
          onSelectTab("requests");
          onFilterStatus("pending");
        }}
        className="bg-white border border-slate-200/80 rounded-lg sm:rounded-xl p-2.5 sm:p-3 shadow-2xs hover:shadow-xs hover:border-slate-300 transition-all cursor-pointer flex flex-col justify-between"
      >
        <div className="flex items-center justify-between gap-1.5">
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider truncate">Pending Review</span>
          <i className="ri-time-line text-amber-500 text-xs shrink-0" />
        </div>
        <div className="mt-1.5">
          <p className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight leading-tight">{stats.pending}</p>
          <p className="text-[10px] text-amber-600 mt-0.5 font-medium truncate">Awaiting action</p>
        </div>
      </div>

      {/* Approved Leave Total */}
      <div
        onClick={() => {
          onSelectTab("requests");
          onFilterStatus("approved");
        }}
        className="bg-white border border-slate-200/80 rounded-lg sm:rounded-xl p-2.5 sm:p-3 shadow-2xs hover:shadow-xs hover:border-slate-300 transition-all cursor-pointer flex flex-col justify-between"
      >
        <div className="flex items-center justify-between gap-1.5">
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider truncate">Total Approved</span>
          <i className="ri-checkbox-circle-line text-slate-400 text-xs shrink-0" />
        </div>
        <div className="mt-1.5">
          <p className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight leading-tight">
            {stats.approved}
            <span className="text-[11px] font-normal text-slate-400 ml-1">({stats.totalApprovedDays}d)</span>
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5 font-medium truncate">Approved this period</p>
        </div>
      </div>
    </div>
  );
});
