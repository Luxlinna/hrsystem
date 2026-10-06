export interface BranchScheduleData {
  id: string;
  name: string;
  location?: string | null;
  work_start_time?: string | null;
  work_end_time?: string | null;
  break_start_time?: string | null;
  break_end_time?: string | null;
  late_grace_minutes?: number | null;
  early_leave_grace_minutes?: number | null;
  morning_check_in_start?: string | null;
  morning_check_in_end?: string | null;
  morning_check_out_start?: string | null;
  morning_check_out_end?: string | null;
  afternoon_check_in_start?: string | null;
  afternoon_check_in_end?: string | null;
  afternoon_check_out_start?: string | null;
  afternoon_check_out_end?: string | null;
  is_four_punch_enabled?: boolean | null;
}

export interface WorkingHoursFormState {
  work_start_time: string;
  work_end_time: string;
  break_start_time: string;
  break_end_time: string;
  is_four_punch_enabled: boolean;
  late_grace_minutes: number;
  early_leave_grace_minutes: number;
  morning_check_in_start: string;
  morning_check_in_end: string;
  morning_check_out_start: string;
  morning_check_out_end: string;
  afternoon_check_in_start: string;
  afternoon_check_in_end: string;
  afternoon_check_out_start: string;
  afternoon_check_out_end: string;
}
