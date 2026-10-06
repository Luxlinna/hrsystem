import { branches, employees, work_locations } from '@prisma/client';

export type EmployeeWithRelations = employees & {
  branches:
    | (Pick<
        branches,
        | 'name'
        | 'work_start_time'
        | 'work_end_time'
        | 'late_grace_minutes'
        | 'early_leave_grace_minutes'
        | 'morning_check_in_start'
        | 'morning_check_in_end'
        | 'morning_check_out_start'
        | 'morning_check_out_end'
        | 'afternoon_check_in_start'
        | 'afternoon_check_in_end'
        | 'afternoon_check_out_start'
        | 'afternoon_check_out_end'
      > & {
        break_start_time?: Date | null;
        break_end_time?: Date | null;
        is_four_punch_enabled?: boolean | null;
      })
    | null;
  work_locations: Pick<
    work_locations,
    | 'name'
    | 'work_start_time'
    | 'break_start_time'
    | 'break_end_time'
    | 'work_end_time'
    | 'late_grace_minutes'
    | 'early_leave_grace_minutes'
    | 'is_four_punch_enabled'
    | 'morning_check_in_start'
    | 'morning_check_in_end'
    | 'morning_check_out_start'
    | 'morning_check_out_end'
    | 'afternoon_check_in_start'
    | 'afternoon_check_in_end'
    | 'afternoon_check_out_start'
    | 'afternoon_check_out_end'
  > | null;
};

export interface PunchCalculationParams {
  employee: EmployeeWithRelations;
  dateStr: string;
  timeStr: string;
  deviceSerial?: string;
  deviceBranchId?: string | null;
  deviceWorkLocationId?: string | null;
}

export interface AttendanceUpdatePayload {
  clock_in?: Date;
  clock_out?: Date;
  break_out?: Date;
  break_in?: Date;
  status?: string;
  late_minutes?: number;
  early_leave_minutes?: number;
  hours_worked?: number;
  notes?: string;
  work_location_id?: string | null;
  clock_in_branch_id?: string | null;
}
