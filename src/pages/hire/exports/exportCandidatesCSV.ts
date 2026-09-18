import type { Candidate } from "../types";

export function exportCandidatesCSV(candidates: Candidate[]): boolean {
  const headers = [
    "ID",
    "Full Name",
    "KH Name",
    "Gender",
    "Code BU",
    "BU Full Name",
    "Handle BU",
    "Division",
    "Department",
    "Position",
    "Working Hour",
    "Total Working day",
    "Full Time/Part Time",
    "Start Date",
    "Working Location",
    "National ID",
    "Date of Birth",
    "Current Address",
    "Basic Salary",
    "Tax Method",
    "Allowance",
    "Line Manager",
    "Type of Contract",
    "Date End of FDC",
    "Site",
    "Bank Account",
    "NSSF",
    "Email",
    "Phone Number",
    "Emergency Contact Name",
    "Emergency Phone Number",
    "Status(probation, intern)",
    "Marital Status",
  ];

  const escapeCSV = (val: any): string => {
    if (val === null || val === undefined) return '""';
    const s = String(val).replace(/"/g, '""');
    return `"${s}"`;
  };

  const rows = candidates.map((c) =>
    [
      escapeCSV(c.candidate_code || c.id),
      escapeCSV(c.full_name || ""),
      escapeCSV(c.kh_name || ""),
      escapeCSV(c.gender || ""),
      escapeCSV(c.code_bu || ""),
      escapeCSV(c.bu_full_name || c.business_unit || ""),
      escapeCSV(c.handle_bu || ""),
      escapeCSV(c.division || ""),
      escapeCSV(c.department || c.job_postings?.department || ""),
      escapeCSV(c.position || c.job_title || c.job_postings?.title || ""),
      escapeCSV(c.working_hour || ""),
      escapeCSV(c.total_working_days || ""),
      escapeCSV(c.employment_type || ""),
      escapeCSV(c.start_date ? new Date(c.start_date).toLocaleDateString() : ""),
      escapeCSV(c.working_location || c.location || ""),
      escapeCSV(c.national_id_number || ""),
      escapeCSV(c.date_of_birth ? new Date(c.date_of_birth).toLocaleDateString() : ""),
      escapeCSV(c.current_address || c.location || ""),
      escapeCSV(c.basic_salary != null ? c.basic_salary : (c.expected_salary ?? "")),
      escapeCSV(c.tax_method || ""),
      escapeCSV(c.allowance || ""),
      escapeCSV(c.line_manager || ""),
      escapeCSV(c.contract_type || ""),
      escapeCSV(c.fdc_end_date ? new Date(c.fdc_end_date).toLocaleDateString() : ""),
      escapeCSV(c.site || ""),
      escapeCSV(
        c.bank_account_number
          ? c.bank_name
            ? `${c.bank_name}: ${c.bank_account_number}`
            : c.bank_account_number
          : ""
      ),
      escapeCSV(c.nssf_number || ""),
      escapeCSV(c.email || ""),
      escapeCSV(c.phone || ""),
      escapeCSV(c.emergency_contact_name || ""),
      escapeCSV(c.emergency_phone_number || ""),
      escapeCSV(c.hiring_status || c.stage || ""),
      escapeCSV(c.marital_status || ""),
    ].join(",")
  );

  const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `hiring_information_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  return true;
}
