import { redisService } from './redis.service.js';

interface CacheItem<T> {
  data: T;
  expiry: number;
}

export class CacheService {
  private cache = new Map<string, CacheItem<any>>();
  private timers = new Map<string, NodeJS.Timeout>();

  /**
   * Fast L1 (In-Memory) synchronous retrieval
   */
  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expiry) {
      this.delete(key);
      return null;
    }

    return item.data as T;
  }

  /**
   * Multi-Tier (L1 Memory -> L2 Redis) asynchronous retrieval
   */
  async getAsync<T>(key: string): Promise<T | null> {
    // 1. Check L1 Memory (0ms)
    const memCached = this.get<T>(key);
    if (memCached !== null) {
      return memCached;
    }

    // 2. Check L2 Redis (<2ms)
    if (redisService.isAvailable) {
      const redisCached = await redisService.get<T>(key);
      if (redisCached !== null) {
        // Populate L1 cache for sub-millisecond future hits
        this.setMemoryOnly(key, redisCached, 60);
        return redisCached;
      }
    }

    return null;
  }

  /**
   * Set an item in cache with TTL in seconds (writes to both L1 and L2 Redis)
   */
  set<T>(key: string, data: T, ttlSeconds = 60): void {
    this.setMemoryOnly(key, data, ttlSeconds);

    // Asynchronously write to Redis L2
    if (redisService.isAvailable) {
      redisService.set(key, data, ttlSeconds).catch(() => {});
    }
  }

  /**
   * Write only to L1 memory
   */
  private setMemoryOnly<T>(key: string, data: T, ttlSeconds = 60): void {
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
    }

    this.cache.set(key, {
      data,
      expiry: Date.now() + ttlSeconds * 1000,
    });

    const timer = setTimeout(() => {
      this.deleteMemoryOnly(key);
    }, ttlSeconds * 1000);

    this.timers.set(key, timer);
  }

  /**
   * Wrap an async function with automatic multi-tier caching
   */
  async getOrSet<T>(key: string, fetchFn: () => Promise<T>, ttlSeconds = 60): Promise<T> {
    const cached = await this.getAsync<T>(key);
    if (cached !== null) {
      return cached;
    }

    const freshData = await fetchFn();
    this.set(key, freshData, ttlSeconds);
    return freshData;
  }

  /**
   * Invalidate specific key across L1 Memory and L2 Redis
   */
  delete(key: string): void {
    this.deleteMemoryOnly(key);
    if (redisService.isAvailable) {
      redisService.del(key).catch(() => {});
    }
  }

  private deleteMemoryOnly(key: string): void {
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
      this.timers.delete(key);
    }
    this.cache.delete(key);
  }

  /**
   * Invalidate by key prefix across both L1 Memory and L2 Redis (e.g. "attendance:", "http:")
   */
  invalidatePrefix(prefix: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.deleteMemoryOnly(key);
      }
    }

    if (redisService.isAvailable) {
      redisService.delByPattern(`${prefix}*`).catch(() => {});
    }
  }

  clear(): void {
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.timers.clear();
    this.cache.clear();

    if (redisService.isAvailable) {
      redisService.delByPattern('*').catch(() => {});
    }
  }
}

export const cacheService = new CacheService();
