import { z } from 'zod';

export const CreateEmployeeSchema = z.object({
  employeeCode: z.string().min(1, 'Employee code is required'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address').optional(),
  phone: z.string().optional(),
  role: z.enum(['SUPER_ADMIN', 'BRANCH_ADMIN', 'HR_MANAGER', 'LINE_MANAGER', 'STAFF']).default('STAFF'),
  branchId: z.string().uuid().optional(),
  departmentId: z.string().uuid().optional(),
});

export type CreateEmployeeDTO = z.infer<typeof CreateEmployeeSchema>;

export const EmployeeQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1).optional(),
  limit: z.coerce.number().int().positive().max(100).default(20).optional(),
  search: z.string().optional(),
  branchId: z.string().uuid().optional(),
  departmentId: z.string().uuid().optional(),
});

export type EmployeeQueryDTO = z.infer<typeof EmployeeQuerySchema>;
