import { memo } from "react";
import type { Employee } from "../../types";

interface AssignStaffCardProps {
  emp: Employee;
  isChecked: boolean;
  hasConflict: boolean;
  isSlotDisabled: boolean;
  onToggle: () => void;
}

export const AssignStaffCard = memo(function AssignStaffCard({
  emp,
  isChecked,
  hasConflict,
  isSlotDisabled,
  onToggle,
}: AssignStaffCardProps) {
  return (
    <div
      onClick={onToggle}
      className={`p-3 rounded-2xl border transition-all select-none flex items-center justify-between gap-2.5 ${
        isSlotDisabled
          ? "opacity-40 cursor-not-allowed bg-slate-50 border-slate-200"
          : isChecked
            ? "bg-blue-50/80 border-[#253C7D] shadow-2xs ring-1 ring-[#253C7D] cursor-pointer"
            : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-2xs cursor-pointer"
      }`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <span className="w-9 h-9 rounded-xl bg-[#253C7D]/10 text-[#253C7D] font-bold text-xs flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
          {emp.avatar_url ? (
            <img src={emp.avatar_url} alt="" className="w-full h-full object-cover" />
          ) : (
            `${emp.first_name[0] || ""}${emp.last_name[0] || ""}`.toUpperCase()
          )}
        </span>
        <div className="min-w-0">
          <div className="flex items-center gap-1">
            <p className="text-xs font-bold text-slate-900 truncate">
              {emp.first_name} {emp.last_name}
            </p>
            {hasConflict && (
              <span title="Assigned on this day" className="px-1 py-0.2 bg-amber-100 text-amber-800 text-[8px] font-bold rounded shrink-0">
                Conflict
              </span>
            )}
          </div>
          <p className="text-[10px] text-slate-400 truncate">
            {emp.role || "Staff"} &middot; {emp.department}
          </p>
        </div>
      </div>

      <div className="shrink-0">
        {isChecked ? (
          <div className="w-6 h-6 rounded-full bg-[#253C7D] text-white flex items-center justify-center text-xs shadow-2xs">
            <i className="ri-check-line font-bold" />
          </div>
        ) : isSlotDisabled ? (
          <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 text-[9px] font-bold">
            <i className="ri-lock-line text-xs" />
          </div>
        ) : (
          <div className="w-6 h-6 rounded-full border border-slate-300 bg-white hover:border-[#253C7D] transition-colors" />
        )}
      </div>
    </div>
  );
});
