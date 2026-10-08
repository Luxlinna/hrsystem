import net from 'net';
import { logger } from '../config/logger.js';

let redisInstance: any = null;

async function checkPortOpen(port: number, host = '127.0.0.1'): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(600);
    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.once('error', () => {
      socket.destroy();
      resolve(false);
    });
    socket.once('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.connect(port, host);
  });
}

/**
 * Ensures a Redis server is active for local/dev use without Docker.
 * In production:
 * - If an external/cloud REDIS_URL or REDIS_HOST is configured, it skips local embedded Redis.
 * - If DISABLE_EMBEDDED_REDIS is set to true, it skips local embedded Redis.
 * - Dynamically loads redis-memory-server so production builds with pruned devDependencies never crash.
 */
export async function startEmbeddedRedis(port = 6379): Promise<boolean> {
  if (process.env.DISABLE_EMBEDDED_REDIS === 'true') {
    logger.info('[Redis Engine] Embedded Redis disabled by DISABLE_EMBEDDED_REDIS flag.');
    return false;
  }

  const redisUrl = process.env.REDIS_URL || '';
  const redisHost = process.env.REDIS_HOST || '';
  const isRemote =
    (redisUrl && !redisUrl.includes('127.0.0.1') && !redisUrl.includes('localhost')) ||
    (redisHost && redisHost !== '127.0.0.1' && redisHost !== 'localhost');

  if (isRemote) {
    logger.info(`[Redis Engine] Remote external Redis configured (${redisHost || 'via REDIS_URL'}). Skipping local embedded engine.`);
    return true;
  }

  // Check if Redis is already running on the local port
  const isAlreadyRunning = await checkPortOpen(port, '127.0.0.1');
  if (isAlreadyRunning) {
    logger.info(`[Redis Engine] Existing Redis service detected on 127.0.0.1:${port}.`);
    return true;
  }

  // In production environments where devDependencies may be pruned, load dynamically
  try {
    // @ts-ignore
    const memoryServerModule = await import('redis-memory-server').catch(() => null);
    const RedisMemoryServer = memoryServerModule?.RedisMemoryServer || memoryServerModule?.default?.RedisMemoryServer;

    if (!RedisMemoryServer) {
      logger.info('[Redis Engine] Embedded Redis engine not installed (production mode); using L1 in-memory cache.');
      return false;
    }

    redisInstance = new RedisMemoryServer({
      instance: {
        port,
      },
    });

    const host = await redisInstance.getHost();
    const activePort = await redisInstance.getPort();
    logger.info(`✅ [Redis Engine] Local Redis server started and listening on ${host}:${activePort}`);
    return true;
  } catch (err: any) {
    logger.warn(`⚠️ [Redis Engine] Local Redis engine skipped: ${err?.message || err}`);
    return false;
  }
}

export async function stopEmbeddedRedis(): Promise<void> {
  if (redisInstance) {
    try {
      await redisInstance.stop();
      logger.info('[Redis Engine] Local Redis server stopped.');
      redisInstance = null;
    } catch (err: any) {
      logger.error('[Redis Engine] Error stopping Redis server:', err?.message || err);
    }
  }
}
