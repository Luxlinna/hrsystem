import { memo } from "react";
import type { EmployeeFormState } from "../../../types";
import { SearchableSelect } from "@/components/SearchableSelect";

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
  const branchOptions = cleanBranches.map((b) => ({
    value: b.id,
    label: b.name,
    sublabel: b.location || undefined,
  }));

  const siteOptions = workSites.map((site) => ({
    value: site.id,
    label: site.name,
    sublabel: site.description || undefined,
  }));

  return (
    <>
      {/* Business Unit (BU) */}
      {cleanBranches.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
          <label className="text-xs font-normal text-slate-700 sm:text-right sm:pr-4">
            Business Unit (BU) <span className="text-rose-500">*</span>
          </label>
          <div className="sm:col-span-2">
            <SearchableSelect
              options={branchOptions}
              value={form.branch_id || ""}
              onChange={(val) => onSelectBranch?.(val)}
              placeholder="Select Business Unit"
              searchPlaceholder="Search Business Unit..."
              required
              showClear
            />
          </div>
        </div>
      )}

      {/* Site */}
      <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
        <label className="text-xs font-normal text-slate-700 sm:text-right sm:pr-4">
          Site <span className="text-rose-500">*</span>
        </label>
        <div className="sm:col-span-2 flex items-center gap-1.5">
          <div className="flex-1">
            <SearchableSelect
              options={siteOptions}
              value={form.default_work_location_id || form.site || ""}
              onChange={(val) => onSelectSite(val)}
              placeholder="Select Site"
              searchPlaceholder="Search site..."
              showClear
            />
          </div>
          <button
            type="button"
            onClick={() => onSelectSite("")}
            className="p-1.5 text-slate-500 hover:text-[#253C7D] hover:bg-slate-100 rounded border border-slate-300 cursor-pointer shrink-0"
            title="Reset Site"
          >
            <i className="ri-refresh-line text-xs" />
          </button>
        </div>
      </div>
    </>
  );
});
