import { memo, useEffect, useMemo } from "react";
import type { Branch, NewHiringRequestFormState } from "../../types";
import { useOrgMasterCategories } from "../../hooks/useOrgMasterCategories";

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
  form,
  setForm,
  branches,
  isSuperAdmin,
  assignedBuName,
  assignedBuId,
  parentBranches,
  buSites,
}: Props) {
  const activeBuId = form.branch_id || assignedBuId;
  const { businessUnits, divisions, departments, workLocations, companies } = useOrgMasterCategories(activeBuId);

  // Combine parent branches with Org master business units so Super Admin sees every BU in the database
  const allParentBUs = useMemo(() => {
    if (businessUnits.length > 0) {
      return businessUnits;
    }
    return parentBranches.map((b) => ({
      id: b.id,
      name: b.name,
      company_name: b.name,
      status: "active",
    }));
  }, [businessUnits, parentBranches]);

  const activeBuName = allParentBUs.find((b) => b.id === activeBuId)?.name || form.business_unit || assignedBuName;

  // Available sites for this BU (from work_locations and sub-branches)
  const availableSites = useMemo(() => {
    const list = [
      { id: activeBuId, name: `${activeBuName} (Main Office)` },
      ...workLocations
        .filter((w) => !w.branch_id || w.branch_id === activeBuId)
        .map((w) => ({ id: w.id, name: w.name })),
      ...buSites.map((b) => ({ id: b.id, name: b.name })),
    ];
    return list.filter((site, index, self) => index === self.findIndex((s) => s.name === site.name));
  }, [activeBuId, activeBuName, workLocations, buSites]);

  useEffect(() => {
    if (!form.company && companies.length > 0) {
      setForm((prev) => ({ ...prev, company: companies[0] }));
    }
    if (!form.site && availableSites.length > 0) {
      setForm((prev) => ({ ...prev, site: availableSites[0].name }));
    }
  }, [form.company, form.site, companies, availableSites, setForm]);

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
          <i className="ri-git-merge-line text-blue-600" />
          <span>Organizational Placement & Structure</span>
        </div>
        {!isSuperAdmin ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[11px] font-semibold border border-blue-100">
            <i className="ri-shield-check-line text-blue-600" /> Scoped to Your BU
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 text-[11px] font-semibold border border-purple-100">
            <i className="ri-shield-star-line text-purple-600" /> Super Admin Access
          </span>
        )}
      </div>

      {/* 1. Business Unit & Company */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Business Unit (BU) *</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 text-sm">
              <i className="ri-building-line" />
            </div>
            {!isSuperAdmin ? (
              <div className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 flex items-center">
                {assignedBuName}
              </div>
            ) : (
              <>
                <select
                  value={form.branch_id}
                  onChange={(e) => {
                    const bId = e.target.value;
                    const chosen = allParentBUs.find((b) => b.id === bId);
                    setForm((prev) => ({
                      ...prev,
                      branch_id: bId,
                      business_unit: chosen?.name || prev.business_unit,
                      company: chosen?.company_name || prev.company,
                      site: chosen?.name ? `${chosen.name} (Main Office)` : prev.site,
                    }));
                  }}
                  className="w-full pl-9 pr-8 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer appearance-none"
                >
                  <option value="">Select Business Unit...</option>
                  {allParentBUs.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400 text-xs">
                  <i className="ri-arrow-down-s-line" />
                </div>
              </>
            )}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Company / Entity *</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 text-sm">
              <i className="ri-community-line" />
            </div>
            <select
              value={form.company || "UNI"}
              onChange={(e) => setForm({ ...form, company: e.target.value })}
              className="w-full pl-9 pr-8 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer appearance-none"
            >
              {companies.map((comp) => (
                <option key={comp} value={comp}>
                  {comp}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400 text-xs">
              <i className="ri-arrow-down-s-line" />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Department & Division */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Department *</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 text-sm">
              <i className="ri-team-line" />
            </div>
            <select
              required
              value={form.department}
              onChange={(e) => setForm((prev) => ({ ...prev, department: e.target.value }))}
              className="w-full pl-9 pr-8 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer appearance-none"
            >
              <option value="" disabled>Select Department</option>
              {departments.map((d) => (
                <option key={d.id} value={d.name}>{d.name}</option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400 text-xs">
              <i className="ri-arrow-down-s-line" />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Division (Optional)</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 text-sm">
              <i className="ri-node-tree" />
            </div>
            <select
              value={form.division || ""}
              onChange={(e) => setForm({ ...form, division: e.target.value })}
              className="w-full pl-9 pr-8 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer appearance-none"
            >
              <option value="">None / General (Not assigned)</option>
              {divisions.map((div) => (
                <option key={div.id} value={div.name}>
                  {div.name} {div.code ? `(${div.code})` : ""}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400 text-xs">
              <i className="ri-arrow-down-s-line" />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Site & Office / Floor / Location */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Site / Placement</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 text-sm">
              <i className="ri-map-pin-2-line" />
            </div>
            <select
              value={form.site || `${assignedBuName} (Main Office)`}
              onChange={(e) => setForm({ ...form, site: e.target.value })}
              className="w-full pl-9 pr-8 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer appearance-none"
            >
              {availableSites.map((s) => (
                <option key={s.id} value={s.name}>{s.name}</option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400 text-xs">
              <i className="ri-arrow-down-s-line" />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Office / Floor / Remote</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 text-sm">
              <i className="ri-building-2-line" />
            </div>
            <input
              type="text"
              placeholder="e.g. Floor 3, Building A, Remote..."
              value={form.location || ""}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              className="w-full pl-9 pr-8 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400 text-xs">
              <i className="ri-arrow-down-s-line" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
