import React from "react";
import type { LeaveTypeBalanceStats } from "../../types";

interface LeaveFormTypeBalancesProps {
  currentStats: LeaveTypeBalanceStats;
}

export function LeaveFormTypeBalances({
  currentStats,
}: LeaveFormTypeBalancesProps) {
  return (
    <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden my-2.5">
      <div className="grid grid-cols-3 divide-x divide-slate-100 dark:divide-slate-800">
        {/* Total Leave Entitlement */}
        <div className="p-2.5 sm:p-4 flex flex-col justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
          <div className="flex items-center justify-between gap-1 mb-1 sm:mb-2">
            <span className="text-base sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight leading-none">
              {currentStats.balance}
            </span>
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-blue-50/90 dark:bg-blue-950/50 text-[#253C7D] dark:text-blue-300 flex items-center justify-center text-xs sm:text-sm shrink-0">
              <i className="ri-calendar-line" />
            </div>
          </div>
          <div className="text-[10px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 leading-tight">
            Total Leave Entitlement
          </div>
        </div>

        {/* Total Leave Used */}
        <div className="p-2.5 sm:p-4 flex flex-col justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
          <div className="flex items-center justify-between gap-1 mb-1 sm:mb-2">
            <span className="text-base sm:text-2xl font-bold text-amber-500 dark:text-amber-400 tracking-tight leading-none">
              {currentStats.used}
            </span>
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-500 dark:text-amber-400 flex items-center justify-center text-xs sm:text-sm shrink-0">
              <i className="ri-time-line" />
            </div>
          </div>
          <div className="text-[10px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 leading-tight">
            Total Leave Used
          </div>
        </div>

        {/* Total Leave Available */}
        <div className="p-2.5 sm:p-4 flex flex-col justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
          <div className="flex items-center justify-between gap-1 mb-1 sm:mb-2">
            <span className="text-base sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400 tracking-tight leading-none">
              {currentStats.available}
            </span>
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-500 dark:text-emerald-400 flex items-center justify-center text-xs sm:text-sm shrink-0">
              <i className="ri-checkbox-circle-line" />
            </div>
          </div>
          <div className="text-[10px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 leading-tight">
            Total Leave Available
          </div>
        </div>
      </div>
    </div>
  );
}
