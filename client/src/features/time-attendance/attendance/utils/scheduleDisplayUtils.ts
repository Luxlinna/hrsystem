import type { AttendanceRecord, Employee } from "../types";
import type { ManagedShift } from "../components/shifts-manager/types";

export interface ResolvedShiftSchedule {
  shiftCode: string;
  shiftTitle: string;
  windows: Array<{ id?: string; time_in: string; time_out: string; total_work_hours?: number }>;
  totalShiftHours: number;
}

export function resolveRecordSchedule(
  r: AttendanceRecord,
  emp: Employee | undefined,
  shifts: ManagedShift[] = []
): ResolvedShiftSchedule {
  const matchedShift = shifts.find((s) => {
    if ((r as any).shift_id && s.id === (r as any).shift_id) return true;
    if ((r as any).shift_code && s.code?.toLowerCase() === String((r as any).shift_code).toLowerCase()) return true;
    if ((emp as any)?.shift_id && s.id === (emp as any).shift_id) return true;
    return false;
  });

  if (matchedShift) {
    const windows = matchedShift.time_table && matchedShift.time_table.length > 0
      ? matchedShift.time_table
      : [{ id: "1", time_in: "08:00 AM", time_out: "05:00 PM", total_work_hours: matchedShift.total_work_hours || 8.0 }];

    const rawCode = matchedShift.code?.trim() || "";
    const shiftTitle = rawCode && rawCode !== "0817" && rawCode !== "0812"
      ? `${rawCode} - ${matchedShift.name}`
      : matchedShift.name;

    return {
      shiftCode: rawCode === "0817" ? "" : rawCode,
      shiftTitle,
      windows,
      totalShiftHours: matchedShift.total_work_hours || 8.0,
    };
  }

  // Company default schedule:
  // Saturday: 08:00 AM - 12:00 PM (4.00 Hours)
  // Monday - Friday: 08:00 AM - 05:00 PM (8.00 Hours, with 12:00 - 01:00 PM lunch break deducted)
  const recordDate = new Date(r.date + "T00:00:00");
  const isSaturday = recordDate.getDay() === 6;

  if (isSaturday) {
    return {
      shiftCode: "0812",
      shiftTitle: "08:00 AM - 12:00 PM",
      windows: [{ id: "1", time_in: "08:00 AM", time_out: "12:00 PM", total_work_hours: 4.0 }],
      totalShiftHours: 4.0,
    };
  }

  return {
    shiftCode: "",
    shiftTitle: "08:00 AM - 05:00 PM",
    windows: [
      { id: "1", time_in: "08:00 AM", time_out: "12:00 PM", total_work_hours: 4.0 },
      { id: "2", time_in: "01:00 PM", time_out: "05:00 PM", total_work_hours: 4.0 },
    ],
    totalShiftHours: 8.0,
  };
}
