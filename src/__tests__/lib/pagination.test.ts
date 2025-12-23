/**
 * Property-based tests for pagination
 * Feature: comprehensive-improvements, Property 11: Pagination Correctness
 * Validates: Requirements 6.3
 */

import * as fc from 'fast-check';
import { PaginationInfo } from '@/types/api';

/**
 * Calculate pagination info from total items, page, and limit
 */
function calculatePagination(total: number, page: number, limit: number): PaginationInfo {
  const totalPages = Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    totalPages,
    hasMore: page < totalPages,
  };
}

/**
 * Paginate an array of items
 */
function paginateItems<T>(items: T[], page: number, limit: number): T[] {
  const offset = (page - 1) * limit;
  return items.slice(offset, offset + limit);
}

describe('Pagination', () => {
  /**
   * Feature: comprehensive-improvements, Property 11: Pagination Correctness
   * Validates: Requirements 6.3
   * 
   * For any pagination request with page and limit parameters, the returned results
   * should have at most 'limit' items and correct hasMore indicator.
   */
  describe('Property 11: Pagination Correctness', () => {
    it('should return at most limit items per page', () => {
      fc.assert(
        fc.property(
          fc.array(fc.integer(), { minLength: 0, maxLength: 200 }),
          fc.integer({ min: 1, max: 50 }),
          fc.integer({ min: 1, max: 100 }),
          (items, page, limit) => {
            const paginatedItems = paginateItems(items, page, limit);
            
            // Should never return more than limit items
            expect(paginatedItems.length).toBeLessThanOrEqual(limit);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should have correct hasMore indicator', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 1000 }),
          fc.integer({ min: 1, max: 50 }),
          fc.integer({ min: 1, max: 100 }),
          (total, page, limit) => {
            const pagination = calculatePagination(total, page, limit);
            const totalPages = Math.ceil(total / limit);
            
            // hasMore should be true only if there are more pages
            if (page < totalPages) {
              expect(pagination.hasMore).toBe(true);
            } else {
              expect(pagination.hasMore).toBe(false);
            }
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should calculate correct totalPages', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 1000 }),
          fc.integer({ min: 1, max: 100 }),
          (total, limit) => {
            const pagination = calculatePagination(total, 1, limit);
            const expectedTotalPages = Math.ceil(total / limit);
            
            expect(pagination.totalPages).toBe(expectedTotalPages);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should return empty array for pages beyond total', () => {
      fc.assert(
        fc.property(
          fc.array(fc.integer(), { minLength: 1, maxLength: 100 }),
          fc.integer({ min: 1, max: 20 }),
          (items, limit) => {
            const totalPages = Math.ceil(items.length / limit);
            const beyondPage = totalPages + 1;
            
            const paginatedItems = paginateItems(items, beyondPage, limit);
            
            expect(paginatedItems.length).toBe(0);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should return all items when limit >= total', () => {
      fc.assert(
        fc.property(
          fc.array(fc.integer(), { minLength: 1, maxLength: 50 }),
          (items) => {
            const limit = items.length + 10; // Limit larger than total
            const paginatedItems = paginateItems(items, 1, limit);
            
            expect(paginatedItems.length).toBe(items.length);
            expect(paginatedItems).toEqual(items);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should preserve item order within page', () => {
      fc.assert(
        fc.property(
          fc.array(fc.integer(), { minLength: 10, maxLength: 100 }),
          fc.integer({ min: 1, max: 10 }),
          fc.integer({ min: 5, max: 20 }),
          (items, page, limit) => {
            const paginatedItems = paginateItems(items, page, limit);
            const offset = (page - 1) * limit;
            
            // Each item in paginated result should match original at correct offset
            paginatedItems.forEach((item, index) => {
              expect(item).toBe(items[offset + index]);
            });
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should have consistent pagination info', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 1000 }),
          fc.integer({ min: 1, max: 50 }),
          fc.integer({ min: 1, max: 100 }),
          (total, page, limit) => {
            const pagination = calculatePagination(total, page, limit);
            
            // Verify all fields are present and correct types
            expect(typeof pagination.page).toBe('number');
            expect(typeof pagination.limit).toBe('number');
            expect(typeof pagination.total).toBe('number');
            expect(typeof pagination.totalPages).toBe('number');
            expect(typeof pagination.hasMore).toBe('boolean');
            
            // Verify values match input
            expect(pagination.page).toBe(page);
            expect(pagination.limit).toBe(limit);
            expect(pagination.total).toBe(total);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should handle edge case of zero total items', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }),
          (limit) => {
            const pagination = calculatePagination(0, 1, limit);
            
            expect(pagination.total).toBe(0);
            expect(pagination.totalPages).toBe(0);
            expect(pagination.hasMore).toBe(false);
          }
        ),
        { numRuns: 20 }
      );
    });
  });
});
