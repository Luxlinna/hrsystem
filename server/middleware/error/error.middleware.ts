import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../utils/http-error.js';
import { logger } from '../../config/logger.js';
import { env } from '../../config/env.js';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  const reqId = req.id ? `[req:${req.id.slice(0, 8)}]` : '';

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.details ? { details: err.details } : {}),
      ...(req.id ? { requestId: req.id } : {}),
    });
  }

  // Unhandled internal errors
  logger.error(`${reqId} [Unhandled Internal Error]:`, err);

  return res.status(500).json({
    success: false,
    message: env.NODE_ENV === 'production' 
      ? 'Internal server error occurred' 
      : err.message || 'Internal server error',
    ...(req.id ? { requestId: req.id } : {}),
    ...(env.NODE_ENV !== 'production' && err.stack ? { stack: err.stack } : {}),
  });
}
