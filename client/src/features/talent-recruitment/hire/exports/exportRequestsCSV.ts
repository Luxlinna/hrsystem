import type { HiringRequest } from "../types";

export function exportRequestsCSV(requests: HiringRequest[]): boolean {
  const headers = ["Requisition Title", "Department", "Branch", "Headcount", "Employment Type", "Urgency", "Requested By", "Status", "Created Date"];
  const rows = requests.map((r) => [
    `"${r.title.replace(/"/g, '""')}"`,
    `"${r.department.replace(/"/g, '""')}"`,
    `"${(r.branches?.name || "All Branches").replace(/"/g, '""')}"`,
    r.headcount || 1,
    `"${r.employment_type.replace(/"/g, '""')}"`,
    `"${(r.urgency || "medium").toUpperCase()}"`,
    `"${r.requested_by_name.replace(/"/g, '""')}"`,
    `"${(r.status || "").replace(/_/g, " ").toUpperCase()}"`,
    `"${r.created_at ? new Date(r.created_at).toLocaleDateString() : "—"}"`,
  ].join(","));

  const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `hiring_requests_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  return true;
}
