import React from "react";
import { STATUS_TYPES, EMPLOYEE_TYPES, type BranchOption } from "./types";
import { SearchableSelect } from "@/components/SearchableSelect";

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
          <div className="flex-1">
            <SearchableSelect
              options={STATUS_TYPES.map((st) => st.label)}
              value={statusType}
              onChange={setStatusType}
              placeholder="Select Status Type"
              searchPlaceholder="Search status..."
            />
          </div>
          <button
            type="button"
            onClick={() => setStatusType("Promotion")}
            title="Reset Status Type"
            className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-50 cursor-pointer shrink-0"
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
          <div className="flex-1">
            <SearchableSelect
              options={buOptions.map((b) => ({ value: b.name, label: b.name }))}
              value={bu}
              onChange={(val) => setBu?.(val)}
              placeholder="Select Business Unit (BU)"
              searchPlaceholder="Search BU..."
              showClear
            />
          </div>
          <button
            type="button"
            onClick={onReloadBranches}
            title="Reload Business Units from BU"
            className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-50 cursor-pointer shrink-0"
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
          <div className="flex-1">
            <SearchableSelect
              options={siteOptions}
              value={site}
              onChange={setSite}
              placeholder="Select Site"
              searchPlaceholder="Search site..."
              showClear
            />
          </div>
          {onReloadSites && (
            <button
              type="button"
              onClick={onReloadSites}
              title="Reload Sites"
              className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-50 cursor-pointer shrink-0"
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
        <div className="md:col-span-9">
          <SearchableSelect
            options={divisions}
            value={division}
            onChange={(val) => setDivision?.(val)}
            placeholder="Select Division"
            searchPlaceholder="Search division..."
            showClear
          />
        </div>
      </div>

      {/* Department */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
        <label className="md:col-span-3 text-xs font-medium text-slate-600 dark:text-slate-300 md:text-right pr-2">
          Department <span className="text-rose-500">*</span>
        </label>
        <div className="md:col-span-9">
          <SearchableSelect
            options={departments}
            value={department}
            onChange={setDepartment}
            placeholder="Select Department"
            searchPlaceholder="Search department..."
            showClear
          />
        </div>
      </div>

      {/* Position */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
        <label className="md:col-span-3 text-xs font-medium text-slate-600 dark:text-slate-300 md:text-right pr-2">
          Position <span className="text-rose-500">*</span>
        </label>
        <div className="md:col-span-9">
          <SearchableSelect
            options={positions}
            value={currentPosition}
            onChange={handlePositionChange}
            placeholder="Select Position"
            searchPlaceholder="Search position..."
            showClear
          />
        </div>
      </div>

      {/* Employee Type */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
        <label className="md:col-span-3 text-xs font-medium text-slate-600 dark:text-slate-300 md:text-right pr-2">
          Employee Type <span className="text-rose-500">*</span>
        </label>
        <div className="md:col-span-9">
          <SearchableSelect
            options={EMPLOYEE_TYPES}
            value={employeeType}
            onChange={setEmployeeType}
            placeholder="Select Employee Type"
            searchPlaceholder="Search type..."
          />
        </div>
      </div>
    </>
  );
};
