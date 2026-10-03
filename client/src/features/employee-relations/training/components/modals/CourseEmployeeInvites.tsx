import { memo, useState, useMemo } from "react";
import type { CourseFormState, Employee } from "../../types";

interface CourseEmployeeInvitesProps {
  form: CourseFormState;
  setForm: React.Dispatch<React.SetStateAction<CourseFormState>>;
  employees: Employee[];
}

export const CourseEmployeeInvites = memo(function CourseEmployeeInvites({
  form,
  setForm,
  employees,
}: CourseEmployeeInvitesProps) {
  const [empSearch, setEmpSearch] = useState("");

  const branchEmployees = useMemo(() => {
    if (form.is_admin_course || !form.branch_id) {
      return employees;
    }
    return employees.filter((e) => !e.branch_id || e.branch_id === form.branch_id);
  }, [employees, form.is_admin_course, form.branch_id]);

  if (employees.length === 0) return null;

  const filteredEmployees = branchEmployees.filter((e) => {
    if (!empSearch) return true;
    const name = `${e.first_name} ${e.last_name} ${e.department || ""}`.toLowerCase();
    return name.includes(empSearch.toLowerCase());
  });

  const toggleEmployee = (empId: string) => {
    const list = form.invited_employee_ids || [];
    if (list.includes(empId)) {
      setForm((prev) => ({
        ...prev,
        invited_employee_ids: list.filter((id) => id !== empId),
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        invited_employee_ids: [...list, empId],
      }));
    }
  };

  const handleSelectAll = () => {
    if (form.invited_employee_ids?.length === filteredEmployees.length) {
      setForm((prev) => ({ ...prev, invited_employee_ids: [] }));
    } else {
      setForm((prev) => ({
        ...prev,
        invited_employee_ids: filteredEmployees.map((e) => e.id),
      }));
    }
  };

  return (
    <div className="space-y-3 pt-3 border-t border-gray-100">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <label className="block font-extrabold text-gray-900 text-xs sm:text-sm">
            Invite Employees
          </label>
          <span className="px-2 py-0.5 bg-[#253C7D]/10 text-[#253C7D] rounded-full font-bold text-[11px]">
            {form.invited_employee_ids?.length || 0} selected
          </span>
        </div>
        <button
          type="button"
          onClick={handleSelectAll}
          className="text-xs font-bold text-[#253C7D] hover:underline cursor-pointer flex items-center gap-1"
        >
          <i className="ri-checkbox-multiple-line" />
          {form.invited_employee_ids?.length === filteredEmployees.length
            ? "Deselect All"
            : "Select All Branch Staff"}
        </button>
      </div>

      <div className="relative">
        <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
        <input
          type="text"
          value={empSearch}
          onChange={(e) => setEmpSearch(e.target.value)}
          placeholder="Search employee name or department to invite..."
          className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:bg-white focus:border-[#253C7D]"
        />
      </div>

      <div className="max-h-48 overflow-y-auto space-y-1.5 border border-gray-200/80 rounded-2xl p-2 bg-gray-50/40">
        {filteredEmployees.map((emp) => {
          const isSelected = form.invited_employee_ids?.includes(emp.id);
          return (
            <div
              key={emp.id}
              onClick={() => toggleEmployee(emp.id)}
              className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all text-xs sm:text-sm ${
                isSelected
                  ? "bg-blue-50 text-[#253C7D] font-bold border border-blue-200/80 shadow-2xs"
                  : "hover:bg-gray-100 text-gray-800"
              }`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => {}}
                  className="w-4 h-4 rounded text-[#253C7D] focus:ring-0 cursor-pointer pointer-events-none"
                />
                <div className="w-6 h-6 rounded-full bg-[#253C7D]/15 text-[#253C7D] font-bold text-[10px] flex items-center justify-center shrink-0">
                  {emp.first_name?.[0]}
                  {emp.last_name?.[0]}
                </div>
                <span className="truncate font-semibold">
                  {emp.first_name} {emp.last_name}
                </span>
                <span className="text-[11px] text-gray-400 font-normal truncate">
                  ({emp.department || "Staff"})
                </span>
              </div>
              {isSelected && <i className="ri-check-line text-[#253C7D] font-bold text-base" />}
            </div>
          );
        })}
      </div>
    </div>
  );
});
