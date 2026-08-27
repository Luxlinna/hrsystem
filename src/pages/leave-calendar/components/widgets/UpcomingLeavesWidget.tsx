import { memo } from "react";
import type { LeaveRequest } from "../../types";
import { LEAVE_TYPE_CONFIG } from "../../constants";
import { formatDateShort } from "../../dateUtils";

interface UpcomingLeavesWidgetProps {
  upcomingLeaves: LeaveRequest[];
  onInspectLeave: (l: LeaveRequest) => void;
}

export const UpcomingLeavesWidget = memo(function UpcomingLeavesWidget({
  upcomingLeaves,
  onInspectLeave,
}: UpcomingLeavesWidgetProps) {
  return (
    <div className="bg-white rounded-3xl border border-gray-200/80 p-5 sm:p-6 shadow-2xs">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-extrabold text-gray-900">Upcoming Leave Schedule</h3>
          <p className="text-xs text-gray-400 mt-0.5">Approved absences in next 30 days</p>
        </div>
      </div>

      <div className="space-y-2.5">
        {upcomingLeaves.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-6">No scheduled leaves in the next 30 days</p>
        ) : (
          upcomingLeaves.map((l) => {
            const cfg = LEAVE_TYPE_CONFIG[l.leave_type] || LEAVE_TYPE_CONFIG.annual;
            return (
              <div
                key={l.id}
                onClick={() => onInspectLeave(l)}
                className="p-3 bg-gray-50/70 hover:bg-gray-100/80 rounded-2xl border border-gray-100 flex items-center justify-between gap-3 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-[#253C7D]/10 text-[#253C7D] font-bold text-xs flex items-center justify-center shrink-0">
                    {l.employees?.first_name?.[0]}
                    {l.employees?.last_name?.[0]}
                  </div>
                  <div className="min-w-0">
                    <p className="font-extrabold text-xs text-gray-900 truncate">
                      {l.employees?.first_name} {l.employees?.last_name}
                    </p>
                    <p className="text-[10px] text-gray-400 font-medium truncate">
                      {l.employees?.department}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${cfg.badgeBg} block mb-0.5`}>
                    {cfg.label}
                  </span>
                  <span className="text-[10px] text-gray-500 font-medium">
                    {formatDateShort(l.start_date)} &rarr; {formatDateShort(l.end_date)}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
});
