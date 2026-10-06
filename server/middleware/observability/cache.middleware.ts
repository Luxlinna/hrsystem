import { Request, Response, NextFunction } from 'express';
import { cacheService } from '../../services/cache.service.js';

interface CacheOptions {
  ttlSeconds?: number;
  cdnTtlSeconds?: number;
  staleWhileRevalidateSeconds?: number;
  isPrivate?: boolean;
}

/**
 * Express middleware to cache GET responses with L1/L2 Redis and CDN edge cache headers
 */
export function cacheResponse(optionsOrTtl: number | CacheOptions = 60) {
  const options: CacheOptions =
    typeof optionsOrTtl === 'number'
      ? { ttlSeconds: optionsOrTtl }
      : optionsOrTtl;

  const ttl = options.ttlSeconds ?? 60;
  const cdnTtl = options.cdnTtlSeconds ?? ttl;
  const swr = options.staleWhileRevalidateSeconds ?? 30;
  const isPrivate = options.isPrivate ?? true;

  return async (req: Request, res: Response, next: NextFunction) => {
    if (req.method !== 'GET') {
      // For mutating requests, ensure proxies / CDNs never cache
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      return next();
    }

    const branchId = req.user?.branchId || 'global';
    const cacheKey = `http:${branchId}:${req.originalUrl || req.url}`;

    // 1. Try multi-tier cache (L1 Memory -> L2 Redis)
    const cachedData = await cacheService.getAsync(cacheKey);
    if (cachedData) {
      res.setHeader('X-Cache', 'HIT');
      res.setHeader('X-Cache-Lookup', 'L1/L2');
      setEdgeCacheHeaders(res, isPrivate, cdnTtl, swr);
      return res.status(200).json(cachedData);
    }

    res.setHeader('X-Cache', 'MISS');
    setEdgeCacheHeaders(res, isPrivate, cdnTtl, swr);

    // 2. Intercept res.json to store into cache before sending
    const originalJson = res.json.bind(res);
    res.json = (body: any) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cacheService.set(cacheKey, body, ttl);
      }
      return originalJson(body);
    };

    next();
  };
}

function setEdgeCacheHeaders(res: Response, isPrivate: boolean, cdnTtl: number, swr: number): void {
  const visibility = isPrivate ? 'private' : 'public';
  res.setHeader(
    'Cache-Control',
    `${visibility}, max-age=${cdnTtl}, stale-while-revalidate=${swr}`
  );
  // CDN specific Surrogate headers for Cloudflare / Fastly / Akamai
  if (!isPrivate) {
    res.setHeader('Surrogate-Control', `max-age=${cdnTtl * 2}`);
    res.setHeader('CDN-Cache-Control', `max-age=${cdnTtl * 2}`);
  }
}
