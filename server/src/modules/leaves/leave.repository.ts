import { leave_requests, Prisma } from '@prisma/client';
import { BaseRepository, TransactionClient } from '../../core/infrastructure/database/base.repository.js';
import { prisma } from '../../core/infrastructure/database/prisma.client.js';

export class LeaveRepository extends BaseRepository<
  leave_requests,
  Prisma.leave_requestsCreateInput,
  Prisma.leave_requestsUpdateInput,
  Prisma.leave_requestsWhereInput,
  Prisma.leave_requestsOrderByWithRelationInput,
  Prisma.leave_requestsDelegate<any>
> {
  constructor() {
    super('leave_requests');
  }

  async findOverlapping(
    employeeId: string,
    startDate: Date,
    endDate: Date,
    tx?: TransactionClient
  ): Promise<leave_requests[]> {
    return this.getDelegate(tx).findMany({
      where: {
        employee_id: employeeId,
        status: { in: ['PENDING', 'APPROVED'] },
        deleted_at: null,
        OR: [
          { start_date: { lte: endDate }, end_date: { gte: startDate } },
        ],
      } as any,
    });
  }

  async getRemainingDays(
    employeeId: string,
    leaveTypeId: string,
    year: number,
    tx?: TransactionClient
  ): Promise<number> {
    const client = tx || prisma;
    const balance = await (client as any).leave_balances?.findFirst({
      where: {
        employee_id: employeeId,
        leave_type_id: leaveTypeId,
        year,
      },
    });
    return balance ? Number(balance.remaining_days || 0) : 0;
  }
}

export const leaveRepository = new LeaveRepository();
