import { memo } from "react";
import type { Employee } from "../../types";
import { formatBiometricId } from "@/lib/biometricUtils";

interface OvertimeEmployeeSectionProps {
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

export const OvertimeEmployeeSection = memo(function OvertimeEmployeeSection({
  isEmployeeFixed,
  selectedEmployee,
  isEmployeeDropdownOpen,
  setIsEmployeeDropdownOpen,
  employeeDropdownRef,
  employeeSearchQuery,
  setEmployeeSearchQuery,
  filteredEmployees,
  handleSelectEmployee,
}: OvertimeEmployeeSectionProps) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-gray-200/80 dark:border-slate-800 shadow-2xs">
      <div className="flex items-center gap-2 mb-4 pb-2.5 border-b border-gray-100 dark:border-slate-800">
        <span className="w-6 h-6 rounded-lg bg-[#253C7D]/10 text-[#253C7D] dark:text-sky-400 flex items-center justify-center text-xs">
          <i className="ri-user-line font-bold" />
        </span>
        <h3 className="text-xs font-bold text-gray-900 dark:text-slate-100 uppercase tracking-wider">
          Employee Information
        </h3>
      </div>

      <div>
        <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5">
          Employee <span className="text-rose-500">*</span>
        </label>

        {isEmployeeFixed && selectedEmployee ? (
          <div className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-gray-800 dark:text-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#253C7D] text-white flex items-center justify-center font-bold text-xs">
                {selectedEmployee.first_name?.[0] || "E"}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-bold text-gray-900 dark:text-slate-100">
                    {selectedEmployee.first_name} {selectedEmployee.last_name}
                  </p>
                  {selectedEmployee.biometric_user_id && (
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-[#253C7D]/10 text-[#253C7D] dark:bg-sky-950 dark:text-sky-300 border border-[#253C7D]/20 shrink-0"
                      title={`BU Biometric ID: ${selectedEmployee.biometric_user_id}`}
                    >
                      <i className="ri-fingerprint-line text-[10px]" />
                      {formatBiometricId(selectedEmployee.biometric_user_id, selectedEmployee.branches?.name)}
                    </span>
                  )}
                </div>
                <p className="text-[11px] font-normal text-gray-500 dark:text-slate-400 mt-0.5">
                  {selectedEmployee.department || "Staff"} {selectedEmployee.branches?.name ? `• ${selectedEmployee.branches.name}` : ""}
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-sky-100 dark:bg-sky-950 text-[#253C7D] dark:text-sky-300">
              Assigned
            </span>
          </div>
        ) : (
          <div className="w-full relative" ref={employeeDropdownRef}>
            <button
              type="button"
              onClick={() => setIsEmployeeDropdownOpen((p) => !p)}
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 hover:bg-white dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700 rounded-xl text-xs text-left font-medium text-gray-800 dark:text-slate-200 focus:outline-none focus:border-[#253C7D] flex items-center justify-between transition-all cursor-pointer shadow-2xs"
            >
              <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
                <span className={selectedEmployee ? "font-bold text-gray-900 dark:text-slate-100 truncate" : "text-gray-400"}>
                  {selectedEmployee
                    ? `${selectedEmployee.first_name} ${selectedEmployee.last_name} — ${selectedEmployee.role || selectedEmployee.department || "Staff"}`
                    : "Search & Select Employee..."}
                </span>
                {selectedEmployee?.biometric_user_id ? (
                  <span
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold bg-[#253C7D]/10 text-[#253C7D] dark:bg-sky-950 dark:text-sky-300 border border-[#253C7D]/20 shrink-0"
                  >
                    <i className="ri-fingerprint-line text-[10px]" />
                    {formatBiometricId(selectedEmployee.biometric_user_id, selectedEmployee.branches?.name)}
                  </span>
                ) : selectedEmployee?.branches?.name ? (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#253C7D]/10 text-[#253C7D] dark:bg-sky-950 dark:text-sky-300 hidden sm:inline">
                    {selectedEmployee.branches.name}
                  </span>
                ) : null}
              </div>
              <i className="ri-arrow-down-s-line text-gray-400 text-sm shrink-0" />
            </button>

            {isEmployeeDropdownOpen && (
              <div className="absolute left-0 right-0 mt-1.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                <div className="p-2 border-b border-gray-100 dark:border-slate-800">
                  <div className="relative">
                    <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                    <input
                      type="text"
                      autoFocus
                      placeholder="Search by name, ID (e.g. 1, 001), or BU..."
                      value={employeeSearchQuery}
                      onChange={(e) => setEmployeeSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-xs text-gray-900 dark:text-slate-100 focus:outline-none focus:border-[#253C7D]"
                    />
                  </div>
                </div>

                <div className="max-h-56 overflow-y-auto divide-y divide-gray-50 dark:divide-slate-800">
                  {filteredEmployees.length === 0 ? (
                    <div className="py-4 text-center text-xs text-gray-400">No employees found</div>
                  ) : (
                    filteredEmployees.map((emp) => (
                      <button
                        key={emp.id}
                        type="button"
                        onClick={() => handleSelectEmployee(emp.id)}
                        className="w-full px-3.5 py-2.5 text-left text-xs hover:bg-sky-50/50 dark:hover:bg-slate-800 transition-colors flex items-center justify-between cursor-pointer"
                      >
                        <div className="flex-1 min-w-0 pr-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-bold text-gray-900 dark:text-slate-100">
                              {emp.first_name} {emp.last_name}
                            </p>
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
                          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                            <span className="text-[10px] text-gray-400">
                              {emp.department || "No Department"} • {emp.role || "Staff"}
                            </span>
                            {emp.branches?.name && !emp.biometric_user_id && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#253C7D]/10 text-[#253C7D] dark:bg-sky-950/70 dark:text-sky-400">
                                {emp.branches.name}
                              </span>
                            )}
                          </div>
                        </div>
                        {!emp.biometric_user_id && (
                          <span className="text-[10px] font-mono font-bold text-gray-500 dark:text-slate-400 shrink-0 ml-2">
                            {emp.employee_code || emp.id.slice(0, 6)}
                          </span>
                        )}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
});
