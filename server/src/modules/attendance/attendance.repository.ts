import { attendance_records, Prisma } from '@prisma/client';
import { BaseRepository, TransactionClient } from '../../core/infrastructure/database/base.repository.js';

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

  async findTodayRecord(employeeId: string, targetDate: Date, tx?: TransactionClient): Promise<attendance_records | null> {
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    return this.findOne({
      employee_id: employeeId,
      date: { gte: startOfDay, lte: endOfDay },
      deleted_at: null,
    } as any, tx);
  }
}

export const attendanceRepository = new AttendanceRepository();
