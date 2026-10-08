import React from "react";
import type { Employee } from "../../types";
import { formatPaddedPin } from "@/lib/biometricUtils";
import { getLeaveEmployeeName, getLeaveEmployeeInitials } from "../../utils/leaveDisplayUtils";

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
  const empName = selectedEmployee
    ? getLeaveEmployeeName(selectedEmployee)
    : "Select Employee";
  const empSub = selectedEmployee
    ? `${selectedEmployee.role || "Staff"} - ${selectedEmployee.department || "INFORMATION (IT)"}`
    : "Choose team member";
  const initials = selectedEmployee
    ? getLeaveEmployeeInitials(selectedEmployee)
    : "CK";

  return (
    <div className="space-y-2">
      {/* Section Header */}
      <div className="flex items-center gap-2 text-xs sm:text-[13px] font-bold text-[#1e293b] dark:text-slate-100">
        <div className="w-6 h-6 rounded-full bg-[#2563eb] text-white flex items-center justify-center text-xs shadow-2xs">
          <i className="ri-user-3-fill" />
        </div>
        <span>Employee Info</span>
      </div>

      <div className="space-y-1" ref={empDropdownRef}>
        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
          Employee Name <span className="text-rose-500">*</span>
        </label>

        <div className="relative">
          <div
            onClick={() => {
              if (isEmployeeSelectorEditable) {
                setIsEmpDropdownOpen((prev) => !prev);
              }
            }}
            className={`w-full p-2 sm:p-2.5 bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 rounded-xl flex items-center justify-between transition-all ${
              isEmployeeSelectorEditable
                ? "cursor-pointer hover:border-slate-300 focus-within:border-[#2563eb]"
                : "bg-slate-50/50"
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              {selectedEmployee?.avatar_url ? (
                <img
                  src={selectedEmployee.avatar_url}
                  alt={empName}
                  className="w-7 h-7 rounded-full object-cover border border-slate-200 shrink-0"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 font-bold text-[10px] flex items-center justify-center shrink-0 border border-slate-200">
                  {initials}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight truncate">
                  {empName}
                </p>
                <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5">
                  {empSub}
                </p>
              </div>
            </div>

            <i className="ri-arrow-down-s-line text-slate-400 text-xs shrink-0 ml-1" />
          </div>

          {/* Searchable Dropdown Popup */}
          {isEmpDropdownOpen && isEmployeeSelectorEditable && (
            <div className="absolute z-30 left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 rounded-xl shadow-lg p-2 max-h-60 overflow-y-auto">
              <input
                type="text"
                autoFocus
                placeholder="Search name..."
                value={employeeSearch}
                onChange={(e) => setEmployeeSearch(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none mb-1.5"
              />
              <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto">
                {filteredEmployees.map((emp) => {
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
                      className={`p-2 rounded-lg flex items-center justify-between cursor-pointer text-xs ${
                        isSelected ? "bg-blue-50 text-[#2563eb] font-bold" : "hover:bg-slate-50 text-slate-800"
                      }`}
                    >
                      <span>{getLeaveEmployeeName(emp)}</span>
                      {paddedPin && <span className="text-[10px] font-mono text-slate-400">#{paddedPin}</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
