import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../core/application/base.controller.js';
import { EmployeeService, employeeService } from './employee.service.js';

export class EmployeeController extends BaseController {
  constructor(private service: EmployeeService = employeeService) {
    super();
  }

  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 20;
      const search = req.query.search as string;

      const result = await this.service.listEmployees({ page, limit }, search);
      return this.paginated(res, result, 'Employees retrieved successfully');
    } catch (err) {
      next(err);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.getEmployeeById(req.params.id);
      return this.ok(res, result);
    } catch (err) {
      next(err);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.createEmployee(req.body);
      return this.created(res, result, 'Employee created successfully');
    } catch (err) {
      next(err);
    }
  };
}

export const employeeController = new EmployeeController();
