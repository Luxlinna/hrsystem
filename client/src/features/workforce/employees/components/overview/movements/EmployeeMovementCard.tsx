import { memo } from "react";
import type { Employee } from "../../../types";
import type { EmployeeMovement } from "@/features/workforce/movements/types";
import { formatMovementTitle } from "./movementDisplayUtils";

interface EmployeeMovementCardProps {
  movement: EmployeeMovement;
  employee: Employee;
  isCurrent?: boolean;
  privacyHidden?: boolean;
  onClickDetails?: (m: EmployeeMovement) => void;
}

const formatDateHyphen = (d?: string | null): string => {
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

  const startDateFormatted = formatDateHyphen(rawStart);
  let endDateFormatted = rawEnd ? formatDateHyphen(rawEnd) : "";

  if (!endDateFormatted || endDateFormatted === "-" || endDateFormatted === "—") {
    const yearMatch = typeStr.match(/(\d+)\s*[-_ ]?\s*year/i);
    if (yearMatch && rawStart) {
      try {
        const s = new Date(rawStart);
        if (!isNaN(s.getTime())) {
          const yearsToAdd = parseInt(yearMatch[1], 10);
          const end = new Date(s);
          end.setFullYear(end.getFullYear() + yearsToAdd);
          endDateFormatted = formatDateHyphen(end.toISOString());
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

export const EmployeeMovementCard = memo(function EmployeeMovementCard({
  movement: m,
  employee,
  isCurrent = false,
  privacyHidden = false,
  onClickDetails,
}: EmployeeMovementCardProps) {
  const title = formatMovementTitle(m);
  const dateStr = formatDateHyphen(m.effective_date);

  const division = m.new_values?.division || (employee as any)?.division || "-";
  const rawDept = m.new_values?.department || m.new_values?.target_department || employee.department || "-";
  const department = rawDept === "—" || !rawDept ? "-" : rawDept;

  const rawPosition = m.new_values?.role || m.new_values?.position || (employee as any)?.position || employee.role || "-";
  const level = m.new_values?.employee_level || (employee as any)?.employee_level || (employee as any)?.level || "";
  const position = formatPosition(rawPosition, level);

  const bu = m.new_values?.bu || m.new_values?.bu_full_name || (employee as any)?.bu_full_name || (Array.isArray(employee.branches) ? employee.branches[0]?.name : employee.branches?.name) || "-";

  const rawContractType = m.new_values?.contract_type || (employee as any)?.contract_type || "2-Year FDC";
  const rawContractStart = m.effective_date || m.new_values?.contract_start_date || employee.start_date || employee.join_date;
  const rawContractEnd = m.new_values?.contract_end_date || (employee as any)?.contract_end_date || (employee as any)?.fdc_end_date;
  const contractPeriod = formatContractPeriod(rawContractType, rawContractStart, rawContractEnd);

  const site = m.new_values?.site || (employee as any)?.work_locations?.name || employee.site || "-";
  const empType = formatEmploymentType(m.new_values?.employment_type || employee.employment_type || "Full-Time");
  const supervisor = m.new_values?.supervisor || m.new_values?.target_reports_to || employee.line_manager || employee.reports_to || "-";

  const baseSalary = resolveNum(
    m.new_values?.salary,
    m.new_values?.new_salary,
    m.new_values?.rate,
    (employee as any)?.contract_rate,
    (employee as any)?.basic_salary,
    100
  );

  const afterSalary = resolveNum(
    m.new_values?.salary_after_probation,
    m.new_values?.salary_after_contract,
    (employee as any)?.salary_after_probation,
    (employee as any)?.contract_rate_after,
    baseSalary > 0 ? baseSalary : 100
  );

  const salaryDisplay = baseSalary > 0 ? baseSalary.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "100.00";
  const salaryAfterDisplay = afterSalary > 0 ? afterSalary.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : salaryDisplay;

  const remarks = m.remarks || "";
  const hasRemark = Boolean(remarks.trim());

  return (
    <div
      onClick={() => onClickDetails && onClickDetails(m)}
      className="space-y-2 font-sans cursor-pointer group"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-900 dark:text-white text-sm sm:text-base">
          <span className="underline underline-offset-2">{title}</span> : {dateStr}
        </h3>
        {isCurrent && (
          <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold">
            Current Status
          </span>
        )}
      </div>

      {/* 5-Column x 2-Row Solid Border Table */}
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
                  <span>USD {privacyHidden ? "*****" : salaryDisplay}</span>
                  <span className="bg-[#FFFF00] text-black px-1 font-bold inline-block">Gross</span>
                </div>
                <div className="italic text-gray-700 dark:text-gray-300 text-[11px] sm:text-xs mt-1">
                  Salary
                </div>
              </td>
              <td className="border border-black dark:border-slate-500 p-2 sm:p-2.5 align-top w-1/5">
                <div className="font-bold text-black dark:text-white text-xs sm:text-[13px] leading-tight flex items-center flex-wrap gap-1">
                  <span>USD {privacyHidden ? "*****" : salaryAfterDisplay}</span>
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

      {/* Remark Footer */}
      {hasRemark && (
        <div className="pt-0.5 text-slate-800 dark:text-slate-200 text-xs sm:text-[13px]">
          <span className="underline underline-offset-2">Remark</span> : <span>{remarks}</span>
        </div>
      )}
    </div>
  );
});

