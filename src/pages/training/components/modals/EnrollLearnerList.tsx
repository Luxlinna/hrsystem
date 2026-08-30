import { memo } from "react";
import type { Employee } from "../../types";
import { initials } from "../../trainingUtils";

interface EnrollLearnerListProps {
  filteredEmployees: Employee[];
  enrollEmployeeIds: string[];
  toggleEmployee: (id: string) => void;
  selectAll: () => void;
  clearAll: () => void;
}

export const EnrollLearnerList = memo(function EnrollLearnerList({
  filteredEmployees,
  enrollEmployeeIds,
  toggleEmployee,
  selectAll,
  clearAll,
}: EnrollLearnerListProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-[11px] text-gray-500 mb-1">
        <span>Matching: {filteredEmployees.length} staff</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={selectAll}
            className="text-[#253C7D] font-semibold hover:underline cursor-pointer"
          >
            Select All
          </button>
          <span>&middot;</span>
          <button
            type="button"
            onClick={clearAll}
            className="text-gray-400 hover:text-gray-600 cursor-pointer"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="max-h-48 overflow-y-auto space-y-1 pr-1 border border-gray-100 rounded-xl p-1.5 bg-gray-50/50">
        {filteredEmployees.length === 0 ? (
          <p className="text-center py-4 text-gray-400 italic">No employees found.</p>
        ) : (
          filteredEmployees.map((emp) => {
            const isSelected = enrollEmployeeIds.includes(emp.id);
            const name = `${emp.first_name} ${emp.last_name}`;
            return (
              <label
                key={emp.id}
                onClick={() => toggleEmployee(emp.id)}
                className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                  isSelected ? "bg-[#253C7D]/10 text-[#253C7D] font-bold" : "hover:bg-gray-100 text-gray-700"
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => {}}
                    className="rounded text-[#253C7D] focus:ring-0 cursor-pointer"
                  />
                  {emp.avatar_url ? (
                    <img src={emp.avatar_url} alt={name} className="w-5 h-5 rounded-full object-cover" />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-[#253C7D] text-white text-[9px] font-bold flex items-center justify-center">
                      {initials(name)}
                    </div>
                  )}
                  <span className="text-xs">{name}</span>
                </div>
                <span className="text-[10px] text-gray-400">{emp.department || "General"}</span>
              </label>
            );
          })
        )}
      </div>
    </div>
  );
});
