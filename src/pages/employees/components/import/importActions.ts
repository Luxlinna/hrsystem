import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import { logActivity } from "@/lib/audit";
import { normalizePhone } from "@/lib/phoneUtils";
import type { ParsedEmployeeRow } from "./types";

interface CommitImportParams {
  validRows: ParsedEmployeeRow[];
  actorName: string;
  roleName: string;
  fileName?: string;
  onSuccess: () => void;
  onClose: () => void;
}

export async function commitEmployeeImport({
  validRows,
  actorName,
  roleName,
  fileName = "batch",
  onSuccess,
  onClose,
}: CommitImportParams) {
  // 1. Load existing work locations and branches
  const [{ data: dbBranches }, { data: dbSites }] = await Promise.all([
    supabase.from("branches").select("id, name, location").is("deleted_at", null),
    supabase.from("work_locations").select("id, name, branch_id").is("deleted_at", null),
  ]);

  const defaultBranchId = dbBranches?.[0]?.id || null;

  // 2. Prepare employee records matching the exact system form schema
  const inserts = validRows.map((r) => {
    const nameParts = r.fullName.trim().split(/\s+/);
    const firstName = r.firstName || nameParts[0] || r.fullName;
    const lastName = r.lastName || nameParts.slice(1).join(" ") || "-";

    const matchedBranch = dbBranches?.find(
      (b) => r.buName && b.name.toLowerCase().includes(r.buName.toLowerCase())
    );
    const branchId = matchedBranch ? matchedBranch.id : defaultBranchId;
    const branchName = matchedBranch?.name || dbBranches?.[0]?.name || "Main BU";

    const matchedSite = dbSites?.find(
      (s) => r.siteName && s.name.toLowerCase().includes(r.siteName.toLowerCase()) && (!branchId || s.branch_id === branchId)
    );

    const cleanEmail = r.email ? r.email.trim().toLowerCase() : null;
    const cleanPhone = r.phone ? normalizePhone(r.phone) : null;

    return {
      // 1. Personal & Identity
      employee_code: r.employeeCode || null,
      first_name: firstName,
      last_name: lastName,
      full_name: r.fullName,
      display_name: r.fullName,
      kh_name: r.khName || null,
      gender: r.gender,
      title: r.title || "Mr",
      date_of_birth: r.dob || null,
      marital_status: r.maritalStatus || "Single",
      nationality: r.nationality || "Khmer",
      national_id_number: r.nationalId || null,
      employee_tax_number: r.taxNumber || null,
      is_resident: true,

      // 2. Organization & Location
      branch_id: branchId,
      bu_full_name: branchName,
      default_work_location_id: matchedSite?.id || null,
      site: matchedSite?.name || r.siteName || "Main Office",
      working_location: matchedBranch?.location || "Phnom Penh",
      department: r.department || "Operations",
      division: r.division || null,
      position: r.position || "Staff",
      role: r.position || "Staff",
      reports_to: r.reportsTo || null,
      line_manager: r.reportsTo || null,

      // 3. Terms & Employment Schedule
      employment_type: r.employmentType || "FULL-TIME",
      employee_level: r.employeeLevel || null,
      join_date: r.joinDate || new Date().toISOString().slice(0, 10),
      start_date: r.joinDate || new Date().toISOString().slice(0, 10),
      contract_type: r.contractType || "PERMANENT (UDC)",
      contract_end_date: r.contractEndDate || null,
      fdc_end_date: r.contractEndDate || null,
      status: r.status || "active",
      hiring_status: "employed",

      // 4. Compensation & Payroll
      basic_salary: r.basicSalary,
      contract_rate: r.basicSalary,
      tax_salary: r.basicSalary ? String(r.basicSalary) : null,
      tax_salary_currency: "USD",
      tax_salary_frequency: "Monthly",
      contract_rate_currency: "USD",
      contract_rate_frequency: "Monthly",
      bank_name: r.bankName || null,
      bank_account_number: r.bankAccountNumber || null,
      nssf_number: r.nssfNumber || null,
      payroll_structure: r.payrollStructure || "Standard Monthly",

      // 5. Contacts & Address
      email: cleanEmail,
      phone: cleanPhone || r.phone || null,
      current_address: r.currentAddress || null,
      permanent_address: r.permanentAddress || r.currentAddress || null,
      emergency_contact_name: r.emergencyContactName || null,
      emergency_phone_number: r.emergencyPhone || null,
      biometric_user_id: r.biometricId || null,
    };
  });

  const { data: inserted, error: insertErr } = await supabase
    .from("employees")
    .insert(inserts)
    .select("id, full_name");

  if (insertErr) throw insertErr;

  await logActivity({
    module: "employees",
    action: "created",
    entityType: "employee",
    actorName,
    actorRole: roleName,
    description: `Imported ${inserts.length} employees from Excel file "${fileName}"`,
  });

  toast(
    "Import Completed",
    `Successfully imported ${inserted?.length || inserts.length} employees into the directory!`,
    "success"
  );

  onSuccess();
  onClose();
}
