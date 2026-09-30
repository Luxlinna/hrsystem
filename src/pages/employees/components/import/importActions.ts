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

  // 2. Prepare employee records
  const inserts = validRows.map((r) => {
    const nameParts = r.fullName.trim().split(/\s+/);
    const firstName = nameParts[0] || r.fullName;
    const lastName = nameParts.slice(1).join(" ") || "-";

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
      first_name: firstName,
      last_name: lastName,
      full_name: r.fullName,
      display_name: r.fullName,
      kh_name: r.khName || null,
      gender: r.gender,
      title: r.title || "Mr",
      email: cleanEmail,
      phone: cleanPhone || r.phone || null,
      branch_id: branchId,
      bu_full_name: branchName,
      default_work_location_id: matchedSite?.id || null,
      site: matchedSite?.name || r.siteName || "Main Office",
      working_location: matchedBranch?.location || "Phnom Penh",
      department: r.department || "Operations",
      position: r.position || "Staff",
      role: r.position || "Staff",
      employment_type: r.employmentType || "FULL-TIME",
      join_date: r.joinDate || new Date().toISOString().slice(0, 10),
      start_date: r.joinDate || new Date().toISOString().slice(0, 10),
      contract_type: r.contractType || "PERMANENT (UDC)",
      basic_salary: r.basicSalary,
      contract_rate: r.basicSalary,
      national_id_number: r.nationalId || null,
      date_of_birth: r.dob || null,
      current_address: r.currentAddress || null,
      status: "active",
      nationality: "Khmer",
      marital_status: "Single",
      is_resident: true,
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
