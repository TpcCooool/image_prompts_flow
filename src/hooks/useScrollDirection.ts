'use client';

import { useState, useEffect, useCallback } from 'react';

export type ScrollDirection = 'up' | 'down' | null;

interface UseScrollDirectionOptions {
  threshold?: number;
  initialDirection?: ScrollDirection;
}

export interface UseScrollDirectionReturn {
  scrollDirection: ScrollDirection;
  isAtTop: boolean;
  scrollY: number;
}

/**
 * Hook to detect scroll direction for hiding/showing header on mobile
 * @param options - Configuration options
 * @param options.threshold - Minimum scroll distance before direction change is registered (default: 10)
 * @param options.initialDirection - Initial scroll direction (default: null)
 * @returns Object containing scrollDirection, isAtTop, and scrollY
 */
export function useScrollDirection(
  options: UseScrollDirectionOptions = {}
): UseScrollDirectionReturn {
  const { threshold = 10, initialDirection = null } = options;
  
  const [scrollDirection, setScrollDirection] = useState<ScrollDirection>(initialDirection);
  const [scrollY, setScrollY] = useState(0);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isAtTop, setIsAtTop] = useState(true);

  const updateScrollDirection = useCallback(() => {
    const currentScrollY = window.scrollY;
    
    // Update scroll position
    setScrollY(currentScrollY);
    
    // Check if at top of page
    setIsAtTop(currentScrollY < threshold);
    
    // Calculate scroll difference
    const scrollDiff = currentScrollY - lastScrollY;
    
    // Only update direction if scroll exceeds threshold
    if (Math.abs(scrollDiff) >= threshold) {
      const newDirection: ScrollDirection = scrollDiff > 0 ? 'down' : 'up';
      
      if (newDirection !== scrollDirection) {
        setScrollDirection(newDirection);
      }
      
      setLastScrollY(currentScrollY);
    }
  }, [lastScrollY, scrollDirection, threshold]);

  useEffect(() => {
    // Set initial scroll position
    setLastScrollY(window.scrollY);
    setScrollY(window.scrollY);
    setIsAtTop(window.scrollY < threshold);

    // Use passive listener for better scroll performance
    const handleScroll = () => {
      window.requestAnimationFrame(updateScrollDirection);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [updateScrollDirection, threshold]);

  return {
    scrollDirection,
    isAtTop,
    scrollY,
  };
}

export default useScrollDirection;
