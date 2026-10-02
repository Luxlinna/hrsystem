import { Request, Response, NextFunction } from 'express';
import { cacheService } from '../../core/infrastructure/cache/cache.service.js';

/**
 * Express middleware to cache GET requests by URL query + user branch
 */
export function cacheResponse(ttlSeconds = 60) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.method !== 'GET') {
      return next();
    }

    const branchId = req.user?.branchId || 'global';
    const cacheKey = `http:${branchId}:${req.originalUrl || req.url}`;

    const cachedData = cacheService.get(cacheKey);
    if (cachedData) {
      res.setHeader('X-Cache', 'HIT');
      return res.status(200).json(cachedData);
    }

    res.setHeader('X-Cache', 'MISS');

    // Intercept res.json to store into cache before sending
    const originalJson = res.json.bind(res);
    res.json = (body: any) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cacheService.set(cacheKey, body, ttlSeconds);
      }
      return originalJson(body);
    };

    next();
  };
}
