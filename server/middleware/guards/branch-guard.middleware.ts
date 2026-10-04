import { Request, Response, NextFunction } from 'express';
import { ForbiddenError } from '../../utils/http-error.js';

/**
 * Branch Data Isolation Guard
 * Prevents unauthorized cross-branch data access for non-admin accounts
 */
export function enforceBranchScope(req: Request, _res: Response, next: NextFunction) {
  if (!req.user) {
    return next();
  }

  const role = req.user.role?.toUpperCase();
  const userBranchId = req.user.branchId;

  // SUPER_ADMIN and ADMIN can access across all branches
  if (role === 'SUPER_ADMIN' || role === 'ADMIN' || !userBranchId) {
    return next();
  }

  // If a branchId query or body param is explicitly requested, ensure it matches user's assigned branch
  const requestedBranchId = req.query.branchId || req.body?.branch_id || req.body?.branchId;
  if (requestedBranchId && requestedBranchId !== userBranchId) {
    return next(new ForbiddenError('Access to data from another branch is restricted'));
  }

  // Automatically enforce user's branch for queries if not set
  if (!req.query.branchId) {
    req.query.branchId = userBranchId;
  }

  next();
}
