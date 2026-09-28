import { memo } from "react";
import type { Employee } from "../types";
import { STATUS_CONFIG } from "../constants";
import { formatBiometricId } from "@/lib/biometricUtils";

interface Props {
  employees: Employee[];
  availableEmployees: Employee[];
  filterEmployeeId?: string;
  setFilterEmployeeId?: (empId: string) => void;
  departments: string[];
  filterDepartment: string;
  setFilterDepartment: (dept: string) => void;
  filterStatus: string;
  setFilterStatus: (status: string) => void;
}

export const AttendanceFilterSelects = memo(function AttendanceFilterSelects({
  employees,
  availableEmployees,
  filterEmployeeId = "all",
  setFilterEmployeeId,
  departments,
  filterDepartment,
  setFilterDepartment,
  filterStatus,
  setFilterStatus,
}: Props) {
  return (
    <>
      {/* Employee Dropdown */}
      {employees.length > 0 && setFilterEmployeeId && (
        <select
          value={filterEmployeeId}
          onChange={(e) => setFilterEmployeeId(e.target.value)}
          className="px-2.5 py-1.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs text-gray-700 dark:text-slate-200 focus:outline-none focus:border-[#253C7D] dark:focus:border-sky-500 cursor-pointer font-bold max-w-[170px] truncate"
          title="Filter by specific employee"
        >
          <option value="all">All Employees ({availableEmployees.length})</option>
          {availableEmployees.map((emp) => {
            const rawBio = emp.biometric_user_id || emp.employee_code;
            const bName = Array.isArray(emp.branches) ? emp.branches[0]?.name : (emp.branches?.name || "");
            const bioId = formatBiometricId(rawBio, bName);
            return (
              <option key={emp.id} value={emp.id}>
                {emp.first_name} {emp.last_name}
                {bioId ? ` [${bioId}]` : ""}
                {emp.role ? ` (${emp.role})` : ""}
              </option>
            );
          })}
        </select>
      )}

      {/* Department Dropdown */}
      {departments.length > 0 && (
        <select
          value={filterDepartment}
          onChange={(e) => setFilterDepartment(e.target.value)}
          className="px-2.5 py-1.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs text-gray-700 dark:text-slate-200 focus:outline-none focus:border-[#253C7D] dark:focus:border-sky-500 cursor-pointer font-bold"
        >
          <option value="all">All Departments</option>
          {departments.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      )}

      {/* Status Dropdown */}
      <select
        value={filterStatus}
        onChange={(e) => setFilterStatus(e.target.value)}
        className="px-2.5 py-1.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs text-gray-700 dark:text-slate-200 focus:outline-none focus:border-[#253C7D] dark:focus:border-sky-500 cursor-pointer font-medium"
      >
        <option value="all">All Statuses</option>
        {Object.entries(STATUS_CONFIG).map(([k, v]) => (
          <option key={k} value={k}>{v.label}</option>
        ))}
      </select>
    </>
  );
});
