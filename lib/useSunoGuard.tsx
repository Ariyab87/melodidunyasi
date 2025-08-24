'use client';

import { useSunoStatus } from './sunoStatusContext';
import { useState } from 'react';

interface UseSunoGuardReturn {
  canGenerate: boolean;
  checkBeforeGenerate: () => Promise<boolean>;
  showToast: (message: string) => void;
  toastMessage: string | null;
  clearToast: () => void;
}

export function useSunoGuard(): UseSunoGuardReturn {
  const { status, isOnline, checkStatus } = useSunoStatus();
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const canGenerate = isOnline;

  const checkBeforeGenerate = async (): Promise<boolean> => {
    // First check if we have a recent status
    if (!status || !isOnline) {
      // Try to refresh the status
      await checkStatus();
      
      // If still not online, return false
      if (!status?.ok) {
        const region = status?.region || 'unknown';
        const proxyInfo = status?.viaProxy ? ` via ${status.proxyUrl}` : '';
        
        if (status?.code === 'REGION_BLOCK') {
          setToastMessage(
            `Suno unavailable from server region ${region}${proxyInfo}. Try again later or switch region.`
          );
        } else {
          setToastMessage(
            `Suno API is unavailable from server region ${region}${proxyInfo}. Please try again later.`
          );
        }
        return false;
      }
    }

    // If we're online, return true
    return true;
  };

  const showToast = (message: string) => {
    setToastMessage(message);
    // Auto-hide after 5 seconds
    setTimeout(() => setToastMessage(null), 5000);
  };

  const clearToast = () => {
    setToastMessage(null);
  };

  return {
    canGenerate,
    checkBeforeGenerate,
    showToast,
    toastMessage,
    clearToast
  };
}
