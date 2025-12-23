import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { MemoryCache, resetCache } from '@/lib/cache';

/**
 * Feature: comprehensive-improvements, Property 5: Cache Round-Trip Consistency
 * Validates: Requirements 2.1, 2.4
 * 
 * For any data stored in cache, retrieving it within the TTL period should return
 * the exact same data, and retrieving after TTL expiration should return null.
 */

describe('MemoryCache', () => {
  let cache: MemoryCache;

  beforeEach(() => {
    cache = new MemoryCache({ ttl: 60000, maxSize: 100 });
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    resetCache();
  });

  describe('Property 5: Cache Round-Trip Consistency', () => {
    it('should return exact same data when retrieved within TTL', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }),
          fc.jsonValue(),
          (key, value) => {
            cache.set(key, value);
            const retrieved = cache.get(key);
            
            // Deep equality check for round-trip consistency
            expect(retrieved).toEqual(value);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should return null after TTL expiration', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }),
          fc.jsonValue(),
          fc.integer({ min: 100, max: 5000 }),
          (key, value, ttl) => {
            const shortTtlCache = new MemoryCache({ ttl, maxSize: 100 });
            shortTtlCache.set(key, value);
            
            // Advance time past TTL
            vi.advanceTimersByTime(ttl + 1);
            
            const retrieved = shortTtlCache.get(key);
            expect(retrieved).toBeNull();
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should return data just before TTL expiration', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }),
          fc.jsonValue(),
          fc.integer({ min: 1000, max: 10000 }),
          (key, value, ttl) => {
            const timedCache = new MemoryCache({ ttl, maxSize: 100 });
            timedCache.set(key, value);
            
            // Advance time to just before TTL
            vi.advanceTimersByTime(ttl - 1);
            
            const retrieved = timedCache.get(key);
            expect(retrieved).toEqual(value);
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  describe('Basic Operations', () => {
    it('should correctly report has() for existing keys', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }),
          fc.jsonValue(),
          (key, value) => {
            cache.set(key, value);
            expect(cache.has(key)).toBe(true);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should correctly report has() as false for non-existing keys', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }),
          (key) => {
            expect(cache.has(key)).toBe(false);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should delete entries correctly', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }),
          fc.jsonValue(),
          (key, value) => {
            cache.set(key, value);
            expect(cache.has(key)).toBe(true);
            
            cache.delete(key);
            expect(cache.has(key)).toBe(false);
            expect(cache.get(key)).toBeNull();
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should clear all entries', () => {
      fc.assert(
        fc.property(
          fc.array(fc.tuple(fc.string({ minLength: 1 }), fc.jsonValue()), { minLength: 1, maxLength: 10 }),
          (entries) => {
            // Add all entries
            for (const [key, value] of entries) {
              cache.set(key, value);
            }
            
            expect(cache.size).toBeGreaterThan(0);
            
            cache.clear();
            
            expect(cache.size).toBe(0);
            
            // Verify all entries are gone
            for (const [key] of entries) {
              expect(cache.has(key)).toBe(false);
            }
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  describe('LRU Eviction', () => {
    it('should evict least recently used entries when maxSize is reached', () => {
      const smallCache = new MemoryCache({ ttl: 60000, maxSize: 3 });
      
      // Add 3 entries
      smallCache.set('key1', 'value1');
      smallCache.set('key2', 'value2');
      smallCache.set('key3', 'value3');
      
      expect(smallCache.size).toBe(3);
      
      // Access key1 to make it recently used
      smallCache.get('key1');
      
      // Add a 4th entry - should evict key2 (least recently used)
      smallCache.set('key4', 'value4');
      
      expect(smallCache.size).toBe(3);
      expect(smallCache.has('key1')).toBe(true);
      expect(smallCache.has('key2')).toBe(false); // Evicted
      expect(smallCache.has('key3')).toBe(true);
      expect(smallCache.has('key4')).toBe(true);
    });

    it('should maintain maxSize constraint', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10 }),
          fc.array(fc.tuple(fc.string({ minLength: 1 }), fc.jsonValue()), { minLength: 1, maxLength: 50 }),
          (maxSize, entries) => {
            const limitedCache = new MemoryCache({ ttl: 60000, maxSize });
            
            for (const [key, value] of entries) {
              limitedCache.set(key, value);
            }
            
            expect(limitedCache.size).toBeLessThanOrEqual(maxSize);
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  describe('TTL Override', () => {
    it('should respect per-entry TTL override', () => {
      const defaultTtl = 10000;
      const overrideTtl = 5000;
      const ttlCache = new MemoryCache({ ttl: defaultTtl, maxSize: 100 });
      
      ttlCache.set('default', 'value1');
      ttlCache.set('override', 'value2', overrideTtl);
      
      // Advance past override TTL but before default TTL
      vi.advanceTimersByTime(overrideTtl + 1);
      
      expect(ttlCache.get('default')).toBe('value1');
      expect(ttlCache.get('override')).toBeNull();
    });
  });
});
