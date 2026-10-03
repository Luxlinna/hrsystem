import { memo, useEffect } from "react";
import type { SearchableEmployee } from "@/components/EmployeeSearchSelect";
import EmployeeSearchSelect from "@/components/EmployeeSearchSelect";
import type { Branch, NewHiringRequestFormState } from "../../types";
import { useHrRecruiters } from "../../hooks/useHrRecruiters";

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
    <div className="space-y-4">
      {/* Employment Type & Salary */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        <div className="sm:col-span-4">
          <label className="block text-xs font-semibold text-gray-700 mb-1">Employment Type</label>
          <select
            value={form.employment_type}
            onChange={(e) => setForm({ ...form, employment_type: e.target.value })}
            className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium"
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
            className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs"
          />
        </div>
        <div className="sm:col-span-4">
          <label className="block text-xs font-semibold text-gray-700 mb-1">Expected Salary Max ($)</label>
          <input
            type="number"
            placeholder="e.g. 1000"
            value={form.salary_max}
            onChange={(e) => setForm({ ...form, salary_max: e.target.value })}
            className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs"
          />
        </div>
      </div>

      {/* Target Joining Date, Hiring Manager & Assigned Recruiter */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Target Joining Date</label>
          <input
            type="date"
            value={form.target_joining_date}
            onChange={(e) => setForm({ ...form, target_joining_date: e.target.value })}
            className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium"
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-semibold text-gray-700">Hiring Manager</label>
            <span className="text-[10px] text-gray-500 font-medium">Managers in {assignedBuName}</span>
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
            <label className="block text-xs font-semibold text-gray-700">
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
