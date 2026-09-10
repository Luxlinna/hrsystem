import { memo, useEffect, useMemo } from "react";
import type { SearchableEmployee } from "@/components/EmployeeSearchSelect";
import EmployeeSearchSelect from "@/components/EmployeeSearchSelect";
import type { Branch, NewHiringRequestFormState } from "../../types";
import { DEFAULT_DEPARTMENTS } from "../../constants";
import { CreateHiringRequestOrgFields } from "./CreateHiringRequestOrgFields";
import { CreateHiringRequestRoleFields } from "./CreateHiringRequestRoleFields";
import { JobDescriptionFormFields } from "./JobDescriptionFormFields";

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
  userBranchId,
  userBranchName,
}: CreateHiringRequestFieldsProps) {
  const isReplacement = form.position_type === "replacement";

  const standardDepartments = useMemo(() => {
    const list = departments && departments.length > 0 ? departments : DEFAULT_DEPARTMENTS;
    return list.filter((d) => d !== "Other");
  }, [departments]);

  const parentBranches = branches.filter((b) => !b.is_site);
  const siteBranches = branches.filter((b) => b.is_site);

  const mainBranch =
    branches.find((b) => !b.is_site && (b.id === userBranchId || b.name === userBranchName)) ||
    parentBranches[0];

  const assignedBuName = userBranchName || mainBranch?.name || form.business_unit || "Your Business Unit";
  const assignedBuId = userBranchId || mainBranch?.id || form.branch_id || "";
  const buSites = siteBranches.filter((s) => s.branch_id === assignedBuId || (!s.branch_id && assignedBuId));

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
    const target = employees.find((e) => e.id === empId);
    setForm((prev) => ({
      ...prev,
      replacement_for_id: target ? target.id : "",
      replacement_for_name: target ? `${target.first_name} ${target.last_name}` : "",
    }));
  };

  return (
    <div className="space-y-5">
      {/* 1. Header Metadata & Position Type */}
      <div className="p-3.5 bg-blue-50/70 rounded-2xl border border-blue-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="w-7 h-7 rounded-xl bg-[#253C7D] text-white flex items-center justify-center text-xs font-bold shadow-xs">#</span>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-blue-900">Requisition ID</p>
            <p className="text-xs text-blue-700 font-mono font-semibold">Auto-generated upon submission (REQ-2026-XXXX)</p>
          </div>
        </div>
        <div className="inline-flex p-1 bg-white rounded-xl border border-blue-200 shadow-2xs">
          <button
            type="button"
            onClick={() => setForm((p) => ({ ...p, position_type: "new", replacement_for_id: "", replacement_for_name: "" }))}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${!isReplacement ? "bg-[#253C7D] text-white" : "text-gray-600 hover:text-gray-900"}`}
          >
            ✨ New Headcount
          </button>
          <button
            type="button"
            onClick={() => setForm((p) => ({ ...p, position_type: "replacement" }))}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${isReplacement ? "bg-[#253C7D] text-white" : "text-gray-600 hover:text-gray-900"}`}
          >
            🔄 Replacement
          </button>
        </div>
      </div>


      {isReplacement && (
        <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl space-y-2">
          <label className="block text-xs font-bold text-amber-900">Outgoing Employee Being Replaced *</label>
          <EmployeeSearchSelect
            employees={employees}
            value={form.replacement_for_id}
            onChange={handleSelectReplacementEmployee}
            placeholder="Search departing employee..."
          />
        </div>
      )}

      {/* 2. Position Title, Headcount & Priority */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        <div className="sm:col-span-6">
          <label className="block text-xs font-semibold text-gray-700 mb-1">Position Title *</label>
          <input
            type="text"
            required
            placeholder="e.g. Senior Operations Officer"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium"
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
            className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium"
          />
        </div>
        <div className="sm:col-span-3">
          <label className="block text-xs font-semibold text-gray-700 mb-1">Priority</label>
          <select
            value={form.urgency}
            onChange={(e) => setForm({ ...form, urgency: e.target.value as any })}
            className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium cursor-pointer"
          >
            <option value="low">🟢 Low</option>
            <option value="medium">🟡 Medium</option>
            <option value="high">🟠 High</option>
            <option value="urgent">🔴 Urgent</option>
          </select>
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

      <CreateHiringRequestRoleFields
        form={form}
        setForm={setForm}
        branches={branches}
        employees={employees}
        isSuperAdmin={isSuperAdmin}
        assignedBuName={assignedBuName}
      />

      {/* 5. Justification & Description */}
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Reason for Hiring / Business Need *</label>
          <textarea rows={2} required placeholder="Explain business need..." value={form.justification} onChange={(e) => setForm({ ...form, justification: e.target.value })} className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium resize-none" />
        </div>
        <JobDescriptionFormFields form={form} setForm={setForm} />
      </div>
    </div>
  );
});

