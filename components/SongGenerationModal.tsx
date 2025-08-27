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

      // Always try to extract audioUrl to ensure we get it
      console.log('🔍 Raw response:', response);
      console.log('🔍 Response keys:', Object.keys(response));
      console.log('🔍 Response status:', response.status);
      
      // Check for direct audioUrl first
      if (response.audioUrl) {
        processedResponse.audioUrl = response.audioUrl;
        console.log('🔍 Found direct audioUrl:', response.audioUrl);
      }
      
      // Check for snake_case audio_url
      if (response.audio_url) {
        processedResponse.audioUrl = response.audio_url;
        console.log('🔍 Found audio_url (snake_case):', response.audio_url);
      }
      
      // Check for nested data structure: response.data[0].audio_url
      if (response.data && Array.isArray(response.data) && response.data[0]?.audio_url) {
        processedResponse.audioUrl = response.data[0].audio_url;
        console.log('🔍 Found nested data[0].audio_url:', response.data[0].audio_url);
      }
      
      // Check for deeply nested structure: response.data.data[0].audio_url (from logs)
      if (response.data && response.data.data && Array.isArray(response.data.data) && response.data.data[0]?.audio_url) {
        processedResponse.audioUrl = response.data.data[0].audio_url;
        console.log('🔍 Found deeply nested data.data[0].audio_url:', response.data.data[0].audio_url);
      }
      
      // Additional checks for other possible structures
      if (response.data?.audioUrl) {
        processedResponse.audioUrl = response.data.audioUrl;
        console.log('🔍 Found data.audioUrl:', response.data.audioUrl);
      }
      
      if (response.data?.audio_url) {
        processedResponse.audioUrl = response.data.audio_url;
        console.log('🔍 Found data.audio_url:', response.data.audio_url);
      }
      
      console.log('🔍 Final processed audioUrl:', processedResponse.audioUrl);
      console.log('🔍 Response status after processing:', processedResponse.status);

      setStatusData(processedResponse);

      const mappedStatus = mapBackendStatus(processedResponse.status);
      console.log('🔍 Status mapping:', { 
        originalStatus: processedResponse.status, 
        mappedStatus, 
        hasAudioUrl: !!processedResponse.audioUrl 
      });
      
      // If we have an audio URL, force status to completed
      const finalStatus = processedResponse.audioUrl ? 'completed' : mappedStatus;
      console.log('🔍 Setting final status:', finalStatus);
      setCurrentStatus(finalStatus);

      // ✅ stop polling if audioUrl exists or failed
      if (processedResponse.audioUrl || mappedStatus === 'failed') {
        console.log('🔍 Stopping polling - audioUrl found or failed status');
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
    console.log('🔍 Modal effect triggered:', { isOpen, songId, jobId });
    if (isOpen && songId) {
      console.log('🔍 Starting to poll for song:', songId);
      pollStatus();
    }
  }, [isOpen, songId, pollStatus]);

  // Debug modal mount/unmount
  useEffect(() => {
    console.log('🔍 Modal component mounted/unmounted:', { isOpen, songId });
    return () => {
      console.log('🔍 Modal component unmounting');
    };
  }, [isOpen, songId]);

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

  console.log('🔍 Modal rendering:', { isOpen, songId, currentStatus, statusData });

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
        style={{ position: 'fixed', zIndex: 9999 }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden border-4 border-red-500"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                <Music className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Song Generation</h2>
                <p className="text-sm text-gray-500">ID: {songId}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Status Steps */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-900">Progress</h3>
                <span className="text-sm text-gray-500">
                  {Math.round(getProgressPercentage())}%
                </span>
              </div>
              
              <div className="relative">
                <div className="flex justify-between mb-2">
                  {statusSteps.map((step, index) => (
                    <div
                      key={step.key}
                      className={`flex flex-col items-center ${
                        index <= getCurrentStepIndex() ? 'text-primary-600' : 'text-gray-400'
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 transition-all ${
                          index <= getCurrentStepIndex()
                            ? 'bg-primary-100 text-primary-600'
                            : 'bg-gray-100 text-gray-400'
                        }`}
                      >
                        {index < getCurrentStepIndex() ? (
                          <CheckCircle className="w-5 h-5" />
                        ) : index === getCurrentStepIndex() ? (
                          currentStatus === 'completed' ? (
                            <CheckCircle className="w-5 h-5" />
                          ) : (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          )
                        ) : (
                          <span className="text-sm font-medium">{index + 1}</span>
                        )}
                      </div>
                      <span className="text-xs text-center max-w-16">{step.label}</span>
                    </div>
                  ))}
                </div>
                
                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <motion.div
                    className="bg-primary-600 h-2 rounded-full transition-all duration-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${getProgressPercentage()}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Current Status */}
            <div className="text-center">
              {currentStatus === 'completed' ? (
                <div className="space-y-4">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Your song is ready! 🎉
                    </h3>
                    <p className="text-gray-600">
                      The AI has finished creating your personalized song.
                    </p>
                  </div>
                </div>
              ) : currentStatus === 'failed' ? (
                <div className="space-y-4">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                    <AlertTriangle className="w-8 h-8 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Generation failed
                    </h3>
                    <p className="text-gray-600">
                      {error || 'Something went wrong during song generation. Please try again.'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto">
                    <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Creating your song...
                    </h3>
                    <p className="text-gray-600">
                      {statusSteps.find(step => step.key === currentStatus)?.description || 'Processing your request...'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Audio Player & Download (when completed) */}
            {currentStatus === 'completed' && statusData?.audioUrl && (
              <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900">Your Song</h4>
                
                {/* Audio Player */}
                <div className="flex items-center space-x-3">
                  <button
                    onClick={toggleAudio}
                    className="w-12 h-12 bg-primary-600 rounded-full flex items-center justify-center text-white hover:bg-primary-700 transition-colors"
                  >
                    {isAudioPlaying ? (
                      <Pause className="w-5 h-5" />
                    ) : (
                      <Play className="w-5 h-5 ml-1" />
                    )}
                  </button>
                  <div className="flex-1">
                    <p className="text-sm text-gray-600">Click to play your generated song</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3">
                  {/* Use downloadUrl if available, otherwise fall back to direct audioUrl */}
                  {statusData.downloadUrl ? (
                    <a
                      href={statusData.downloadUrl}
                      download={statusData.savedFilename || `song-${songId}.mp3`}
                      className="flex-1 flex items-center justify-center space-x-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download MP3</span>
                    </a>
                  ) : (
                    <button
                      onClick={downloadAudio}
                      className="flex-1 flex items-center justify-center space-x-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download</span>
                    </button>
                  )}
                  <button
                    onClick={copyAudioUrl}
                    className="flex-1 flex items-center justify-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                    <span>Copy URL</span>
                  </button>
                </div>

                {/* File Info Display */}
                {statusData.downloadUrl && (
                  <div className="text-xs text-gray-500 space-y-1">
                    <div><strong>Download URL:</strong> {statusData.downloadUrl}</div>
                    {statusData.savedFilename && (
                      <div><strong>Filename:</strong> {statusData.savedFilename}</div>
                    )}
                    {statusData.fileSize && (
                      <div><strong>File Size:</strong> {(statusData.fileSize / 1024 / 1024).toFixed(2)} MB</div>
                    )}
                  </div>
                )}

                {/* Audio URL Display */}
                <div className="text-xs text-gray-500 break-all">
                  <strong>Audio URL:</strong> {statusData.audioUrl}
                </div>
              </div>
            )}

            {/* Error Display */}
            {error && currentStatus !== 'completed' && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center space-x-2 text-red-600">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="font-medium">Error</span>
                </div>
                <p className="text-red-600 text-sm mt-1">{error}</p>
              </div>
            )}

            {/* Status Info */}
            {statusData && (
              <div className="text-xs text-gray-500 space-y-1">
                <div>Status: {statusData.status}</div>
                {statusData.progress !== undefined && (
                  <div>Progress: {statusData.progress}%</div>
                )}
                {statusData.etaSeconds && (
                  <div>ETA: {Math.ceil(statusData.etaSeconds / 60)} minutes</div>
                )}
                {statusData.updatedAt && (
                  <div>Last updated: {new Date(statusData.updatedAt).toLocaleTimeString()}</div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-500">
                {currentStatus === 'completed' 
                  ? 'Your song is ready for download'
                  : 'This may take a few minutes'
                }
              </div>
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                {currentStatus === 'completed' ? 'Close' : 'Close (keep monitoring)'}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Toast */}
        {toastMessage && (
          <Toast
            message={toastMessage}
            type={toastType}
            onClose={() => setToastMessage(null)}
            duration={3000}
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
}
