import { AttendanceRepository, attendanceRepository } from './attendance.repository.js';
import { CheckInDTO } from './dtos/checkin.dto.js';
import { AppError } from '../../core/errors/app.error.js';
import { UnitOfWork, unitOfWork } from '../../core/infrastructure/database/unit-of-work.js';
import { EmployeeWithRelations, PunchCalculationParams } from './attendance.types.js';
import { attendance_records } from '@prisma/client';

export function toMinutes(timeVal: string | Date | null | undefined): number {
  if (!timeVal) return 0;
  if (typeof timeVal === 'string') {
    const clean = timeVal.includes('T') ? timeVal.split('T')[1].slice(0, 8) : timeVal.slice(0, 8);
    const [h, m] = clean.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  }
  if (timeVal instanceof Date) {
    return timeVal.getUTCHours() * 60 + timeVal.getUTCMinutes();
  }
  return 0;
}

export function formatTimeStr(timeVal: string | Date | null | undefined): string {
  if (!timeVal) return '00:00:00';
  if (typeof timeVal === 'string') {
    if (timeVal.includes('T')) return timeVal.split('T')[1].slice(0, 8);
    return timeVal.slice(0, 8);
  }
  if (timeVal instanceof Date) {
    const h = String(timeVal.getUTCHours()).padStart(2, '0');
    const m = String(timeVal.getUTCMinutes()).padStart(2, '0');
    const s = String(timeVal.getUTCSeconds()).padStart(2, '0');
    return `${h}:${m}:${s}`;
  }
  return '00:00:00';
}

export function timeStrToDate(timeStr: string): Date {
  return new Date(`1970-01-01T${timeStr.slice(0, 8)}Z`);
}

export class AttendanceService {
  constructor(
    private attendanceRepo: AttendanceRepository = attendanceRepository,
    private uow: UnitOfWork = unitOfWork
  ) {}

  /**
   * Evaluates a biometric or digital punch against employee shift rules (2-punch and 4-punch engine)
   */
  calculatePunch(
    existingRecord: attendance_records | null,
    params: PunchCalculationParams
  ): { updatePayload: Record<string, any>; ignored: boolean; description: string } {
    const { employee, timeStr, deviceSerial } = params;
    const employeeName = `${employee.first_name} ${employee.last_name}`;
    const site = employee.work_locations;
    const branch = employee.branches;

    const workStartTime = site?.work_start_time ? formatTimeStr(site.work_start_time) : (branch?.work_start_time ? formatTimeStr(branch.work_start_time) : '07:30:00');
    const breakStartTime = site?.break_start_time ? formatTimeStr(site.break_start_time) : '11:30:00';
    const breakEndTime = site?.break_end_time ? formatTimeStr(site.break_end_time) : '13:00:00';
    const workEndTime = site?.work_end_time ? formatTimeStr(site.work_end_time) : (branch?.work_end_time ? formatTimeStr(branch.work_end_time) : '17:00:00');
    const is4Punch = site?.is_four_punch_enabled ?? true;
    const lateGraceMin = site?.late_grace_minutes ?? branch?.late_grace_minutes ?? 15;
    const earlyGraceMin = site?.early_leave_grace_minutes ?? branch?.early_leave_grace_minutes ?? 15;

    // Scan Windows
    const morningCheckInStart = site?.morning_check_in_start ? formatTimeStr(site.morning_check_in_start) : (branch?.morning_check_in_start ? formatTimeStr(branch.morning_check_in_start) : '06:00:00');
    const morningCheckInEnd = site?.morning_check_in_end ? formatTimeStr(site.morning_check_in_end) : (branch?.morning_check_in_end ? formatTimeStr(branch.morning_check_in_end) : '09:00:00');
    const morningCheckOutStart = site?.morning_check_out_start ? formatTimeStr(site.morning_check_out_start) : (branch?.morning_check_out_start ? formatTimeStr(branch.morning_check_out_start) : '10:00:00');
    const morningCheckOutEnd = site?.morning_check_out_end ? formatTimeStr(site.morning_check_out_end) : (branch?.morning_check_out_end ? formatTimeStr(branch.morning_check_out_end) : '12:00:00');

    const afternoonCheckInStart = site?.afternoon_check_in_start ? formatTimeStr(site.afternoon_check_in_start) : (branch?.afternoon_check_in_start ? formatTimeStr(branch.afternoon_check_in_start) : '12:00:00');
    const afternoonCheckInEnd = site?.afternoon_check_in_end ? formatTimeStr(site.afternoon_check_in_end) : (branch?.afternoon_check_in_end ? formatTimeStr(branch.afternoon_check_in_end) : '14:00:00');
    const afternoonCheckOutStart = site?.afternoon_check_out_start ? formatTimeStr(site.afternoon_check_out_start) : (branch?.afternoon_check_out_start ? formatTimeStr(branch.afternoon_check_out_start) : '16:00:00');
    const afternoonCheckOutEnd = site?.afternoon_check_out_end ? formatTimeStr(site.afternoon_check_out_end) : (branch?.afternoon_check_out_end ? formatTimeStr(branch.afternoon_check_out_end) : '18:00:00');

    const punchMinutes = toMinutes(timeStr);
    const startMin = toMinutes(workStartTime);
    const breakStartMin = toMinutes(breakStartTime);
    const breakEndMin = toMinutes(breakEndTime);
    const endMin = toMinutes(workEndTime);

    const morningInStartMin = toMinutes(morningCheckInStart);
    const morningInEndMin = toMinutes(morningCheckInEnd);
    const morningOutStartMin = toMinutes(morningCheckOutStart);
    const morningOutEndMin = toMinutes(morningCheckOutEnd);

    const afternoonInStartMin = toMinutes(afternoonCheckInStart);
    const afternoonInEndMin = toMinutes(afternoonCheckInEnd);
    const afternoonOutStartMin = toMinutes(afternoonCheckOutStart);
    const afternoonOutEndMin = toMinutes(afternoonCheckOutEnd);

    let updatePayload: Record<string, any> = {};
    let description = '';

    if (!is4Punch) {
      // Standard 2-Punch Mode
      if (!existingRecord || !existingRecord.clock_in) {
        if (punchMinutes < morningInStartMin || punchMinutes > morningInEndMin) {
          return {
            updatePayload: {},
            ignored: true,
            description: `[IGNORED SCAN] ${employeeName} at ${timeStr} outside allowed check-in window (${morningCheckInStart.slice(0, 5)} - ${morningCheckInEnd.slice(0, 5)}).`,
          };
        } else {
          const rawLateMinutes = Math.max(0, punchMinutes - startMin);
          const isLate = rawLateMinutes > lateGraceMin;
          const lateMinutes = isLate ? rawLateMinutes - lateGraceMin : 0;
          updatePayload = {
            clock_in: timeStrToDate(timeStr),
            status: isLate ? 'late' : 'ontime',
            late_minutes: lateMinutes,
            notes: `ZKTeco Cloud (${deviceSerial || 'ADMS'})`,
          };
          description = `[CLOCK-IN] ${employeeName} at ${timeStr} (${isLate ? 'late' : 'ontime'})`;
        }
      } else {
        if (punchMinutes < afternoonOutStartMin || punchMinutes > afternoonOutEndMin) {
          return {
            updatePayload: {},
            ignored: true,
            description: `[IGNORED SCAN] ${employeeName} at ${timeStr} outside allowed check-out window (${afternoonCheckOutStart.slice(0, 5)} - ${afternoonCheckOutEnd.slice(0, 5)}).`,
          };
        } else {
          const ciMin = toMinutes(existingRecord.clock_in);
          const breakDuration = Math.max(0, breakEndMin - breakStartMin);
          const hoursWorked = Math.min(8.0, Math.max(0, parseFloat(((punchMinutes - ciMin - breakDuration) / 60).toFixed(2))));
          const rawEarlyLeaveMinutes = Math.max(0, endMin - punchMinutes);
          const isEarly = rawEarlyLeaveMinutes > earlyGraceMin;
          const earlyLeaveMinutes = isEarly ? rawEarlyLeaveMinutes - earlyGraceMin : 0;

          updatePayload = {
            clock_out: timeStrToDate(timeStr),
            hours_worked: hoursWorked,
            early_leave_minutes: earlyLeaveMinutes,
          };
          description = `[CLOCK-OUT] ${employeeName} at ${timeStr} (${hoursWorked}h)`;
        }
      }
    } else {
      // 4-Punch Multi-Session Mode
      const isMorningInWindow = punchMinutes >= morningInStartMin && punchMinutes <= morningInEndMin;
      const isMorningOutWindow = punchMinutes >= morningOutStartMin && punchMinutes <= morningOutEndMin;
      const isAfternoonInWindow = punchMinutes >= afternoonInStartMin && punchMinutes <= afternoonInEndMin;
      const isAfternoonOutWindow = punchMinutes >= afternoonOutStartMin && punchMinutes <= afternoonOutEndMin;

      const preferMorningOut = punchMinutes === morningOutEndMin && existingRecord?.clock_in && !existingRecord?.break_out;

      if (isMorningInWindow && (!existingRecord || !existingRecord.clock_in)) {
        // Punch 1: Morning Check-In
        const rawLateMinutes = Math.max(0, punchMinutes - startMin);
        const isLate = rawLateMinutes > lateGraceMin;
        const lateMinutes = isLate ? rawLateMinutes - lateGraceMin : 0;
        updatePayload = {
          clock_in: timeStrToDate(timeStr),
          status: isLate ? 'late' : 'ontime',
          late_minutes: lateMinutes,
          notes: `ZKTeco 4-Punch (${site?.name || branch?.name || 'Branch'})`,
        };
        description = `[PUNCH 1: MORNING IN] ${employeeName} at ${timeStr} (Status: ${isLate ? 'late' : 'ontime'})`;
      } else if (isMorningOutWindow && (preferMorningOut || (!existingRecord?.break_out && punchMinutes < afternoonInStartMin))) {
        // Punch 2: Morning Check-Out / Lunch Out
        let morningEarlyLeave = 0;
        if (punchMinutes < breakStartMin) {
          const rawMorningEarlyLeave = Math.max(0, breakStartMin - punchMinutes);
          const isEarly = rawMorningEarlyLeave > earlyGraceMin;
          morningEarlyLeave = isEarly ? rawMorningEarlyLeave - earlyGraceMin : 0;
        }
        let morningHours = 0;
        if (existingRecord?.clock_in) {
          const p1Min = toMinutes(existingRecord.clock_in);
          morningHours = Math.min(4.0, Math.max(0, parseFloat(((punchMinutes - p1Min) / 60).toFixed(2))));
        }
        updatePayload = {
          break_out: timeStrToDate(timeStr),
          early_leave_minutes: morningEarlyLeave,
          hours_worked: morningHours,
        };
        description = `[PUNCH 2: LUNCH OUT] ${employeeName} at ${timeStr} (Early: ${morningEarlyLeave}m, Morning: ${morningHours}h)`;
      } else if (isAfternoonInWindow && !existingRecord?.break_in) {
        // Punch 3: Lunch In / Afternoon Check-In
        let afternoonLateMinutes = 0;
        let isAfternoonLate = false;
        if (punchMinutes > breakEndMin) {
          const rawAfternoonLate = Math.max(0, punchMinutes - breakEndMin);
          isAfternoonLate = rawAfternoonLate > lateGraceMin;
          afternoonLateMinutes = isAfternoonLate ? rawAfternoonLate - lateGraceMin : 0;
        }
        const existingLate = existingRecord?.late_minutes || 0;
        const existingStatus = existingRecord?.status || 'ontime';
        const finalStatus = isAfternoonLate || existingStatus === 'late' ? 'late' : 'ontime';

        updatePayload = {
          break_in: timeStrToDate(timeStr),
          late_minutes: existingLate + afternoonLateMinutes,
          status: finalStatus,
          notes: existingRecord?.notes || `ZKTeco 4-Punch (${site?.name || branch?.name || 'Branch'})`,
        };
        description = `[PUNCH 3: AFTERNOON IN] ${employeeName} at ${timeStr} (Status: ${isAfternoonLate ? 'late' : 'ontime'})`;
      } else if (isAfternoonOutWindow) {
        // Punch 4: Final Shift End
        let afternoonEarlyLeave = 0;
        if (punchMinutes < endMin) {
          const rawEarlyLeave = Math.max(0, endMin - punchMinutes);
          const isEarly = rawEarlyLeave > earlyGraceMin;
          afternoonEarlyLeave = isEarly ? rawEarlyLeave - earlyGraceMin : 0;
        }

        let morningHours = 0;
        if (existingRecord?.clock_in && existingRecord?.break_out) {
          const p1Min = toMinutes(existingRecord.clock_in);
          const p2Min = toMinutes(existingRecord.break_out);
          if (p2Min > p1Min) {
            morningHours = Math.min(4.0, Math.max(0, parseFloat(((p2Min - p1Min) / 60).toFixed(2))));
          }
        }

        let afternoonHours = 0;
        if (existingRecord?.break_in) {
          const p3Min = toMinutes(existingRecord.break_in);
          if (punchMinutes > p3Min) {
            afternoonHours = Math.min(4.0, Math.max(0, parseFloat(((punchMinutes - p3Min) / 60).toFixed(2))));
          }
        }

        const totalHours = parseFloat((morningHours + afternoonHours).toFixed(2));

        updatePayload = {
          clock_out: timeStrToDate(timeStr),
          hours_worked: totalHours,
          early_leave_minutes: punchMinutes >= endMin ? 0 : afternoonEarlyLeave,
        };
        description = `[PUNCH 4: FINAL OUT] ${employeeName} at ${timeStr} (Morning: ${morningHours}h, Afternoon: ${afternoonHours}h, Total: ${totalHours}h)`;
      } else {
        return {
          updatePayload: {},
          ignored: true,
          description: `[IGNORED SCAN] ${employeeName} at ${timeStr} outside allowed punch windows.`,
        };
      }
    }

    return { updatePayload, ignored: false, description };
  }

  /**
   * Manual Check-In from Web / Mobile API
   */
  async checkIn(employeeId: string, dto: CheckInDTO) {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const existing = await this.attendanceRepo.findTodayRecord(employeeId, dateStr);

    if (existing?.clock_in) {
      throw new AppError('You have already checked in today', 400);
    }

    return this.uow.execute(async (tx) => {
      const dateObj = new Date(`${dateStr}T00:00:00.000Z`);
      return this.attendanceRepo.upsertAttendance(
        employeeId,
        dateObj,
        {
          clock_in: now,
          status: 'ontime',
          clock_in_latitude: dto.latitude,
          clock_in_longitude: dto.longitude,
          notes: dto.notes,
        } as any,
        tx
      );
    });
  }

  /**
   * Manual Check-Out from Web / Mobile API
   */
  async checkOut(employeeId: string, dto: CheckInDTO) {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const existing = await this.attendanceRepo.findTodayRecord(employeeId, dateStr);

    if (!existing || !existing.clock_in) {
      throw new AppError('Cannot check out without checking in first', 400);
    }

    if (existing.clock_out) {
      throw new AppError('You have already checked out today', 400);
    }

    return this.uow.execute(async (tx) => {
      const dateObj = new Date(`${dateStr}T00:00:00.000Z`);
      const ciMin = toMinutes(existing.clock_in);
      const coMin = toMinutes(now);
      const hoursWorked = Math.min(8.0, Math.max(0, parseFloat(((coMin - ciMin) / 60).toFixed(2))));

      return this.attendanceRepo.upsertAttendance(
        employeeId,
        dateObj,
        {
          clock_out: now,
          clock_out_latitude: dto.latitude,
          clock_out_longitude: dto.longitude,
          hours_worked: hoursWorked,
          notes: dto.notes ? `${existing.notes || ''}; Out: ${dto.notes}` : existing.notes,
        } as any,
        tx
      );
    });
  }
}

export const attendanceService = new AttendanceService();
