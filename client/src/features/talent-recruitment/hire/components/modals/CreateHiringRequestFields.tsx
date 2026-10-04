import { memo, useEffect, useMemo } from "react";
import type { SearchableEmployee } from "@/components/EmployeeSearchSelect";
import EmployeeSearchSelect from "@/components/EmployeeSearchSelect";
import type { Branch, NewHiringRequestFormState } from "../../types";
import { DEFAULT_DEPARTMENTS } from "../../constants";
import { BU_DEFAULT_POSITIONS } from "@/features/workforce/employees/constants";
import { CreateHiringRequestOrgFields } from "./CreateHiringRequestOrgFields";
import { CreateHiringRequestRoleFields } from "./CreateHiringRequestRoleFields";
import { JobDescriptionFormFields } from "./JobDescriptionFormFields";
import { useOrgMasterCategories } from "../../hooks/useOrgMasterCategories";

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
  targetBranch?: string | null;
  activeStep?: 1 | 2 | 3;
  setActiveStep?: (step: 1 | 2 | 3) => void;
}

export const CreateHiringRequestFields = memo(function CreateHiringRequestFields({
  form,
  setForm,
  branches,
  departments,
  employees = [],
  isSuperAdmin = false,
  userBranchId,
  userBranchName,
  targetBranch,
  activeStep = 1,
}: CreateHiringRequestFieldsProps) {
  const isReplacement = form.position_type === "replacement";
  const orgCategories = useOrgMasterCategories();

  const standardDepartments = useMemo(() => {
    const list = departments && departments.length > 0 ? departments : DEFAULT_DEPARTMENTS;
    return list.filter((d) => d !== "Other");
  }, [departments]);

  const parentBranches = branches.filter((b) => !b.is_site);
  const siteBranches = branches.filter((b) => b.is_site);

  const activeBranch =
    branches.find((b) => !b.is_site && b.id === targetBranch) ||
    parentBranches.find((b) => b.id === targetBranch) ||
    (form.business_unit ? parentBranches.find((b) => b.name === form.business_unit) : null) ||
    (userBranchId ? parentBranches.find((b) => b.id === userBranchId) : null) ||
    (userBranchName ? parentBranches.find((b) => b.name === userBranchName) : null) ||
    parentBranches[0];

  const assignedBuName = form.business_unit || activeBranch?.name || userBranchName || "Your Business Unit";
  const assignedBuId = form.branch_id || activeBranch?.id || userBranchId || "";
  const buSites = siteBranches.filter((s) => s.branch_id === assignedBuId || (!s.branch_id && assignedBuId));

  // Scope employees to this Business Unit (and its sub-sites)
  const buBranchIds = useMemo(() => {
    const ids = new Set<string>();
    if (assignedBuId) ids.add(assignedBuId);
    buSites.forEach((s) => ids.add(s.id));
    return ids;
  }, [assignedBuId, buSites]);

  const buEmployees = useMemo(() => {
    if (buBranchIds.size === 0) return employees;
    return employees.filter((e) => !e.branch_id || buBranchIds.has(e.branch_id));
  }, [employees, buBranchIds]);

  // For Hiring Manager: ONLY managers at this BU can request / be selected
  const buManagers = useMemo(() => {
    const managers = buEmployees.filter((e) => e.is_manager);
    return managers.length > 0 ? managers : buEmployees;
  }, [buEmployees]);

  useEffect(() => {
    setForm((prev) => {
      const updates: Partial<NewHiringRequestFormState> = {};
      if (!prev.company) updates.company = "UNI";
      if (!isSuperAdmin) {
        if (!prev.business_unit && assignedBuName) updates.business_unit = assignedBuName;
        if (!prev.branch_id && assignedBuId) updates.branch_id = assignedBuId;
      }
      return Object.keys(updates).length > 0 ? { ...prev, ...updates } : prev;
    });
  }, [isSuperAdmin, assignedBuName, assignedBuId, setForm]);

  const handleSelectReplacementEmployee = (empId: string) => {
    const target = buEmployees.find((e) => e.id === empId);
    setForm((prev) => ({
      ...prev,
      replacement_for_id: target ? target.id : "",
      replacement_for_name: target ? `${target.first_name} ${target.last_name}` : "",
    }));
  };

  // Step 3: Job Description & Specifications
  if (activeStep === 3) {
    return (
      <div className="space-y-4 animate-in fade-in duration-200">
        <JobDescriptionFormFields form={form} setForm={setForm} />
      </div>
    );
  }

  // Step 2: Role Terms, Contract & Compensation
  if (activeStep === 2) {
    return (
      <div className="space-y-4 animate-in fade-in duration-200">
        <CreateHiringRequestRoleFields
          form={form}
          setForm={setForm}
          branches={branches}
          employees={buManagers}
          isSuperAdmin={isSuperAdmin}
          assignedBuName={assignedBuName}
        />
      </div>
    );
  }

  // Step 1: Placement & Position Details
  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* 1. Header Metadata & Position Type */}
      <div className="p-3.5 sm:p-4 bg-blue-50/50 rounded-2xl border border-blue-100/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-100/80 text-blue-600 flex items-center justify-center text-lg shrink-0">
            <i className="ri-file-text-line" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Requisition ID</p>
            <p className="text-xs text-slate-900 font-bold">
              Auto-generated upon submission <span className="font-mono text-slate-600 font-semibold">(REQ-2026-XXXX)</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setForm((p) => ({ ...p, position_type: "new", replacement_for_id: "", replacement_for_name: "" }))}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              !isReplacement
                ? "bg-white border-2 border-blue-600 text-blue-600 shadow-2xs"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            <i className="ri-add-circle-fill text-blue-600 text-sm" />
            <span>New Headcount</span>
          </button>
          <button
            type="button"
            onClick={() => setForm((p) => ({ ...p, position_type: "replacement" }))}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              isReplacement
                ? "bg-white border-2 border-blue-600 text-blue-600 shadow-2xs"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            <i className="ri-arrow-left-right-line text-slate-500 text-sm" />
            <span>Replacement</span>
          </button>
        </div>
      </div>

      {isReplacement && (
        <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl space-y-2">
          <label className="block text-xs font-bold text-amber-900">Outgoing Employee Being Replaced *</label>
          <EmployeeSearchSelect
            employees={buEmployees}
            value={form.replacement_for_id}
            onChange={handleSelectReplacementEmployee}
            placeholder="Search departing employee in this BU..."
          />
        </div>
      )}

      {/* 2. Position Title, Headcount & Priority */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 space-y-3 shadow-2xs">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
          <i className="ri-building-line text-blue-600" />
          <span>Position / Job Title</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 items-end">
          <div className="sm:col-span-6">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 text-sm">
                <i className="ri-briefcase-line" />
              </div>
              <select
                required
                value={form.title || form.position || ""}
                onChange={(e) => {
                  const val = e.target.value;
                  setForm({ ...form, title: val, position: val });
                }}
                className="w-full pl-9 pr-8 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer appearance-none"
              >
                <option value="" disabled>Select Position from Org...</option>
                {orgCategories.positions.length > 0 && (
                  <optgroup label="Org Master Positions">
                    {orgCategories.positions.map((pos) => (
                      <option key={pos.id} value={pos.name}>
                        {pos.name}
                      </option>
                    ))}
                  </optgroup>
                )}
                <optgroup label="Standard Positions">
                  {BU_DEFAULT_POSITIONS.filter(
                    (p) => !orgCategories.positions.some((pos) => pos.name.toLowerCase() === p.toLowerCase())
                  ).map((pos) => (
                    <option key={pos} value={pos}>
                      {pos}
                    </option>
                  ))}
                </optgroup>
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400 text-xs">
                <i className="ri-arrow-down-s-line" />
              </div>
            </div>
          </div>
          <div className="sm:col-span-3">
            <label className="block text-xs font-semibold text-slate-700 mb-1">Headcount *</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 text-xs">
                <i className="ri-user-line" />
              </div>
              <input
                type="number"
                min="1"
                max="100"
                required
                value={form.headcount}
                onChange={(e) => setForm({ ...form, headcount: Math.max(1, parseInt(e.target.value) || 1) })}
                className="w-full pl-8 pr-3 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>
          </div>
          <div className="sm:col-span-3">
            <label className="block text-xs font-semibold text-slate-700 mb-1">Priority</label>
            <div className="relative">
              <select
                value={form.urgency}
                onChange={(e) => setForm({ ...form, urgency: e.target.value as any })}
                className="w-full pl-3.5 pr-8 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer appearance-none"
              >
                <option value="low">🟢 Low</option>
                <option value="medium">🟡 Medium</option>
                <option value="high">🟠 High</option>
                <option value="urgent">🔴 Urgent</option>
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400 text-xs">
                <i className="ri-arrow-down-s-line" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <CreateHiringRequestOrgFields
        form={form}
        setForm={setForm}
        branches={branches}
        standardDepartments={standardDepartments}
        isSuperAdmin={isSuperAdmin}
        assignedBuName={assignedBuName}
        assignedBuId={assignedBuId}
        parentBranches={parentBranches}
        buSites={buSites}
      />

      {/* 4. Reason for Hiring / Business Need */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 space-y-2 shadow-2xs">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
          <i className="ri-file-text-line text-blue-600" />
          <span>Reason for Hiring / Business Need *</span>
        </div>
        <div className="relative">
          <textarea
            rows={3}
            required
            maxLength={500}
            placeholder="e.g. To support business expansion, replace existing role, etc."
            value={form.justification || ""}
            onChange={(e) => setForm({ ...form, justification: e.target.value })}
            className="w-full px-4 py-3 bg-slate-50/70 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none min-h-[90px] font-medium leading-relaxed pb-6"
          />
          <div className="absolute bottom-2.5 right-3 text-[10px] text-slate-400 font-mono">
            {(form.justification || "").length}/500
          </div>
        </div>
      </div>
    </div>
  );
});

