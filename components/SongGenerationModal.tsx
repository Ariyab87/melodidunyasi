'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Download, Copy, CheckCircle, AlertTriangle, Loader2,
  Music, Clock, Play, Pause
} from 'lucide-react';
import { getSongStatus, StatusResp } from '@/lib/api';
import Toast from '@/components/ui/Toast';

interface SongGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  songId: string;
  jobId?: string | null;
}

type GenerationStatus = 'queued' | 'processing' | 'finalizing' | 'completed' | 'failed' | 'error';

const statusSteps = [
  { key: 'queued', label: 'Queued', description: 'Your song is in the queue' },
  { key: 'processing', label: 'Processing', description: 'AI is creating your song' },
  { key: 'finalizing', label: 'Finalizing', description: 'Adding final touches' },
  { key: 'completed', label: 'Ready!', description: 'Your song is complete' }
];

export default function SongGenerationModal({ 
  isOpen, 
  onClose, 
  songId, 
  jobId 
}: SongGenerationModalProps) {
  const [currentStatus, setCurrentStatus] = useState<GenerationStatus>('queued');
  const [statusData, setStatusData] = useState<StatusResp | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  // Map backend status to UI status
  const mapBackendStatus = useCallback((status: string): GenerationStatus => {
    if (status === 'completed') return 'completed';
    if (status === 'failed' || status === 'error') return 'failed';
    if (status === 'processing' || status === 'pending') return 'processing';
    if (status === 'initializing') return 'queued';
    return 'queued';
  }, []);

  // Polling logic
  const pollStatus = useCallback(async () => {
    if (!songId || isPolling) return;

    setIsPolling(true);
    try {
      const response = await getSongStatus(songId, jobId);

      let processedResponse = { ...response };

      // Try to extract audioUrl if missing
      if (!processedResponse.audioUrl) {
        if (response.audio_url) processedResponse.audioUrl = response.audio_url;
        if (response.data && Array.isArray(response.data) && response.data[0]?.audio_url) {
          processedResponse.audioUrl = response.data[0].audio_url;
        }
      }

      setStatusData(processedResponse);

      const mappedStatus = mapBackendStatus(processedResponse.status);
      setCurrentStatus(
        processedResponse.audioUrl ? 'completed' : mappedStatus
      );

      // ✅ stop polling if audioUrl exists or failed
      if (processedResponse.audioUrl || mappedStatus === 'failed') {
        setIsPolling(false);
        return;
      }

      setTimeout(() => setIsPolling(false), 2500);
    } catch (err: any) {
      console.error('❌ Status check error:', err);
      setError(err?.message || 'Failed to check status');
      setIsPolling(false);
    }
  }, [songId, jobId, isPolling, mapBackendStatus]);

  // Start polling when modal opens
  useEffect(() => {
    if (isOpen && songId) pollStatus();
  }, [isOpen, songId, pollStatus]);

  // Continue polling until completed/failed
  useEffect(() => {
    if (isOpen && currentStatus !== 'completed' && currentStatus !== 'failed' && !isPolling) {
      const timer = setTimeout(() => pollStatus(), 2500);
      return () => clearTimeout(timer);
    }
  }, [isOpen, currentStatus, isPolling, pollStatus]);

  // Handle audio playback
  const toggleAudio = () => {
    if (!audioElement) return;
    if (isAudioPlaying) {
      audioElement.pause();
    } else {
      audioElement.play();
    }
    setIsAudioPlaying(!isAudioPlaying);
  };

  // Copy URL
  const copyAudioUrl = async () => {
    if (statusData?.audioUrl) {
      try {
        await navigator.clipboard.writeText(statusData.audioUrl);
        setToastMessage('Audio URL copied to clipboard!');
        setToastType('success');
      } catch {
        setToastMessage('Failed to copy URL');
        setToastType('error');
      }
    }
  };

  // Download file
  const downloadAudio = () => {
    if (statusData?.audioUrl) {
      const link = document.createElement('a');
      link.href = statusData.audioUrl;
      link.download = `song-${songId}.mp3`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Create audio element when audioUrl exists
  useEffect(() => {
    if (statusData?.audioUrl) {
      const audio = new Audio(statusData.audioUrl);
      const handleEnded = () => setIsAudioPlaying(false);

      audio.addEventListener('ended', handleEnded);
      setAudioElement(audio);

      return () => {
        audio.pause();
        audio.removeEventListener('ended', handleEnded);
      };
    }
  }, [statusData?.audioUrl]);

  useEffect(() => {
    return () => {
      if (audioElement) audioElement.pause();
    };
  }, [audioElement]);

  const getCurrentStepIndex = () =>
    statusSteps.findIndex(step => step.key === currentStatus);

  const getProgressPercentage = () => {
    if (currentStatus === 'completed') return 100;
    if (currentStatus === 'failed') return 0;
    const stepIndex = getCurrentStepIndex();
    return Math.max(0, (stepIndex / (statusSteps.length - 1)) * 100);
  };

  if (!isOpen) return null;

  // ---- UI stays the same ----
  return (
    <AnimatePresence>
      {/* ... all your JSX unchanged ... */}
    </AnimatePresence>
  );
}
