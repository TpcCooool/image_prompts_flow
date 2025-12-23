import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { renderHook, act } from '@testing-library/react';
import { useClipboard } from '@/hooks/useClipboard';

/**
 * Feature: comprehensive-improvements, Property 10: Clipboard Copy Feedback
 * Validates: Requirements 4.5
 * 
 * For any text copied using useClipboard, the copied state should become true
 * immediately after successful copy and reset after the specified duration.
 */

describe('useClipboard', () => {
  let mockWriteText: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    mockWriteText = vi.fn().mockResolvedValue(undefined);
    
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: mockWriteText,
      },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('Property 10: Clipboard Copy Feedback', () => {
    it('should set copied to true immediately after successful copy for various texts', async () => {
      // Generate test cases upfront
      const testCases = fc.sample(fc.string({ minLength: 1 }), 100);
      
      for (const text of testCases) {
        mockWriteText.mockClear();
        
        const { result, unmount } = renderHook(() => useClipboard());
        
        expect(result.current.copied).toBe(false);
        
        await act(async () => {
          const success = await result.current.copy(text);
          expect(success).toBe(true);
        });
        
        expect(result.current.copied).toBe(true);
        expect(mockWriteText).toHaveBeenCalledWith(text);
        
        unmount();
      }
    });

    it('should reset copied state after specified duration', async () => {
      // Generate test cases upfront
      const testCases = fc.sample(
        fc.record({
          text: fc.string({ minLength: 1 }),
          resetDelay: fc.integer({ min: 500, max: 5000 }),
        }),
        100
      );
      
      for (const { text, resetDelay } of testCases) {
        mockWriteText.mockClear();
        
        const { result, unmount } = renderHook(() => useClipboard({ resetDelay }));
        
        await act(async () => {
          await result.current.copy(text);
        });
        
        expect(result.current.copied).toBe(true);
        
        // Advance time just before reset
        act(() => {
          vi.advanceTimersByTime(resetDelay - 1);
        });
        
        expect(result.current.copied).toBe(true);
        
        // Advance time past reset
        act(() => {
          vi.advanceTimersByTime(2);
        });
        
        expect(result.current.copied).toBe(false);
        
        unmount();
      }
    });

    it('should use default reset delay of 2000ms', async () => {
      const { result } = renderHook(() => useClipboard());
      
      await act(async () => {
        await result.current.copy('test');
      });
      
      expect(result.current.copied).toBe(true);
      
      act(() => {
        vi.advanceTimersByTime(1999);
      });
      
      expect(result.current.copied).toBe(true);
      
      act(() => {
        vi.advanceTimersByTime(2);
      });
      
      expect(result.current.copied).toBe(false);
    });

    it('should allow manual reset of copied state', async () => {
      const testCases = fc.sample(fc.string({ minLength: 1 }), 100);
      
      for (const text of testCases) {
        mockWriteText.mockClear();
        
        const { result, unmount } = renderHook(() => useClipboard());
        
        await act(async () => {
          await result.current.copy(text);
        });
        
        expect(result.current.copied).toBe(true);
        
        act(() => {
          result.current.reset();
        });
        
        expect(result.current.copied).toBe(false);
        
        unmount();
      }
    });

    it('should handle clipboard API errors gracefully', async () => {
      mockWriteText.mockRejectedValueOnce(new Error('Clipboard access denied'));
      
      const { result } = renderHook(() => useClipboard());
      
      await act(async () => {
        const success = await result.current.copy('test');
        expect(success).toBe(false);
      });
      
      expect(result.current.copied).toBe(false);
    });

    it('should cancel previous timeout when copying again', async () => {
      const testCases = fc.sample(
        fc.record({
          text1: fc.string({ minLength: 1 }),
          text2: fc.string({ minLength: 1 }),
        }),
        100
      );
      
      for (const { text1, text2 } of testCases) {
        mockWriteText.mockClear();
        
        const resetDelay = 2000;
        const { result, unmount } = renderHook(() => useClipboard({ resetDelay }));
        
        // First copy
        await act(async () => {
          await result.current.copy(text1);
        });
        
        expect(result.current.copied).toBe(true);
        
        // Advance time halfway
        act(() => {
          vi.advanceTimersByTime(resetDelay / 2);
        });
        
        // Second copy - should reset the timer
        await act(async () => {
          await result.current.copy(text2);
        });
        
        expect(result.current.copied).toBe(true);
        
        // Advance time to what would have been the first reset
        act(() => {
          vi.advanceTimersByTime(resetDelay / 2 + 1);
        });
        
        // Should still be copied because second copy reset the timer
        expect(result.current.copied).toBe(true);
        
        // Advance to complete the second timer
        act(() => {
          vi.advanceTimersByTime(resetDelay / 2);
        });
        
        expect(result.current.copied).toBe(false);
        
        unmount();
      }
    });
  });
});
