import { toYMD } from "@/lib/date";
import type { AttendanceRecord, Employee } from "../types";
import type { DateBounds } from "./attendanceDateRangeUtils";

export function expandRecordsToCalendarDays(
  matchedRecords: AttendanceRecord[],
  matchedEmployees: Employee[],
  dateBounds: DateBounds | null,
  todayYMD: string
): AttendanceRecord[] {
  if (!dateBounds || !dateBounds.start || !dateBounds.end) {
    return matchedRecords;
  }

  const dates: string[] = [];
  const cur = new Date(`${dateBounds.start}T00:00:00`);
  const end = new Date(`${dateBounds.end}T00:00:00`);

  const diffDays = Math.round((end.getTime() - cur.getTime()) / (1000 * 3600 * 24)) + 1;
  if (diffDays <= 0 || diffDays > 62) {
    return matchedRecords;
  }

  while (cur <= end) {
    dates.push(toYMD(cur));
    cur.setDate(cur.getDate() + 1);
  }

  const existingMap = new Map<string, AttendanceRecord>();
  matchedRecords.forEach((r) => {
    existingMap.set(`${r.employee_id}_${r.date}`, r);
  });

  const result: AttendanceRecord[] = [];
  let tempIdCounter = -1;

  matchedEmployees.forEach((emp) => {
    dates.forEach((dateStr) => {
      const key = `${emp.id}_${dateStr}`;
      const existing = existingMap.get(key);
      if (existing) {
        result.push(existing);
      } else {
        const d = new Date(`${dateStr}T00:00:00`);
        const dayOfWeek = d.getDay();
        const isOffDay = dayOfWeek === 0 || dayOfWeek === 6;

        let status: string = isOffDay ? "Off" : "absent";
        if (dateStr > todayYMD && !isOffDay) {
          status = "scheduled";
        }

        result.push({
          id: tempIdCounter--,
          employee_id: emp.id,
          date: dateStr,
          clock_in: null,
          clock_out: null,
          break_in: null,
          break_out: null,
          status,
          late_minutes: 0,
          early_leave_minutes: 0,
          hours_worked: 0,
          overtime_minutes: 0,
          work_location_id: emp.default_work_location_id || null,
          employees: emp,
          work_location: (emp as any).work_locations || null,
        } as unknown as AttendanceRecord);
      }
    });
  });

  return result.sort((a, b) => {
    if (a.date !== b.date) return b.date.localeCompare(a.date);
    const nameA = `${a.employees?.first_name || ""} ${a.employees?.last_name || ""}`;
    const nameB = `${b.employees?.first_name || ""} ${b.employees?.last_name || ""}`;
    return nameA.localeCompare(nameB);
  });
}
