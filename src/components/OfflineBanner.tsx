'use client';

import React from 'react';
import { WifiOff } from 'lucide-react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

export function OfflineBanner() {
  const { isOffline, isHydrated } = useNetworkStatus();

  // Don't show banner until hydration is complete to avoid false positives
  if (!isHydrated || !isOffline) {
    return null;
  }

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[60] bg-yellow-500 text-yellow-900 
                 px-4 py-2 flex items-center justify-center gap-2
                 animate-slide-down shadow-lg"
      role="alert"
      aria-live="polite"
    >
      <WifiOff className="w-4 h-4" />
      <span className="text-sm font-medium">
        您当前处于离线状态，部分功能可能不可用
      </span>
    </div>
  );
}

export default OfflineBanner;
