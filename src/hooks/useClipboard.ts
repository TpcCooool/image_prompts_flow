'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

export interface UseClipboardOptions {
  /** Duration in ms before copied state resets (default: 2000) */
  resetDelay?: number;
}

export interface UseClipboardReturn {
  /** Copy text to clipboard */
  copy: (text: string) => Promise<boolean>;
  /** Whether text was recently copied */
  copied: boolean;
  /** Manually reset copied state */
  reset: () => void;
}

/**
 * Hook for clipboard operations with copy feedback
 * Handles clipboard API errors gracefully and manages copied state with auto-reset
 */
export function useClipboard(options: UseClipboardOptions = {}): UseClipboardReturn {
  const { resetDelay = 2000 } = options;
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const reset = useCallback(() => {
    setCopied(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const copy = useCallback(async (text: string): Promise<boolean> => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    try {
      // Check if clipboard API is available
      if (!navigator?.clipboard?.writeText) {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        textArea.style.top = '-9999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
          const success = document.execCommand('copy');
          document.body.removeChild(textArea);
          
          if (success) {
            setCopied(true);
            timeoutRef.current = setTimeout(() => {
              setCopied(false);
            }, resetDelay);
            return true;
          }
          return false;
        } catch {
          document.body.removeChild(textArea);
          return false;
        }
      }

      // Use modern clipboard API
      await navigator.clipboard.writeText(text);
      setCopied(true);
      
      // Auto-reset after delay
      timeoutRef.current = setTimeout(() => {
        setCopied(false);
      }, resetDelay);
      
      return true;
    } catch (error) {
      // Handle clipboard API errors gracefully
      console.error('Failed to copy to clipboard:', error);
      return false;
    }
  }, [resetDelay]);

  return {
    copy,
    copied,
    reset,
  };
}
