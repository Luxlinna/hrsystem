import { memo } from "react";
import type { Employee } from "../../types";
import { PayrollInfoSection } from "./payroll/PayrollInfoSection";
import { PayrollRateItemSection } from "./payroll/PayrollRateItemSection";
import { EmployeeMovementAttachmentSection } from "../overview/movements/EmployeeMovementAttachmentSection";

interface PayrollHistoryCardProps {
  employee?: Employee | null;
  payrollRecords?: any[];
}

export const PayrollHistoryCard = memo(function PayrollHistoryCard({
  employee,
}: PayrollHistoryCardProps) {
  if (!employee) return null;

  return (
    <div className="bg-white dark:bg-slate-900 border border-gray-200/90 dark:border-slate-800 rounded-sm sm:rounded-md p-5 sm:p-6 shadow-xs space-y-0">
      {/* 1. Payroll Info + Tax Info */}
      <PayrollInfoSection employee={employee} />

      {/* 2. Rate Item Info table */}
      <PayrollRateItemSection employee={employee} />

      {/* 3. Attachment Info */}
      <EmployeeMovementAttachmentSection employee={employee} categoryKey="payroll" />
    </div>
  );
});
