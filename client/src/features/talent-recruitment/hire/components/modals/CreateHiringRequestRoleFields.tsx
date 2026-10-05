import { memo } from "react";
import type { SearchableEmployee } from "@/components/EmployeeSearchSelect";
import type { Branch, NewHiringRequestFormState } from "../../types";
import { useOrgMasterCategories } from "../../hooks/useOrgMasterCategories";
import { ModernSearchSelect } from "./ModernSearchSelect";
import { CreateHiringAuthorityFields } from "./CreateHiringAuthorityFields";

interface Props {
  form: NewHiringRequestFormState;
  setForm: React.Dispatch<React.SetStateAction<NewHiringRequestFormState>>;
  branches: Branch[];
  employees?: SearchableEmployee[];
  assignedBuName: string;
}

export const CreateHiringRequestRoleFields = memo(function CreateHiringRequestRoleFields({
  form,
  setForm,
  branches,
  employees = [],
  assignedBuName,
}: Props) {
  const { employeeTypes, employeeLevels, contractTypes } = useOrgMasterCategories();

  return (
    <div className="space-y-2.5 animate-in fade-in duration-200">
      {/* 1. Employee Type, Employee Level & Contract Type */}
      <div className="bg-white rounded-xl p-3 sm:p-3.5 border border-slate-200/90 shadow-2xs space-y-2.5">
        <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-900">
          <i className="ri-shield-user-line text-blue-600 text-sm" />
          <span>Employment &amp; Contract Terms</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
              Employee Type <span className="text-rose-500 font-bold">*</span>
            </label>
            <ModernSearchSelect
              options={employeeTypes}
              value={form.employee_type || form.employment_type || employeeTypes[0] || "FULL-TIME"}
              onChange={(val) => setForm((prev) => ({ ...prev, employee_type: val, employment_type: val }))}
              icon="ri-team-line"
              placeholder="Select Employee Type..."
              headerTitle="Employee Types"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
              Employee Level <span className="text-rose-500 font-bold">*</span>
            </label>
            <ModernSearchSelect
              options={employeeLevels}
              value={form.employee_level || employeeLevels[0] || "Senior"}
              onChange={(val) => setForm((prev) => ({ ...prev, employee_level: val }))}
              icon="ri-shield-star-line"
              placeholder="Select Employee Level..."
              headerTitle="Employee Levels"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
              Contract Type <span className="text-rose-500 font-bold">*</span>
            </label>
            <ModernSearchSelect
              options={contractTypes}
              value={form.contract_type || contractTypes[0] || "1-YEAR FDC"}
              onChange={(val) => setForm((prev) => ({ ...prev, contract_type: val }))}
              icon="ri-file-paper-2-line"
              placeholder="Select Contract Type..."
              headerTitle="Contract Types"
            />
          </div>
        </div>
      </div>

      {/* 2. Expected Salary & Target Joining Date */}
      <div className="bg-white rounded-xl p-3 sm:p-3.5 border border-slate-200/90 shadow-2xs space-y-2.5">
        <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-900">
          <i className="ri-money-dollar-circle-line text-blue-600 text-sm" />
          <span>Compensation &amp; Target Timeline</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Expected Salary Min ($)</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400 text-xs font-bold">
                $
              </div>
              <input
                type="number"
                placeholder="e.g. 500"
                value={form.salary_min || ""}
                onChange={(e) => setForm((prev) => ({ ...prev, salary_min: e.target.value }))}
                className="w-full pl-7 pr-2.5 py-1.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Expected Salary Max ($)</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400 text-xs font-bold">
                $
              </div>
              <input
                type="number"
                placeholder="e.g. 1000"
                value={form.salary_max || ""}
                onChange={(e) => setForm((prev) => ({ ...prev, salary_max: e.target.value }))}
                className="w-full pl-7 pr-2.5 py-1.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Target Joining Date</label>
            <div className="relative">
              <input
                type="date"
                value={form.target_joining_date || ""}
                onChange={(e) => setForm((prev) => ({ ...prev, target_joining_date: e.target.value }))}
                className="w-full px-3 py-1.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Direct Reports To & Hiring Authority & Recruiter Assignment */}
      <CreateHiringAuthorityFields
        form={form}
        setForm={setForm}
        branches={branches}
        employees={employees}
        assignedBuName={assignedBuName}
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
            onChange={(e) => setForm((prev) => ({ ...prev, justification: e.target.value }))}
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
