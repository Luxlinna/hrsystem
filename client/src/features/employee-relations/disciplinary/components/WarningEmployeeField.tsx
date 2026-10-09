import { memo, useMemo } from "react";
import { compareBiometricIds } from "@/lib/biometricUtils";
import type { Employee, NewRecord } from "../types";
import { formatKhmerFullName } from "@/features/workforce/employees/nameUtils";

interface WarningEmployeeFieldProps {
  employees: Employee[];
  newRecord: NewRecord;
  handleFieldChange: (field: keyof NewRecord, value: any) => void;
  activeBranchId?: string | null;
}

export const WarningEmployeeField = memo(function WarningEmployeeField({
  employees,
  newRecord,
  handleFieldChange,
}: WarningEmployeeFieldProps) {
  const sortedEmployees = useMemo(() => {
    const list = [...employees];
    list.sort((a, b) => {
      const idComp = compareBiometricIds(a.employee_id, b.employee_id);
      if (idComp !== 0) return idComp;
      return formatKhmerFullName(a).localeCompare(formatKhmerFullName(b));
    });
    return list;
  }, [employees]);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const empId = e.target.value;
    handleFieldChange("employee_id", empId);
    const found = employees.find((x) => x.id === empId);
    if (found?.branch_id) {
      handleFieldChange("branch_id", found.branch_id);
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-sm font-bold text-[#0284c7] uppercase">
        EMPLOYEE INFO
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
        <label className="sm:w-52 text-xs font-semibold text-slate-700 sm:text-right">
          Employee <span className="text-rose-500">*</span>
        </label>
        <div className="w-full sm:w-[350px] relative">
          <select
            required
            value={newRecord.employee_id}
            onChange={handleChange}
            className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-800 focus:outline-none focus:border-sky-500 appearance-none pr-8 cursor-pointer"
          >
            <option value="">Search...</option>
            {sortedEmployees.map((emp) => {
              const fullName = formatKhmerFullName(emp);
              const bio = emp.employee_id ? `(${emp.employee_id})` : "";
              const roleOrDept = emp.role || emp.department || "Staff";
              return (
                <option key={emp.id} value={emp.id}>
                  {fullName} {bio} - {roleOrDept}
                </option>
              );
            })}
          </select>
          <i className="ri-arrow-down-s-line absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none" />
        </div>
      </div>
    </div>
  );
});
