import { memo } from "react";
import type { PayrollRecord } from "../../types";
import { PayrollTableRow } from "./PayrollTableRow";

interface PayrollTableViewProps {
  records: PayrollRecord[];
  canViewAll: boolean;
  onUpdateStatus: (id: string, status: "paid" | "processed" | "pending") => void;
  onOpenPayslip: (r: PayrollRecord) => void;
  onEditRecord: (r: PayrollRecord) => void;
  onDeleteRecord: (id: string, empName: string) => void;
}

export const PayrollTableView = memo(function PayrollTableView({
  records,
  canViewAll,
  onUpdateStatus,
  onOpenPayslip,
  onEditRecord,
  onDeleteRecord,
}: PayrollTableViewProps) {
  if (records.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-200/80 dark:border-slate-700 p-12 text-center shadow-2xs">
        <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 text-slate-400 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-2">
          <i className="ri-file-search-line" />
        </div>
        <p className="font-extrabold text-sm text-gray-800 dark:text-white">
          No Payroll Records Found
        </p>
        <p className="text-xs text-gray-400 dark:text-slate-500 mt-1 max-w-sm mx-auto">
          No records match the current period, department, or search filters.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-200/80 dark:border-slate-700 overflow-hidden shadow-2xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/70 dark:bg-slate-800/60 border-b border-gray-200/80 dark:border-slate-700 text-[11px] font-extrabold text-gray-400 dark:text-slate-400 uppercase tracking-wider">
              <th className="px-5 py-3.5">Employee</th>
              <th className="px-5 py-3.5">Department</th>
              <th className="px-5 py-3.5">Month</th>
              <th className="px-5 py-3.5">Base Salary</th>
              <th className="px-5 py-3.5">Bonus</th>
              <th className="px-5 py-3.5">Deductions</th>
              <th className="px-5 py-3.5">Net Pay</th>
              <th className="px-5 py-3.5">Status</th>
              <th className="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
            {records.map((record) => (
              <PayrollTableRow
                key={record.id}
                record={record}
                canViewAll={canViewAll}
                onUpdateStatus={onUpdateStatus}
                onOpenPayslip={onOpenPayslip}
                onEditRecord={onEditRecord}
                onDeleteRecord={onDeleteRecord}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
});
