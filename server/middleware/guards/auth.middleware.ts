import { Request, Response, NextFunction } from 'express';
import { UnauthorizedError } from '../../utils/http-error.js';
import { supabaseAdminClient, supabaseAnonClient } from '../../config/supabase.js';
import { prisma } from '../../config/database.js';

export interface AuthenticatedUser {
  id: string;
  email?: string;
  role?: string;
  permissions?: string[];
  branchId?: string;
  employeeId?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(new UnauthorizedError('No authentication token provided'));
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return next(new UnauthorizedError('Invalid authentication token format'));
    }

    const authClient = supabaseAdminClient || supabaseAnonClient;
    if (!authClient) {
      return next(new UnauthorizedError('Authentication service not configured on server'));
    }

    // Verify token with Supabase Auth
    const { data: userData, error: authError } = await authClient.auth.getUser(token);
    if (authError || !userData?.user) {
      return next(new UnauthorizedError(authError?.message || 'Invalid or expired session token'));
    }

    const authUser = userData.user;
    const userEmail = typeof authUser.email === 'string' ? authUser.email : '';
    const userId = typeof authUser.id === 'string' ? authUser.id : '';

    // Enrich with employee profile and role
    const employee = await prisma.employees.findFirst({
      where: {
        OR: [
          ...(userEmail ? [{ email: { equals: userEmail, mode: 'insensitive' as const } }] : []),
          ...(userId ? [{ id: { equals: userId } }] : []),
        ],
        deleted_at: null,
      },
      select: {
        id: true,
        role: true,
        branch_id: true,
        email: true,
      },
    });

    req.user = {
      id: authUser.id,
      email: userEmail,
      role: employee?.role || (authUser.app_metadata?.role as string) || 'STAFF',
      branchId: employee?.branch_id || undefined,
      employeeId: employee?.id || undefined,
    };

    next();
  } catch (err) {
    next(new UnauthorizedError('Authentication verification failed'));
  }
}
