export interface Shift {
  id: string;
  name: string;
  branch_id: string;
  department: string;
  start_time: string;
  end_time: string;
  shift_date: string;
  capacity: number;
  color: string;
  notes: string;
  branches?: { name: string; location: string };
  assignmentCount?: number;
}

export interface Branch {
  id: string;
  name: string;
  location: string;
}

export interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  department: string;
  role: string;
  avatar_url?: string | null;
}

export interface ShiftAssignment {
  id: string;
  shift_id: string;
  employee_id: string;
  status: string;
  employee?: {
    first_name: string;
    last_name: string;
    role: string;
    department: string;
    avatar_url?: string | null;
  };
}

export type ViewMode = "week" | "day" | "list" | "month";
export type QuickFilter = "all" | "open" | "filled";
export type DensityMode = "comfortable" | "compact";

export interface ShiftForm {
  name: string;
  branch_id: string;
  department: string;
  start_time: string;
  end_time: string;
  shift_date: string;
  capacity: number;
  color: string;
  notes: string;
}

export interface DaySummary {
  count: number;
  totalCapacity: number;
  totalAssigned: number;
  totalHours: number;
}
