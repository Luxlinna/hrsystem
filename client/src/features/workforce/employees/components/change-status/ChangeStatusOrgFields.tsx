import React from "react";
import { STATUS_TYPES, EMPLOYEE_TYPES, type BranchOption } from "./types";
import { SearchableSelect } from "@/components/SearchableSelect";
import { DatePickerDMY } from "@/components/common/DatePickerDMY";

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

const FieldRow: React.FC<{ label: string; required?: boolean; children: React.ReactNode }> = ({
  label, required, children,
}) => (
  <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
    <label className="md:col-span-3 text-xs font-medium text-slate-600 dark:text-slate-300 md:text-right pr-2">
      {label} {required && <span className="text-rose-500">*</span>}
    </label>
    <div className="md:col-span-9">{children}</div>
  </div>
);

export const ChangeStatusOrgFields: React.FC<Props> = ({
  statusType, setStatusType, effectiveDate, setEffectiveDate,
  bu = "", setBu, site, setSite, division = "", setDivision,
  department, setDepartment, position, setPosition,
  designation, setDesignation, employeeType, setEmployeeType,
  buOptions = [], siteOptions = [], divisions = [],
  departments = [], positions = [], onReloadBranches, onReloadSites,
}) => {
  const currentPosition = position !== undefined ? position : designation || "";
  const handlePositionChange = (val: string) => {
    setPosition?.(val);
    setDesignation?.(val);
  };

  return (
    <>
      {/* Status Type */}
      <FieldRow label="Status Type" required>
        <div className="flex items-center gap-1.5">
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
      </FieldRow>

      {/* Effective Date */}
      <FieldRow label="Effective Date" required>
        <DatePickerDMY
          value={effectiveDate}
          onChange={setEffectiveDate}
          required
          className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs focus:outline-none focus:border-[#0284c7]"
        />
      </FieldRow>

      {/* BU / Business Unit */}
      <FieldRow label="BU" required>
        <div className="flex items-center gap-1.5">
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
            title="Reload Business Units"
            className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-50 cursor-pointer shrink-0"
          >
            <i className="ri-refresh-line text-xs" />
          </button>
        </div>
      </FieldRow>

      {/* Site */}
      <FieldRow label="Site" required>
        <div className="flex items-center gap-1.5">
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
      </FieldRow>

      {/* Division */}
      <FieldRow label="Division">
        <SearchableSelect
          options={divisions}
          value={division}
          onChange={(val) => setDivision?.(val)}
          placeholder="Select Division"
          searchPlaceholder="Search division..."
          showClear
        />
      </FieldRow>

      {/* Department */}
      <FieldRow label="Department" required>
        <SearchableSelect
          options={departments}
          value={department}
          onChange={setDepartment}
          placeholder="Select Department"
          searchPlaceholder="Search department..."
          showClear
        />
      </FieldRow>

      {/* Position */}
      <FieldRow label="Position" required>
        <SearchableSelect
          options={positions}
          value={currentPosition}
          onChange={handlePositionChange}
          placeholder="Select Position"
          searchPlaceholder="Search position..."
          showClear
        />
      </FieldRow>

      {/* Employee Type */}
      <FieldRow label="Employee Type" required>
        <SearchableSelect
          options={EMPLOYEE_TYPES}
          value={employeeType}
          onChange={setEmployeeType}
          placeholder="Select Employee Type"
          searchPlaceholder="Search type..."
        />
      </FieldRow>
    </>
  );
};
