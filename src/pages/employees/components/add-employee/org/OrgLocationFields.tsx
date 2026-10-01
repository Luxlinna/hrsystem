import { memo } from "react";
import type { EmployeeFormState } from "../../../types";

interface OrgLocationFieldsProps {
  form: EmployeeFormState;
  cleanBranches?: Array<{ id: string; name: string; location?: string | null }>;
  currentBranchName?: string;
  workSites: Array<{ id: string; name: string; description: string | null; branch_id: string | null }>;
  onSelectBranch?: (branchId: string) => void;
  onSelectSite: (siteIdOrVal: string) => void;
}

export const OrgLocationFields = memo(function OrgLocationFields({
  form,
  cleanBranches = [],
  currentBranchName,
  workSites,
  onSelectBranch,
  onSelectSite,
}: OrgLocationFieldsProps) {
  return (
    <>
      {/* Business Unit (BU) */}
      {cleanBranches.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
          <label className="text-xs font-normal text-slate-700 sm:text-right sm:pr-4">
            Business Unit (BU) <span className="text-rose-500">*</span>
          </label>
          <div className="sm:col-span-2">
            <select
              value={form.branch_id || ""}
              onChange={(e) => onSelectBranch?.(e.target.value)}
              className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-800 focus:outline-none focus:border-[#253C7D] focus:ring-1 focus:ring-[#253C7D] cursor-pointer"
            >
              <option value="">Select Business Unit</option>
              {cleanBranches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Site */}
      <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
        <label className="text-xs font-normal text-slate-700 sm:text-right sm:pr-4">
          Site <span className="text-rose-500">*</span>
        </label>
        <div className="sm:col-span-2 flex items-center gap-1.5">
          <select
            value={form.default_work_location_id || ""}
            onChange={(e) => onSelectSite(e.target.value)}
            className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-800 focus:outline-none focus:border-[#253C7D] focus:ring-1 focus:ring-[#253C7D] cursor-pointer"
          >
            <option value="">
              {form.branch_id && currentBranchName ? `Main Office (${currentBranchName})` : "Select Site"}
            </option>
            {workSites.map((site) => (
              <option key={site.id} value={site.id}>{site.name}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => onSelectSite("")}
            className="p-1.5 text-slate-500 hover:text-[#253C7D] hover:bg-slate-100 rounded border border-slate-300 cursor-pointer"
            title="Reset Site"
          >
            <i className="ri-refresh-line text-xs" />
          </button>
        </div>
      </div>
    </>
  );
});
