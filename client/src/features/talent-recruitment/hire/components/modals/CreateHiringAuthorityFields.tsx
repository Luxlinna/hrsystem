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
  assignedBuName: string;
}

export const CreateHiringAuthorityFields = memo(function CreateHiringAuthorityFields({
  form,
  setForm,
  branches,
  employees = [],
  assignedBuName,
}: Props) {
  const { recruiters: hrRecruiters } = useHrRecruiters(branches, employees);

  useEffect(() => {
    if (!form.assigned_recruiter_id && hrRecruiters.length > 0) {
      const rec = hrRecruiters[0];
      setForm((prev) =>
        prev.assigned_recruiter_id
          ? prev
          : {
              ...prev,
              assigned_recruiter_id: rec.id,
              assigned_recruiter_name: `${rec.first_name} ${rec.last_name}`.trim(),
            }
      );
    }
  }, [form.assigned_recruiter_id, hrRecruiters, setForm]);

  useEffect(() => {
    if (form.hiring_manager_id && !form.jd_reporting_line) {
      const target = employees.find((e) => e.id === form.hiring_manager_id);
      if (target) {
        const managerName = `${target.first_name} ${target.last_name}`.trim();
        const autoReports = target.role ? `${target.role} (${managerName})` : managerName;
        setForm((prev) => (prev.jd_reporting_line ? prev : { ...prev, jd_reporting_line: autoReports }));
      } else if (form.hiring_manager_name) {
        setForm((prev) => (prev.jd_reporting_line ? prev : { ...prev, jd_reporting_line: form.hiring_manager_name }));
      }
    }
  }, [form.hiring_manager_id, form.hiring_manager_name, form.jd_reporting_line, employees, setForm]);

  const handleSelectHiringManager = (empId: string) => {
    const target = employees.find((e) => e.id === empId);
    const managerName = target ? `${target.first_name} ${target.last_name}`.trim() : "";
    const autoReports = target
      ? target.role
        ? `${target.role} (${managerName})`
        : managerName
      : "";

    setForm((prev) => ({
      ...prev,
      hiring_manager_id: target ? target.id : "",
      hiring_manager_name: managerName,
      jd_reporting_line: autoReports || (target ? managerName : ""),
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
    <div className="bg-white rounded-xl p-3 sm:p-3.5 border border-slate-200/90 shadow-2xs space-y-2.5">
      <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-900">
        <i className="ri-user-settings-line text-blue-600 text-sm" />
        <span>Hiring Authority &amp; Recruiter Assignment</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <div>
          <div className="flex items-center justify-between mb-0.5">
            <label className="block text-[11px] font-semibold text-slate-700">Hiring Manager</label>
            <span className="text-[10px] text-slate-400 font-medium">All Company Roles &amp; Leadership</span>
          </div>
          <EmployeeSearchSelect
            employees={employees}
            value={form.hiring_manager_id}
            onChange={handleSelectHiringManager}
            placeholder="Search hiring manager or role..."
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

      {/* Direct Reports To */}
      <div className="pt-1">
        <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Direct Reports To</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400 text-xs">
            <i className="ri-user-shared-line" />
          </div>
          <input
            type="text"
            placeholder="e.g. Operations Director, Head of Engineering, IT Project Manager..."
            value={form.jd_reporting_line || ""}
            onChange={(e) => setForm((prev) => ({ ...prev, jd_reporting_line: e.target.value }))}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400 shadow-2xs"
          />
        </div>
      </div>
    </div>
  );
});
