'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Download, Copy, CheckCircle, AlertTriangle, Loader2,
  Music, Clock, Play, Pause, Sparkles, Headphones
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
  { key: 'queued', label: 'Queued', description: 'Your song is in the queue', icon: Clock },
  { key: 'processing', label: 'Processing', description: 'AI is creating your song', icon: Sparkles },
  { key: 'finalizing', label: 'Finalizing', description: 'Adding final touches', icon: Music },
  { key: 'completed', label: 'Ready!', description: 'Your song is complete', icon: Headphones }
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

  // Polling logic with enhanced audio URL detection
  const pollStatus = useCallback(async () => {
    if (!songId || isPolling) return;

    setIsPolling(true);
    try {
      const response = await getSongStatus(songId, jobId);

      let processedResponse = { ...response };

      // Enhanced audio URL extraction with better logging
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
      console.log('🔍 Full processed response:', processedResponse);

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

      // Continue polling with exponential backoff
      const delay = Math.min(5000, 2000 + (Math.random() * 3000));
      setTimeout(() => setIsPolling(false), delay);
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
      const timer = setTimeout(() => pollStatus(), 3000);
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
        className="fixed inset-0 bg-black/60 backdrop-blur-md z-[9999] flex items-center justify-center p-4"
        style={{ position: 'fixed', zIndex: 9999 }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="bg-gradient-to-br from-white to-gray-50 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden border border-gray-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Enhanced Header */}
          <div className="relative p-6 border-b border-gray-200 bg-gradient-to-r from-primary-50 to-blue-50">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Music className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 bg-gradient-to-r from-primary-600 to-blue-600 bg-clip-text text-transparent">
                  Song Generation
                </h2>
                <p className="text-sm text-gray-600 font-mono">ID: {songId}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center transition-all duration-200 hover:scale-110"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Enhanced Content */}
          <div className="p-8 space-y-8">
            {/* Enhanced Status Steps */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Progress</h3>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-primary-500 rounded-full animate-pulse"></div>
                  <span className="text-lg font-bold text-primary-600">
                    {Math.round(getProgressPercentage())}%
                  </span>
                </div>
              </div>
              
              <div className="relative">
                <div className="flex justify-between mb-4">
                  {statusSteps.map((step, index) => {
                    const IconComponent = step.icon;
                    const isActive = index <= getCurrentStepIndex();
                    const isCurrent = index === getCurrentStepIndex();
                    
                    return (
                      <motion.div
                        key={step.key}
                        className={`flex flex-col items-center transition-all duration-500 ${
                          isActive ? 'text-primary-600' : 'text-gray-400'
                        }`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <motion.div
                          className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-3 transition-all duration-300 ${
                            isActive
                              ? 'bg-gradient-to-br from-primary-100 to-blue-100 shadow-lg'
                              : 'bg-gray-100'
                          }`}
                          whileHover={{ scale: 1.1 }}
                        >
                          {index < getCurrentStepIndex() ? (
                            <CheckCircle className="w-6 h-6 text-primary-600" />
                          ) : isCurrent ? (
                            currentStatus === 'completed' ? (
                              <CheckCircle className="w-6 h-6 text-primary-600" />
                            ) : (
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                              >
                                <IconComponent className="w-6 h-6 text-primary-600" />
                              </motion.div>
                            )
                          ) : (
                            <IconComponent className="w-6 h-6 text-gray-400" />
                          )}
                        </motion.div>
                        <span className="text-sm font-medium text-center max-w-20">{step.label}</span>
                        <span className="text-xs text-gray-500 text-center mt-1">{step.description}</span>
                      </motion.div>
                    );
                  })}
                </div>
                
                {/* Enhanced Progress Bar */}
                <div className="relative w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-primary-500 to-blue-600 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${getProgressPercentage()}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
                </div>
              </div>
            </div>

            {/* Enhanced Current Status */}
            <motion.div 
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              {currentStatus === 'completed' ? (
                <div className="space-y-6">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", damping: 15, stiffness: 300 }}
                    className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-2xl"
                  >
                    <CheckCircle className="w-10 h-10 text-white" />
                  </motion.div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">
                      🎉 Your song is ready! 🎉
                    </h3>
                    <p className="text-gray-600 text-lg">
                      The AI has finished creating your personalized song.
                    </p>
                  </div>
                </div>
              ) : currentStatus === 'failed' ? (
                <div className="space-y-6">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", damping: 15, stiffness: 300 }}
                    className="w-20 h-20 bg-gradient-to-br from-red-400 to-pink-500 rounded-full flex items-center justify-center mx-auto shadow-2xl"
                  >
                    <AlertTriangle className="w-10 h-10 text-white" />
                  </motion.div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">
                      Generation failed
                    </h3>
                    <p className="text-gray-600 text-lg">
                      {error || 'Something went wrong during song generation. Please try again.'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <motion.div
                    animate={{ 
                      scale: [1, 1.1, 1],
                      rotate: [0, 5, -5, 0]
                    }}
                    transition={{ 
                      scale: { duration: 2, repeat: Infinity },
                      rotate: { duration: 3, repeat: Infinity }
                    }}
                    className="w-20 h-20 bg-gradient-to-br from-primary-400 to-blue-500 rounded-full flex items-center justify-center mx-auto shadow-2xl"
                  >
                    <Loader2 className="w-10 h-10 text-white" />
                  </motion.div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">
                      Creating your song...
                    </h3>
                    <p className="text-gray-600 text-lg">
                      {statusSteps.find(step => step.key === currentStatus)?.description || 'Processing your request...'}
                    </p>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Enhanced Audio Player & Download (when completed) */}
            {currentStatus === 'completed' && statusData?.audioUrl && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="space-y-6 p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-200 shadow-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                    <Headphones className="w-5 h-5 text-white" />
                  </div>
                  <h4 className="text-xl font-semibold text-gray-900">Your Song is Ready!</h4>
                </div>
                
                {/* Enhanced Audio Player */}
                <div className="flex items-center space-x-4 p-4 bg-white rounded-xl shadow-md">
                  <motion.button
                    onClick={toggleAudio}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-16 h-16 bg-gradient-to-br from-primary-500 to-blue-600 rounded-full flex items-center justify-center text-white shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    {isAudioPlaying ? (
                      <Pause className="w-7 h-7" />
                    ) : (
                      <Play className="w-7 h-7 ml-1" />
                    )}
                  </motion.button>
                  <div className="flex-1">
                    <p className="text-lg font-medium text-gray-900">Click to preview your song</p>
                    <p className="text-sm text-gray-600">Experience your AI-generated masterpiece</p>
                  </div>
                </div>

                {/* Enhanced Action Buttons */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Use downloadUrl if available, otherwise fall back to direct audioUrl */}
                  {statusData.downloadUrl ? (
                    <motion.a
                      href={statusData.downloadUrl}
                      download={statusData.savedFilename || `song-${songId}.mp3`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex items-center justify-center space-x-3 bg-gradient-to-r from-primary-500 to-blue-600 text-white px-6 py-4 rounded-xl hover:shadow-lg transition-all duration-200 font-medium"
                    >
                      <Download className="w-5 h-5" />
                      <span>Download MP3</span>
                    </motion.a>
                  ) : (
                    <motion.button
                      onClick={downloadAudio}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex items-center justify-center space-x-3 bg-gradient-to-r from-primary-500 to-blue-600 text-white px-6 py-4 rounded-xl hover:shadow-lg transition-all duration-200 font-medium"
                    >
                      <Download className="w-5 h-5" />
                      <span>Download</span>
                    </motion.button>
                  )}
                  <motion.button
                    onClick={copyAudioUrl}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center justify-center space-x-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white px-6 py-4 rounded-xl hover:shadow-lg transition-all duration-200 font-medium"
                  >
                    <Copy className="w-5 h-5" />
                    <span>Copy URL</span>
                  </motion.button>
                </div>

                {/* Enhanced File Info Display */}
                {statusData.downloadUrl && (
                  <div className="p-4 bg-white rounded-xl border border-gray-200">
                    <h5 className="font-medium text-gray-900 mb-3">File Information</h5>
                    <div className="space-y-2 text-sm text-gray-600">
                      {statusData.savedFilename && (
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">Filename:</span>
                          <span className="font-mono bg-gray-100 px-2 py-1 rounded">{statusData.savedFilename}</span>
                        </div>
                      )}
                      {statusData.fileSize && (
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">File Size:</span>
                          <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                            {(statusData.fileSize / 1024 / 1024).toFixed(2)} MB
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Audio URL Display */}
                <div className="p-3 bg-gray-100 rounded-lg">
                  <div className="text-xs text-gray-600 break-all">
                    <strong>Audio URL:</strong> {statusData.audioUrl}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Enhanced Error Display */}
            {error && currentStatus !== 'completed' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 bg-gradient-to-br from-red-50 to-pink-50 border border-red-200 rounded-2xl"
              >
                <div className="flex items-center space-x-3 text-red-600 mb-3">
                  <AlertTriangle className="w-6 h-6" />
                  <span className="font-semibold text-lg">Error</span>
                </div>
                <p className="text-red-700">{error}</p>
              </motion.div>
            )}

            {/* Enhanced Status Info */}
            {statusData && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="p-4 bg-gray-50 rounded-xl border border-gray-200"
              >
                <h5 className="font-medium text-gray-900 mb-3">Status Details</h5>
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                  <div><strong>Status:</strong> {statusData.status}</div>
                  {statusData.progress !== undefined && (
                    <div><strong>Progress:</strong> {statusData.progress}%</div>
                  )}
                  {statusData.etaSeconds && (
                    <div><strong>ETA:</strong> {Math.ceil(statusData.etaSeconds / 60)} minutes</div>
                  )}
                  {statusData.updatedAt && (
                    <div><strong>Last updated:</strong> {new Date(statusData.updatedAt).toLocaleTimeString()}</div>
                  )}
                </div>
                
                {/* Debug Info */}
                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <h6 className="font-medium text-blue-900 mb-2">Debug Info</h6>
                  <div className="text-xs text-blue-700 space-y-1">
                    <div><strong>Song ID:</strong> {songId}</div>
                    <div><strong>Job ID:</strong> {jobId || 'None'}</div>
                    <div><strong>Has Audio URL:</strong> {statusData.audioUrl ? 'Yes' : 'No'}</div>
                    {statusData.audioUrl && (
                      <div><strong>Audio URL:</strong> {statusData.audioUrl.substring(0, 50)}...</div>
                    )}
                    <div><strong>Has Download URL:</strong> {statusData.downloadUrl ? 'Yes' : 'No'}</div>
                    {statusData.downloadUrl && (
                      <div><strong>Download URL:</strong> {statusData.downloadUrl.substring(0, 50)}...</div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Enhanced Footer */}
          <div className="p-6 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                {currentStatus === 'completed' 
                  ? '🎵 Your song is ready for download!'
                  : '⏳ This may take a few minutes'
                }
              </div>
              <motion.button
                onClick={onClose}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-3 text-gray-600 hover:text-gray-800 bg-white hover:bg-gray-50 rounded-xl border border-gray-200 transition-all duration-200 font-medium"
              >
                {currentStatus === 'completed' ? 'Close' : 'Close (keep monitoring)'}
              </motion.button>
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
