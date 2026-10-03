import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

declare global {
  namespace Express {
    interface Request {
      id?: string;
    }
  }
}

/**
 * Attaches a unique X-Request-Id correlation ID to every incoming request and response
 */
export function requestIdMiddleware(req: Request, res: Response, next: NextFunction) {
  const existingId = req.headers['x-request-id'];
  const requestId = (typeof existingId === 'string' && existingId.trim()) 
    ? existingId 
    : randomUUID();

  req.id = requestId;
  res.setHeader('X-Request-Id', requestId);

  next();
}
