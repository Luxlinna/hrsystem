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
    <div className="bg-white border border-gray-200/80 rounded-2xl shadow-2xs overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 bg-gray-50/60">
        <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Attendance History</p>
        <p className="text-[11px] text-gray-400">
          {totalHours.toFixed(1)}h across {records.length} day{records.length === 1 ? "" : "s"}
        </p>
      </div>

      {records.length === 0 ? (
        <div className="text-center py-10 text-gray-400">
          <i className="ri-fingerprint-line text-3xl mb-2 block text-gray-300" />
          <p className="text-[13px] font-semibold text-gray-600">No attendance records yet</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Your check-ins for the last 30 days will appear here.</p>
        </div>
      ) : (
        <>
          {/* Mobile: stacked cards */}
          <div className="sm:hidden max-h-[420px] overflow-y-auto p-2 space-y-2">
            {records.map((r) => (
              <div key={r.id} className="bg-white border border-gray-100 rounded-xl p-3.5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[13px] font-semibold text-gray-800">
                    {new Date(r.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                  </span>
                  <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${getStatusColor(r.status)}`}>
                    {r.status}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-[12px]">
                  <div>
                    <p className="text-gray-400 text-[10px] uppercase tracking-wide">Check In</p>
                    <p className="text-gray-700 font-medium">{r.clock_in?.slice(0, 5) || "—"}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-[10px] uppercase tracking-wide">Check Out</p>
                    <p className="text-gray-700 font-medium">
                      {r.clock_out?.slice(0, 5) || "—"}
                      {r.clock_out && r.early_leave_minutes > scheduleSettings.earlyLeaveGraceMinutes && (
                        <span className="block text-orange-500 text-[10px] font-semibold">{r.early_leave_minutes}m early</span>
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-[10px] uppercase tracking-wide">Hours</p>
                    <p className="text-gray-700 font-medium">{r.hours_worked ? `${r.hours_worked}h` : "—"}</p>
                  </div>
                </div>
              </div>
            ))}
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
                const isLate = (r.late_minutes || 0) > scheduleSettings.lateGraceMinutes;
                const isEarly = !!r.clock_out && (r.early_leave_minutes || 0) > scheduleSettings.earlyLeaveGraceMinutes;
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
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${getStatusColor(r.status)}`}>
                        {r.status}
                      </span>
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
