import type { DayColumn, EmployeeRosterRow, CellScheduleData } from "./types";
import { formatBiometricId } from "@/lib/biometricUtils";
import { getAttendanceEmployeeName } from "../../utils/employeeNameUtils";

interface BuildRosterParams {
  rawEmployees: any[];
  templateAssignments: Record<string, any>;
  templatesById: Record<string, any>;
  dayColumns: DayColumn[];
  attendanceRecords: Record<string, any>;
  manualCellOverrides: Record<string, string>;
  shiftAssignmentsByEmpDate?: Record<string, string>;
}

export function buildRosterRows({
  rawEmployees,
  templateAssignments,
  templatesById,
  dayColumns,
  attendanceRecords,
  manualCellOverrides,
  shiftAssignmentsByEmpDate = {},
}: BuildRosterParams): EmployeeRosterRow[] {
  return rawEmployees.map((emp, empIdx) => {
    const templateId = templateAssignments[emp.id];
    const template = templateId ? templatesById[templateId] : null;
    const hasTemplate = Boolean(template && template.days);

    const hasAnyOverride = Object.keys(manualCellOverrides).some((k) =>
      k.startsWith(`${emp.id}_`)
    );
    const hasAnyDbAssign = Object.keys(shiftAssignmentsByEmpDate).some((k) =>
      k.startsWith(`${emp.id}_`)
    );

    const hasSchedule = Boolean(hasTemplate || hasAnyOverride || hasAnyDbAssign);

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
      // 3. Assigned schedule template for that day of the week
      else if (template?.days && template.days[dayKey]) {
        baseShift = template.days[dayKey];
      }
      // 4. If no template assigned, default to OFF (no arbitrary mock shift)
      else {
        baseShift = "OFF";
      }

      let displayCode = baseShift;
      if (col.isHoliday && col.holidayCode && baseShift !== "OFF") {
        displayCode = `${col.holidayCode}_${baseShift}`;
      } else if (col.isHoliday && col.holidayCode && baseShift === "OFF") {
        displayCode = `${col.holidayCode}_OFF`;
      }

      const att = attendanceRecords[overrideKey];
      let status: CellScheduleData["status"] = "future";
      let tooltipText = `Shift: ${baseShift}`;

      const todayDateStr = "2026-09-28";
      const isPast = col.dateString < todayDateStr;
      const isToday = col.dateString === todayDateStr;
      const isPastOrToday = isPast || isToday;

      if (baseShift === "OFF") {
        status = "off";
        tooltipText = col.isHoliday
          ? `${col.holidayName || "Public Holiday"} (Rest Day)`
          : "Rest Day";
      } else if (isPastOrToday) {
        if (att?.clock_in) {
          status = att.status === "late" ? "late" : "present";
          tooltipText = `Clock in: ${att.clock_in}${att.clock_out ? ` - ${att.clock_out}` : ""}`;
        } else {
          status = isPast ? "absent" : "no_clock_in";
          tooltipText = isPast ? "Absent (Missed Shift)" : "Not clocked in yet";
        }
      }

      const isLeave = /^(AL|SST|VST|LEAVE|ML|SL)/i.test(baseShift);
      const isOff = baseShift === "OFF";
      let scheduledHours: number | null = null;
      let clockedHours: number | null = null;
      let lostHours: number | null = null;

      if (!isOff && !isLeave) {
        scheduledHours = dayOfWeek === 6 ? 4 : 8;
        if (isPastOrToday) {
          if (att?.hours_worked != null && Number(att.hours_worked) > 0) {
            clockedHours = +Number(att.hours_worked).toFixed(2);
          } else if (att?.clock_in && att?.clock_out) {
            const [ih, im] = att.clock_in.split(":").map(Number);
            const [oh, om] = att.clock_out.split(":").map(Number);
            let span = (oh * 60 + om) - (ih * 60 + im);
            if (span < 0) span += 24 * 60;
            clockedHours = +(span / 60).toFixed(2);
          } else if (att?.clock_in) {
            clockedHours = 4.0;
          } else {
            clockedHours = 0;
          }

          if (isPast) {
            lostHours = clockedHours < scheduledHours ? +(scheduledHours - clockedHours).toFixed(2) : 0;
          } else if (isToday) {
            lostHours = att?.clock_out && clockedHours < scheduledHours ? +(scheduledHours - clockedHours).toFixed(2) : 0;
          }
        }
      }

      dailySchedules[col.dateString] = {
        shiftCode: displayCode,
        isOff,
        isHoliday: col.isHoliday,
        holidayPrefix: col.holidayCode,
        status,
        clockIn: att?.clock_in,
        clockOut: att?.clock_out,
        scheduledHours: isOff ? 0 : isLeave ? null : scheduledHours,
        clockedHours,
        lostHours,
        leaveCode: isLeave ? baseShift : null,
        tooltipText,
      };
    });

    const bioId = formatBiometricId(emp.biometric_user_id, emp.branches?.name);
    const displayId = bioId || emp.employee_code || "";

    return {
      id: emp.id,
      employeeCode: displayId || String(1000 + empIdx),
      displayId: displayId || undefined,
      name: getAttendanceEmployeeName(emp),
      role: emp.role || "Staff",
      department: emp.department || "Operations",
      avatarUrl: emp.avatar_url,
      templateTitle: template?.title || (hasSchedule ? "Custom Assignment" : "No Schedule Template"),
      dailySchedules,
      hasSchedule,
    };
  });
}
