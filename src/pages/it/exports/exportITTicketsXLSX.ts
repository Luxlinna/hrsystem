import type { ITTicket } from "../types";

const getXLSX = async () => {
  return await import("xlsx");
};

export async function exportITTicketsXLSX(tickets: ITTicket[]): Promise<boolean> {
  const data = tickets.length > 0
    ? tickets.map((t) => ({
        "Ticket ID": t.id,
        Title: t.title,
        Category: t.category,
        Requester: t.requester_name,
        Branch: t.branches?.name || "General",
        Priority: (t.priority || "medium").toUpperCase(),
        Status: (t.status || "open").toUpperCase(),
        "Created Date": t.created_at ? new Date(t.created_at).toLocaleDateString() : "—",
        "Resolved Date": t.resolved_at ? new Date(t.resolved_at).toLocaleDateString() : "—",
        Description: t.description || "",
      }))
    : [{
        "Ticket ID": "—",
        Title: "No tickets found",
        Category: "—",
        Requester: "—",
        Branch: "—",
        Priority: "—",
        Status: "—",
        "Created Date": "—",
        "Resolved Date": "—",
        Description: "—",
      }];

  const XLSX = await getXLSX();
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "ITTickets");
  XLSX.writeFile(wb, `it_tickets_${new Date().toISOString().slice(0, 10)}.xlsx`);
  return true;
}
