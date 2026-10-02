import React from "react";

interface OutsideWorkStatsProps {
  totalDays: number;
  completedCount: number;
  totalHours: number;
}

export function OutsideWorkStats({ totalDays, completedCount, totalHours }: OutsideWorkStatsProps) {
  const stats = [
    { label: "Total Days", value: totalDays, icon: "ri-calendar-check-line", color: "text-[#253C7D] dark:text-blue-400", bg: "bg-[#253C7D]/10 dark:bg-blue-500/10" },
    { label: "Completed", value: completedCount, icon: "ri-checkbox-circle-line", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/50" },
    { label: "Total Hours", value: totalHours > 0 ? `${Math.floor(totalHours)}h ${Math.round((totalHours % 1) * 60)}m` : "0h", icon: "ri-timer-line", color: "text-[#253C7D] dark:text-blue-400", bg: "bg-[#253C7D]/10 dark:bg-blue-500/10" },
  ];

  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-3">
      {stats.map((s) => (
        <div key={s.label} className={`${s.bg} border border-slate-200/60 dark:border-slate-800 rounded-2xl p-2.5 sm:p-4 flex flex-col sm:flex-row items-center sm:items-center text-center sm:text-left gap-1 sm:gap-3 shadow-2xs`}>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0">
            <i className={`${s.icon} text-lg sm:text-xl ${s.color}`} />
          </div>
          <div className="min-w-0">
            <p className={`text-base sm:text-xl font-extrabold leading-tight ${s.color}`}>{s.value}</p>
            <p className="text-[10px] sm:text-[11px] text-gray-600 dark:text-slate-400 font-semibold leading-tight mt-0.5 truncate">{s.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
