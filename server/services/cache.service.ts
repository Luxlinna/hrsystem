interface CacheItem<T> {
  data: T;
  expiry: number;
}

export class CacheService {
  private cache = new Map<string, CacheItem<any>>();
  private timers = new Map<string, NodeJS.Timeout>();

  /**
   * Get an item from cache
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
   * Set an item in cache with TTL in seconds (default: 60s)
   */
  set<T>(key: string, data: T, ttlSeconds = 60): void {
    // Clear existing timer if any
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
    }

    this.cache.set(key, {
      data,
      expiry: Date.now() + ttlSeconds * 1000,
    });

    // Schedule auto-cleanup
    const timer = setTimeout(() => {
      this.delete(key);
    }, ttlSeconds * 1000);

    this.timers.set(key, timer);
  }

  /**
   * Wrap an async function with automatic caching
   */
  async getOrSet<T>(key: string, fetchFn: () => Promise<T>, ttlSeconds = 60): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const freshData = await fetchFn();
    this.set(key, freshData, ttlSeconds);
    return freshData;
  }

  /**
   * Invalidate by key or key prefix (e.g. invalidatePrefix('http:'))
   */
  delete(key: string): void {
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
      this.timers.delete(key);
    }
    this.cache.delete(key);
  }

  invalidatePrefix(prefix: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.delete(key);
      }
    }
  }

  clear(): void {
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.timers.clear();
    this.cache.clear();
  }
}

export const cacheService = new CacheService();
