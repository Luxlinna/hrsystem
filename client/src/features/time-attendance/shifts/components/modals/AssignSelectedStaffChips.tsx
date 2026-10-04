import { memo } from "react";
import type { Employee } from "../../types";

interface AssignSelectedStaffChipsProps {
  assignEmployeeIds: string[];
  remainingSpots: number;
  employees: Employee[];
  onClearAll: () => void;
  onRemoveId: (id: string) => void;
}

export const AssignSelectedStaffChips = memo(function AssignSelectedStaffChips({
  assignEmployeeIds,
  remainingSpots,
  employees,
  onClearAll,
  onRemoveId,
}: AssignSelectedStaffChipsProps) {
  if (assignEmployeeIds.length === 0) return null;

  return (
    <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2">
      <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
        <span>Selected for Assignment ({assignEmployeeIds.length}/{remainingSpots}):</span>
        <button
          type="button"
          onClick={onClearAll}
          className="text-[10px] text-slate-400 hover:text-rose-600 cursor-pointer font-semibold"
        >
          Clear All
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        {assignEmployeeIds.map((id) => {
          const emp = employees.find((e) => e.id === id);
          if (!emp) return null;
          return (
            <span
              key={id}
              className="inline-flex items-center gap-1.5 pl-1.5 pr-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 shadow-2xs"
            >
              <span className="w-4.5 h-4.5 rounded-md bg-[#253C7D]/10 text-[#253C7D] text-[9px] font-bold flex items-center justify-center">
                {emp.first_name[0]}{emp.last_name[0]}
              </span>
              <span>{emp.first_name} {emp.last_name}</span>
              <button
                type="button"
                onClick={() => onRemoveId(id)}
                className="w-4 h-4 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-600 flex items-center justify-center cursor-pointer ml-0.5"
              >
                <i className="ri-close-line text-xs" />
              </button>
            </span>
          );
        })}
      </div>
    </div>
  );
});
