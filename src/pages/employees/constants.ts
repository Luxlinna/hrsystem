import type { EmployeeFormState, VisibleColumns } from "./types";

export const DEPARTMENTS = [
  "Engineering",
  "Sales",
  "Operations",
  "Marketing",
  "Finance",
  "HR",
  "IT",
  "Legal",
  "Executive",
  "Customer Service",
  "Other",
];

export const STATUS_OPTIONS = [
  { value: "onboarding", label: "Onboarding" },
  { value: "active", label: "Active" },
  { value: "on_leave", label: "On Leave" },
  { value: "suspended", label: "Suspended" },
  { value: "inactive", label: "Inactive" },
];

export const STATUS_META: Record<
  string,
  { label: string; bg: string; text: string; dot: string }
> = {
  active: { label: "Active", bg: "bg-emerald-100", text: "text-emerald-700", dot: "bg-emerald-500" },
  onboarding: { label: "Onboarding", bg: "bg-amber-100", text: "text-amber-700", dot: "bg-amber-500" },
  on_leave: { label: "On Leave", bg: "bg-[#253C7D]/10", text: "text-[#1E3066]", dot: "bg-[#253C7D]" },
  suspended: { label: "Suspended", bg: "bg-rose-100", text: "text-rose-700", dot: "bg-rose-500" },
  inactive: { label: "Inactive", bg: "bg-gray-100", text: "text-gray-600", dot: "bg-gray-400" },
};

export const getStatusMeta = (status: string) =>
  STATUS_META[status] || { label: status, bg: "bg-gray-100", text: "text-gray-600", dot: "bg-gray-400" };

export const PROFILE_STATUS_META: Record<
  string,
  { label: string; description: string; badge: string; dot: string }
> = {
  active: {
    label: "Active",
    description: "Currently employed and working normally.",
    badge: "bg-green-50 text-green-700",
    dot: "bg-green-500",
  },
  on_leave: {
    label: "On Leave",
    description: "Employed, temporarily away on approved leave.",
    badge: "bg-sky-50 text-sky-700",
    dot: "bg-sky-500",
  },
  onboarding: {
    label: "Onboarding",
    description: "New hire — still going through the onboarding checklist.",
    badge: "bg-amber-50 text-amber-700",
    dot: "bg-amber-500",
  },
  suspended: {
    label: "Suspended",
    description: "Employment temporarily suspended, pending review.",
    badge: "bg-red-50 text-red-700",
    dot: "bg-red-500",
  },
  inactive: {
    label: "Inactive",
    description: "Not currently active in the system.",
    badge: "bg-gray-100 text-gray-600",
    dot: "bg-gray-400",
  },
};

export const getProfileStatusMeta = (status: string) =>
  PROFILE_STATUS_META[status] || {
    label: status,
    description: "Unrecognized status.",
    badge: "bg-gray-100 text-gray-600",
    dot: "bg-gray-400",
  };

export const COLUMN_WIDTHS: Record<string, string> = {
  employee: "minmax(230px,2.4fr)",
  role: "minmax(110px,1fr)",
  department: "minmax(110px,1fr)",
  branch: "minmax(130px,1.1fr)",
  status: "minmax(100px,0.85fr)",
  account: "minmax(100px,0.85fr)",
  joinDate: "minmax(95px,0.8fr)",
  actions: "minmax(85px,0.75fr)",
};

export const INITIAL_EMPLOYEE_FORM: EmployeeFormState = {
  // 1. Personal & Legal Identity
  title: "Mr",
  first_name: "",
  last_name: "",
  display_name: "",
  display_name_format: "first_last",
  foreign_name: "",
  foreign_name_format: "last_first",
  employee_code: "",
  full_name: "",
  kh_name: "",
  date_of_birth: "",
  dob_day: "",
  dob_month: "",
  dob_year: "",
  gender: "Male",
  marital_status: "Single",
  nationality: "Khmer",
  is_resident: true,
  fringe_benefit: false,
  blood_group: "None",
  religion: "None",
  employee_tax_number: "",
  national_id_number: "",

  // Bank Accounts & Identifications (Personal Info tables)
  bank_accounts: [],
  identifications: [],

  // Permanent Address Info
  permanent_address: "",
  permanent_city: "",
  permanent_province: "",
  permanent_postal_code: "",
  permanent_country: "Cambodia",
  same_as_present_address: true,

  // Additional Personal Info sections
  home_phone: "",
  office_phone: "",
  emergency_contacts: [],
  family_members: [],
  education_history: [],
  training_history: [],
  employment_history: [],
  achievement_history: [],
  personal_attachments: [],

  // 2. Org & Workplace Site
  branch_id: "",
  code_bu: "",
  bu_full_name: "",
  handle_bu: "",
  division: "",
  department: DEPARTMENTS[0],
  role: "Staff",
  position: "",
  site: "",
  working_location: "",
  default_work_location_id: "",

  // 3. Terms & Employment Schedule
  working_hour: "8:00 AM - 5:00 PM (44 hrs/wk)",
  total_working_days: "5.5 Days/Week (Mon - Sat Noon)",
  employment_type: "Full Time",
  start_date: new Date().toISOString().split("T")[0],
  join_date: new Date().toISOString().split("T")[0],
  line_manager: "",
  reports_to: "",
  contract_type: "FDC",
  fdc_end_date: "",
  contract_effective_date: new Date().toISOString().split("T")[0],
  contract_end_date: "",
  contract_rate: 0,
  contract_rate_currency: "USD",
  contract_rate_frequency: "Monthly",
  contract_rate_after: 0,
  contract_rate_after_currency: "USD",
  contract_rate_after_frequency: "Monthly",
  contract_remark: "",
  hiring_status: "probation",
  status: "onboarding",

  // 4. Compensation & Tax
  basic_salary: "",
  tax_method: "Resident",
  allowance: "",
  bank_account_number: "",
  bank_name: "",
  nssf_number: "",

  // 5. Contacts & Emergency Information
  email: "",
  phone: "",
  current_address: "",
  emergency_contact_name: "",
  emergency_phone_number: "",
  avatar_url: "",
  documents: [],

  // Biometric / Device
  biometric_user_id: "",
  send_invite: false,
};

export const INITIAL_VISIBLE_COLUMNS: VisibleColumns = {
  employee: true,
  role: true,
  department: true,
  branch: true,
  status: true,
  account: true,
  joinDate: true,
  actions: true,
};
