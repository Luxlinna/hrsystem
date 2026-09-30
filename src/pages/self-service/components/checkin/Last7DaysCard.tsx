import React from "react";
import type { WorkScheduleSettings } from "@/lib/workSchedule";

interface AttendanceRecord {
  id: string;
  date: string;
  clock_in: string | null;
  clock_out: string | null;
  status: string;
  late_minutes: number;
  early_leave_minutes: number;
  hours_worked: number | null;
}

interface Last7DaysCardProps {
  last7Days: string[];
  records: AttendanceRecord[];
  today: string;
  scheduleSettings: WorkScheduleSettings;
  fmtHM: (hours: number | null | undefined) => string;
}

export function Last7DaysCard({
  last7Days,
  records,
  today,
}: Last7DaysCardProps) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl shadow-2xs overflow-hidden">
      <div className="flex items-center justify-between px-3.5 py-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/60">
        <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Last 7 Days</p>
        <div className="flex items-center gap-2 text-[9.5px] font-semibold text-slate-400 dark:text-slate-500">
          <span>7-Day Log</span>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 sm:gap-2 p-2 sm:p-2.5">
        {last7Days.map((d) => {
          const rec = records.find((r) => r.date === d);
          const dt = new Date(d);
          const dayName = dt.toLocaleDateString("en-US", { weekday: "short" }).slice(0, 3);
          const dayNum = dt.getDate();
          const isT = d === today;
          const isLate = rec?.status === "late" || (rec?.late_minutes || 0) > 0;

          return (
            <div
              key={d}
              className={`rounded-lg border p-1.5 flex flex-col items-center justify-between text-center transition-all ${
                isT
                  ? "border-blue-600 dark:border-blue-500 bg-blue-50/25 dark:bg-blue-950/30 ring-1 ring-blue-600/20 dark:ring-blue-500/20"
                  : "border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800"
              }`}
            >
              <span className={`text-[9px] font-bold uppercase tracking-tight ${isT ? "text-blue-700 dark:text-blue-400" : "text-slate-400 dark:text-slate-500"}`}>
                {dayName}
              </span>

              <span className={`text-xs sm:text-sm font-bold tabular-nums my-0.5 ${isT ? "text-blue-700 dark:text-blue-400" : "text-slate-800 dark:text-slate-200"}`}>
                {dayNum}
              </span>

              <div className="w-full text-[9px] font-medium truncate">
                {rec?.clock_in ? (
                  <span className={`tabular-nums font-semibold ${isLate ? "text-amber-600 dark:text-amber-400" : "text-slate-700 dark:text-slate-300"}`}>
                    {rec.clock_in.slice(0, 5)}
                  </span>
                ) : (
                  <span className="text-slate-300 dark:text-slate-600">—</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
