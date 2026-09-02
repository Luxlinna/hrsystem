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
      <div className="bg-white border border-gray-100 rounded-xl p-4">
        <p className="text-xl font-bold text-gray-900">{todayCount}</p>
        <p className="text-[11px] text-gray-500">Entries today</p>
      </div>
      <div className="bg-white border border-gray-100 rounded-xl p-4">
        <p className="text-xl font-bold text-gray-900">{Math.round(todayHours * 10) / 10}h</p>
        <p className="text-[11px] text-gray-500">Hours today</p>
      </div>
      <div className="bg-white border border-gray-100 rounded-xl p-4">
        <p className="text-xl font-bold text-gray-900">{weekCount}</p>
        <p className="text-[11px] text-gray-500">Entries this week</p>
      </div>
      <div className="bg-white border border-gray-100 rounded-xl p-4">
        <p className="text-xl font-bold text-gray-900">{Math.round(weekHours * 10) / 10}h</p>
        <p className="text-[11px] text-gray-500">Hours this week</p>
      </div>
    </div>
  );
}
