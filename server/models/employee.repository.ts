import { employees, Prisma } from '@prisma/client';
import { BaseRepository, TransactionClient } from './base.repository.js';

export class EmployeeRepository extends BaseRepository<
  employees,
  Prisma.employeesCreateInput,
  Prisma.employeesUpdateInput,
  Prisma.employeesWhereInput,
  Prisma.employeesOrderByWithRelationInput,
  Prisma.employeesDelegate<any>
> {
  constructor() {
    super('employees');
  }

  async findByCode(code: string, tx?: TransactionClient): Promise<employees | null> {
    return this.findOne({ employee_code: code, deleted_at: null } as any, tx);
  }

  async findByEmail(email: string, tx?: TransactionClient): Promise<employees | null> {
    return this.findOne({ email, deleted_at: null } as any, tx);
  }
}

export const employeeRepository = new EmployeeRepository();
