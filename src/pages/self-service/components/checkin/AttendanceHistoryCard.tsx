import React from "react";
import type { WorkScheduleSettings } from "@/lib/workSchedule";

interface AttendanceRecord {
  id: string;
  employee_id: string;
  date: string;
  clock_in: string | null;
  clock_out: string | null;
  status: string;
  late_minutes: number;
  early_leave_minutes: number;
  hours_worked: number | null;
  notes: string | null;
  created_at: string;
}

interface AttendanceHistoryCardProps {
  records: AttendanceRecord[];
  today: string;
  totalHours: number;
  scheduleSettings: WorkScheduleSettings;
  getStatusColor: (status: string) => string;
}

export function AttendanceHistoryCard({
  records,
  today,
  totalHours,
  scheduleSettings,
  getStatusColor,
}: AttendanceHistoryCardProps) {
  return (
    <div className="bg-white border border-slate-200/80 rounded-xl shadow-2xs overflow-hidden">
      <div className="flex items-center justify-between px-3.5 py-2 border-b border-slate-100 bg-slate-50/60">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Attendance History</p>
        <p className="text-[10px] text-slate-400 font-mono">
          {totalHours.toFixed(1)}h · {records.length} days
        </p>
      </div>

      {records.length === 0 ? (
        <div className="text-center py-8 text-slate-400">
          <i className="ri-fingerprint-line text-2xl mb-1.5 block text-slate-300" />
          <p className="text-xs font-medium text-slate-600">No attendance records yet</p>
        </div>
      ) : (
        <>
          {/* Mobile: compact stacked cards */}
          <div className="sm:hidden max-h-[380px] overflow-y-auto p-2 space-y-1.5">
            {records.map((r) => {
              const isOutside = r.notes?.toLowerCase().includes("outside work");
              const isOntime = (r.status === "ontime" || r.status === "present") && !isOutside && (r.late_minutes || 0) === 0 && (r.early_leave_minutes || 0) === 0;
              return (
                <div key={r.id} className="bg-white border border-slate-200/70 rounded-lg p-2.5 shadow-2xs">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-slate-900">
                      {new Date(r.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                    </span>
                    {!isOntime && (
                      <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded text-[9.5px] font-semibold capitalize ${
                        isOutside ? "bg-teal-50 text-teal-700 border border-teal-200" : getStatusColor(r.status)
                      }`}>
                        {isOutside ? "Outside Work" : r.status}
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 text-[11.5px] text-center bg-slate-50/50 rounded p-1.5 border border-slate-100">
                    <div>
                      <p className="text-slate-400 text-[9px] uppercase font-bold">In</p>
                      <p className="text-slate-800 font-semibold tabular-nums mt-0.5">{r.clock_in?.slice(0, 5) || "—"}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-[9px] uppercase font-bold">Out</p>
                      <p className="text-slate-800 font-semibold tabular-nums mt-0.5">
                        {r.clock_out?.slice(0, 5) || "—"}
                        {r.clock_out && r.early_leave_minutes > 0 && (
                          <span className="block text-amber-600 text-[9px] font-medium">{r.early_leave_minutes}m early</span>
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-[9px] uppercase font-bold">Hours</p>
                      <p className="text-slate-800 font-semibold tabular-nums mt-0.5">{r.hours_worked ? `${r.hours_worked}h` : "—"}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop/tablet: table */}
          <div className="hidden sm:block overflow-x-auto max-h-[440px] overflow-y-auto">
            <div className="min-w-[560px]">
              <div className="grid grid-cols-[1.4fr_1fr_1.3fr_1fr_0.9fr] bg-gray-50/90 backdrop-blur px-4 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider sticky top-0 z-10 border-b border-gray-100">
                <span>Date</span>
                <span>Check In</span>
                <span>Check Out</span>
                <span>Hours</span>
                <span className="text-right">Status</span>
              </div>
              {records.map((r) => {
                const isLate = r.status === "late" || (r.late_minutes || 0) > 0;
                const isEarly = !!r.clock_out && (r.early_leave_minutes || 0) > 0;
                const isOutside = r.notes?.toLowerCase().includes("outside work");
                const isOntime = (r.status === "ontime" || r.status === "present") && !isOutside && !isLate && !isEarly;
                const dt = new Date(r.date);
                return (
                  <div
                    key={r.id}
                    className={`grid grid-cols-[1.4fr_1fr_1.3fr_1fr_0.9fr] items-center px-4 py-2.5 border-b border-gray-50 last:border-0 text-[12px] hover:bg-slate-50/80 transition-colors ${
                      r.date === today ? "bg-[#253C7D]/[0.03]" : ""
                    }`}
                  >
                    <span className="text-gray-800 font-semibold">
                      {dt.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      <span className="text-gray-400 font-medium ml-1.5">
                        {dt.toLocaleDateString("en-US", { weekday: "short" })}
                      </span>
                      {r.date === today && (
                        <span className="ml-1.5 text-[9px] font-bold text-[#253C7D] bg-[#253C7D]/10 px-1.5 py-0.5 rounded">TODAY</span>
                      )}
                    </span>
                    <span className="text-gray-600 tabular-nums">
                      {r.clock_in?.slice(0, 5) || "—"}
                      {isLate && (
                        <span className="text-amber-600 text-[10px] font-semibold ml-1">+{r.late_minutes}m</span>
                      )}
                    </span>
                    <span className="text-gray-600 tabular-nums">
                      {r.clock_out?.slice(0, 5) || (r.clock_in ? <span className="text-emerald-600 font-semibold">Active</span> : "—")}
                      {isEarly && (
                        <span className="text-orange-500 text-[10px] font-semibold ml-1">−{r.early_leave_minutes}m</span>
                      )}
                    </span>
                    <span className="text-gray-800 font-bold tabular-nums">{r.hours_worked ? `${r.hours_worked}h` : "—"}</span>
                    <span className="flex justify-end">
                      {!isOntime ? (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                          isOutside ? "bg-teal-50 text-teal-700 border border-teal-200" : getStatusColor(r.status)
                        }`}>
                          {isOutside ? "Outside Working" : r.status}
                        </span>
                      ) : (
                        <span className="text-slate-300 font-mono text-xs">—</span>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
