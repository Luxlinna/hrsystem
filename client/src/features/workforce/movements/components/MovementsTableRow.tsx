import React from "react";
import type { EmployeeMovement } from "../types";
import { MOVEMENT_TYPES } from "../constants";
import { DefaultAvatarSvg } from "@/components/DefaultAvatarSvg";
import { getBranchCode } from "@/features/workforce/employees/constants";
import { formatKhmerFullName } from "@/features/workforce/employees/nameUtils";
import { MovementsTableRowMenu } from "./MovementsTableRowMenu";

interface MovementsTableRowProps {
  movement: EmployeeMovement;
  index: number;
  isSelected: boolean;
  showSalary?: boolean;
  openDropdownId: string | null;
  actionRef: React.RefObject<HTMLTableCellElement | null>;
  onSelectOne?: (id: string) => void;
  onToggleDropdown: (id: string) => void;
  onSelectMovement: (m: EmployeeMovement) => void;
  onEditMovement?: (m: EmployeeMovement) => void;
  onDeleteMovement?: (m: EmployeeMovement) => void;
}

const formatDate = (d?: string | null) => {
  if (!d) return "-";
  try {
    const date = new Date(d);
    if (isNaN(date.getTime())) return d;
    return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;
  } catch {
    return d;
  }
};

export const MovementsTableRow: React.FC<MovementsTableRowProps> = ({
  movement: m,
  index,
  isSelected,
  showSalary = false,
  openDropdownId,
  actionRef,
  onSelectOne,
  onToggleDropdown,
  onSelectMovement,
  onEditMovement,
  onDeleteMovement,
}) => {
  const emp = m.employees;
  const typeConfig = MOVEMENT_TYPES[m.movement_type];
  const fullName = emp ? formatKhmerFullName(emp) : "-";
  const buName = emp?.branches?.name || (emp as any)?.bu_full_name || (emp as any)?.company || "";
  const buCode = (emp as any)?.code_bu || (buName ? getBranchCode(buName) : "HQ");
  const employeeCode = (emp as any)?.employee_code || (emp as any)?.candidate_code || (emp as any)?.id?.slice(0, 8) || m.employee_id?.slice(0, 8);
  const buLabel = emp?.branches?.name || (emp as any)?.bu_full_name || buCode || "Main BU";
  const division = m.new_values?.division || (emp as any)?.division || "—";
  const department = (m.new_values?.department || emp?.department || "—").toUpperCase();
  const siteName = (emp as any)?.work_locations?.name || (emp as any)?.site || buCode || "";
  const designation = m.new_values?.role || m.new_values?.designation || emp?.role || (emp as any)?.position || "Staff";
  const empType = m.new_values?.employment_type || (emp as any)?.employment_type || "Full Time";
  const contractType = (m.new_values?.contract_type || (emp as any)?.contract_type || "FDC").toUpperCase();
  const contractStart = formatDate((emp as any)?.contract_start_date || (emp as any)?.start_date || m.effective_date);
  const contractEnd = (emp as any)?.contract_end_date ? formatDate((emp as any)?.contract_end_date) : "Ongoing";
  const contractPeriod = `${contractStart} - ${contractEnd}`;
  const joiningDate = formatDate((emp as any)?.join_date || (emp as any)?.start_date);

  const rawSalary = m.new_values?.salary ?? m.new_values?.new_salary ?? (emp as any)?.contract_rate ?? (emp as any)?.basic_salary ?? "0";
  const salaryFreq = m.new_values?.contract_rate_frequency || (emp as any)?.tax_salary_frequency || "Monthly";
  const salaryStruct = (emp as any)?.payroll_structure === "Standard Monthly" ? "Gross" : ((emp as any)?.payroll_structure || "Gross");

  return (
    <tr
      className={`hover:bg-[#253C7D]/3 dark:hover:bg-slate-800/50 transition-colors border-b border-slate-100 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 ${
        isSelected ? "bg-[#253C7D]/5 dark:bg-[#253C7D]/15" : ""
      }`}
    >
      <td className="py-2.5 px-3 text-center">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onSelectOne?.(m.id)}
          className="w-3.5 h-3.5 rounded border-slate-300 dark:border-slate-600 text-[#253C7D] focus:ring-[#253C7D] cursor-pointer"
        />
      </td>

      <td className="py-2.5 px-2 text-center text-slate-400 dark:text-slate-500 font-medium">
        {index + 1}
      </td>

      <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300 whitespace-nowrap font-normal">
        {formatDate(m.effective_date)}
      </td>

      <td className="py-2.5 px-3 whitespace-nowrap font-normal text-slate-800 dark:text-slate-100">
        {typeConfig?.label || m.movement_type?.replace(/_/g, " ") || "Change Status"}
      </td>

      <td className="py-2.5 px-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shrink-0 flex items-center justify-center font-bold text-[11px]">
            {emp?.avatar_url ? (
              <img src={emp.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <DefaultAvatarSvg />
            )}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-slate-900 dark:text-slate-100 hover:text-[#253C7D] transition-colors truncate leading-snug text-xs">
              {fullName}
            </p>
            <span className="inline-flex items-center gap-1 mt-0.5 px-1.5 py-0.2 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-[10px] text-slate-600 dark:text-slate-400 font-mono">
              <i className="ri-global-line text-[10px] text-slate-400" />
              <span>{buLabel} {employeeCode ? `${employeeCode}` : ""}</span>
            </span>
          </div>
        </div>
      </td>

      <td className="py-2.5 px-3">
        <p className="font-medium text-slate-800 dark:text-slate-200 truncate">{designation}</p>
        <span className="inline-block mt-0.5 text-[9px] font-semibold px-1.5 py-0.2 rounded border border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 leading-tight">
          {empType}
        </span>
      </td>

      <td className="py-2.5 px-3">
        <p className="font-medium text-slate-800 dark:text-slate-200 truncate text-[11px]">{division}</p>
      </td>

      <td className="py-2.5 px-3">
        <p className="font-bold text-slate-800 dark:text-slate-100 uppercase text-[11px] truncate">{department}</p>
        {siteName ? (
          <span className="inline-flex items-center gap-1 mt-0.5 px-1.5 py-0.2 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-[10px] text-slate-600 dark:text-slate-400 font-mono">
            <i className="ri-building-line text-[10px] text-slate-400" />
            <span>{siteName}</span>
          </span>
        ) : null}
      </td>

      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300 whitespace-nowrap">{joiningDate}</td>

      <td className="py-2.5 px-3">
        <p className="font-medium text-slate-700 dark:text-slate-200 truncate text-[11px]">{contractType}</p>
        <span className="text-[10px] text-slate-400 dark:text-slate-500 whitespace-nowrap block mt-0.5">{contractPeriod}</span>
      </td>

      <td className="py-2.5 px-3">
        <p className="font-mono text-slate-700 dark:text-slate-200 font-semibold text-xs tracking-wider">
          {showSalary ? `${rawSalary} USD` : "*****"}
        </p>
        <div className="flex items-center gap-1 mt-1">
          <span className="text-[10px] font-normal px-1.5 py-0.5 rounded-[2px] bg-[#5b9bd5] text-white leading-tight whitespace-nowrap">
            {salaryFreq}
          </span>
          <span className="text-[10px] font-normal px-1.5 py-0.5 rounded-[2px] bg-[#5b9bd5] text-white leading-tight whitespace-nowrap">
            {salaryStruct}
          </span>
        </div>
      </td>

      <td className="py-2.5 px-3">
        <span className="inline-block text-[10px] font-medium px-2 py-0.5 rounded-[2px] bg-[#2ecc71] text-white leading-tight whitespace-nowrap">
          Recorded
        </span>
      </td>

      <MovementsTableRowMenu
        movement={m}
        isOpen={openDropdownId === m.id}
        actionRef={actionRef}
        onToggle={onToggleDropdown}
        onSelect={onSelectMovement}
        onEdit={onEditMovement}
        onDelete={onDeleteMovement}
      />
    </tr>
  );
};
