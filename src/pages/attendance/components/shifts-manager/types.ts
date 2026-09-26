export interface ShiftToleranceRule {
  id: string;
  name: string;
  from_min: number;
  to_min: number;
}

export interface ShiftTimeTableRow {
  id: string;
  time_in: string;
  time_out: string;
  break_minutes: number;
  total_work_hours: number;
}

export interface ManagedShift {
  id: string;
  code: string;
  name: string;
  time_display: string;
  color: string;
  total_work_hours: number;
  is_overnight?: boolean;
  must_mark_check_in?: boolean;
  must_mark_check_out?: boolean;
  time_table?: ShiftTimeTableRow[];
  come_earliest?: ShiftToleranceRule[];
  come_lates?: ShiftToleranceRule[];
  leave_earliest?: ShiftToleranceRule[];
  leave_lates?: ShiftToleranceRule[];
  remark?: string;
  status?: "Active" | "Disabled";
}

export const INITIAL_MANAGED_SHIFTS: ManagedShift[] = [];
