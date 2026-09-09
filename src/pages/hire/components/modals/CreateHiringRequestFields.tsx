import { memo, useEffect, useState, useMemo } from "react";
import type { SearchableEmployee } from "@/components/EmployeeSearchSelect";
import EmployeeSearchSelect from "@/components/EmployeeSearchSelect";
import type { Branch, NewHiringRequestFormState } from "../../types";
import { DEFAULT_DEPARTMENTS } from "../../constants";

interface CreateHiringRequestFieldsProps {
  form: NewHiringRequestFormState;
  setForm: React.Dispatch<React.SetStateAction<NewHiringRequestFormState>>;
  branches: Branch[];
  departments: string[];
  employees?: SearchableEmployee[];
  isSuperAdmin?: boolean;
  isBranchAdmin?: boolean;
  userBranchId?: string | null;
  userBranchName?: string | null;
}

export const CreateHiringRequestFields = memo(function CreateHiringRequestFields({
  form,
  setForm,
  branches,
  departments,
  employees = [],
  isSuperAdmin = false,
  isBranchAdmin: _isBranchAdmin = false,
  userBranchId,
  userBranchName,
}: CreateHiringRequestFieldsProps) {
  const isReplacement = form.position_type === "replacement";

  // Standard departments without 'Other'
  const standardDepartments = useMemo(() => {
    const list = departments && departments.length > 0 ? departments : DEFAULT_DEPARTMENTS;
    return list.filter((d) => d !== "Other");
  }, [departments]);

  const [isOtherDept, setIsOtherDept] = useState<boolean>(() => {
    return !!form.department && !DEFAULT_DEPARTMENTS.filter((d) => d !== "Other").includes(form.department);
  });

  const isCustomDept = isOtherDept || (!!form.department && !standardDepartments.includes(form.department));

  // Separate parent Business Units and child work sites
  const parentBranches = branches.filter((b) => !b.is_site);
  const siteBranches = branches.filter((b) => b.is_site);

  // Determine active BU name & ID for non-super admins
  const mainBranch =
    branches.find((b) => !b.is_site && (b.id === userBranchId || b.name === userBranchName)) ||
    parentBranches[0];

  const assignedBuName = userBranchName || mainBranch?.name || form.business_unit || "Your Business Unit";
  const assignedBuId = userBranchId || mainBranch?.id || form.branch_id || "";

  // Sites belonging strictly to this BU
  const buSites = siteBranches.filter(
    (s) => s.branch_id === assignedBuId || (!s.branch_id && assignedBuId)
  );

  // Auto-sync form if fields are unpopulated
  useEffect(() => {
    setForm((prev) => {
      const updates: Partial<NewHiringRequestFormState> = {};
      if (!prev.company) updates.company = "UNI";
      if (!isSuperAdmin) {
        if (!prev.business_unit && assignedBuName) updates.business_unit = assignedBuName;
        if (!prev.branch_id && assignedBuId) updates.branch_id = assignedBuId;
      }
      if (Object.keys(updates).length > 0) {
        return { ...prev, ...updates };
      }
      return prev;
    });
  }, [isSuperAdmin, assignedBuName, assignedBuId, setForm]);

  const handleSelectReplacementEmployee = (empId: string) => {
    const target = employees.find((e) => e.id === empId);
    if (target) {
      setForm((prev) => ({
        ...prev,
        replacement_for_id: target.id,
        replacement_for_name: `${target.first_name} ${target.last_name}`,
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        replacement_for_id: "",
        replacement_for_name: "",
      }));
    }
  };

  const handleSelectHiringManager = (empId: string) => {
    const target = employees.find((e) => e.id === empId);
    if (target) {
      setForm((prev) => ({
        ...prev,
        hiring_manager_id: target.id,
        hiring_manager_name: `${target.first_name} ${target.last_name}`,
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        hiring_manager_id: "",
        hiring_manager_name: "",
      }));
    }
  };

  return (
    <div className="space-y-5">
      {/* 1. Header Metadata: Requisition ID & Position Type */}
      <div className="p-3.5 bg-blue-50/70 rounded-2xl border border-blue-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="w-7 h-7 rounded-xl bg-[#253C7D] text-white flex items-center justify-center text-xs font-bold shadow-xs">
            #
          </span>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-blue-900">Requisition ID</p>
            <p className="text-xs text-blue-700 font-mono font-semibold">Auto-generated upon submission (REQ-2026-XXXX)</p>
          </div>
        </div>

        {/* Position Type Switcher */}
        <div className="inline-flex p-1 bg-white rounded-xl border border-blue-200 shadow-2xs">
          <button
            type="button"
            onClick={() =>
              setForm((prev) => ({
                ...prev,
                position_type: "new",
                replacement_for_id: "",
                replacement_for_name: "",
              }))
            }
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              !isReplacement ? "bg-[#253C7D] text-white shadow-xs" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            ✨ New Headcount
          </button>
          <button
            type="button"
            onClick={() => setForm((prev) => ({ ...prev, position_type: "replacement" }))}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              isReplacement ? "bg-[#253C7D] text-white shadow-xs" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            🔄 Replacement
          </button>
        </div>
      </div>

      {/* If Replacement Position: Linked Outgoing Employee */}
      {isReplacement && (
        <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl space-y-2 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
              <i className="ri-user-unfollow-line text-amber-700" />
              Outgoing Employee Being Replaced *
            </div>
            {!isSuperAdmin && (
              <span className="text-[10px] text-amber-800 font-semibold bg-amber-100 px-2 py-0.5 rounded-full">
                🔒 Scoped to {assignedBuName} staff
              </span>
            )}
          </div>
          <p className="text-[11px] text-amber-700">
            Select the departing or transferred employee this requisition is intended to backfill.
          </p>
          <EmployeeSearchSelect
            employees={employees}
            value={form.replacement_for_id}
            onChange={handleSelectReplacementEmployee}
            placeholder={
              employees.length > 0
                ? "Search departing employee by name, department, or role..."
                : "No employees registered in your BU yet"
            }
          />
          {form.replacement_for_name && (
            <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100 text-amber-900 rounded-lg text-xs font-semibold">
              <i className="ri-check-line text-emerald-600 font-bold" /> Replacing staff member:{" "}
              <strong>{form.replacement_for_name}</strong>
            </div>
          )}
        </div>
      )}

      {/* 2. Position Title, Headcount & Priority */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        <div className="sm:col-span-6">
          <label className="block text-xs font-semibold text-gray-700 mb-1">Position Title *</label>
          <input
            type="text"
            required
            placeholder="e.g. Senior Operations Officer, Branch Accountant"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#253C7D] focus:bg-white transition-all font-medium"
          />
        </div>
        <div className="sm:col-span-3">
          <label className="block text-xs font-semibold text-gray-700 mb-1">Headcount *</label>
          <input
            type="number"
            min="1"
            max="100"
            required
            value={form.headcount}
            onChange={(e) => setForm({ ...form, headcount: Math.max(1, parseInt(e.target.value) || 1) })}
            className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#253C7D] focus:bg-white transition-all font-medium"
          />
        </div>
        <div className="sm:col-span-3">
          <label className="block text-xs font-semibold text-gray-700 mb-1">Priority / Urgency</label>
          <select
            value={form.urgency}
            onChange={(e) => setForm({ ...form, urgency: e.target.value as any })}
            className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#253C7D] focus:bg-white transition-all cursor-pointer font-medium"
          >
            <option value="low">🟢 Low</option>
            <option value="medium">🟡 Medium</option>
            <option value="high">🟠 High</option>
            <option value="urgent">🔴 Urgent</option>
          </select>
        </div>
      </div>

      {/* 3. Organization Placement: Scoped strictly to BU for BU CEO Admin */}
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

        {/* BU CEO Admin View: Locked, clear, unmistakable BU presentation */}
        {!isSuperAdmin ? (
          <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Business Unit (BU)
              </span>
              <p className="text-sm font-bold text-slate-900 mt-0.5 flex items-center gap-1.5">
                <i className="ri-building-line text-[#253C7D]" />
                {assignedBuName}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">
                You are managing requisitions within your Business Unit. Other BUs cannot be accessed.
              </p>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Entity / Company
              </span>
              <p className="text-sm font-semibold text-slate-800 mt-0.5 flex items-center gap-1.5">
                <i className="ri-community-line text-slate-500" />
                {form.company || "UNI"}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Enterprise Corporate Entity
              </p>
            </div>
          </div>
        ) : (
          /* Super Admin View: Select BU from parent branches */
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Business Unit (BU) / Branch *
              </label>
              <select
                value={form.branch_id}
                onChange={(e) => {
                  const bId = e.target.value;
                  const chosen = branches.find((b) => b.id === bId);
                  setForm((prev) => ({
                    ...prev,
                    branch_id: bId,
                    business_unit: chosen?.name || prev.business_unit,
                  }));
                }}
                className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#253C7D] transition-all cursor-pointer font-semibold"
              >
                <option value="">Select Business Unit...</option>
                {parentBranches.map((b) => (
                  <option key={b.id} value={b.id}>
                    🏢 {b.name}
                  </option>
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
                className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#253C7D] transition-all"
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
              className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#253C7D] transition-all font-medium cursor-pointer"
            >
              <option value="" disabled>Select Department *</option>
              {standardDepartments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
              <option value="Other">Other (Type custom department...)</option>
            </select>

            {isCustomDept && (
              <div className="mt-2 animate-in fade-in slide-in-from-top-1 duration-150">
                <input
                  type="text"
                  required
                  placeholder="Type custom department name..."
                  value={form.department}
                  onChange={(e) => setForm((prev) => ({ ...prev, department: e.target.value }))}
                  className="w-full px-3.5 py-2 bg-blue-50/40 border border-blue-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#253C7D] transition-all font-medium placeholder-gray-400"
                  autoFocus
                />
              </div>
            )}
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Division (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Core Operations, Customer Experience..."
              value={form.division}
              onChange={(e) => setForm({ ...form, division: e.target.value })}
              className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#253C7D] transition-all"
            />
          </div>
        </div>

        {/* Work Location & Placement */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Work Site / Placement</label>
            {buSites.length > 0 ? (
              <select
                value={form.branch_id}
                onChange={(e) => setForm({ ...form, branch_id: e.target.value })}
                className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#253C7D] transition-all cursor-pointer font-medium"
              >
                <option value={assignedBuId}>🏢 Main Office ({assignedBuName})</option>
                {buSites.map((b) => (
                  <option key={b.id} value={b.id}>
                    📍 {b.name} (Site Location)
                  </option>
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
            <label className="block text-xs font-semibold text-gray-700 mb-1">Specific Office / Floor / Remote</label>
            <input
              type="text"
              placeholder="e.g. Floor 3, Building A, Remote / Hybrid..."
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#253C7D] transition-all"
            />
          </div>
        </div>
      </div>

      {/* 4. Employment Type, Salary Range & Target Joining Date */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        <div className="sm:col-span-4">
          <label className="block text-xs font-semibold text-gray-700 mb-1">Employment Type</label>
          <select
            value={form.employment_type}
            onChange={(e) => setForm({ ...form, employment_type: e.target.value })}
            className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#253C7D] focus:bg-white transition-all cursor-pointer font-medium"
          >
            <option value="full-time">Full-Time</option>
            <option value="part-time">Part-Time</option>
            <option value="contract">Contract</option>
            <option value="internship">Internship</option>
          </select>
        </div>
        <div className="sm:col-span-4">
          <label className="block text-xs font-semibold text-gray-700 mb-1">Expected Salary Min ($)</label>
          <input
            type="number"
            placeholder="e.g. 500"
            value={form.salary_min}
            onChange={(e) => setForm({ ...form, salary_min: e.target.value })}
            className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#253C7D] focus:bg-white transition-all"
          />
        </div>
        <div className="sm:col-span-4">
          <label className="block text-xs font-semibold text-gray-700 mb-1">Expected Salary Max ($)</label>
          <input
            type="number"
            placeholder="e.g. 1000"
            value={form.salary_max}
            onChange={(e) => setForm({ ...form, salary_max: e.target.value })}
            className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#253C7D] focus:bg-white transition-all"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Target Joining Date</label>
          <input
            type="date"
            value={form.target_joining_date}
            onChange={(e) => setForm({ ...form, target_joining_date: e.target.value })}
            className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#253C7D] focus:bg-white transition-all cursor-pointer font-medium"
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-semibold text-gray-700">Hiring Manager</label>
            {!isSuperAdmin && (
              <span className="text-[10px] text-gray-500 font-medium">
                Scoped to {assignedBuName}
              </span>
            )}
          </div>
          <EmployeeSearchSelect
            employees={employees}
            value={form.hiring_manager_id}
            onChange={handleSelectHiringManager}
            placeholder={
              employees.length > 0
                ? "Search hiring manager within your BU..."
                : "No employees registered in this BU yet"
            }
          />
        </div>
      </div>

      {/* 5. Reason for Hiring & Job Description */}
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Reason for Hiring / Business Need *
          </label>
          <textarea
            rows={2}
            required
            placeholder="Explain the business reason for this hire (e.g. team workload expansion, new client contract, replacement justification)..."
            value={form.justification}
            onChange={(e) => setForm({ ...form, justification: e.target.value })}
            className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#253C7D] focus:bg-white transition-all resize-none font-medium"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Job Description & Key Requirements
          </label>
          <textarea
            rows={3}
            placeholder="Key role responsibilities, required skills, technical stack, qualifications, or experience level..."
            value={form.job_description}
            onChange={(e) => setForm({ ...form, job_description: e.target.value })}
            className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#253C7D] focus:bg-white transition-all resize-none font-medium"
          />
        </div>
      </div>
    </div>
  );
});
