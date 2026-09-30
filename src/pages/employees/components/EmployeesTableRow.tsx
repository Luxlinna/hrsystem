import { memo } from "react";
import type { Employee } from "../types";
import { getJobStatusBadge, getBranchCode } from "../constants";
import { EmployeeInfoCell, DepartmentLocationCell } from "./table/EmployeeRowCells";
import { EmployeeActionDropdown } from "./table/EmployeeActionDropdown";

interface EmployeesTableRowProps {
  employee: Employee;
  index: number;
  isSelected: boolean;
  canManage: boolean;
  showSalary?: boolean;
  onSelectOne: (id: string) => void;
  onInvite?: (e: Employee) => void;
  onSetUpPhoneAccount?: (e: Employee) => void;
  onDelete: (e: Employee) => void;
  onEdit?: (e: Employee) => void;
  onDisable?: (e: Employee) => void;
  onDeactivate?: (e: Employee) => void;
}

const formatDate = (d?: string | null) => {
  if (!d) return "-";
  try {
    const date = new Date(d);
    if (isNaN(date.getTime())) return d;
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    return `${day}/${month}/${date.getFullYear()}`;
  } catch {
    return d;
  }
};

export const EmployeesTableRow = memo(function EmployeesTableRow({
  employee: e,
  index,
  isSelected,
  canManage,
  showSalary = false,
  onSelectOne,
  onSetUpPhoneAccount,
  onDelete,
  onEdit,
  onDisable,
  onDeactivate,
}: EmployeesTableRowProps) {
  const buName = e.branches?.name || e.bu_full_name || (e as any).company || "";
  const buCode = e.code_bu || (buName ? getBranchCode(buName) : "HQ");
  const employeeCode = e.employee_code || e.id.slice(0, 8);
  const fullName = e.full_name || e.display_name || `${e.first_name || ""} ${e.last_name || ""}`.trim() || "-";
  const designation = e.position || e.role || "Staff";
  const empType = e.employment_type || "Full Time";
  const department = e.department || "Operations";
  const siteName = e.work_locations?.name || e.site || "Main Office";
  const contractType = e.contract_type || "FDC";
  const contractPeriod = e.contract_end_date ? `End: ${formatDate(e.contract_end_date)}` : "Ongoing";
  const statusBadge = getJobStatusBadge(e.status);

  return (
    <tr
      className={`hover:bg-[#253C7D]/3 dark:hover:bg-[#253C7D]/10 transition-colors border-b border-slate-100 dark:border-slate-700/50 text-xs text-slate-800 dark:text-slate-200 ${
        isSelected ? "bg-[#253C7D]/5 dark:bg-[#253C7D]/15" : ""
      }`}
    >
      <td className="py-2.5 px-3 text-center">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onSelectOne(e.id)}
          className="w-3.5 h-3.5 rounded border-slate-300 dark:border-slate-600 text-[#253C7D] focus:ring-[#253C7D] cursor-pointer"
        />
      </td>

      <td className="py-2.5 px-2 text-center text-slate-400 dark:text-slate-500 font-medium">
        {index + 1}
      </td>

      {/* Employee Identity Cell with Globe BU Badge */}
      <EmployeeInfoCell
        employee={e}
        fullName={fullName}
        buCode={buCode}
        employeeCode={employeeCode}
      />

      {/* Designation */}
      <td className="py-2.5 px-3">
        <p className="font-medium text-slate-800 dark:text-slate-200 truncate">{designation}</p>
        <span className="inline-block mt-0.5 text-[9px] font-semibold px-1.5 py-0.2 rounded border border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800">
          {empType}
        </span>
      </td>

      {/* Department with Building Site Badge */}
      <DepartmentLocationCell department={department} siteName={siteName} />

      {/* Joining Date */}
      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300 whitespace-nowrap">
        {formatDate(e.join_date || e.start_date)}
      </td>

      {/* Contract */}
      <td className="py-2.5 px-3">
        <p className="font-medium text-slate-700 dark:text-slate-200 truncate">{contractType}</p>
        <span className="text-[10px] text-slate-400 dark:text-slate-500 whitespace-nowrap block">{contractPeriod}</span>
      </td>

      {/* Salary */}
      <td className="py-2.5 px-3">
        <p className="font-mono text-slate-700 dark:text-slate-200 font-semibold">
          {showSalary ? `${e.basic_salary || e.contract_rate || 0} USD` : "*****"}
        </p>
        <div className="flex items-center gap-1 mt-0.5">
          <span className="text-[9px] font-medium px-1.5 py-0.2 rounded bg-[#253C7D] dark:bg-[#253C7D]/80 text-white">
            {e.tax_salary_frequency || "Monthly"}
          </span>
          <span className="text-[9px] font-medium px-1.5 py-0.2 rounded bg-[#253C7D] dark:bg-[#253C7D]/80 text-white">
            {e.payroll_structure || "Gross"}
          </span>
        </div>
      </td>

      {/* Status */}
      <td className="py-2.5 px-3">
        <div className="space-y-1">
          <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded text-white whitespace-nowrap ${statusBadge.jobColor}`}>
            {statusBadge.jobStatus}
          </span>
          <div>
            <span className={`inline-block text-[10px] font-medium px-2 py-0.5 rounded text-white whitespace-nowrap ${statusBadge.lifecycleColor}`}>
              {statusBadge.lifecycleStatus}
            </span>
          </div>
        </div>
      </td>

      {/* Action Dropdown */}
      <td className="py-2.5 px-3 text-center">
        <EmployeeActionDropdown
          employee={e}
          canManage={canManage}
          onEdit={onEdit}
          onSetUpPhoneAccount={onSetUpPhoneAccount}
          onDelete={onDelete}
          onDisable={onDisable}
          onDeactivate={onDeactivate}
        />
      </td>
    </tr>
  );
});
