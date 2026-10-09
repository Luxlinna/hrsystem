import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import { logActivity } from "@/lib/audit";
import { normalizePhone } from "@/lib/phoneUtils";
import { normalizeStatus } from "./fieldNormalizer";
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
  // 1. Load existing work locations, branches, and employees for relations and duplicate checks
  const [{ data: dbBranches }, { data: dbSites }, { data: dbEmployees }] = await Promise.all([
    supabase.from("branches").select("id, name, location").is("deleted_at", null),
    supabase.from("work_locations").select("id, name, branch_id").is("deleted_at", null),
    supabase.from("employees").select("id, first_name, last_name, full_name, employee_code, phone, email").is("deleted_at", null),
  ]);

  const defaultBranchId = dbBranches?.[0]?.id || null;
  const isUuid = (val?: string | null) =>
    Boolean(val && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val));

  const existingPhones = new Set((dbEmployees || []).map((e) => (e.phone ? normalizePhone(e.phone) : null)).filter(Boolean));
  const existingEmails = new Set((dbEmployees || []).map((e) => e.email?.toLowerCase().trim()).filter(Boolean));
  const existingCodes = new Set((dbEmployees || []).map((e) => e.employee_code?.toLowerCase().trim()).filter(Boolean));

  const seenPhones = new Set<string>();
  const seenEmails = new Set<string>();
  const seenCodes = new Set<string>();

  const resolveManager = (term?: string | null) => {
    if (!term || term === "—" || term === "-") return { id: null, name: null };
    if (isUuid(term)) {
      const match = dbEmployees?.find((e) => e.id === term);
      return { id: term, name: match?.full_name || `${match?.last_name || ""} ${match?.first_name || ""}`.trim() || null };
    }
    const cleanTerm = term.toLowerCase().trim();
    const match = dbEmployees?.find((e) => {
      const fn = (e.full_name || `${e.last_name || ""} ${e.first_name || ""}`).toLowerCase().trim();
      return fn === cleanTerm || (e.employee_code && e.employee_code.toLowerCase().trim() === cleanTerm);
    });
    return {
      id: match?.id || null,
      name: match ? (match.full_name || `${match.last_name || ""} ${match.first_name || ""}`.trim()) : term,
    };
  };

  // 2. Prepare employee records matching the exact system database schema
  const inserts = validRows.map((r) => {
    const nameParts = r.fullName.trim().split(/\s+/);
    const firstName = r.firstName || nameParts[0] || r.fullName;
    const lastName = r.lastName || nameParts.slice(1).join(" ") || "-";

    const matchedBranch = dbBranches?.find(
      (b) => r.buName && b.name.toLowerCase().includes(r.buName.toLowerCase())
    );
    const rawBranchId = matchedBranch ? matchedBranch.id : defaultBranchId;
    const branchId = isUuid(rawBranchId) ? rawBranchId : null;
    const branchName = matchedBranch?.name || dbBranches?.[0]?.name || "Main BU";

    const matchedSite = dbSites?.find(
      (s) => r.siteName && s.name.toLowerCase().includes(r.siteName.toLowerCase()) && (!branchId || s.branch_id === branchId)
    );
    const siteLocationId = matchedSite?.id && isUuid(matchedSite.id) ? matchedSite.id : null;

    // Validate and de-duplicate unique fields
    let cleanEmail: string | null = null;
    if (r.email && r.email.includes("@")) {
      const em = r.email.trim().toLowerCase();
      if (!seenEmails.has(em) && !existingEmails.has(em)) {
        cleanEmail = em;
        seenEmails.add(em);
      }
    }

    let cleanPhone: string | null = null;
    if (r.phone) {
      const digits = r.phone.replace(/\D/g, "");
      if (digits.length >= 7) {
        const norm = normalizePhone(r.phone);
        if (!seenPhones.has(norm) && !existingPhones.has(norm)) {
          cleanPhone = norm;
          seenPhones.add(norm);
        }
      }
    }

    let cleanCode: string | null = null;
    if (r.employeeCode && r.employeeCode !== "—") {
      const codeKey = r.employeeCode.trim().toLowerCase();
      if (!seenCodes.has(codeKey) && !existingCodes.has(codeKey)) {
        cleanCode = r.employeeCode.trim();
        seenCodes.add(codeKey);
      }
    }

    const mgr = resolveManager(r.reportsTo);

    const sanitizeDate = (val?: string | null): string | null => {
      if (!val) return null;
      const s = String(val).trim();
      if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
        const y = parseInt(s.slice(0, 4), 10);
        if (y >= 1900 && y <= 2100) return s;
      }
      return null;
    };

    const validJoinDate = sanitizeDate(r.joinDate) || new Date().toISOString().slice(0, 10);
    const validDob = sanitizeDate(r.dob);
    const validContractEnd = sanitizeDate(r.contractEndDate);

    return {
      employee_code: cleanCode,
      first_name: firstName,
      last_name: lastName,
      full_name: r.fullName,
      display_name: r.fullName,
      kh_name: r.khName || null,
      gender: r.gender,
      title: r.title || "Mr",
      date_of_birth: validDob,
      marital_status: r.maritalStatus || "Single",
      nationality: r.nationality || "Khmer",
      national_id_number: r.nationalId || null,
      employee_tax_number: r.taxNumber || null,
      is_resident: true,

      branch_id: branchId,
      bu_full_name: branchName,
      default_work_location_id: siteLocationId,
      site: matchedSite?.name || r.siteName || (branchName ? `Main Office (${branchName})` : "Main Office"),
      working_location: matchedBranch?.location || "Phnom Penh",
      department: r.department?.trim() || null,
      division: r.division?.trim() || null,
      position: r.position || "Staff",
      role: r.position || "Staff",
      reports_to: mgr.id,
      line_manager: mgr.name,

      employment_type: r.employmentType || "FULL-TIME",
      join_date: validJoinDate,
      start_date: validJoinDate,
      contract_type: r.contractType || "PERMANENT (UDC)",
      contract_end_date: validContractEnd,
      fdc_end_date: validContractEnd,
      status: normalizeStatus(r.status),
      hiring_status: normalizeStatus(r.status) === "onboarding" ? "probation" : "employed",

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

      email: cleanEmail,
      phone: cleanPhone,
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
