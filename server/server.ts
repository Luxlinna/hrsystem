import { createApp } from './app.js';
import { prisma } from './config/database.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { biometricService } from './services/biometric.service.js';
import { startEmbeddedRedis, stopEmbeddedRedis } from './services/embedded-redis.service.js';
import { redisService } from './services/redis.service.js';
import { cacheService } from './services/cache.service.js';

const PORT = env.PORT;
const app = createApp();

let server: any = null;
let watchdogInterval: NodeJS.Timeout | null = null;

async function bootstrap() {
  // 1. Ensure Redis Server is active & connected (with zero-error fallback)
  try {
    const embeddedStarted = await startEmbeddedRedis(6379);
    const hasRedisConfigured = Boolean(process.env.REDIS_URL || process.env.REDIS_HOST);

    if (embeddedStarted || hasRedisConfigured) {
      await redisService.connect();
      cacheService.initPubSub();
    } else {
      logger.info('[Redis Boot] No Redis configured (REDIS_URL unset); operating in L1 In-Memory caching mode.');
    }
  } catch (redisErr: any) {
    logger.warn(`[Redis Boot] Initialized with fallback: ${redisErr?.message || redisErr}`);
  }

  // 2. Start HTTP Server
  server = app.listen(PORT, () => {
    logger.info(`[HRMS Backend Server] running on http://localhost:${PORT}`);
    logger.info(`[Health check] http://localhost:${PORT}/health`);
    logger.info(`[API v1 Base] http://localhost:${PORT}/api/v1`);
    logger.info(`[ZKTeco ADMS Endpoint] http://localhost:${PORT}/iclock/cdata`);
  });

  // 3. Biometric Device Offline Watchdog (Runs every 5 minutes)
  const WATCHDOG_INTERVAL_MS = 5 * 60 * 1000;
  watchdogInterval = setInterval(() => {
    biometricService.checkBiometricDeviceHealth().catch((err) => {
      logger.error('[ZKTeco Watchdog] Error in scheduled run:', err);
    });
  }, WATCHDOG_INTERVAL_MS);

  // Initial health check after 10s boot
  setTimeout(() => {
    biometricService.checkBiometricDeviceHealth().catch((err) => {
      logger.error('[ZKTeco Watchdog] Error in initial run:', err);
    });
  }, 10000);
}

// Graceful Shutdown
async function shutdown(signal: string) {
  logger.info(`\nReceived ${signal}. Closing server gracefully...`);
  if (watchdogInterval) clearInterval(watchdogInterval);
  if (server) {
    server.close(async () => {
      await redisService.disconnect();
      await stopEmbeddedRedis();
      await prisma.$disconnect();
      logger.info('[Prisma & Redis] Database connections closed.');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

bootstrap().catch((err) => {
  logger.error('[Bootstrap] Fatal startup error:', err);
  process.exit(1);
});
