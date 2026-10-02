import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../core/errors/app.error.js';

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
  console.error('[Unhandled Internal Error]:', err);
  return res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? 'Internal server error occurred' 
      : err.message || 'Internal server error',
  });
}
