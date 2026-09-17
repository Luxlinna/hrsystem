import { memo } from "react";
import type { Employee } from "../../types";

interface TimeLogEmployeeSectionProps {
  isEmployeeFixed: boolean;
  selectedEmployee: Employee | null;
  employeeId: string;
  isEmployeeDropdownOpen: boolean;
  setIsEmployeeDropdownOpen: React.Dispatch<React.SetStateAction<boolean>>;
  employeeDropdownRef: React.RefObject<HTMLDivElement | null>;
  employeeSearchQuery: string;
  setEmployeeSearchQuery: (query: string) => void;
  filteredEmployees: Employee[];
  handleSelectEmployee: (id: string) => void;
}

export const TimeLogEmployeeSection = memo(function TimeLogEmployeeSection({
  isEmployeeFixed,
  selectedEmployee,
  employeeId,
  isEmployeeDropdownOpen,
  setIsEmployeeDropdownOpen,
  employeeDropdownRef,
  employeeSearchQuery,
  setEmployeeSearchQuery,
  filteredEmployees,
  handleSelectEmployee,
}: TimeLogEmployeeSectionProps) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-gray-100 dark:border-slate-800 shadow-2xs">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100 dark:border-slate-800">
        <span className="w-6 h-6 rounded-lg bg-[#253C7D]/10 text-[#253C7D] dark:text-sky-400 flex items-center justify-center text-xs">
          <i className="ri-user-line font-bold" />
        </span>
        <h3 className="text-xs font-bold text-gray-900 dark:text-slate-100 uppercase tracking-wider">
          Employee Info
        </h3>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
        <label className="sm:w-36 text-xs font-bold text-gray-600 dark:text-slate-300 sm:text-right shrink-0">
          Employee <span className="text-rose-500">*</span>
        </label>

        <div className="w-full sm:max-w-md relative" ref={employeeDropdownRef}>
          {isEmployeeFixed && selectedEmployee ? (
            <div className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-gray-800 dark:text-slate-200">
              {selectedEmployee.first_name} {selectedEmployee.last_name}
              {selectedEmployee.department ? ` · ${selectedEmployee.department}` : ""}
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setIsEmployeeDropdownOpen((p) => !p)}
                className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-slate-800 hover:bg-white dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700 rounded-xl text-xs text-left font-medium text-gray-800 dark:text-slate-200 focus:outline-none focus:border-[#253C7D] flex items-center justify-between transition-all cursor-pointer shadow-2xs"
              >
                <span className={selectedEmployee ? "font-bold text-gray-900 dark:text-slate-100" : "text-gray-400"}>
                  {selectedEmployee
                    ? `${selectedEmployee.first_name} ${selectedEmployee.last_name} — ${selectedEmployee.role || selectedEmployee.department || "Staff"}`
                    : "Search or select employee..."}
                </span>
                <i className="ri-arrow-down-s-line text-gray-400 text-sm pointer-events-none" />
              </button>

              {isEmployeeDropdownOpen && (
                <div className="absolute left-0 top-full mt-1.5 w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl shadow-xl z-50 max-h-64 overflow-y-auto">
                  <div className="p-2.5 border-b border-gray-100 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900 z-10">
                    <input
                      type="text"
                      placeholder="Type name, department, role..."
                      value={employeeSearchQuery}
                      onChange={(e) => setEmployeeSearchQuery(e.target.value)}
                      autoFocus
                      className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg focus:bg-white focus:outline-none focus:border-[#253C7D]"
                    />
                  </div>
                  <div className="divide-y divide-gray-50 dark:divide-slate-800 p-1">
                    {filteredEmployees.length === 0 ? (
                      <div className="px-3 py-3 text-xs text-gray-400 text-center">No matching employees</div>
                    ) : (
                      filteredEmployees.map((emp) => (
                        <button
                          key={emp.id}
                          type="button"
                          onClick={() => handleSelectEmployee(emp.id)}
                          className={`w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-xl flex items-center justify-between text-xs transition-colors cursor-pointer ${
                            emp.id === employeeId ? "bg-indigo-50/60 dark:bg-indigo-950/40 text-[#253C7D] dark:text-sky-300 font-bold" : "text-gray-700 dark:text-slate-200"
                          }`}
                        >
                          <div>
                            <p className="font-bold">{emp.first_name} {emp.last_name}</p>
                            <p className="text-[11px] text-gray-400">{emp.role || emp.department || "Staff"}</p>
                          </div>
                          {emp.id === employeeId && <i className="ri-check-line text-[#253C7D] text-sm" />}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
});
