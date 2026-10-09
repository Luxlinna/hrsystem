import React from "react";
import type { EmployeeMovement } from "../../types";
import { MOVEMENT_TYPES } from "../../constants";

interface MovementHistoryGridCardProps {
  movement: EmployeeMovement;
  isCurrent?: boolean;
}

const formatDate = (d?: string | null) => {
  if (!d) return "-";
  try {
    const date = new Date(d);
    if (isNaN(date.getTime())) return d;
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    return `${day}-${month}-${date.getFullYear()}`;
  } catch {
    return d;
  }
};

const resolveNum = (...candidates: any[]): number => {
  for (const c of candidates) {
    if (c !== null && c !== undefined && c !== "" && c !== "—" && !String(c).includes("*")) {
      const match = String(c).match(/[\d,.]+/);
      if (match) {
        const parsed = parseFloat(match[0].replace(/,/g, ""));
        if (!isNaN(parsed) && parsed > 0) return parsed;
      }
    }
  }
  return 0;
};

export const MovementHistoryGridCard: React.FC<MovementHistoryGridCardProps> = ({
  movement: m,
  isCurrent,
}) => {
  const emp = m.employees;
  const typeConfig = MOVEMENT_TYPES[m.movement_type];
  const typeLabel = typeConfig?.label || m.movement_type?.replace(/_/g, " ") || m.title || "Join";
  const effectiveDate = formatDate(m.effective_date);

  const division = m.new_values?.division || (emp as any)?.division || "-";
  const department = m.new_values?.department || emp?.department || "-";
  const position = m.new_values?.role || m.new_values?.designation || emp?.role || (emp as any)?.position || "-";
  const bu = m.new_values?.bu || (emp as any)?.bu_full_name || emp?.branches?.name || (emp as any)?.company || "-";

  const contractType = m.new_values?.contract_type || (emp as any)?.contract_type || "2-Year FDC";
  const contractStart = formatDate((emp as any)?.contract_start_date || (emp as any)?.start_date || m.effective_date);
  const contractEnd = (emp as any)?.contract_end_date ? formatDate((emp as any)?.contract_end_date) : "Ongoing";
  const contractPeriod = `${contractType} : ${contractStart} - ${contractEnd}`;

  const site = m.new_values?.site || (emp as any)?.work_locations?.name || (emp as any)?.site || "-";
  const empType = m.new_values?.employment_type || (emp as any)?.employment_type || "Full-Time";
  const supervisor = m.new_values?.supervisor || (emp as any)?.line_manager || (emp as any)?.supervisor || (emp as any)?.reports_to || "-";

  const baseSalary = resolveNum(
    m.new_values?.salary,
    m.new_values?.new_salary,
    m.new_values?.rate,
    (emp as any)?.contract_rate,
    (emp as any)?.basic_salary,
    350
  );

  const afterSalary = resolveNum(
    m.new_values?.salary_after_probation,
    m.new_values?.salary_after_contract,
    (emp as any)?.salary_after_probation,
    (emp as any)?.contract_rate_after,
    baseSalary > 0 ? baseSalary * 1.2 : 450
  );

  const salaryDisplay = baseSalary > 0 ? baseSalary.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "350.00";
  const salaryAfterDisplay = afterSalary > 0 ? afterSalary.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "450.00";

  const remark = m.remarks || m.title || `${typeLabel} Status`;

  return (
    <div className="space-y-2 font-sans text-xs">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
          <u>{typeLabel} : {effectiveDate}</u>
        </h3>
        {isCurrent && (
          <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold">
            Current Status
          </span>
        )}
      </div>

      <div className="border border-slate-700 dark:border-slate-600 bg-white dark:bg-slate-900 rounded-none overflow-hidden">
        <div className="grid grid-cols-2 sm:grid-cols-5 border-b border-slate-700 dark:border-slate-600">
          <div className="p-2.5 border-r border-slate-700 dark:border-slate-600 flex flex-col justify-between min-h-[58px]">
            <span className="font-bold text-slate-900 dark:text-white leading-tight">{division}</span>
            <span className="italic text-slate-500 dark:text-slate-400 text-[11px] mt-1">Division</span>
          </div>
          <div className="p-2.5 border-r border-slate-700 dark:border-slate-600 flex flex-col justify-between min-h-[58px]">
            <span className="font-bold text-slate-900 dark:text-white leading-tight">{department}</span>
            <span className="italic text-slate-500 dark:text-slate-400 text-[11px] mt-1">Department</span>
          </div>
          <div className="p-2.5 border-r border-slate-700 dark:border-slate-600 flex flex-col justify-between min-h-[58px]">
            <span className="font-bold text-slate-900 dark:text-white leading-tight">{position}</span>
            <span className="italic text-slate-500 dark:text-slate-400 text-[11px] mt-1">Position</span>
          </div>
          <div className="p-2.5 border-r border-slate-700 dark:border-slate-600 flex flex-col justify-between min-h-[58px]">
            <span className="font-bold text-slate-900 dark:text-white leading-tight">{bu}</span>
            <span className="italic text-slate-500 dark:text-slate-400 text-[11px] mt-1">Business Unit</span>
          </div>
          <div className="p-2.5 flex flex-col justify-between min-h-[58px]">
            <span className="font-bold text-slate-900 dark:text-white leading-tight">{contractPeriod}</span>
            <span className="italic text-slate-500 dark:text-slate-400 text-[11px] mt-1">Contract Type</span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5">
          <div className="p-2.5 border-r border-slate-700 dark:border-slate-600 flex flex-col justify-between min-h-[58px]">
            <span className="font-bold text-slate-900 dark:text-white leading-tight">{site}</span>
            <span className="italic text-slate-500 dark:text-slate-400 text-[11px] mt-1">Site</span>
          </div>
          <div className="p-2.5 border-r border-slate-700 dark:border-slate-600 flex flex-col justify-between min-h-[58px]">
            <span className="font-bold text-slate-900 dark:text-white leading-tight">{empType}</span>
            <span className="italic text-slate-500 dark:text-slate-400 text-[11px] mt-1">Employee Type</span>
          </div>
          <div className="p-2.5 border-r border-slate-700 dark:border-slate-600 flex flex-col justify-between min-h-[58px]">
            <span className="font-bold text-slate-900 dark:text-white leading-tight">{supervisor}</span>
            <span className="italic text-slate-500 dark:text-slate-400 text-[11px] mt-1">Supervisor</span>
          </div>
          <div className="p-2.5 border-r border-slate-700 dark:border-slate-600 flex flex-col justify-between min-h-[58px]">
            <span className="font-bold text-slate-900 dark:text-white leading-tight">
              USD {salaryDisplay} <mark className="bg-yellow-300 text-slate-900 px-1 py-0.2 rounded-xs font-semibold">Gross</mark>
            </span>
            <span className="italic text-slate-500 dark:text-slate-400 text-[11px] mt-1">Salary</span>
          </div>
          <div className="p-2.5 flex flex-col justify-between min-h-[58px]">
            <span className="font-bold text-slate-900 dark:text-white leading-tight">
              USD {salaryAfterDisplay} <mark className="bg-yellow-300 text-slate-900 px-1 py-0.2 rounded-xs font-semibold">Gross</mark>
            </span>
            <span className="italic text-slate-500 dark:text-slate-400 text-[11px] mt-1">Salary After Probation</span>
          </div>
        </div>
      </div>

      <div className="pt-1 text-slate-800 dark:text-slate-200 text-xs">
        <span className="font-medium"><u>Remark</u> : </span>
        <span className="text-slate-700 dark:text-slate-300">{remark}</span>
      </div>
    </div>
  );
};
