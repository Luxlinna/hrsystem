export type HiringStepId = "personal" | "org" | "terms" | "compensation" | "contact";

export interface HiringStepConfig {
  id: HiringStepId;
  step: number;
  label: string;
  shortLabel: string;
  fullLabel: string;
  icon: string;
  fieldCount: number;
}

export interface ModalManagerEmployee {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  department: string | null;
  role: string | null;
  position: string | null;
  branch_id: string | null;
  bu_full_name: string | null;
  code_bu: string | null;
  realRole: string;
  isManager: boolean;
  isAdmin: boolean;
}

export const HIRING_STEPS: HiringStepConfig[] = [
  { id: "personal", step: 1, label: "1. Personal Details", shortLabel: "Personal", fullLabel: "Personal & Legal Identity", icon: "ri-user-3-line", fieldCount: 6 },
  { id: "org", step: 2, label: "2. Org & Site Workplace", shortLabel: "Org & Site", fullLabel: "Organizational Placement & Physical Work Station", icon: "ri-building-2-line", fieldCount: 8 },
  { id: "terms", step: 3, label: "3. Terms & Schedule", shortLabel: "Schedule", fullLabel: "Terms & Employment Schedule", icon: "ri-calendar-check-line", fieldCount: 8 },
  { id: "compensation", step: 4, label: "4. Compensation & Tax", shortLabel: "Payroll", fullLabel: "Compensation, Tax & Payroll Setup", icon: "ri-money-dollar-circle-line", fieldCount: 5 },
  { id: "contact", step: 5, label: "5. Contact & Emergency", shortLabel: "Contacts", fullLabel: "Contact & Emergency Information", icon: "ri-contacts-book-2-line", fieldCount: 6 },
];

export interface EditHiringFormData {
  // 1. Personal Details
  full_name: string;
  kh_name: string;
  gender: string;
  date_of_birth: string;
  marital_status: string;
  national_id_number: string;

  // 2. Organizational Placement & Physical Site
  code_bu: string;
  bu_full_name: string;
  handle_bu: string;
  division: string;
  department: string;
  position: string;
  site: string;
  working_location: string;

  // 3. Terms & Employment Schedule
  working_hour: string;
  total_working_days: string;
  employment_type: string;
  start_date: string;
  line_manager: string;
  contract_type: string;
  fdc_end_date: string;
  hiring_status: string;

  // 4. Compensation & Payroll
  basic_salary: string;
  tax_method: string;
  allowance: string;
  bank_account_number: string;
  nssf_number: string;

  // 5. Contact & Emergency Details
  email: string;
  phone: string;
  current_address: string;
  emergency_contact_name: string;
  emergency_phone_number: string;
}
