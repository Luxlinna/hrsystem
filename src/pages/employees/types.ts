export interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  title?: string | null;
  display_name?: string | null;
  foreign_name?: string | null;
  nationality?: string | null;
  is_resident?: boolean | null;
  fringe_benefit?: boolean | null;
  blood_group?: string | null;
  religion?: string | null;
  employee_tax_number?: string | null;
  full_name?: string | null;
  kh_name?: string | null;
  gender?: string | null;
  date_of_birth?: string | null;
  marital_status?: string | null;
  national_id_number?: string | null;
  bank_accounts?: EmployeeBankAccountItem[] | null;
  identifications?: EmployeeIdentificationItem[] | null;
  permanent_address?: string | null;
  permanent_city?: string | null;
  permanent_province?: string | null;
  permanent_postal_code?: string | null;
  permanent_country?: string | null;
  same_as_present_address?: boolean | null;
  home_phone?: string | null;
  office_phone?: string | null;
  emergency_contacts?: EmployeeEmergencyContactItem[] | null;
  family_members?: EmployeeFamilyMemberItem[] | null;
  education_history?: EmployeeEducationItem[] | null;
  training_history?: EmployeeTrainingItem[] | null;
  employment_history?: EmployeeEmploymentHistoryItem[] | null;
  achievement_history?: EmployeeAchievementItem[] | null;
  personal_attachments?: string[] | null;
  code_bu?: string | null;
  bu_full_name?: string | null;
  handle_bu?: string | null;
  division?: string | null;
  position?: string | null;
  site?: string | null;
  working_location?: string | null;
  working_hour?: string | null;
  total_working_days?: string | null;
  employment_type?: string | null;
  start_date?: string | null;
  line_manager?: string | null;
  contract_type?: string | null;
  fdc_end_date?: string | null;
  hiring_status?: string | null;
  basic_salary?: number | string | null;
  tax_method?: string | null;
  allowance?: string | null;
  bank_account_number?: string | null;
  bank_name?: string | null;
  nssf_number?: string | null;
  current_address?: string | null;
  emergency_contact_name?: string | null;
  emergency_phone_number?: string | null;
  employee_code?: string | null;
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
  biometric_user_id?: string | null;
  candidate_id?: string | null;
  documents?: any[] | null;
}

export interface EmployeeBankAccountItem {
  payment_method: string;
  account_number: string;
}

export interface EmployeeIdentificationItem {
  identification_type: string;
  identification_number: string;
  expiration_date: string;
}

export interface EmployeeEmergencyContactItem {
  contact_person: string;
  relationship: string;
  phone_number: string;
}

export interface EmployeeFamilyMemberItem {
  name: string;
  relationship: string;
  date_of_birth: string;
  gender: string;
  nationality: string;
  tax_filing: boolean | string;
  phone_number: string;
  remark: string;
  attachment?: string;
}

export interface EmployeeEducationItem {
  institue: string;
  subject: string;
  degree: string;
  start_date: string;
  end_date: string;
  remark: string;
}

export interface EmployeeTrainingItem {
  institue: string;
  subject: string;
  start_date: string;
  end_date: string;
  remark: string;
  attachment?: string;
}

export interface EmployeeEmploymentHistoryItem {
  company_name: string;
  start_date: string;
  end_date: string;
  designation: string;
  supervisor_name: string;
  supervisor_phone_number: string;
  remark: string;
  rate: string;
  reason_for_leaving: string;
}

export interface EmployeeAchievementItem {
  title: string;
  year_awarded: string;
  country: string;
  program_name: string;
  organizer_name: string;
  remark: string;
  attachment?: string;
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
  // 1. Personal & Legal Identity
  title: string;
  first_name: string;
  last_name: string;
  display_name: string;
  display_name_format?: string;
  foreign_name: string;
  foreign_name_format?: string;
  employee_code?: string;
  full_name: string;
  kh_name: string;
  date_of_birth: string;
  dob_day?: string;
  dob_month?: string;
  dob_year?: string;
  gender: string;
  marital_status: string;
  nationality: string;
  is_resident: boolean;
  fringe_benefit: boolean;
  blood_group: string;
  religion: string;
  employee_tax_number: string;
  national_id_number: string;

  // Bank Accounts & Identifications (Personal Info tab tables)
  bank_accounts: EmployeeBankAccountItem[];
  identifications: EmployeeIdentificationItem[];

  // Permanent Address Info
  permanent_address: string;
  permanent_city: string;
  permanent_province: string;
  permanent_postal_code: string;
  permanent_country: string;
  same_as_present_address: boolean;

  // Additional Personal Info sections
  home_phone: string;
  office_phone: string;
  emergency_contacts: EmployeeEmergencyContactItem[];
  family_members: EmployeeFamilyMemberItem[];
  education_history: EmployeeEducationItem[];
  training_history: EmployeeTrainingItem[];
  employment_history: EmployeeEmploymentHistoryItem[];
  achievement_history: EmployeeAchievementItem[];
  personal_attachments: string[];

  // 2. Org & Workplace Site
  branch_id: string;
  code_bu: string;
  bu_full_name: string;
  handle_bu: string;
  division: string;
  department: string;
  role: string;
  position: string;
  site: string;
  working_location: string;
  default_work_location_id: string;

  // 3. Terms & Employment Schedule
  working_hour: string;
  total_working_days: string;
  employment_type: string;
  start_date: string;
  join_date: string;
  line_manager: string;
  reports_to: string;
  contract_type: string;
  fdc_end_date: string;
  hiring_status: string;
  status: string;

  // 4. Compensation & Tax
  basic_salary: string;
  tax_method: string;
  allowance: string;
  bank_account_number: string;
  bank_name: string;
  nssf_number: string;

  // 5. Contacts & Emergency Information
  email: string;
  phone: string;
  current_address: string;
  emergency_contact_name: string;
  emergency_phone_number: string;
  avatar_url?: string;
  documents?: any[];

  // Biometric / Device
  biometric_user_id?: string;
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
  | "biometric_user_id"
  | null;

export type SortDirection = "asc" | "desc";
export type ViewMode = "table" | "grid";
