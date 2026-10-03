import { memo } from "react";
import type { Employee, LeaveRequest } from "../../types";
import { LEAVE_TYPE_CONFIG, MONTHS } from "../../constants";

interface TimelineViewContentProps {
  employees: Employee[];
  filteredLeaves: LeaveRequest[];
  year: number;
  month: number;
  daysInMonth: number;
  onInspectLeave: (l: LeaveRequest) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onJumpToToday: () => void;
}

export const TimelineViewContent = memo(function TimelineViewContent({
  employees,
  filteredLeaves,
  year,
  month,
  daysInMonth,
  onInspectLeave,
  onPrevMonth,
  onNextMonth,
  onJumpToToday,
}: TimelineViewContentProps) {
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <div className="bg-white rounded-3xl border border-gray-200/80 p-5 sm:p-6 shadow-2xs space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-black text-gray-900">
            Team Availability Timeline &middot; {MONTHS[month]} {year}
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">Horizontal Gantt schedule across all active employees</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onJumpToToday}
            className="px-2.5 py-1 text-xs font-bold text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
          >
            Today
          </button>
          <button
            onClick={onPrevMonth}
            className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 cursor-pointer"
          >
            <i className="ri-arrow-left-s-line" />
          </button>
          <button
            onClick={onNextMonth}
            className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 cursor-pointer"
          >
            <i className="ri-arrow-right-s-line" />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto border border-gray-100 rounded-2xl">
        <table className="w-full text-xs border-collapse min-w-[900px]">
          <thead>
            <tr className="bg-gray-50/80 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              <th className="px-4 py-3 text-left w-48 sticky left-0 bg-gray-50/95 backdrop-blur z-10">
                Staff Member
              </th>
              {days.map((d) => (
                <th key={d} className="py-3 text-center w-7">
                  {d}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {employees.map((emp) => {
              const empLeaves = filteredLeaves.filter((l) => l.employee_id === emp.id);

              return (
                <tr key={emp.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-4 py-2.5 whitespace-nowrap sticky left-0 bg-white group-hover:bg-slate-50/60 z-10 border-r border-gray-100">
                    <p className="font-extrabold text-gray-900 text-xs truncate">
                      {emp.first_name} {emp.last_name}
                    </p>
                    <p className="text-[10px] text-gray-400 font-medium truncate">
                      {emp.department}
                    </p>
                  </td>

                  {days.map((d) => {
                    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
                    const leaveOnDay = empLeaves.find(
                      (l) => dateStr >= l.start_date && dateStr <= l.end_date
                    );

                    if (leaveOnDay) {
                      const cfg = LEAVE_TYPE_CONFIG[leaveOnDay.leave_type] || LEAVE_TYPE_CONFIG.annual;
                      return (
                        <td
                          key={d}
                          onClick={() => onInspectLeave(leaveOnDay)}
                          className="p-0.5 text-center cursor-pointer"
                          title={`${cfg.label} (${leaveOnDay.start_date} to ${leaveOnDay.end_date})`}
                        >
                          <div className={`h-6 rounded-md ${cfg.barBg} opacity-85 hover:opacity-100 transition-opacity`} />
                        </td>
                      );
                    }

                    return <td key={d} className="p-0.5 text-center" />;
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
});
