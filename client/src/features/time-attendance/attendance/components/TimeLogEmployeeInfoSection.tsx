import { memo } from "react";
import type { Employee } from "../types";
import { formatBiometricId } from "@/lib/biometricUtils";

interface Props {
  empDetail: any;
  emp: Employee | undefined;
  site: string;
  joiningDate: string;
  showSalary: boolean;
  setShowSalary: React.Dispatch<React.SetStateAction<boolean>>;
}

export const TimeLogEmployeeInfoSection = memo(function TimeLogEmployeeInfoSection({
  empDetail,
  emp,
  site,
  joiningDate,
  showSalary,
  setShowSalary,
}: Props) {
  const fullName = emp
    ? (emp.display_name?.trim() || emp.full_name?.trim() || `${emp.first_name} ${emp.last_name}`)
    : "Unknown Employee";
  const empBioId = formatBiometricId(
    empDetail?.biometric_user_id || emp?.biometric_user_id,
    empDetail?.branches?.name || (emp as any)?.branches?.name
  );
  const empCode = empBioId || empDetail?.employee_code || emp?.employee_code || "—";
  const designation = empDetail?.role || empDetail?.position || emp?.role || "Staff";
  const division = empDetail?.division || emp?.division || "—";
  const department = (empDetail?.department || emp?.department || "—").toUpperCase();
  const supervisor = empDetail?.line_manager || empDetail?.supervisor || empDetail?.reports_to || "—";
  const employeeType = (empDetail?.employment_type || emp?.employment_type || "FULL-TIME").toUpperCase();
  const contractType = (empDetail?.contract_type || emp?.contract_type || "PERMANENT (UDC)").toUpperCase();

  const rawSalary = empDetail?.basic_salary ?? empDetail?.contract_rate ?? emp?.basic_salary ?? emp?.contract_rate ?? null;
  const currency = empDetail?.contract_rate_currency || emp?.contract_rate_currency || "USD";
  const numSalary = rawSalary !== null && rawSalary !== undefined && rawSalary !== "" ? Number(rawSalary) : null;
  const formattedSalary = numSalary !== null && !Number.isNaN(numSalary) ? `${currency} ${numSalary.toFixed(2)}` : `${currency} —`;
  const frequency = empDetail?.contract_rate_frequency || emp?.contract_rate_frequency || "Monthly";
  const taxMethod = empDetail?.tax_method || emp?.tax_method || "Gross";

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-bold text-[#253C7D] dark:text-sky-400 uppercase tracking-wider">
        EMPLOYEE INFO
      </h3>

      <div className="bg-white dark:bg-slate-900 border border-gray-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          {/* Avatar + Employed Badge */}
          <div className="flex flex-col items-center shrink-0">
            <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-gray-200 dark:border-slate-700 flex items-center justify-center overflow-hidden text-slate-400">
              {emp?.avatar_url || empDetail?.avatar_url ? (
                <img src={emp?.avatar_url || empDetail?.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <svg className="w-12 h-12 fill-current text-slate-300 dark:text-slate-600" viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
              )}
            </div>
            <span className="mt-2 px-3 py-0.5 rounded-full text-[10px] font-bold text-white bg-emerald-500 shadow-2xs uppercase tracking-tight">
              Employed
            </span>
          </div>

          {/* Details 3 Columns */}
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs">
            {/* Column 1 */}
            <div>
              <h2 className="font-bold text-gray-900 dark:text-slate-100 text-sm leading-tight mb-3">
                {fullName}
              </h2>
              <div className="mb-3">
                <p className="font-bold text-gray-800 dark:text-slate-200 font-mono">{empCode}</p>
                <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-0.5">Employee Code</p>
              </div>
              <div className="mb-3">
                <p className="font-bold text-gray-800 dark:text-slate-200 leading-tight">{designation}</p>
                <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-0.5">Position</p>
              </div>
              <div className="mb-3">
                <p className="font-bold text-gray-800 dark:text-slate-200 leading-tight">{division}</p>
                <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-0.5">Division</p>
              </div>
              <div>
                <p className="font-bold text-gray-800 dark:text-slate-200 uppercase tracking-tight">{department}</p>
                <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-0.5">Department</p>
              </div>
            </div>

            {/* Column 2 */}
            <div className="sm:pt-8">
              <div className="mb-3">
                <p className="font-bold text-gray-800 dark:text-slate-200">{supervisor}</p>
                <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-0.5">Supervisor</p>
              </div>
              <div className="mb-3">
                <p className="font-bold text-gray-800 dark:text-slate-200 uppercase">{employeeType}</p>
                <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-0.5">Employee Type</p>
              </div>
              <div>
                <p className="font-bold text-gray-800 dark:text-slate-200 uppercase">{contractType}</p>
                <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-0.5">Contract Type</p>
              </div>
            </div>

            {/* Column 3 */}
            <div className="sm:pt-8">
              <div className="mb-3">
                <p className="font-bold text-gray-800 dark:text-slate-200">{site}</p>
                <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-0.5">Site</p>
              </div>

              <div className="mb-3">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-bold text-gray-800 dark:text-slate-200">
                    {showSalary ? formattedSalary : `${currency} *****`}
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#2563EB] text-white">
                    {frequency}
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#0284C7] text-white">
                    {taxMethod}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowSalary((p) => !p)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 cursor-pointer text-xs"
                    title={showSalary ? "Hide Rate" : "Show Rate"}
                  >
                    <i className={showSalary ? "ri-eye-off-line" : "ri-eye-line"} />
                  </button>
                </div>
                <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-0.5">Rate</p>
              </div>

              <div>
                <p className="font-bold text-gray-800 dark:text-slate-200">{joiningDate}</p>
                <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-0.5">Joining Date</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
