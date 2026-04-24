import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { ToastProvider, useToast, ToastType } from '@/contexts/ToastContext';

/**
 * Feature: comprehensive-improvements, Property 1: Error Toast Display on API Failure
 * Validates: Requirements 1.1
 * 
 * For any API request that fails, the toast system should be triggered with type 'error'
 * and include a retry action callback.
 */

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ToastProvider>{children}</ToastProvider>
);

describe('ToastContext', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Property 1: Error Toast Display on API Failure', () => {
    it('should add error toast with retry action for any error message', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 200 }),
          (errorMessage) => {
            const { result } = renderHook(() => useToast(), { wrapper });
            
            let retryCallCount = 0;
            const retryAction = {
              label: 'Retry',
              onClick: () => { retryCallCount++; },
            };

            act(() => {
              result.current.addToast({
                type: 'error',
                message: errorMessage,
                action: retryAction,
              });
            });

            expect(result.current.toasts.length).toBe(1);
            expect(result.current.toasts[0].type).toBe('error');
            expect(result.current.toasts[0].message).toBe(errorMessage);
            expect(result.current.toasts[0].action).toBeDefined();
            expect(result.current.toasts[0].action?.label).toBe('Retry');
            
            // Verify retry action is callable
            result.current.toasts[0].action?.onClick();
            expect(retryCallCount).toBe(1);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should support all toast types for any message', () => {
      const toastTypes: ToastType[] = ['success', 'error', 'warning', 'info'];
      
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 200 }),
          fc.constantFrom(...toastTypes),
          (message, type) => {
            const { result } = renderHook(() => useToast(), { wrapper });

            act(() => {
              result.current.addToast({ type, message });
            });

            expect(result.current.toasts.length).toBe(1);
            expect(result.current.toasts[0].type).toBe(type);
            expect(result.current.toasts[0].message).toBe(message);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should auto-dismiss toast after specified duration', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.integer({ min: 1000, max: 10000 }),
          (message, duration) => {
            const { result } = renderHook(() => useToast(), { wrapper });

            act(() => {
              result.current.addToast({
                type: 'error',
                message,
                duration,
              });
            });

            expect(result.current.toasts.length).toBe(1);

            // Advance time just before duration
            act(() => {
              vi.advanceTimersByTime(duration - 1);
            });
            expect(result.current.toasts.length).toBe(1);

            // Advance time past duration
            act(() => {
              vi.advanceTimersByTime(2);
            });
            expect(result.current.toasts.length).toBe(0);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should allow manual removal of toast', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }),
          (message) => {
            const { result } = renderHook(() => useToast(), { wrapper });

            let toastId: string;
            act(() => {
              toastId = result.current.addToast({
                type: 'error',
                message,
                duration: 0, // No auto-dismiss
              });
            });

            expect(result.current.toasts.length).toBe(1);

            act(() => {
              result.current.removeToast(toastId);
            });

            expect(result.current.toasts.length).toBe(0);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should stack multiple toasts', () => {
      fc.assert(
        fc.property(
          fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 1, maxLength: 5 }),
          (messages) => {
            const { result } = renderHook(() => useToast(), { wrapper });

            act(() => {
              messages.forEach((message) => {
                result.current.addToast({
                  type: 'error',
                  message,
                  duration: 0,
                });
              });
            });

            expect(result.current.toasts.length).toBe(messages.length);
            messages.forEach((message, index) => {
              expect(result.current.toasts[index].message).toBe(message);
            });
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should clear all toasts', () => {
      fc.assert(
        fc.property(
          fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 1, maxLength: 5 }),
          (messages) => {
            const { result } = renderHook(() => useToast(), { wrapper });

            act(() => {
              messages.forEach((message) => {
                result.current.addToast({
                  type: 'error',
                  message,
                  duration: 0,
                });
              });
            });

            expect(result.current.toasts.length).toBe(messages.length);

            act(() => {
              result.current.clearToasts();
            });

            expect(result.current.toasts.length).toBe(0);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should generate unique IDs for each toast', () => {
      fc.assert(
        fc.property(
          fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 2, maxLength: 10 }),
          (messages) => {
            const { result } = renderHook(() => useToast(), { wrapper });

            const ids: string[] = [];
            act(() => {
              messages.forEach((message) => {
                const id = result.current.addToast({
                  type: 'error',
                  message,
                  duration: 0,
                });
                ids.push(id);
              });
            });

            // All IDs should be unique
            const uniqueIds = new Set(ids);
            expect(uniqueIds.size).toBe(ids.length);
          }
        ),
        { numRuns: 20 }
      );
    });
  });
});
