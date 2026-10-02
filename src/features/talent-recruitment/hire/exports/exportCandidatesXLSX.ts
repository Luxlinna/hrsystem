import type { Candidate } from "../types";

const getXLSX = async () => {
  return await import("xlsx");
};

export async function exportCandidatesXLSX(candidates: Candidate[]): Promise<boolean> {
  const data =
    candidates.length > 0
      ? candidates.map((c) => ({
          ID: c.candidate_code || c.id,
          "Full Name": c.full_name || "—",
          "KH Name": c.kh_name || "—",
          Gender: c.gender || "—",
          "Code BU": c.code_bu || "—",
          "BU Full Name": c.bu_full_name || c.business_unit || "—",
          "Handle BU": c.handle_bu || "—",
          Division: c.division || "—",
          Department: c.department || c.job_postings?.department || "—",
          Position: c.position || c.job_title || c.job_postings?.title || "—",
          "Working Hour": c.working_hour || "—",
          "Total Working day": c.total_working_days || "—",
          "Full Time/Part Time": c.employment_type || "—",
          "Start Date": c.start_date ? new Date(c.start_date).toLocaleDateString() : "—",
          "Working Location": c.working_location || c.location || "—",
          "National ID": c.national_id_number || "—",
          "Date of Birth": c.date_of_birth ? new Date(c.date_of_birth).toLocaleDateString() : "—",
          "Current Address": c.current_address || c.location || "—",
          "Basic Salary": c.basic_salary != null ? c.basic_salary : (c.expected_salary ?? "—"),
          "Tax Method": c.tax_method || "—",
          Allowance: c.allowance || "—",
          "Line Manager": c.line_manager || "—",
          "Type of Contract": c.contract_type || "—",
          "Date End of FDC": c.fdc_end_date ? new Date(c.fdc_end_date).toLocaleDateString() : "—",
          Site: c.site || "—",
          "Bank Account": c.bank_account_number
            ? c.bank_name
              ? `${c.bank_name}: ${c.bank_account_number}`
              : c.bank_account_number
            : "—",
          NSSF: c.nssf_number || "—",
          Email: c.email || "—",
          "Phone Number": c.phone || "—",
          "Emergency Contact Name": c.emergency_contact_name || "—",
          "Emergency Phone Number": c.emergency_phone_number || "—",
          "Status(probation, intern)": c.hiring_status || c.stage || "—",
          "Marital Status": c.marital_status || "—",
        }))
      : [
          {
            ID: "—",
            "Full Name": "No candidates found",
            "KH Name": "—",
            Gender: "—",
            "Code BU": "—",
            "BU Full Name": "—",
            "Handle BU": "—",
            Division: "—",
            Department: "—",
            Position: "—",
            "Working Hour": "—",
            "Total Working day": "—",
            "Full Time/Part Time": "—",
            "Start Date": "—",
            "Working Location": "—",
            "National ID": "—",
            "Date of Birth": "—",
            "Current Address": "—",
            "Basic Salary": "—",
            "Tax Method": "—",
            Allowance: "—",
            "Line Manager": "—",
            "Type of Contract": "—",
            "Date End of FDC": "—",
            Site: "—",
            "Bank Account": "—",
            NSSF: "—",
            Email: "—",
            "Phone Number": "—",
            "Emergency Contact Name": "—",
            "Emergency Phone Number": "—",
            "Status(probation, intern)": "—",
            "Marital Status": "—",
          },
        ];

  const XLSX = await getXLSX();
  const ws = XLSX.utils.json_to_sheet(data);

  // Auto-fit column widths
  const colKeys = Object.keys(data[0]);
  ws["!cols"] = colKeys.map((k) => ({
    wch: Math.max(k.length, 14),
  }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Hiring Information");
  XLSX.writeFile(wb, `hiring_information_${new Date().toISOString().slice(0, 10)}.xlsx`);
  return true;
}
