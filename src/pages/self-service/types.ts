export interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
  department: string;
  status: string;
  join_date: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  reports_to: string | null;
  branches: { name: string } | null;
}

export interface AttendanceRecord {
  id: string;
  employee_id: string;
  date: string;
  clock_in: string | null;
  clock_out: string | null;
  status: string;
  late_minutes: number;
  early_leave_minutes: number;
  hours_worked: number | null;
  notes: string | null;
  created_at: string;
}

export interface BranchGeofence {
  name: string;
  latitude: number | null;
  longitude: number | null;
  geofence_radius_m: number;
  work_start_time: string | null;
  work_end_time: string | null;
}

export interface OutsideWorkTask {
  id: string;
  title: string;
  work_checked_in_at: string | null;
  work_address: string | null;
}

export type CheckInStep = "idle" | "locating" | "confirm" | "denied" | "error";

export interface WorkLog {
  id: string;
  log_date: string;
  start_time: string | null;
  end_time: string | null;
  activity: string;
  notes: string | null;
}

export interface LeaveRequest {
  id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  days: number;
  status: string;
  reason: string;
  created_at: string;
}
