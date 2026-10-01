import type { Employee } from "../types";

const getXLSX = async () => {
  return await import("xlsx");
};

export async function exportSingleEmployeeXLSX(e: Employee): Promise<boolean> {
  const XLSX = await getXLSX();
  const wb = XLSX.utils.book_new();

  const fullName = e.full_name || `${e.first_name || ""} ${e.last_name || ""}`.trim() || "Employee";
  const empCode = e.employee_code || e.id.slice(0, 8);
  const position = e.position || e.role || "Staff";
  const department = e.department || "—";
  const branchName = e.branches?.name || e.code_bu || "Headquarters";
  const siteName = e.work_locations?.name || e.working_location || "Main Office";
  const joinDate = e.join_date || e.start_date || "—";
  const status = (e.status || "active").replace(/_/g, " ").toUpperCase();
  const salary = e.basic_salary != null ? `${e.basic_salary}` : e.contract_rate != null ? `${e.contract_rate}` : "—";
  const currency = e.contract_rate_currency || "USD";
  const salaryFreq = e.tax_salary_frequency || e.contract_rate_frequency || "Monthly";
  const contractEnd = e.contract_end_date || e.fdc_end_date || "Continuous";
  const bankName = e.bank_name || (e.bank_accounts?.[0]?.payment_method ?? "—");
  const bankAccount = e.bank_account_number || (e.bank_accounts?.[0]?.account_number ?? "—");
  const emContact = e.emergency_contact_name || (e.emergency_contacts?.[0]?.contact_person ?? "—");
  const emPhone = e.emergency_phone_number || (e.emergency_contacts?.[0]?.phone_number ?? "—");
  const fullAddr = [e.current_address, e.permanent_city, e.permanent_province, e.permanent_country].filter(Boolean).join(", ") || e.permanent_address || "—";

  // ── Sheet 1: Master Directory Format (All 49 Form Columns) ──
  const directoryRow = [{
    "No.": 1,
    "Employee ID": empCode,
    "Full Name (EN)": fullName,
    "First Name": e.first_name || "—",
    "Last Name": e.last_name || "—",
    "Khmer Name": e.kh_name || "—",
    "Gender": e.gender || "—",
    "Date of Birth": e.date_of_birth || "—",
    "Marital Status": e.marital_status || "—",
    "Nationality": e.nationality || "Cambodian",
    "Resident Status": e.is_resident ? "Resident" : "Non-Resident",
    "Blood Group": e.blood_group || "—",
    "Religion": e.religion || "—",
    "National ID / Passport": e.national_id_number || (e.identifications?.[0]?.identification_number ?? "—"),
    "Tax ID Number": e.employee_tax_number || "—",
    "Work Email": e.email || "—",
    "Primary Phone": e.phone || "—",
    "Home Phone": e.home_phone || "—",
    "Office Phone": e.office_phone || "—",
    "Current Address": e.current_address || fullAddr,
    "Permanent Address": e.permanent_address || fullAddr,
    "Emergency Contact Name": emContact,
    "Emergency Contact Phone": emPhone,
    "Business Unit": branchName,
    "BU Code": e.code_bu || "—",
    "Division": e.division || "—",
    "Department": department,
    "Position / Role": position,
    "Employee Level": e.employee_level || "—",
    "Employment Type": e.employment_type || "Full Time",
    "Work Location / Site": siteName,
    "Line Manager / Reports To": e.line_manager || e.reports_to || "—",
    "Biometric User ID": e.biometric_user_id || "—",
    "Joining Date": joinDate,
    "Employment Status": status,
    "Contract Type": e.contract_type || "UDC",
    "Contract Effective Date": e.contract_effective_date || joinDate,
    "Contract End Date": contractEnd,
    "Contract Remark": e.contract_remark || "—",
    "Basic Salary / Rate": salary,
    "Currency": currency,
    "Salary Frequency": salaryFreq,
    "Tax Method": e.tax_method || "Gross",
    "Tax Salary": e.tax_salary ?? "—",
    "NSSF Number": e.nssf_number || "—",
    "NSSF Registered": e.register_nssf ? "Yes" : "No",
    "Disbursement Bank": bankName,
    "Bank Account Number": bankAccount,
  }];

  const wsDirectory = XLSX.utils.json_to_sheet(directoryRow);
  wsDirectory["!cols"] = Object.keys(directoryRow[0]).map(() => ({ wch: 22 }));
  XLSX.utils.book_append_sheet(wb, wsDirectory, "Directory Data");

  // ── Sheet 2: Structured Dossier & Sub-Tables ──
  const dossierRows: (string | number | null | undefined)[][] = [
    ["HRM_OPS — INDIVIDUAL EMPLOYEE DOSSIER"],
    [`Generated: ${new Date().toLocaleDateString("en-US")} | Confidential Personal File`],
    [],
    ["--- PERSONAL INFORMATION ---"],
    ["Employee Code", empCode, "Full Name (EN)", fullName],
    ["Khmer Name", e.kh_name || "—", "Gender", e.gender || "—"],
    ["Date of Birth", e.date_of_birth || "—", "Nationality", e.nationality || "Cambodian"],
    ["Resident Status", e.is_resident ? "Resident" : "Non-Resident", "Marital Status", e.marital_status || "—"],
    ["Blood Group", e.blood_group || "—", "Religion", e.religion || "—"],
    ["Tax Number", e.employee_tax_number || "—", "National ID / Passport", e.national_id_number || "—"],
    [],
    ["--- CONTACT & RESIDENTIAL ADDRESS ---"],
    ["Work Email", e.email || "—", "Primary Phone", e.phone || "—"],
    ["Home Phone", e.home_phone || "—", "Office Phone", e.office_phone || "—"],
    ["Current Address", e.current_address || "—", "Permanent Address", e.permanent_address || "—"],
    [],
    ["--- EMPLOYMENT & ORGANIZATIONAL TERMS ---"],
    ["Business Unit", branchName, "BU Code", e.code_bu || "—"],
    ["Division", e.division || "—", "Department", department],
    ["Job Title / Designation", position, "Employee Level", e.employee_level || "—"],
    ["Employment Type", e.employment_type || "Full Time", "Work Site Location", siteName],
    ["Line Manager / Reports To", e.line_manager || e.reports_to || "—", "Biometric ID", e.biometric_user_id || "—"],
    ["Employment Status", status, "Joining Date", joinDate],
    ["Contract Type", e.contract_type || "UDC", "Contract Effective Date", e.contract_effective_date || joinDate],
    ["Contract End Date", contractEnd, "Contract Remark", e.contract_remark || "—"],
    [],
    ["--- PAYROLL, COMPENSATION & BANKING ---"],
    ["Basic Salary / Rate", salary, "Currency", currency],
    ["Salary Frequency", salaryFreq, "Tax Method", e.tax_method || "Gross"],
    ["NSSF Number", e.nssf_number || "—", "NSSF Registered", e.register_nssf ? "Yes" : "No"],
    ["Disbursement Bank", bankName, "Bank Account Number", bankAccount],
    [],
  ];

  dossierRows.push(["--- EMERGENCY CONTACTS ---"]);
  dossierRows.push(["No.", "Contact Name", "Relationship", "Phone Number"]);
  if (e.emergency_contacts && e.emergency_contacts.length > 0) {
    e.emergency_contacts.forEach((c, idx) => {
      dossierRows.push([idx + 1, c.contact_person || (c as any).name || "—", c.relationship || "—", c.phone_number || (c as any).phone || "—"]);
    });
  } else {
    dossierRows.push(["—", "No emergency contacts recorded", "—", "—"]);
  }
  dossierRows.push([]);

  dossierRows.push(["--- FAMILY MEMBERS & DEPENDENTS ---"]);
  dossierRows.push(["No.", "Full Name", "Relationship", "Date of Birth", "Occupation / Remark"]);
  if (e.family_members && e.family_members.length > 0) {
    e.family_members.forEach((f, idx) => {
      dossierRows.push([idx + 1, f.name || "—", f.relationship || "—", f.date_of_birth || (f as any).dob || "—", (f as any).occupation || f.remark || "—"]);
    });
  } else {
    dossierRows.push(["—", "No family members recorded", "—", "—", "—"]);
  }
  dossierRows.push([]);

  dossierRows.push(["--- EDUCATION HISTORY ---"]);
  dossierRows.push(["No.", "Institution", "Degree", "Major / Subject", "Period"]);
  if (e.education_history && e.education_history.length > 0) {
    e.education_history.forEach((ed, idx) => {
      dossierRows.push([idx + 1, ed.institue || (ed as any).institution || "—", ed.degree || "—", ed.subject || (ed as any).field_of_study || "—", `${ed.start_date || "—"} to ${ed.end_date || "Present"}`]);
    });
  } else {
    dossierRows.push(["—", "No education history recorded", "—", "—", "—"]);
  }
  dossierRows.push([]);

  dossierRows.push(["--- PRIOR WORK EXPERIENCE ---"]);
  dossierRows.push(["No.", "Company Name", "Position / Designation", "Period", "Reason for Leaving"]);
  if (e.employment_history && e.employment_history.length > 0) {
    e.employment_history.forEach((em, idx) => {
      dossierRows.push([idx + 1, em.company_name || "—", em.designation || (em as any).position || "—", `${em.start_date || "—"} to ${em.end_date || "—"}`, em.reason_for_leaving || "—"]);
    });
  } else {
    dossierRows.push(["—", "No prior employment recorded", "—", "—", "—"]);
  }

  const wsDossier = XLSX.utils.aoa_to_sheet(dossierRows);
  wsDossier["!cols"] = [{ wch: 26 }, { wch: 30 }, { wch: 24 }, { wch: 32 }, { wch: 24 }];
  XLSX.utils.book_append_sheet(wb, wsDossier, "Detailed Dossier");

  XLSX.writeFile(wb, `employee_${empCode}_${new Date().toISOString().slice(0, 10)}.xlsx`);
  return true;
}

