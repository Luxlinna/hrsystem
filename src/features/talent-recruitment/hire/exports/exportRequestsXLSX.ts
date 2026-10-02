import type { HiringRequest } from "../types";

const getXLSX = async () => {
  return await import("xlsx");
};

export async function exportRequestsXLSX(requests: HiringRequest[]): Promise<boolean> {
  const data = requests.length > 0
    ? requests.map((r) => ({
        "Request ID": r.id,
        Title: r.title,
        Department: r.department,
        Branch: r.branches?.name || "All Branches",
        Headcount: r.headcount || 1,
        "Employment Type": r.employment_type,
        Urgency: (r.urgency || "medium").toUpperCase(),
        Status: (r.status || "pending").replace(/_/g, " ").toUpperCase(),
        "Requested By": r.requested_by_name,
        "Created Date": r.created_at ? new Date(r.created_at).toLocaleDateString() : "—",
      }))
    : [{ "Request ID": "—", Title: "No requests found", Department: "—", Branch: "—", Headcount: 0, "Employment Type": "—", Urgency: "—", Status: "—", "Requested By": "—", "Created Date": "—" }];

  const XLSX = await getXLSX();
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Hiring Requests");
  XLSX.writeFile(wb, `hiring_requests_${new Date().toISOString().slice(0, 10)}.xlsx`);
  return true;
}
