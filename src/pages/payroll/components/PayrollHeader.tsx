import { memo } from "react";
import type { PayrollRecord } from "../types";
import { formatMonthLabel } from "../payrollUtils";
import { PayrollExportMenu } from "./PayrollExportMenu";

interface PayrollHeaderProps {
  periodMode: "month" | "all";
  selectedMonth: string;
  canViewAll: boolean;
  branchName?: string;
  isSuperAdmin: boolean;
  onExportCSV?: () => void;
  onOpenAddModal: () => void;
  onOpenPolicyModal?: () => void;
  records?: PayrollRecord[];
}

export const PayrollHeader = memo(function PayrollHeader({
  periodMode,
  selectedMonth,
  canViewAll,
  branchName,
  isSuperAdmin,
  onOpenAddModal,
  onOpenPolicyModal,
  records = [],
}: PayrollHeaderProps) {
  const selectedMonthLabel = formatMonthLabel(selectedMonth);

  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-1">
          <span>Financial Operations</span>
          <i className="ri-arrow-right-s-line text-xs" />
          <span className="text-[#253C7D] dark:text-sky-400 font-bold">Compensation &amp; Payroll</span>
          {branchName && (
            <>
              <i className="ri-arrow-right-s-line text-xs" />
              <span className="px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200/80 text-amber-800 font-bold text-[10px] flex items-center gap-1">
                <i className="ri-building-line text-[10px]" /> {branchName}
              </span>
            </>
          )}
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center gap-2.5">
          <span>Payroll Management</span>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#253C7D]/10 dark:bg-sky-400/15 text-[#253C7D] dark:text-sky-300">
            {periodMode === "month" ? selectedMonthLabel : "All Historical Periods"}
          </span>
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 mt-1">
          {canViewAll
            ? "Manage employee compensations, bonuses, statutory deductions, and branch payroll policies."
            : "View your payslips, salary breakdowns, and compensation history."}
        </p>
      </div>

      {/* Top Actions */}
      <div className="flex items-center gap-2.5 flex-wrap">
        {onOpenPolicyModal && canViewAll && (
          <button
            onClick={onOpenPolicyModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-amber-300/80 hover:bg-amber-50/50 text-amber-900 dark:text-amber-300 text-xs font-bold rounded-xl shadow-2xs transition-all cursor-pointer"
            title="Configure branch-isolated payroll policies"
          >
            <i className="ri-shield-keyhole-line text-amber-600 text-sm" />
            Branch Policy
          </button>
        )}

        {/* 3-Format Export Dropdown */}
        <PayrollExportMenu
          records={records}
          periodMode={periodMode}
          selectedMonth={selectedMonth}
        />

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
