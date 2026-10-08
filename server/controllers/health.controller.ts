import { Request, Response } from 'express';
import { BaseController } from './base.controller.js';
import { prisma } from '../config/database.js';
import { redisService } from '../services/redis.service.js';

export class HealthController extends BaseController {
  check = async (_req: Request, res: Response) => {
    const isRedisLive = await redisService.ping();
    return this.ok(res, {
      status: 'healthy',
      uptime: process.uptime(),
      redis: isRedisLive ? 'connected' : (redisService.isAvailable ? 'connected' : 'disabled / in-memory'),
      timestamp: new Date().toISOString(),
    }, 'Server is healthy');
  };

  readiness = async (_req: Request, res: Response) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      const isRedisLive = await redisService.ping();
      return this.ok(res, {
        status: 'ready',
        database: 'connected',
        redis: isRedisLive ? 'connected' : (redisService.isAvailable ? 'connected' : 'disabled / in-memory'),
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
