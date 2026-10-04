import type { Branch } from "../../types";

export interface ImportEmployeesModalProps {
  isOpen: boolean;
  branches: Branch[];
  actorName?: string;
  roleName?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export type SystemFieldCategory =
  | "Personal Identity"
  | "Organization & Workplace"
  | "Terms & Schedule"
  | "Compensation & Payroll"
  | "Contacts & Address";

export interface SystemFieldDef {
  key: string;
  label: string;
  category: SystemFieldCategory;
  required?: boolean;
  aliases: string[];
}

export interface ColumnMappingState {
  [key: string]: string; // systemFieldKey -> detectedHeaderName
}

export interface ParsedEmployeeRow {
  rowNumber: number;
  fullName: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  khName?: string;
  employeeCode?: string;
  gender: string;
  title?: string;
  dob?: string;
  maritalStatus?: string;
  nationality?: string;
  nationalId?: string;
  taxNumber?: string;
  buName?: string;
  siteName?: string;
  department?: string;
  division?: string;
  position?: string;
  role?: string;
  reportsTo?: string;
  employmentType?: string;
  employeeLevel?: string;
  joinDate?: string;
  contractType?: string;
  contractEndDate?: string;
  status?: string;
  basicSalary?: number | null;
  currency?: string;
  frequency?: string;
  bankName?: string;
  bankAccountNumber?: string;
  nssfNumber?: string;
  payrollStructure?: string;
  email?: string;
  phone?: string;
  currentAddress?: string;
  permanentAddress?: string;
  emergencyContactName?: string;
  emergencyPhone?: string;
  biometricId?: string;
  isValid: boolean;
  errors: string[];
}

export const SYSTEM_FIELDS: SystemFieldDef[] = [
  // 1. Personal Identity
  { key: "fullName", label: "Full Name (English / Latin)", category: "Personal Identity", required: true, aliases: ["fullnameen", "fullname", "employeename", "staffname", "englishname", "latinname", "displayname"] },
  { key: "firstName", label: "First Name", category: "Personal Identity", aliases: ["firstname", "givenname", "first"] },
  { key: "lastName", label: "Last Name", category: "Personal Identity", aliases: ["lastname", "familyname", "surname", "last"] },
  { key: "khName", label: "Khmer Name (KH Name)", category: "Personal Identity", aliases: ["khmername", "khname", "nameinkhmer", "ឈ្មោះខ្មែរ"] },
  { key: "employeeCode", label: "Employee ID / Code", category: "Personal Identity", aliases: ["employeeid", "employeecode", "staffid", "badgeid", "code"] },
  { key: "gender", label: "Gender (Male/Female)", category: "Personal Identity", aliases: ["gender", "sex", "ភេទ"] },
  { key: "title", label: "Title / Prefix (Mr/Mrs/Ms)", category: "Personal Identity", aliases: ["title", "prefix", "salutation"] },
  { key: "dob", label: "Date of Birth (YYYY-MM-DD)", category: "Personal Identity", aliases: ["dateofbirth", "dob", "birthdate", "birthday", "ថ្ងៃខែឆ្នាំកំណើត"] },
  { key: "maritalStatus", label: "Marital Status", category: "Personal Identity", aliases: ["maritalstatus", "marital", "marriage"] },
  { key: "nationality", label: "Nationality", category: "Personal Identity", aliases: ["nationality", "citizenship", "country"] },
  { key: "nationalId", label: "National ID / Passport", category: "Personal Identity", aliases: ["nationalidpassport", "nationalid", "idcard", "idnumber", "passport", "អត្តសញ្ញាណប័ណ្ណ"] },
  { key: "taxNumber", label: "Employee Tax Number", category: "Personal Identity", aliases: ["taxidnumber", "employeetaxnumber", "taxnumber", "taxid", "tin"] },

  // 2. Organization & Workplace
  { key: "buName", label: "Business Unit / BU (Branch)", category: "Organization & Workplace", aliases: ["businessunit", "businessunitbu", "branchbu", "branchbusinessunit", "bu", "branch", "company", "សាខា"] },
  { key: "siteName", label: "Work Location / Site", category: "Organization & Workplace", aliases: ["worklocationsite", "worklocation", "siteworklocation", "site", "location", "officelocation", "ទីតាំង"] },
  { key: "department", label: "Department", category: "Organization & Workplace", aliases: ["department", "dept", "ផ្នែក"] },
  { key: "division", label: "Division", category: "Organization & Workplace", aliases: ["division", "group", "unit"] },
  { key: "position", label: "Position / Role", category: "Organization & Workplace", aliases: ["positionrole", "position", "role", "jobtitle", "designation", "តួនាទី"] },
  { key: "reportsTo", label: "Reports To / Line Manager", category: "Organization & Workplace", aliases: ["linemanagerreportsto", "linemanager", "reportsto", "manager", "supervisor"] },

  // 3. Terms & Schedule
  { key: "employmentType", label: "Employment Type", category: "Terms & Schedule", aliases: ["employmenttype", "jobtype", "type", "fulltimeparttime", "ប្រភេទការងារ"] },
  { key: "employeeLevel", label: "Employee Level", category: "Terms & Schedule", aliases: ["employeelevel", "level", "grade", "seniority"] },
  { key: "joinDate", label: "Joining Date (YYYY-MM-DD)", category: "Terms & Schedule", aliases: ["joiningdate", "joindate", "startdate", "hiredate", "datejoined", "ថ្ងៃចូលធ្វើការ"] },
  { key: "contractType", label: "Contract Type", category: "Terms & Schedule", aliases: ["contracttype", "typeofcontract", "contract", "ប្រភេទកិច្ចសន្យា"] },
  { key: "contractEndDate", label: "Contract End Date", category: "Terms & Schedule", aliases: ["contractenddate", "fdcenddate", "enddate", "expirydate"] },
  { key: "status", label: "Job Status / Status", category: "Terms & Schedule", aliases: ["employmentstatus", "jobstatus", "status", "hiringstatus", "state"] },

  // 4. Compensation & Payroll
  { key: "bankName", label: "Bank Name", category: "Compensation & Payroll", aliases: ["disbursementbank", "bankname", "bank", "financialinstitution"] },
  { key: "bankAccountNumber", label: "Bank Account Number", category: "Compensation & Payroll", aliases: ["bankaccountnumber", "bankaccount", "accountnumber", "accountno"] },
  { key: "nssfNumber", label: "NSSF Number", category: "Compensation & Payroll", aliases: ["nssfnumber", "nssfid", "nssf", "socialsecurity"] },
  { key: "payrollStructure", label: "Payroll Structure", category: "Compensation & Payroll", aliases: ["payrollstructure", "salarystructure", "paystructure"] },

  // 5. Contacts & Address
  { key: "email", label: "Email Address", category: "Contacts & Address", aliases: ["workemail", "email", "emailaddress", "mail", "corporateemail", "សារអេឡិចត្រូនិច"] },
  { key: "phone", label: "Phone Number", category: "Contacts & Address", aliases: ["primaryphone", "phone", "phonenumber", "telephone", "mobile", "contact", "tel", "លេខទូរស័ព្ទ"] },
  { key: "currentAddress", label: "Current Address", category: "Contacts & Address", aliases: ["currentaddress", "address", "residence", "locationaddress", "អាសយដ្ឋាន"] },
  { key: "permanentAddress", label: "Permanent Address", category: "Contacts & Address", aliases: ["permanentaddress", "homeaddress"] },
  { key: "emergencyContactName", label: "Emergency Contact Name", category: "Contacts & Address", aliases: ["emergencycontactname", "emergencycontact", "nextofkin"] },
  { key: "emergencyPhone", label: "Emergency Phone", category: "Contacts & Address", aliases: ["emergencycontactphone", "emergencyphone", "emergencyphonenumber", "emergencycontactnumber"] },
  { key: "biometricId", label: "Biometric Device ID", category: "Contacts & Address", aliases: ["biometricuserid", "biometricid", "deviceid", "fingerprintid"] },
];

export const TEMPLATE_HEADERS = [
  "Employee ID",
  "Full Name",
  "Khmer Name",
  "Gender (Male/Female)",
  "Title (Mr/Mrs/Ms)",
  "Date of Birth (YYYY-MM-DD)",
  "National ID",
  "Phone Number",
  "Email",
  "Business Unit / BU",
  "Site / Work Location",
  "Department",
  "Position",
  "Employment Type",
  "Employee Level",
  "Joining Date (YYYY-MM-DD)",
  "Contract Type",
  "Bank Name",
  "Bank Account Number",
  "NSSF Number",
  "Current Address",
];
