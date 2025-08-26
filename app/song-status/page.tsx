'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { API_BASE } from '@/lib/api';

type StatusResp = {
  status: string;
  audioUrl?: string | null;
  progress?: number;
  etaSeconds?: number | null;
  jobId?: string | null;
  errorMessage?: string;
  updatedAt?: string;
};

export default function SongStatusPage() {
  const searchParams = useSearchParams();
  const params = useParams();

  const initialSongId = (params?.songId as string) || searchParams.get('songId') || '';
  const initialJobId = searchParams.get('jobId') || '';

  const [songId, setSongId] = useState(initialSongId);
  const [jobId, setJobId] = useState(initialJobId);
  const [status, setStatus] = useState<string>('pending');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const shouldAutoStart = !!songId;

  useEffect(() => {
    if (!shouldAutoStart) return;

    let alive = true;
    let delay = 2000;
    const maxDelay = 15000;

    async function tick() {
      try {
        const url = `${API_BASE}/song/status/${encodeURIComponent(songId)}${
          jobId ? `?jobId=${encodeURIComponent(jobId)}` : ''
        }`;

        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok && res.status !== 202) throw new Error(`status ${res.status}`);
        const j: StatusResp = await res.json();

        if (!alive) return;
        setStatus(j.status || 'pending');
        if (j.audioUrl) setAudioUrl(j.audioUrl);
        if (j.jobId && !jobId) setJobId(j.jobId);

        const done = (j.status || '').toLowerCase() === 'completed';
        const failed = (j.status || '').toLowerCase() === 'failed';
        if (!done && !failed) {
          setTimeout(tick, delay);
          delay = Math.min(maxDelay, delay * 1.5);
        }
        if (failed) setError(j.errorMessage || 'Generation failed. Please try again.');
      } catch (e: any) {
        if (!alive) return;
        setError(e.message || 'Status check failed');
        setTimeout(tick, delay);
        delay = Math.min(maxDelay, delay * 1.5);
      }
    }

    tick();
    return () => {
      alive = false;
    };
  }, [songId, jobId, shouldAutoStart]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!songId.trim()) return;
    setIsSearching(true);
    setError(null);

    try {
      const url = `${API_BASE}/song/status/${encodeURIComponent(songId)}${
        jobId ? `?jobId=${encodeURIComponent(jobId)}` : ''
      }`;

      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok && res.status !== 202) throw new Error(`HTTP ${res.status}`);
      const j: StatusResp = await res.json();

      setStatus(j.status || 'pending');
      if (j.audioUrl) setAudioUrl(j.audioUrl);
      if (j.jobId && !jobId) setJobId(j.jobId);
    } catch (err: any) {
      setError(err.message || 'Status check failed');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-900 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">
            {shouldAutoStart ? 'Creating your song…' : 'Song Status Checker'}
          </h1>
          <p className="text-xl text-dark-300">
            {shouldAutoStart
              ? 'Your song is being generated. Please wait a few minutes.'
              : 'Enter your song ID below to check status.'}
          </p>
        </div>

        {shouldAutoStart && (
          <div className="max-w-3xl mx-auto">
            <p className="mb-4">Status: {status}</p>

            {!audioUrl && !error && (
              <div className="flex items-center gap-2 text-gray-400">
                <span className="animate-spin h-4 w-4 rounded-full border-2 border-current border-t-transparent" />
                <span>Waiting for audio...</span>
              </div>
            )}

            {audioUrl && (
              <div className="space-y-4">
                <audio controls src={audioUrl} className="w-full" />
                <div className="flex gap-3">
                  <a
                    href={audioUrl}
                    download
                    className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700"
                  >
                    Download
                  </a>
                  <button
                    onClick={() => navigator.clipboard.writeText(audioUrl)}
                    className="px-4 py-2 rounded bg-gray-800 hover:bg-gray-700"
                  >
                    Copy link
                  </button>
                </div>
              </div>
            )}

            {error && <div className="text-red-500 mt-4">{error}</div>}
          </div>
        )}

        {!shouldAutoStart && (
          <div className="max-w-2xl mx-auto">
            <form onSubmit={handleSearch} className="space-y-4">
              <input
                type="text"
                value={songId}
                onChange={(e) => setSongId(e.target.value)}
                placeholder="Enter Song ID..."
                className="w-full px-4 py-2 bg-dark-700 border rounded"
              />
              <button
                type="submit"
                disabled={!songId.trim() || isSearching}
                className="px-4 py-2 rounded bg-primary-600 hover:bg-primary-700"
              >
                {isSearching ? 'Searching...' : 'Check Status'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
