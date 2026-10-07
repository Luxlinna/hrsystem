import React from "react";
import { STATUS_TYPES, EMPLOYEE_TYPES, type BranchOption } from "./types";

interface Props {
  statusType: string;
  setStatusType: (v: string) => void;
  effectiveDate: string;
  setEffectiveDate: (v: string) => void;
  bu?: string;
  setBu?: (v: string) => void;
  site: string;
  setSite: (v: string) => void;
  division?: string;
  setDivision?: (v: string) => void;
  department: string;
  setDepartment: (v: string) => void;
  position?: string;
  setPosition?: (v: string) => void;
  designation?: string;
  setDesignation?: (v: string) => void;
  employeeType: string;
  setEmployeeType: (v: string) => void;
  buOptions: BranchOption[];
  siteOptions?: string[];
  divisions?: string[];
  departments?: string[];
  positions?: string[];
  onReloadBranches?: () => void;
  onReloadSites?: () => void;
}

export const ChangeStatusOrgFields: React.FC<Props> = ({
  statusType, setStatusType,
  effectiveDate, setEffectiveDate,
  bu = "", setBu,
  site, setSite,
  division = "", setDivision,
  department, setDepartment,
  position, setPosition,
  designation, setDesignation,
  employeeType, setEmployeeType,
  buOptions = [],
  siteOptions = [],
  divisions = [],
  departments = [],
  positions = [],
  onReloadBranches,
  onReloadSites,
}) => {
  const currentPosition = position !== undefined ? position : designation || "";
  const handlePositionChange = (val: string) => {
    setPosition?.(val);
    setDesignation?.(val);
  };

  return (
    <>
      {/* Status Type */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
        <label className="md:col-span-3 text-xs font-medium text-slate-600 dark:text-slate-300 md:text-right pr-2">
          Status Type <span className="text-rose-500">*</span>
        </label>
        <div className="md:col-span-9 flex items-center gap-1.5">
          <div className="relative flex-1">
            <select
              value={statusType}
              onChange={(e) => setStatusType(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs appearance-none focus:outline-none focus:border-[#0284c7]"
            >
              <option value="">Select</option>
              {STATUS_TYPES.map((st) => (
                <option key={st.label} value={st.label}>{st.label}</option>
              ))}
            </select>
            <i className="ri-arrow-down-s-line absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-xs" />
          </div>
          <button
            type="button"
            onClick={() => setStatusType("Promotion")}
            title="Reset Status Type"
            className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            <i className="ri-refresh-line text-xs" />
          </button>
        </div>
      </div>

      {/* Effective Date */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
        <label className="md:col-span-3 text-xs font-medium text-slate-600 dark:text-slate-300 md:text-right pr-2">
          Effective Date <span className="text-rose-500">*</span>
        </label>
        <div className="md:col-span-9">
          <input
            type="date"
            value={effectiveDate}
            onChange={(e) => setEffectiveDate(e.target.value)}
            required
            className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs focus:outline-none focus:border-[#0284c7]"
          />
        </div>
      </div>

      {/* BU / Business Unit */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
        <label className="md:col-span-3 text-xs font-medium text-slate-600 dark:text-slate-300 md:text-right pr-2">
          BU <span className="text-rose-500">*</span>
        </label>
        <div className="md:col-span-9 flex items-center gap-1.5">
          <div className="relative flex-1">
            <select
              value={bu}
              onChange={(e) => setBu?.(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs appearance-none focus:outline-none focus:border-[#0284c7]"
            >
              <option value="">Select Business Unit (BU)</option>
              {buOptions.map((b) => (
                <option key={b.id || b.name} value={b.name}>{b.name}</option>
              ))}
            </select>
            <i className="ri-arrow-down-s-line absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-xs" />
          </div>
          <button
            type="button"
            onClick={onReloadBranches}
            title="Reload Business Units from BU"
            className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            <i className="ri-refresh-line text-xs" />
          </button>
        </div>
      </div>

      {/* Site */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
        <label className="md:col-span-3 text-xs font-medium text-slate-600 dark:text-slate-300 md:text-right pr-2">
          Site <span className="text-rose-500">*</span>
        </label>
        <div className="md:col-span-9 flex items-center gap-1.5">
          <div className="relative flex-1">
            <select
              value={site}
              onChange={(e) => setSite(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs appearance-none focus:outline-none focus:border-[#0284c7]"
            >
              <option value="">Select Site</option>
              {siteOptions.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
              {site && !siteOptions.includes(site) && (
                <option value={site}>{site}</option>
              )}
            </select>
            <i className="ri-arrow-down-s-line absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-xs" />
          </div>
          {onReloadSites && (
            <button
              type="button"
              onClick={onReloadSites}
              title="Reload Sites"
              className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              <i className="ri-refresh-line text-xs" />
            </button>
          )}
        </div>
      </div>

      {/* Division */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
        <label className="md:col-span-3 text-xs font-medium text-slate-600 dark:text-slate-300 md:text-right pr-2">
          Division
        </label>
        <div className="md:col-span-9 relative">
          <select
            value={division}
            onChange={(e) => setDivision?.(e.target.value)}
            className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs appearance-none focus:outline-none focus:border-[#0284c7]"
          >
            <option value="">Select Division</option>
            {divisions.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
            {division && !divisions.includes(division) && (
              <option value={division}>{division}</option>
            )}
          </select>
          <i className="ri-arrow-down-s-line absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-xs" />
        </div>
      </div>

      {/* Department */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
        <label className="md:col-span-3 text-xs font-medium text-slate-600 dark:text-slate-300 md:text-right pr-2">
          Department <span className="text-rose-500">*</span>
        </label>
        <div className="md:col-span-9 relative">
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs appearance-none focus:outline-none focus:border-[#0284c7]"
          >
            <option value="">Select Department</option>
            {departments.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
            {department && !departments.includes(department) && (
              <option value={department}>{department}</option>
            )}
          </select>
          <i className="ri-arrow-down-s-line absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-xs" />
        </div>
      </div>

      {/* Position */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
        <label className="md:col-span-3 text-xs font-medium text-slate-600 dark:text-slate-300 md:text-right pr-2">
          Position <span className="text-rose-500">*</span>
        </label>
        <div className="md:col-span-9 relative">
          <select
            value={currentPosition}
            onChange={(e) => handlePositionChange(e.target.value)}
            className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs appearance-none focus:outline-none focus:border-[#0284c7]"
          >
            <option value="">Select Position</option>
            {positions.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
            {currentPosition && !positions.includes(currentPosition) && (
              <option value={currentPosition}>{currentPosition}</option>
            )}
          </select>
          <i className="ri-arrow-down-s-line absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-xs" />
        </div>
      </div>

      {/* Employee Type */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
        <label className="md:col-span-3 text-xs font-medium text-slate-600 dark:text-slate-300 md:text-right pr-2">
          Employee Type <span className="text-rose-500">*</span>
        </label>
        <div className="md:col-span-9 relative">
          <select
            value={employeeType}
            onChange={(e) => setEmployeeType(e.target.value)}
            className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs appearance-none focus:outline-none focus:border-[#0284c7]"
          >
            <option value="">Select Type</option>
            {EMPLOYEE_TYPES.map((et) => (
              <option key={et} value={et}>{et}</option>
            ))}
          </select>
          <i className="ri-arrow-down-s-line absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-xs" />
        </div>
      </div>
    </>
  );
};
