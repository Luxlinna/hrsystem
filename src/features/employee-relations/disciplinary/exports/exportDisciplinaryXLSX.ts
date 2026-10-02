import type { DisciplinaryRecord } from "../types";

const getXLSX = async () => {
  return await import("xlsx");
};

export async function exportDisciplinaryXLSX(records: DisciplinaryRecord[]): Promise<boolean> {
  const data = records.length > 0
    ? records.map((r) => {
        const empName = r.employees ? `${r.employees.first_name} ${r.employees.last_name}` : "Unknown Employee";
        const dept = r.employees?.department || "—";
        const role = r.employees?.role || "—";

        const empId = r.employees?.employee_id || r.employee_id?.substring(0, 8) || "—";

        return {
          "Case ID": r.id,
          "Employee ID": empId,
          Employee: empName,
          Department: dept,
          Role: role,
          "Warning / Case Title": r.title,
          "Warning Type": r.warning_type || r.type,
          Severity: (r.severity || "low").toUpperCase(),
          Status: (r.status || "open").toUpperCase(),
          "Warning Date": r.warning_date || r.incident_date || "—",
          "Follow-Up Date": r.follow_up_date ? new Date(r.follow_up_date).toLocaleDateString() : "—",
          "Description of Warning": r.description || "—",
          "Action to Take": r.action_to_take || r.action_taken || "—",
          "Employee Promise": r.employee_promise || "—",
          Remark: r.remark || r.notes || "—",
          "Attachment Document": r.document_url || "—",
          "Logged By": r.created_by || "—",
          "Resolution Date": r.resolved_at ? new Date(r.resolved_at).toLocaleDateString() : "—",
          "PIP Start Date": r.pip_start_date ? new Date(r.pip_start_date).toLocaleDateString() : "—",
          "PIP End Date": r.pip_end_date ? new Date(r.pip_end_date).toLocaleDateString() : "—",
          "PIP Goals": r.pip_goals || "—",
        };
      })
    : [{
        "Case ID": "—",
        "Employee ID": "—",
        Employee: "No disciplinary records found",
        Department: "—",
        Role: "—",
        "Warning / Case Title": "—",
        "Warning Type": "—",
        Severity: "—",
        Status: "—",
        "Warning Date": "—",
        "Follow-Up Date": "—",
        "Description of Warning": "—",
        "Action to Take": "—",
        "Employee Promise": "—",
        Remark: "—",
        "Attachment Document": "—",
        "Logged By": "—",
        "Resolution Date": "—",
        "PIP Start Date": "—",
        "PIP End Date": "—",
        "PIP Goals": "—",
      }];

  const XLSX = await getXLSX();
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Disciplinary");
  XLSX.writeFile(wb, `disciplinary_records_${new Date().toISOString().slice(0, 10)}.xlsx`);
  return true;
}
