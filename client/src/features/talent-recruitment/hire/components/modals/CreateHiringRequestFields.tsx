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
import { usePositions } from "@/features/organization/branches/hooks/usePositions";
import { PositionSearchSelect } from "./PositionSearchSelect";
import { ModernSearchSelect } from "./ModernSearchSelect";

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
  const { positions: orgPositions } = usePositions(assignedBuId || undefined);
  const orgCategories = useOrgMasterCategories(assignedBuId || undefined);
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
    <div className="space-y-2.5 animate-in fade-in duration-200">
      {/* 1. Header Metadata & Position Type */}
      <div className="p-2.5 sm:p-3 bg-blue-50/50 rounded-xl border border-blue-100/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-blue-100/80 text-blue-600 flex items-center justify-center text-sm shrink-0">
            <i className="ri-file-text-line" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 leading-tight">Requisition ID</p>
            <p className="text-xs text-slate-900 font-bold leading-tight">
              Auto-generated upon submission <span className="font-mono text-slate-600 font-semibold">(REQ-2026-XXXX)</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setForm((p) => ({ ...p, position_type: "new", replacement_for_id: "", replacement_for_name: "" }))}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              !isReplacement
                ? "bg-white border-2 border-blue-600 text-blue-600 shadow-2xs"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            <i className="ri-add-circle-fill text-blue-600 text-xs" />
            <span>New Headcount</span>
          </button>
          <button
            type="button"
            onClick={() => setForm((p) => ({ ...p, position_type: "replacement" }))}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              isReplacement
                ? "bg-white border-2 border-blue-600 text-blue-600 shadow-2xs"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            <i className="ri-arrow-left-right-line text-slate-500 text-xs" />
            <span>Replacement</span>
          </button>
        </div>
      </div>

      {isReplacement && (
        <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl space-y-1.5">
          <label className="block text-[11px] font-bold text-amber-900">Outgoing Employee Being Replaced <span className="text-rose-500 font-bold">*</span></label>
          <EmployeeSearchSelect
            employees={buEmployees}
            value={form.replacement_for_id}
            onChange={handleSelectReplacementEmployee}
            placeholder="Search departing employee in this BU..."
          />
        </div>
      )}

      {/* 2. Position Title, Headcount & Priority */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-2.5 sm:p-3 shadow-2xs">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-start">
          <div className="sm:col-span-6">
            <label className="flex items-center gap-1 text-[11px] font-semibold text-slate-700 mb-0.5">
              <i className="ri-building-line text-blue-600 text-xs" />
              <span>Position / Job Title</span>
              <span className="text-rose-500 font-bold">*</span>
            </label>
            <PositionSearchSelect
              positions={
                orgPositions.length > 0
                  ? orgPositions
                  : BU_DEFAULT_POSITIONS.map((name, i) => ({ id: `default-pos-${i}`, name, status: "active" }))
              }
              value={form.title || form.position || ""}
              onChange={(val) => setForm((prev) => ({ ...prev, title: val, position: val }))}
              placeholder="Select position from Org..."
              required
            />
          </div>
          <div className="sm:col-span-3">
            <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Headcount <span className="text-rose-500 font-bold">*</span></label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400 text-xs">
                <i className="ri-user-line" />
              </div>
              <input
                type="number"
                min="1"
                max="100"
                required
                value={form.headcount}
                onChange={(e) => setForm({ ...form, headcount: Math.max(1, parseInt(e.target.value) || 1) })}
                className="w-full pl-8 pr-2.5 py-1.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>
          </div>
          <div className="sm:col-span-3">
            <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Priority</label>
            <ModernSearchSelect
              options={[
                { id: "low", name: "Low" },
                { id: "medium", name: "Medium" },
                { id: "high", name: "High" },
                { id: "urgent", name: "Urgent" },
              ]}
              value={
                form.urgency === "urgent"
                  ? "Urgent"
                  : form.urgency === "high"
                  ? "High"
                  : form.urgency === "medium"
                  ? "Medium"
                  : "Low"
              }
              onChange={(val) => {
                const lower = val.toLowerCase();
                const matched = lower.includes("urgent")
                  ? "urgent"
                  : lower.includes("high")
                  ? "high"
                  : lower.includes("medium")
                  ? "medium"
                  : "low";
                setForm((prev) => ({ ...prev, urgency: matched as any }));
              }}
              icon="ri-flag-line"
              placeholder="Priority"
              searchable={false}
              headerTitle="Urgency / Priority"
            />
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
      <div className="bg-white border border-slate-200/90 rounded-xl p-3 sm:p-3.5 space-y-1.5 shadow-2xs">
        <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-900">
          <i className="ri-file-text-line text-blue-600 text-sm" />
          <span>Reason for Hiring / Business Need <span className="text-rose-500 font-bold">*</span></span>
        </div>
        <div className="relative">
          <textarea
            rows={2}
            required
            maxLength={500}
            placeholder="e.g. To support business expansion, replace existing role, etc."
            value={form.justification || ""}
            onChange={(e) => setForm({ ...form, justification: e.target.value })}
            className="w-full px-3 py-2 bg-slate-50/70 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none min-h-[64px] font-medium leading-relaxed pb-5"
          />
          <div className="absolute bottom-1.5 right-2.5 text-[10px] text-slate-400 font-mono">
            {(form.justification || "").length}/500
          </div>
        </div>
      </div>
    </div>
  );
});

