export interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  email?: string | null;
  phone?: string | null;
  role?: string | null;
  department?: string | null;
  branch_id?: string | null;
  status: string;
  join_date?: string | null;
  avatar_url?: string | null;
  reports_to?: string | null;
  branches?: { name: string } | null;
  work_locations?: { name: string } | null;
  default_work_location_id?: string | null;
}

export interface Branch {
  id: string;
  name: string;
  is_site?: boolean;
  branch_id?: string;
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

export interface BiometricDeviceRef {
  id?: string;
  branch_id?: string | null;
  work_location_id?: string | null;
}

export function isEmployeeBiometricEligible(
  employee: Employee,
  devices: BiometricDeviceRef[]
): boolean {
  if (!employee?.branch_id || !devices || devices.length === 0) return false;
  return devices.some((dev) => {
    if (dev.branch_id !== employee.branch_id) return false;
    if (employee.default_work_location_id) {
      return dev.work_location_id === employee.default_work_location_id || !dev.work_location_id;
    }
    return !dev.work_location_id;
  });
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
  default_work_location_id: string;
  send_invite?: boolean;
}

export interface EmployeeStats {
  total: number;
  active: number;
  onboarding: number;
  withAccounts: number;
  invited: number;
  byDepartment?: Record<string, number>;
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
