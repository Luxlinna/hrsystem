import React from "react";
import type { WorkScheduleSettings } from "@/lib/workSchedule";

interface MonthStatsCardProps {
  recordsCount: number;
  presentCount: number;
  daysWithHours: number;
  punctuality: number;
  onTimeCount: number;
  lateCount: number;
  earlyLeaveCount: number;
  absentCount: number;
  totalHours: number;
  avgHours: number;
  scheduleSettings: WorkScheduleSettings;
}

export function MonthStatsCard({
  recordsCount,
  presentCount,
  daysWithHours,
  punctuality,
  onTimeCount,
  lateCount,
  earlyLeaveCount,
  absentCount,
  totalHours,
  avgHours,
}: MonthStatsCardProps) {
  const stats = [
    { label: "Days Logged", value: presentCount, sub: `${daysWithHours} with hours`, icon: "ri-calendar-check-line" },
    { label: "Punctuality", value: `${punctuality}%`, sub: `${onTimeCount} on time`, icon: "ri-shield-check-line" },
    { label: "Late Arrivals", value: lateCount, sub: "After shift start", icon: "ri-time-line" },
    { label: "Early Leaves", value: earlyLeaveCount, sub: "Before shift end", icon: "ri-logout-circle-r-line" },
    { label: "Absences", value: absentCount, sub: absentCount === 0 ? "Perfect record" : "Unexcused", icon: "ri-user-unfollow-line" },
    { label: "Total Hours", value: `${totalHours.toFixed(0)}h`, sub: `avg ${avgHours.toFixed(1)}h/day`, icon: "ri-timer-line" },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl shadow-2xs overflow-hidden">
      <div className="flex items-center justify-between px-3.5 py-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/60">
        <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Last 30 Days Summary</p>
        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">{recordsCount} records</p>
      </div>
      <div className="grid grid-cols-3 lg:grid-cols-6 divide-x divide-y lg:divide-y-0 divide-slate-100 dark:divide-slate-800 text-center">
        {stats.map((s) => (
          <div key={s.label} className="p-2.5 sm:p-3 flex flex-col items-center justify-center">
            <div className="flex items-center justify-center gap-1 mb-1 text-slate-400 dark:text-slate-500">
              <i className={`${s.icon} text-xs text-slate-400 dark:text-slate-500`} />
              <p className="text-[9.5px] font-bold uppercase tracking-wider truncate max-w-[75px] sm:max-w-none text-slate-500 dark:text-slate-400">{s.label}</p>
            </div>
            <p className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 leading-tight tabular-nums">{s.value}</p>
            <p className="text-[9.5px] text-slate-400 dark:text-slate-500 mt-0.5 truncate max-w-[85px] sm:max-w-none">{s.sub}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
