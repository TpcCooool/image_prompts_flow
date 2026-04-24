/**
 * Property-based tests for API client
 * Feature: comprehensive-improvements, Property 4: Standardized API Error Response
 * Validates: Requirements 1.4
 */

import * as fc from 'fast-check';
import { createErrorResponse, createSuccessResponse, ApiResponse } from '@/lib/api-client';
import { expect, describe, it } from 'vitest';


describe('API Client', () => {
  /**
   * Feature: comprehensive-improvements, Property 4: Standardized API Error Response
   * Validates: Requirements 1.4
   * 
   * For any API route error, the response should conform to the ErrorResponse interface
   * with success=false and an error message.
   */
  describe('Property 4: Standardized API Error Response', () => {
    it('should always produce error responses with success=false and error message', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }),
          fc.option(fc.string({ minLength: 1 }), { nil: undefined }),
          (errorMessage, errorCode) => {
            const response = createErrorResponse(errorMessage, errorCode);
            
            // Must have success = false
            expect(response.success).toBe(false);
            
            // Must have error message
            expect(response.error).toBe(errorMessage);
            
            // Must not have data
            expect(response.data).toBeUndefined();
            
            // Code should be present only if provided
            if (errorCode !== undefined) {
              expect((response as { code?: string }).code).toBe(errorCode);
            }
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should produce valid error response structure for any error string', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }),
          (errorMessage) => {
            const response = createErrorResponse(errorMessage);
            
            // Verify structure matches ApiErrorResponse interface
            const keys = Object.keys(response);
            expect(keys).toContain('success');
            expect(keys).toContain('error');
            expect(response.success).toBe(false);
            expect(typeof response.error).toBe('string');
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  describe('Success Response', () => {
    it('should always produce success responses with success=true and data', () => {
      fc.assert(
        fc.property(
          fc.anything(),
          (data) => {
            const response = createSuccessResponse(data);
            
            // Must have success = true
            expect(response.success).toBe(true);
            
            // Must have data
            expect(response.data).toEqual(data);
            
            // Must not have error
            expect(response.error).toBeUndefined();
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should include pagination when provided', () => {
      fc.assert(
        fc.property(
          fc.anything(),
          fc.record({
            page: fc.integer({ min: 1, max: 1000 }),
            limit: fc.integer({ min: 1, max: 100 }),
            total: fc.integer({ min: 0, max: 10000 }),
            totalPages: fc.integer({ min: 0, max: 1000 }),
            hasMore: fc.boolean(),
          }),
          (data, pagination) => {
            const response = createSuccessResponse(data, pagination);
            
            expect(response.success).toBe(true);
            expect(response.data).toEqual(data);
            expect(response.pagination).toEqual(pagination);
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  describe('Response Type Discrimination', () => {
    it('should allow type discrimination based on success field', () => {
      fc.assert(
        fc.property(
          fc.boolean(),
          fc.string({ minLength: 1 }),
          fc.oneof(
            fc.string(),
            fc.integer(),
            fc.boolean(),
            fc.array(fc.string()),
            fc.record({ key: fc.string() })
          ),
          (isSuccess, message, data) => {
            const response: ApiResponse<unknown> = isSuccess
              ? createSuccessResponse(data)
              : createErrorResponse(message);
            
            if (response.success) {
              // TypeScript should know this is a success response
              // data field exists in the response (may be any value including null)
              expect('data' in response).toBe(true);
              expect(response.error).toBeUndefined();
            } else {
              // TypeScript should know this is an error response
              expect(response.error).toBeDefined();
              expect(response.data).toBeUndefined();
            }
          }
        ),
        { numRuns: 20 }
      );
    });
  });
});
