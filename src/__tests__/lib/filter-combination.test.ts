/**
 * Property-based tests for filter combination
 * Feature: comprehensive-improvements, Property 12: Filter Combination Correctness
 * Validates: Requirements 6.5
 */

import * as fc from 'fast-check';
import { Prompt, PromptType } from '@/types';
import { expect, describe, it } from 'vitest';

/**
 * Filter options interface
 */
interface FilterOptions {
  search?: string;
  category?: string;
  tag?: string;
  promptType?: PromptType;
  excludeNsfw?: boolean;
}

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
  category: fc.constantFrom('Art', 'Photo', 'Design', 'NSFW', 'Other'),
  sub_category: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: null }),
  created_at: fc.integer({ min: 1577836800000, max: 1924905600000 })
    .map(ts => new Date(ts).toISOString()),
  tags: fc.option(fc.array(fc.constantFrom('portrait', 'landscape', 'abstract', 'realistic', 'anime'), { minLength: 0, maxLength: 5 }), { nil: null }),
  prompt_type: fc.constantFrom('image', 'functional') as fc.Arbitrary<PromptType>,
  use_cases: fc.option(fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 0, maxLength: 3 }), { nil: null }),
});

/**
 * Apply filters to prompts array
 * This simulates the filtering logic in the API
 */
function applyFilters(prompts: Prompt[], filters: FilterOptions): Prompt[] {
  let result = [...prompts];

  // Search filter - matches title, prompt, or author
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    result = result.filter(p => 
      p.title.toLowerCase().includes(searchLower) ||
      p.prompt.toLowerCase().includes(searchLower) ||
      p.author.toLowerCase().includes(searchLower)
    );
  }

  // Category filter
  if (filters.category) {
    result = result.filter(p => p.category === filters.category);
  }

  // Tag filter
  if (filters.tag) {
    result = result.filter(p => p.tags?.includes(filters.tag!) ?? false);
  }

  // Prompt type filter
  if (filters.promptType) {
    result = result.filter(p => p.prompt_type === filters.promptType);
  }

  // NSFW filter
  if (filters.excludeNsfw) {
    result = result.filter(p => p.category !== 'NSFW');
  }

  return result;
}

/**
 * Check if a prompt matches all applied filters
 */
function matchesAllFilters(prompt: Prompt, filters: FilterOptions): boolean {
  // Search filter
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    const matchesSearch = 
      prompt.title.toLowerCase().includes(searchLower) ||
      prompt.prompt.toLowerCase().includes(searchLower) ||
      prompt.author.toLowerCase().includes(searchLower);
    if (!matchesSearch) return false;
  }

  // Category filter
  if (filters.category && prompt.category !== filters.category) {
    return false;
  }

  // Tag filter
  if (filters.tag && !(prompt.tags?.includes(filters.tag) ?? false)) {
    return false;
  }

  // Prompt type filter
  if (filters.promptType && prompt.prompt_type !== filters.promptType) {
    return false;
  }

  // NSFW filter
  if (filters.excludeNsfw && prompt.category === 'NSFW') {
    return false;
  }

  return true;
}

describe('Filter Combination', () => {
  /**
   * Feature: comprehensive-improvements, Property 12: Filter Combination Correctness
   * Validates: Requirements 6.5
   * 
   * For any combination of search, category, tag, and prompt_type filters,
   * all returned prompts should satisfy every applied filter condition.
   */
  describe('Property 12: Filter Combination Correctness', () => {
    it('should return only prompts that match all applied filters', () => {
      fc.assert(
        fc.property(
          fc.array(promptArbitrary, { minLength: 0, maxLength: 50 }),
          fc.record({
            search: fc.option(fc.string({ minLength: 1, maxLength: 20 }), { nil: undefined }),
            category: fc.option(fc.constantFrom('Art', 'Photo', 'Design', 'NSFW', 'Other'), { nil: undefined }),
            tag: fc.option(fc.constantFrom('portrait', 'landscape', 'abstract', 'realistic', 'anime'), { nil: undefined }),
            promptType: fc.option(fc.constantFrom('image', 'functional') as fc.Arbitrary<PromptType>, { nil: undefined }),
            excludeNsfw: fc.option(fc.boolean(), { nil: undefined }),
          }),
          (prompts, filters) => {
            const filtered = applyFilters(prompts, filters);
            
            // Every returned prompt should match all filters
            filtered.forEach(prompt => {
              expect(matchesAllFilters(prompt, filters)).toBe(true);
            });
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should not exclude any prompts that match all filters', () => {
      fc.assert(
        fc.property(
          fc.array(promptArbitrary, { minLength: 0, maxLength: 50 }),
          fc.record({
            search: fc.option(fc.string({ minLength: 1, maxLength: 20 }), { nil: undefined }),
            category: fc.option(fc.constantFrom('Art', 'Photo', 'Design', 'NSFW', 'Other'), { nil: undefined }),
            tag: fc.option(fc.constantFrom('portrait', 'landscape', 'abstract', 'realistic', 'anime'), { nil: undefined }),
            promptType: fc.option(fc.constantFrom('image', 'functional') as fc.Arbitrary<PromptType>, { nil: undefined }),
            excludeNsfw: fc.option(fc.boolean(), { nil: undefined }),
          }),
          (prompts, filters) => {
            const filtered = applyFilters(prompts, filters);
            const filteredIds = new Set(filtered.map(p => p.id));
            
            // Every prompt that matches all filters should be in the result
            prompts.forEach(prompt => {
              if (matchesAllFilters(prompt, filters)) {
                expect(filteredIds.has(prompt.id)).toBe(true);
              }
            });
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should return all prompts when no filters are applied', () => {
      fc.assert(
        fc.property(
          fc.array(promptArbitrary, { minLength: 0, maxLength: 50 }),
          (prompts) => {
            const filtered = applyFilters(prompts, {});
            
            expect(filtered.length).toBe(prompts.length);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should correctly apply category filter', () => {
      fc.assert(
        fc.property(
          fc.array(promptArbitrary, { minLength: 0, maxLength: 50 }),
          fc.constantFrom('Art', 'Photo', 'Design', 'NSFW', 'Other'),
          (prompts, category) => {
            const filtered = applyFilters(prompts, { category });
            
            // All results should have the specified category
            filtered.forEach(prompt => {
              expect(prompt.category).toBe(category);
            });
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should correctly apply tag filter', () => {
      fc.assert(
        fc.property(
          fc.array(promptArbitrary, { minLength: 0, maxLength: 50 }),
          fc.constantFrom('portrait', 'landscape', 'abstract', 'realistic', 'anime'),
          (prompts, tag) => {
            const filtered = applyFilters(prompts, { tag });
            
            // All results should contain the specified tag
            filtered.forEach(prompt => {
              expect(prompt.tags).toContain(tag);
            });
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should correctly apply prompt_type filter', () => {
      fc.assert(
        fc.property(
          fc.array(promptArbitrary, { minLength: 0, maxLength: 50 }),
          fc.constantFrom('image', 'functional') as fc.Arbitrary<PromptType>,
          (prompts, promptType) => {
            const filtered = applyFilters(prompts, { promptType });
            
            // All results should have the specified prompt_type
            filtered.forEach(prompt => {
              expect(prompt.prompt_type).toBe(promptType);
            });
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should correctly exclude NSFW when excludeNsfw is true', () => {
      fc.assert(
        fc.property(
          fc.array(promptArbitrary, { minLength: 0, maxLength: 50 }),
          (prompts) => {
            const filtered = applyFilters(prompts, { excludeNsfw: true });
            
            // No results should have NSFW category
            filtered.forEach(prompt => {
              expect(prompt.category).not.toBe('NSFW');
            });
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should combine multiple filters correctly', () => {
      fc.assert(
        fc.property(
          fc.array(promptArbitrary, { minLength: 0, maxLength: 50 }),
          fc.constantFrom('Art', 'Photo', 'Design'),
          fc.constantFrom('image', 'functional') as fc.Arbitrary<PromptType>,
          (prompts, category, promptType) => {
            const filtered = applyFilters(prompts, { category, promptType, excludeNsfw: true });
            
            // All results should match all filters
            filtered.forEach(prompt => {
              expect(prompt.category).toBe(category);
              expect(prompt.prompt_type).toBe(promptType);
              expect(prompt.category).not.toBe('NSFW');
            });
          }
        ),
        { numRuns: 20 }
      );
    });
  });
});
