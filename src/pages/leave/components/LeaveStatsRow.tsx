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
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
      {/* My Annual Leave Balance */}
      <div
        onClick={() => onSelectTab("balances")}
        className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-2xs hover:shadow-xs transition-all cursor-pointer relative overflow-hidden group"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">My Leave Balance</span>
          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <i className="ri-sun-line text-sm" />
          </div>
        </div>
        <p className="text-2xl font-black text-gray-900 mt-2">
          {stats.myAnnualRemaining}{" "}
          <span className="text-xs font-semibold text-gray-400">/ {stats.myAnnualEntitlement} days</span>
        </p>
        <p className="text-[11px] text-gray-500 mt-0.5">
          {stats.myAnnualUsed} used &middot; {stats.myAnnualPending} pending
        </p>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500" />
      </div>

      {/* On Leave Today */}
      <div
        onClick={() => onSelectTab("calendar")}
        className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-2xs hover:shadow-xs transition-all cursor-pointer relative overflow-hidden group"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">On Leave Today</span>
          <div className="w-7 h-7 rounded-lg bg-[#253C7D]/10 text-[#253C7D] flex items-center justify-center">
            <i className="ri-user-unfollow-line text-sm" />
          </div>
        </div>
        <p className="text-2xl font-black text-gray-900 mt-2">{stats.onLeaveToday}</p>
        <p className="text-[11px] text-gray-500 mt-0.5">Employees out of office</p>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#253C7D]" />
      </div>

      {/* Pending Approvals */}
      <div
        onClick={() => {
          onSelectTab("requests");
          onFilterStatus("pending");
        }}
        className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-2xs hover:shadow-xs transition-all cursor-pointer relative overflow-hidden group"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">Pending Review</span>
          <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <i className="ri-time-line text-sm" />
          </div>
        </div>
        <p className="text-2xl font-black text-amber-700 mt-2">{stats.pending}</p>
        <p className="text-[11px] text-gray-500 mt-0.5">Awaiting management action</p>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500" />
      </div>

      {/* Approved Leave Total */}
      <div
        onClick={() => {
          onSelectTab("requests");
          onFilterStatus("approved");
        }}
        className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-2xs hover:shadow-xs transition-all cursor-pointer relative overflow-hidden group"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total Approved</span>
          <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
            <i className="ri-calendar-check-line text-sm" />
          </div>
        </div>
        <p className="text-2xl font-black text-gray-900 mt-2">
          {stats.approved}{" "}
          <span className="text-xs font-semibold text-gray-400">({stats.totalApprovedDays} days)</span>
        </p>
        <p className="text-[11px] text-gray-500 mt-0.5">Approved this period</p>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-600" />
      </div>
    </div>
  );
});
