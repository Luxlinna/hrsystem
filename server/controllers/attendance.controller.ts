import { Request, Response, NextFunction } from 'express';
import { BaseController } from './base.controller.js';
import { AttendanceService, attendanceService } from '../services/attendance.service.js';
import { UnauthorizedError } from '../utils/http-error.js';

export class AttendanceController extends BaseController {
  constructor(private service: AttendanceService = attendanceService) {
    super();
  }

  checkIn = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const employeeId = req.user?.employeeId || req.user?.id;
      if (!employeeId) throw new UnauthorizedError();

      const result = await this.service.checkIn(employeeId, req.body);
      return this.ok(res, result, 'Checked in successfully');
    } catch (err) {
      next(err);
    }
  };

  checkOut = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const employeeId = req.user?.employeeId || req.user?.id;
      if (!employeeId) throw new UnauthorizedError();

      const result = await this.service.checkOut(employeeId, req.body);
      return this.ok(res, result, 'Checked out successfully');
    } catch (err) {
      next(err);
    }
  };
}

export const attendanceController = new AttendanceController();
