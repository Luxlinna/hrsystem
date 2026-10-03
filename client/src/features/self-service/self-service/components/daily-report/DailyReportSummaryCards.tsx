import React from "react";

interface DailyReportSummaryCardsProps {
  todayCount: number;
  todayHours: number;
  weekCount: number;
  weekHours: number;
}

export function DailyReportSummaryCards({
  todayCount,
  todayHours,
  weekCount,
  weekHours,
}: DailyReportSummaryCardsProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl p-4 shadow-2xs">
        <p className="text-xl font-bold text-gray-900 dark:text-slate-100">{todayCount}</p>
        <p className="text-[11px] text-gray-500 dark:text-slate-400">Entries today</p>
      </div>
      <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl p-4 shadow-2xs">
        <p className="text-xl font-bold text-gray-900 dark:text-slate-100">{Math.round(todayHours * 10) / 10}h</p>
        <p className="text-[11px] text-gray-500 dark:text-slate-400">Hours today</p>
      </div>
      <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl p-4 shadow-2xs">
        <p className="text-xl font-bold text-gray-900 dark:text-slate-100">{weekCount}</p>
        <p className="text-[11px] text-gray-500 dark:text-slate-400">Entries this week</p>
      </div>
      <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl p-4 shadow-2xs">
        <p className="text-xl font-bold text-gray-900 dark:text-slate-100">{Math.round(weekHours * 10) / 10}h</p>
        <p className="text-[11px] text-gray-500 dark:text-slate-400">Hours this week</p>
      </div>
    </div>
  );
}
