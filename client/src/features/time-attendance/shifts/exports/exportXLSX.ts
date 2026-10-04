import type { Shift, ShiftAssignment } from "../types";
import { formatDate, calculateHours } from "../utils";

const getXLSX = async () => {
  return await import("xlsx");
};

export async function exportShiftsXLSX(
  filteredShifts: Shift[],
  assignments: ShiftAssignment[],
  currentDate: Date
): Promise<boolean> {
  if (filteredShifts.length === 0) return false;

  const data = filteredShifts.map((s) => {
    const shiftStaff = assignments
      .filter((a) => a.shift_id === s.id)
      .map((a) => `${a.employee?.first_name || ""} ${a.employee?.last_name || ""}`.trim())
      .join(", ");
    const hours = calculateHours(s.start_time, s.end_time);

    return {
      "Shift Date": s.shift_date,
      "Shift Name": s.name,
      "Start Time": s.start_time,
      "End Time": s.end_time,
      "Duration (Hrs)": hours,
      Department: s.department || "—",
      Branch: s.branches?.name || "—",
      Capacity: s.capacity,
      "Assigned Staff": s.assignmentCount || 0,
      "Staff Roster": shiftStaff || "Unassigned",
      Notes: s.notes || "—",
    };
  });

  const XLSX = await getXLSX();
  const ws = XLSX.utils.json_to_sheet(data);
  ws["!cols"] = [
    { wch: 14 },
    { wch: 20 },
    { wch: 12 },
    { wch: 12 },
    { wch: 14 },
    { wch: 18 },
    { wch: 18 },
    { wch: 10 },
    { wch: 14 },
    { wch: 32 },
    { wch: 25 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Shift Schedule");
  XLSX.writeFile(wb, `shift_schedule_${formatDate(currentDate)}.xlsx`);
  return true;
}
