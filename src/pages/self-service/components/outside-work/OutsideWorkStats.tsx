import React from "react";

interface OutsideWorkStatsProps {
  totalDays: number;
  completedCount: number;
  totalHours: number;
}

export function OutsideWorkStats({ totalDays, completedCount, totalHours }: OutsideWorkStatsProps) {
  const stats = [
    { label: "Total Days", value: totalDays, icon: "ri-calendar-check-line", color: "text-[#253C7D]", bg: "bg-[#253C7D]/10" },
    { label: "Completed", value: completedCount, icon: "ri-checkbox-circle-line", color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Total Hours", value: totalHours > 0 ? `${Math.floor(totalHours)}h ${Math.round((totalHours % 1) * 60)}m` : "0h", icon: "ri-timer-line", color: "text-[#253C7D]", bg: "bg-[#253C7D]/10" },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {stats.map((s) => (
        <div key={s.label} className={`${s.bg} rounded-xl p-4 flex items-center gap-3`}>
          <div className="w-8 h-8 flex items-center justify-center shrink-0">
            <i className={`${s.icon} text-xl ${s.color}`} />
          </div>
          <div>
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[11px] text-gray-600">{s.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
