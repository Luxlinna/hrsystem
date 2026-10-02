import { AttendanceRepository, attendanceRepository } from './attendance.repository.js';
import { CheckInDTO } from './dtos/checkin.dto.js';
import { AppError } from '../../core/errors/app.error.js';
import { UnitOfWork, unitOfWork } from '../../core/infrastructure/database/unit-of-work.js';

export class AttendanceService {
  constructor(
    private attendanceRepo: AttendanceRepository = attendanceRepository,
    private uow: UnitOfWork = unitOfWork
  ) {}

  async checkIn(employeeId: string, dto: CheckInDTO) {
    const now = new Date();
    const existing = await this.attendanceRepo.findTodayRecord(employeeId, now);

    if (existing?.clock_in) {
      throw new AppError('You have already checked in today', 400);
    }

    return this.uow.execute(async (tx) => {
      const location = dto.latitude && dto.longitude ? `${dto.latitude},${dto.longitude}` : undefined;

      if (existing) {
        return this.attendanceRepo.update(existing.id, {
          clock_in: now,
          status: 'PRESENT',
          check_in_location: location,
          notes: dto.notes,
        } as any, tx);
      }

      return this.attendanceRepo.create({
        employee_id: employeeId,
        date: now,
        clock_in: now,
        status: 'PRESENT',
        check_in_location: location,
        notes: dto.notes,
      } as any, tx);
    });
  }

  async checkOut(employeeId: string, dto: CheckInDTO) {
    const now = new Date();
    const existing = await this.attendanceRepo.findTodayRecord(employeeId, now);

    if (!existing || !existing.clock_in) {
      throw new AppError('Cannot check out without checking in first', 400);
    }

    if (existing.clock_out) {
      throw new AppError('You have already checked out today', 400);
    }

    return this.uow.execute(async (tx) => {
      const location = dto.latitude && dto.longitude ? `${dto.latitude},${dto.longitude}` : undefined;

      return this.attendanceRepo.update(existing.id, {
        clock_out: now,
        check_out_location: location,
        notes: dto.notes ? `${existing.notes || ''}; Out: ${dto.notes}` : existing.notes,
      } as any, tx);
    });
  }
}

export const attendanceService = new AttendanceService();
