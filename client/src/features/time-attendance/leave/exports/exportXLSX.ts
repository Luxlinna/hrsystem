import type { LeaveRequest } from "../types";
import { LEAVE_TYPE_CONFIG } from "../constants";
import { formatDate } from "../dateUtils";

const getXLSX = async () => {
  return await import("xlsx");
};

export async function exportLeaveXLSX(filteredRequests: LeaveRequest[]): Promise<boolean> {
  if (filteredRequests.length === 0) {
    return false;
  }

  const data = filteredRequests.map((r) => ({
    "Employee Name": `${r.employees?.first_name || ""} ${r.employees?.last_name || ""}`.trim() || "Unknown",
    Department: r.employees?.department || "—",
    Role: r.employees?.role || "—",
    "Leave Type": LEAVE_TYPE_CONFIG[r.leave_type]?.label || r.leave_type,
    "Start Date": r.start_date,
    "End Date": r.end_date,
    Days: r.days,
    Status: (r.status || "").toUpperCase(),
    Reason: r.reason || "—",
    "Submitted Date": formatDate(r.created_at?.slice(0, 10)),
  }));

  const XLSX = await getXLSX();
  const ws = XLSX.utils.json_to_sheet(data);
  ws["!cols"] = [
    { wch: 22 },
    { wch: 18 },
    { wch: 18 },
    { wch: 16 },
    { wch: 14 },
    { wch: 14 },
    { wch: 8 },
    { wch: 14 },
    { wch: 30 },
    { wch: 16 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Leave Requests");
  XLSX.writeFile(wb, `Leave_Requests_${new Date().toISOString().slice(0, 10)}.xlsx`);
  return true;
}
