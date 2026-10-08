import { Router, type Request, type Response, type NextFunction } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { sendTestEmail, sendUserInviteEmail } from '../services/smtp.service.js';

const settingsRouter = Router();

/**
 * POST /api/settings/smtp/test
 * Sends a test email using the SMTP config stored in system_settings.
 */
settingsRouter.post('/smtp/test', authenticate, async (req: Request, res: Response, _next: NextFunction) => {
  try {
    const recipient = req.body?.to || req.body?.email || req.user?.email;
    if (!recipient) {
      return res.status(400).json({ message: 'Could not determine recipient email address. Please ensure your user has an email or provide one in the request.' });
    }

    await sendTestEmail(recipient);
    return res.json({ ok: true, message: `Test email sent successfully to ${recipient}` });
  } catch (err: any) {
    console.error('[SMTP Test]', err?.message);
    return res.status(500).json({ message: err?.message || 'Failed to send test email.' });
  }
});

/**
 * POST /api/settings/smtp/send-invite
 * Sends a user invitation email with setup link using the configured SMTP.
 */
settingsRouter.post('/smtp/send-invite', authenticate, async (req: Request, res: Response, _next: NextFunction) => {
  try {
    const { email, name, invite_link } = req.body;
    if (!email || !invite_link) {
      return res.status(400).json({ message: 'Email and invite_link are required.' });
    }

    await sendUserInviteEmail(email, name || email.split('@')[0], invite_link);
    return res.json({ ok: true, message: `Invitation email sent successfully to ${email}` });
  } catch (err: any) {
    console.error('[SMTP Invite]', err?.message);
    return res.status(500).json({ message: err?.message || 'Failed to send invitation email.' });
  }
});

/**
 * GET /api/settings/cache/status
 * Fetches dynamic Redis & caching health, cluster status, and latency.
 */
settingsRouter.get('/cache/status', authenticate, async (_req: Request, res: Response) => {
  try {
    const { redisService } = await import('../services/redis.service.js');
    const { cacheService } = await import('../services/cache.service.js');
    const { prisma } = await import('../config/database.js');

    const isLive = await redisService.ping();
    let latencyMs = 0;
    if (isLive) {
      const start = Date.now();
      await redisService.get('__latency_check__');
      latencyMs = Date.now() - start;
    }

    const setting = await prisma.system_settings.findFirst({
      where: { key: 'redis_cache_enabled' }
    });
    const enabled = setting ? (setting.value === 'true' || setting.value === '1') : cacheService.enabled;

    return res.json({
      ok: true,
      data: {
        enabled,
        connected: isLive,
        provider: process.env.REDIS_URL?.includes('upstash')
          ? 'Upstash Serverless Redis (AWS)'
          : process.env.REDIS_URL
          ? 'Cloud Redis'
          : 'Embedded Redis',
        latencyMs,
        l1CachedItems: cacheService.l1KeysCount,
        clusterPubSub: true,
        endpoint: process.env.REDIS_URL
          ? process.env.REDIS_URL.replace(/:\/\/.*@/, '://***@')
          : '127.0.0.1:6379',
      },
    });
  } catch (err: any) {
    return res.status(500).json({ ok: false, message: err?.message || 'Failed to get cache status' });
  }
});

/**
 * POST /api/settings/cache/toggle
 * Dynamically toggles Redis caching ON or OFF globally across all servers.
 */
settingsRouter.post('/cache/toggle', authenticate, async (req: Request, res: Response) => {
  try {
    const { cacheService } = await import('../services/cache.service.js');
    const { prisma } = await import('../config/database.js');

    const enabled = Boolean(req.body.enabled);
    cacheService.setEnabled(enabled);

    // Persist in database system_settings
    const existing = await prisma.system_settings.findFirst({ where: { key: 'redis_cache_enabled' } });
    if (existing) {
      await prisma.system_settings.update({
        where: { id: existing.id },
        data: { value: String(enabled), updated_at: new Date() }
      });
    } else {
      await prisma.system_settings.create({
        data: {
          key: 'redis_cache_enabled',
          value: String(enabled),
          type: 'boolean'
        }
      });
    }

    return res.json({
      ok: true,
      message: `Global cache ${enabled ? 'enabled' : 'disabled'} successfully across all servers.`,
      enabled,
    });
  } catch (err: any) {
    return res.status(500).json({ ok: false, message: err?.message || 'Failed to toggle cache' });
  }
});

/**
 * POST /api/settings/cache/clear
 * Purges L1 RAM and Global Redis cache across all cluster nodes.
 */
settingsRouter.post('/cache/clear', authenticate, async (_req: Request, res: Response) => {
  try {
    const { cacheService } = await import('../services/cache.service.js');
    cacheService.clear();

    return res.json({
      ok: true,
      message: 'Global cache purged successfully across all cluster nodes.',
      clearedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    return res.status(500).json({ ok: false, message: err?.message || 'Failed to clear cache' });
  }
});

/**
 * POST /api/settings/cache/benchmark
 * Measures live write/read roundtrip latency to the global Redis cluster.
 */
settingsRouter.post('/cache/benchmark', authenticate, async (_req: Request, res: Response) => {
  try {
    const { redisService } = await import('../services/redis.service.js');
    if (!redisService.isAvailable) {
      return res.status(400).json({ ok: false, message: 'Redis is not connected.' });
    }

    const testKey = `benchmark:${Date.now()}`;
    const start = Date.now();
    await redisService.set(testKey, { test: true }, 5);
    await redisService.get(testKey);
    const latencyMs = Date.now() - start;
    await redisService.del(testKey);

    return res.json({
      ok: true,
      latencyMs,
      message: `Cloud Redis roundtrip latency: ${latencyMs}ms`,
    });
  } catch (err: any) {
    return res.status(500).json({ ok: false, message: err?.message || 'Benchmark failed' });
  }
});

/**
 * GET /api/settings/cache/config
 * Retrieves the current Redis connection configuration (URL, TLS, source).
 */
settingsRouter.get('/cache/config', authenticate, async (_req: Request, res: Response) => {
  try {
    const { redisService } = await import('../services/redis.service.js');
    const { prisma } = await import('../config/database.js');

    const dbUrl = await prisma.system_settings.findFirst({ where: { key: 'redis_url' } });
    const dbTls = await prisma.system_settings.findFirst({ where: { key: 'redis_tls' } });

    const rawUrl = dbUrl?.value || redisService.getActiveUrl() || '';
    const isTls = dbTls ? dbTls.value === 'true' : (rawUrl.startsWith('rediss://') || process.env.REDIS_TLS === 'true');

    return res.json({
      ok: true,
      data: {
        redisUrl: rawUrl,
        isTls,
        isCustom: Boolean(dbUrl?.value),
      },
    });
  } catch (err: any) {
    return res.status(500).json({ ok: false, message: err?.message || 'Failed to get cache config' });
  }
});

/**
 * POST /api/settings/cache/test-connection
 * Tests an arbitrary Redis connection URL before saving.
 */
settingsRouter.post('/cache/test-connection', authenticate, async (req: Request, res: Response) => {
  try {
    const { redisService } = await import('../services/redis.service.js');
    const { redisUrl, isTls = true } = req.body;

    if (!redisUrl) {
      return res.status(400).json({ ok: false, message: 'Redis URL is required.' });
    }

    const result = await redisService.testConnection(redisUrl, Boolean(isTls));
    if (result.ok) {
      return res.json({
        ok: true,
        latencyMs: result.latencyMs,
        message: `Successfully connected! Latency: ${result.latencyMs}ms`,
      });
    } else {
      return res.status(400).json({
        ok: false,
        message: result.error || 'Connection failed',
      });
    }
  } catch (err: any) {
    return res.status(500).json({ ok: false, message: err?.message || 'Test failed' });
  }
});

/**
 * POST /api/settings/cache/update-config
 * Tests, saves, and hot-swaps the Redis connection cluster at runtime.
 */
settingsRouter.post('/cache/update-config', authenticate, async (req: Request, res: Response) => {
  try {
    const { redisService } = await import('../services/redis.service.js');
    const { cacheService } = await import('../services/cache.service.js');
    const { prisma } = await import('../config/database.js');
    const { redisUrl, isTls = true } = req.body;

    if (!redisUrl) {
      return res.status(400).json({ ok: false, message: 'Redis URL is required.' });
    }

    // 1. Verify connection first
    const testResult = await redisService.testConnection(redisUrl, Boolean(isTls));
    if (!testResult.ok) {
      return res.status(400).json({
        ok: false,
        message: `Could not connect to Redis: ${testResult.error}`,
      });
    }

    // 2. Persist in database system_settings
    const existingUrl = await prisma.system_settings.findFirst({ where: { key: 'redis_url' } });
    if (existingUrl) {
      await prisma.system_settings.update({
        where: { id: existingUrl.id },
        data: { value: redisUrl, updated_at: new Date() },
      });
    } else {
      await prisma.system_settings.create({
        data: { key: 'redis_url', value: redisUrl, type: 'string' },
      });
    }

    const existingTls = await prisma.system_settings.findFirst({ where: { key: 'redis_tls' } });
    if (existingTls) {
      await prisma.system_settings.update({
        where: { id: existingTls.id },
        data: { value: String(isTls), updated_at: new Date() },
      });
    } else {
      await prisma.system_settings.create({
        data: { key: 'redis_tls', value: String(isTls), type: 'boolean' },
      });
    }

    // 3. Hot-reconnect the active service
    await redisService.reconfigure(redisUrl, Boolean(isTls));
    cacheService.initPubSub();

    return res.json({
      ok: true,
      message: `Redis connection updated and connected live (${testResult.latencyMs}ms latency)!`,
      latencyMs: testResult.latencyMs,
    });
  } catch (err: any) {
    return res.status(500).json({ ok: false, message: err?.message || 'Failed to update Redis configuration' });
  }
});

export const settingsRoutes = settingsRouter;
