import { memo } from "react";

interface StatsProps {
  ontimeCount: number;
  lateCount: number;
  absentCount: number;
  totalHoursFormatted: string;
}

export const AttendanceStatsSummary = memo(function AttendanceStatsSummary({
  ontimeCount,
  lateCount,
  absentCount,
  totalHoursFormatted,
}: StatsProps) {
  const cards = [
    { label: "On Time", value: `${ontimeCount}d`, sub: "Punctual check-ins", icon: "ri-checkbox-circle-line", isSuccess: true },
    { label: "Late Arrivals", value: `${lateCount}d`, sub: "Late check-ins", icon: "ri-time-line", isWarning: lateCount > 0 },
    { label: "Absences", value: `${absentCount}d`, sub: "Days missed", icon: "ri-close-circle-line", isDanger: absentCount > 0 },
    { label: "Total Hours", value: totalHoursFormatted, sub: "Logged work time", icon: "ri-timer-line" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
      {cards.map((s) => (
        <div
          key={s.label}
          className="bg-white border border-slate-200/80 rounded-lg sm:rounded-xl p-2.5 sm:p-3 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between gap-1.5">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider truncate">
              {s.label}
            </span>
            <i
              className={`${s.icon} text-xs ${
                s.isDanger ? "text-rose-500" : s.isWarning ? "text-amber-500" : "text-slate-400"
              } shrink-0`}
            />
          </div>
          <div className="mt-1.5">
            <p
              className={`text-lg sm:text-xl font-bold tracking-tight leading-tight ${
                s.isDanger ? "text-rose-700" : s.isWarning ? "text-amber-700" : "text-slate-900"
              }`}
            >
              {s.value}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5 font-medium truncate">
              {s.sub}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
});
