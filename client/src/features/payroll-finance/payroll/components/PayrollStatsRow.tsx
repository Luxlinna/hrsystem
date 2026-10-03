import { memo } from "react";
import type { PayrollStats } from "../types";

interface PayrollStatsRowProps {
  stats: PayrollStats;
  filterStatus: string;
  onFilterStatus: (status: string) => void;
}

export const PayrollStatsRow = memo(function PayrollStatsRow({
  stats,
  filterStatus,
  onFilterStatus,
}: PayrollStatsRowProps) {
  const { totalBase, totalBonus, totalDeductions, totalNet, employeeCount, avgNetPay, pendingCount } = stats;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 mb-6">
      {/* Net Payout */}
      <div
        onClick={() => onFilterStatus("all")}
        className={`bg-white dark:bg-slate-900 border rounded-2xl p-4 transition-all cursor-pointer shadow-2xs hover:shadow-xs relative overflow-hidden group ${
          filterStatus === "all"
            ? "border-[#253C7D] dark:border-sky-400 ring-2 ring-[#253C7D]/10 dark:ring-sky-400/15"
            : "border-gray-200/80 dark:border-slate-700"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-[#253C7D] dark:text-sky-400 uppercase tracking-wider">
            Total Net Pay
          </span>
          <div className="w-7 h-7 rounded-lg bg-[#253C7D]/10 dark:bg-sky-400/15 text-[#253C7D] dark:text-sky-400 flex items-center justify-center">
            <i className="ri-bank-card-line text-sm" />
          </div>
        </div>
        <p className="text-2xl font-black text-[#253C7D] dark:text-sky-300 mt-2">
          ${(totalNet / 1000).toFixed(1)}k
        </p>
        <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-0.5">
          ${totalNet.toLocaleString()} net across {employeeCount} records
        </p>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#253C7D] dark:bg-sky-400" />
      </div>

      {/* Total Base Salary */}
      <div className="bg-white dark:bg-slate-900 border border-gray-200/80 dark:border-slate-700 rounded-2xl p-4 shadow-2xs relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
            Total Base Salary
          </span>
          <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-700/60 text-slate-700 dark:text-slate-300 flex items-center justify-center">
            <i className="ri-money-dollar-circle-line text-sm" />
          </div>
        </div>
        <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">
          ${(totalBase / 1000).toFixed(1)}k
        </p>
        <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-0.5">
          Avg ${(avgNetPay / 1000).toFixed(1)}k / employee
        </p>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-500" />
      </div>

      {/* Total Bonuses */}
      <div
        onClick={() => onFilterStatus("paid")}
        className={`bg-white dark:bg-slate-900 border rounded-2xl p-4 transition-all cursor-pointer shadow-2xs hover:shadow-xs relative overflow-hidden group ${
          filterStatus === "paid"
            ? "border-emerald-500 ring-2 ring-emerald-500/10"
            : "border-gray-200/80 dark:border-slate-700"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
            Bonuses & Additions
          </span>
          <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <i className="ri-gift-line text-sm" />
          </div>
        </div>
        <p className="text-2xl font-black text-emerald-700 dark:text-emerald-400 mt-2">
          +${(totalBonus / 1000).toFixed(1)}k
        </p>
        <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-0.5">
          Performance & allowances
        </p>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500" />
      </div>

      {/* Total Deductions */}
      <div className="bg-white dark:bg-slate-900 border border-gray-200/80 dark:border-slate-700 rounded-2xl p-4 shadow-2xs relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
            Total Deductions
          </span>
          <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center">
            <i className="ri-calculator-line text-sm" />
          </div>
        </div>
        <p className="text-2xl font-black text-rose-700 dark:text-rose-400 mt-2">
          -${(totalDeductions / 1000).toFixed(1)}k
        </p>
        <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-0.5">
          Taxes, benefits & withholdings
        </p>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-rose-500" />
      </div>

      {/* Pending Approval */}
      <div
        onClick={() => onFilterStatus("pending")}
        className={`col-span-2 lg:col-span-1 bg-white dark:bg-slate-900 border rounded-2xl p-4 transition-all cursor-pointer shadow-2xs hover:shadow-xs relative overflow-hidden group ${
          filterStatus === "pending"
            ? "border-amber-500 ring-2 ring-amber-500/10"
            : "border-gray-200/80 dark:border-slate-700"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
            Pending Approval
          </span>
          <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <i className="ri-time-line text-sm" />
          </div>
        </div>
        <p className="text-2xl font-black text-amber-700 dark:text-amber-400 mt-2">
          {pendingCount}
        </p>
        <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-0.5">
          Awaiting sign-off
        </p>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500" />
      </div>
    </div>
  );
});
