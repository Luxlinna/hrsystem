import type { EmployeeExit } from "../types";
import { EXIT_TYPE_CONFIG, REASON_TYPE_CONFIG } from "../constants";

export async function exportExitXLSX(exits: EmployeeExit[]): Promise<void> {
  const XLSX = await import("xlsx");

  const data = exits.map((ex, i) => ({
    "No": i + 1,
    "Employee Name": `${ex.employees?.first_name ?? ""} ${ex.employees?.last_name ?? ""}`.trim(),
    "Department": ex.employees?.department ?? "",
    "Role": ex.employees?.role ?? "",
    "Exit Type": EXIT_TYPE_CONFIG[ex.exit_type]?.label ?? ex.exit_type,
    "Last Working Day": ex.last_working_day,
    "Reason Type": REASON_TYPE_CONFIG[ex.reason_type]?.label ?? ex.reason_type,
    "Reason Description": ex.reason_description ?? "",
    "Document": ex.document_name ?? "",
    "Recorded By": ex.recorded_by ?? "",
    "Created At": ex.created_at.slice(0, 10),
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  ws["!cols"] = [6, 24, 16, 18, 16, 16, 20, 32, 20, 16, 12].map((wch) => ({ wch }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Exit Records");
  XLSX.writeFile(wb, `exit_records_${new Date().toISOString().slice(0, 10)}.xlsx`);
}
