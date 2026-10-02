import { EmployeeRepository, employeeRepository } from './employee.repository.js';
import { CreateEmployeeDTO } from './dtos/create-employee.dto.js';
import { ConflictError, NotFoundError } from '../../core/errors/app.error.js';
import { PageRequest } from '../../core/domain/pagination.js';
import { cacheService } from '../../core/infrastructure/cache/cache.service.js';

export class EmployeeService {
  constructor(private employeeRepo: EmployeeRepository = employeeRepository) {}

  async listEmployees(pageReq: PageRequest, search?: string) {
    const where: any = { deleted_at: null };
    if (search) {
      where.OR = [
        { first_name: { contains: search, mode: 'insensitive' } },
        { last_name: { contains: search, mode: 'insensitive' } },
        { employee_code: { contains: search, mode: 'insensitive' } },
      ];
    }
    return this.employeeRepo.findPaginated(pageReq, where, { created_at: 'desc' } as any);
  }

  async getEmployeeById(id: string) {
    const employee = await this.employeeRepo.findById(id);
    if (!employee || employee.deleted_at) {
      throw new NotFoundError('Employee not found');
    }
    return employee;
  }

  async createEmployee(dto: CreateEmployeeDTO) {
    const existing = await this.employeeRepo.findByCode(dto.employeeCode);
    if (existing) {
      throw new ConflictError(`Employee with code ${dto.employeeCode} already exists`);
    }

    if (dto.email) {
      const emailMatch = await this.employeeRepo.findByEmail(dto.email);
      if (emailMatch) {
        throw new ConflictError(`Employee with email ${dto.email} already exists`);
      }
    }

    const created = await this.employeeRepo.create({
      employee_code: dto.employeeCode,
      first_name: dto.firstName,
      last_name: dto.lastName,
      email: dto.email,
      phone: dto.phone,
      branch_id: dto.branchId,
      department_id: dto.departmentId,
    } as any);

    // Invalidate cached employee lists
    cacheService.invalidatePrefix('http:');

    return created;
  }
}

export const employeeService = new EmployeeService();
