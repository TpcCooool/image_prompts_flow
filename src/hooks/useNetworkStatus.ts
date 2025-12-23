'use client';

import { useState, useEffect, useCallback } from 'react';

export interface UseNetworkStatusReturn {
  isOnline: boolean;
  isOffline: boolean;
  isHydrated: boolean;
}

/**
 * Hook to detect browser online/offline status
 * Listens to online/offline events and returns current network state
 * 
 * Uses isHydrated to prevent hydration mismatch - components should
 * only show offline UI after hydration is complete
 */
export function useNetworkStatus(): UseNetworkStatusReturn {
  // Always start with true (online) for SSR consistency
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isHydrated, setIsHydrated] = useState<boolean>(false);

  const handleOnline = useCallback(() => {
    setIsOnline(true);
  }, []);

  const handleOffline = useCallback(() => {
    setIsOnline(false);
  }, []);

  useEffect(() => {
    // Now we're on the client, get the real status
    setIsOnline(navigator.onLine);
    setIsHydrated(true);

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [handleOnline, handleOffline]);

  return {
    isOnline,
    isOffline: !isOnline,
    isHydrated,
  };
}
