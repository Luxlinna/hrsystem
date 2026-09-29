import { memo } from "react";
import type { EmployeeFormState } from "../../../types";
import type { ModalManagerEmployee } from "../types";

interface OrgJoiningInfoSectionProps {
  form: EmployeeFormState;
  onChange: (field: keyof EmployeeFormState, value: any) => void;
  workSites: Array<{ id: string; name: string; description: string | null; branch_id: string | null }>;
  currentBranchName?: string;
  onSelectSite: (siteIdOrVal: string) => void;
  buManagers?: ModalManagerEmployee[];
  departments?: string[];
  positions?: string[];
  employeeTypes?: string[];
}

export const OrgJoiningInfoSection = memo(function OrgJoiningInfoSection({
  form,
  onChange,
  workSites,
  currentBranchName,
  onSelectSite,
  buManagers = [],
  departments = [],
  positions = [],
  employeeTypes = [],
}: OrgJoiningInfoSectionProps) {
  const currentPos = form.position || form.role || "";
  const allPositions = currentPos && !positions.includes(currentPos)
    ? [currentPos, ...positions]
    : positions;

  return (
    <div className="space-y-4">
      <h3 className="text-xs font-bold text-[#0088cc] uppercase tracking-wider">Joining Info</h3>
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
              className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-800 focus:outline-none focus:border-[#0088cc]"
            />
          </div>
        </div>

        {/* 2. Site */}
        <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
          <label className="text-xs font-normal text-slate-700 sm:text-right sm:pr-4">
            Site <span className="text-rose-500">*</span>
          </label>
          <div className="sm:col-span-2 flex items-center gap-1.5">
            <select
              value={form.default_work_location_id || ""}
              onChange={(e) => onSelectSite(e.target.value)}
              className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-800 focus:outline-none focus:border-[#0088cc] cursor-pointer"
            >
              <option value="">Select Site ({currentBranchName || "Main Office"})</option>
              {workSites.map((site) => (
                <option key={site.id} value={site.id}>{site.name}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => onSelectSite("")}
              className="p-1.5 text-slate-500 hover:text-[#0088cc] hover:bg-slate-100 rounded border border-slate-300 cursor-pointer"
              title="Reset Site"
            >
              <i className="ri-refresh-line text-xs" />
            </button>
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
              className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-800 focus:outline-none focus:border-[#0088cc] cursor-pointer"
            >
              <option value="">Select Department</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
        </div>

        {/* 4. Position Dropdown */}
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
              className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-800 focus:outline-none focus:border-[#0088cc] cursor-pointer"
            >
              <option value="">Select Position</option>
              {allPositions.map((pos) => (
                <option key={pos} value={pos}>{pos}</option>
              ))}
            </select>
          </div>
        </div>

        {/* 5. Employee Type */}
        <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
          <label className="text-xs font-normal text-slate-700 sm:text-right sm:pr-4">
            Employee Type <span className="text-rose-500">*</span>
          </label>
          <div className="sm:col-span-2">
            <select
              value={form.employment_type || "Full-Time"}
              onChange={(e) => onChange("employment_type", e.target.value)}
              className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-800 focus:outline-none focus:border-[#0088cc] cursor-pointer"
            >
              {employeeTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
        </div>

        {/* 6. Supervisor Name */}
        <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
          <label className="text-xs font-normal text-slate-700 sm:text-right sm:pr-4">Supervisor Name</label>
          <div className="sm:col-span-2 relative flex items-center">
            <select
              value={form.reports_to || form.line_manager || ""}
              onChange={(e) => {
                onChange("reports_to", e.target.value);
                onChange("line_manager", e.target.value);
              }}
              className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-800 focus:outline-none focus:border-[#0088cc] cursor-pointer pr-8"
            >
              <option value="">Search / Select Supervisor (Line Manager)...</option>
              {buManagers.map((m) => (
                <option key={m.id} value={`${m.first_name} ${m.last_name}`}>
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

        {/* 7. Salary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
          <label className="text-xs font-normal text-slate-700 sm:text-right sm:pr-4">
            Salary <span className="text-rose-500">*</span>
          </label>
          <div className="sm:col-span-2 flex rounded border border-slate-300 bg-white overflow-hidden">
            <select
              value={form.tax_salary_currency || "USD"}
              onChange={(e) => onChange("tax_salary_currency", e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 text-slate-700 text-xs border-r border-slate-300 focus:outline-none cursor-pointer"
            >
              <option value="USD">USD</option>
              <option value="KHR">KHR</option>
            </select>
            <input
              type="number"
              value={form.basic_salary ?? 0}
              onChange={(e) => {
                const val = e.target.value;
                onChange("basic_salary", val);
                onChange("tax_salary", val);
                if (!form.contract_rate) onChange("contract_rate", val);
              }}
              placeholder="0"
              className="flex-1 px-3 py-1.5 text-xs font-mono text-slate-800 focus:outline-none"
            />
            <select
              value={form.tax_salary_frequency || "Monthly"}
              onChange={(e) => onChange("tax_salary_frequency", e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 text-slate-700 text-xs border-l border-slate-300 focus:outline-none cursor-pointer"
            >
              <option value="Monthly">Monthly</option>
              <option value="Hourly">Hourly</option>
              <option value="Daily">Daily</option>
            </select>
          </div>
        </div>

        {/* 8. Salary Type */}
        <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
          <label className="text-xs font-normal text-slate-700 sm:text-right sm:pr-4">
            Salary Type <span className="text-rose-500">*</span>
          </label>
          <div className="sm:col-span-2">
            <select
              value={form.payroll_structure || "Gross"}
              onChange={(e) => onChange("payroll_structure", e.target.value)}
              className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-800 focus:outline-none focus:border-[#0088cc] cursor-pointer"
            >
              <option value="Gross">Gross</option>
              <option value="Net">Net</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
});
