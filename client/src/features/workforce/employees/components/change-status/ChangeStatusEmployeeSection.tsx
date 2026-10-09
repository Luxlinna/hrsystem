import React, { type RefObject } from "react";
import { formatKhmerFullName } from "../../nameUtils";

interface Props {
  empSearchQuery: string;
  setEmpSearchQuery: (q: string) => void;
  isEmpDropdownOpen: boolean;
  setIsEmpDropdownOpen: (open: boolean) => void;
  empDropdownRef: RefObject<HTMLDivElement | null>;
  filteredEmployees: any[];
  selectedEmpId: string;
  onSelectEmployee: (emp: any) => void;
}

export const ChangeStatusEmployeeSection: React.FC<Props> = ({
  empSearchQuery,
  setEmpSearchQuery,
  isEmpDropdownOpen,
  setIsEmpDropdownOpen,
  empDropdownRef,
  filteredEmployees,
  selectedEmpId,
  onSelectEmployee,
}) => {
  return (
    <div>
      <h3 className="text-[11px] font-bold text-[#0284c7] uppercase tracking-wider mb-3">
        EMPLOYEE INFO
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
        <label className="md:col-span-3 text-xs font-medium text-slate-600 dark:text-slate-300 md:text-right pr-2">
          Employee <span className="text-rose-500">*</span>
        </label>
        <div className="md:col-span-9 relative" ref={empDropdownRef}>
          <div className="relative">
            <input
              type="text"
              value={empSearchQuery}
              onChange={(e) => {
                setEmpSearchQuery(e.target.value);
                setIsEmpDropdownOpen(true);
              }}
              onFocus={() => setIsEmpDropdownOpen(true)}
              placeholder="Search..."
              className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs focus:outline-none focus:border-[#0284c7] focus:ring-1 focus:ring-[#0284c7]"
            />
            <i className="ri-arrow-down-s-line absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-xs" />
          </div>

          {isEmpDropdownOpen && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md shadow-xl max-h-60 overflow-y-auto z-30 py-1">
              {filteredEmployees.length === 0 ? (
                <div className="px-3 py-3 text-center text-slate-400 text-xs">
                  No employees found matching "{empSearchQuery}"
                </div>
              ) : (
                filteredEmployees.map((emp) => {
                  const isSelected = emp.id === selectedEmpId;
                  return (
                    <button
                      key={emp.id}
                      type="button"
                      onClick={() => onSelectEmployee(emp)}
                      className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/60 cursor-pointer ${
                        isSelected ? "bg-sky-50 dark:bg-sky-950/40" : ""
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-[10px] text-slate-600 dark:text-slate-300 uppercase">
                          {emp.last_name?.[0] || emp.first_name?.[0] || "?"}
                        </div>
                        <div>
                          <div className="font-medium text-slate-800 dark:text-slate-200">
                            {formatKhmerFullName(emp)}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {emp.branches?.name || emp.bu_full_name || emp.company || emp.code_bu || "HQ"} · {emp.department || "General"} · {emp.role || emp.position || "Staff"}
                          </div>
                        </div>
                      </div>
                      {isSelected && <i className="ri-check-line text-sky-600 text-sm" />}
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
