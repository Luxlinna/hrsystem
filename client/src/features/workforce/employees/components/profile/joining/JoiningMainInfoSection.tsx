import { memo, useState } from "react";
import type { Employee, ReportEntry } from "../../../types";
import { formatDMY } from "../../../dateUtils";
import { formatKhmerFullName } from "../../../nameUtils";

interface Props {
  employee: Employee;
  manager?: ReportEntry | null;
}

export const JoiningMainInfoSection = memo(function JoiningMainInfoSection({
  employee,
  manager,
}: Props) {
  const [showJoinRate, setShowJoinRate] = useState(false);
  const [showContractRate, setShowContractRate] = useState(false);
  const [showAfterRate, setShowAfterRate] = useState(false);

  const site = employee.site || employee.work_locations?.name || employee.branches?.name || "—";
  const department = employee.department || employee.division || "—";
  const designation = employee.position || employee.employee_level || employee.title || "—";
  const businessUnit = employee.bu_full_name || employee.branches?.name || employee.code_bu || "—";
  const employeeLevel = employee.employee_level || (employee as any).level || "—";
  let supervisorName = manager
    ? formatKhmerFullName(manager) !== "—"
      ? formatKhmerFullName(manager)
      : employee.line_manager || "—"
    : employee.line_manager || "—";
  if (supervisorName.toLowerCase() === "pisey pin") supervisorName = "Pin Pisey";
  if (supervisorName.toLowerCase() === "senglong te") supervisorName = "Te Senglong";
  if (supervisorName.toLowerCase() === "chem khoeurn") supervisorName = "Khoeurn Chem";

  const joinDate = formatDMY(employee.join_date || employee.start_date);
  const effectiveDate = formatDMY(employee.contract_effective_date || employee.join_date || employee.start_date);
  const endDate = employee.contract_end_date ? formatDMY(employee.contract_end_date) : "Never";

  const joinRateVal =
    employee.basic_salary != null && String(employee.basic_salary).trim() !== ""
      ? String(employee.basic_salary)
      : employee.contract_rate != null && String(employee.contract_rate).trim() !== ""
      ? String(employee.contract_rate)
      : "0";

  const contractRateVal =
    employee.contract_rate != null && String(employee.contract_rate).trim() !== ""
      ? String(employee.contract_rate)
      : employee.basic_salary != null && String(employee.basic_salary).trim() !== ""
      ? String(employee.basic_salary)
      : "0";

  const afterRateVal =
    employee.contract_rate_after != null && String(employee.contract_rate_after).trim() !== ""
      ? String(employee.contract_rate_after)
      : "0";

  return (
    <div className="space-y-6">
      {/* 1. Joining Info */}
      <div className="space-y-3">
        <h3 className="text-[13px] font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider">
          JOINING INFO
        </h3>

        <div className="space-y-1.5 text-[13px]">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-y-1">
            <span className="sm:col-span-3 text-slate-700 dark:text-slate-300">Joining Date</span>
            <span className="sm:col-span-9 text-slate-900 dark:text-slate-100">{joinDate}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-y-1">
            <span className="sm:col-span-3 text-slate-700 dark:text-slate-300">Division</span>
            <span className="sm:col-span-9 text-slate-900 dark:text-slate-100">{employee.division || "—"}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-y-1">
            <span className="sm:col-span-3 text-slate-700 dark:text-slate-300">Department</span>
            <span className="sm:col-span-9 text-slate-900 dark:text-slate-100">{department}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-y-1">
            <span className="sm:col-span-3 text-slate-700 dark:text-slate-300">Site</span>
            <span className="sm:col-span-9 text-slate-900 dark:text-slate-100">{site}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-y-1">
            <span className="sm:col-span-3 text-slate-700 dark:text-slate-300">Position</span>
            <span className="sm:col-span-9 text-slate-900 dark:text-slate-100">{designation}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-y-1 items-center">
            <span className="sm:col-span-3 text-slate-700 dark:text-slate-300">Salary</span>
            <span className="sm:col-span-9 text-slate-900 dark:text-slate-100 inline-flex items-center gap-1.5 flex-wrap">
              <span>USD {showJoinRate ? joinRateVal : "*****"}</span>
              <span className="bg-[#0284c7] text-white text-[10px] font-semibold px-1.5 py-0.5 rounded shadow-2xs">
                Monthly
              </span>
              <span className="bg-[#0284c7] text-white text-[10px] font-semibold px-1.5 py-0.5 rounded shadow-2xs">
                Gross
              </span>
              <button
                type="button"
                onClick={() => setShowJoinRate((p) => !p)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                title={showJoinRate ? "Hide Salary" : "Show Salary"}
              >
                <i className={showJoinRate ? "ri-eye-off-line" : "ri-eye-line"} />
              </button>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-y-1">
            <span className="sm:col-span-3 text-slate-700 dark:text-slate-300">Supervisor</span>
            <span className="sm:col-span-9 text-slate-900 dark:text-slate-100">{supervisorName}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-y-1">
            <span className="sm:col-span-3 text-slate-700 dark:text-slate-300">Business Unit</span>
            <span className="sm:col-span-9 text-slate-900 dark:text-slate-100">{businessUnit}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-y-1">
            <span className="sm:col-span-3 text-slate-700 dark:text-slate-300">Employee Level</span>
            <span className="sm:col-span-9 text-slate-900 dark:text-slate-100">{employeeLevel}</span>
          </div>
        </div>
      </div>

      {/* 2. Contract Info */}
      <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
        <h3 className="text-[13px] font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider">
          CONTRACT INFO
        </h3>

        <div className="space-y-1.5 text-[13px]">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-y-1">
            <span className="sm:col-span-3 text-slate-700 dark:text-slate-300">Contract Type</span>
            <span className="sm:col-span-9 text-slate-900 dark:text-slate-100">
              {employee.contract_type || "PERMANENT (UDC)"}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-y-1">
            <span className="sm:col-span-3 text-slate-700 dark:text-slate-300">Employee Type</span>
            <span className="sm:col-span-9 text-slate-900 dark:text-slate-100">
              {employee.employment_type || "FULL-TIME"}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-y-1">
            <span className="sm:col-span-3 text-slate-700 dark:text-slate-300">Effective Date</span>
            <span className="sm:col-span-9 text-slate-900 dark:text-slate-100">{effectiveDate}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-y-1">
            <span className="sm:col-span-3 text-slate-700 dark:text-slate-300">End Date</span>
            <span className="sm:col-span-9 text-slate-900 dark:text-slate-100">{endDate}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-y-1 items-center">
            <span className="sm:col-span-3 text-slate-700 dark:text-slate-300">Salary</span>
            <span className="sm:col-span-9 text-slate-900 dark:text-slate-100 inline-flex items-center gap-1.5 flex-wrap">
              <span>USD {showContractRate ? contractRateVal : "*****"}</span>
              <span className="bg-[#0284c7] text-white text-[10px] font-semibold px-1.5 py-0.5 rounded shadow-2xs">
                Monthly
              </span>
              <button
                type="button"
                onClick={() => setShowContractRate((p) => !p)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                title={showContractRate ? "Hide Salary" : "Show Salary"}
              >
                <i className={showContractRate ? "ri-eye-off-line" : "ri-eye-line"} />
              </button>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-y-1 items-center">
            <span className="sm:col-span-3 text-slate-700 dark:text-slate-300">Salary After Probation</span>
            <span className="sm:col-span-9 text-slate-900 dark:text-slate-100 inline-flex items-center gap-1.5 flex-wrap">
              <span>USD {showAfterRate ? afterRateVal : "*****"}</span>
              <span className="bg-[#0284c7] text-white text-[10px] font-semibold px-1.5 py-0.5 rounded shadow-2xs">
                Monthly
              </span>
              <button
                type="button"
                onClick={() => setShowAfterRate((p) => !p)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                title={showAfterRate ? "Hide Salary" : "Show Salary"}
              >
                <i className={showAfterRate ? "ri-eye-off-line" : "ri-eye-line"} />
              </button>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-y-1">
            <span className="sm:col-span-3 text-slate-700 dark:text-slate-300">Remark</span>
            <span className="sm:col-span-9 text-slate-900 dark:text-slate-100">
              {employee.contract_remark || "—"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
});
