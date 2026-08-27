import { memo } from "react";
import type { PayrollRecord } from "../../types";
import { PayrollCardItem } from "./PayrollCardItem";

interface PayrollCardsViewProps {
  records: PayrollRecord[];
  canViewAll: boolean;
  onUpdateStatus: (id: string, status: "paid" | "processed" | "pending") => void;
  onOpenPayslip: (r: PayrollRecord) => void;
  onEditRecord: (r: PayrollRecord) => void;
  onDeleteRecord: (id: string, empName: string) => void;
}

export const PayrollCardsView = memo(function PayrollCardsView({
  records,
  canViewAll,
  onUpdateStatus,
  onOpenPayslip,
  onEditRecord,
  onDeleteRecord,
}: PayrollCardsViewProps) {
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
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {records.map((record) => (
        <PayrollCardItem
          key={record.id}
          record={record}
          canViewAll={canViewAll}
          onUpdateStatus={onUpdateStatus}
          onOpenPayslip={onOpenPayslip}
          onEditRecord={onEditRecord}
          onDeleteRecord={onDeleteRecord}
        />
      ))}
    </div>
  );
});
