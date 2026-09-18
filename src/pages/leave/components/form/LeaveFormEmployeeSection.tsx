import React from "react";
import type { Employee } from "../../types";
import { formatPaddedPin } from "@/lib/biometricUtils";

interface LeaveFormEmployeeSectionProps {
  selectedEmployee: Employee | null;
  isEmployeeSelectorEditable: boolean;
  isEmpDropdownOpen: boolean;
  setIsEmpDropdownOpen: React.Dispatch<React.SetStateAction<boolean>>;
  empDropdownRef: React.RefObject<HTMLDivElement | null>;
  employeeSearch: string;
  setEmployeeSearch: (val: string) => void;
  filteredEmployees: Employee[];
  activeEmpId: string;
  onSelectEmployee: (empId: string) => void;
}

export function LeaveFormEmployeeSection({
  selectedEmployee,
  isEmployeeSelectorEditable,
  isEmpDropdownOpen,
  setIsEmpDropdownOpen,
  empDropdownRef,
  employeeSearch,
  setEmployeeSearch,
  filteredEmployees,
  activeEmpId,
  onSelectEmployee,
}: LeaveFormEmployeeSectionProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 p-5 sm:p-6 shadow-2xs">
      <h2 className="text-xs font-extrabold text-[#253C7D] uppercase tracking-wider mb-4 flex items-center gap-2">
        <i className="ri-user-star-line text-base" />
        Employee Info
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        <label className="md:col-span-3 text-xs font-bold text-gray-700">
          Employee Name <span className="text-rose-500">*</span>
        </label>

        <div className="md:col-span-9 relative" ref={empDropdownRef}>
          {isEmployeeSelectorEditable ? (
            <div>
              <div
                onClick={() => setIsEmpDropdownOpen((prev) => !prev)}
                className="w-full px-3.5 py-2.5 bg-gray-50 hover:bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-800 flex items-center justify-between cursor-pointer focus-within:border-[#253C7D] transition-colors"
              >
                <span className="truncate">
                  {selectedEmployee
                    ? `${selectedEmployee.first_name} ${selectedEmployee.last_name} ${
                        selectedEmployee.employee_code || selectedEmployee.biometric_user_id
                          ? `(#${formatPaddedPin(selectedEmployee.biometric_user_id) || selectedEmployee.employee_code})`
                          : ""
                      } - ${selectedEmployee.department || "Staff"}`
                    : "Search by full name or ID (e.g. 001)..."}
                </span>
                <i className="ri-arrow-down-s-line text-gray-400 text-base" />
              </div>

              {isEmpDropdownOpen && (
                <div className="absolute z-30 left-0 right-0 mt-1.5 bg-white border border-gray-200 rounded-2xl shadow-xl p-2 max-h-72 overflow-y-auto animate-in fade-in-50 zoom-in-95">
                  <div className="relative mb-2">
                    <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                    <input
                      type="text"
                      autoFocus
                      placeholder="Type employee name or ID number (e.g. 1, 001, 45)..."
                      value={employeeSearch}
                      onChange={(e) => setEmployeeSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:border-[#253C7D]"
                    />
                  </div>

                  <div className="divide-y divide-gray-100 max-h-56 overflow-y-auto">
                    {filteredEmployees.length === 0 ? (
                      <div className="p-3 text-center text-xs text-gray-400">
                        No employees matching "{employeeSearch}"
                      </div>
                    ) : (
                      filteredEmployees.map((emp) => {
                        const paddedPin = formatPaddedPin(emp.biometric_user_id);
                        const isSelected = emp.id === activeEmpId;
                        return (
                          <div
                            key={emp.id}
                            onClick={() => {
                              onSelectEmployee(emp.id);
                              setIsEmpDropdownOpen(false);
                              setEmployeeSearch("");
                            }}
                            className={`p-2.5 rounded-xl flex items-center justify-between cursor-pointer text-xs transition-colors ${
                              isSelected
                                ? "bg-[#253C7D]/10 text-[#253C7D] font-bold"
                                : "hover:bg-slate-50 text-gray-800"
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-lg bg-gray-100 text-[#253C7D] font-extrabold flex items-center justify-center text-[11px] shrink-0">
                                {emp.first_name?.[0] || "E"}
                              </div>
                              <div>
                                <div className="font-extrabold">
                                  {emp.first_name} {emp.last_name}
                                  {paddedPin && (
                                    <span className="ml-1.5 px-1.5 py-0.5 rounded bg-blue-50 text-[#253C7D] text-[10px] font-mono font-black border border-blue-200">
                                      ID #{paddedPin}
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] text-gray-400 font-medium">
                                  {emp.role || "Staff"} &middot; {emp.department || "General"}
                                  {emp.branches?.name && ` &middot; ${emp.branches.name}`}
                                </div>
                              </div>
                            </div>
                            {isSelected && <i className="ri-check-line text-sm text-[#253C7D]" />}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <i className="ri-user-fill text-[#253C7D]" />
                <span>
                  {selectedEmployee
                    ? `${selectedEmployee.first_name} ${selectedEmployee.last_name}`
                    : "Current User"}
                </span>
                {selectedEmployee?.biometric_user_id && (
                  <span className="px-1.5 py-0.5 rounded bg-blue-50 text-[#253C7D] text-[10px] font-mono font-bold border border-blue-200">
                    ID #{formatPaddedPin(selectedEmployee.biometric_user_id)}
                  </span>
                )}
              </div>
              <span className="text-[11px] font-semibold text-gray-400">
                {selectedEmployee?.role || "Employee"} &middot; {selectedEmployee?.department || "General"}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
