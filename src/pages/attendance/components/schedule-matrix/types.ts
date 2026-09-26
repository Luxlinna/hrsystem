export interface MatrixShiftCode {
  code: string;
  name: string;
  bgClass: string;
  textClass: string;
  startTime?: string;
  endTime?: string;
  isOff?: boolean;
}

export interface DayColumn {
  dayNumber: number;
  dayName: string; // 'Thu', 'Fri', 'Sat', 'Sun', etc.
  dateString: string; // '2026-10-01'
  isWeekend: boolean;
  isHoliday: boolean;
  holidayName?: string;
  holidayCode?: string; // 'PB', 'CDKF'
}

export interface CellScheduleData {
  shiftCode: string;
  startTime?: string;
  endTime?: string;
  isOff: boolean;
  isHoliday: boolean;
  holidayPrefix?: string; // e.g. 'PB_', 'CDKF_'
  status: "present" | "late" | "absent" | "no_clock_in" | "off" | "future" | "leave";
  clockIn?: string | null;
  clockOut?: string | null;
  tooltipText: string;
}

export interface EmployeeRosterRow {
  id: string;
  employeeCode: string;
  name: string;
  role: string;
  department: string;
  avatarUrl?: string | null;
  templateTitle?: string;
  dailySchedules: Record<string, CellScheduleData>; // keyed by dateString 'YYYY-MM-DD'
  hasSchedule: boolean;
}

export interface AvailableShiftItem {
  id: string;
  code: string;
  name: string;
  label: string;
  timeDisplay: string;
  startTime?: string;
  endTime?: string;
  color?: string;
  isOff?: boolean;
}
