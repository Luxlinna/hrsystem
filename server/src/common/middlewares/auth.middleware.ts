import { Request, Response, NextFunction } from 'express';
import { UnauthorizedError } from '../../core/errors/app.error.js';

export interface AuthenticatedUser {
  id: string;
  email?: string;
  role?: string;
  branchId?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new UnauthorizedError('No authentication token provided'));
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return next(new UnauthorizedError('Invalid authentication token'));
  }

  // Hook into your JWT / Supabase Auth validator here
  // For demo/plumbing purposes, attaching mock context or decoded claims:
  req.user = {
    id: req.headers['x-user-id'] as string || 'system-user',
    role: req.headers['x-user-role'] as string || 'STAFF',
    branchId: req.headers['x-branch-id'] as string,
  };

  next();
}
