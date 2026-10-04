import { memo, useEffect } from "react";
import type { SearchableEmployee } from "@/components/EmployeeSearchSelect";
import EmployeeSearchSelect from "@/components/EmployeeSearchSelect";
import type { Branch, NewHiringRequestFormState } from "../../types";
import { useHrRecruiters } from "../../hooks/useHrRecruiters";
import { useOrgMasterCategories } from "../../hooks/useOrgMasterCategories";

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
  isSuperAdmin = false,
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
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs space-y-4">
      <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
        <i className="ri-user-settings-line text-blue-600" />
        <span>Role Terms, Contract & Compensation</span>
      </div>

      {/* 1. Employee Type, Employee Level & Contract Type */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Employee Type</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 text-sm">
              <i className="ri-team-line" />
            </div>
            <select
              value={form.employee_type || form.employment_type || employeeTypes[0] || "FULL-TIME"}
              onChange={(e) => setForm({ ...form, employee_type: e.target.value, employment_type: e.target.value })}
              className="w-full pl-9 pr-8 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer appearance-none"
            >
              {employeeTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400 text-xs">
              <i className="ri-arrow-down-s-line" />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Employee Level</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 text-sm">
              <i className="ri-shield-star-line" />
            </div>
            <select
              value={form.employee_level || employeeLevels[0] || "Senior"}
              onChange={(e) => setForm({ ...form, employee_level: e.target.value })}
              className="w-full pl-9 pr-8 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer appearance-none"
            >
              {employeeLevels.map((lvl) => (
                <option key={lvl} value={lvl}>{lvl}</option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400 text-xs">
              <i className="ri-arrow-down-s-line" />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Contract Type</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 text-sm">
              <i className="ri-file-paper-2-line" />
            </div>
            <select
              value={form.contract_type || contractTypes[0] || "1-YEAR FDC"}
              onChange={(e) => setForm({ ...form, contract_type: e.target.value })}
              className="w-full pl-9 pr-8 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer appearance-none"
            >
              {contractTypes.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400 text-xs">
              <i className="ri-arrow-down-s-line" />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Expected Salary & Target Joining Date */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Expected Salary Min ($)</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 text-xs font-bold">
              $
            </div>
            <input
              type="number"
              placeholder="e.g. 500"
              value={form.salary_min || ""}
              onChange={(e) => setForm({ ...form, salary_min: e.target.value })}
              className="w-full pl-8 pr-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Expected Salary Max ($)</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 text-xs font-bold">
              $
            </div>
            <input
              type="number"
              placeholder="e.g. 1000"
              value={form.salary_max || ""}
              onChange={(e) => setForm({ ...form, salary_max: e.target.value })}
              className="w-full pl-8 pr-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Target Joining Date</label>
          <div className="relative">
            <input
              type="date"
              value={form.target_joining_date || ""}
              onChange={(e) => setForm({ ...form, target_joining_date: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>
        </div>
      </div>

      {/* 3. Hiring Manager & Assigned Recruiter */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-semibold text-slate-700">Hiring Manager</label>
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
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-semibold text-slate-700">
              Assigned Recruiter <span className="text-purple-600 font-bold">*</span>
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
  );
});
