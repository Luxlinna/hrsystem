import { memo } from "react";
import { Link } from "react-router-dom";
import type { PayrollRecord } from "../../types";
import { STATUS_CONFIG } from "../../constants";
import { initials } from "../../payrollUtils";

interface PayrollTableRowProps {
  record: PayrollRecord;
  canViewAll: boolean;
  onUpdateStatus: (id: string, status: "paid" | "processed" | "pending") => void;
  onOpenPayslip: (r: PayrollRecord) => void;
  onEditRecord: (r: PayrollRecord) => void;
  onDeleteRecord: (id: string, empName: string) => void;
}

export const PayrollTableRow = memo(function PayrollTableRow({
  record,
  canViewAll,
  onUpdateStatus,
  onOpenPayslip,
  onEditRecord,
  onDeleteRecord,
}: PayrollTableRowProps) {
  const emp = record.employees;
  const empName = emp ? `${emp.first_name} ${emp.last_name}` : "Unknown Employee";
  const statusCfg = STATUS_CONFIG[record.status] || STATUS_CONFIG.processed;

  return (
    <tr className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group text-xs">
      {/* Employee Info */}
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          {emp?.avatar_url ? (
            <img
              src={emp.avatar_url}
              alt=""
              className="w-9 h-9 rounded-full object-cover shrink-0 border border-gray-100 dark:border-slate-700"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-[#253C7D]/10 dark:bg-sky-400/15 text-[#253C7D] dark:text-sky-300 font-extrabold flex items-center justify-center text-xs shrink-0">
              {initials(emp?.first_name, emp?.last_name)}
            </div>
          )}
          <div className="min-w-0">
            {emp ? (
              <Link
                to={`/employees/${emp.id}`}
                className="font-extrabold text-gray-900 dark:text-white hover:text-[#253C7D] dark:hover:text-sky-300 truncate block transition-colors"
              >
                {empName}
              </Link>
            ) : (
              <span className="font-bold text-gray-400">Former Staff Member</span>
            )}
            <p className="text-[11px] text-gray-400 dark:text-slate-500 truncate mt-0.5">
              {emp?.role || "Staff"}
            </p>
          </div>
        </div>
      </td>

      {/* Department & Branch */}
      <td className="px-5 py-4">
        <span className="font-bold text-gray-700 dark:text-slate-300">
          {emp?.department || "General"}
        </span>
        {emp?.branches?.name && (
          <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-0.5">
            {emp.branches.name}
          </p>
        )}
      </td>

      {/* Month Period */}
      <td className="px-5 py-4">
        <span className="font-extrabold text-gray-800 dark:text-slate-200">
          {record.month}
        </span>
      </td>

      {/* Base Salary */}
      <td className="px-5 py-4 text-gray-600 dark:text-slate-400 font-medium">
        ${Number(record.base_salary || 0).toLocaleString()}
      </td>

      {/* Bonuses */}
      <td className="px-5 py-4 text-emerald-600 dark:text-emerald-400 font-semibold">
        {record.bonus > 0 ? `+$${Number(record.bonus).toLocaleString()}` : "—"}
      </td>

      {/* Deductions */}
      <td className="px-5 py-4 text-rose-600 dark:text-rose-400 font-semibold">
        {record.deductions > 0 ? `-$${Number(record.deductions).toLocaleString()}` : "—"}
      </td>

      {/* Net Pay */}
      <td className="px-5 py-4">
        <span className="text-sm font-black text-[#253C7D] dark:text-sky-300">
          ${Number(record.net_pay || 0).toLocaleString()}
        </span>
      </td>

      {/* Status */}
      <td className="px-5 py-4">
        {canViewAll ? (
          <select
            value={record.status}
            onChange={(e) => onUpdateStatus(record.id, e.target.value as any)}
            className={`text-[11px] font-extrabold px-2.5 py-1 rounded-full border cursor-pointer focus:outline-none transition-all ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}
          >
            <option value="paid">Paid</option>
            <option value="processed">Processed</option>
            <option value="pending">Pending</option>
          </select>
        ) : (
          <span
            className={`inline-flex items-center gap-1.5 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}
          >
            <i className={statusCfg.icon} />
            {statusCfg.label}
          </span>
        )}
      </td>

      {/* Actions */}
      <td className="px-5 py-4 text-right">
        <div className="flex items-center justify-end gap-1.5 opacity-80 group-hover:opacity-100">
          <button
            onClick={() => onOpenPayslip(record)}
            className="p-1.5 text-gray-500 hover:text-[#253C7D] dark:hover:text-sky-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title="View Official Payslip"
          >
            <i className="ri-file-list-3-line text-sm" />
          </button>

          {canViewAll && (
            <>
              <button
                onClick={() => onEditRecord(record)}
                className="p-1.5 text-gray-500 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-500/10 rounded-lg transition-colors cursor-pointer"
                title="Edit Record"
              >
                <i className="ri-edit-line text-sm" />
              </button>
              <button
                onClick={() => onDeleteRecord(record.id, empName)}
                className="p-1.5 text-gray-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                title="Delete Entry"
              >
                <i className="ri-delete-bin-line text-sm" />
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
});
