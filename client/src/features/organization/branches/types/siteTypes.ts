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
  late_grace_minutes: number | null;
  early_leave_grace_minutes: number | null;
  morning_check_in_start?: string | null;
  morning_check_in_end?: string | null;
  morning_check_out_start?: string | null;
  morning_check_out_end?: string | null;
  afternoon_check_in_start?: string | null;
  afternoon_check_in_end?: string | null;
  afternoon_check_out_start?: string | null;
  afternoon_check_out_end?: string | null;
  is_four_punch_enabled: boolean;
  auto_checkout_time?: string | null;
  is_auto_checkout_enabled?: boolean | null;
  working_hours_mode?: "inherit" | "custom" | string;
  site_type?: string | null;
  address?: string | null;
  city?: string | null;
  province?: string | null;
  postal_code?: string | null;
  country?: string | null;
  phone_number?: string | null;
  email?: string | null;
  website?: string | null;
  status?: "active" | "disabled" | string;
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
  late_grace_minutes: string;
  early_leave_grace_minutes: string;
  morning_check_in_start: string;
  morning_check_in_end: string;
  morning_check_out_start: string;
  morning_check_out_end: string;
  afternoon_check_in_start: string;
  afternoon_check_in_end: string;
  afternoon_check_out_start: string;
  afternoon_check_out_end: string;
  is_four_punch_enabled: boolean;
  auto_checkout_time?: string;
  is_auto_checkout_enabled?: boolean;
  working_hours_mode?: "inherit" | "custom";
  site_type?: string;
  branch_id?: string;
  additional_branch_ids?: string[];
  company_name?: string;
  address?: string;
  city?: string;
  province?: string;
  postal_code?: string;
  country?: string;
  phone_number?: string;
  email?: string;
  website?: string;
  status?: "active" | "disabled" | string;
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
