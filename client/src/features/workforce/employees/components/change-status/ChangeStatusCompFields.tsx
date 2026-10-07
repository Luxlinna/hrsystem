import React, { type RefObject } from "react";
import { SALARY_TYPES } from "./types";

interface Props {
  supervisor: string;
  setSupervisor: (v: string) => void;
  isSupervisorDropdownOpen: boolean;
  setIsSupervisorDropdownOpen: (v: boolean) => void;
  supervisorDropdownRef: RefObject<HTMLDivElement | null>;
  supervisorOptions: any[];
  salaryType: string;
  setSalaryType: (v: string) => void;
  salary: string;
  setSalary: (v: string) => void;
  remark: string;
  setRemark: (v: string) => void;
}

export const ChangeStatusCompFields: React.FC<Props> = ({
  supervisor,
  setSupervisor,
  isSupervisorDropdownOpen,
  setIsSupervisorDropdownOpen,
  supervisorDropdownRef,
  supervisorOptions,
  salaryType,
  setSalaryType,
  salary,
  setSalary,
  remark,
  setRemark,
}) => {
  return (
    <>
      {/* Supervisor Name */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
        <label className="md:col-span-3 text-xs font-medium text-slate-600 dark:text-slate-300 md:text-right pr-2">
          Supervisor Name
        </label>
        <div className="md:col-span-9 relative" ref={supervisorDropdownRef}>
          <div className="relative flex items-center">
            <input
              type="text"
              value={supervisor}
              onChange={(e) => {
                setSupervisor(e.target.value);
                setIsSupervisorDropdownOpen(true);
              }}
              onFocus={() => setIsSupervisorDropdownOpen(true)}
              placeholder="Search..."
              className="w-full px-3 py-1.5 pr-14 border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs focus:outline-none focus:border-[#0284c7]"
            />
            <div className="absolute right-2 flex items-center gap-1">
              {supervisor && (
                <button
                  type="button"
                  onClick={() => setSupervisor("")}
                  className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                  title="Clear supervisor"
                >
                  <i className="ri-close-line text-xs" />
                </button>
              )}
              <i className="ri-arrow-down-s-line text-slate-400 text-xs pointer-events-none" />
            </div>
          </div>

          {isSupervisorDropdownOpen && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md shadow-xl max-h-48 overflow-y-auto z-30 py-1">
              {supervisorOptions
                .filter((s) => {
                  const q = supervisor.trim().toLowerCase();
                  if (!q) return true;
                  return `${s.first_name || ""} ${s.last_name || ""}`.toLowerCase().includes(q);
                })
                .map((s) => {
                  const fullName = `${s.first_name} ${s.last_name}`;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        setSupervisor(fullName);
                        setIsSupervisorDropdownOpen(false);
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 cursor-pointer flex items-center justify-between"
                    >
                      <span>{fullName}</span>
                      <span className="text-[10px] text-slate-400">{s.role || s.department || ""}</span>
                    </button>
                  );
                })}
            </div>
          )}
        </div>
      </div>

      {/* Salary Type & Rate */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
        <label className="md:col-span-3 text-xs font-medium text-slate-600 dark:text-slate-300 md:text-right pr-2">
          Salary Type <span className="text-rose-500">*</span>
        </label>
        <div className="md:col-span-9 grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div className="relative">
            <select
              value={salaryType}
              onChange={(e) => setSalaryType(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs appearance-none focus:outline-none focus:border-[#0284c7]"
            >
              {SALARY_TYPES.map((st) => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
            <i className="ri-arrow-down-s-line absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-xs" />
          </div>
          <input
            type="number"
            step="any"
            min="0"
            value={salary}
            onChange={(e) => setSalary(e.target.value)}
            placeholder="Salary Rate ($)"
            className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs focus:outline-none focus:border-[#0284c7]"
          />
        </div>
      </div>

      {/* Remark */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-start">
        <label className="md:col-span-3 text-xs font-medium text-slate-600 dark:text-slate-300 md:text-right pr-2 pt-1.5">
          Remark
        </label>
        <div className="md:col-span-9">
          <textarea
            rows={2}
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
            placeholder="Remark"
            className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs focus:outline-none focus:border-[#0284c7]"
          />
        </div>
      </div>
    </>
  );
};
