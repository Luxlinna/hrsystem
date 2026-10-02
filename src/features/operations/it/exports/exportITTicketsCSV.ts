import type { ITTicket } from "../types";

export function exportITTicketsCSV(tickets: ITTicket[]): boolean {
  const headers = ["Title", "Category", "Requester", "Branch", "Priority", "Status", "Created Date", "Resolved Date", "Description"];
  const rows = tickets.map((t) => [
    `"${t.title.replace(/"/g, '""')}"`,
    `"${t.category}"`,
    `"${t.requester_name.replace(/"/g, '""')}"`,
    `"${t.branches?.name || "General"}"`,
    `"${t.priority}"`,
    `"${t.status}"`,
    `"${t.created_at ? new Date(t.created_at).toLocaleDateString() : ""}"`,
    `"${t.resolved_at ? new Date(t.resolved_at).toLocaleDateString() : ""}"`,
    `"${(t.description || "").replace(/"/g, '""')}"`,
  ]);

  const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `it_tickets_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  return true;
}
