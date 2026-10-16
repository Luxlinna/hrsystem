import React from "react";
import type { EmployeeMovement } from "../../types";
import { MOVEMENT_TYPES } from "../../constants";

interface MovementHistoryGridCardProps {
  movement: EmployeeMovement;
  isCurrent?: boolean;
}

const formatDate = (d?: string | null): string => {
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

const formatEmploymentType = (val?: string | null): string => {
  if (!val) return "Full-Time";
  const upper = val.trim().toUpperCase();
  if (upper === "FULL-TIME" || upper === "FULL TIME") return "Full-Time";
  if (upper === "PART-TIME" || upper === "PART TIME") return "Part-Time";
  if (upper === "PROBATION") return "Probation";
  if (upper === "INTERNSHIP") return "Internship";
  if (upper === "CONTRACT") return "Contract";
  return val.trim();
};

const formatContractPeriod = (
  rawType?: string | null,
  rawStart?: string | null,
  rawEnd?: string | null
): string => {
  let typeStr = rawType?.trim() || "2-Year FDC";
  if (/^2-year\s+fdc$/i.test(typeStr)) typeStr = "2-Year FDC";
  else if (/^1-year\s+fdc$/i.test(typeStr)) typeStr = "1-Year FDC";
  else if (/^3-year\s+fdc$/i.test(typeStr)) typeStr = "3-Year FDC";
  else if (/^fdc$/i.test(typeStr)) typeStr = "2-Year FDC";
  else if (/^udc$/i.test(typeStr)) typeStr = "UDC";

  const startDateFormatted = formatDate(rawStart);

  let endDateFormatted = rawEnd ? formatDate(rawEnd) : "";

  if (!endDateFormatted || endDateFormatted === "-" || endDateFormatted === "—") {
    const yearMatch = typeStr.match(/(\d+)\s*[-_ ]?\s*year/i);
    if (yearMatch && rawStart) {
      try {
        const s = new Date(rawStart);
        if (!isNaN(s.getTime())) {
          const yearsToAdd = parseInt(yearMatch[1], 10);
          const end = new Date(s);
          end.setFullYear(end.getFullYear() + yearsToAdd);
          endDateFormatted = formatDate(end.toISOString());
        }
      } catch {
        // fallback
      }
    }
  }

  if (!endDateFormatted || endDateFormatted === "-" || endDateFormatted === "—") {
    endDateFormatted = typeStr.toUpperCase().includes("FDC") ? "Ongoing" : "Ongoing";
  }

  if (startDateFormatted === "-") {
    return typeStr;
  }

  return `${typeStr} : ${startDateFormatted} - ${endDateFormatted}`;
};

const formatPosition = (rawRole?: string | null, rawLevel?: string | null): string => {
  const role = rawRole?.trim() || "-";
  const level = rawLevel?.trim() || "";
  if (!level || role === "-") return role;
  if (role.toLowerCase().includes(`(${level.toLowerCase()})`)) return role;
  return `${role} (${level})`;
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
  const typeLabel = m.title || typeConfig?.label || m.movement_type?.replace(/_/g, " ") || "Join";
  const effectiveDate = formatDate(m.effective_date);

  const division = m.new_values?.division || (emp as any)?.division || "-";
  const rawDept = m.new_values?.department || emp?.department || "-";
  const department = rawDept === "—" || !rawDept ? "-" : rawDept;

  const rawPosition = m.new_values?.role || m.new_values?.position || (emp as any)?.position || emp?.role || "-";
  const level = m.new_values?.employee_level || (emp as any)?.employee_level || (emp as any)?.level || "";
  const position = formatPosition(rawPosition, level);

  const bu = m.new_values?.bu || m.new_values?.bu_full_name || (emp as any)?.bu_full_name || emp?.branches?.name || (emp as any)?.company || "-";

  const rawContractType = m.new_values?.contract_type || (emp as any)?.contract_type || "2-Year FDC";
  const rawContractStart = m.effective_date || (emp as any)?.contract_start_date || (emp as any)?.start_date;
  const rawContractEnd = m.new_values?.contract_end_date || (emp as any)?.contract_end_date || (emp as any)?.fdc_end_date;
  const contractPeriod = formatContractPeriod(rawContractType, rawContractStart, rawContractEnd);

  const site = m.new_values?.site || (emp as any)?.work_locations?.name || (emp as any)?.site || "-";
  const empType = formatEmploymentType(m.new_values?.employment_type || (emp as any)?.employment_type || "Full-Time");
  const supervisor = m.new_values?.supervisor || (emp as any)?.line_manager || (emp as any)?.supervisor || (emp as any)?.reports_to || "-";

  const baseSalary = resolveNum(
    m.new_values?.salary,
    m.new_values?.new_salary,
    m.new_values?.rate,
    (emp as any)?.contract_rate,
    (emp as any)?.basic_salary,
    100
  );

  const afterSalary = resolveNum(
    m.new_values?.salary_after_probation,
    m.new_values?.salary_after_contract,
    (emp as any)?.salary_after_probation,
    (emp as any)?.contract_rate_after,
    baseSalary > 0 ? (baseSalary === 100 ? 150 : baseSalary * 1.2) : 150
  );

  const salaryDisplay = baseSalary > 0 ? baseSalary.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "100.00";
  const salaryAfterDisplay = afterSalary > 0 ? afterSalary.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "150.00";

  const remark = m.remarks || `${typeLabel} Status`;

  return (
    <div className="space-y-2 font-sans">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-900 dark:text-white text-sm sm:text-base">
          <span className="underline underline-offset-2">{typeLabel}</span> : {effectiveDate}
        </h3>
        {isCurrent && (
          <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold">
            Current Status
          </span>
        )}
      </div>

      <div className="w-full overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse border border-black dark:border-slate-500 table-fixed bg-white dark:bg-slate-900">
          <tbody>
            <tr>
              <td className="border border-black dark:border-slate-500 p-2 sm:p-2.5 align-top w-1/5">
                <div className="font-bold text-black dark:text-white text-xs sm:text-[13px] leading-tight">
                  {division}
                </div>
                <div className="italic text-gray-700 dark:text-gray-300 text-[11px] sm:text-xs mt-1">
                  Division
                </div>
              </td>
              <td className="border border-black dark:border-slate-500 p-2 sm:p-2.5 align-top w-1/5">
                <div className="font-bold text-black dark:text-white text-xs sm:text-[13px] leading-tight">
                  {department}
                </div>
                <div className="italic text-gray-700 dark:text-gray-300 text-[11px] sm:text-xs mt-1">
                  Department
                </div>
              </td>
              <td className="border border-black dark:border-slate-500 p-2 sm:p-2.5 align-top w-1/5">
                <div className="font-bold text-black dark:text-white text-xs sm:text-[13px] leading-tight">
                  {position}
                </div>
                <div className="italic text-gray-700 dark:text-gray-300 text-[11px] sm:text-xs mt-1">
                  Position
                </div>
              </td>
              <td className="border border-black dark:border-slate-500 p-2 sm:p-2.5 align-top w-1/5">
                <div className="font-bold text-black dark:text-white text-xs sm:text-[13px] leading-tight">
                  {bu}
                </div>
                <div className="italic text-gray-700 dark:text-gray-300 text-[11px] sm:text-xs mt-1">
                  Business Unit
                </div>
              </td>
              <td className="border border-black dark:border-slate-500 p-2 sm:p-2.5 align-top w-1/5">
                <div className="font-bold text-black dark:text-white text-xs sm:text-[13px] leading-tight">
                  {contractPeriod}
                </div>
                <div className="italic text-gray-700 dark:text-gray-300 text-[11px] sm:text-xs mt-1">
                  Contract Type
                </div>
              </td>
            </tr>

            <tr>
              <td className="border border-black dark:border-slate-500 p-2 sm:p-2.5 align-top w-1/5">
                <div className="font-bold text-black dark:text-white text-xs sm:text-[13px] leading-tight">
                  {site}
                </div>
                <div className="italic text-gray-700 dark:text-gray-300 text-[11px] sm:text-xs mt-1">
                  Site
                </div>
              </td>
              <td className="border border-black dark:border-slate-500 p-2 sm:p-2.5 align-top w-1/5">
                <div className="font-bold text-black dark:text-white text-xs sm:text-[13px] leading-tight">
                  {empType}
                </div>
                <div className="italic text-gray-700 dark:text-gray-300 text-[11px] sm:text-xs mt-1">
                  Employee Type
                </div>
              </td>
              <td className="border border-black dark:border-slate-500 p-2 sm:p-2.5 align-top w-1/5">
                <div className="font-bold text-black dark:text-white text-xs sm:text-[13px] leading-tight">
                  {supervisor}
                </div>
                <div className="italic text-gray-700 dark:text-gray-300 text-[11px] sm:text-xs mt-1">
                  Supervisor
                </div>
              </td>
              <td className="border border-black dark:border-slate-500 p-2 sm:p-2.5 align-top w-1/5">
                <div className="font-bold text-black dark:text-white text-xs sm:text-[13px] leading-tight flex items-center flex-wrap gap-1">
                  <span>USD {salaryDisplay}</span>
                  <span className="bg-[#FFFF00] text-black px-1 font-bold inline-block">Gross</span>
                </div>
                <div className="italic text-gray-700 dark:text-gray-300 text-[11px] sm:text-xs mt-1">
                  Salary
                </div>
              </td>
              <td className="border border-black dark:border-slate-500 p-2 sm:p-2.5 align-top w-1/5">
                <div className="font-bold text-black dark:text-white text-xs sm:text-[13px] leading-tight flex items-center flex-wrap gap-1">
                  <span>USD {salaryAfterDisplay}</span>
                  <span className="bg-[#FFFF00] text-black px-1 font-bold inline-block">Gross</span>
                </div>
                <div className="italic text-gray-700 dark:text-gray-300 text-[11px] sm:text-xs mt-1">
                  Salary After Probation
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="pt-0.5 text-slate-800 dark:text-slate-200 text-xs sm:text-[13px]">
        <span className="underline underline-offset-2">Remark</span> : <span>{remark}</span>
      </div>
    </div>
  );
};

