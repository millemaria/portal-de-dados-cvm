/**
 * Simple in-memory cache with TTL support.
 * Designed to be easily disabled or replaced.
 */
export class CacheService {
  private cache = new Map<string, { data: unknown; expiresAt: number }>();
  private readonly ttlMs: number;
  private readonly enabled: boolean;

  constructor(ttlSeconds: number = 300, enabled: boolean = true) {
    this.ttlMs = ttlSeconds * 1000;
    this.enabled = enabled;
  }

  get<T>(key: string): T | null {
    if (!this.enabled) return null;

    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  set<T>(key: string, data: T): void {
    if (!this.enabled) return;

    this.cache.set(key, {
      data,
      expiresAt: Date.now() + this.ttlMs,
    });
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  get size(): number {
    return this.cache.size;
  }
}
