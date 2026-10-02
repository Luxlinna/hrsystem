import { memo } from "react";
import type { EditHiringFormData } from "./types";

interface EditHiringOrgTabProps {
  formData: EditHiringFormData;
  onChange: (field: keyof EditHiringFormData, value: string) => void;
  cleanBranches: Array<{ id: string; name: string; location: string | null }>;
  currentBranch: { id: string; name: string; location: string | null } | null;
  currentBranchName: string;
  workSites: Array<{ id: string; name: string; description: string | null; branch_id: string | null }>;
  currentSiteSelectValue: string;
  onSelectBranch: (branchId: string) => void;
  onSelectSite: (siteIdOrVal: string) => void;
}

export const EditHiringOrgTab = memo(function EditHiringOrgTab({
  formData,
  onChange,
  cleanBranches,
  currentBranch,
  currentBranchName,
  workSites,
  currentSiteSelectValue,
  onSelectBranch,
  onSelectSite,
}: EditHiringOrgTabProps) {
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

      {/* Part 1 & Part 2: Main Branch and Sub-Branch Selector Card */}
      <div className="p-4 bg-gradient-to-r from-slate-50 via-indigo-50/20 to-slate-50 border border-slate-200/90 rounded-2xl shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-[#253C7D] text-white flex items-center justify-center text-xs">
              <i className="ri-map-pin-2-fill text-xs" />
            </span>
            <h4 className="text-xs font-bold text-slate-800">Branch &amp; Physical Site Stationing</h4>
          </div>
          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200/60">
            HR Selectable
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Part 1: Main Branch */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Part 1: Main Branch *
            </label>
            <select
              required
              value={currentBranch?.id || ""}
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
            {workSites.length > 0 ? (
              <select
                value={currentSiteSelectValue}
                onChange={(e) => onSelectSite(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-emerald-300 bg-emerald-50/20 rounded-xl text-xs font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#253C7D] cursor-pointer shadow-2xs"
              >
                <option value="">Main Office ({currentBranchName})</option>
                {workSites.map((site) => (
                  <option key={site.id} value={site.id}>
                    📍 {site.name} (Sub-Branch)
                  </option>
                ))}
              </select>
            ) : (
              <div className="w-full px-3.5 py-2.5 bg-gray-100/70 border border-gray-200 rounded-xl text-xs text-gray-500 font-medium flex items-center justify-between">
                <span>Main Office ({currentBranchName})</span>
                <span className="text-[10px] text-gray-400">No sub-branches</span>
              </div>
            )}
            <p className="text-[10px] text-gray-400 mt-1">
              {workSites.length > 0
                ? "Select specific sub-branch/site (e.g. KampongThom) or keep as Main Office."
                : "This branch operates only at its main office location."}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Code BU */}
        <div>
          <label className="block text-xs font-extrabold text-slate-700 mb-1">
            Code BU (Business Unit Code)
          </label>
          <input
            type="text"
            value={formData.code_bu}
            onChange={(e) => onChange("code_bu", e.target.value)}
            placeholder="e.g. BU-HQ, BU-HR, BU-OPS, BU-PINEX"
            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-[#253C7D]"
          />
        </div>

        {/* BU Full Name */}
        <div>
          <label className="block text-xs font-extrabold text-slate-700 mb-1">
            BU Full Name
          </label>
          <input
            type="text"
            value={formData.bu_full_name}
            onChange={(e) => onChange("bu_full_name", e.target.value)}
            placeholder="e.g. Corporate Headquarters, HR Division, Pinex Agro"
            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#253C7D]"
          />
        </div>

        {/* Handle BU */}
        <div>
          <label className="block text-xs font-extrabold text-slate-700 mb-1">
            Handle BU (Operating Unit Handle)
          </label>
          <input
            type="text"
            value={formData.handle_bu}
            onChange={(e) => onChange("handle_bu", e.target.value)}
            placeholder="e.g. BU-HQ, BU-HR, BU-OPS"
            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#253C7D]"
          />
        </div>

        {/* Division */}
        <div>
          <label className="block text-xs font-extrabold text-slate-700 mb-1">
            Division
          </label>
          <input
            type="text"
            list="division-options"
            value={formData.division}
            onChange={(e) => onChange("division", e.target.value)}
            placeholder="e.g. Technology & Operations, Human Resources"
            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#253C7D]"
          />
          <datalist id="division-options">
            <option value="Technology & Operations" />
            <option value="Human Resources" />
            <option value="Executive & Corporate" />
            <option value="Agricultural Operations" />
            <option value="Operations & Logistics" />
            <option value="Finance & Administration" />
            <option value="Sales & Marketing" />
          </datalist>
        </div>

        {/* Department */}
        <div>
          <label className="block text-xs font-extrabold text-slate-700 mb-1">
            Department
          </label>
          <input
            type="text"
            list="department-options"
            value={formData.department}
            onChange={(e) => onChange("department", e.target.value)}
            placeholder="e.g. Software Development, IT, HR, Production"
            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#253C7D]"
          />
          <datalist id="department-options">
            <option value="Software Development" />
            <option value="IT" />
            <option value="HR" />
            <option value="Production" />
            <option value="Green Zone" />
            <option value="Accounting & Finance" />
            <option value="Operations" />
            <option value="Administration" />
            <option value="Quality Assurance" />
          </datalist>
        </div>

        {/* Position */}
        <div>
          <label className="block text-xs font-extrabold text-slate-700 mb-1">
            Position / Job Title
          </label>
          <input
            type="text"
            value={formData.position}
            onChange={(e) => onChange("position", e.target.value)}
            placeholder="e.g. Senior Software Engineer"
            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#253C7D]"
          />
        </div>

        {/* Site (Physical Workplace Station) */}
        <div>
          <label className="block text-xs font-extrabold text-slate-700 mb-1">
            Workplace Site
          </label>
          <input
            type="text"
            readOnly
            value={formData.site}
            placeholder="Auto-assigned from Part 2 above"
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 cursor-not-allowed select-none"
          />
        </div>

        {/* Working Location (City / Province) */}
        <div>
          <label className="block text-xs font-extrabold text-slate-700 mb-1">
            Working Location (City / Region)
          </label>
          <input
            type="text"
            value={formData.working_location}
            onChange={(e) => onChange("working_location", e.target.value)}
            placeholder="e.g. Phnom Penh, Siem Reap, Sihanoukville"
            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#253C7D]"
          />
        </div>
      </div>
    </div>
  );
});
