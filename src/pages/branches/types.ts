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
  deleted_at: string | null;
  deleted_by: string | null;

  // 1. Company Info
  logo_url?: string | null;
  company_name?: string | null;
  registration_no?: string | null;
  vat_no?: string | null;
  industry?: string | null;
  currency?: string | null;
  rounding_digit?: number | null;

  // 2. Physical Address Info
  physical_address?: string | null;
  physical_city?: string | null;
  physical_province?: string | null;
  physical_postal_code?: string | null;
  physical_country?: string | null;

  // 3. Mailing Address Info
  mailing_address?: string | null;
  mailing_city?: string | null;
  mailing_province?: string | null;
  mailing_postal_code?: string | null;
  mailing_country?: string | null;

  // 4. Contact Info
  phone_number?: string | null;
  email?: string | null;
  website?: string | null;

  // 5. Legal Info
  legal_tax_number?: string | null;
  legal_name?: string | null;
  legal_business_activity?: string | null;
  legal_address?: string | null;
  legal_phone_number?: string | null;
  legal_email?: string | null;
}

export interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
  department: string;
  status: string;
  email?: string;
  default_work_location_id?: string | null;
  work_locations?: { id: string; name: string } | null;
  biometric_user_id?: string | null;
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

  // 1. Company Info
  logo_url: string;
  company_name: string;
  registration_no: string;
  vat_no: string;
  industry: string;
  currency: string;
  rounding_digit: string;

  // 2. Physical Address Info
  physical_address: string;
  physical_city: string;
  physical_province: string;
  physical_postal_code: string;
  physical_country: string;

  // 3. Mailing Address Info
  mailing_address: string;
  mailing_city: string;
  mailing_province: string;
  mailing_postal_code: string;
  mailing_country: string;

  // 4. Contact Info
  phone_number: string;
  email: string;
  website: string;

  // 5. Legal Info
  legal_tax_number: string;
  legal_name: string;
  legal_business_activity: string;
  legal_address: string;
  legal_phone_number: string;
  legal_email: string;
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

  // Site Profile Fields
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

  // Site Profile Fields
  site_type: string;
  company_name?: string;
  address: string;
  city: string;
  province: string;
  postal_code: string;
  country: string;
  phone_number: string;
  email: string;
  website: string;
  status: "active" | "disabled";
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

export interface Department {
  id: string;
  branch_id?: string | null;
  name: string;
  parent_department_id?: string | null;
  parent_department_name?: string | null;
  head_of_department_id?: string | null;
  head_of_department_name?: string | null;
  sort_order: number;
  status: "active" | "disabled" | string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface DepartmentFormState {
  name: string;
  parent_department_id: string;
  parent_department_name: string;
  head_of_department_id: string;
  head_of_department_name: string;
  sort_order: string;
  status: "active" | "disabled";
}
