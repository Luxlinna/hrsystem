import { memo } from "react";
import type { PayrollRecord } from "../../types";
import { printPayslip } from "../../payrollUtils";

interface PayslipModalProps {
  record: PayrollRecord | null;
  onClose: () => void;
}

export const PayslipModal = memo(function PayslipModal({
  record,
  onClose,
}: PayslipModalProps) {
  if (!record) return null;

  const empName = record.employees
    ? `${record.employees.first_name} ${record.employees.last_name}`
    : "Employee";
  const gross = Number(record.base_salary) + Number(record.bonus);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-4 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#253C7D]/10 dark:bg-sky-400/15 text-[#253C7D] dark:text-sky-300 flex items-center justify-center">
              <i className="ri-file-text-line text-lg" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-gray-900 dark:text-white">
                Official Payslip Preview
              </h3>
              <p className="text-xs text-gray-400 dark:text-slate-500">
                Period: {record.month} &middot; {empName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 flex items-center justify-center text-gray-400 cursor-pointer"
          >
            <i className="ri-close-line text-lg" />
          </button>
        </div>

        {/* Payslip Card Preview */}
        <div className="bg-gray-50 dark:bg-slate-800/60 rounded-2xl p-5 border border-gray-200/80 dark:border-slate-700 space-y-3.5 text-xs">
          <div className="grid grid-cols-2 gap-2 pb-3 border-b border-gray-200 dark:border-slate-700">
            <div>
              <span className="text-gray-400 dark:text-slate-500 block">Department</span>
              <span className="font-bold text-gray-800 dark:text-white">
                {record.employees?.department || "General"}
              </span>
            </div>
            <div>
              <span className="text-gray-400 dark:text-slate-500 block">Role</span>
              <span className="font-bold text-gray-800 dark:text-white">
                {record.employees?.role || "Team Member"}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-slate-400">Base Salary</span>
              <span className="font-bold text-gray-900 dark:text-white">
                ${Number(record.base_salary).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-emerald-600 dark:text-emerald-400">Bonuses & Allowances</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                +${Number(record.bonus).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-rose-600 dark:text-rose-400">Taxes & Deductions</span>
              <span className="font-bold text-rose-600 dark:text-rose-400">
                -${Number(record.deductions).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between pt-3 border-t border-gray-200 dark:border-slate-700 text-sm font-black text-[#253C7D] dark:text-sky-300">
              <span>Net Take-Home Pay</span>
              <span>${Number(record.net_pay).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="mt-6 flex items-center justify-end gap-2.5">
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-bold text-gray-500 hover:text-gray-800 dark:text-slate-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>
          <button
            onClick={() => printPayslip(record)}
            className="px-5 py-2.5 bg-[#253C7D] hover:bg-[#1E3064] text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <i className="ri-printer-line text-sm" />
            Print / Save PDF
          </button>
        </div>
      </div>
    </div>
  );
});
