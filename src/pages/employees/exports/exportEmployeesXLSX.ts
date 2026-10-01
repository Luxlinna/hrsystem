import type { Employee, AccountStatus } from "../types";

const getXLSX = async () => {
  return await import("xlsx");
};

export async function exportEmployeesXLSX(
  employees: Employee[],
  accountStatus: Record<string, AccountStatus> = {}
): Promise<boolean> {
  const data = employees.length > 0
    ? employees.map((e, index) => {
        const acc = accountStatus[e.email];
        const accountStatusValue = acc?.hasAccount ? "Active Account" : acc?.invited ? "Invited" : "No Account";
        const fullName = e.full_name || `${e.first_name || ""} ${e.last_name || ""}`.trim() || "—";
        const salary = e.basic_salary != null ? e.basic_salary : e.contract_rate != null ? e.contract_rate : "—";
        const currency = e.contract_rate_currency || "USD";
        const contractEnd = e.contract_end_date || e.fdc_end_date || "Continuous";
        const bankName = e.bank_name || (e.bank_accounts?.[0]?.payment_method ?? "—");
        const bankAccount = e.bank_account_number || (e.bank_accounts?.[0]?.account_number ?? "—");
        const emContact = e.emergency_contact_name || (e.emergency_contacts?.[0]?.contact_person ?? "—");
        const emPhone = e.emergency_phone_number || (e.emergency_contacts?.[0]?.phone_number ?? "—");
        const fullAddr = [e.current_address, e.permanent_city, e.permanent_province, e.permanent_country].filter(Boolean).join(", ") || e.permanent_address || "—";

        return {
          "No.": index + 1,
          "Employee ID": e.employee_code || e.id.slice(0, 8),
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
          "Business Unit": e.branches?.name || e.code_bu,
          "BU Code": e.code_bu || "—",
          "Division": e.division || "—",
          "Department": e.department || "—",
          "Position / Role": e.position || e.role || "—",
          "Employee Level": e.employee_level || "—",
          "Employment Type": e.employment_type || "Full Time",
          "Work Location / Site": e.work_locations?.name || e.working_location || "Main Office",
          "Line Manager / Reports To": e.line_manager || e.reports_to || "—",
          "Biometric User ID": e.biometric_user_id || "—",
          "Joining Date": e.join_date || e.start_date || "—",
          "Employment Status": (e.status || "active").replace(/_/g, " ").toUpperCase(),
          "Contract Type": e.contract_type || "UDC",
          "Contract Effective Date": e.contract_effective_date || e.join_date || "—",
          "Contract End Date": contractEnd,
          "Contract Remark": e.contract_remark || "—",
          "Basic Salary / Rate": salary,
          "Currency": currency,
          "Salary Frequency": e.tax_salary_frequency || e.contract_rate_frequency || "Monthly",
          "Tax Method": e.tax_method || "Gross",
          "Tax Salary": e.tax_salary ?? "—",
          "NSSF Number": e.nssf_number || "—",
          "NSSF Registered": e.register_nssf ? "Yes" : "No",
          "Disbursement Bank": bankName,
          "Bank Account Number": bankAccount,
          "User Account Status": accountStatusValue,
        };
      })
    : [
        {
          "No.": 1,
          "Employee ID": "—",
          "Full Name (EN)": "No employees found",
          "First Name": "—",
          "Last Name": "—",
          "Khmer Name": "—",
          "Gender": "—",
          "Date of Birth": "—",
          "Marital Status": "—",
          "Nationality": "—",
          "Resident Status": "—",
          "Blood Group": "—",
          "Religion": "—",
          "National ID / Passport": "—",
          "Tax ID Number": "—",
          "Work Email": "—",
          "Primary Phone": "—",
          "Home Phone": "—",
          "Office Phone": "—",
          "Current Address": "—",
          "Permanent Address": "—",
          "Emergency Contact Name": "—",
          "Emergency Contact Phone": "—",
          "Business Unit": "—",
          "BU Code": "—",
          "Division": "—",
          "Department": "—",
          "Position / Role": "—",
          "Employee Level": "—",
          "Employment Type": "—",
          "Work Location / Site": "—",
          "Line Manager / Reports To": "—",
          "Biometric User ID": "—",
          "Joining Date": "—",
          "Employment Status": "—",
          "Contract Type": "—",
          "Contract Effective Date": "—",
          "Contract End Date": "—",
          "Contract Remark": "—",
          "Basic Salary / Rate": "—",
          "Currency": "—",
          "Salary Frequency": "—",
          "Tax Method": "—",
          "Tax Salary": "—",
          "NSSF Number": "—",
          "NSSF Registered": "—",
          "Disbursement Bank": "—",
          "Bank Account Number": "—",
          "User Account Status": "—",
        },
      ];

  const XLSX = await getXLSX();
  const ws = XLSX.utils.json_to_sheet(data);

  ws["!cols"] = [
    { wch: 6 },  // No.
    { wch: 14 }, // Employee ID
    { wch: 22 }, // Full Name (EN)
    { wch: 14 }, // First Name
    { wch: 14 }, // Last Name
    { wch: 18 }, // Khmer Name
    { wch: 10 }, // Gender
    { wch: 14 }, // Date of Birth
    { wch: 14 }, // Marital Status
    { wch: 14 }, // Nationality
    { wch: 14 }, // Resident Status
    { wch: 12 }, // Blood Group
    { wch: 12 }, // Religion
    { wch: 20 }, // National ID
    { wch: 16 }, // Tax ID Number
    { wch: 26 }, // Email
    { wch: 16 }, // Primary Phone
    { wch: 16 }, // Home Phone
    { wch: 16 }, // Office Phone
    { wch: 30 }, // Current Address
    { wch: 30 }, // Permanent Address
    { wch: 22 }, // Emergency Contact Name
    { wch: 18 }, // Emergency Contact Phone
    { wch: 22 }, // Branch / BU
    { wch: 12 }, // BU Code
    { wch: 16 }, // Division
    { wch: 18 }, // Department
    { wch: 22 }, // Position / Role
    { wch: 14 }, // Level
    { wch: 16 }, // Employment Type
    { wch: 20 }, // Work Location / Site
    { wch: 22 }, // Line Manager
    { wch: 16 }, // Biometric ID
    { wch: 14 }, // Joining Date
    { wch: 14 }, // Status
    { wch: 16 }, // Contract Type
    { wch: 18 }, // Contract Effective Date
    { wch: 18 }, // Contract End Date
    { wch: 22 }, // Contract Remark
    { wch: 16 }, // Basic Salary
    { wch: 10 }, // Currency
    { wch: 16 }, // Frequency
    { wch: 12 }, // Tax Method
    { wch: 12 }, // Tax Salary
    { wch: 16 }, // NSSF Number
    { wch: 14 }, // NSSF Registered
    { wch: 20 }, // Bank Name
    { wch: 22 }, // Bank Account Number
    { wch: 18 }, // User Account Status
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Employee Form Data");
  XLSX.writeFile(wb, `employees_full_form_${new Date().toISOString().slice(0, 10)}.xlsx`);
  return true;
}
