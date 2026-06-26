import { LRUCache } from "lru-cache";

const cache = new LRUCache<string, NonNullable<unknown>>({
  max: 500,
  ttl: 5 * 60 * 1000,
});

export function getCache<T extends NonNullable<unknown>>(key: string): T | undefined {
  return cache.get(key) as T | undefined;
}

export function setCache<T extends NonNullable<unknown>>(key: string, value: T, ttlMs?: number): void {
  if (ttlMs !== undefined) {
    cache.set(key, value, { ttl: ttlMs });
  } else {
    cache.set(key, value);
  }
}

export function invalidateCache(prefix: string): void {
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) {
      cache.delete(key);
    }
  }
}

export function invalidateCacheExact(key: string): void {
  cache.delete(key);
}
