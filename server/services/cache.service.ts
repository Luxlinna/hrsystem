import { redisService } from './redis.service.js';

interface CacheItem<T> {
  data: T;
  expiry: number;
}

export class CacheService {
  private cache = new Map<string, CacheItem<any>>();
  private timers = new Map<string, NodeJS.Timeout>();
  private isSubscribed = false;
  private isEnabled = true;

  constructor() {
    this.initPubSub();
  }

  public get enabled(): boolean {
    return this.isEnabled;
  }

  public setEnabled(val: boolean, broadcast = true): void {
    this.isEnabled = val;
    if (!val) {
      this.clearMemoryOnly();
    }
    if (broadcast && redisService.isAvailable) {
      redisService
        .publish(
          'hrms:cache:sync',
          JSON.stringify({ action: 'setEnabled', target: val })
        )
        .catch(() => {});
    }
  }

  public get l1KeysCount(): number {
    return this.cache.size;
  }

  /**
   * Initializes real-time Pub/Sub cache synchronization across multi-server clusters
   */
  public initPubSub(): void {
    if (this.isSubscribed) return;
    if (redisService.isAvailable) {
      this.isSubscribed = true;
      redisService.subscribe('hrms:cache:sync', (msg) => {
        try {
          const payload = JSON.parse(msg);
          if (payload.action === 'invalidatePrefix' && payload.target) {
            this.deleteMemoryOnlyPrefix(payload.target);
          } else if (payload.action === 'delete' && payload.target) {
            this.deleteMemoryOnly(payload.target);
          } else if (payload.action === 'clear') {
            this.clearMemoryOnly();
          } else if (payload.action === 'setEnabled' && typeof payload.target === 'boolean') {
            this.setEnabled(payload.target, false);
          }
        } catch {
          // Ignore malformed broadcast messages
        }
      });
    }
  }

  /**
   * Fast L1 (In-Memory) synchronous retrieval
   */
  get<T>(key: string): T | null {
    if (!this.isEnabled) return null;

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
   * All server nodes read from the same global Redis instance
   */
  async getAsync<T>(key: string): Promise<T | null> {
    if (!this.isEnabled) return null;

    // 1. Check L1 Memory (0ms)
    const memCached = this.get<T>(key);
    if (memCached !== null) {
      return memCached;
    }

    // 2. Check L2 Redis (<2ms shared across all servers)
    if (redisService.isAvailable) {
      const redisCached = await redisService.get<T>(key);
      if (redisCached !== null) {
        // Populate L1 cache on this server node for sub-millisecond future hits
        this.setMemoryOnly(key, redisCached, 60);
        return redisCached;
      }
    }

    return null;
  }

  /**
   * Set an item in cache with TTL in seconds (writes to L1 and Global L2 Redis)
   */
  set<T>(key: string, data: T, ttlSeconds = 60): void {
    if (!this.isEnabled) return;

    this.setMemoryOnly(key, data, ttlSeconds);

    // Asynchronously write to Global Redis L2
    if (redisService.isAvailable) {
      redisService.set(key, data, ttlSeconds).catch(() => {});
    }
  }

  /**
   * Write only to L1 memory on this local node
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
    if (!this.isEnabled) {
      return fetchFn();
    }

    const cached = await this.getAsync<T>(key);
    if (cached !== null) {
      return cached;
    }

    const freshData = await fetchFn();
    this.set(key, freshData, ttlSeconds);
    return freshData;
  }

  /**
   * Invalidate specific key across L1 Memory, L2 Redis, and broadcast to all cluster nodes
   */
  delete(key: string): void {
    this.deleteMemoryOnly(key);
    if (redisService.isAvailable) {
      redisService.del(key).catch(() => {});
      redisService
        .publish('hrms:cache:sync', JSON.stringify({ action: 'delete', target: key }))
        .catch(() => {});
    }
  }

  private deleteMemoryOnly(key: string): void {
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
      this.timers.delete(key);
    }
    this.cache.delete(key);
  }

  private deleteMemoryOnlyPrefix(prefix: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.deleteMemoryOnly(key);
      }
    }
  }

  /**
   * Invalidate by key prefix across L1 Memory, L2 Redis, and broadcast to all cluster nodes
   */
  invalidatePrefix(prefix: string): void {
    this.deleteMemoryOnlyPrefix(prefix);

    if (redisService.isAvailable) {
      redisService.delByPattern(`${prefix}*`).catch(() => {});
      redisService
        .publish(
          'hrms:cache:sync',
          JSON.stringify({ action: 'invalidatePrefix', target: prefix })
        )
        .catch(() => {});
    }
  }

  /**
   * Clear all cache locally, in Redis, and broadcast to cluster
   */
  clear(): void {
    this.clearMemoryOnly();

    if (redisService.isAvailable) {
      redisService.delByPattern('*').catch(() => {});
      redisService.publish('hrms:cache:sync', JSON.stringify({ action: 'clear' })).catch(() => {});
    }
  }

  private clearMemoryOnly(): void {
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.timers.clear();
    this.cache.clear();
  }
}

export const cacheService = new CacheService();
