import { memo, useState } from "react";
import type { Branch, NewHiringRequestFormState } from "../../types";

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
  standardDepartments,
  isSuperAdmin,
  assignedBuName,
  assignedBuId,
  parentBranches,
  buSites,
}: Props) {
  const [isOtherDept, setIsOtherDept] = useState(() => {
    return !!form.department && !standardDepartments.includes(form.department);
  });

  const isCustomDept = isOtherDept || (!!form.department && !standardDepartments.includes(form.department));

  return (
    <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/80 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
          <i className="ri-building-2-line text-[#253C7D]" />
          Business Unit & Organizational Placement
        </span>
        {!isSuperAdmin ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 text-[10px] font-bold border border-blue-200">
            <i className="ri-shield-check-line text-blue-600" /> Scoped to Your BU
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-800 text-[10px] font-bold border border-purple-200">
            <i className="ri-shield-star-line text-purple-600" /> Super Admin Access
          </span>
        )}
      </div>

      {!isSuperAdmin ? (
        <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Business Unit (BU)</span>
            <p className="text-sm font-bold text-slate-900 mt-0.5 flex items-center gap-1.5">
              <i className="ri-building-line text-[#253C7D]" />
              {assignedBuName}
            </p>
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Entity / Company</span>
            <p className="text-sm font-semibold text-slate-800 mt-0.5 flex items-center gap-1.5">
              <i className="ri-community-line text-slate-500" />
              {form.company || "UNI"}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Business Unit (BU) / Branch *</label>
            <select
              value={form.branch_id}
              onChange={(e) => {
                const bId = e.target.value;
                const chosen = branches.find((b) => b.id === bId);
                setForm((prev) => ({ ...prev, branch_id: bId, business_unit: chosen?.name || prev.business_unit }));
              }}
              className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold"
            >
              <option value="">Select Business Unit...</option>
              {parentBranches.map((b) => (
                <option key={b.id} value={b.id}>🏢 {b.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Company / Entity</label>
            <input
              type="text"
              placeholder="e.g. UNI"
              value={form.company}
              onChange={(e) => setForm({ ...form, company: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs"
            />
          </div>
        </div>
      )}

      {/* Department & Division */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Department *</label>
          <select
            required
            value={isCustomDept ? "Other" : form.department}
            onChange={(e) => {
              const val = e.target.value;
              if (val === "Other") {
                setIsOtherDept(true);
                setForm((prev) => ({ ...prev, department: "" }));
              } else {
                setIsOtherDept(false);
                setForm((prev) => ({ ...prev, department: val }));
              }
            }}
            className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-medium cursor-pointer"
          >
            <option value="" disabled>Select Department *</option>
            {standardDepartments.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
            <option value="Other">Other (Type custom department...)</option>
          </select>
          {isCustomDept && (
            <div className="mt-2">
              <input
                type="text"
                required
                placeholder="Type custom department name..."
                value={form.department}
                onChange={(e) => setForm((prev) => ({ ...prev, department: e.target.value }))}
                className="w-full px-3.5 py-2 bg-blue-50/40 border border-blue-200 rounded-xl text-xs font-medium"
                autoFocus
              />
            </div>
          )}
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Division (Optional)</label>
          <input
            type="text"
            placeholder="e.g. Core Operations, Marketing..."
            value={form.division}
            onChange={(e) => setForm({ ...form, division: e.target.value })}
            className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs"
          />
        </div>
      </div>

      {/* Work Site / Placement */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Work Site / Placement</label>
          {buSites.length > 0 ? (
            <select
              value={form.branch_id}
              onChange={(e) => setForm({ ...form, branch_id: e.target.value })}
              className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium"
            >
              <option value={assignedBuId}>🏢 Main Office ({assignedBuName})</option>
              {buSites.map((b) => (
                <option key={b.id} value={b.id}>📍 {b.name}</option>
              ))}
            </select>
          ) : (
            <div className="px-3.5 py-2 bg-gray-100/90 border border-gray-200 rounded-xl text-xs font-medium text-gray-700 flex items-center gap-2">
              <i className="ri-map-pin-2-line text-[#253C7D]" />
              <span>{assignedBuName} (Main Office)</span>
            </div>
          )}
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Office / Floor / Remote</label>
          <input
            type="text"
            placeholder="e.g. Floor 3, Building A, Remote..."
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs"
          />
        </div>
      </div>
    </div>
  );
});
