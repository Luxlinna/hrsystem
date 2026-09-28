import { memo } from "react";
import type { Employee } from "../../../types";
import type { EmployeeMovement } from "@/pages/movements/types";
import {
  formatDMY,
  formatMovementTitle,
  resolveMovementDisplayValues,
} from "./movementDisplayUtils";

interface EmployeeMovementCardProps {
  movement: EmployeeMovement;
  employee: Employee;
  isCurrent?: boolean;
  privacyHidden?: boolean;
  onClickDetails?: (m: EmployeeMovement) => void;
}

export const EmployeeMovementCard = memo(function EmployeeMovementCard({
  movement: m,
  employee,
  isCurrent = false,
  privacyHidden = true,
  onClickDetails,
}: EmployeeMovementCardProps) {
  const title = formatMovementTitle(m);
  const dateStr = formatDMY(m.effective_date);
  const {
    site,
    department,
    designation,
    contractTypeStr,
    employeeType,
    supervisor,
    rawSalary,
    salaryFreq,
    rawSalaryAfter,
    salaryAfterFreq,
  } = resolveMovementDisplayValues(m, employee);

  const isResignation =
    m.movement_type === ("resignation" as any) ||
    title.toLowerCase().includes("resignation") ||
    m.remarks?.toLowerCase().includes("resigned");

  const remarks = m.remarks || "";
  const hasRemark = Boolean(remarks.trim());

  return (
    <div
      onClick={() => onClickDetails && onClickDetails(m)}
      className="bg-white dark:bg-slate-900 border border-gray-200/90 dark:border-slate-800 rounded-sm sm:rounded-md pl-4 pr-5 py-3.5 relative border-l-[5px] border-l-[#0284c7] shadow-2xs hover:shadow-sm transition-all cursor-pointer"
    >
      {/* Card Header */}
      <div className="flex items-center gap-2.5 mb-3 flex-wrap">
        <span className="font-bold text-[13px] text-gray-900 dark:text-slate-100">{title}</span>
        <span className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-slate-400 font-medium">
          <i className="ri-calendar-line text-[11px]" />
          {dateStr}
        </span>
        {isCurrent && (
          <span className="px-2 py-0.5 text-[10px] font-bold text-white bg-emerald-500 rounded shadow-2xs">
            Current
          </span>
        )}
      </div>

      {/* 4-Column x 2-Row Data Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-y-3.5 gap-x-6 text-xs">
        {/* Row 1 */}
        <div>
          <p className="font-bold text-gray-800 dark:text-slate-200 text-xs truncate" title={site}>
            {site}
          </p>
          <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-0.5">Site</p>
        </div>

        <div>
          <p
            className="font-bold text-gray-800 dark:text-slate-200 text-xs truncate"
            title={department}
          >
            {department}
          </p>
          <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-0.5">Department</p>
        </div>

        <div>
          <p
            className="font-bold text-gray-800 dark:text-slate-200 text-xs truncate"
            title={designation}
          >
            {designation}
          </p>
          <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-0.5">Designation</p>
        </div>

        <div>
          <p
            className="font-bold text-gray-800 dark:text-slate-200 text-xs truncate"
            title={contractTypeStr}
          >
            {contractTypeStr}
          </p>
          <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-0.5">Contract Type</p>
        </div>

        {/* Row 2 */}
        <div>
          <p className="font-bold text-gray-800 dark:text-slate-200 text-xs truncate">
            {employeeType}
          </p>
          <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-0.5">Employee Type</p>
        </div>

        <div>
          <p className="font-bold text-gray-800 dark:text-slate-200 text-xs truncate" title={supervisor}>
            {supervisor}
          </p>
          <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-0.5">Supervisor</p>
        </div>

        <div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-bold text-gray-800 dark:text-slate-200 text-xs">
              {privacyHidden ? "*****" : `$${Number(rawSalary).toFixed(2)}`}
            </span>
            <span className="px-1.5 py-0.2 text-[9.5px] font-bold text-white bg-[#2563EB] rounded">
              {salaryFreq}
            </span>
          </div>
          <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-0.5">Salary</p>
        </div>

        <div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-bold text-gray-800 dark:text-slate-200 text-xs">
              {privacyHidden ? "*****" : `$${Number(rawSalaryAfter).toFixed(2)}`}
            </span>
            <span className="px-1.5 py-0.2 text-[9.5px] font-bold text-white bg-[#2563EB] rounded">
              {salaryAfterFreq}
            </span>
          </div>
          <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-0.5">
            Salary After Contract
          </p>
        </div>
      </div>

      {/* Remark or Reason Footer */}
      {hasRemark && (
        <div className="mt-3.5 pt-2.5 border-t border-gray-100 dark:border-slate-800/80 text-[11.5px] text-gray-600 dark:text-slate-300 leading-relaxed">
          <span className="font-semibold text-gray-800 dark:text-slate-200">
            {isResignation ? "Reason:" : "Remark:"}{" "}
          </span>
          <span>{remarks}</span>
        </div>
      )}
    </div>
  );
});
