import { memo } from "react";
import type { Employee } from "../../types";
import { formatBiometricId } from "@/lib/biometricUtils";

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
  employeeBranchName?: string | null;
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
  employeeBranchName,
}: TimeLogEmployeeSectionProps) {
  const buName = employeeBranchName || selectedEmployee?.branches?.name || "";

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-gray-100 dark:border-slate-800 shadow-2xs">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100 dark:border-slate-800">
        <span className="w-6 h-6 rounded-lg bg-[#253C7D]/10 text-[#253C7D] dark:text-sky-400 flex items-center justify-center text-xs">
          <i className="ri-user-line font-bold" />
        </span>
        <h3 className="text-xs font-bold text-gray-900 dark:text-slate-100 uppercase tracking-wider">
          Employee Info
        </h3>
      </div>

      <div>
        <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5">
          Employee <span className="text-rose-500">*</span>
        </label>

        <div className="w-full relative" ref={employeeDropdownRef}>
          {isEmployeeFixed && selectedEmployee ? (
            <div className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-gray-800 dark:text-slate-200 flex items-center justify-between shadow-2xs">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-full bg-[#253C7D] text-white flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden">
                  {selectedEmployee.avatar_url ? (
                    <img src={selectedEmployee.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span>{selectedEmployee.first_name?.[0] || "E"}</span>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-gray-900 dark:text-slate-100 truncate">
                      {selectedEmployee.first_name} {selectedEmployee.last_name}
                    </span>
                    {buName && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#253C7D]/10 text-[#253C7D] dark:bg-sky-950 dark:text-sky-300 border border-[#253C7D]/20 shrink-0">
                        <i className="ri-building-line text-[9px]" /> {buName}
                      </span>
                    )}
                    {selectedEmployee.biometric_user_id && (
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#253C7D]/10 text-[#253C7D] dark:bg-sky-950 dark:text-sky-300 border border-[#253C7D]/20 shrink-0">
                        {formatBiometricId(selectedEmployee.biometric_user_id, buName)}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] font-normal text-gray-500 dark:text-slate-400 mt-0.5 truncate">
                    {selectedEmployee.role || selectedEmployee.department || "Staff"}
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-[#253C7D] dark:text-sky-300 shrink-0 border border-indigo-200/50">
                Assigned
              </span>
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setIsEmployeeDropdownOpen((p) => !p)}
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 hover:bg-white dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700 rounded-xl text-xs text-left font-semibold text-gray-800 dark:text-slate-200 focus:outline-none focus:border-[#253C7D] flex items-center justify-between transition-all cursor-pointer shadow-2xs"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
                  <span className={selectedEmployee ? "font-bold text-gray-900 dark:text-slate-100 truncate" : "text-gray-400"}>
                    {selectedEmployee
                      ? `${selectedEmployee.first_name} ${selectedEmployee.last_name} — ${selectedEmployee.role || selectedEmployee.department || "Staff"}`
                      : "Search or select employee..."}
                  </span>
                  {selectedEmployee && buName && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#253C7D]/10 text-[#253C7D] dark:bg-sky-950 dark:text-sky-300 border border-[#253C7D]/20 shrink-0">
                      <i className="ri-building-line text-[9px]" /> {buName}
                    </span>
                  )}
                  {selectedEmployee?.biometric_user_id && (
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#253C7D]/10 text-[#253C7D] dark:bg-sky-950 dark:text-sky-300 border border-[#253C7D]/20 shrink-0">
                      {formatBiometricId(selectedEmployee.biometric_user_id, buName)}
                    </span>
                  )}
                </div>
                <i className="ri-arrow-down-s-line text-gray-400 text-sm pointer-events-none shrink-0" />
              </button>

              {isEmployeeDropdownOpen && (
                <div className="absolute left-0 top-full mt-1.5 w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl shadow-xl z-50 max-h-64 overflow-y-auto">
                  <div className="p-2.5 border-b border-gray-100 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900 z-10">
                    <input
                      type="text"
                      placeholder="Search by name, ID (e.g. 1, 001), or BU..."
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
                          <div className="flex-1 min-w-0 pr-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-bold">{emp.first_name} {emp.last_name}</p>
                              {emp.biometric_user_id && (
                                <span
                                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold bg-[#253C7D]/10 text-[#253C7D] dark:bg-sky-950 dark:text-sky-300 border border-[#253C7D]/20 shrink-0"
                                  title={`BU Biometric ID: ${emp.biometric_user_id}`}
                                >
                                  <i className="ri-fingerprint-line text-[10px]" />
                                  {formatBiometricId(emp.biometric_user_id, emp.branches?.name)}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-gray-400 mt-0.5">{emp.role || emp.department || "Staff"}</p>
                          </div>
                          {emp.id === employeeId && <i className="ri-check-line text-[#253C7D] text-sm shrink-0" />}
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
