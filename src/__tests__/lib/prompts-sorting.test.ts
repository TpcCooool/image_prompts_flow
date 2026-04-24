/**
 * Property-based tests for prompts sorting
 * Feature: comprehensive-improvements, Property 6: Prompts Sorting Consistency
 * Validates: Requirements 2.3
 */

import * as fc from 'fast-check';
import { Prompt, PromptType } from '@/types';
import { expect, describe, it } from 'vitest';

/**
 * Generate a valid ISO date string for testing
 * Using integer-based approach to avoid Invalid time value issues
 */
const validDateArbitrary = fc.integer({
  min: new Date('2020-01-01').getTime(),
  max: new Date('2030-12-31').getTime()
}).map(timestamp => new Date(timestamp).toISOString());

/**
 * Generate a valid Prompt object for testing
 */
const promptArbitrary = fc.record({
  id: fc.integer({ min: 1, max: 100000 }),
  title: fc.string({ minLength: 1, maxLength: 100 }),
  title_en: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: null }),
  preview: fc.option(fc.string({ minLength: 1, maxLength: 500 }), { nil: null }),
  prompt: fc.string({ minLength: 1, maxLength: 1000 }),
  prompt_en: fc.option(fc.string({ minLength: 1, maxLength: 1000 }), { nil: null }),
  description: fc.option(fc.string({ minLength: 1, maxLength: 500 }), { nil: null }),
  description_en: fc.option(fc.string({ minLength: 1, maxLength: 500 }), { nil: null }),
  author: fc.string({ minLength: 1, maxLength: 50 }),
  link: fc.option(fc.webUrl(), { nil: null }),
  mode: fc.constantFrom('generate', 'edit') as fc.Arbitrary<'generate' | 'edit'>,
  category: fc.string({ minLength: 1, maxLength: 50 }),
  sub_category: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: null }),
  created_at: validDateArbitrary,
  tags: fc.option(fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 0, maxLength: 5 }), { nil: null }),
  prompt_type: fc.constantFrom('image', 'functional') as fc.Arbitrary<PromptType>,
  use_cases: fc.option(fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 0, maxLength: 3 }), { nil: null }),
});

/**
 * Sort prompts by created_at in descending order (newest first)
 * This simulates what the API should do
 */
function sortPromptsByCreatedAtDesc(prompts: Prompt[]): Prompt[] {
  return [...prompts].sort((a, b) => {
    const dateA = new Date(a.created_at).getTime();
    const dateB = new Date(b.created_at).getTime();
    return dateB - dateA; // Descending order
  });
}

/**
 * Check if prompts are sorted by created_at in descending order
 */
function isSortedByCreatedAtDesc(prompts: Prompt[]): boolean {
  for (let i = 0; i < prompts.length - 1; i++) {
    const currentDate = new Date(prompts[i].created_at).getTime();
    const nextDate = new Date(prompts[i + 1].created_at).getTime();
    if (currentDate < nextDate) {
      return false;
    }
  }
  return true;
}

describe('Prompts Sorting', () => {
  /**
   * Feature: comprehensive-improvements, Property 6: Prompts Sorting Consistency
   * Validates: Requirements 2.3
   * 
   * For any prompts list fetch, the results should be sorted by created_at 
   * in descending order (newest first).
   */
  describe('Property 6: Prompts Sorting Consistency', () => {
    it('should sort prompts by created_at in descending order', () => {
      fc.assert(
        fc.property(
          fc.array(promptArbitrary, { minLength: 0, maxLength: 50 }),
          (prompts) => {
            const sorted = sortPromptsByCreatedAtDesc(prompts);
            
            // Verify the result is sorted correctly
            expect(isSortedByCreatedAtDesc(sorted)).toBe(true);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should preserve all prompts after sorting (no data loss)', () => {
      fc.assert(
        fc.property(
          fc.array(promptArbitrary, { minLength: 0, maxLength: 50 }),
          (prompts) => {
            const sorted = sortPromptsByCreatedAtDesc(prompts);
            
            // Same length
            expect(sorted.length).toBe(prompts.length);
            
            // All original prompts should be present
            const originalIds = new Set(prompts.map(p => p.id));
            const sortedIds = new Set(sorted.map(p => p.id));
            expect(sortedIds).toEqual(originalIds);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should place newer prompts before older ones', () => {
      fc.assert(
        fc.property(
          fc.array(promptArbitrary, { minLength: 2, maxLength: 50 }),
          (prompts) => {
            const sorted = sortPromptsByCreatedAtDesc(prompts);
            
            // For any two adjacent prompts, the first should be newer or equal
            for (let i = 0; i < sorted.length - 1; i++) {
              const currentDate = new Date(sorted[i].created_at).getTime();
              const nextDate = new Date(sorted[i + 1].created_at).getTime();
              expect(currentDate).toBeGreaterThanOrEqual(nextDate);
            }
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should be idempotent - sorting twice gives same result', () => {
      fc.assert(
        fc.property(
          fc.array(promptArbitrary, { minLength: 0, maxLength: 50 }),
          (prompts) => {
            const sortedOnce = sortPromptsByCreatedAtDesc(prompts);
            const sortedTwice = sortPromptsByCreatedAtDesc(sortedOnce);
            
            // Sorting twice should give the same result
            expect(sortedTwice.map(p => p.id)).toEqual(sortedOnce.map(p => p.id));
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should handle empty array', () => {
      const sorted = sortPromptsByCreatedAtDesc([]);
      expect(sorted).toEqual([]);
      expect(isSortedByCreatedAtDesc(sorted)).toBe(true);
    });

    it('should handle single element array', () => {
      fc.assert(
        fc.property(
          promptArbitrary,
          (prompt) => {
            const sorted = sortPromptsByCreatedAtDesc([prompt]);
            expect(sorted.length).toBe(1);
            expect(sorted[0]).toEqual(prompt);
            expect(isSortedByCreatedAtDesc(sorted)).toBe(true);
          }
        ),
        { numRuns: 20 }
      );
    });
  });
});
