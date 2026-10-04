import { memo } from "react";
import { Link } from "react-router-dom";
import type { PayrollRecord } from "../../types";
import { STATUS_CONFIG } from "../../constants";
import { initials } from "../../payrollUtils";

interface PayrollCardItemProps {
  record: PayrollRecord;
  canViewAll: boolean;
  onUpdateStatus: (id: string, status: "paid" | "processed" | "pending") => void;
  onOpenPayslip: (r: PayrollRecord) => void;
  onEditRecord: (r: PayrollRecord) => void;
  onDeleteRecord: (id: string, empName: string) => void;
}

export const PayrollCardItem = memo(function PayrollCardItem({
  record,
  canViewAll,
  onUpdateStatus,
  onOpenPayslip,
  onEditRecord,
  onDeleteRecord,
}: PayrollCardItemProps) {
  const emp = record.employees;
  const empName = emp ? `${emp.first_name} ${emp.last_name}` : "Unknown Employee";
  const statusCfg = STATUS_CONFIG[record.status] || STATUS_CONFIG.processed;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-200/80 dark:border-slate-700 p-5 shadow-2xs hover:shadow-xs transition-all space-y-4 flex flex-col justify-between">
      <div>
        {/* Header: Employee & Status */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            {emp?.avatar_url ? (
              <img
                src={emp.avatar_url}
                alt=""
                className="w-10 h-10 rounded-full object-cover shrink-0 border border-gray-100 dark:border-slate-700"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-[#253C7D]/10 dark:bg-sky-400/15 text-[#253C7D] dark:text-sky-300 font-extrabold flex items-center justify-center text-xs shrink-0">
                {initials(emp?.first_name, emp?.last_name)}
              </div>
            )}
            <div className="min-w-0">
              {emp ? (
                <Link
                  to={`/employees/${emp.id}`}
                  className="font-extrabold text-xs sm:text-sm text-gray-900 dark:text-white hover:text-[#253C7D] dark:hover:text-sky-300 truncate block transition-colors"
                >
                  {empName}
                </Link>
              ) : (
                <span className="font-bold text-gray-400 text-xs">Former Staff</span>
              )}
              <p className="text-[11px] text-gray-400 dark:text-slate-500 truncate">
                {emp?.role || "Staff"} &middot; {emp?.department || "General"}
              </p>
            </div>
          </div>

          <span
            className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full border shrink-0 ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}
          >
            <i className={statusCfg.icon} />
            {statusCfg.label}
          </span>
        </div>

        {/* Net Take-Home Hero */}
        <div className="p-3 bg-gray-50 dark:bg-slate-800/60 rounded-2xl border border-gray-100 dark:border-slate-700/60 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider block">
              Net Take-Home
            </span>
            <span className="text-xl font-black text-[#253C7D] dark:text-sky-300">
              ${Number(record.net_pay || 0).toLocaleString()}
            </span>
          </div>
          <span className="text-xs font-extrabold text-gray-700 dark:text-slate-300 px-2.5 py-1 bg-white dark:bg-slate-700 rounded-xl shadow-2xs">
            {record.month}
          </span>
        </div>

        {/* Breakdown Row */}
        <div className="grid grid-cols-3 gap-2 mt-3 text-center text-xs">
          <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40">
            <span className="text-[10px] text-gray-400 dark:text-slate-500 block">Base</span>
            <span className="font-bold text-gray-800 dark:text-slate-200">
              ${Number(record.base_salary || 0).toLocaleString()}
            </span>
          </div>
          <div className="p-2 rounded-xl bg-emerald-50/50 dark:bg-emerald-500/10">
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block">Bonus</span>
            <span className="font-bold text-emerald-700 dark:text-emerald-300">
              +${Number(record.bonus || 0).toLocaleString()}
            </span>
          </div>
          <div className="p-2 rounded-xl bg-rose-50/50 dark:bg-rose-500/10">
            <span className="text-[10px] text-rose-600 dark:text-rose-400 block">Deduct</span>
            <span className="font-bold text-rose-700 dark:text-rose-300">
              -${Number(record.deductions || 0).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="pt-3 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between gap-2">
        <button
          onClick={() => onOpenPayslip(record)}
          className="flex-1 py-1.5 px-3 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <i className="ri-file-list-3-line" />
          Payslip
        </button>

        {canViewAll && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => onEditRecord(record)}
              className="p-1.5 text-gray-500 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-500/10 rounded-lg transition-colors cursor-pointer"
              title="Edit"
            >
              <i className="ri-edit-line text-xs" />
            </button>
            <button
              onClick={() => onDeleteRecord(record.id, empName)}
              className="p-1.5 text-gray-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
              title="Delete"
            >
              <i className="ri-delete-bin-line text-xs" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
});
