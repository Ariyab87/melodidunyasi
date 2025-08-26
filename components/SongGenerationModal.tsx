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
      
      // Debug logging to see what we're receiving
      console.log('🔍 Raw API Response:', response);
      console.log('🔍 Response status:', response.status);
      console.log('🔍 Response audioUrl:', response.audioUrl);
      console.log('🔍 Response keys:', Object.keys(response));
      
      // Check if we need to extract audioUrl from nested structure
      let processedResponse = { ...response };
      
      // If status is completed but no audioUrl, try to extract from nested data
      if (response.status === 'completed' && !response.audioUrl) {
        console.log('🔍 Status completed but no audioUrl, checking for nested data...');
        
        // Check if there's nested data structure like in the logs
        if (response.data && Array.isArray(response.data) && response.data.length > 0) {
          const nestedData = response.data[0];
          console.log('🔍 Found nested data:', nestedData);
          
          if (nestedData.audio_url) {
            processedResponse.audioUrl = nestedData.audio_url;
            console.log('🔍 Extracted audioUrl from nested data:', nestedData.audio_url);
          }
        }
        
        // Also check for other possible field names
        if (response.audio_url) {
          processedResponse.audioUrl = response.audio_url;
          console.log('🔍 Found audio_url (snake_case):', response.audio_url);
        }
        
        // Check the entire response for any audio-related fields
        const allKeys = Object.keys(response);
        const audioKeys = allKeys.filter(key => key.toLowerCase().includes('audio'));
        console.log('🔍 All keys containing "audio":', audioKeys);
        
        // Log the full response structure for debugging
        console.log('🔍 Full response structure:', JSON.stringify(response, null, 2));
      }
      
      setStatusData(processedResponse);
      
      const mappedStatus = mapBackendStatus(processedResponse.status);
      console.log('🔍 Mapped status:', mappedStatus, 'Final audioUrl:', processedResponse.audioUrl);
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
      console.error('❌ Status check error:', err);
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
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="bg-gradient-to-br from-dark-700 via-dark-800 to-dark-900 rounded-3xl p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-dark-600/50 backdrop-blur-sm"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
                <Music size={20} className="text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Creating Your Song</h2>
                <p className="text-dark-300 text-sm">AI-powered music generation</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 bg-dark-600 hover:bg-dark-500 rounded-lg flex items-center justify-center text-dark-300 hover:text-white transition-all duration-200 hover:scale-110"
            >
              <X size={18} />
            </button>
          </div>

          {/* Progress Steps */}
          <div className="mb-8">
            <div className="relative">
              {/* Progress Bar */}
              <div className="absolute top-5 left-0 w-full h-2 bg-dark-600/50 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-primary-500 via-primary-400 to-primary-300 rounded-full shadow-lg"
                  initial={{ width: 0 }}
                  animate={{ width: `${getProgressPercentage()}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </div>

              {/* Steps */}
              {statusSteps.map((step, index) => {
                const isActive = index <= getCurrentStepIndex();
                const isCurrent = index === getCurrentStepIndex();
                
                return (
                  <motion.div 
                    key={step.key} 
                    className="relative flex items-center mb-8 last:mb-0"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    {/* Step Circle */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center z-10 transition-all duration-300 ${
                      isActive 
                        ? 'bg-gradient-to-br from-primary-500 to-primary-600 shadow-lg shadow-primary-500/25' 
                        : 'bg-dark-600/50 text-dark-400'
                    }`}>
                      {isCurrent && currentStatus !== 'completed' ? (
                        <Loader2 size={18} className="animate-spin text-white" />
                      ) : isActive ? (
                        <CheckCircle size={18} className="text-white" />
                      ) : (
                        <span className="text-sm font-medium">{index + 1}</span>
                      )}
                    </div>

                    {/* Step Content */}
                    <div className="ml-5">
                      <h3 className={`font-semibold text-lg transition-colors duration-300 ${
                        isActive ? 'text-white' : 'text-dark-400'
                      }`}>
                        {step.label}
                      </h3>
                      <p className={`text-sm transition-colors duration-300 ${
                        isActive ? 'text-dark-300' : 'text-dark-500'
                      }`}>
                        {step.description}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Status Messages */}
          <div className="mb-8">
            {currentStatus === 'queued' && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center p-6 bg-gradient-to-br from-dark-600/80 to-dark-700/80 rounded-2xl border border-dark-500/30 backdrop-blur-sm"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-primary-500/20 to-primary-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock size={28} className="text-primary-400" />
                </div>
                <p className="text-white font-semibold text-lg mb-2">Your song is queued</p>
                <p className="text-dark-300 text-sm">We'll start processing shortly...</p>
              </motion.div>
            )}

            {currentStatus === 'processing' && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center p-6 bg-gradient-to-br from-dark-600/80 to-dark-700/80 rounded-2xl border border-dark-500/30 backdrop-blur-sm"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-primary-500/20 to-primary-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Music size={28} className="text-primary-400 animate-pulse" />
                </div>
                <p className="text-white font-semibold text-lg mb-2">AI is creating your song</p>
                <p className="text-dark-300 text-sm">This usually takes 2-5 minutes</p>
              </motion.div>
            )}

            {currentStatus === 'finalizing' && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center p-6 bg-gradient-to-br from-dark-600/80 to-dark-700/80 rounded-2xl border border-dark-500/30 backdrop-blur-sm"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-primary-500/20 to-primary-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Loader2 size={28} className="text-primary-400 animate-spin" />
                </div>
                <p className="text-white font-semibold text-lg mb-2">Adding final touches</p>
                <p className="text-dark-300 text-sm">Almost ready...</p>
              </motion.div>
            )}

            {currentStatus === 'completed' && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center p-6 bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-2xl border border-green-500/40 backdrop-blur-sm"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle size={28} className="text-green-400" />
                </div>
                <p className="text-white font-semibold text-lg mb-2">Your song is ready!</p>
                <p className="text-dark-300 text-sm">
                  {statusData?.audioUrl 
                    ? 'Listen, download, or copy the link below' 
                    : 'Your song has been generated successfully!'}
                </p>
                {!statusData?.audioUrl && (
                  <p className="text-yellow-300 text-sm mt-3 font-medium">
                    Audio URL not yet available. Please check back in a few minutes.
                  </p>
                )}
              </motion.div>
            )}

            {currentStatus === 'failed' && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center p-6 bg-gradient-to-br from-red-500/20 to-red-600/20 rounded-2xl border border-red-500/40 backdrop-blur-sm"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-red-500/20 to-red-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle size={28} className="text-red-400" />
                </div>
                <p className="text-white font-semibold text-lg mb-2">Generation failed</p>
                <p className="text-dark-300 text-sm">
                  {statusData?.errorMessage || 'Something went wrong. Please try again.'}
                </p>
              </motion.div>
            )}
          </div>

          {/* Audio Player & Actions (when completed) */}
          {currentStatus === 'completed' && statusData?.audioUrl && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Audio Player */}
              <div className="bg-gradient-to-br from-dark-600/80 to-dark-700/80 rounded-2xl p-6 border border-dark-500/30 backdrop-blur-sm">
                <div className="flex items-center space-x-5">
                  <button
                    onClick={toggleAudio}
                    className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 hover:from-primary-400 hover:to-primary-500 rounded-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-lg shadow-primary-500/25"
                  >
                    {isAudioPlaying ? <Pause size={24} className="text-white" /> : <Play size={24} className="text-white" />}
                  </button>
                  <div className="flex-1">
                    <p className="text-white font-semibold text-lg mb-1">Your Generated Song</p>
                    <p className="text-dark-300 text-sm">Click play to listen to your AI-generated masterpiece</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={downloadAudio}
                  className="flex items-center justify-center space-x-3 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-400 hover:to-primary-500 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 hover:scale-105 shadow-lg shadow-primary-500/25"
                >
                  <Download size={18} />
                  <span>Download MP3</span>
                </button>
                <button
                  onClick={copyAudioUrl}
                  className="flex items-center justify-center space-x-3 bg-gradient-to-r from-dark-600 to-dark-700 hover:from-dark-500 hover:to-dark-600 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 hover:scale-105 border border-dark-500/50"
                >
                  <Copy size={18} />
                  <span>Copy Link</span>
                </button>
              </div>
            </motion.div>
          )}

          {/* Completed but no audio yet */}
          {currentStatus === 'completed' && !statusData?.audioUrl && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center p-6 bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 rounded-2xl border border-yellow-500/30 backdrop-blur-sm"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock size={28} className="text-yellow-400" />
              </div>
              <h3 className="text-yellow-300 font-semibold text-lg mb-3">Audio Processing</h3>
              <p className="text-dark-300 text-sm mb-2">
                Your song is complete but the audio is still being processed.
              </p>
              <p className="text-dark-300 text-sm mb-4">
                This usually takes a few minutes. You can close this modal and check back later.
              </p>
              <button
                onClick={onClose}
                className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-400 hover:to-primary-500 text-white font-semibold py-3 px-8 rounded-xl transition-all duration-300 hover:scale-105 shadow-lg shadow-primary-500/25"
              >
                Close Modal
              </button>
            </motion.div>
          )}

          {/* Error Actions */}
          {currentStatus === 'failed' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <button
                onClick={onClose}
                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 text-white font-semibold py-4 px-8 rounded-xl transition-all duration-300 hover:scale-105 shadow-lg shadow-red-500/25"
              >
                Close & Try Again
              </button>
            </motion.div>
          )}

          {/* Loading Indicator */}
          {isPolling && currentStatus !== 'completed' && currentStatus !== 'failed' && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center p-4 bg-dark-600/50 rounded-xl border border-dark-500/30"
            >
              <div className="flex items-center justify-center space-x-3 text-dark-300">
                <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm font-medium">Checking status...</span>
              </div>
            </motion.div>
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
