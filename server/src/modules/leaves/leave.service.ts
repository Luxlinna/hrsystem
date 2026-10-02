import { LeaveRepository, leaveRepository } from './leave.repository.js';
import { CreateLeaveDTO } from './dtos/leave.dto.js';
import { AppError, NotFoundError } from '../../core/errors/app.error.js';
import { UnitOfWork, unitOfWork } from '../../core/infrastructure/database/unit-of-work.js';

export class LeaveService {
  constructor(
    private leaveRepo: LeaveRepository = leaveRepository,
    private uow: UnitOfWork = unitOfWork
  ) {}

  async applyLeave(employeeId: string, dto: CreateLeaveDTO) {
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);

    if (startDate > endDate) {
      throw new AppError('Start date cannot be after end date', 400);
    }

    const overlaps = await this.leaveRepo.findOverlapping(employeeId, startDate, endDate);
    if (overlaps.length > 0) {
      throw new AppError('You already have a pending or approved leave in this date range', 409);
    }

    return this.uow.execute(async (tx) => {
      return this.leaveRepo.create({
        employee_id: employeeId,
        leave_type_id: dto.leaveTypeId,
        start_date: startDate,
        end_date: endDate,
        days: dto.days,
        reason: dto.reason,
        status: 'PENDING',
      } as any, tx);
    });
  }

  async approveLeave(leaveId: string, approverId: string) {
    const leave = await this.leaveRepo.findById(leaveId);
    if (!leave || leave.deleted_at) {
      throw new NotFoundError('Leave request not found');
    }

    if (leave.status !== 'PENDING') {
      throw new AppError(`Cannot approve leave request with status: ${leave.status}`, 400);
    }

    return this.uow.execute(async (tx) => {
      return this.leaveRepo.update(leaveId, {
        status: 'APPROVED',
        approved_by_id: approverId,
        approved_at: new Date(),
      } as any, tx);
    });
  }
}

export const leaveService = new LeaveService();
