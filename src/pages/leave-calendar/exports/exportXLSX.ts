import type { LeaveRequest } from "../types";
import { LEAVE_TYPE_CONFIG, MONTHS } from "../constants";

const getXLSX = async () => {
  return await import("xlsx");
};

export async function exportCalendarXLSX(
  filteredLeaves: LeaveRequest[],
  month: number,
  year: number
): Promise<boolean> {
  if (filteredLeaves.length === 0) return false;

  const data = filteredLeaves.map((l) => ({
    "Employee Name": `${l.employees?.first_name || ""} ${l.employees?.last_name || ""}`.trim() || "Unknown",
    Department: l.employees?.department || "—",
    Role: l.employees?.role || "—",
    "Leave Type": LEAVE_TYPE_CONFIG[l.leave_type]?.label || l.leave_type,
    "Start Date": l.start_date,
    "End Date": l.end_date,
    Days: l.days,
    Status: (l.status || "").toUpperCase(),
    Reason: l.reason || "—",
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
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Leave Schedule");
  XLSX.writeFile(wb, `leave_schedule_${MONTHS[month].toLowerCase()}_${year}.xlsx`);
  return true;
}
