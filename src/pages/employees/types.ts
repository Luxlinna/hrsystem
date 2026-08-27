export interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string | null;
  role?: string | null;
  department?: string | null;
  branch_id?: string | null;
  status: string;
  join_date?: string | null;
  avatar_url?: string | null;
  reports_to?: string | null;
  branches?: { name: string } | null;
}

export interface Branch {
  id: string;
  name: string;
}

export interface AppRole {
  id: number;
  name: string;
  color?: string;
}

export interface AccountStatus {
  invited: boolean;
  hasAccount: boolean;
}

export interface EmployeeFormState {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  role: string;
  department: string;
  branch_id: string;
  status: string;
  join_date: string;
  reports_to: string;
}

export interface ReportEntry {
  first_name: string;
  last_name: string;
  role: string;
  id: string;
  email?: string;
}

export interface VisibleColumns {
  employee: boolean;
  role: boolean;
  department: boolean;
  branch: boolean;
  status: boolean;
  account: boolean;
  joinDate: boolean;
  actions: boolean;
}

export type SortField =
  | "first_name"
  | "last_name"
  | "email"
  | "role"
  | "department"
  | "branch"
  | "status"
  | "join_date"
  | null;

export type SortDirection = "asc" | "desc";
export type ViewMode = "table" | "grid";
