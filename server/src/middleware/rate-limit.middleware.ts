import { Request, Response, NextFunction } from 'express';

interface RateLimitOptions {
  windowMs: number;
  max: number;
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

// ─── Dynamic Config Cache (refreshed every 60 s to avoid per-request DB round-trips) ──
interface DynamicLimitConfig {
  otpCodesPerHour: number;
  otpResendWaitMs: number;
  resetPerHour: number;
  resetResendWaitMs: number;
}

let _dynamicConfigCache: DynamicLimitConfig | null = null;
let _dynamicConfigFetchedAt = 0;
const DYNAMIC_CONFIG_TTL_MS = 60_000; // re-read DB every 60 seconds

async function getDynamicRateLimitConfig(): Promise<DynamicLimitConfig> {
  const now = Date.now();
  if (_dynamicConfigCache && now - _dynamicConfigFetchedAt < DYNAMIC_CONFIG_TTL_MS) {
    return _dynamicConfigCache;
  }

  try {
    const { supabaseAdminClient } = await import('../config/supabase.js');
    if (!supabaseAdminClient) throw new Error('Supabase client not available');

    const { data } = await supabaseAdminClient
      .from('system_settings')
      .select('key, value')
      .in('key', [
        'otp_codes_per_hour',
        'otp_resend_wait_seconds',
        'password_reset_per_hour',
        'password_reset_resend_wait_seconds',
      ]);

    const map: Record<string, string> = {};
    (data || []).forEach(({ key, value }: { key: string; value: string }) => {
      map[key] = value;
    });

    _dynamicConfigCache = {
      otpCodesPerHour: Math.max(1, parseInt(map['otp_codes_per_hour'] ?? '3', 10) || 3),
      otpResendWaitMs: Math.max(10_000, (parseInt(map['otp_resend_wait_seconds'] ?? '60', 10) || 60) * 1000),
      resetPerHour: Math.max(1, parseInt(map['password_reset_per_hour'] ?? '3', 10) || 3),
      resetResendWaitMs: Math.max(10_000, (parseInt(map['password_reset_resend_wait_seconds'] ?? '60', 10) || 60) * 1000),
    };
    _dynamicConfigFetchedAt = now;
  } catch {
    _dynamicConfigCache = {
      otpCodesPerHour: 3,
      otpResendWaitMs: 60_000,
      resetPerHour: 3,
      resetResendWaitMs: 60_000,
    };
    _dynamicConfigFetchedAt = now;
  }

  return _dynamicConfigCache!;
}

/**
 * Dynamic OTP rate limiter — reads limits from system_settings (Settings → 🔐 OTP).
 */
const _otpHitStore = new Map<string, number[]>();  // identifier → timestamps
const _otpLastSent = new Map<string, number>();    // identifier → last send time

export async function dynamicOtpLimiter(req: Request, res: Response, next: NextFunction) {
  const cfg = await getDynamicRateLimitConfig();

  const identifier = (
    req.body?.email ||
    req.body?.phone ||
    req.headers['x-forwarded-for'] ||
    req.ip ||
    'unknown'
  ) as string;
  const key = String(identifier).toLowerCase().trim();
  const now = Date.now();
  const windowMs = 60 * 60 * 1000; // 1 hour

  // 1. Resend wait check
  const lastSent = _otpLastSent.get(key) ?? 0;
  const waitRemaining = Math.ceil((lastSent + cfg.otpResendWaitMs - now) / 1000);
  if (waitRemaining > 0) {
    res.setHeader('Retry-After', waitRemaining);
    return res.status(429).json({
      statusCode: 429,
      error: 'Too Many Requests',
      message: `Please wait ${waitRemaining} second${waitRemaining !== 1 ? 's' : ''} before requesting a new code.`,
      retryAfterSeconds: waitRemaining,
    });
  }

  // 2. Hourly quota check
  const cutoff = now - windowMs;
  const hits = (_otpHitStore.get(key) ?? []).filter((t) => t > cutoff);

  if (hits.length >= cfg.otpCodesPerHour) {
    const resetSec = Math.ceil((hits[0] + windowMs - now) / 1000);
    res.setHeader('Retry-After', resetSec);
    res.setHeader('RateLimit-Limit', cfg.otpCodesPerHour);
    res.setHeader('RateLimit-Remaining', 0);
    res.setHeader('RateLimit-Reset', resetSec);
    return res.status(429).json({
      statusCode: 429,
      error: 'Too Many Requests',
      message: `OTP limit reached. You can request at most ${cfg.otpCodesPerHour} code${cfg.otpCodesPerHour !== 1 ? 's' : ''} per hour. Try again in ${resetSec}s.`,
      retryAfterSeconds: resetSec,
    });
  }

  // 3. Record this request
  hits.push(now);
  _otpHitStore.set(key, hits);
  _otpLastSent.set(key, now);

  res.setHeader('RateLimit-Limit', cfg.otpCodesPerHour);
  res.setHeader('RateLimit-Remaining', Math.max(0, cfg.otpCodesPerHour - hits.length));
  res.setHeader('RateLimit-Reset', Math.ceil(windowMs / 1000));

  next();
}

/**
 * Dynamic Password Reset Rate Limiter — reads limits from system_settings (Settings → 🔑 Reset Password).
 */
const _pwResetHitStore = new Map<string, number[]>();
const _pwResetLastSent = new Map<string, number>();

export async function dynamicPasswordResetLimiter(req: Request, res: Response, next: NextFunction) {
  const cfg = await getDynamicRateLimitConfig();

  const identifier = (
    req.body?.email ||
    req.headers['x-forwarded-for'] ||
    req.ip ||
    'unknown'
  ) as string;
  const key = String(identifier).toLowerCase().trim();
  const now = Date.now();
  const windowMs = 60 * 60 * 1000; // 1 hour

  // 1. Resend wait check
  const lastSent = _pwResetLastSent.get(key) ?? 0;
  const waitRemaining = Math.ceil((lastSent + cfg.resetResendWaitMs - now) / 1000);
  if (waitRemaining > 0) {
    res.setHeader('Retry-After', waitRemaining);
    return res.status(429).json({
      statusCode: 429,
      error: 'Too Many Requests',
      message: `Please wait ${waitRemaining} second${waitRemaining !== 1 ? 's' : ''} before requesting another password reset.`,
      retryAfterSeconds: waitRemaining,
    });
  }

  // 2. Hourly quota check
  const cutoff = now - windowMs;
  const hits = (_pwResetHitStore.get(key) ?? []).filter((t) => t > cutoff);

  if (hits.length >= cfg.resetPerHour) {
    const resetSec = Math.ceil((hits[0] + windowMs - now) / 1000);
    res.setHeader('Retry-After', resetSec);
    res.setHeader('RateLimit-Limit', cfg.resetPerHour);
    res.setHeader('RateLimit-Remaining', 0);
    res.setHeader('RateLimit-Reset', resetSec);
    return res.status(429).json({
      statusCode: 429,
      error: 'Too Many Requests',
      message: `Password reset request limit reached. You can submit at most ${cfg.resetPerHour} request${cfg.resetPerHour !== 1 ? 's' : ''} per hour. Try again in ${resetSec}s.`,
      retryAfterSeconds: resetSec,
    });
  }

  // 3. Record this request
  hits.push(now);
  _pwResetHitStore.set(key, hits);
  _pwResetLastSent.set(key, now);

  res.setHeader('RateLimit-Limit', cfg.resetPerHour);
  res.setHeader('RateLimit-Remaining', Math.max(0, cfg.resetPerHour - hits.length));
  res.setHeader('RateLimit-Reset', Math.ceil(windowMs / 1000));

  next();
}
