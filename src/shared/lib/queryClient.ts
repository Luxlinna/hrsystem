import { api } from './apiClient';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

class QueryClient {
  private cache = new Map<string, CacheEntry<any>>();
  private inflight = new Map<string, Promise<any>>();

  /**
   * Fetch with automatic deduplication, in-memory caching & stale-while-revalidate
   * @param key Cache key or endpoint path
   * @param fetcher Async fetch function
   * @param maxAgeMs Maximum age before data is considered stale (default: 30s)
   */
  async fetch<T>(
    key: string,
    fetcher: () => Promise<T> = () => api.get<T>(key),
    maxAgeMs = 30_000
  ): Promise<T> {
    const cached = this.cache.get(key);
    const isFresh = cached && Date.now() - cached.timestamp < maxAgeMs;

    // Return instant cached data if fresh
    if (isFresh) {
      return cached.data;
    }

    // Deduplicate identical in-flight promises
    if (this.inflight.has(key)) {
      return this.inflight.get(key) as Promise<T>;
    }

    const promise = fetcher()
      .then((data) => {
        this.cache.set(key, { data, timestamp: Date.now() });
        this.inflight.delete(key);
        return data;
      })
      .catch((err) => {
        this.inflight.delete(key);
        // If we have stale data and network fails, fallback to stale data
        if (cached) {
          console.warn(`[QueryClient] Network request failed for ${key}, falling back to stale cache.`);
          return cached.data;
        }
        throw err;
      });

    this.inflight.set(key, promise);
    return promise;
  }

  /**
   * Invalidate cache entry or key prefix
   */
  invalidate(keyPrefix: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(keyPrefix)) {
        this.cache.delete(key);
      }
    }
  }

  clear(): void {
    this.cache.clear();
    this.inflight.clear();
  }
}

export const queryClient = new QueryClient();
