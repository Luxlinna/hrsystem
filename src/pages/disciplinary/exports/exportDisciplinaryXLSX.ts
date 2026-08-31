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

        return {
          "Case ID": r.id,
          Employee: empName,
          Department: dept,
          Role: role,
          "Case Title": r.title,
          "Incident Type": r.type,
          Severity: (r.severity || "low").toUpperCase(),
          Status: (r.status || "open").toUpperCase(),
          "Incident Date": r.incident_date ? new Date(r.incident_date).toLocaleDateString() : "—",
          "Follow-Up Date": r.follow_up_date ? new Date(r.follow_up_date).toLocaleDateString() : "—",
          "Logged By": r.created_by || "—",
          "Action Taken": r.action_taken || "—",
          "Resolution Date": r.resolved_at ? new Date(r.resolved_at).toLocaleDateString() : "—",
          "PIP Start Date": r.pip_start_date ? new Date(r.pip_start_date).toLocaleDateString() : "—",
          "PIP End Date": r.pip_end_date ? new Date(r.pip_end_date).toLocaleDateString() : "—",
          "PIP Goals": r.pip_goals || "—",
        };
      })
    : [{
        "Case ID": "—",
        Employee: "No disciplinary records found",
        Department: "—",
        Role: "—",
        "Case Title": "—",
        "Incident Type": "—",
        Severity: "—",
        Status: "—",
        "Incident Date": "—",
        "Follow-Up Date": "—",
        "Logged By": "—",
        "Action Taken": "—",
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
