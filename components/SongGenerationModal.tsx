'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Download, 
  Copy, 
  CheckCircle, 
  AlertTriangle, 
  Loader2,
  Music,
  Clock,
  Play,
  Pause
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

  // Map backend status to our display status
  const mapBackendStatus = useCallback((status: string): GenerationStatus => {
    if (status === 'completed') return 'completed';
    if (status === 'failed' || status === 'error') return 'failed';
    if (status === 'processing' || status === 'pending') return 'processing';
    if (status === 'initializing') return 'queued';
    return 'queued';
  }, []);

  // Poll status every 2.5 seconds
  const pollStatus = useCallback(async () => {
    if (!songId || isPolling) return;

    setIsPolling(true);
    try {
      const response = await getSongStatus(songId, jobId);
      setStatusData(response);
      
      const mappedStatus = mapBackendStatus(response.status);
      setCurrentStatus(mappedStatus);

      // Stop polling if completed or failed
      if (mappedStatus === 'completed' || mappedStatus === 'failed') {
        setIsPolling(false);
        return;
      }

      // Continue polling after 2.5 seconds
      setTimeout(() => {
        setIsPolling(false);
      }, 2500);
    } catch (err: any) {
      setError(err?.message || 'Failed to check status');
      setIsPolling(false);
    }
  }, [songId, jobId, isPolling, mapBackendStatus]);

  // Start polling when modal opens
  useEffect(() => {
    if (isOpen && songId) {
      pollStatus();
    }
  }, [isOpen, songId, pollStatus]);

  // Continue polling while modal is open and not completed/failed
  useEffect(() => {
    if (isOpen && currentStatus !== 'completed' && currentStatus !== 'failed' && !isPolling) {
      const timer = setTimeout(() => {
        pollStatus();
      }, 2500);
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

  // Copy audio URL to clipboard
  const copyAudioUrl = async () => {
    if (statusData?.audioUrl) {
      try {
        await navigator.clipboard.writeText(statusData.audioUrl);
        setToastMessage('Audio URL copied to clipboard!');
        setToastType('success');
      } catch (err) {
        console.error('Failed to copy URL:', err);
        setToastMessage('Failed to copy URL');
        setToastType('error');
      }
    }
  };

  // Download audio file
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

  // Create audio element when URL is available
  useEffect(() => {
    if (statusData?.audioUrl) {
      const audio = new Audio(statusData.audioUrl);
      audio.addEventListener('ended', () => setIsAudioPlaying(false));
      setAudioElement(audio);
      
      return () => {
        audio.pause();
        audio.removeEventListener('ended', () => setIsAudioPlaying(false));
      };
    }
  }, [statusData?.audioUrl]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioElement) {
        audioElement.pause();
      }
    };
  }, [audioElement]);

  const getCurrentStepIndex = () => {
    return statusSteps.findIndex(step => step.key === currentStatus);
  };

  const getProgressPercentage = () => {
    if (currentStatus === 'completed') return 100;
    if (currentStatus === 'failed') return 0;
    const stepIndex = getCurrentStepIndex();
    return Math.max(0, (stepIndex / (statusSteps.length - 1)) * 100);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-dark-700 rounded-2xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Creating Your Song</h2>
            <button
              onClick={onClose}
              className="text-dark-300 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Progress Steps */}
          <div className="mb-8">
            <div className="relative">
              {/* Progress Bar */}
              <div className="absolute top-4 left-0 w-full h-1 bg-dark-600 rounded-full">
                <motion.div
                  className="h-full bg-gradient-to-r from-primary-500 to-primary-400 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${getProgressPercentage()}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>

              {/* Steps */}
              {statusSteps.map((step, index) => {
                const isActive = index <= getCurrentStepIndex();
                const isCurrent = index === getCurrentStepIndex();
                
                return (
                  <div key={step.key} className="relative flex items-center mb-6 last:mb-0">
                    {/* Step Circle */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${
                      isActive 
                        ? 'bg-primary-500 text-white' 
                        : 'bg-dark-600 text-dark-400'
                    }`}>
                      {isCurrent && currentStatus !== 'completed' ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : isActive ? (
                        <CheckCircle size={16} />
                      ) : (
                        <span className="text-sm font-medium">{index + 1}</span>
                      )}
                    </div>

                    {/* Step Content */}
                    <div className="ml-4">
                      <h3 className={`font-medium ${
                        isActive ? 'text-white' : 'text-dark-400'
                      }`}>
                        {step.label}
                      </h3>
                      <p className={`text-sm ${
                        isActive ? 'text-dark-300' : 'text-dark-500'
                      }`}>
                        {step.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Status Messages */}
          <div className="mb-6">
            {currentStatus === 'queued' && (
              <div className="text-center p-4 bg-dark-600 rounded-lg">
                <Clock size={24} className="mx-auto mb-2 text-primary-400" />
                <p className="text-white font-medium">Your song is queued</p>
                <p className="text-dark-300 text-sm">We'll start processing shortly...</p>
              </div>
            )}

            {currentStatus === 'processing' && (
              <div className="text-center p-4 bg-dark-600 rounded-lg">
                <Music size={24} className="mx-auto mb-2 text-primary-400 animate-pulse" />
                <p className="text-white font-medium">AI is creating your song</p>
                <p className="text-dark-300 text-sm">This usually takes 2-5 minutes</p>
              </div>
            )}

            {currentStatus === 'finalizing' && (
              <div className="text-center p-4 bg-dark-600 rounded-lg">
                <Loader2 size={24} className="mx-auto mb-2 text-primary-400 animate-spin" />
                <p className="text-white font-medium">Adding final touches</p>
                <p className="text-dark-300 text-sm">Almost ready...</p>
              </div>
            )}

            {currentStatus === 'completed' && statusData?.audioUrl && (
              <div className="text-center p-4 bg-green-500/20 border border-green-500/30 rounded-lg">
                <CheckCircle size={24} className="mx-auto mb-2 text-green-400" />
                <p className="text-white font-medium">Your song is ready!</p>
                <p className="text-dark-300 text-sm">Listen, download, or copy the link below</p>
              </div>
            )}

            {currentStatus === 'failed' && (
              <div className="text-center p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
                <AlertTriangle size={24} className="mx-auto mb-2 text-red-400" />
                <p className="text-white font-medium">Generation failed</p>
                <p className="text-dark-300 text-sm">
                  {statusData?.errorMessage || 'Something went wrong. Please try again.'}
                </p>
              </div>
            )}
          </div>

          {/* Audio Player & Actions (when completed) */}
          {currentStatus === 'completed' && statusData?.audioUrl && (
            <div className="space-y-4">
              {/* Audio Player */}
              <div className="bg-dark-600 rounded-lg p-4">
                <div className="flex items-center justify-center space-x-4">
                  <button
                    onClick={toggleAudio}
                    className="w-12 h-12 bg-primary-500 hover:bg-primary-400 rounded-full flex items-center justify-center transition-colors"
                  >
                    {isAudioPlaying ? <Pause size={20} /> : <Play size={20} />}
                  </button>
                  <div className="flex-1">
                    <p className="text-white font-medium">Your Generated Song</p>
                    <p className="text-dark-300 text-sm">Click play to listen</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={downloadAudio}
                  className="flex items-center justify-center space-x-2 bg-primary-500 hover:bg-primary-400 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                >
                  <Download size={16} />
                  <span>Download</span>
                </button>
                <button
                  onClick={copyAudioUrl}
                  className="flex items-center justify-center space-x-2 bg-dark-600 hover:bg-dark-500 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                >
                  <Copy size={16} />
                  <span>Copy Link</span>
                </button>
              </div>
            </div>
          )}

          {/* Error Actions */}
          {currentStatus === 'failed' && (
            <div className="text-center">
              <button
                onClick={onClose}
                className="bg-red-500 hover:bg-red-400 text-white font-medium py-3 px-6 rounded-lg transition-colors"
              >
                Close & Try Again
              </button>
            </div>
          )}

          {/* Loading Indicator */}
          {isPolling && currentStatus !== 'completed' && currentStatus !== 'failed' && (
            <div className="text-center text-dark-400 text-sm">
              Checking status...
            </div>
          )}
        </motion.div>
      </motion.div>

      {/* Toast Notification */}
      {toastMessage && (
        <Toast 
          message={toastMessage} 
          type={toastType} 
          onClose={() => setToastMessage(null)} 
          duration={3000} 
        />
      )}
    </AnimatePresence>
  );
}
