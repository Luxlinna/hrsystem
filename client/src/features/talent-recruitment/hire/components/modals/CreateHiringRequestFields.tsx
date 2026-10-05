import { memo, useEffect, useMemo } from "react";
import type { SearchableEmployee } from "@/components/EmployeeSearchSelect";
import type { Branch, NewHiringRequestFormState } from "../../types";
import { DEFAULT_DEPARTMENTS } from "../../constants";
import { CreateHiringRequestOrgFields } from "./CreateHiringRequestOrgFields";
import { CreateHiringRequestPositionFields } from "./CreateHiringRequestPositionFields";
import { CreateHiringRequestRoleFields } from "./CreateHiringRequestRoleFields";
import { JobDescriptionFormFields } from "./JobDescriptionFormFields";
import { usePositions } from "@/features/organization/branches/hooks/usePositions";

interface CreateHiringRequestFieldsProps {
  form: NewHiringRequestFormState;
  setForm: React.Dispatch<React.SetStateAction<NewHiringRequestFormState>>;
  editingRequest?: any | null;
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
  editingRequest,
  branches,
  departments,
  employees = [],
  isSuperAdmin = false,
  userBranchId,
  userBranchName,
  targetBranch,
  activeStep = 1,
}: CreateHiringRequestFieldsProps) {
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
  const { positions: orgPositions } = usePositions(); // Display all roles/positions across the entire organization
  const buSites = siteBranches.filter((s) => s.branch_id === assignedBuId || (!s.branch_id && assignedBuId));

  // All managers/roles across the organization
  const allManagers = useMemo(() => {
    const managers = employees.filter((e) => e.is_manager);
    return managers.length > 0 ? managers : employees;
  }, [employees]);

  useEffect(() => {
    setForm((prev) => {
      const updates: Partial<NewHiringRequestFormState> = {};
      if (!prev.company) updates.company = "UNI";
      if (!prev.position_type) updates.position_type = "new";
      if (!isSuperAdmin) {
        if (!prev.business_unit && assignedBuName) updates.business_unit = assignedBuName;
        if (!prev.branch_id && assignedBuId) updates.branch_id = assignedBuId;
      }
      return Object.keys(updates).length > 0 ? { ...prev, ...updates } : prev;
    });
  }, [isSuperAdmin, assignedBuName, assignedBuId, setForm]);

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
          employees={allManagers}
          assignedBuName={assignedBuName}
        />
      </div>
    );
  }

  // Step 1: Placement & Position Details
  return (
    <div className="space-y-2.5 animate-in fade-in duration-200">
      {/* 1. Header Metadata */}
      <div className="p-2.5 sm:p-3 bg-blue-50/50 rounded-xl border border-blue-100/80 flex items-center justify-between gap-2.5 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-blue-100/80 text-blue-600 flex items-center justify-center text-sm shrink-0">
            <i className="ri-file-text-line" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 leading-tight">Requisition ID</p>
            <p className="text-xs text-slate-900 font-bold leading-tight">
              {editingRequest ? (
                <span className="font-mono text-blue-700 font-bold">
                  {editingRequest.requisition_id || (editingRequest.id ? `REQ-${editingRequest.id.slice(0, 8).toUpperCase()}` : "REQ-2026-XXXX")} (Existing)
                </span>
              ) : (
                <>Auto-generated upon submission <span className="font-mono text-slate-600 font-semibold">(REQ-2026-XXXX)</span></>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* 2. Position Title, Headcount & Priority */}
      <CreateHiringRequestPositionFields
        form={form}
        setForm={setForm}
        orgPositions={orgPositions}
      />

      {/* 3. Organizational Placement & Structure */}
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
    </div>
  );
});

