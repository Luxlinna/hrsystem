import { Request, Response, NextFunction } from 'express';
import { BaseController } from './base.controller.js';
import { referenceDataService } from '../services/reference-data.service.js';

export class ReferenceController extends BaseController {
  getBranches = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const branches = await referenceDataService.getBranches();
      return this.ok(res, branches, 'Branches retrieved');
    } catch (err) {
      next(err);
    }
  };

  getWorkLocations = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const branchId = req.query.branchId as string | undefined;
      const locations = await referenceDataService.getWorkLocations(branchId);
      return this.ok(res, locations, 'Work locations retrieved');
    } catch (err) {
      next(err);
    }
  };

  getDepartments = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const branchId = req.query.branchId as string | undefined;
      const departments = await referenceDataService.getDepartments(branchId);
      return this.ok(res, departments, 'Departments retrieved');
    } catch (err) {
      next(err);
    }
  };

  getDivisions = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const branchId = req.query.branchId as string | undefined;
      const divisions = await referenceDataService.getDivisions(branchId);
      return this.ok(res, divisions, 'Divisions retrieved');
    } catch (err) {
      next(err);
    }
  };

  getLeaveTypes = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const leaveTypes = await referenceDataService.getLeaveTypes();
      return this.ok(res, leaveTypes, 'Leave types retrieved');
    } catch (err) {
      next(err);
    }
  };

  getHolidays = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const year = req.query.year ? parseInt(req.query.year as string, 10) : new Date().getFullYear();
      const branchId = req.query.branchId as string | undefined;
      const holidays = await referenceDataService.getHolidays(year, branchId);
      return this.ok(res, holidays, 'Holidays retrieved');
    } catch (err) {
      next(err);
    }
  };

  getShifts = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const branchId = req.query.branchId as string | undefined;
      const shifts = await referenceDataService.getShifts(branchId);
      return this.ok(res, shifts, 'Shifts retrieved');
    } catch (err) {
      next(err);
    }
  };
}

export const referenceController = new ReferenceController();
