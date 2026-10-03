import { Request, Response, NextFunction } from 'express';
import { logger } from '../../config/logger.js';

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const statusCode = res.statusCode;
    const ip = req.headers['x-forwarded-for'] || req.ip || req.socket.remoteAddress;
    const reqId = req.id ? `[req:${req.id.slice(0, 8)}]` : '';

    const logMessage = `${reqId} ${req.method} ${req.originalUrl || req.url} - ${statusCode} (${duration}ms) [${ip}]`;
    if (statusCode >= 500) {
      logger.error(logMessage);
    } else if (statusCode >= 400) {
      logger.warn(logMessage);
    } else {
      logger.info(logMessage);
    }
  });

  next();
}
