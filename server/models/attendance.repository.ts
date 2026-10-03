import { attendance_records, Prisma } from '@prisma/client';
import { BaseRepository, TransactionClient } from './base.repository.js';
import { prisma } from '../config/database.js';
import { EmployeeWithRelations } from '../types/attendance.types.js';

export class AttendanceRepository extends BaseRepository<
  attendance_records,
  Prisma.attendance_recordsCreateInput,
  Prisma.attendance_recordsUpdateInput,
  Prisma.attendance_recordsWhereInput,
  Prisma.attendance_recordsOrderByWithRelationInput,
  Prisma.attendance_recordsDelegate<any>
> {
  constructor() {
    super('attendance_records');
  }

  /**
   * Find today's attendance record for an employee by date
   */
  async findTodayRecord(
    employeeId: string,
    targetDate: Date | string,
    tx?: TransactionClient
  ): Promise<attendance_records | null> {
    const client = tx || prisma;
    const dateObj = typeof targetDate === 'string' ? new Date(`${targetDate}T00:00:00.000Z`) : targetDate;

    return client.attendance_records.findFirst({
      where: {
        employee_id: employeeId,
        date: dateObj,
        deleted_at: null,
      },
    });
  }

  /**
   * Upsert an attendance record by composite unique key (employee_id, date)
   */
  async upsertAttendance(
    employeeId: string,
    date: Date,
    data: Prisma.attendance_recordsUncheckedUpdateInput & Prisma.attendance_recordsUncheckedCreateInput,
    tx?: TransactionClient
  ): Promise<attendance_records> {
    const client = tx || prisma;

    return client.attendance_records.upsert({
      where: {
        employee_id_date: {
          employee_id: employeeId,
          date,
        },
      },
      update: {
        ...data,
        deleted_at: null,
      },
      create: {
        ...data,
        employee_id: employeeId,
        date,
      },
    });
  }

  /**
   * Fetch all active employees along with their branch and work location shift rules for in-memory caching
   */
  async findEmployeeDirectory(tx?: TransactionClient): Promise<EmployeeWithRelations[]> {
    const client = tx || prisma;

    const employeesList = await client.employees.findMany({
      where: {
        deleted_at: null,
      },
      include: {
        branches: {
          select: {
            name: true,
            work_start_time: true,
            work_end_time: true,
            late_grace_minutes: true,
            early_leave_grace_minutes: true,
            morning_check_in_start: true,
            morning_check_in_end: true,
            morning_check_out_start: true,
            morning_check_out_end: true,
            afternoon_check_in_start: true,
            afternoon_check_in_end: true,
            afternoon_check_out_start: true,
            afternoon_check_out_end: true,
          },
        },
        work_locations: {
          select: {
            name: true,
            work_start_time: true,
            break_start_time: true,
            break_end_time: true,
            work_end_time: true,
            late_grace_minutes: true,
            early_leave_grace_minutes: true,
            is_four_punch_enabled: true,
            morning_check_in_start: true,
            morning_check_in_end: true,
            morning_check_out_start: true,
            morning_check_out_end: true,
            afternoon_check_in_start: true,
            afternoon_check_in_end: true,
            afternoon_check_out_start: true,
            afternoon_check_out_end: true,
          },
        },
      },
    });

    return employeesList as unknown as EmployeeWithRelations[];
  }
}

export const attendanceRepository = new AttendanceRepository();
