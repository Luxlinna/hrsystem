import type { EmployeeMovement } from "../types";
import { MOVEMENT_TYPES } from "../constants";

export function exportMovementsCSV(movements: EmployeeMovement[]): void {
  const headers = [
    "Movement ID",
    "Employee Name",
    "Employee ID",
    "Department",
    "Branch",
    "Movement Type",
    "Action Title",
    "Effective Date",
    "Previous Values",
    "New Values",
    "Remarks",
    "Document Name",
    "Actioned By",
    "Created At",
  ];

  const rows = movements.map((m) => {
    const emp = m.employees;
    const typeLabel = MOVEMENT_TYPES[m.movement_type]?.label || m.movement_type;
    const prevStr = Object.entries(m.previous_values || {})
      .map(([k, v]) => `${k}:${v}`)
      .join("; ");
    const nextStr = Object.entries(m.new_values || {})
      .map(([k, v]) => `${k}:${v}`)
      .join("; ");

    return [
      m.id,
      emp ? `"${emp.first_name} ${emp.last_name}"` : '""',
      m.employee_id || "",
      `"${emp?.department || ""}"`,
      `"${emp?.branches?.name || ""}"`,
      `"${typeLabel}"`,
      `"${m.title.replace(/"/g, '""')}"`,
      m.effective_date,
      `"${prevStr.replace(/"/g, '""')}"`,
      `"${nextStr.replace(/"/g, '""')}"`,
      `"${(m.remarks || "").replace(/"/g, '""')}"`,
      `"${(m.document_name || "").replace(/"/g, '""')}"`,
      `"${(m.created_by_name || "").replace(/"/g, '""')}"`,
      m.created_at,
    ].join(",");
  });

  const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `employee_movements_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
