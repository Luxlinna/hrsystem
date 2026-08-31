import type { ToolAssignment, Tool } from "../types";

const getXLSX = async () => {
  return await import("xlsx");
};

export async function exportToolAssignmentsXLSX(
  assignments: ToolAssignment[],
  tools: Tool[]
): Promise<boolean> {
  const getToolName = (toolId: number) => {
    const t = tools.find((tool) => tool.id === toolId);
    return t ? t.name : `Tool #${toolId}`;
  };

  const data = assignments.length > 0
    ? assignments.map((a) => {
        const empName = a.employees ? `${a.employees.first_name} ${a.employees.last_name}` : "Employee";
        const dept = a.employees?.department || "—";
        const role = a.employees?.role || "—";

        return {
          "Assignment ID": a.id,
          Employee: empName,
          Department: dept,
          Role: role,
          "Tool Name": getToolName(a.tool_id),
          Status: a.revoked_at ? "REVOKED" : "AUTHORIZED",
          "Granted Date": a.assigned_at ? new Date(a.assigned_at).toLocaleDateString() : "—",
          "Revoked Date": a.revoked_at ? new Date(a.revoked_at).toLocaleDateString() : "—",
        };
      })
    : [{
        "Assignment ID": "—",
        Employee: "No assignments found",
        Department: "—",
        Role: "—",
        "Tool Name": "—",
        Status: "—",
        "Granted Date": "—",
        "Revoked Date": "—",
      }];

  const XLSX = await getXLSX();
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "ToolAccess");
  XLSX.writeFile(wb, `tool_access_matrix_${new Date().toISOString().slice(0, 10)}.xlsx`);
  return true;
}
