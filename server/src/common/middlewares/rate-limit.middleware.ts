import { Request, Response, NextFunction } from 'express';

interface RateLimitOptions {
  windowMs: number; // Duration of window in milliseconds
  max: number; // Max requests allowed per window
  message?: string;
  statusCode?: number;
  keyGenerator?: (req: Request) => string;
  skip?: (req: Request) => boolean;
}

interface ClientHistory {
  hits: number[];
}

export function createRateLimiter(options: RateLimitOptions) {
  const {
    windowMs,
    max,
    message = 'Too many requests, please try again later.',
    statusCode = 429,
    keyGenerator = (req: Request) => {
      const forwarded = req.headers['x-forwarded-for'];
      if (forwarded) {
        return String(forwarded).split(',')[0]?.trim() || req.ip || 'unknown';
      }
      return req.ip || req.socket.remoteAddress || 'unknown';
    },
    skip = () => false,
  } = options;

  const storage = new Map<string, ClientHistory>();

  // Cleanup expired hits every 5 minutes
  setInterval(() => {
    const now = Date.now();
    const cutoff = now - windowMs;
    for (const [key, record] of storage.entries()) {
      const validHits = record.hits.filter((t) => t > cutoff);
      if (validHits.length === 0) {
        storage.delete(key);
      } else {
        storage.set(key, { hits: validHits });
      }
    }
  }, 5 * 60 * 1000);

  return (req: Request, res: Response, next: NextFunction) => {
    if (skip(req)) {
      return next();
    }

    const key = keyGenerator(req);
    const now = Date.now();
    const cutoff = now - windowMs;

    const record = storage.get(key) || { hits: [] };
    const activeHits = record.hits.filter((t) => t > cutoff);

    const remaining = Math.max(0, max - activeHits.length - 1);
    const resetTime = activeHits.length > 0 ? Math.ceil((activeHits[0] + windowMs - now) / 1000) : Math.ceil(windowMs / 1000);

    res.setHeader('RateLimit-Limit', max);
    res.setHeader('RateLimit-Remaining', remaining);
    res.setHeader('RateLimit-Reset', resetTime);

    if (activeHits.length >= max) {
      res.setHeader('Retry-After', resetTime);
      return res.status(statusCode).json({
        statusCode,
        error: 'Too Many Requests',
        message,
        retryAfterSeconds: resetTime,
      });
    }

    activeHits.push(now);
    storage.set(key, { hits: activeHits });

    next();
  };
}

/**
 * Standard API rate limiter: 120 requests per minute
 */
export const generalApiLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 120,
  message: 'API rate limit exceeded. Please wait a minute before making more requests.',
});

/**
 * Strict login rate limiter: 5 attempts per 15 minutes per IP + Email
 */
export const authLoginLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many failed login attempts. Please try again after 15 minutes.',
  keyGenerator: (req: Request) => {
    const ip = req.headers['x-forwarded-for'] || req.ip || req.socket.remoteAddress || 'unknown';
    const email = req.body?.email ? String(req.body.email).toLowerCase().trim() : '';
    return `login:${ip}:${email}`;
  },
});

/**
 * Password reset / OTP rate limiter: 3 requests per 15 minutes per IP + Email
 */
export const passwordResetLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 3,
  message: 'Too many password reset requests. Please wait 15 minutes before requesting again.',
  keyGenerator: (req: Request) => {
    const ip = req.headers['x-forwarded-for'] || req.ip || req.socket.remoteAddress || 'unknown';
    const email = req.body?.email ? String(req.body.email).toLowerCase().trim() : '';
    return `pwreset:${ip}:${email}`;
  },
});
