import { memo } from "react";
import type { Employee } from "../../types";
import { initials } from "../../trainingUtils";

interface EnrollLearnerListProps {
  filteredEmployees: Employee[];
  enrollEmployeeIds: string[];
  alreadyEnrolledIds?: Set<string>;
  toggleEmployee: (id: string) => void;
  selectAll: () => void;
  clearAll: () => void;
}

export const EnrollLearnerList = memo(function EnrollLearnerList({
  filteredEmployees,
  enrollEmployeeIds,
  alreadyEnrolledIds = new Set(),
  toggleEmployee,
  selectAll,
  clearAll,
}: EnrollLearnerListProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
        <span>Available: {filteredEmployees.length} staff</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={selectAll}
            className="text-[#253C7D] font-bold hover:underline cursor-pointer"
          >
            Select All Available
          </button>
          <span>&middot;</span>
          <button
            type="button"
            onClick={clearAll}
            className="text-gray-400 hover:text-gray-600 font-semibold cursor-pointer"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1 border border-gray-200/80 rounded-2xl p-2 bg-gray-50/50">
        {filteredEmployees.length === 0 ? (
          <p className="text-center py-6 text-gray-400 italic text-xs">
            No employees found for this branch.
          </p>
        ) : (
          filteredEmployees.map((emp) => {
            const isAlreadyEnrolled = alreadyEnrolledIds.has(emp.id);
            const isSelected = enrollEmployeeIds.includes(emp.id);
            const name = `${emp.first_name} ${emp.last_name}`;

            return (
              <div
                key={emp.id}
                onClick={() => !isAlreadyEnrolled && toggleEmployee(emp.id)}
                className={`flex items-center justify-between p-2.5 rounded-xl transition-all text-xs ${
                  isAlreadyEnrolled
                    ? "bg-gray-100/70 text-gray-400 cursor-not-allowed border border-dashed border-gray-200"
                    : isSelected
                    ? "bg-blue-50 text-[#253C7D] font-bold border border-blue-200 shadow-2xs cursor-pointer"
                    : "hover:bg-white text-gray-700 bg-white/60 border border-gray-100 cursor-pointer"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <input
                    type="checkbox"
                    disabled={isAlreadyEnrolled}
                    checked={isSelected || isAlreadyEnrolled}
                    onChange={() => {}}
                    className="w-4 h-4 rounded text-[#253C7D] focus:ring-0 cursor-pointer disabled:opacity-50 pointer-events-none"
                  />
                  {emp.avatar_url ? (
                    <img src={emp.avatar_url} alt={name} className="w-6 h-6 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-[#253C7D]/15 text-[#253C7D] text-[10px] font-extrabold flex items-center justify-center shrink-0">
                      {initials(name)}
                    </div>
                  )}
                  <div className="truncate">
                    <span className="font-semibold text-gray-900">{name}</span>
                    <span className="text-[11px] text-gray-400 ml-1.5 font-normal">
                      ({emp.department || "Staff"})
                    </span>
                  </div>
                </div>

                {isAlreadyEnrolled ? (
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md font-bold text-[10px] flex items-center gap-1 shrink-0">
                    <i className="ri-checkbox-circle-fill text-xs" /> Enrolled
                  </span>
                ) : isSelected ? (
                  <i className="ri-check-line text-[#253C7D] font-bold text-base shrink-0" />
                ) : null}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
});
