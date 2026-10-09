import React from "react";
import type { EmployeeMovement } from "../types";
import { MOVEMENT_TYPES } from "../constants";
import { DefaultAvatarSvg } from "@/components/DefaultAvatarSvg";
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
  if (!d) return "—";
  try {
    const date = new Date(d);
    if (isNaN(date.getTime())) return d;
    return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;
  } catch {
    return d;
  }
};

const formatSupervisor = (sup?: string | null) => {
  if (!sup || sup === "—") return "—";
  let s = String(sup).trim();
  if (s.toLowerCase() === "pisey pin") return "Pin Pisey";
  if (s.toLowerCase() === "senglong te") return "Te Senglong";
  if (s.toLowerCase() === "chem khoeurn") return "Khoeurn Chem";
  return s;
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
  const fullName = emp ? formatKhmerFullName(emp) : "—";
  const employeeCode = (emp as any)?.employee_code || (emp as any)?.candidate_code || (emp as any)?.biometric_user_id || "—";
  const division = m.new_values?.division || (emp as any)?.division || "—";
  const department = (m.new_values?.department || emp?.department || "—").toUpperCase();
  const position = m.new_values?.position || m.new_values?.role || (emp as any)?.position || emp?.role || "—";
  const buName = m.new_values?.bu || m.new_values?.branch_name || (emp as any)?.bu_full_name || emp?.branches?.name || "—";
  const site = m.new_values?.site || (emp as any)?.work_locations?.name || (emp as any)?.site || "—";
  const contractType = (m.new_values?.contract_type || (emp as any)?.contract_type || "—").toUpperCase();
  
  const contractStart = formatDate((emp as any)?.contract_start_date || (emp as any)?.contract_effective_date || (emp as any)?.join_date || (emp as any)?.start_date || m.effective_date);
  const contractEnd = (emp as any)?.contract_end_date ? formatDate((emp as any)?.contract_end_date) : "Ongoing";
  const contractDate = `${contractStart} - ${contractEnd}`;

  const employeeLevel = m.new_values?.employee_level || (emp as any)?.employee_level || (emp as any)?.level || "—";
  const employeeType = m.new_values?.employment_type || (emp as any)?.employment_type || "Full Time";
  const supervisor = formatSupervisor(m.new_values?.supervisor || m.new_values?.target_reports_to || (emp as any)?.line_manager || (emp as any)?.reports_to);

  const salVal = m.new_values?.salary ?? m.new_values?.new_salary ?? (emp as any)?.contract_rate ?? (emp as any)?.basic_salary;
  const salFreq = m.new_values?.contract_rate_frequency || (emp as any)?.tax_salary_frequency || "Monthly";
  const salary = salVal != null && !isNaN(Number(salVal)) ? (showSalary ? `$${Number(salVal).toFixed(2)} (${salFreq})` : "*****") : "—";

  const salAfterVal = m.new_values?.salary_after_contract ?? (emp as any)?.contract_rate_after;
  const salAfterFreq = m.new_values?.contract_rate_after_frequency || (emp as any)?.contract_rate_after_frequency || "Monthly";
  const salaryAfterProbation = salAfterVal != null && !isNaN(Number(salAfterVal)) && Number(salAfterVal) > 0 ? (showSalary ? `$${Number(salAfterVal).toFixed(2)} (${salAfterFreq})` : "*****") : "—";

  return (
    <tr
      className={`hover:bg-[#253C7D]/3 dark:hover:bg-slate-800/50 transition-colors border-b border-slate-100 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 whitespace-nowrap ${
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

      <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">
        {formatDate(m.effective_date)}
      </td>

      <td className="py-2.5 px-3">
        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
          {typeConfig?.label || m.movement_type?.replace(/_/g, " ") || "Change Status"}
        </span>
      </td>

      <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-slate-400 text-[11px]">
        {employeeCode}
      </td>

      <td className="py-2.5 px-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0 flex items-center justify-center font-bold text-[10px]">
            {emp?.avatar_url ? (
              <img src={emp.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <DefaultAvatarSvg />
            )}
          </div>
          <span className="font-semibold text-slate-900 dark:text-slate-100">{fullName}</span>
        </div>
      </td>

      <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">{division}</td>

      <td className="py-2.5 px-3 font-medium text-slate-800 dark:text-slate-200">{department}</td>

      <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">{position}</td>

      <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">{buName}</td>

      <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">{site}</td>

      <td className="py-2.5 px-3 font-medium text-slate-700 dark:text-slate-300">{contractType}</td>

      <td className="py-2.5 px-3 text-[11px] text-slate-500 dark:text-slate-400">{contractDate}</td>

      <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">{employeeLevel}</td>

      <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">{employeeType}</td>

      <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">{supervisor}</td>

      <td className="py-2.5 px-3 font-mono text-slate-700 dark:text-slate-300">{salary}</td>

      <td className="py-2.5 px-3 font-mono text-slate-700 dark:text-slate-300">{salaryAfterProbation}</td>

      <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400 max-w-[140px] truncate" title={m.remarks || "—"}>
        {m.remarks || "—"}
      </td>

      <td className="py-2.5 px-3">
        <span className="inline-block text-[10px] font-medium px-2 py-0.5 rounded-[2px] bg-[#2ecc71] text-white leading-tight">
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
