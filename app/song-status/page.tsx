'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { API_BASE } from '@/lib/api';

type StatusResp = { 
  ok: boolean; 
  jobId?: string; 
  status: string; 
  audioUrls?: string[]; 
  result?: any; 
  updatedAt?: string 
}

export default function SongStatusPage() {
  const searchParams = useSearchParams();
  const urlSongId = searchParams.get('songId') || '';
  const urlJobId = searchParams.get('jobId') || '';
  
  const [songId, setSongId] = useState(urlSongId);
  const [jobId, setJobId] = useState(urlJobId);
  const [status, setStatus] = useState<string>('pending');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  
  // If we have URL parameters, start polling automatically
  const shouldAutoStart = urlSongId || urlJobId;

  useEffect(() => {
    let alive = true;
    let delay = 1500;
    const maxDelay = 15000;

    async function tick() {
      try {
        const url = jobId
          ? `${API_BASE}/status/song?jobId=${encodeURIComponent(jobId)}`
          : `${API_BASE}/status/song?songId=${encodeURIComponent(songId)}`;
        
        if (!songId && !jobId) return;
        
        const r = await fetch(url, { credentials: 'include' });
        if (!r.ok) throw new Error(`status ${r.status}`);
        const j: StatusResp = await r.json();

        if (!alive) return;
        if (!jobId && j.jobId) setJobId(j.jobId);
        setStatus(j.status || 'pending');
        if (j.audioUrls?.length && !audioUrl) setAudioUrl(j.audioUrls[0]);

        const done = ['success','done'].includes((j.status||'').toLowerCase());
        const failed = ['failed','error'].includes((j.status||'').toLowerCase());
        if (!done && !failed) {
          delay = Math.min(maxDelay, Math.floor(delay * 1.6));
          setTimeout(tick, delay);
        }
        if (failed) setError('Generation failed. Please try again.');
      } catch (e:any) {
        if (!alive) return;
        setError(e.message || 'Status check failed');
        delay = Math.min(maxDelay, Math.floor(delay * 1.6));
        setTimeout(tick, delay);
      }
    }

    if (shouldAutoStart) {
      tick();
    }

    return () => { alive = false };
  }, [songId, jobId, shouldAutoStart, audioUrl]);

  const fetchSongStatus = async () => {
    try {
      const url = jobId
        ? `${API_BASE}/status/song?jobId=${encodeURIComponent(jobId)}`
        : `${API_BASE}/status/song?songId=${encodeURIComponent(songId)}`;
      
      const response = await fetch(url, { credentials: 'include' });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const result: StatusResp = await response.json();
      setStatus(result.status || 'pending');
      if (result.audioUrls?.length) setAudioUrl(result.audioUrls[0]);
      if (result.jobId && !jobId) setJobId(result.jobId);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (songId.trim()) {
      setIsSearching(true);
      setError(null);
      await fetchSongStatus();
      setIsSearching(false);
    }
  };

  const handleRetry = async () => {
    if (songId.trim()) {
      setError(null);
      await fetchSongStatus();
    }
  };

  return (
    <div className="min-h-screen bg-dark-900 text-white">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            {shouldAutoStart ? 'Creating your song…' : 'Song Status Checker'}
          </h1>
          <p className="text-xl text-dark-300 max-w-2xl mx-auto">
            {shouldAutoStart 
              ? 'Your song is being generated. This may take a few minutes.'
              : 'Check the status of your song generation request. Enter your song ID below to get started.'
            }
          </p>
        </div>

        {/* Auto-status display when songId/jobId provided */}
        {shouldAutoStart ? (
          <div className="max-w-3xl mx-auto">
            {/* Progress Steps */}
            <ol className="space-y-2 mb-6">
              <li className={`flex items-center ${['pending','queued'].includes(status) ? 'font-medium' : ''}`}>
                1. Queued / Contacting provider
              </li>
              <li className={`flex items-center ${status === 'processing' ? 'font-medium' : ''}`}>
                2. Generating
              </li>
              <li className={`flex items-center ${['success','done'].includes(status) ? 'font-medium' : ''}`}>
                3. Finalizing
              </li>
            </ol>

            {/* Status Display */}
            {!audioUrl && !error && (
              <div className="flex items-center gap-3 text-sm text-gray-400 mb-6">
                <span className="animate-spin h-4 w-4 rounded-full border-2 border-current border-t-transparent" />
                <span>Status: {status}</span>
              </div>
            )}

            {/* Audio Player and Download */}
            {audioUrl && (
              <div className="space-y-4 mb-6">
                <audio controls src={audioUrl} className="w-full" />
                <div className="flex gap-3">
                  <a href={audioUrl} download className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700">
                    Download
                  </a>
                  <button
                    onClick={() => navigator.clipboard.writeText(audioUrl)}
                    className="px-4 py-2 rounded bg-gray-800 text-white hover:bg-gray-700"
                  >
                    Copy link
                  </button>
                </div>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="text-red-500 mt-6">
                {error} &nbsp;
                <Link href="/" className="underline">Try again</Link>
              </div>
            )}

            {/* Manual Search Form */}
            <div className="mt-12 p-6 bg-dark-800 rounded-lg border border-dark-700">
              <h3 className="text-lg font-semibold text-white mb-4">Check Another Song</h3>
              <form onSubmit={handleSearch} className="space-y-4">
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
                  />
                </div>
                <button
                  type="submit"
                  disabled={!songId.trim() || isSearching}
                  className={`w-full px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                    songId.trim() && !isSearching
                      ? 'bg-primary-600 hover:bg-primary-700 text-white'
                      : 'bg-dark-600 text-dark-400 cursor-not-allowed'
                  }`}
                >
                  {isSearching ? 'Searching...' : 'Check Status'}
                </button>
              </form>
            </div>
          </div>
        ) : (
          /* Manual Search Form */
          <div className="max-w-2xl mx-auto">
            <div className="bg-dark-800 rounded-lg p-8 border border-dark-700">
              <h2 className="text-2xl font-semibold text-white mb-6">Enter Song ID</h2>
              
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
                  className={`w-full px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                    songId.trim() && !isSearching
                      ? 'bg-primary-600 hover:bg-primary-700 text-white'
                      : 'bg-dark-600 text-dark-400 cursor-not-allowed'
                  }`}
                >
                  {isSearching ? 'Searching...' : 'Check Status'}
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
          </div>
        )}

        {/* Error Display */}
        {error && !shouldAutoStart && (
          <div className="max-w-2xl mx-auto mt-8">
            <div className="bg-red-900/20 border border-red-700 rounded-lg p-6">
              <div className="flex items-center text-red-400 mb-4">
                <h3 className="text-lg font-semibold">Error</h3>
              </div>
              <p className="text-red-300 mb-4">{error}</p>
              <button
                onClick={handleRetry}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors duration-200"
              >
                Retry
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
