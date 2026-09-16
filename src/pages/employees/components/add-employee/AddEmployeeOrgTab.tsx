import { memo } from "react";
import type { EmployeeFormState } from "../../types";
import { OrgHierarchyFields } from "./org";

interface AddEmployeeOrgTabProps {
  form: EmployeeFormState;
  onChange: (field: keyof EmployeeFormState, value: any) => void;
  cleanBranches: Array<{ id: string; name: string; location: string | null }>;
  currentBranch: { id: string; name: string; location: string | null } | null;
  currentBranchName: string;
  workSites: Array<{ id: string; name: string; description: string | null; branch_id: string | null }>;
  currentSiteSelectValue: string;
  onSelectBranch: (branchId: string) => void;
  onSelectSite: (siteIdOrVal: string) => void;
}

export const AddEmployeeOrgTab = memo(function AddEmployeeOrgTab({
  form,
  onChange,
  cleanBranches,
  currentBranch,
  currentBranchName,
  workSites,
  currentSiteSelectValue,
  onSelectBranch,
  onSelectSite,
}: AddEmployeeOrgTabProps) {
  return (
    <div className="space-y-4">
      <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50/90 via-teal-50/40 to-white border border-emerald-200/80 flex items-start gap-3.5 shadow-2xs">
        <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
          <i className="ri-building-2-line text-lg" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-xs font-black text-slate-900 tracking-wide">
              Organizational Placement &amp; Physical Work Station
            </h3>
            <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200/60">
              Step 2 of 5
            </span>
          </div>
          <p className="text-[11px] text-slate-600 font-medium mt-0.5 leading-relaxed">
            Select authoritative Main Branch and Sub-Branch/Work Location directly from database configurations with synchronized codes.
          </p>
        </div>
      </div>

      {/* Main Branch and Sub-Branch Selector Card */}
      <div className="p-4 bg-gradient-to-r from-slate-50 via-indigo-50/20 to-slate-50 border border-slate-200/90 rounded-2xl shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-[#253C7D] text-white flex items-center justify-center text-xs">
              <i className="ri-map-pin-2-fill text-xs" />
            </span>
            <h4 className="text-xs font-bold text-slate-800">Branch &amp; Physical Site Stationing</h4>
          </div>
          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200/60">
            Database Linked
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Part 1: Main Branch */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Part 1: Main Branch (BU) *
            </label>
            <select
              required
              value={currentBranch?.id || form.branch_id || ""}
              onChange={(e) => onSelectBranch(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#253C7D] bg-white cursor-pointer shadow-2xs"
            >
              <option value="">Select Main Branch</option>
              {cleanBranches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* Part 2: Sub-Branch / Location */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Part 2: Sub-Branch / Work Location
            </label>
            <select
              value={currentSiteSelectValue}
              onChange={(e) => onSelectSite(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-emerald-300 bg-emerald-50/20 rounded-xl text-xs font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#253C7D] cursor-pointer shadow-2xs"
            >
              <option value="">Main Office ({currentBranchName || "Main Office"})</option>
              {workSites.map((site) => (
                <option key={site.id} value={site.id}>
                  📍 {site.name} (Sub-Branch)
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Synchronized Organizational Hierarchy Details */}
      <OrgHierarchyFields form={form} onChange={onChange} />
    </div>
  );
});
