import type { Employee, AccountStatus } from "../types";
import { supabase } from "@/lib/supabase";

const getXLSX = async () => {
  return await import("xlsx");
};

const isUuid = (val?: string | null) =>
  Boolean(val && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val));

export async function exportEmployeesXLSX(
  employees: Employee[],
  accountStatus: Record<string, AccountStatus> = {}
): Promise<boolean> {
  const empMap = new Map<string, string>();
  employees.forEach((emp) => {
    const name = emp.full_name || `${emp.first_name || ""} ${emp.last_name || ""}`.trim();
    if (emp.id && name) empMap.set(emp.id, name);
    if (emp.employee_code && name) empMap.set(emp.employee_code, name);
  });

  const missingIds = employees
    .map((e) => e.reports_to || (isUuid(e.line_manager) ? e.line_manager : null))
    .filter((id): id is string => Boolean(id && isUuid(id) && !empMap.has(id)));

  if (missingIds.length > 0) {
    const { data: managers } = await supabase
      .from("employees")
      .select("id, first_name, last_name, full_name")
      .in("id", [...new Set(missingIds)]);
    (managers || []).forEach((m: any) => {
      const name = m.full_name || `${m.first_name || ""} ${m.last_name || ""}`.trim();
      if (m.id && name) empMap.set(m.id, name);
    });
  }

  const resolveManager = (e: Employee) => {
    if (e.reports_to && empMap.has(e.reports_to)) return empMap.get(e.reports_to)!;
    if (e.line_manager) {
      if (empMap.has(e.line_manager)) return empMap.get(e.line_manager)!;
      if (!isUuid(e.line_manager)) return e.line_manager;
    }
    return "—";
  };

  const emptyRow: Record<string, string | number> = { "No.": 1, "Employee ID": "—", "Full Name (EN)": "No employees found" };
  const data = employees.length > 0
    ? employees.map((e, index) => {
        const acc = accountStatus[e.email];
        const accountStatusValue = acc?.hasAccount ? "Active Account" : acc?.invited ? "Invited" : "No Account";
        const fullName = e.full_name || `${e.first_name || ""} ${e.last_name || ""}`.trim() || "—";
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
          "Division": e.division || "—",
          "Department": e.department || "—",
          "Position / Role": e.position || e.role || "—",
          "Employee Level": e.employee_level || "—",
          "Employment Type": e.employment_type || "Full Time",
          "Work Location / Site": e.work_locations?.name || e.working_location || "Main Office",
          "Line Manager / Reports To": resolveManager(e),
          "Biometric User ID": e.biometric_user_id || "—",
          "Joining Date": e.join_date || e.start_date || "—",
          "Employment Status": (e.status || "active").replace(/_/g, " ").toUpperCase(),
          "Contract Type": e.contract_type || "UDC",
          "Contract Effective Date": e.contract_effective_date || e.join_date || "—",
          "Contract End Date": contractEnd,
          "Contract Remark": e.contract_remark || "—",
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
    : [emptyRow];

  const XLSX = await getXLSX();
  const ws = XLSX.utils.json_to_sheet(data);
  const widths = [6, 14, 22, 14, 14, 18, 10, 14, 14, 14, 14, 12, 12, 20, 16, 26, 16, 16, 16, 30, 30, 22, 18, 22, 16, 18, 22, 14, 16, 20, 22, 16, 14, 14, 16, 18, 18, 22, 10, 16, 12, 12, 16, 14, 20, 22, 18];
  ws["!cols"] = widths.map((wch) => ({ wch }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Employee Form Data");
  XLSX.writeFile(wb, `employees_full_form_${new Date().toISOString().slice(0, 10)}.xlsx`);
  return true;
}
