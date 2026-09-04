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
  scheduleSettings,
  fmtHM,
}: Last7DaysCardProps) {
  return (
    <div className="bg-white border border-gray-200/80 rounded-2xl shadow-2xs overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 bg-gray-50/60">
        <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Last 7 Days</p>
        <div className="flex items-center gap-3 text-[10px] font-semibold text-gray-400">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400" />On time</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400" />Late</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-300" />Absent</span>
        </div>
      </div>

      <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 p-3">
        {last7Days.map((d) => {
          const rec = records.find((r) => r.date === d);
          const dt = new Date(d);
          const dayName = dt.toLocaleDateString("en-US", { weekday: "short" });
          const dayNum = dt.getDate();
          const isT = d === today;
          const isLate = rec?.status === "late" || (rec?.late_minutes || 0) > 0;
          const isEarly = !!rec?.clock_out && (rec?.early_leave_minutes || 0) > 0;

          const dotColor =
            rec?.status === "absent" ? "bg-rose-400" :
            isLate ? "bg-amber-400" :
            rec ? "bg-emerald-400" :
            "bg-gray-200";

          return (
            <div
              key={d}
              className={`rounded-xl border p-2.5 flex flex-col items-center gap-1 text-center ${
                isT ? "border-[#253C7D] ring-1 ring-[#253C7D]/20 bg-[#253C7D]/[0.03]" : "border-gray-100 bg-white"
              }`}
            >
              <div className="flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
                <span className={`text-[10px] font-bold uppercase tracking-wide ${isT ? "text-[#253C7D]" : "text-gray-400"}`}>{dayName}</span>
              </div>
              <span className={`text-[15px] font-black tabular-nums leading-none ${isT ? "text-[#253C7D]" : "text-gray-800"}`}>{dayNum}</span>

              {rec ? (
                <div className="w-full mt-1 pt-1.5 border-t border-gray-100 space-y-0.5">
                  <div className="flex items-center justify-center gap-1 text-[10px] font-semibold text-gray-600 tabular-nums">
                    <i className="ri-login-box-line text-emerald-500 text-[10px]" />
                    {rec.clock_in?.slice(0, 5) || "—"}
                  </div>
                  <div className="flex items-center justify-center gap-1 text-[10px] font-semibold text-gray-600 tabular-nums">
                    <i className="ri-logout-box-line text-gray-400 text-[10px]" />
                    {rec.clock_out?.slice(0, 5) || "—"}
                  </div>
                  {rec.hours_worked ? (
                    <p className="text-[10px] font-bold text-gray-900 tabular-nums pt-0.5">{fmtHM(rec.hours_worked)}</p>
                  ) : (isLate || isEarly) ? (
                    <p className={`text-[9px] font-bold pt-0.5 ${isLate ? "text-amber-600" : "text-orange-500"}`}>
                      {isLate ? `+${rec.late_minutes}m` : `−${rec.early_leave_minutes}m`}
                    </p>
                  ) : null}
                </div>
              ) : (
                <p className="text-[10px] text-gray-300 mt-1 pt-1.5 border-t border-gray-50">No record</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
