import type { Employee } from "../types";

export type OvertimeStatus = "pending" | "approved" | "rejected";

export interface OvertimeRecord {
  id: string;
  employee_id: string;
  branch_id: string | null;
  overtime_type: string;
  from_date: string;
  to_date: string;
  time_in: string;
  time_out: string;
  break_minutes: number;
  overtime_hours: number;
  reason: string;
  remark: string | null;
  attachment_url: string | null;
  attachment_name: string | null;
  status: OvertimeStatus;
  approved_by: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  employees?: Employee | null;
}

export interface NewOvertimeForm {
  employee_id: string;
  overtime_type: string;
  from_date: string;
  to_date: string;
  time_in: string;
  time_out: string;
  break_minutes: number;
  reason: string;
  remark: string;
  attachment_url?: string;
  attachment_name?: string;
  // Approval fields (used in direct entry mode)
  approval_status?: OvertimeStatus;
  approver_employee_id?: string | null;
  rejection_reason?: string | null;
  approval_date?: string | null;
}

export const OVERTIME_TYPES = [
  "Normal Overtime (1.5x)",
  "Weekend Overtime (2.0x)",
  "Holiday Overtime (2.0x)",
  "Night Shift Overtime (1.5x)",
  "Special Project Overtime (1.5x)",
] as const;

export const OVERTIME_STATUS_CONFIG: Record<OvertimeStatus, { label: string; bg: string; text: string; border: string; icon: string }> = {
  pending: {
    label: "Pending Review",
    bg: "bg-amber-50 dark:bg-amber-950/50",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-amber-200 dark:border-amber-800/60",
    icon: "ri-time-line",
  },
  approved: {
    label: "Approved",
    bg: "bg-emerald-50 dark:bg-emerald-950/50",
    text: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-200 dark:border-emerald-800/60",
    icon: "ri-checkbox-circle-line",
  },
  rejected: {
    label: "Rejected",
    bg: "bg-rose-50 dark:bg-rose-950/50",
    text: "text-rose-700 dark:text-rose-300",
    border: "border-rose-200 dark:border-rose-800/60",
    icon: "ri-close-circle-line",
  },
};
