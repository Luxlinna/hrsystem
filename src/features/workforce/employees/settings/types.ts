export type EmployeeSettingTab = "employee-setting" | "employee-field" | "rate-item";

export interface GeneralEmployeeSettings {
  id?: string;
  is_show_salary_type: "show" | "hide";
  employee_restrict_age: number;

  // Identification expiration alerts
  alert_passport_days: number;
  alert_driver_license_days: number;
  alert_visa_days: number;
  alert_work_permit_days: number;
  alert_national_id_days: number;

  // Anniversary alerts
  alert_joining_days: number;
  alert_joining_recurring: boolean;
  alert_birthday_days: number;
  alert_birthday_send_message: boolean;

  // Auto employee code
  auto_employee_code_enabled: boolean;
  auto_employee_code_prefix: string;
  auto_employee_code_middle: string;
  auto_employee_code_sequence: number;
}

export const DEFAULT_EMPLOYEE_SETTINGS: GeneralEmployeeSettings = {
  is_show_salary_type: "show",
  employee_restrict_age: 17,

  alert_passport_days: 60,
  alert_driver_license_days: 60,
  alert_visa_days: 60,
  alert_work_permit_days: 60,
  alert_national_id_days: 60,

  alert_joining_days: 45,
  alert_joining_recurring: true,
  alert_birthday_days: 30,
  alert_birthday_send_message: false,

  auto_employee_code_enabled: true,
  auto_employee_code_prefix: "",
  auto_employee_code_middle: "",
  auto_employee_code_sequence: 1889,
};

export interface EmployeeRateItemSetting {
  id: string;
  name: string;
  default_amount: number;
  remark: string;
  status: "active" | "inactive";
  display_order: number;
  created_at?: string;
}

export interface EmployeeFieldSetting {
  id: string;
  field_key: string;
  field_label: string;
  is_required: boolean;
  is_enabled: boolean;
  display_order: number;
}
