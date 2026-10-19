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

  const rawTaxMethod = m.new_values?.tax_method || (employee as any)?.tax_method;
  const rawSalaryFreq = m.new_values?.contract_rate_frequency || (employee as any)?.contract_rate_frequency;
  const salaryBadge =
    rawTaxMethod && rawTaxMethod !== "Resident"
      ? rawTaxMethod
      : rawTaxMethod === "Resident"
      ? "Gross"
      : rawSalaryFreq || "Gross";

  const remarks = m.remarks || "";
  const hasRemark = Boolean(remarks.trim());

  const lowerTitle = title.toLowerCase();
  const isExit =
    lowerTitle.includes("exit") ||
    lowerTitle.includes("resign") ||
    lowerTitle.includes("terminat");
  const isTransfer = lowerTitle.includes("transfer");
  const isPromote = lowerTitle.includes("promot");
  const isProbation = lowerTitle.includes("probation");

  const accentBorder = isExit
    ? "border-l-4 border-l-rose-500"
    : isCurrent
    ? "border-l-4 border-l-[#00a884]"
    : isTransfer
    ? "border-l-4 border-l-sky-500"
    : isPromote || isProbation
    ? "border-l-4 border-l-indigo-500"
    : "border-l-4 border-l-[#00a884]";

  return (
    <div
      onClick={() => onClickDetails && onClickDetails(m)}
      className={`bg-white dark:bg-slate-900 border border-gray-200/90 dark:border-slate-800 rounded-sm sm:rounded-md pl-4 pr-5 py-3.5 relative shadow-xs hover:shadow-sm transition-all cursor-pointer ${accentBorder}`}
    >
      {/* Card Header */}
      <div className="flex items-center gap-2 mb-3.5 flex-wrap">
        <span className="font-bold text-[13px] text-gray-900 dark:text-slate-100">
          {title}
        </span>
        <span className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-slate-400 font-medium">
          <i className="ri-calendar-line text-xs" />
          {dateStr}
        </span>
        {isCurrent && (
          <span className="px-2 py-0.5 text-[10px] font-semibold text-white bg-[#00a884] rounded shadow-2xs">
            Current
          </span>
        )}
      </div>

      {/* 5-Column x 2-Row Data Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-y-3.5 gap-x-5 text-[13px]">
        {/* Row 1, Col 1: Division */}
        <div>
          <p className="font-bold text-gray-800 dark:text-slate-200 text-[13px] leading-snug break-words" title={division}>
            {division}
          </p>
          <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">Division</p>
        </div>

        {/* Row 1, Col 2: Department */}
        <div>
          <p className="font-bold text-gray-800 dark:text-slate-200 text-[13px] leading-snug break-words" title={department}>
            {department}
          </p>
          <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">Department</p>
        </div>

        {/* Row 1, Col 3: Position */}
        <div>
          <p className="font-bold text-gray-800 dark:text-slate-200 text-[13px] leading-snug break-words" title={position}>
            {position}
          </p>
          <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">Position</p>
        </div>

        {/* Row 1, Col 4: Business Unit */}
        <div>
          <p className="font-bold text-gray-800 dark:text-slate-200 text-[13px] leading-snug break-words" title={bu}>
            {bu}
          </p>
          <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">Business Unit</p>
        </div>

        {/* Row 1, Col 5: Contract Type */}
        <div>
          <p className="font-bold text-gray-800 dark:text-slate-200 text-[13px] leading-snug break-words" title={contractPeriod}>
            {contractPeriod}
          </p>
          <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">Contract Type</p>
        </div>

        {/* Row 2, Col 1: Site */}
        <div>
          <p className="font-bold text-gray-800 dark:text-slate-200 text-[13px] leading-snug break-words" title={site}>
            {site}
          </p>
          <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">Site</p>
        </div>

        {/* Row 2, Col 2: Employee Type */}
        <div>
          <p className="font-bold text-gray-800 dark:text-slate-200 text-[13px] leading-snug break-words" title={empType}>
            {empType}
          </p>
          <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">Employee Type</p>
        </div>

        {/* Row 2, Col 3: Supervisor */}
        <div>
          <p className="font-bold text-gray-800 dark:text-slate-200 text-[13px] leading-snug break-words" title={supervisor}>
            {supervisor}
          </p>
          <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">Supervisor</p>
        </div>

        {/* Row 2, Col 4: Salary */}
        <div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-bold text-gray-800 dark:text-slate-200 text-[13px]">
              USD {privacyHidden ? "*****" : salaryDisplay}
            </span>
            <span className="bg-[#0284c7] text-white text-[10px] font-semibold px-1.5 py-0.5 rounded shadow-2xs">
              {salaryBadge}
            </span>
          </div>
          <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">Salary</p>
        </div>

        {/* Row 2, Col 5: Salary After Probation */}
        <div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-bold text-gray-800 dark:text-slate-200 text-[13px]">
              USD {privacyHidden ? "*****" : salaryAfterDisplay}
            </span>
            <span className="bg-[#0284c7] text-white text-[10px] font-semibold px-1.5 py-0.5 rounded shadow-2xs">
              {salaryBadge}
            </span>
          </div>
          <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">Salary After Probation</p>
        </div>
      </div>

      {/* Remark Footer */}
      {hasRemark && (
        <div className="text-[11.5px] text-gray-600 dark:text-slate-300 mt-2.5">
          <span className="font-medium text-gray-700 dark:text-slate-200">Remark: </span>
          <span>{remarks}</span>
        </div>
      )}
    </div>
  );
});
