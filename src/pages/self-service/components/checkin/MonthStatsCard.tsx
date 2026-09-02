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
  scheduleSettings,
}: MonthStatsCardProps) {
  const stats = [
    { label: "Days Logged", value: presentCount, sub: `${daysWithHours} with hours`, icon: "ri-user-follow-line", color: "text-emerald-600 bg-emerald-50" },
    { label: "Punctuality", value: `${punctuality}%`, sub: `${onTimeCount} on time`, icon: "ri-shield-check-line", color: "text-teal-600 bg-teal-50" },
    { label: "Late Arrivals", value: lateCount, sub: "After shift start", icon: "ri-time-line", color: "text-amber-600 bg-amber-50" },
    { label: "Early Leaves", value: earlyLeaveCount, sub: `${scheduleSettings.earlyLeaveGraceMinutes}m grace`, icon: "ri-logout-circle-line", color: "text-orange-600 bg-orange-50" },
    { label: "Absences", value: absentCount, sub: absentCount === 0 ? "Perfect record" : "Needs review", icon: "ri-user-unfollow-line", color: "text-rose-500 bg-rose-50" },
    { label: "Total Hours", value: `${totalHours.toFixed(0)}h`, sub: `avg ${avgHours.toFixed(1)}h/day`, icon: "ri-timer-line", color: "text-[#253C7D] bg-[#253C7D]/10" },
  ];

  return (
    <div className="bg-white border border-gray-200/80 rounded-2xl shadow-2xs overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 bg-gray-50/60">
        <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Last 30 Days</p>
        <p className="text-[11px] text-gray-400">{recordsCount} record{recordsCount === 1 ? "" : "s"}</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 divide-x divide-y lg:divide-y-0 divide-gray-100">
        {stats.map((s) => (
          <div key={s.label} className="px-4 py-3.5">
            <div className="flex items-center gap-2 mb-1.5">
              <div className={`w-6 h-6 flex items-center justify-center rounded-md shrink-0 ${s.color}`}>
                <i className={`${s.icon} text-[11px]`} />
              </div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider truncate">{s.label}</p>
            </div>
            <p className="text-xl font-black text-gray-900 leading-none tabular-nums">{s.value}</p>
            <p className="text-[10px] text-gray-400 mt-1 truncate">{s.sub}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
