import { Request, Response } from 'express';
import { BaseController } from './base.controller.js';
import { prisma } from '../config/database.js';

export class HealthController extends BaseController {
  check = (_req: Request, res: Response) => {
    return this.ok(res, {
      status: 'healthy',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    }, 'Server is healthy');
  };

  readiness = async (_req: Request, res: Response) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return this.ok(res, {
        status: 'ready',
        database: 'connected',
        timestamp: new Date().toISOString(),
      }, 'Server is ready');
    } catch (err: any) {
      return res.status(503).json({
        success: false,
        status: 'unhealthy',
        database: 'disconnected',
        error: err.message || 'Database ping failed',
      });
    }
  };
}

export const healthController = new HealthController();
