import { memo, useEffect } from "react";
import type { SearchableEmployee } from "@/components/EmployeeSearchSelect";
import EmployeeSearchSelect from "@/components/EmployeeSearchSelect";
import type { Branch, NewHiringRequestFormState } from "../../types";
import { useHrRecruiters } from "../../hooks/useHrRecruiters";
import { useOrgMasterCategories } from "../../hooks/useOrgMasterCategories";
import { ModernSearchSelect } from "./ModernSearchSelect";

interface Props {
  form: NewHiringRequestFormState;
  setForm: React.Dispatch<React.SetStateAction<NewHiringRequestFormState>>;
  branches: Branch[];
  employees?: SearchableEmployee[];
  isSuperAdmin?: boolean;
  assignedBuName: string;
}

export const CreateHiringRequestRoleFields = memo(function CreateHiringRequestRoleFields({
  form,
  setForm,
  branches,
  employees = [],
  assignedBuName,
}: Props) {
  // Strictly fetch enterprise HR Division & Recruiter employees
  const { recruiters: hrRecruiters } = useHrRecruiters(branches);
  const { employeeTypes, employeeLevels, contractTypes } = useOrgMasterCategories();

  // Auto-default to the primary HR Division recruiter if not yet set
  useEffect(() => {
    if (!form.assigned_recruiter_id && hrRecruiters.length > 0) {
      const defaultRecruiter = hrRecruiters[0];
      setForm((prev) => {
        if (prev.assigned_recruiter_id) return prev;
        return {
          ...prev,
          assigned_recruiter_id: defaultRecruiter.id,
          assigned_recruiter_name: `${defaultRecruiter.first_name} ${defaultRecruiter.last_name}`.trim(),
        };
      });
    }
  }, [form.assigned_recruiter_id, hrRecruiters, setForm]);

  const handleSelectHiringManager = (empId: string) => {
    const target = employees.find((e) => e.id === empId);
    setForm((prev) => ({
      ...prev,
      hiring_manager_id: target ? target.id : "",
      hiring_manager_name: target ? `${target.first_name} ${target.last_name}` : "",
    }));
  };

  const handleSelectRecruiter = (empId: string) => {
    const target = hrRecruiters.find((e) => e.id === empId);
    setForm((prev) => ({
      ...prev,
      assigned_recruiter_id: target ? target.id : "",
      assigned_recruiter_name: target ? `${target.first_name} ${target.last_name}`.trim() : "",
    }));
  };

  return (
    <div className="space-y-2.5 animate-in fade-in duration-200">
      {/* 1. Employee Type, Employee Level & Contract Type */}
      <div className="bg-white rounded-xl p-3 sm:p-3.5 border border-slate-200/90 shadow-2xs space-y-2.5">
        <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-900">
          <i className="ri-shield-user-line text-blue-600 text-sm" />
          <span>Employment & Contract Terms</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Employee Type <span className="text-rose-500 font-bold">*</span></label>
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
            <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Employee Level <span className="text-rose-500 font-bold">*</span></label>
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
            <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Contract Type <span className="text-rose-500 font-bold">*</span></label>
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
          <span>Compensation & Target Timeline</span>
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
                onChange={(e) => setForm({ ...form, salary_min: e.target.value })}
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
                onChange={(e) => setForm({ ...form, salary_max: e.target.value })}
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
                onChange={(e) => setForm({ ...form, target_joining_date: e.target.value })}
                className="w-full px-3 py-1.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Hiring Manager & Assigned Recruiter */}
      <div className="bg-white rounded-xl p-3 sm:p-3.5 border border-slate-200/90 shadow-2xs space-y-2.5">
        <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-900">
          <i className="ri-user-settings-line text-blue-600 text-sm" />
          <span>Hiring Authority & Recruiter Assignment</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div>
            <div className="flex items-center justify-between mb-0.5">
              <label className="block text-[11px] font-semibold text-slate-700">Hiring Manager</label>
              <span className="text-[10px] text-slate-400 font-medium">Managers in {assignedBuName}</span>
            </div>
            <EmployeeSearchSelect
              employees={employees}
              value={form.hiring_manager_id}
              onChange={handleSelectHiringManager}
              placeholder={assignedBuName ? `Search manager in ${assignedBuName}...` : "Search hiring manager..."}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-0.5">
              <label className="block text-[11px] font-semibold text-slate-700">
                Assigned Recruiter <span className="text-rose-500 font-bold">*</span>
              </label>
              <span className="text-[10px] text-purple-600 font-medium">HR Division</span>
            </div>
            <EmployeeSearchSelect
              employees={hrRecruiters}
              value={form.assigned_recruiter_id || ""}
              onChange={handleSelectRecruiter}
              placeholder="Select HR recruiter..."
            />
          </div>
        </div>
      </div>
    </div>
  );
});
