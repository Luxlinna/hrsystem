import { memo } from "react";
import type { AttendanceRecord, EmployeeSummaryItem, MatrixDay } from "../types";
import { STATUS_CONFIG, formatTime, calcHoursNum } from "../constants";
import { formatBiometricId } from "@/lib/biometricUtils";

interface MonthlyMatrixTabProps {
  matrixMonth: string;
  setMatrixMonth: (month: string) => void;
  matrixDays: MatrixDay[];
  filteredSummary: EmployeeSummaryItem[];
  records: AttendanceRecord[];
  onSelectRecord: (record: AttendanceRecord) => void;
}

export const MonthlyMatrixTab = memo(function MonthlyMatrixTab({
  matrixMonth,
  setMatrixMonth,
  matrixDays,
  filteredSummary,
  records,
  onSelectRecord,
}: MonthlyMatrixTabProps) {
  return (
    <div className="bg-white rounded-3xl border border-gray-200/80 shadow-2xs overflow-hidden">
      <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <i className="ri-grid-fill text-[#253C7D]" />
            Monthly Attendance Timesheet Matrix
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Full month view across all days for each employee
          </p>
        </div>

        {/* Month Picker */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-gray-500">Select Month:</label>
          <input
            type="month"
            value={matrixMonth}
            onChange={(e) => setMatrixMonth(e.target.value)}
            className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D] cursor-pointer"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/70 text-[10px] font-bold text-gray-500 uppercase">
              <th className="px-4 py-3 sticky left-0 bg-gray-50 z-10 min-w-[180px] shadow-xs">
                Employee
              </th>
              {matrixDays.map((d) => (
                <th
                  key={d.dateStr}
                  title={
                    d.isHoliday
                      ? `🎉 Public Holiday: ${d.holidayName || "Holiday"}${
                          d.holidayLocalName ? ` (${d.holidayLocalName})` : ""
                        } - Cambodia Labor Law Paid Holiday`
                      : undefined
                  }
                  className={`px-1.5 py-2 text-center min-w-[28px] ${
                    d.isHoliday
                      ? "bg-purple-100/80 text-purple-900 dark:bg-purple-950/80 dark:text-purple-200 border-b-2 border-purple-500 font-bold"
                      : d.isWeekend
                      ? "bg-slate-100 text-slate-400 font-semibold"
                      : "text-gray-700"
                  }`}
                >
                  <span
                    className={`block text-[9px] ${
                      d.isHoliday
                        ? "text-purple-700 dark:text-purple-300 font-extrabold"
                        : "text-gray-400"
                    }`}
                  >
                    {d.isHoliday ? "🎉" : d.dayName}
                  </span>
                  <span className="font-bold">{d.dayNum}</span>
                </th>
              ))}
              <th className="px-3 py-3 text-center min-w-[60px]">Days Logged</th>
              <th className="px-3 py-3 text-center min-w-[60px]">Hours</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredSummary.map((emp) => {
              const empMonthRecords = records.filter(
                (r) => r.employee_id === emp.id && r.date.startsWith(matrixMonth)
              );
              const monthPresent = empMonthRecords.filter(
                (r) => r.status === "ontime" || r.status === "present" || r.status === "remote" || r.status === "late"
              ).length;
              const monthHours = empMonthRecords
                .reduce((acc, r) => acc + calcHoursNum(r.clock_in, r.clock_out), 0)
                .toFixed(1);

              return (
                <tr key={emp.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-4 py-2.5 sticky left-0 bg-white z-10 shadow-xs whitespace-nowrap">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="font-bold text-gray-900 text-xs">
                        {emp.first_name} {emp.last_name}
                      </p>
                      {emp.biometric_user_id && (
                        <span
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold bg-[#253C7D]/10 text-[#253C7D] dark:bg-sky-950 dark:text-sky-300 border border-[#253C7D]/20 shrink-0"
                          title={`BU Biometric ID: ${emp.biometric_user_id}`}
                        >
                          <i className="ri-fingerprint-line text-[10px]" />
                          {formatBiometricId(emp.biometric_user_id, emp.branches?.name)}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-gray-400 mt-0.5">{emp.department}</p>
                  </td>

                  {matrixDays.map((d) => {
                    const rec = empMonthRecords.find((r) => r.date === d.dateStr);
                    const cfg = rec ? STATUS_CONFIG[rec.status] : null;

                    return (
                      <td
                        key={d.dateStr}
                        className={`p-1 text-center ${
                          d.isHoliday
                            ? "bg-purple-50/40 dark:bg-purple-950/20"
                            : d.isWeekend
                            ? "bg-slate-50/60"
                            : ""
                        }`}
                      >
                        {rec ? (
                          <button
                            onClick={() => onSelectRecord(rec)}
                            title={`${emp.first_name} ${emp.last_name} · ${d.dateStr}: ${
                              d.isHoliday ? `Holiday Work (${d.holidayName}) · 2.0x OT · ` : ""
                            }${cfg?.label} (${formatTime(rec.clock_in)} - ${formatTime(rec.clock_out)})`}
                            className={`w-6 h-6 rounded-md text-[9px] font-black uppercase flex items-center justify-center mx-auto transition-transform hover:scale-115 cursor-pointer ${
                              d.isHoliday
                                ? "bg-purple-600 text-white shadow-xs ring-1 ring-purple-400"
                                : cfg
                                ? `${cfg.bg} ${cfg.text} border ${cfg.border}`
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {d.isHoliday && rec.clock_in ? "2.0x" : cfg?.short || "•"}
                          </button>
                        ) : d.isHoliday ? (
                          <span
                            title={`🎉 Paid Public Holiday: ${d.holidayName || "Holiday"}${
                              d.holidayLocalName ? ` (${d.holidayLocalName})` : ""
                            } · Cambodia Labor Law Paid Off`}
                            className="w-6 h-6 rounded-md text-[8px] font-black uppercase flex items-center justify-center mx-auto bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200/80 dark:border-purple-800/60 shadow-2xs select-none"
                          >
                            HOL
                          </span>
                        ) : (
                          <span className="text-gray-200 text-[10px]">—</span>
                        )}
                      </td>
                    );
                  })}

                  <td className="px-3 py-2.5 text-center font-bold text-emerald-700 bg-emerald-50/50">
                    {monthPresent}
                  </td>
                  <td className="px-3 py-2.5 text-center font-bold text-[#253C7D] bg-blue-50/50">
                    {monthHours}h
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Legend & Cambodia Labor Law Article 139 note */}
      <div className="p-4 border-t border-gray-100 dark:border-slate-800 bg-gray-50/60 dark:bg-slate-900/60 flex flex-wrap items-center justify-between gap-3 text-[11px] text-gray-500 dark:text-slate-400">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-bold text-gray-700 dark:text-slate-300">Legend:</span>
          <span className="inline-flex items-center gap-1">
            <span className="w-5 h-5 rounded bg-emerald-50 text-emerald-700 font-extrabold text-[9px] flex items-center justify-center border border-emerald-200">OT</span>
            <span>On Time / Present</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-5 h-5 rounded bg-amber-50 text-amber-700 font-extrabold text-[9px] flex items-center justify-center border border-amber-200">L</span>
            <span>Late Arrival</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-5 h-5 rounded bg-sky-50 text-sky-700 font-extrabold text-[9px] flex items-center justify-center border border-sky-200">R</span>
            <span>Remote</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-5 h-5 rounded bg-purple-50 text-purple-700 font-extrabold text-[9px] flex items-center justify-center border border-purple-200">HOL</span>
            <span>Paid Holiday (100%)</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-5 h-5 rounded bg-purple-600 text-white font-extrabold text-[8px] flex items-center justify-center">2.0x</span>
            <span>Holiday Work (200% OT Rate)</span>
          </span>
        </div>

        <span className="text-[10px] text-purple-700 dark:text-purple-300 font-semibold flex items-center gap-1">
          <i className="ri-scales-3-line" />
          Cambodia Labor Law Art. 139 & 161
        </span>
      </div>
    </div>
  );
});
