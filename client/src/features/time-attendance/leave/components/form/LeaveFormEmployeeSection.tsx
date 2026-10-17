import React, { useState } from "react";
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
  supervisorName?: string;
}

function formatDMY(dateStr?: string | null): string {
  if (!dateStr) return "---";
  try {
    const clean = dateStr.includes("T") ? dateStr.split("T")[0] : dateStr;
    const parts = clean.split("-");
    if (parts.length === 3) {
      const [y, m, d] = parts;
      return `${d.padStart(2, "0")}/${m.padStart(2, "0")}/${y}`;
    }
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return dateStr || "---";
  }
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
  supervisorName,
}: LeaveFormEmployeeSectionProps) {
  const [isFocused, setIsFocused] = useState(false);

  const empName = selectedEmployee ? getLeaveEmployeeName(selectedEmployee) : "Select Employee";
  const empInitials = selectedEmployee ? getLeaveEmployeeInitials(selectedEmployee) : "EM";
  const empCode =
    selectedEmployee?.employee_code ||
    selectedEmployee?.biometric_user_id ||
    selectedEmployee?.employee_id ||
    "---";
  const department = selectedEmployee?.department || "---";
  const site =
    selectedEmployee?.site ||
    selectedEmployee?.branches?.location ||
    selectedEmployee?.branches?.name ||
    "UNI Building";
  const position = selectedEmployee?.position || selectedEmployee?.role || "---";
  const businessUnit =
    selectedEmployee?.bu_full_name ||
    selectedEmployee?.branches?.name ||
    selectedEmployee?.code_bu ||
    "UNI Holding";
  const joiningDate = formatDMY(selectedEmployee?.join_date || selectedEmployee?.start_date);
  const division = selectedEmployee?.division || selectedEmployee?.department || "---";
  const supervisor = supervisorName || "Mrs. Chea Tiengchanvathna";
  const employeeType = selectedEmployee?.employment_type || "Full Time";

  const detailFields = [
    // Row 1
    {
      id: "employee-code",
      label: "Employee Code",
      value: empCode,
    },
    {
      id: "department",
      label: "Department",
      value: department,
    },
    {
      id: "site",
      label: "Site",
      value: site,
    },
    // Row 2
    {
      id: "position",
      label: "Position",
      value: position,
    },
    {
      id: "business-unit",
      label: "Business Unit",
      value: businessUnit,
    },
    {
      id: "joining-date",
      label: "Joining Date",
      value: joiningDate,
    },
    // Row 3
    {
      id: "division",
      label: "Division",
      value: division,
    },
    {
      id: "supervisor",
      label: "Supervisor",
      value: supervisor,
    },
    {
      id: "employee-type",
      label: "Employee Type",
      value: employeeType,
    },
  ];

  return (
    <div className="space-y-2.5 w-full">
      {/* Employee Info Yellow Accent Badge */}
      <div className="flex items-center justify-between">
        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 text-[10.5px] font-semibold border border-amber-200/80 dark:border-amber-800/60">
          <i className="ri-user-3-line text-xs text-amber-700 dark:text-amber-300" />
          <span>Employee Info</span>
        </div>

        {selectedEmployee && (
          <span className="text-[10.5px] font-medium text-slate-400">
            ID: <span className="font-mono font-semibold text-slate-600 dark:text-slate-300">{empCode}</span>
          </span>
        )}
      </div>

      {/* Employee Name Search Bar — Full Width & Easy Typing */}
      <div className="space-y-1 w-full">
        <label className="block text-[11px] sm:text-xs font-bold text-slate-700 dark:text-slate-200">
          Employee Name <span className="text-rose-500">*</span>
        </label>

        <div className="relative w-full" ref={empDropdownRef}>
          <div
            className={`w-full flex items-center bg-white dark:bg-slate-800 border rounded-lg transition-all shadow-2xs ${
              isFocused || isEmpDropdownOpen
                ? "border-[#253C7D] ring-2 ring-[#253C7D]/10"
                : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
            }`}
          >
            {/* Search Icon */}
            <div className="pl-3 pr-2 text-slate-400 pointer-events-none flex items-center">
              <i className="ri-search-line text-xs" />
            </div>

            {/* Input field */}
            <input
              type="text"
              readOnly={!isEmployeeSelectorEditable}
              value={
                isEmpDropdownOpen || isFocused
                  ? employeeSearch
                  : selectedEmployee
                  ? getLeaveEmployeeName(selectedEmployee)
                  : ""
              }
              placeholder={
                isEmployeeSelectorEditable
                  ? "Type employee name, code, or department to search..."
                  : empName
              }
              onChange={(e) => {
                if (isEmployeeSelectorEditable) {
                  setEmployeeSearch(e.target.value);
                  if (!isEmpDropdownOpen) setIsEmpDropdownOpen(true);
                }
              }}
              onFocus={() => {
                setIsFocused(true);
                if (isEmployeeSelectorEditable) {
                  setIsEmpDropdownOpen(true);
                }
              }}
              onBlur={() => {
                setIsFocused(false);
              }}
              className={`w-full py-1.5 sm:py-2 pr-3 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 bg-transparent focus:outline-none ${
                isEmployeeSelectorEditable ? "cursor-text" : "cursor-default"
              }`}
            />

            {/* Clear Button */}
            {employeeSearch && isEmployeeSelectorEditable && (
              <button
                type="button"
                onClick={() => {
                  setEmployeeSearch("");
                  if (empDropdownRef.current) {
                    const inp = empDropdownRef.current.querySelector("input");
                    inp?.focus();
                  }
                }}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded transition-colors"
                title="Clear search"
              >
                <i className="ri-close-circle-fill text-xs" />
              </button>
            )}

            {/* Search Action Indicator */}
            {isEmployeeSelectorEditable && (
              <button
                type="button"
                onClick={() => setIsEmpDropdownOpen((p) => !p)}
                className="px-2.5 py-1 mr-1 rounded-md text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center gap-1"
              >
                <span>Search</span>
                <i className={`ri-arrow-${isEmpDropdownOpen ? "up" : "down"}-s-line text-xs`} />
              </button>
            )}
          </div>

          {/* Autocomplete Dropdown List */}
          {isEmpDropdownOpen && isEmployeeSelectorEditable && (
            <div className="absolute z-40 left-0 right-0 mt-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl p-2 max-h-72 overflow-y-auto animate-in fade-in-50 zoom-in-95 duration-100">
              <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {filteredEmployees.length} matching employee{filteredEmployees.length === 1 ? "" : "s"}
              </div>

              {filteredEmployees.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  <i className="ri-user-unfollow-line text-xl block mb-1" />
                  No employees found matching &quot;{employeeSearch}&quot;
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredEmployees.map((emp) => {
                    const paddedPin = formatPaddedPin(emp.biometric_user_id);
                    const isSelected = emp.id === activeEmpId;
                    return (
                      <div
                        key={emp.id}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          onSelectEmployee(emp.id);
                          setIsEmpDropdownOpen(false);
                          setEmployeeSearch("");
                        }}
                        className={`p-2.5 rounded-xl flex items-center justify-between cursor-pointer transition-colors text-xs ${
                          isSelected
                            ? "bg-blue-50/80 dark:bg-blue-950/60 text-[#253C7D] dark:text-blue-300 font-bold"
                            : "hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {emp.avatar_url ? (
                            <img
                              src={emp.avatar_url}
                              alt=""
                              className="w-7 h-7 rounded-full object-cover shrink-0 border border-slate-200 dark:border-slate-700"
                            />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[10px] flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700">
                              {getLeaveEmployeeInitials(emp)}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="font-semibold text-xs text-slate-900 dark:text-slate-100 truncate">
                              {getLeaveEmployeeName(emp)}
                            </div>
                            <div className="text-[10px] text-slate-400 truncate">
                              {emp.role || emp.department || "Staff"}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0 ml-2">
                          {emp.employee_code && (
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
                              #{emp.employee_code}
                            </span>
                          )}
                          {paddedPin && (
                            <span className="text-[10px] font-mono text-slate-400">
                              PIN:{paddedPin}
                            </span>
                          )}
                          {isSelected && (
                            <i className="ri-check-line text-[#253C7D] dark:text-blue-400 font-bold ml-1" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Employee Details Panel — Matching UI Structure from Image 1 */}
      <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 sm:p-4 w-full shadow-xs">
        <div className="flex flex-col md:flex-row items-stretch gap-3 sm:gap-3.5">
          {/* Picture Box on Desktop / Tablet (md and up) */}
          <div className="hidden md:flex md:w-36 lg:w-44 shrink-0 self-stretch min-h-0">
            <div className="w-full flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/60 overflow-hidden relative shadow-2xs flex flex-col items-center justify-center p-2.5">
              {selectedEmployee?.avatar_url ? (
                <img
                  src={selectedEmployee.avatar_url}
                  alt={empName}
                  className="w-full h-full object-cover object-top rounded-lg"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-3 text-center">
                  <div className="w-14 h-14 lg:w-16 lg:h-16 rounded-full bg-white dark:bg-slate-800 shadow-xs flex items-center justify-center font-extrabold text-base lg:text-xl text-[#253C7D] dark:text-blue-300 border border-slate-200/80 dark:border-slate-700">
                    {empInitials}
                  </div>
                  <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 italic">
                    Picture
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Name Box + 3x3 Grid of 9 Cards */}
          <div className="flex-1 min-w-0 flex flex-col gap-2.5">
            {/* Mobile Header: Picture + Name side-by-side (< md) */}
            <div className="flex md:hidden items-center gap-2.5">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 overflow-hidden shrink-0 flex items-center justify-center shadow-2xs">
                {selectedEmployee?.avatar_url ? (
                  <img
                    src={selectedEmployee.avatar_url}
                    alt={empName}
                    className="w-full h-full object-cover object-top"
                  />
                ) : (
                  <div className="font-extrabold text-sm sm:text-base text-[#253C7D] dark:text-blue-300">
                    {empInitials}
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 p-2.5 shadow-2xs">
                <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white truncate">
                  {empName}
                </h3>
                {selectedEmployee && (
                  <div className="mt-1">
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                      <i className="ri-checkbox-circle-fill text-[11px] text-emerald-600 dark:text-emerald-400" />
                      <span>Confirmed Member</span>
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Desktop Name Box (md and up) */}
            <div className="hidden md:flex rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 px-4 py-2.5 lg:py-3 items-center justify-between gap-3 shadow-2xs">
              <h3 className="font-bold text-base lg:text-lg text-slate-900 dark:text-white truncate">
                {empName}
              </h3>
              {selectedEmployee && (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 shrink-0">
                  <i className="ri-checkbox-circle-fill text-xs text-emerald-600 dark:text-emerald-400" />
                  <span>Confirmed Member</span>
                </span>
              )}
            </div>

            {/* 3x3 Grid of 9 Information Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-2.5">
              {detailFields.map((field) => (
                <div
                  key={field.id}
                  className={`rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 p-2.5 sm:p-3 flex flex-col justify-center shadow-2xs hover:border-slate-300 dark:hover:border-slate-600 transition-colors min-h-[58px] sm:min-h-[62px] ${
                    field.id === "employee-type" ? "col-span-2 md:col-span-1" : ""
                  }`}
                >
                  <div
                    className="font-bold text-xs sm:text-[13px] md:text-sm text-slate-900 dark:text-white truncate leading-snug"
                    title={field.value}
                  >
                    {field.value}
                  </div>
                  <div className="text-[10.5px] sm:text-xs text-slate-500 dark:text-slate-400 italic truncate mt-0.5 leading-tight">
                    {field.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
