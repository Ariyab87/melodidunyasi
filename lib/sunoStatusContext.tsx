'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { API_BASE } from './api';

interface MusicStatus {
  ok: boolean;
  status: number | string;
  provider: string;
  baseUrl: string;
  region: string;
  viaProxy: boolean;
  proxyUrl?: string | null;
  timestamp: string;
  message: string;
  error?: string;
  code?: string;
}

interface MusicStatusContextType {
  status: MusicStatus | null;
  loading: boolean;
  error: string | null;
  lastChecked: Date | null;
  checkStatus: () => Promise<void>;
  isOnline: boolean;
}

const MusicStatusContext = createContext<MusicStatusContextType | undefined>(undefined);

export function useSunoStatus() {
  const context = useContext(MusicStatusContext);
  if (context === undefined) {
    throw new Error('useSunoStatus must be used within a MusicStatusProvider');
  }
  return context;
}

interface MusicStatusProviderProps {
  children: ReactNode;
}

export function SunoStatusProvider({ children }: MusicStatusProviderProps) {
  const [status, setStatus] = useState<MusicStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const checkStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use the new music status endpoint
      const response = await fetch(`${API_BASE}/api/status/music`, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setStatus(data);
      setLastChecked(new Date());
      setError(null);
    } catch (err) {
      console.error('Error checking music provider status:', err);
      setError(err instanceof Error ? err.message : 'Failed to check music provider status');
      
      // Set a default offline status if we can't reach the endpoint
      setStatus({
        ok: false,
        status: 503,
        provider: 'unknown',
        baseUrl: 'unknown',
        region: 'unknown',
        viaProxy: false,
        proxyUrl: null,
        timestamp: new Date().toISOString(),
        message: 'Unable to check music provider status'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check status immediately on mount
    checkStatus();
    
    // Set up interval to check every 60 seconds
    const interval = setInterval(checkStatus, 60000);
    
    return () => clearInterval(interval);
  }, []);

  const value: MusicStatusContextType = {
    status,
    loading,
    error,
    lastChecked,
    checkStatus,
    isOnline: status?.ok === true
  };

  return (
    <MusicStatusContext.Provider value={value}>
      {children}
    </MusicStatusContext.Provider>
  );
}
