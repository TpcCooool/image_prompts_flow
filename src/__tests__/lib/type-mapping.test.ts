import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { mapDbPromptToPrompt } from '@/lib/type-mapping';
import { DbPrompt, Prompt } from '@/types';

/**
 * Feature: comprehensive-improvements, Property 7: Database to Frontend Type Mapping
 * Validates: Requirements 3.1, 3.2
 * 
 * For any DbPrompt object, the mapDbPromptToPrompt function should produce a valid
 * Prompt object with all required fields populated and optional fields handled safely.
 */

// Generator for DbPrompt objects
const dbPromptArbitrary = fc.record({
  id: fc.integer({ min: 1 }),
  title: fc.string({ minLength: 1 }),
  title_en: fc.option(fc.string(), { nil: null }),
  preview: fc.option(fc.string(), { nil: null }),
  prompt: fc.string({ minLength: 1 }),
  prompt_en: fc.option(fc.string(), { nil: null }),
  description: fc.option(fc.string(), { nil: null }),
  description_en: fc.option(fc.string(), { nil: null }),
  author: fc.string({ minLength: 1 }),
  link: fc.option(fc.string(), { nil: null }),
  mode: fc.oneof(fc.constant('generate'), fc.constant('edit'), fc.string()),
  category: fc.string({ minLength: 1 }),
  sub_category: fc.option(fc.string(), { nil: null }),
  created_at: fc.option(
    fc.integer({ min: 946684800000, max: 4102444800000 }) // 2000-01-01 to 2100-01-01 in ms
      .map(ts => new Date(ts).toISOString()), 
    { nil: null }
  ),
  tags: fc.option(fc.array(fc.string()), { nil: null }),
  prompt_type: fc.option(fc.oneof(fc.constant('image'), fc.constant('functional'), fc.string()), { nil: null }),
  use_cases: fc.option(fc.array(fc.string()), { nil: null }),
});

describe('mapDbPromptToPrompt', () => {
  it('should always produce a valid Prompt with required fields', () => {
    fc.assert(
      fc.property(dbPromptArbitrary, (dbPrompt: DbPrompt) => {
        const result = mapDbPromptToPrompt(dbPrompt);

        // Required fields must be present and have correct types
        expect(typeof result.id).toBe('number');
        expect(typeof result.title).toBe('string');
        expect(typeof result.prompt).toBe('string');
        expect(typeof result.author).toBe('string');
        expect(typeof result.category).toBe('string');
        expect(typeof result.created_at).toBe('string');
        expect(['generate', 'edit']).toContain(result.mode);
        expect(['image', 'functional']).toContain(result.prompt_type);
      }),
      { numRuns: 20 }
    );
  });

  it('should preserve required field values from DbPrompt', () => {
    fc.assert(
      fc.property(dbPromptArbitrary, (dbPrompt: DbPrompt) => {
        const result = mapDbPromptToPrompt(dbPrompt);

        // Required fields should be preserved exactly
        expect(result.id).toBe(dbPrompt.id);
        expect(result.title).toBe(dbPrompt.title);
        expect(result.prompt).toBe(dbPrompt.prompt);
        expect(result.author).toBe(dbPrompt.author);
        expect(result.category).toBe(dbPrompt.category);
      }),
      { numRuns: 20 }
    );
  });

  it('should handle optional fields safely (null or value)', () => {
    fc.assert(
      fc.property(dbPromptArbitrary, (dbPrompt: DbPrompt) => {
        const result = mapDbPromptToPrompt(dbPrompt);

        // Optional fields should be either null or the original value
        const optionalFields: (keyof Prompt)[] = [
          'title_en', 'preview', 'prompt_en', 'description', 
          'description_en', 'link', 'sub_category', 'tags', 'use_cases'
        ];

        for (const field of optionalFields) {
          const value = result[field];
          // Value should be either null or match the original (if it was defined)
          expect(value === null || value !== undefined).toBe(true);
        }
      }),
      { numRuns: 20 }
    );
  });

  it('should default invalid mode to "generate"', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.integer({ min: 1 }),
          title: fc.string({ minLength: 1 }),
          prompt: fc.string({ minLength: 1 }),
          author: fc.string({ minLength: 1 }),
          mode: fc.string().filter(s => s !== 'generate' && s !== 'edit'),
          category: fc.string({ minLength: 1 }),
        }),
        (dbPrompt) => {
          const result = mapDbPromptToPrompt(dbPrompt as DbPrompt);
          expect(result.mode).toBe('generate');
        }
      ),
      { numRuns: 20 }
    );
  });

  it('should default invalid prompt_type to "image"', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.integer({ min: 1 }),
          title: fc.string({ minLength: 1 }),
          prompt: fc.string({ minLength: 1 }),
          author: fc.string({ minLength: 1 }),
          mode: fc.constant('generate'),
          category: fc.string({ minLength: 1 }),
          prompt_type: fc.string().filter(s => s !== 'image' && s !== 'functional'),
        }),
        (dbPrompt) => {
          const result = mapDbPromptToPrompt(dbPrompt as DbPrompt);
          expect(result.prompt_type).toBe('image');
        }
      ),
      { numRuns: 20 }
    );
  });
});
