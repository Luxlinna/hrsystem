export interface Branch {
  id: string;
  name: string;
  location: string;
  manager_name: string;
  employee_count: number;
  status: string;
  created_at: string;
  latitude: number | null;
  longitude: number | null;
  geofence_radius_m: number | null;
  work_start_time: string | null;
  work_end_time: string | null;
  deleted_at: string | null;
  deleted_by: string | null;
}

export interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
  department: string;
  status: string;
  email?: string;
}

export interface BranchFormState {
  name: string;
  location: string;
  manager_name: string;
  status: string;
  latitude: string;
  longitude: string;
  geofence_radius_m: string;
  work_start_time: string;
  work_end_time: string;
}
