import { memo } from "react";
import type { LeaveRequest } from "../../types";
import { LEAVE_TYPE_CONFIG, DAYS } from "../../constants";

interface MonthCalendarGridProps {
  calCells: number[];
  selectedDay: number | null;
  onSelectDay: (d: number) => void;
  getDayLeaves: (d: number) => LeaveRequest[];
  isCurrentDayToday: (d: number) => boolean;
  onInspectLeave: (l: LeaveRequest) => void;
  onOpenDayLeavesModal: (day: number, leaves: LeaveRequest[]) => void;
}

export const MonthCalendarGrid = memo(function MonthCalendarGrid({
  calCells,
  selectedDay,
  onSelectDay,
  getDayLeaves,
  isCurrentDayToday,
  onInspectLeave,
  onOpenDayLeavesModal,
}: MonthCalendarGridProps) {
  return (
    <div>
      {/* 7-Day Weekday Header */}
      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {DAYS.map((d) => (
          <span key={d} className="text-[11px] font-bold text-gray-400 uppercase tracking-wider py-1">
            {d}
          </span>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1.5">
        {calCells.map((d, index) => {
          if (d === 0) {
            return (
              <div
                key={`empty-${index}`}
                className="min-h-[85px] sm:min-h-[110px] rounded-2xl bg-gray-50/40 p-2 border border-transparent"
              />
            );
          }

          const dayLeaves = getDayLeaves(d);
          const isToday = isCurrentDayToday(d);
          const isSelected = selectedDay === d;
          const hasLeaves = dayLeaves.length > 0;

          return (
            <div
              key={`day-${d}`}
              onClick={() => onSelectDay(d)}
              className={`min-h-[85px] sm:min-h-[110px] rounded-2xl p-2 border transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? "bg-[#253C7D]/5 border-[#253C7D] ring-2 ring-[#253C7D]/20 shadow-xs"
                  : hasLeaves
                  ? "bg-white border-gray-200/80 hover:border-gray-300 hover:shadow-2xs"
                  : "bg-white border-gray-100 hover:bg-gray-50/80"
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs font-black w-6 h-6 rounded-full flex items-center justify-center ${
                    isToday
                      ? "bg-[#253C7D] text-white shadow-xs"
                      : isSelected
                      ? "bg-gray-900 text-white"
                      : "text-gray-700"
                  }`}
                >
                  {d}
                </span>

                {hasLeaves && (
                  <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800">
                    {dayLeaves.length}
                  </span>
                )}
              </div>

              {/* Leave Chips */}
              <div className="space-y-1 mt-1">
                {dayLeaves.slice(0, 2).map((l) => {
                  const cfg = LEAVE_TYPE_CONFIG[l.leave_type] || LEAVE_TYPE_CONFIG.annual;
                  return (
                    <div
                      key={l.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onInspectLeave(l);
                      }}
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded-lg truncate flex items-center gap-1 ${cfg.badgeBg} hover:opacity-90 transition-opacity`}
                    >
                      <span className={`w-1 h-1 rounded-full ${cfg.barBg}`} />
                      <span className="truncate">{l.employees?.first_name}</span>
                    </div>
                  );
                })}

                {dayLeaves.length > 2 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenDayLeavesModal(d, dayLeaves);
                    }}
                    className="text-[9px] font-extrabold text-gray-500 hover:text-gray-900 block text-right w-full cursor-pointer"
                  >
                    +{dayLeaves.length - 2} more
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});
