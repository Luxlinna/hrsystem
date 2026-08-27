import { memo } from "react";
import { Link } from "react-router-dom";
import type { EmployeeSummaryItem } from "../types";
import { initials } from "../constants";

interface ScorecardTabProps {
  filteredSummary: EmployeeSummaryItem[];
}

export const ScorecardTab = memo(function ScorecardTab({
  filteredSummary,
}: ScorecardTabProps) {
  return (
    <div className="bg-white rounded-3xl border border-gray-200/80 shadow-2xs overflow-hidden">
      <div className="p-5 border-b border-gray-100 flex items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <i className="ri-pie-chart-line text-[#253C7D]" />
            Employee Attendance Performance & Ratings
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Aggregate metrics, on-time percentage, total logged hours, and tardiness records
          </p>
        </div>
        <span className="text-xs font-bold text-gray-500 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-200/60">
          {filteredSummary.length} Employees Analyzed
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/70 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              <th className="px-5 py-3.5">Employee</th>
              <th className="px-5 py-3.5">Department</th>
              <th className="px-5 py-3.5 text-center">Days Logged</th>
              <th className="px-5 py-3.5 text-center">Present</th>
              <th className="px-5 py-3.5 text-center">Late</th>
              <th className="px-5 py-3.5 text-center">Absent</th>
              <th className="px-5 py-3.5 text-center">Total Hours</th>
              <th className="px-5 py-3.5">Total Lost Late Time</th>
              <th className="px-5 py-3.5">Attendance Score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredSummary.map((emp) => {
              const rate = emp.attendanceRate;

              return (
                <tr key={emp.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#253C7D] to-[#17254E] text-white flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden shadow-xs">
                        {emp.avatar_url ? (
                          <img src={emp.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span>{initials(emp.first_name, emp.last_name)}</span>
                        )}
                      </div>
                      <div>
                        <Link
                          to={`/employees/${emp.id}`}
                          className="font-bold text-gray-900 hover:text-[#253C7D] transition-colors"
                        >
                          {emp.first_name} {emp.last_name}
                        </Link>
                        <p className="text-[11px] text-gray-400">{emp.role}</p>
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <span className="font-semibold text-gray-700 bg-slate-100 px-2.5 py-0.5 rounded-full text-[11px]">
                      {emp.department}
                    </span>
                  </td>

                  <td className="px-5 py-3.5 text-center font-bold text-gray-900">{emp.totalDays}</td>

                  <td className="px-5 py-3.5 text-center">
                    <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                      {emp.present}
                    </span>
                  </td>

                  <td className="px-5 py-3.5 text-center">
                    <span
                      className={`font-bold px-2 py-0.5 rounded-md ${
                        emp.late > 0 ? "text-amber-700 bg-amber-50" : "text-gray-400"
                      }`}
                    >
                      {emp.late}
                    </span>
                  </td>

                  <td className="px-5 py-3.5 text-center">
                    <span
                      className={`font-bold px-2 py-0.5 rounded-md ${
                        emp.absent > 0 ? "text-rose-700 bg-rose-50" : "text-gray-400"
                      }`}
                    >
                      {emp.absent}
                    </span>
                  </td>

                  <td className="px-5 py-3.5 text-center font-bold text-[#253C7D]">{emp.totalHours}h</td>

                  <td className="px-5 py-3.5 whitespace-nowrap text-gray-600">
                    {emp.totalLateMinutes > 0 ? (
                      <span className="text-amber-600 font-semibold">
                        {Math.floor(emp.totalLateMinutes / 60)}h {emp.totalLateMinutes % 60}m
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>

                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all rounded-full ${
                            rate >= 90 ? "bg-emerald-500" : rate >= 75 ? "bg-amber-500" : "bg-rose-500"
                          }`}
                          style={{ width: `${rate}%` }}
                        />
                      </div>
                      <span className="font-bold text-gray-800 text-xs">{rate}%</span>
                    </div>
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
