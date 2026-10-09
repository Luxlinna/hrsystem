import type { EmployeeFormState, Branch } from "../../types";
import { INITIAL_EMPLOYEE_FORM, getBranchCode, deriveBuHandle } from "../../constants";
import type { ParsedEmployeeRow } from "./types";

export function hydrateFormFromParsedRow(
  row: ParsedEmployeeRow,
  branches: Branch[] = [],
  sites: { id: string; name: string; branch_id: string }[] = []
): EmployeeFormState {
  const matchedBranch = branches.find(
    (b) => row.buName && b.name.toLowerCase().includes(row.buName.toLowerCase())
  );
  const branchId = matchedBranch ? matchedBranch.id : branches[0]?.id || "";
  const branchName = matchedBranch?.name || branches[0]?.name || "Main BU";
  const code = branchName ? getBranchCode(branchName) : "";
  const handle = branchName ? deriveBuHandle(branchName, code) : "";

  const matchedSite = sites.find(
    (s) => row.siteName && s.name.toLowerCase().includes(row.siteName.toLowerCase()) && (!branchId || s.branch_id === branchId)
  );

  const nameParts = (row.fullName || "").trim().split(/\s+/);
  const firstName = row.firstName || nameParts[0] || "";
  const lastName = row.lastName || nameParts.slice(1).join(" ") || "";

  return {
    ...INITIAL_EMPLOYEE_FORM,
    first_name: firstName,
    last_name: lastName,
    full_name: row.fullName || `${lastName} ${firstName}`.trim(),
    display_name: row.fullName || `${lastName} ${firstName}`.trim(),
    kh_name: row.khName || "",
    employee_code: row.employeeCode || "",
    gender: row.gender === "Female" ? "Female" : row.gender === "Other" ? "Other" : "Male",
    title: row.title || "Mr",
    date_of_birth: row.dob || "",
    marital_status: row.maritalStatus || "Single",
    nationality: row.nationality || "Khmer",
    national_id_number: row.nationalId || "",
    employee_tax_number: row.taxNumber || "",
    email: row.email || "",
    phone: row.phone || "",
    current_address: row.currentAddress || "",
    permanent_address: row.permanentAddress || row.currentAddress || "",
    branch_id: branchId,
    code_bu: code,
    bu_full_name: branchName,
    handle_bu: handle,
    default_work_location_id: matchedSite?.id || "",
    site: matchedSite?.name || row.siteName || (branchName ? `Main Office (${branchName})` : "Main Office"),
    working_location: matchedBranch?.location || "Phnom Penh",
    department: row.department || "",
    division: row.division || "",
    position: row.position || "Staff",
    role: row.role || row.position || "Staff",
    reports_to: row.reportsTo || "",
    line_manager: row.reportsTo || "",
    employment_type: row.employmentType || "FULL-TIME",
    employee_level: row.employeeLevel || "Junior",
    join_date: row.joinDate || new Date().toISOString().slice(0, 10),
    start_date: row.joinDate || new Date().toISOString().slice(0, 10),
    contract_type: row.contractType || "PERMANENT (UDC)",
    contract_end_date: row.contractEndDate || "",
    status: row.status || "active",
    basic_salary: row.basicSalary != null ? String(row.basicSalary) : "",
    contract_rate: row.basicSalary != null ? row.basicSalary : 0,
    bank_name: row.bankName || "",
    bank_account_number: row.bankAccountNumber || "",
    nssf_number: row.nssfNumber || "",
    payroll_structure: row.payrollStructure || "Standard Monthly",
    emergency_contact_name: row.emergencyContactName || "",
    emergency_phone_number: row.emergencyPhone || "",
    biometric_user_id: row.biometricId || "",
  };
}

export function extractParsedRowFromForm(
  form: EmployeeFormState,
  rowNumber: number
): ParsedEmployeeRow {
  const fullName = form.full_name || `${form.last_name} ${form.first_name}`.trim();
  const errors: string[] = [];
  if (!fullName) errors.push("Missing Full Name");

  const salaryNum = form.basic_salary ? Number(String(form.basic_salary).replace(/[^0-9.]/g, "")) : null;

  return {
    rowNumber,
    fullName,
    firstName: form.first_name,
    lastName: form.last_name,
    displayName: form.display_name,
    khName: form.kh_name,
    employeeCode: form.employee_code,
    gender: form.gender,
    title: form.title,
    dob: form.date_of_birth,
    maritalStatus: form.marital_status,
    nationality: form.nationality,
    nationalId: form.national_id_number,
    taxNumber: form.employee_tax_number,
    buName: form.bu_full_name,
    siteName: form.site,
    department: form.department,
    division: form.division,
    position: form.position,
    role: form.role,
    reportsTo: form.reports_to,
    employmentType: form.employment_type,
    employeeLevel: form.employee_level,
    joinDate: form.join_date,
    contractType: form.contract_type,
    contractEndDate: form.contract_end_date,
    status: form.status,
    basicSalary: isNaN(Number(salaryNum)) ? null : salaryNum,
    bankName: form.bank_name,
    bankAccountNumber: form.bank_account_number,
    nssfNumber: form.nssf_number,
    payrollStructure: form.payroll_structure,
    email: form.email,
    phone: form.phone,
    currentAddress: form.current_address,
    permanentAddress: form.permanent_address,
    emergencyContactName: form.emergency_contact_name,
    emergencyPhone: form.emergency_phone_number,
    biometricId: form.biometric_user_id,
    isValid: errors.length === 0,
    errors,
  };
}
