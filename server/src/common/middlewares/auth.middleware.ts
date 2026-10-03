import { Request, Response, NextFunction } from 'express';
import { UnauthorizedError } from '../../core/errors/app.error.js';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { prisma } from '../../core/infrastructure/database/prisma.client.js';
import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://jnrozihprpjvnofjlbtd.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || '';

let supabaseAuthClient: SupabaseClient | null = null;
if (SUPABASE_KEY) {
  supabaseAuthClient = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export interface AuthenticatedUser {
  id: string;
  email?: string;
  role?: string;
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

    if (!supabaseAuthClient) {
      return next(new UnauthorizedError('Authentication service not configured on server'));
    }

    // Verify token with Supabase Auth
    const { data: userData, error: authError } = await supabaseAuthClient.auth.getUser(token);
    if (authError || !userData?.user) {
      return next(new UnauthorizedError(authError?.message || 'Invalid or expired session token'));
    }

    const userEmail = typeof authUser.email === 'string' ? authUser.email : '';
    const userId = typeof authUser.id === 'string' ? authUser.id : '';

    // Enrich with employee profile and role
    const employee = await prisma.employees.findFirst({
      where: {
        OR: [
          ...(userEmail ? [{ email: { equals: userEmail } }] : []),
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
