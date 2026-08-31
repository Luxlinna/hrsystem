import type { ToolAssignment, Tool } from "../types";

export function exportToolAssignmentsCSV(
  assignments: ToolAssignment[],
  tools: Tool[]
): boolean {
  const getToolName = (toolId: number) => {
    const t = tools.find((tool) => tool.id === toolId);
    return t ? t.name : `Tool #${toolId}`;
  };

  const headers = ["Employee", "Department", "Role", "Tool Name", "Status", "Granted Date", "Revoked Date"];
  const rows = assignments.map((a) => [
    `"${a.employees ? `${a.employees.first_name} ${a.employees.last_name}` : "—"}"`,
    `"${a.employees?.department || ""}"`,
    `"${a.employees?.role || ""}"`,
    `"${getToolName(a.tool_id).replace(/"/g, '""')}"`,
    `"${a.revoked_at ? "REVOKED" : "AUTHORIZED"}"`,
    `"${a.assigned_at || ""}"`,
    `"${a.revoked_at || ""}"`,
  ]);

  const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `tool_access_matrix_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  return true;
}
