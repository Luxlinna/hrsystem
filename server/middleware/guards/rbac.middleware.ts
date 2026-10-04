import { Request, Response, NextFunction } from 'express';
import { UnauthorizedError, ForbiddenError } from '../../utils/http-error.js';

/**
 * Role-Based Access Control Guard
 * Ensures the authenticated user possesses at least one of the required roles
 */
export function requireRoles(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'));
    }

    if (roles.length > 0) {
      const userRole = req.user.role?.toUpperCase();
      const normalizedRoles = roles.map((r) => r.toUpperCase());

      // Super Admin bypasses all role restrictions
      if (userRole === 'SUPER_ADMIN') {
        return next();
      }

      if (!userRole || !normalizedRoles.includes(userRole)) {
        return next(new ForbiddenError('You do not have permission to access this resource'));
      }
    }

    next();
  };
}

/**
 * Fine-Grained Permission Guard
 * Checks if user's granted permissions include the requested action
 */
export function requirePermissions(...permissions: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'));
    }

    const userRole = req.user.role?.toUpperCase();
    if (userRole === 'SUPER_ADMIN') {
      return next();
    }

    const userPermissions = req.user.permissions || [];
    const hasAll = permissions.every((p) => userPermissions.includes(p));

    if (!hasAll) {
      return next(new ForbiddenError('Insufficient permissions to perform this action'));
    }

    next();
  };
}
