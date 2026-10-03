import { memo, useState } from "react";
import type { Employee } from "../../../types";

interface Props {
  employee: Employee;
}

export const PayrollInfoSection = memo(function PayrollInfoSection({ employee }: Props) {
  const [showTaxRate, setShowTaxRate] = useState(false);

  const taxSalary = employee.tax_salary ?? employee.basic_salary ?? employee.contract_rate ?? "";
  const taxCurrency = employee.tax_salary_currency || "USD";
  const taxFreq = employee.tax_salary_frequency || employee.contract_rate_frequency || "Monthly";

  const workingHoursText = employee.working_hour
    ? `Manual ${employee.working_hour}`
    : employee.apply_working_hours_per_day
    ? "Automatic"
    : "Manual 8 Hours";

  return (
    <div className="space-y-6">
      {/* 1. Payroll Info */}
      <div className="space-y-3">
        <h3 className="text-[13px] font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider">
          PAYROLL INFO
        </h3>

        <div className="space-y-1.5 text-[13px]">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-y-1">
            <span className="sm:col-span-3 text-slate-700 dark:text-slate-300">Payroll Structure</span>
            <span className="sm:col-span-9 text-slate-900 dark:text-slate-100">
              {employee.payroll_structure || ""}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-y-1">
            <span className="sm:col-span-3 text-slate-700 dark:text-slate-300">Tax Expense Allowance</span>
            <span className="sm:col-span-9 text-slate-900 dark:text-slate-100">
              {employee.allowance || ""}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-y-1">
            <span className="sm:col-span-3 text-slate-700 dark:text-slate-300">Working hours per day</span>
            <span className="sm:col-span-9 text-slate-900 dark:text-slate-100">{workingHoursText}</span>
          </div>
        </div>
      </div>

      {/* 2. Tax Info */}
      <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
        <h3 className="text-[13px] font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider">
          TAX INFO
        </h3>

        <div className="space-y-1.5 text-[13px]">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-y-1 items-center">
            <span className="sm:col-span-3 text-slate-700 dark:text-slate-300">Tax Salary</span>
            <span className="sm:col-span-9 text-slate-900 dark:text-slate-100 inline-flex items-center gap-1.5 flex-wrap">
              {taxSalary ? (
                <>
                  <span>{taxCurrency} {showTaxRate ? taxSalary : ""}</span>
                  <span className="bg-[#0284c7] text-white text-[10px] font-semibold px-1.5 py-0.5 rounded shadow-2xs">
                    {taxFreq}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowTaxRate((p) => !p)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    title={showTaxRate ? "Hide Tax Salary" : "Show Tax Salary"}
                  >
                    <i className={showTaxRate ? "ri-eye-off-line" : "ri-eye-line"} />
                  </button>
                </>
              ) : (
                <span>{taxCurrency}</span>
              )}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
});
