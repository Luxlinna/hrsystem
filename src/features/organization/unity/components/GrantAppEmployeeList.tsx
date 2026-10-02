import { memo } from "react";
import type { Employee } from "../types";
import { initials } from "../unityUtils";

interface GrantAppEmployeeListProps {
  filteredEmployees: Employee[];
  selectedEmpIds: string[];
  toggleEmployee: (id: string) => void;
}

export const GrantAppEmployeeList = memo(function GrantAppEmployeeList({
  filteredEmployees,
  selectedEmpIds,
  toggleEmployee,
}: GrantAppEmployeeListProps) {
  return (
    <div className="flex-1 overflow-y-auto border border-gray-100 rounded-xl divide-y divide-gray-50 max-h-52 p-1 text-xs">
      {filteredEmployees.map((emp) => {
        const isSelected = selectedEmpIds.includes(emp.id);
        const empName = `${emp.first_name} ${emp.last_name}`;

        return (
          <div
            key={emp.id}
            onClick={() => toggleEmployee(emp.id)}
            className={`p-2 rounded-lg flex items-center justify-between gap-2 cursor-pointer transition-colors ${
              isSelected ? "bg-blue-50/50" : "hover:bg-gray-50"
            }`}
          >
            <div className="flex items-center gap-2">
              {emp.avatar_url ? (
                <img
                  src={emp.avatar_url}
                  alt={empName}
                  className="w-6 h-6 rounded-full object-cover ring-1 ring-gray-200"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-[#253C7D] text-white text-[8px] font-bold flex items-center justify-center">
                  {initials(emp.first_name, emp.last_name)}
                </div>
              )}
              <div>
                <p className="font-semibold text-gray-800 leading-tight">{empName}</p>
                <p className="text-[10px] text-gray-400">
                  {emp.department || "General"} &middot; {emp.role || "Staff"}
                </p>
              </div>
            </div>

            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => {}}
              className="w-4 h-4 rounded text-[#253C7D] focus:ring-[#253C7D] pointer-events-none"
            />
          </div>
        );
      })}
      {filteredEmployees.length === 0 && (
        <p className="text-center py-6 text-gray-400 italic">No available employees found.</p>
      )}
    </div>
  );
});
