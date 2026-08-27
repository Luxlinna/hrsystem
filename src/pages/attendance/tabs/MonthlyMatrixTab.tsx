import { memo } from "react";
import type { AttendanceRecord, EmployeeSummaryItem, MatrixDay } from "../types";
import { STATUS_CONFIG, formatTime, calcHoursNum } from "../constants";

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
                  className={`px-1.5 py-2 text-center min-w-[28px] ${
                    d.isWeekend ? "bg-slate-100 text-slate-400 font-semibold" : "text-gray-700"
                  }`}
                >
                  <span className="block text-[9px] text-gray-400">{d.dayName}</span>
                  <span className="font-bold">{d.dayNum}</span>
                </th>
              ))}
              <th className="px-3 py-3 text-center min-w-[60px]">Present</th>
              <th className="px-3 py-3 text-center min-w-[60px]">Hours</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredSummary.map((emp) => {
              const empMonthRecords = records.filter(
                (r) => r.employee_id === emp.id && r.date.startsWith(matrixMonth)
              );
              const monthPresent = empMonthRecords.filter(
                (r) => r.status === "present" || r.status === "remote" || r.status === "late"
              ).length;
              const monthHours = empMonthRecords
                .reduce((acc, r) => acc + calcHoursNum(r.clock_in, r.clock_out), 0)
                .toFixed(1);

              return (
                <tr key={emp.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-4 py-2.5 sticky left-0 bg-white z-10 shadow-xs whitespace-nowrap">
                    <p className="font-bold text-gray-900 text-xs">
                      {emp.first_name} {emp.last_name}
                    </p>
                    <p className="text-[10px] text-gray-400">{emp.department}</p>
                  </td>

                  {matrixDays.map((d) => {
                    const rec = empMonthRecords.find((r) => r.date === d.dateStr);
                    const cfg = rec ? STATUS_CONFIG[rec.status] : null;

                    return (
                      <td
                        key={d.dateStr}
                        className={`p-1 text-center ${d.isWeekend ? "bg-slate-50/60" : ""}`}
                      >
                        {rec ? (
                          <button
                            onClick={() => onSelectRecord(rec)}
                            title={`${emp.first_name} ${emp.last_name} · ${d.dateStr}: ${cfg?.label} (${formatTime(
                              rec.clock_in
                            )} - ${formatTime(rec.clock_out)})`}
                            className={`w-6 h-6 rounded-md text-[9px] font-black uppercase flex items-center justify-center mx-auto transition-transform hover:scale-115 cursor-pointer ${
                              cfg ? `${cfg.bg} ${cfg.text} border ${cfg.border}` : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {cfg?.short || "•"}
                          </button>
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
    </div>
  );
});
