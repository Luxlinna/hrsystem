class RedisService {
  private client: any = null;
  private isConnected = false;

  constructor() {
    this.init();
  }

  private async init(): Promise<void> {
    const redisUrl = process.env.REDIS_URL;
    const redisHost = process.env.REDIS_HOST;

    if (!redisUrl && !redisHost) {
      // Redis not configured; gracefully operates in in-memory mode
      return;
    }

    try {
      // Dynamically load ioredis if installed in environment
      // @ts-ignore
      const ioredisModule = await import('ioredis').catch(() => null);
      if (!ioredisModule) {
        return;
      }

      const RedisConstructor: any = ioredisModule.default || ioredisModule.Redis || ioredisModule;
      if (redisUrl) {
        this.client = new RedisConstructor(redisUrl, {
          lazyConnect: true,
          retryStrategy: (times: number) => Math.min(times * 100, 3000),
          maxRetriesPerRequest: 2,
          enableOfflineQueue: false,
        });
      } else {
        this.client = new RedisConstructor({
          host: redisHost,
          port: parseInt(process.env.REDIS_PORT || '6379', 10),
          password: process.env.REDIS_PASSWORD || undefined,
          lazyConnect: true,
          retryStrategy: (times: number) => Math.min(times * 100, 3000),
          maxRetriesPerRequest: 2,
          enableOfflineQueue: false,
        });
      }

      this.client.on('connect', () => {
        this.isConnected = true;
        console.log('✅ [Redis] Connected successfully to Redis server');
      });

      this.client.on('ready', () => {
        this.isConnected = true;
      });

      this.client.on('error', (err: any) => {
        this.isConnected = false;
        console.warn(`⚠️ [Redis] Connection warning: ${err.message}`);
      });

      this.client.on('close', () => {
        this.isConnected = false;
      });

      this.client.connect().catch((err: any) => {
        this.isConnected = false;
        console.warn(`⚠️ [Redis] Initial connection skipped: ${err.message}`);
      });
    } catch (err: any) {
      this.isConnected = false;
      console.warn(`⚠️ [Redis] Initialization skipped: ${err.message}`);
    }
  }

  public get isAvailable(): boolean {
    return this.isConnected && this.client !== null;
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
    } catch (err) {
      console.warn(`⚠️ [Redis] Set key error: ${key}`, err);
    }
  }

  async del(key: string): Promise<void> {
    if (!this.isAvailable || !this.client) return;
    try {
      await this.client.del(key);
    } catch (err) {
      console.warn(`⚠️ [Redis] Delete key error: ${key}`, err);
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
    } catch (err) {
      console.warn(`⚠️ [Redis] Delete by pattern error: ${pattern}`, err);
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit().catch(() => {});
      this.client = null;
      this.isConnected = false;
    }
  }
}

export const redisService = new RedisService();
