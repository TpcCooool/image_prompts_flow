import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import React from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';

/**
 * Feature: comprehensive-improvements, Property 2: Error Boundary Fallback Rendering
 * Validates: Requirements 1.2
 * 
 * For any React component that throws an error within an ErrorBoundary,
 * the fallback UI should be rendered instead of the error-throwing component.
 */

// Component that throws an error
function ThrowingComponent({ error }: { error: Error }): React.ReactNode {
  throw error;
}

// Component that renders normally
function NormalComponent({ text }: { text: string }) {
  return <div data-testid="normal-content">{text}</div>;
}

describe('ErrorBoundary', () => {
  // Suppress console.error during tests since we expect errors
  const originalError = console.error;
  
  beforeEach(() => {
    console.error = vi.fn();
  });

  afterEach(() => {
    console.error = originalError;
    cleanup();
  });

  describe('Property 2: Error Boundary Fallback Rendering', () => {
    it('should render fallback UI when child throws error with any message', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 200 }),
          (errorMessage) => {
            cleanup(); // Clean up before each iteration
            const error = new Error(errorMessage);
            
            const { container } = render(
              <ErrorBoundary>
                <ThrowingComponent error={error} />
              </ErrorBoundary>
            );

            // Should render fallback UI, not the throwing component
            expect(container.textContent).toContain('出错了');
            expect(container.textContent).toContain(errorMessage);
            expect(screen.queryByTestId('normal-content')).toBeNull();
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should render custom fallback when provided', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.string({ minLength: 1, maxLength: 100 }),
          (errorMessage, fallbackText) => {
            cleanup(); // Clean up before each iteration
            const error = new Error(errorMessage);
            const customFallback = <div data-testid="custom-fallback">{fallbackText}</div>;
            
            render(
              <ErrorBoundary fallback={customFallback}>
                <ThrowingComponent error={error} />
              </ErrorBoundary>
            );

            expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
            expect(screen.getByTestId('custom-fallback').textContent).toBe(fallbackText);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should call onError callback when error occurs', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }),
          (errorMessage) => {
            cleanup(); // Clean up before each iteration
            const error = new Error(errorMessage);
            const onError = vi.fn();
            
            render(
              <ErrorBoundary onError={onError}>
                <ThrowingComponent error={error} />
              </ErrorBoundary>
            );

            expect(onError).toHaveBeenCalledTimes(1);
            expect(onError).toHaveBeenCalledWith(
              error,
              expect.objectContaining({
                componentStack: expect.any(String),
              })
            );
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should render children normally when no error occurs', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 200 }),
          (text) => {
            cleanup(); // Clean up before each iteration
            render(
              <ErrorBoundary>
                <NormalComponent text={text} />
              </ErrorBoundary>
            );

            expect(screen.getByTestId('normal-content')).toBeInTheDocument();
            expect(screen.getByTestId('normal-content').textContent).toBe(text);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should reset error state when reset button is clicked', () => {
      const error = new Error('Test error');
      const onReset = vi.fn();
      
      // Create a component that can toggle between throwing and not throwing
      let shouldThrow = true;
      function ConditionalThrow() {
        if (shouldThrow) {
          throw error;
        }
        return <div data-testid="recovered">Recovered</div>;
      }

      const { rerender } = render(
        <ErrorBoundary onReset={onReset} key="boundary">
          <ConditionalThrow />
        </ErrorBoundary>
      );

      // Should show error UI
      expect(screen.getByText('出错了')).toBeInTheDocument();

      // Stop throwing before clicking reset
      shouldThrow = false;

      // Click reset button
      const resetButton = screen.getByRole('button', { name: /重试/i });
      fireEvent.click(resetButton);

      expect(onReset).toHaveBeenCalledTimes(1);

      // Re-render to see the recovered state
      rerender(
        <ErrorBoundary onReset={onReset} key="boundary">
          <ConditionalThrow />
        </ErrorBoundary>
      );

      expect(screen.getByTestId('recovered')).toBeInTheDocument();
    });

    it('should capture error state correctly for various error types', () => {
      const errorTypes = [
        new Error('Standard error'),
        new TypeError('Type error'),
        new RangeError('Range error'),
        new SyntaxError('Syntax error'),
      ];

      errorTypes.forEach((error) => {
        const { container, unmount } = render(
          <ErrorBoundary>
            <ThrowingComponent error={error} />
          </ErrorBoundary>
        );

        expect(container.textContent).toContain('出错了');
        expect(container.textContent).toContain(error.message);
        
        unmount();
      });
    });

    it('should handle nested error boundaries correctly', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.string({ minLength: 1, maxLength: 100 }),
          (outerFallback, innerFallback) => {
            cleanup(); // Clean up before each iteration
            const error = new Error('Inner error');
            
            render(
              <ErrorBoundary fallback={<div data-testid="outer-fallback">{outerFallback}</div>}>
                <div>
                  <ErrorBoundary fallback={<div data-testid="inner-fallback">{innerFallback}</div>}>
                    <ThrowingComponent error={error} />
                  </ErrorBoundary>
                </div>
              </ErrorBoundary>
            );

            // Inner boundary should catch the error
            expect(screen.getByTestId('inner-fallback')).toBeInTheDocument();
            expect(screen.getByTestId('inner-fallback').textContent).toBe(innerFallback);
            // Outer boundary should not show fallback
            expect(screen.queryByTestId('outer-fallback')).toBeNull();
          }
        ),
        { numRuns: 20 }
      );
    });
  });
});
