import { memo, useEffect, useMemo } from "react";
import type { Branch, NewHiringRequestFormState } from "../../types";
import { useOrgMasterCategories } from "../../hooks/useOrgMasterCategories";
import { useDivisions } from "@/features/organization/branches/hooks/useDivisions";
import { ModernSearchSelect } from "./ModernSearchSelect";

interface Props {
  form: NewHiringRequestFormState;
  setForm: React.Dispatch<React.SetStateAction<NewHiringRequestFormState>>;
  branches: Branch[];
  standardDepartments: string[];
  isSuperAdmin: boolean;
  assignedBuName: string;
  assignedBuId: string;
  parentBranches: Branch[];
  buSites: Branch[];
}

export const CreateHiringRequestOrgFields = memo(function CreateHiringRequestOrgFields({
  form, setForm, isSuperAdmin, assignedBuName, assignedBuId, parentBranches, buSites,
}: Props) {
  const activeBuId = form.branch_id || assignedBuId;
  const { businessUnits, divisions: catDivisions, departments, workLocations, companies } = useOrgMasterCategories(activeBuId);
  const { divisions: liveDivisions } = useDivisions(activeBuId);

  const allDivisions = useMemo(() => {
    const list = liveDivisions.length > 0 ? liveDivisions : catDivisions;
    return list.filter((d) => (d.status || "active") === "active");
  }, [liveDivisions, catDivisions]);

  const allParentBUs = useMemo(() => {
    if (businessUnits.length > 0) return businessUnits;
    return parentBranches.map((b) => ({ id: b.id, name: b.name, company_name: b.name, status: "active" }));
  }, [businessUnits, parentBranches]);

  const activeBuName = allParentBUs.find((b) => b.id === activeBuId)?.name || form.business_unit || assignedBuName;

  const availableSites = useMemo(() => {
    const list = [
      { id: activeBuId, name: `${activeBuName} (Main Office)` },
      ...workLocations.filter((w) => !w.branch_id || w.branch_id === activeBuId).map((w) => ({ id: w.id, name: w.name })),
      ...buSites.map((b) => ({ id: b.id, name: b.name })),
    ];
    return list.filter((site, idx, arr) => idx === arr.findIndex((s) => s.name === site.name));
  }, [activeBuId, activeBuName, workLocations, buSites]);

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      company: !prev.company && companies.length > 0 ? companies[0] : prev.company,
      site: !prev.site && availableSites.length > 0 ? availableSites[0].name : prev.site,
    }));
  }, [companies, availableSites, setForm]);

  return (
    <div className="bg-white rounded-xl p-3 sm:p-3.5 border border-slate-200/90 shadow-2xs space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-900">
          <i className="ri-git-merge-line text-blue-600 text-sm" />
          <span>Organizational Placement & Structure</span>
        </div>
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${!isSuperAdmin ? "bg-blue-50 text-blue-700 border-blue-100" : "bg-purple-50 text-purple-700 border-purple-100"}`}>
          <i className={!isSuperAdmin ? "ri-shield-check-line text-blue-600 text-xs" : "ri-shield-star-line text-purple-600 text-xs"} />
          <span>{!isSuperAdmin ? "Scoped to Your BU" : "Super Admin Access"}</span>
        </span>
      </div>

      {/* 1. Business Unit & Company */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <div>
          <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Business Unit (BU) <span className="text-rose-500 font-bold">*</span></label>
          {!isSuperAdmin ? (
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400 text-xs"><i className="ri-building-line" /></div>
              <div className="w-full pl-8 pr-3 py-1.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 flex items-center shadow-2xs">{assignedBuName}</div>
            </div>
          ) : (
            <ModernSearchSelect
              options={allParentBUs.map((b) => ({ id: b.id, name: b.name }))}
              value={allParentBUs.find((b) => b.id === form.branch_id)?.name || form.business_unit || ""}
              onChange={(bName) => {
                const chosen = allParentBUs.find((b) => b.name === bName);
                setForm((prev) => ({
                  ...prev,
                  branch_id: chosen?.id || "",
                  business_unit: chosen?.name || bName,
                  company: chosen?.company_name || prev.company,
                  site: chosen?.name ? `${chosen.name} (Main Office)` : prev.site,
                }));
              }}
              icon="ri-building-line"
              placeholder="Select Business Unit..."
              headerTitle="Business Units"
              required
            />
          )}
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Company / Entity <span className="text-rose-500 font-bold">*</span></label>
          <ModernSearchSelect
            options={companies}
            value={form.company || "UNI"}
            onChange={(comp) => setForm((prev) => ({ ...prev, company: comp }))}
            icon="ri-community-line"
            placeholder="Select Company / Entity..."
            headerTitle="Companies"
            required
          />
        </div>
      </div>

      {/* 2. Department & Division */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <div>
          <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Department <span className="text-rose-500 font-bold">*</span></label>
          <ModernSearchSelect
            options={departments.map((d) => ({ id: d.id, name: d.name }))}
            value={form.department}
            onChange={(deptName) => setForm((prev) => ({ ...prev, department: deptName }))}
            icon="ri-team-line"
            placeholder="Select Department"
            headerTitle="Departments"
            required
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Division (Optional)</label>
          <ModernSearchSelect
            options={[
              { id: "none", name: "None / General (Not assigned)" },
              ...allDivisions.map((div) => ({ id: div.id, name: div.name, code: div.code || undefined })),
            ]}
            value={form.division || "None / General (Not assigned)"}
            onChange={(divName) => setForm((prev) => ({ ...prev, division: divName === "None / General (Not assigned)" ? "" : divName }))}
            icon="ri-node-tree"
            placeholder="Select Division..."
            headerTitle="Organization Divisions"
          />
        </div>
      </div>

      {/* 3. Site & Office / Floor / Location */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <div>
          <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Site / Placement</label>
          <ModernSearchSelect
            options={availableSites.map((s) => ({ id: s.id, name: s.name }))}
            value={form.site || `${assignedBuName} (Main Office)`}
            onChange={(siteName) => setForm((prev) => ({ ...prev, site: siteName }))}
            icon="ri-map-pin-2-line"
            placeholder="Select Site..."
            headerTitle="Work Sites & Locations"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Office / Floor / Remote</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400 text-xs">
              <i className="ri-building-2-line" />
            </div>
            <input
              type="text"
              placeholder="e.g. Floor 3, Building A, Remote..."
              value={form.location || ""}
              onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400 shadow-2xs"
            />
          </div>
        </div>
      </div>
    </div>
  );
});

