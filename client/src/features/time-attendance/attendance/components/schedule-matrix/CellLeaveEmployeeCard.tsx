import { useState, memo } from "react";

export interface FullEmployee {
  id: string;
  first_name: string;
  last_name: string;
  display_name?: string | null;
  full_name?: string | null;
  employee_code?: string | null;
  biometric_user_id?: string | null;
  role?: string | null;
  department?: string | null;
  avatar_url?: string | null;
  join_date?: string | null;
  reports_to?: string | null;
  branch_id?: string | null;
  status?: string | null;
  basic_salary?: number | string | null;
  contract_rate?: number | string | null;
  contract_rate_currency?: string | null;
  contract_rate_frequency?: string | null;
  tax_method?: string | null;
  contract_type?: string | null;
  employment_type?: string | null;
  site?: string | null;
  branches?: { name: string } | null;
  work_locations?: { name: string } | null;
}

interface CellLeaveEmployeeCardProps {
  employee: FullEmployee | null;
  fallbackName: string;
  empCode: string;
  supervisorName: string;
  siteName: string;
  joinDateDisplay: string;
}

export const CellLeaveEmployeeCard = memo(function CellLeaveEmployeeCard({
  employee,
  fallbackName,
  empCode,
  supervisorName,
  siteName,
  joinDateDisplay,
}: CellLeaveEmployeeCardProps) {
  const [showRateSalary, setShowRateSalary] = useState(false);

  const rawSalary = employee?.basic_salary ?? employee?.contract_rate ?? null;
  const currency = employee?.contract_rate_currency || "USD";
  const numSalary = rawSalary !== null && rawSalary !== undefined && rawSalary !== "" ? Number(rawSalary) : 650;
  const formattedSalary = `${currency} ${Number.isNaN(numSalary) ? "650.00" : numSalary.toFixed(2)}`;
  const frequency = employee?.contract_rate_frequency || "Monthly";
  const taxMethod = employee?.tax_method || "Gross";
  const empType = employee?.employment_type || "FULL-TIME";
  const contractType = employee?.contract_type || "PERMANENT (UDC)";

  return (
    <div className="sm:ml-[25%] bg-white dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700/80 rounded-xl p-5 shadow-2xs">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
        <div className="flex flex-col items-center shrink-0">
          <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-700 border-2 border-gray-200 dark:border-slate-600 flex items-center justify-center overflow-hidden text-slate-400">
            {employee?.avatar_url ? (
              <img src={employee.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <svg className="w-10 h-10 fill-current text-slate-300 dark:text-slate-500" viewBox="0 0 24 24">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
            )}
          </div>
          <span className="mt-2 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-white bg-[#10b981] shadow-2xs uppercase tracking-tight">
            Employed
          </span>
        </div>

        <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-x-5 gap-y-3.5 text-xs">
          <div>
            <h4 className="font-bold text-gray-900 dark:text-slate-100 text-[13px] leading-tight mb-2">
              {employee ? (employee.display_name?.trim() || employee.full_name?.trim() || `${employee.last_name} ${employee.first_name}`) : fallbackName}
            </h4>
            <div className="mb-2">
              <p className="font-medium text-gray-800 dark:text-slate-200">{empCode}</p>
              <p className="text-[10px] text-gray-400 dark:text-slate-500">Employee Code</p>
            </div>
            <div className="mb-2">
              <p className="font-medium text-gray-800 dark:text-slate-200 leading-tight">
                {employee?.role || "Accounting Manager"}
              </p>
              <p className="text-[10px] text-gray-400 dark:text-slate-500">Position</p>
            </div>
            <div>
              <p className="font-bold text-gray-800 dark:text-slate-200 uppercase tracking-tight">
                {employee?.department || "FINANCE AND ACCOUNTING"}
              </p>
              <p className="text-[10px] text-gray-400 dark:text-slate-500">Department</p>
            </div>
          </div>

          <div className="sm:pt-6">
            <div className="mb-2">
              <p className="font-medium text-gray-800 dark:text-slate-200">{supervisorName}</p>
              <p className="text-[10px] text-gray-400 dark:text-slate-500">Supervisor</p>
            </div>
            <div className="mb-2">
              <p className="font-medium text-gray-800 dark:text-slate-200 uppercase">{empType}</p>
              <p className="text-[10px] text-gray-400 dark:text-slate-500">Employee Type</p>
            </div>
            <div>
              <p className="font-medium text-gray-800 dark:text-slate-200 uppercase">{contractType}</p>
              <p className="text-[10px] text-gray-400 dark:text-slate-500">Contract Type</p>
            </div>
          </div>

          <div className="sm:pt-6">
            <div className="mb-2">
              <p className="font-medium text-gray-800 dark:text-slate-200">{siteName}</p>
              <p className="text-[10px] text-gray-400 dark:text-slate-500">Site</p>
            </div>
            <div className="mb-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-medium text-gray-800 dark:text-slate-200">
                  {showRateSalary ? formattedSalary : `${currency} *****`}
                </span>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold text-white bg-[#3b82f6]">
                  {frequency}
                </span>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold text-white bg-[#2563eb]">
                  {taxMethod}
                </span>
                <button
                  type="button"
                  onClick={() => setShowRateSalary((p) => !p)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 ml-0.5 cursor-pointer"
                  title={showRateSalary ? "Hide Rate" : "Show Rate"}
                >
                  <i className={`ri-eye-${showRateSalary ? "off-" : ""}line text-xs`} />
                </button>
              </div>
              <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-0.5">Rate</p>
            </div>
            <div>
              <p className="font-medium text-gray-800 dark:text-slate-200">{joinDateDisplay}</p>
              <p className="text-[10px] text-gray-400 dark:text-slate-500">Joining Date</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
