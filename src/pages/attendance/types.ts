export interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  department: string;
  role: string;
  avatar_url: string | null;
  branch_id?: string | null;
  branches?: { id: string; name: string } | null;
}

export interface AttendanceRecord {
  id: number;
  employee_id: string;
  date: string;
  clock_in: string | null;
  clock_out: string | null;
  status: "ontime" | "present" | "absent" | "late" | "half_day" | "remote" | "holiday";
  late_minutes: number;
  early_leave_minutes?: number | null;
  notes: string | null;
  employees?: Employee;
}

export interface NewRecordForm {
  employee_id: string;
  date: string;
  clock_in: string;
  clock_out: string;
  status: string;
  late_minutes: number;
  notes: string;
}

export type AttendanceTabKey = "records" | "live" | "matrix" | "summary";
export type ViewMode = "table" | "cards";
export type DatePreset =
  | "all"
  | "today"
  | "yesterday"
  | "this_week"
  | "last_week"
  | "this_month"
  | "last_month"
  | "this_year"
  | "last_year"
  | "single_date"
  | "custom_range";

export interface EmployeeSummaryItem extends Employee {
  present: number;
  late: number;
  absent: number;
  remote: number;
  totalHours: number;
  totalLateMinutes: number;
  totalDays: number;
  attendanceRate: number;
  lastSeen: string;
  rosterRecord?: AttendanceRecord;
}

export interface MatrixDay {
  dayNum: number;
  dateStr: string;
  dayName: string;
  isWeekend: boolean;
}
