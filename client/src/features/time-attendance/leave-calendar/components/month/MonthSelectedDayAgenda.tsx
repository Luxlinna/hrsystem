import { memo } from "react";
import type { LeaveRequest } from "../../types";
import { LEAVE_TYPE_CONFIG, MONTHS } from "../../constants";
import { formatDateShort } from "../../dateUtils";

interface MonthSelectedDayAgendaProps {
  selectedDay: number | null;
  month: number;
  year: number;
  selectedDayLeaves: LeaveRequest[];
  onInspectLeave: (l: LeaveRequest) => void;
  onOpenQuickRequest: () => void;
}

export const MonthSelectedDayAgenda = memo(function MonthSelectedDayAgenda({
  selectedDay,
  month,
  year,
  selectedDayLeaves,
  onInspectLeave,
  onOpenQuickRequest,
}: MonthSelectedDayAgendaProps) {
  return (
    <div className="bg-white rounded-3xl border border-gray-200/80 p-5 sm:p-6 shadow-2xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
              Day Schedule
            </span>
            <h3 className="text-base font-extrabold text-gray-900 mt-0.5">
              {selectedDay ? `${MONTHS[month]} ${selectedDay}, ${year}` : "Select a Day"}
            </h3>
          </div>

          {selectedDayLeaves.length > 0 && (
            <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              {selectedDayLeaves.length} Away
            </span>
          )}
        </div>

        <div className="space-y-3">
          {selectedDayLeaves.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <i className="ri-calendar-check-line text-3xl block mb-2 text-gray-300" />
              <p className="text-xs font-medium">All employees active and in office.</p>
              <button
                onClick={onOpenQuickRequest}
                className="mt-3 text-xs font-bold text-[#253C7D] hover:underline cursor-pointer"
              >
                + Book Leave on this date
              </button>
            </div>
          ) : (
            selectedDayLeaves.map((l) => {
              const cfg = LEAVE_TYPE_CONFIG[l.leave_type] || LEAVE_TYPE_CONFIG.annual;
              return (
                <div
                  key={l.id}
                  onClick={() => onInspectLeave(l)}
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
                    {formatDateShort(l.start_date)} &rarr; {formatDateShort(l.end_date)} ({l.days} days)
                  </p>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
});
