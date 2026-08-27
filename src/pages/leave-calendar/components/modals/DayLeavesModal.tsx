import { memo } from "react";
import type { LeaveRequest } from "../../types";
import { LEAVE_TYPE_CONFIG, MONTHS } from "../../constants";
import { formatDateShort } from "../../dateUtils";

interface DayLeavesModalProps {
  dayLeavesModal: { day: number; leaves: LeaveRequest[] } | null;
  onClose: () => void;
  month: number;
  year: number;
  onInspectLeave: (l: LeaveRequest) => void;
}

export const DayLeavesModal = memo(function DayLeavesModal({
  dayLeavesModal,
  onClose,
  month,
  year,
  onInspectLeave,
}: DayLeavesModalProps) {
  if (!dayLeavesModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-150 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
              {MONTHS[month]} {dayLeavesModal.day}, {year}
            </span>
            <h3 className="text-base font-extrabold text-gray-900 mt-0.5">
              All Absences on this Day ({dayLeavesModal.leaves.length})
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 cursor-pointer"
          >
            <i className="ri-close-line text-lg" />
          </button>
        </div>

        <div className="space-y-2.5">
          {dayLeavesModal.leaves.map((l) => {
            const cfg = LEAVE_TYPE_CONFIG[l.leave_type] || LEAVE_TYPE_CONFIG.annual;

            return (
              <div
                key={l.id}
                onClick={() => {
                  onClose();
                  onInspectLeave(l);
                }}
                className="p-3.5 bg-gray-50/70 hover:bg-gray-100/80 rounded-2xl border border-gray-100 flex items-center justify-between gap-3 transition-colors cursor-pointer"
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
          })}
        </div>

        <div className="pt-5 mt-4 border-t border-gray-100 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
});
