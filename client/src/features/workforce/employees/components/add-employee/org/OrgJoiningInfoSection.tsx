import { memo } from "react";
import type { EmployeeFormState } from "../../../types";
import type { ModalManagerEmployee } from "../types";
import { OrgLocationFields } from "./OrgLocationFields";
import { OrgCompensationFields } from "./OrgCompensationFields";
import { SearchableSelect } from "@/components/SearchableSelect";
import { DatePickerDMY } from "@/components/common/DatePickerDMY";
import { formatKhmerFullName } from "../../../nameUtils";

interface OrgJoiningInfoSectionProps {
  form: EmployeeFormState;
  onChange: (field: keyof EmployeeFormState, value: any) => void;
  cleanBranches?: Array<{ id: string; name: string; location?: string | null }>;
  currentBranch?: { id: string; name: string; location?: string | null } | null;
  currentBranchName?: string;
  workSites: Array<{ id: string; name: string; description: string | null; branch_id: string | null }>;
  onSelectBranch?: (branchId: string) => void;
  onSelectSite: (siteIdOrVal: string) => void;
  buManagers?: ModalManagerEmployee[];
  divisions?: string[];
  departments?: string[];
  positions?: string[];
  employeeTypes?: string[];
}

export const OrgJoiningInfoSection = memo(function OrgJoiningInfoSection({
  form,
  onChange,
  cleanBranches = [],
  currentBranchName,
  workSites,
  onSelectBranch,
  onSelectSite,
  buManagers = [],
  divisions = [],
  departments = [],
  positions = [],
  employeeTypes = [],
}: OrgJoiningInfoSectionProps) {
  const currentPos = form.position || form.role || "";
  const allPositions = currentPos && !positions.includes(currentPos) ? [currentPos, ...positions] : positions;
  const currentDiv = form.division || "";
  const allDivisions = Array.from(new Set([
    ...(currentDiv ? [currentDiv] : []),
    ...divisions,
  ]));
  const currentDept = form.department || "";
  const allDepartments = Array.from(new Set([
    ...(currentDept ? [currentDept] : []),
    ...departments,
  ]));

  return (
    <div className="space-y-4">
      <h3 className="text-xs font-bold text-[#253C7D] uppercase tracking-wider">Joining Info</h3>
      <div className="space-y-3 max-w-xl">
        {/* 1. Joining Date */}
        <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
          <label className="text-xs font-normal text-slate-700 sm:text-right sm:pr-4">
            Joining Date <span className="text-rose-500">*</span>
          </label>
          <div className="sm:col-span-2">
            <DatePickerDMY
              required
              value={form.join_date || form.start_date || ""}
              onChange={(val) => {
                onChange("join_date", val);
                onChange("start_date", val);
              }}
              className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-800 focus:outline-none focus:border-[#253C7D] focus:ring-1 focus:ring-[#253C7D]"
            />
          </div>
        </div>

        {/* 2. Division */}
        <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
          <label className="text-xs font-normal text-slate-700 sm:text-right sm:pr-4">
            Division
          </label>
          <div className="sm:col-span-2">
            <SearchableSelect
              options={allDivisions}
              value={form.division || ""}
              onChange={(val) => onChange("division", val)}
              placeholder="Select Division"
              searchPlaceholder="Search division..."
              showClear
            />
          </div>
        </div>

        {/* 3. Department */}
        <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
          <label className="text-xs font-normal text-slate-700 sm:text-right sm:pr-4">
            Department <span className="text-rose-500">*</span>
          </label>
          <div className="sm:col-span-2">
            <SearchableSelect
              options={allDepartments}
              value={form.department || ""}
              onChange={(val) => onChange("department", val)}
              placeholder="Select Department"
              searchPlaceholder="Search department..."
              required
              showClear
            />
          </div>
        </div>

        {/* 4 & 5. BU & Site */}
        <OrgLocationFields
          form={form}
          cleanBranches={cleanBranches}
          currentBranchName={currentBranchName}
          workSites={workSites}
          onSelectBranch={onSelectBranch}
          onSelectSite={onSelectSite}
        />

        {/* 6. Position */}
        <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
          <label className="text-xs font-normal text-slate-700 sm:text-right sm:pr-4">
            Position <span className="text-rose-500">*</span>
          </label>
          <div className="sm:col-span-2">
            <SearchableSelect
              options={allPositions}
              value={currentPos}
              onChange={(val) => {
                onChange("position", val);
                onChange("role", val);
              }}
              placeholder="Select Position"
              searchPlaceholder="Search position..."
              required
              showClear
            />
          </div>
        </div>

        {/* 7. Employee Type */}
        <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
          <label className="text-xs font-normal text-slate-700 sm:text-right sm:pr-4">
            Employee Type <span className="text-rose-500">*</span>
          </label>
          <div className="sm:col-span-2">
            <SearchableSelect
              options={employeeTypes}
              value={form.employment_type || "Full-Time"}
              onChange={(val) => onChange("employment_type", val)}
              placeholder="Select Employee Type"
              searchPlaceholder="Search employee type..."
              required
            />
          </div>
        </div>

        {/* 8. Supervisor Name */}
        <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
          <label className="text-xs font-normal text-slate-700 sm:text-right sm:pr-4">Supervisor Name</label>
          <div className="sm:col-span-2">
            <SearchableSelect
              options={buManagers.map((m) => ({
                value: m.id,
                label: formatKhmerFullName(m),
                sublabel: m.realRole || m.role || m.position || m.department || "Staff",
              }))}
              value={form.reports_to || form.line_manager || ""}
              onChange={(val) => {
                const matched = buManagers.find((m) => m.id === val || formatKhmerFullName(m) === val);
                onChange("reports_to", matched?.id || val || "");
                onChange("line_manager", matched ? formatKhmerFullName(matched) : val || "");
              }}
              placeholder="Search / Select Supervisor (Line Manager)..."
              searchPlaceholder="Type name or role to search..."
              showClear
            />
          </div>
        </div>

        {/* 9 & 10. Compensation */}
        <OrgCompensationFields form={form} onChange={onChange} />
      </div>
    </div>
  );
});
