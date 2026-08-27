import { memo } from "react";
import type { LeaveRequest } from "../../types";
import { LEAVE_TYPE_CONFIG } from "../../constants";
import { formatDateShort } from "../../dateUtils";

interface LeaveCalendarTabContentProps {
  calendarYear: number;
  calendarMonth: number;
  selectedCalendarDay: number | null;
  setSelectedCalendarDay: (d: number | null) => void;
  calDeptFilter: string;
  setCalDeptFilter: (dept: string) => void;
  departments: string[];
  calendarDays: { day: number; dateStr: string; leaves: LeaveRequest[] }[];
  firstDayOfWeek: number;
  prevMonth: () => void;
  nextMonth: () => void;
  todayMonth: () => void;
  selectedDayDateStr: string | null;
  selectedDayLeaves: LeaveRequest[];
  onInspectRequest: (req: LeaveRequest) => void;
}

export const LeaveCalendarTabContent = memo(function LeaveCalendarTabContent({
  calendarYear,
  calendarMonth,
  selectedCalendarDay,
  setSelectedCalendarDay,
  calDeptFilter,
  setCalDeptFilter,
  departments,
  calendarDays,
  firstDayOfWeek,
  prevMonth,
  nextMonth,
  todayMonth,
  selectedDayDateStr,
  selectedDayLeaves,
  onInspectRequest,
}: LeaveCalendarTabContentProps) {
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  const dayHeaders = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Calendar Matrix View (Left 2 cols) */}
      <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-200/80 p-5 sm:p-6 shadow-2xs">
        {/* Month Navigator Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-black text-gray-900">
              {monthNames[calendarMonth]} {calendarYear}
            </h3>
            <button
              onClick={todayMonth}
              className="px-2.5 py-1 text-xs font-bold text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
            >
              Today
            </button>
          </div>

          <div className="flex items-center gap-2">
            {departments.length > 0 && (
              <select
                value={calDeptFilter}
                onChange={(e) => setCalDeptFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 font-medium focus:outline-none focus:border-[#253C7D] cursor-pointer"
              >
                <option value="all">All Departments</option>
                {departments.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            )}

            <div className="flex items-center gap-1">
              <button
                onClick={prevMonth}
                className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors cursor-pointer"
              >
                <i className="ri-arrow-left-s-line text-base" />
              </button>
              <button
                onClick={nextMonth}
                className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors cursor-pointer"
              >
                <i className="ri-arrow-right-s-line text-base" />
              </button>
            </div>
          </div>
        </div>

        {/* 7-Day Matrix Header */}
        <div className="grid grid-cols-7 gap-1 text-center mb-2">
          {dayHeaders.map((d) => (
            <span key={d} className="text-[11px] font-bold text-gray-400 uppercase tracking-wider py-1">
              {d}
            </span>
          ))}
        </div>

        {/* Calendar Day Grid */}
        <div className="grid grid-cols-7 gap-1.5">
          {/* Empty prefix padding for firstDayOfWeek */}
          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} className="min-h-[72px] sm:min-h-[90px] rounded-2xl bg-gray-50/40 p-1.5" />
          ))}

          {/* Calendar Days */}
          {calendarDays.map(({ day, dateStr, leaves }) => {
            const isSelected = selectedCalendarDay === day;
            const hasLeaves = leaves.length > 0;

            return (
              <div
                key={dateStr}
                onClick={() => setSelectedCalendarDay(day)}
                className={`min-h-[72px] sm:min-h-[90px] rounded-2xl p-1.5 border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? "bg-[#253C7D]/5 border-[#253C7D] ring-2 ring-[#253C7D]/20 shadow-xs"
                    : hasLeaves
                    ? "bg-white border-gray-200/80 hover:border-gray-300"
                    : "bg-white border-gray-100 hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center ${
                      isSelected ? "bg-[#253C7D] text-white" : "text-gray-700"
                    }`}
                  >
                    {day}
                  </span>
                  {hasLeaves && (
                    <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800">
                      {leaves.length}
                    </span>
                  )}
                </div>

                <div className="space-y-1 mt-1">
                  {leaves.slice(0, 2).map((l) => {
                    const cfg = LEAVE_TYPE_CONFIG[l.leave_type] || LEAVE_TYPE_CONFIG.annual;
                    return (
                      <div
                        key={l.id}
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded truncate ${cfg.badgeBg}`}
                      >
                        {l.employees?.first_name} ({cfg.label.slice(0, 3)})
                      </div>
                    );
                  })}
                  {leaves.length > 2 && (
                    <span className="text-[9px] font-bold text-gray-400 block text-right">
                      +{leaves.length - 2} more
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Day Agenda View (Right 1 col) */}
      <div className="bg-white rounded-3xl border border-gray-200/80 p-5 sm:p-6 shadow-2xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                Daily Schedule
              </span>
              <h4 className="text-base font-extrabold text-gray-900 mt-0.5">
                {selectedCalendarDay
                  ? `${monthNames[calendarMonth]} ${selectedCalendarDay}, ${calendarYear}`
                  : "Select a Date"}
              </h4>
            </div>
            {selectedDayLeaves.length > 0 && (
              <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                {selectedDayLeaves.length} On Leave
              </span>
            )}
          </div>

          <div className="space-y-3">
            {selectedDayLeaves.length === 0 ? (
              <div className="text-center py-14 text-gray-400">
                <i className="ri-calendar-check-line text-3xl block mb-2 text-gray-300" />
                <p className="text-xs font-medium">No employees on leave on this date.</p>
              </div>
            ) : (
              selectedDayLeaves.map((l) => {
                const cfg = LEAVE_TYPE_CONFIG[l.leave_type] || LEAVE_TYPE_CONFIG.annual;
                return (
                  <div
                    key={l.id}
                    onClick={() => onInspectRequest(l)}
                    className="p-3.5 rounded-2xl border border-gray-100 bg-gray-50/70 hover:bg-gray-100 transition-colors cursor-pointer space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-extrabold text-xs text-gray-900">
                        {l.employees?.first_name} {l.employees?.last_name}
                      </p>
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${cfg.badgeBg}`}>
                        {cfg.label}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500">
                      {l.employees?.role} &middot; {l.employees?.department}
                    </p>
                    <p className="text-[10px] text-gray-400 font-medium">
                      Duration: {formatDateShort(l.start_date)} &rarr; {formatDateShort(l.end_date)} ({l.days} days)
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
});
