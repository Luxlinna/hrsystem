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

export interface WorkSite {
  id: string;
  branch_id: string;
  name: string;
  description: string | null;
  is_default: boolean;
  latitude: number | null;
  longitude: number | null;
  geofence_radius_m: number;
  work_start_time: string | null;
  work_end_time: string | null;
  break_start_time: string | null;
  break_end_time: string | null;
  is_four_punch_enabled: boolean;
}

export interface WorkSiteFormState {
  name: string;
  description: string;
  latitude: string;
  longitude: string;
  geofence_radius_m: string;
  work_start_time: string;
  work_end_time: string;
  break_start_time: string;
  break_end_time: string;
  is_four_punch_enabled: boolean;
}

export interface BiometricDevice {
  id: string;
  branch_id: string | null;
  work_location_id: string | null;
  device_name: string;
  device_serial: string;
  device_ip: string | null;
  device_port: number;
  device_model: string | null;
  firmware_version: string | null;
  user_count: number;
  fingerprint_count: number;
  log_count: number;
  status: "online" | "offline" | "error";
  last_sync_at: string | null;
  created_at: string;
}

export interface BiometricDeviceFormState {
  device_name: string;
  device_serial: string;
  device_ip: string;
  device_port: string;
  device_model: string;
  work_location_id: string;
}
