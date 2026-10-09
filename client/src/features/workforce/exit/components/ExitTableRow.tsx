import React from "react";
import type { EmployeeExit } from "../types";
import { DefaultAvatarSvg } from "@/components/DefaultAvatarSvg";
import { getBranchCode } from "@/features/workforce/employees/constants";
import { ExitTableRowMenu } from "./ExitTableRowMenu";
import { formatKhmerFullName } from "@/features/workforce/employees/nameUtils";

interface ExitTableRowProps {
  exitItem: EmployeeExit;
  index: number;
  showSalary?: boolean;
  canManage?: boolean;
  openDropdownId: string | null;
  actionRef: React.RefObject<HTMLTableCellElement | null>;
  onToggleDropdown: (id: string) => void;
  onView: (exit: EmployeeExit) => void;
  onEdit: (exit: EmployeeExit) => void;
  onDelete: (id: string) => void;
  onInterview?: (exit: EmployeeExit) => void;
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

export const ExitTableRow: React.FC<ExitTableRowProps> = ({
  exitItem: ex,
  index,
  showSalary = false,
  canManage = false,
  openDropdownId,
  actionRef,
  onToggleDropdown,
  onView,
  onEdit,
  onDelete,
  onInterview,
}) => {
  const emp = ex.employees as any;
  const fullName = formatKhmerFullName(emp);

  const buName = emp?.branches?.name || emp?.bu_full_name || emp?.company || "";
  const buCode = emp?.code_bu || (buName ? getBranchCode(buName) : "HQ");
  const employeeCode = emp?.employee_code || emp?.candidate_code || emp?.id?.slice(0, 8) || "";
  const division = emp?.division || "N/A";
  const department = (emp?.department || "—").toUpperCase();
  const siteName = emp?.work_locations?.name || emp?.site || buCode || "";
  const position = emp?.role || emp?.position || "Staff";
  const empType = emp?.employment_type || "FULL-TIME";
  const contractType = (emp?.contract_type || "PERMANENT (UDC)").toUpperCase();
  const contractStart = formatDate(emp?.contract_start_date || emp?.join_date || emp?.start_date);
  const contractEnd = emp?.contract_end_date ? formatDate(emp?.contract_end_date) : "Never";
  const contractPeriod = `${contractStart} - ${contractEnd}`;
  const rawSalary = emp?.contract_rate ?? emp?.basic_salary ?? "0";
  const salaryFreq = emp?.contract_rate_frequency || "Monthly";
  const salaryStruct = emp?.contract_rate_type || "Gross";
  const reasonText = ex.reason_description || ex.reason_type || "Personal Reason";

  return (
    <tr className="hover:bg-[#253C7D]/3 dark:hover:bg-slate-800/50 transition-colors border-b border-slate-100 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200">
      <td className="py-2.5 px-2 text-center text-slate-400 dark:text-slate-500 font-medium">{index + 1}</td>
      <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300 whitespace-nowrap font-normal">{formatDate(ex.last_working_day)}</td>
      <td className="py-2.5 px-3 whitespace-nowrap font-normal text-slate-800 dark:text-slate-100 capitalize">{ex.exit_type?.replace(/_/g, " ") || "Resignation"}</td>
      <td className="py-2.5 px-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shrink-0 flex items-center justify-center font-bold text-[11px]">
            {emp?.avatar_url ? <img src={emp.avatar_url} alt="" className="w-full h-full object-cover" /> : <DefaultAvatarSvg />}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-slate-900 dark:text-slate-100 truncate leading-snug text-xs">{fullName}</p>
            <span className="inline-flex items-center gap-1 mt-0.5 px-1.5 py-0.2 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-[10px] text-slate-600 dark:text-slate-400 font-mono">
              <i className="ri-global-line text-[10px] text-slate-400" />
              <span>{buName || buCode} {employeeCode}</span>
            </span>
          </div>
        </div>
      </td>
      <td className="py-2.5 px-3">
        <p className="font-medium text-slate-800 dark:text-slate-200 truncate">{position}</p>
        <span className="inline-block mt-0.5 text-[9px] font-semibold px-1.5 py-0.2 rounded border border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 leading-tight">{empType}</span>
      </td>
      <td className="py-2.5 px-3"><p className="font-medium text-slate-800 dark:text-slate-200 truncate text-[11px]">{division}</p></td>
      <td className="py-2.5 px-3">
        <p className="font-bold text-slate-800 dark:text-slate-100 uppercase text-[11px] truncate">{department}</p>
        {siteName && (
          <span className="inline-flex items-center gap-1 mt-0.5 px-1.5 py-0.2 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-[10px] text-slate-600 dark:text-slate-400 font-mono">
            <i className="ri-building-line text-[10px] text-slate-400" />
            <span>{siteName}</span>
          </span>
        )}
      </td>
      <td className="py-2.5 px-3">
        <p className="font-medium text-slate-700 dark:text-slate-200 truncate text-[11px]">{contractType}</p>
        <span className="text-[10px] text-slate-400 dark:text-slate-500 whitespace-nowrap block mt-0.5">{contractPeriod}</span>
      </td>
      <td className="py-2.5 px-3">
        <p className="font-mono text-slate-700 dark:text-slate-200 font-semibold text-xs tracking-wider">{showSalary ? `${rawSalary} USD` : "*****"}</p>
        <div className="flex items-center gap-1 mt-1">
          <span className="text-[10px] font-normal px-1.5 py-0.5 rounded-[2px] bg-[#5b9bd5] text-white leading-tight whitespace-nowrap">{salaryFreq}</span>
          <span className="text-[10px] font-normal px-1.5 py-0.5 rounded-[2px] bg-[#5b9bd5] text-white leading-tight whitespace-nowrap">{salaryStruct}</span>
        </div>
      </td>
      <td className="py-2.5 px-3 max-w-[160px]"><p className="font-normal text-slate-700 dark:text-slate-300 truncate text-xs" title={reasonText}>{reasonText}</p></td>
      <td className="py-2.5 px-3 text-slate-400 text-xs">—</td>
      <td className="py-2.5 px-3"><span className="inline-block text-[10px] font-medium px-2 py-0.5 rounded-[2px] bg-[#2ecc71] text-white leading-tight whitespace-nowrap">Recorded</span></td>
      <ExitTableRowMenu
        exitItem={ex}
        isOpen={openDropdownId === ex.id}
        actionRef={actionRef}
        canManage={canManage}
        onToggle={onToggleDropdown}
        onView={onView}
        onEdit={onEdit}
        onDelete={onDelete}
        onInterview={onInterview}
      />
    </tr>
  );
};
