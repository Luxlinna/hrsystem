import { Request, Response, NextFunction } from 'express';
import { BaseController } from './base.controller.js';
import { LeaveService, leaveService } from '../services/leave.service.js';
import { cacheService } from '../services/cache.service.js';
import { UnauthorizedError } from '../utils/http-error.js';

export class LeaveController extends BaseController {
  constructor(private service: LeaveService = leaveService) {
    super();
  }

  apply = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const employeeId = req.user?.employeeId || req.user?.id;
      if (!employeeId) throw new UnauthorizedError();

      const result = await this.service.applyLeave(employeeId, req.body);
      cacheService.invalidatePrefix('leaves:');
      cacheService.invalidatePrefix('attendance:');
      cacheService.invalidatePrefix('http:');
      return this.created(res, result, 'Leave request submitted successfully');
    } catch (err) {
      next(err);
    }
  };

  approve = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const approverId = req.user?.id;
      if (!approverId) throw new UnauthorizedError();

      const result = await this.service.approveLeave(req.params.id, approverId);
      cacheService.invalidatePrefix('leaves:');
      cacheService.invalidatePrefix('attendance:');
      cacheService.invalidatePrefix('http:');
      return this.ok(res, result, 'Leave request approved successfully');
    } catch (err) {
      next(err);
    }
  };
}

export const leaveController = new LeaveController();
