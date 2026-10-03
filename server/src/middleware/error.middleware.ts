import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/http-error.js';
import { logger } from '../config/logger.js';
import { env } from '../config/env.js';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.details ? { details: err.details } : {}),
    });
  }

  // Unhandled internal errors
  logger.error('[Unhandled Internal Error]:', err);
  return res.status(500).json({
    success: false,
    message: env.NODE_ENV === 'production' 
      ? 'Internal server error occurred' 
      : err.message || 'Internal server error',
  });
}

export function notFoundHandler(req: Request, res: Response) {
  return res.status(404).json({
    success: false,
    message: `Endpoint not found: ${req.method} ${req.originalUrl}`,
  });
}
