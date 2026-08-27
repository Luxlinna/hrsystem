import { memo } from "react";
import { formatMonthLabel } from "../payrollUtils";

interface PayrollHeaderProps {
  periodMode: "month" | "all";
  selectedMonth: string;
  canViewAll: boolean;
  onExportCSV: () => void;
  onOpenAddModal: () => void;
}

export const PayrollHeader = memo(function PayrollHeader({
  periodMode,
  selectedMonth,
  canViewAll,
  onExportCSV,
  onOpenAddModal,
}: PayrollHeaderProps) {
  const selectedMonthLabel = formatMonthLabel(selectedMonth);

  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-1">
          <span>Financial Operations</span>
          <i className="ri-arrow-right-s-line text-xs" />
          <span className="text-[#253C7D] dark:text-sky-400 font-bold">Compensation & Payroll</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center gap-2.5">
          <span>Payroll Overview</span>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#253C7D]/10 dark:bg-sky-400/15 text-[#253C7D] dark:text-sky-300">
            {periodMode === "month" ? selectedMonthLabel : "All Historical Periods"}
          </span>
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 mt-1">
          {canViewAll
            ? "Manage employee compensations, bonuses, deductions, and generate payslips across all branches."
            : "View your payslips, salary breakdowns, and compensation history."}
        </p>
      </div>

      {/* Top Actions */}
      <div className="flex items-center gap-2.5 flex-wrap">
        <button
          onClick={onExportCSV}
          className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-gray-200/80 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-200 text-xs font-bold rounded-xl shadow-2xs transition-all cursor-pointer"
        >
          <i className="ri-file-excel-2-line text-emerald-600 dark:text-emerald-400 text-sm" />
          Export CSV
        </button>

        {canViewAll && (
          <button
            onClick={onOpenAddModal}
            className="inline-flex items-center gap-2 bg-[#253C7D] hover:bg-[#1E3064] text-white px-4 py-2.5 rounded-xl text-xs sm:text-[13px] font-bold transition-all shadow-sm hover:shadow-md cursor-pointer active:scale-98"
          >
            <i className="ri-add-circle-line text-base font-bold" />
            Add Payroll Record
          </button>
        )}
      </div>
    </div>
  );
});
