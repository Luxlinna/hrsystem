import { password_reset_requests, employees, Prisma } from '@prisma/client';
import { BaseRepository, TransactionClient } from '../../core/infrastructure/database/base.repository.js';
import { prisma } from '../../core/infrastructure/database/prisma.client.js';

export class AuthRepository extends BaseRepository<
  password_reset_requests,
  Prisma.password_reset_requestsCreateInput,
  Prisma.password_reset_requestsUpdateInput,
  Prisma.password_reset_requestsWhereInput,
  Prisma.password_reset_requestsOrderByWithRelationInput,
  Prisma.password_reset_requestsDelegate<any>
> {
  constructor() {
    super('password_reset_requests');
  }

  /**
   * Find employee by email or user ID
   */
  async findEmployeeByEmail(email: string, tx?: TransactionClient): Promise<employees | null> {
    const client = tx || prisma;
    return client.employees.findFirst({
      where: {
        email: { equals: email, mode: 'insensitive' },
        deleted_at: null,
      },
    });
  }

  /**
   * Find active employee by ID
   */
  async findEmployeeById(id: string, tx?: TransactionClient): Promise<employees | null> {
    const client = tx || prisma;
    return client.employees.findFirst({
      where: { id, deleted_at: null },
      include: {
        branches: { select: { name: true } },
        work_locations: { select: { name: true } },
      },
    });
  }

  /**
   * Create a password reset request record
   */
  async createPasswordResetRequest(
    data: {
      email: string;
      user_id?: string;
      admin_note?: string;
    },
    tx?: TransactionClient
  ): Promise<password_reset_requests> {
    const client = tx || prisma;
    return client.password_reset_requests.create({
      data: {
        email: data.email.toLowerCase().trim(),
        user_id: data.user_id,
        status: 'pending',
        admin_note: data.admin_note,
      },
    });
  }

  /**
   * Find pending reset request by ID or email
   */
  async findPendingResetRequest(id: string, tx?: TransactionClient): Promise<password_reset_requests | null> {
    const client = tx || prisma;
    return client.password_reset_requests.findFirst({
      where: {
        id,
        status: 'pending',
        deleted_at: null,
      },
    });
  }

  /**
   * Update status of password reset request
   */
  async updateResetRequestStatus(
    id: string,
    status: 'approved' | 'rejected' | 'completed',
    adminNote?: string,
    tx?: TransactionClient
  ): Promise<password_reset_requests> {
    const client = tx || prisma;
    return client.password_reset_requests.update({
      where: { id },
      data: {
        status,
        acted_at: new Date(),
        admin_note: adminNote,
      },
    });
  }
}

export const authRepository = new AuthRepository();
