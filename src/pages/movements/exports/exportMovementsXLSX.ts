import type { EmployeeMovement } from "../types";
import { MOVEMENT_TYPES } from "../constants";

const getXLSX = async () => {
  return await import("xlsx");
};

export async function exportMovementsXLSX(movements: EmployeeMovement[]): Promise<boolean> {
  const data =
    movements.length > 0
      ? movements.map((m) => {
          const emp = m.employees;
          const typeConfig = MOVEMENT_TYPES[m.movement_type];

          // Summarize previous vs new values
          const prevSummary = Object.entries(m.previous_values || {})
            .map(([k, v]) => `${k}: ${v}`)
            .join(", ") || "—";
          const newSummary = Object.entries(m.new_values || {})
            .map(([k, v]) => `${k}: ${v}`)
            .join(", ") || "—";

          return {
            "Movement ID": m.id,
            "Employee Name": emp ? `${emp.first_name} ${emp.last_name}` : "—",
            "Employee ID": m.employee_id || "—",
            "Department": emp?.department || "—",
            "Branch": emp?.branches?.name || "—",
            "Movement Type": typeConfig?.label || m.movement_type,
            "Action Title": m.title,
            "Effective Date": m.effective_date,
            "Previous Baseline": prevSummary,
            "New Assigned Value": newSummary,
            "Remarks / Justification": m.remarks || "—",
            "Document Attached": m.document_name ? `Yes (${m.document_name})` : "No",
            "Document Link": m.document_url || "—",
            "Actioned By": m.created_by_name || "HR Admin",
            "Recorded Date": m.created_at ? new Date(m.created_at).toLocaleDateString() : "—",
          };
        })
      : [
          {
            "Movement ID": "—",
            "Employee Name": "No movement records found",
            "Employee ID": "—",
            "Department": "—",
            "Branch": "—",
            "Movement Type": "—",
            "Action Title": "—",
            "Effective Date": "—",
            "Previous Baseline": "—",
            "New Assigned Value": "—",
            "Remarks / Justification": "—",
            "Document Attached": "—",
            "Document Link": "—",
            "Actioned By": "—",
            "Recorded Date": "—",
          },
        ];

  const XLSX = await getXLSX();
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Employee Movements");
  XLSX.writeFile(wb, `employee_movements_${new Date().toISOString().slice(0, 10)}.xlsx`);
  return true;
}
