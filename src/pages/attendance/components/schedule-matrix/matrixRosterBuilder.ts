import type { DayColumn, EmployeeRosterRow, CellScheduleData } from "./types";

interface BuildRosterParams {
  rawEmployees: any[];
  templateAssignments: Record<string, any>;
  templatesById: Record<string, any>;
  dayColumns: DayColumn[];
  attendanceRecords: Record<string, any>;
  manualCellOverrides: Record<string, string>;
  shiftAssignmentsByEmpDate?: Record<string, string>;
  defaultShiftCode?: string;
}

export function buildRosterRows({
  rawEmployees,
  templateAssignments,
  templatesById,
  dayColumns,
  attendanceRecords,
  manualCellOverrides,
  shiftAssignmentsByEmpDate = {},
  defaultShiftCode = "DAY",
}: BuildRosterParams): EmployeeRosterRow[] {
  return rawEmployees.map((emp, empIdx) => {
    const templateId = templateAssignments[emp.id];
    const template = templateId ? templatesById[templateId] : null;

    const dailySchedules: Record<string, CellScheduleData> = {};

    dayColumns.forEach((col) => {
      const overrideKey = `${emp.id}_${col.dateString}`;
      const manualOverride = manualCellOverrides[overrideKey];
      const dbAssignedShift = shiftAssignmentsByEmpDate[overrideKey];

      const dateObj = new Date(col.dateString);
      const dayOfWeek = dateObj.getDay();
      const dayKeyMap = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
      const dayKey = dayKeyMap[dayOfWeek];

      let baseShift = "OFF";

      // 1. Manual user edits in this session take top priority
      if (manualOverride) {
        baseShift = manualOverride;
      }
      // 2. Direct shift assignment from DB
      else if (dbAssignedShift) {
        baseShift = dbAssignedShift;
      }
      // 3. Assigned schedule template
      else if (template && template.days && template.days[dayKey]) {
        baseShift = template.days[dayKey];
      }
      // 4. Default: Sunday is OFF, weekdays follow default system shift
      else {
        baseShift = dayOfWeek === 0 ? "OFF" : defaultShiftCode;
      }

      let displayCode = baseShift;
      if (col.isHoliday && col.holidayCode) {
        displayCode = `${col.holidayCode}_${baseShift}`;
      }

      const att = attendanceRecords[overrideKey];
      let status: CellScheduleData["status"] = "future";
      let tooltipText = `Shift: ${baseShift}`;

      const isPastOrToday = new Date(col.dateString) <= new Date(2026, 9, 26);

      if (baseShift === "OFF") {
        status = "off";
        tooltipText = col.isHoliday ? `${col.holidayName || "Public Holiday"} (Rest Day)` : "Rest Day";
      } else if (isPastOrToday) {
        if (att?.clock_in) {
          status = att.status === "late" ? "late" : "present";
          tooltipText = `Clock in: ${att.clock_in}${att.clock_out ? ` - ${att.clock_out}` : ""}`;
        } else {
          status = "no_clock_in";
          tooltipText = "No clock in";
        }
      }

      dailySchedules[col.dateString] = {
        shiftCode: displayCode,
        isOff: baseShift === "OFF",
        isHoliday: col.isHoliday,
        holidayPrefix: col.holidayCode,
        status,
        clockIn: att?.clock_in,
        clockOut: att?.clock_out,
        tooltipText,
      };
    });

    return {
      id: emp.id,
      employeeCode: emp.employee_code || String(1000 + empIdx),
      name: `${emp.first_name || ""} ${emp.last_name || ""}`.trim() || "Employee",
      role: emp.role || "Staff",
      department: emp.department || "Operations",
      avatarUrl: emp.avatar_url,
      templateTitle: template?.title || "Standard Shift Roster",
      dailySchedules,
      hasSchedule: true,
    };
  });
}
