'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Music, Clock, CheckCircle, AlertCircle, AlertTriangle, Download, ArrowLeft, RefreshCw, Search } from 'lucide-react';
import Link from 'next/link';

interface SongStatus {
  id: string;
  status: string;
  progress?: number;
  message?: string;
  downloadUrl?: string;
  audioUrl?: string;
  savedFilename?: string;
  createdAt?: string;
  updatedAt?: string;
}

export default function SongStatusPage() {
  const [songId, setSongId] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [songStatus, setSongStatus] = useState<SongStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  
  // Environment variables with defaults
  const MAX_DELAY = parseInt(process.env.NEXT_PUBLIC_POLL_MAX_DELAY || '15000');
  const INITIAL_DELAY = parseInt(process.env.NEXT_PUBLIC_POLL_INITIAL_DELAY || '1000');
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

  const delayRef = useRef(INITIAL_DELAY);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isPollingRef = useRef(true);

  function calculateBackoff(currentDelay: number): number {
    const backoffDelay = Math.min(MAX_DELAY, currentDelay * 1.6);
    const jitter = Math.floor(Math.random() * 500);
    return backoffDelay + jitter;
  }

  const nextDelay = () => {
    const next = Math.min(MAX_DELAY, delayRef.current * 1.6);
    delayRef.current = next;
    return next;
  };

  const fetchSongStatus = async () => {
    try {
      const apiUrl = API_BASE_URL ? `${API_BASE_URL}/api/song/status/${songId}` : `/api/song/status/${songId}`;
      const response = await fetch(apiUrl, {
        cache: 'no-store'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setSongStatus(result);
      setError(null);

      if (isPollingRef.current && ['initializing', 'queued', 'processing'].includes(result.status)) {
        setElapsed(prev => prev + delayRef.current);
        delayRef.current = nextDelay();
        timeoutRef.current = setTimeout(fetchSongStatus, delayRef.current);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      delayRef.current = calculateBackoff(delayRef.current);
      if (isPollingRef.current) {
        timeoutRef.current = setTimeout(fetchSongStatus, delayRef.current);
      }
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (songId.trim()) {
      setIsSearching(true);
      setError(null);
      setSongStatus(null);
      setElapsed(0);
      delayRef.current = INITIAL_DELAY;
      
      await fetchSongStatus();
      setIsSearching(false);
    }
  };

  const handleRetry = async () => {
    if (songId.trim()) {
      setError(null);
      setElapsed(0);
      delayRef.current = INITIAL_DELAY;
      await fetchSongStatus();
    }
  };

  useEffect(() => {
    return () => {
      isPollingRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-dark-900">
      <div className="container mx-auto px-4 py-20">
        {/* Header */}
        <div className="text-center mb-12">
          <Link href="/" className="inline-flex items-center text-primary-400 hover:text-primary-300 mb-6 transition-colors duration-200">
            <ArrowLeft size={20} className="mr-2" />
            Back to Home
          </Link>
          <h1 className="text-4xl font-bold text-white mb-4">Song Status</h1>
          <p className="text-xl text-dark-300 mb-4">Track your song creation progress</p>
        </div>

        {/* Search Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto"
        >
          <div className="bg-dark-800 rounded-lg p-8 border border-dark-700">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-dark-700 rounded-full mb-4">
                <Search size={48} className="text-primary-500" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Check Song Status</h2>
              <p className="text-dark-300">Enter your song ID to check the current status</p>
            </div>

            <form onSubmit={handleSearch} className="space-y-6">
              <div>
                <label htmlFor="songId" className="block text-sm font-medium text-white mb-2">
                  Song ID
                </label>
                <input
                  type="text"
                  id="songId"
                  value={songId}
                  onChange={(e) => setSongId(e.target.value)}
                  placeholder="Enter your song ID here..."
                  className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
                <p className="text-xs text-dark-400 mt-2">
                  You can find your song ID in the confirmation email or from your account dashboard.
                </p>
              </div>

              <button
                type="submit"
                disabled={!songId.trim() || isSearching}
                className={`w-full flex items-center justify-center space-x-2 px-6 py-3 rounded-lg font-medium transition-colors duration-200 ${
                  songId.trim() && !isSearching
                    ? 'bg-primary-600 hover:bg-primary-700 text-white'
                    : 'bg-dark-600 text-dark-400 cursor-not-allowed'
                }`}
              >
                {isSearching ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Searching...</span>
                  </>
                ) : (
                  <>
                    <Search size={20} className="mr-2" />
                    <span>Check Status</span>
                  </>
                )}
              </button>
            </form>

            {/* Help Section */}
            <div className="mt-8 p-4 bg-dark-700 rounded-lg">
              <h3 className="text-lg font-semibold text-white mb-3">Need Help?</h3>
              <div className="space-y-2 text-sm text-dark-300">
                <p>• Check your email for the song ID after submitting a request</p>
                <p>• Song IDs are typically 24 characters long</p>
                <p>• If you can't find your song ID, contact support</p>
                <p>• Status updates happen automatically every few seconds</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Song Status Display */}
        {songStatus && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto mt-8"
          >
            <div className="bg-dark-800 rounded-lg p-8 border border-dark-700">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">Song Status</h2>
                <p className="text-dark-300">ID: {songStatus.id}</p>
              </div>

              {/* Status Indicator */}
              <div className="flex items-center justify-center mb-6">
                {songStatus.status === 'completed' && (
                  <div className="flex items-center text-green-500">
                    <CheckCircle size={24} className="mr-2" />
                    <span className="font-semibold">Completed</span>
                  </div>
                )}
                {songStatus.status === 'processing' && (
                  <div className="flex items-center text-blue-500">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mr-2"></div>
                    <span className="font-semibold">Processing</span>
                  </div>
                )}
                {songStatus.status === 'queued' && (
                  <div className="flex items-center text-yellow-500">
                    <Clock size={24} className="mr-2" />
                    <span className="font-semibold">Queued</span>
                  </div>
                )}
                {songStatus.status === 'failed' && (
                  <div className="flex items-center text-red-500">
                    <AlertTriangle size={24} className="mr-2" />
                    <span className="font-semibold">Failed</span>
                  </div>
                )}
                {songStatus.status === 'initializing' && (
                  <div className="flex items-center text-purple-500">
                    <Music size={24} className="mr-2" />
                    <span className="font-semibold">Initializing</span>
                  </div>
                )}
              </div>

              {/* Progress Bar */}
              {songStatus.progress !== undefined && (
                <div className="mb-6">
                  <div className="flex justify-between text-sm text-dark-300 mb-2">
                    <span>Progress</span>
                    <span>{songStatus.progress}%</span>
                  </div>
                  <div className="w-full bg-dark-700 rounded-full h-2">
                    <div 
                      className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${songStatus.progress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Message */}
              {songStatus.message && (
                <div className="mb-6 p-4 bg-dark-700 rounded-lg">
                  <p className="text-dark-300">{songStatus.message}</p>
                </div>
              )}

              {/* Download Section */}
              {songStatus.status === 'completed' && (songStatus.downloadUrl || songStatus.audioUrl) && (
                <div className="text-center">
                  <a
                    href={songStatus.downloadUrl || songStatus.audioUrl || '#'}
                    download={songStatus.savedFilename || "Generated_Song.mp3"}
                    className="inline-flex items-center px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors duration-200"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Download size={20} className="mr-2" />
                    Download Song
                  </a>
                </div>
              )}

              {/* Elapsed Time */}
              {elapsed > 0 && ['initializing', 'queued', 'processing'].includes(songStatus.status) && (
                <div className="text-center mt-4">
                  <p className="text-sm text-dark-400">
                    Elapsed time: {Math.floor(elapsed / 1000)}s
                  </p>
                </div>
              )}

              {/* Retry Button for Failed Status */}
              {songStatus.status === 'failed' && (
                <div className="text-center mt-4">
                  <button
                    onClick={handleRetry}
                    className="inline-flex items-center px-4 py-2 bg-dark-600 hover:bg-dark-500 text-white rounded-lg font-medium transition-colors duration-200"
                  >
                    <RefreshCw size={16} className="mr-2" />
                    Retry
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Error Display */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto mt-8"
          >
            <div className="bg-red-900/20 border border-red-700 rounded-lg p-6">
              <div className="flex items-center text-red-400 mb-4">
                <AlertCircle size={24} className="mr-2" />
                <h3 className="text-lg font-semibold">Error</h3>
              </div>
              <p className="text-red-300 mb-4">{error}</p>
              <button
                onClick={handleRetry}
                className="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors duration-200"
              >
                <RefreshCw size={16} className="mr-2" />
                Retry
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
