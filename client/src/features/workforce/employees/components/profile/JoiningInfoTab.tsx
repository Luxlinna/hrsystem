import { memo } from "react";
import type { Employee, ReportEntry } from "../../types";
import { JoiningMainInfoSection } from "./joining/JoiningMainInfoSection";
import { JoiningAssetAndAccountSection } from "./joining/JoiningAssetAndAccountSection";
import { EmployeeMovementAttachmentSection } from "../overview/movements/EmployeeMovementAttachmentSection";

interface JoiningInfoTabProps {
  employee: Employee;
  manager?: ReportEntry | null;
}

export const JoiningInfoTab = memo(function JoiningInfoTab({
  employee,
  manager,
}: JoiningInfoTabProps) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-gray-200/90 dark:border-slate-800 rounded-sm sm:rounded-md p-5 sm:p-6 shadow-xs space-y-6">
      {/* 1. Joining Info & Contract Info */}
      <JoiningMainInfoSection employee={employee} manager={manager} />

      {/* 2. Asset Info Table & Account User Info */}
      <JoiningAssetAndAccountSection employee={employee} />

      {/* 3. Attachment Info */}
      <EmployeeMovementAttachmentSection employee={employee} categoryKey="joining" />
    </div>
  );
});
