import { memo } from "react";
import type { EmployeeFormState } from "../../../types";
import type { ModalManagerEmployee } from "../types";
import { OrgLocationFields } from "./OrgLocationFields";
import { OrgCompensationFields } from "./OrgCompensationFields";

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
            <input
              type="date"
              required
              value={form.join_date || form.start_date || ""}
              onChange={(e) => { onChange("join_date", e.target.value); onChange("start_date", e.target.value); }}
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
            <select
              value={form.division || ""}
              onChange={(e) => onChange("division", e.target.value)}
              className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-800 focus:outline-none focus:border-[#253C7D] focus:ring-1 focus:ring-[#253C7D] cursor-pointer"
            >
              <option value="">Select Division</option>
              {allDivisions.map((div) => (
                <option key={div} value={div}>{div}</option>
              ))}
            </select>
          </div>
        </div>

        {/* 3. Department */}
        <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
          <label className="text-xs font-normal text-slate-700 sm:text-right sm:pr-4">
            Department <span className="text-rose-500">*</span>
          </label>
          <div className="sm:col-span-2">
            <select
              value={form.department || ""}
              onChange={(e) => onChange("department", e.target.value)}
              className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-800 focus:outline-none focus:border-[#253C7D] focus:ring-1 focus:ring-[#253C7D] cursor-pointer"
            >
              <option value="">Select Department</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
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
            <select
              value={currentPos}
              onChange={(e) => {
                onChange("position", e.target.value);
                onChange("role", e.target.value);
              }}
              className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-800 focus:outline-none focus:border-[#253C7D] focus:ring-1 focus:ring-[#253C7D] cursor-pointer"
            >
              <option value="">Select Position</option>
              {allPositions.map((pos) => (
                <option key={pos} value={pos}>{pos}</option>
              ))}
            </select>
          </div>
        </div>

        {/* 7. Employee Type */}
        <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
          <label className="text-xs font-normal text-slate-700 sm:text-right sm:pr-4">
            Employee Type <span className="text-rose-500">*</span>
          </label>
          <div className="sm:col-span-2">
            <select
              value={form.employment_type || "Full-Time"}
              onChange={(e) => onChange("employment_type", e.target.value)}
              className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-800 focus:outline-none focus:border-[#253C7D] focus:ring-1 focus:ring-[#253C7D] cursor-pointer"
            >
              {employeeTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
        </div>

        {/* 8. Supervisor Name */}
        <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
          <label className="text-xs font-normal text-slate-700 sm:text-right sm:pr-4">Supervisor Name</label>
          <div className="sm:col-span-2 relative flex items-center">
            <select
              value={form.reports_to || ""}
              onChange={(e) => {
                const selectedId = e.target.value;
                const matched = buManagers.find((m) => m.id === selectedId);
                onChange("reports_to", selectedId || "");
                onChange("line_manager", matched ? `${matched.first_name} ${matched.last_name}`.trim() : "");
              }}
              className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-800 focus:outline-none focus:border-[#253C7D] focus:ring-1 focus:ring-[#253C7D] cursor-pointer pr-8"
            >
              <option value="">Search / Select Supervisor (Line Manager)...</option>
              {buManagers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.first_name} {m.last_name} ({m.role || "Manager"})
                </option>
              ))}
            </select>
            {(form.reports_to || form.line_manager) && (
              <button
                type="button"
                onClick={() => {
                  onChange("reports_to", "");
                  onChange("line_manager", "");
                }}
                className="absolute right-6 text-slate-400 hover:text-slate-600 cursor-pointer"
                title="Clear Supervisor"
              >
                <i className="ri-close-line text-xs" />
              </button>
            )}
          </div>
        </div>

        {/* 9 & 10. Compensation */}
        <OrgCompensationFields form={form} onChange={onChange} />
      </div>
    </div>
  );
});
