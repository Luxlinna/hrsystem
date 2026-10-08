import { logger } from '../config/logger.js';

class RedisService {
  private client: any = null;
  private isConnected = false;
  private isConnecting = false;

  constructor() {
    // Lazy or explicit connection via connect()
  }

  public async connect(): Promise<boolean> {
    if (this.isConnected && this.client) return true;
    if (this.isConnecting) return false;
    this.isConnecting = true;
    await this.init();
    this.isConnecting = false;
    return this.isConnected;
  }

  private async init(): Promise<void> {
    const redisUrl = process.env.REDIS_URL;
    const redisHost = process.env.REDIS_HOST || '127.0.0.1';
    const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);
    const redisPassword = process.env.REDIS_PASSWORD || undefined;
    const isTls = (redisUrl && redisUrl.startsWith('rediss://')) || process.env.REDIS_TLS === 'true';

    try {
      // @ts-ignore
      const ioredisModule = await import('ioredis').catch(() => null);
      if (!ioredisModule) {
        logger.warn('[Redis] ioredis module not found; running with L1 in-memory cache.');
        return;
      }

      const RedisConstructor: any = ioredisModule.default || ioredisModule.Redis || ioredisModule;

      const commonOptions: any = {
        lazyConnect: true,
        connectTimeout: 10000,
        maxRetriesPerRequest: 2,
        enableOfflineQueue: false,
        retryStrategy: (times: number) => {
          if (times > 10) {
            // After 10 failed connection attempts, back off to 10 seconds
            return 10000;
          }
          return Math.min(times * 200, 3000);
        },
      };

      if (isTls) {
        commonOptions.tls = {
          rejectUnauthorized: process.env.REDIS_TLS_REJECT_UNAUTHORIZED === 'true',
        };
      }

      let connectionUrl = redisUrl;
      if (connectionUrl && isTls && connectionUrl.startsWith('redis://')) {
        connectionUrl = connectionUrl.replace('redis://', 'rediss://');
      }

      if (connectionUrl) {
        this.client = new RedisConstructor(connectionUrl, commonOptions);
      } else {
        this.client = new RedisConstructor({
          host: redisHost,
          port: redisPort,
          password: redisPassword,
          ...commonOptions,
        });
      }

      this.client.on('connect', () => {
        this.isConnected = true;
        logger.info('✅ [Redis] Connected successfully to Redis server');
      });

      this.client.on('ready', () => {
        this.isConnected = true;
      });

      this.client.on('error', (err: any) => {
        this.isConnected = false;
        logger.warn(`⚠️ [Redis] Connection warning: ${err?.message || err}`);
      });

      this.client.on('close', () => {
        this.isConnected = false;
      });

      await this.client.connect().catch((err: any) => {
        this.isConnected = false;
        logger.warn(`⚠️ [Redis] Initial connection deferred: ${err?.message || err}`);
      });
    } catch (err: any) {
      this.isConnected = false;
      logger.warn(`⚠️ [Redis] Initialization skipped: ${err?.message || err}`);
    }
  }

  public get isAvailable(): boolean {
    return this.isConnected && this.client !== null;
  }

  /**
   * Actively ping Redis to verify live responsiveness
   */
  public async ping(): Promise<boolean> {
    if (!this.isAvailable || !this.client) return false;
    try {
      const pong = await this.client.ping();
      return pong === 'PONG';
    } catch {
      return false;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.isAvailable || !this.client) return null;
    try {
      const data = await this.client.get(key);
      if (!data) return null;
      return JSON.parse(data) as T;
    } catch {
      return null;
    }
  }

  async set<T>(key: string, data: T, ttlSeconds = 60): Promise<void> {
    if (!this.isAvailable || !this.client) return;
    try {
      const serialized = JSON.stringify(data);
      if (ttlSeconds > 0) {
        await this.client.set(key, serialized, 'EX', ttlSeconds);
      } else {
        await this.client.set(key, serialized);
      }
    } catch (err: any) {
      logger.warn(`⚠️ [Redis] Set key error for "${key}": ${err?.message || err}`);
    }
  }

  async del(key: string): Promise<void> {
    if (!this.isAvailable || !this.client) return;
    try {
      await this.client.del(key);
    } catch (err: any) {
      logger.warn(`⚠️ [Redis] Delete key error for "${key}": ${err?.message || err}`);
    }
  }

  async delByPattern(pattern: string): Promise<void> {
    if (!this.isAvailable || !this.client) return;
    try {
      const stream = this.client.scanStream({
        match: pattern,
        count: 100,
      });

      stream.on('data', async (keys: string[]) => {
        if (keys.length > 0 && this.client) {
          const pipeline = this.client.pipeline();
          keys.forEach((k: string) => pipeline.del(k));
          await pipeline.exec();
        }
      });
    } catch (err: any) {
      logger.warn(`⚠️ [Redis] Delete by pattern error for "${pattern}": ${err?.message || err}`);
    }
  }

  /**
   * Publish a message to a Redis channel for multi-server synchronization
   */
  async publish(channel: string, message: string): Promise<void> {
    if (!this.isAvailable || !this.client) return;
    try {
      await this.client.publish(channel, message);
    } catch (err: any) {
      logger.warn(`⚠️ [Redis PubSub] Failed to publish message: ${err?.message || err}`);
    }
  }

  /**
   * Subscribe to a Redis channel for real-time multi-server cache invalidation
   */
  private subClient: any = null;
  async subscribe(channel: string, onMessage: (msg: string) => void): Promise<void> {
    if (!this.client) return;
    try {
      if (!this.subClient) {
        this.subClient = this.client.duplicate();
        await this.subClient.connect().catch(() => {});
      }
      await this.subClient.subscribe(channel);
      this.subClient.on('message', (chan: string, msg: string) => {
        if (chan === channel) {
          onMessage(msg);
        }
      });
    } catch (err: any) {
      logger.warn(`⚠️ [Redis PubSub] Subscription error: ${err?.message || err}`);
    }
  }

  async disconnect(): Promise<void> {
    if (this.subClient) {
      try {
        await this.subClient.quit();
      } catch {
        this.subClient.disconnect();
      }
      this.subClient = null;
    }

    if (this.client) {
      try {
        await this.client.quit();
      } catch {
        // Force disconnect if quit times out
        this.client.disconnect();
      }
      this.client = null;
      this.isConnected = false;
    }
  }
}

export const redisService = new RedisService();
