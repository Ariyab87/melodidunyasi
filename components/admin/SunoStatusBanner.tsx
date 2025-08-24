'use client';

import { useSunoStatus } from '@/lib/sunoStatusContext';
import { CheckCircle, XCircle, AlertTriangle, RefreshCw } from 'lucide-react';

export default function SunoStatusBanner() {
  const { status, loading, error, lastChecked, checkStatus } = useSunoStatus();

  if (loading && !status) {
    return (
      <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-3">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600 mr-2"></div>
          <span className="text-yellow-800 text-sm">Checking music provider status...</span>
        </div>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="bg-red-50 border-b border-red-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <XCircle className="w-5 h-5 text-red-600 mr-2" />
            <span className="text-red-800 text-sm font-medium">
              Unable to check music provider status
            </span>
          </div>
          <button
            onClick={checkStatus}
            className="text-red-600 hover:text-red-800 text-sm font-medium flex items-center"
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  const isOnline = status.ok;
  const region = status.region;
  const provider = status.provider || 'unknown';
  const baseUrl = status.baseUrl || 'unknown';
  const proxyInfo = status.viaProxy ? ` via ${status.proxyUrl}` : '';

  // Format provider display name
  const getProviderDisplayName = (provider: string) => {
    switch (provider) {
      case 'suno_official':
        return 'Official Suno API';
      case 'sunoapi_org':
        return 'SunoAPI.org Reseller';
      default:
        return provider;
    }
  };

  return (
    <div className={`border-b px-4 py-3 ${
      isOnline 
        ? 'bg-green-50 border-green-200' 
        : 'bg-red-50 border-red-200'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          {isOnline ? (
            <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
          ) : (
            <XCircle className="w-5 h-5 text-red-600 mr-2" />
          )}
          <span className={`text-sm font-medium ${
            isOnline ? 'text-green-800' : 'text-red-800'
          }`}>
            Music provider: {getProviderDisplayName(provider)} • {isOnline ? 'Online' : 'Unavailable'} ({region})
            {proxyInfo && <span className="text-xs opacity-75">{proxyInfo}</span>}
          </span>
        </div>
        
        <div className="flex items-center space-x-3">
          <span className={`text-xs ${
            isOnline ? 'text-green-600' : 'text-red-600'
          }`}>
            Last checked: {lastChecked ? lastChecked.toLocaleTimeString() : 'Never'}
          </span>
          <button
            onClick={checkStatus}
            className={`text-xs font-medium flex items-center hover:opacity-80 ${
              isOnline ? 'text-green-600' : 'text-red-600'
            }`}
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Refresh
          </button>
        </div>
      </div>
      
      {error && (
        <div className="mt-2 text-xs text-red-600">
          Error: {error}
        </div>
      )}
      
      {/* Show provider details */}
      <div className="mt-2 text-xs text-gray-600">
        <span className="font-medium">Provider:</span> {getProviderDisplayName(provider)} • 
        <span className="font-medium"> Base URL:</span> {baseUrl}
      </div>
    </div>
  );
}
