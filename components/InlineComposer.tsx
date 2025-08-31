'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Music, 
  Play, 
  Pause, 
  Download, 
  Share2, 
  RefreshCw, 
  CreditCard,
  CheckCircle,
  Clock,
  AlertCircle,
  Heart,
  Sparkles
} from 'lucide-react';
import { useAuth } from '@/lib/authContext';
import { usePayment } from '@/lib/paymentContext';
import { submitSongForm, getSongStatus, pollSongStatus } from '@/lib/api';
import AuthModal from './AuthModal';
import PaymentModal from './PaymentModal';

interface SongResult {
  id: string;
  title: string;
  audioUrl: string;
  coverUrl?: string;
  take: number;
  status: 'completed' | 'failed' | 'processing';
}

interface InlineComposerProps {
  isExpanded: boolean;
  onClose: () => void;
}

export default function InlineComposer({ isExpanded, onClose }: InlineComposerProps) {
  const { user, isAuthenticated, decrementTries } = useAuth();
  const { openPaymentModal, isPaymentModalOpen, closePaymentModal } = usePayment();
  
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    prompt: '',
    language: 'en',
    style: 'pop',
    seed: ''
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState<'idle' | 'queued' | 'processing' | 'finalizing' | 'ready'>('idle');
  const [songResults, setSongResults] = useState<SongResult[]>([]);
  const [currentSongId, setCurrentSongId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<string | null>(null);

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'tr', name: 'Türkçe' },
    { code: 'nl', name: 'Nederlands' },
    { code: 'es', name: 'Español' },
    { code: 'fr', name: 'Français' },
    { code: 'de', name: 'Deutsch' },
    { code: 'it', name: 'Italiano' },
    { code: 'pt', name: 'Português' },
    { code: 'ru', name: 'Русский' },
    { code: 'ja', name: '日本語' },
    { code: 'ko', name: '한국어' },
    { code: 'zh', name: '中文' }
  ];

  const styles = [
    { value: 'pop', label: 'Pop', description: 'Catchy, upbeat melodies' },
    { value: 'rock', label: 'Rock', description: 'Powerful, energetic sound' },
    { value: 'jazz', label: 'Jazz', description: 'Smooth, sophisticated harmonies' },
    { value: 'classical', label: 'Classical', description: 'Elegant, orchestral arrangements' },
    { value: 'country', label: 'Country', description: 'Heartfelt, storytelling style' },
    { value: 'electronic', label: 'Electronic', description: 'Modern, synthesized beats' },
    { value: 'folk', label: 'Folk', description: 'Acoustic, traditional feel' },
    { value: 'r&b', label: 'R&B', description: 'Soulful, smooth vocals' },
    { value: 'hip-hop', label: 'Hip-Hop', description: 'Rhythmic, urban sound' },
    { value: 'reggae', label: 'Reggae', description: 'Laid-back, island vibes' }
  ];

  const models = [
    { value: 'v3', label: 'Suno V3', description: 'Latest model with best quality' },
    { value: 'v2', label: 'Suno V2', description: 'Balanced performance and speed' },
    { value: 'v1', label: 'Suno V1', description: 'Fast generation, good quality' }
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleGenerate = async () => {
    if (!formData.prompt.trim()) {
      setError('Please enter a prompt for your song');
      return;
    }

    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
      return;
    }

    if (user && user.triesLeft <= 0) {
      openPaymentModal();
      return;
    }

    try {
      setError(null);
      setIsGenerating(true);
      setGenerationStatus('queued');

      // Submit song generation
      const result = await submitSongForm({
        fullName: user?.name || 'User',
        email: user?.email || '',
        specialOccasion: 'Custom',
        songStyle: formData.style,
        mood: 'Custom',
        yourStory: formData.prompt,
        additionalNotes: formData.seed,
        instrumental: false
      });

      setCurrentSongId(result.songId);
      setGenerationStatus('processing');

      // Poll for status
      const finalResult = await pollSongStatus(result.songId, result.jobId);
      
      if (finalResult.status === 'completed' && finalResult.audioUrl) {
        const newSong: SongResult = {
          id: result.songId,
          title: `Song ${songResults.length + 1}`,
          audioUrl: finalResult.audioUrl,
          take: songResults.length + 1,
          status: 'completed'
        };

        setSongResults(prev => [...prev, newSong]);
        setGenerationStatus('ready');
        
        // Decrement tries
        decrementTries();
      } else {
        setError('Song generation failed. Please try again.');
        setGenerationStatus('idle');
      }
    } catch (err: any) {
      setError(err?.message || 'Generation failed');
      setGenerationStatus('idle');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerate = async () => {
    if (user && user.triesLeft <= 0) {
      openPaymentModal();
      return;
    }

    // Clear previous results and start new generation
    setSongResults([]);
    setCurrentSongId(null);
    setGenerationStatus('idle');
    
    // Start new generation
    await handleGenerate();
  };

  const handlePaymentSuccess = () => {
    // Refresh user data and continue with generation
    handleGenerate();
  };

  const handleAuthSuccess = () => {
    // Continue with generation after successful auth
    handleGenerate();
  };

  const togglePlay = (songId: string) => {
    setIsPlaying(isPlaying === songId ? null : songId);
  };

  const getStatusIcon = () => {
    switch (generationStatus) {
      case 'queued': return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'processing': return <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'finalizing': return <Sparkles className="w-5 h-5 text-purple-500" />;
      case 'ready': return <CheckCircle className="w-5 h-5 text-green-500" />;
      default: return <Music className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusText = () => {
    switch (generationStatus) {
      case 'queued': return 'Queued';
      case 'processing': return 'Processing';
      case 'finalizing': return 'Finalizing';
      case 'ready': return 'Ready';
      default: return 'Ready to generate';
    }
  };

  if (!isExpanded) return null;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        className="w-full bg-white rounded-3xl shadow-premium border-2 border-accent-100 overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-accent-50 to-accent-100 p-6 border-b-2 border-accent-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-accent-600 rounded-2xl flex items-center justify-center">
                <Music className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Create Your Song</h3>
                <p className="text-accent-700">AI-powered personalized music creation</p>
              </div>
            </div>
            
            {user && (
              <div className="text-right">
                <div className="text-sm text-accent-600 font-medium">Tries left</div>
                <div className="text-2xl font-bold text-accent-700">{user.triesLeft}/3</div>
              </div>
            )}
          </div>
        </div>

        {/* Composer Form */}
        <div className="p-8">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Left side - Form */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Describe your song
                </label>
                <textarea
                  name="prompt"
                  value={formData.prompt}
                  onChange={handleInputChange}
                  rows={4}
                  className="input-field resize-none"
                  placeholder="Tell us about your special moment, the mood you want, or any specific lyrics you'd like to include..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Language
                  </label>
                  <select
                    name="language"
                    value={formData.language}
                    onChange={handleInputChange}
                    className="input-field"
                  >
                    {languages.map(lang => (
                      <option key={lang.code} value={lang.code}>
                        {lang.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Style
                  </label>
                  <select
                    name="style"
                    value={formData.style}
                    onChange={handleInputChange}
                    className="input-field"
                  >
                    {styles.map(style => (
                      <option key={style.value} value={style.value}>
                        {style.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Optional: Musical seed or reference
                </label>
                <input
                  type="text"
                  name="seed"
                  value={formData.seed}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="e.g., 'like Ed Sheeran' or 'upbeat wedding march'"
                />
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-sm"
                >
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="w-5 h-5" />
                    <span>{error}</span>
                  </div>
                </motion.div>
              )}

              <div className="flex space-x-4">
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating || !formData.prompt.trim()}
                  className="flex-1 btn-primary"
                >
                  {isGenerating ? (
                    <div className="flex items-center space-x-2">
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      <span>Generating...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Sparkles className="w-5 h-5" />
                      <span>Generate</span>
                    </div>
                  )}
                </button>

                {songResults.length > 0 && (
                  <button
                    onClick={handleRegenerate}
                    disabled={isGenerating || (user?.triesLeft ?? 0) <= 0}
                    className="btn-outline"
                  >
                    <div className="flex items-center space-x-2">
                      <RefreshCw className="w-5 h-5" />
                      <span>Regenerate (uses 1 try)</span>
                    </div>
                  </button>
                )}
              </div>

              {user && user.triesLeft <= 0 && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-2xl">
                  <div className="flex items-center justify-between">
                    <div className="text-yellow-800">
                      <strong>Out of tries!</strong> Buy more to continue creating.
                    </div>
                    <button
                      onClick={openPaymentModal}
                      className="btn-primary text-sm py-2 px-4"
                    >
                      Buy More Tries
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Right side - Status & Results */}
            <div className="space-y-6">
              {/* Status */}
              <div className="card-premium">
                <div className="flex items-center space-x-3 mb-4">
                  {getStatusIcon()}
                  <div>
                    <h4 className="font-semibold text-gray-900">Generation Status</h4>
                    <p className="text-gray-600">{getStatusText()}</p>
                  </div>
                </div>

                {isGenerating && (
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-accent-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                  </div>
                )}
              </div>

              {/* Results */}
              {songResults.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900">Your Songs</h4>
                  {songResults.map((song, index) => (
                    <motion.div
                      key={song.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="card border-2 border-accent-200"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-accent-600">Take {song.take}</span>
                          {song.status === 'completed' && (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date().toLocaleDateString()}
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => togglePlay(song.id)}
                          className="w-12 h-12 bg-accent-600 hover:bg-accent-700 rounded-2xl flex items-center justify-center text-white transition-colors"
                        >
                          {isPlaying === song.id ? (
                            <Pause className="w-5 h-5" />
                          ) : (
                            <Play className="w-5 h-5" />
                          )}
                        </button>

                        <div className="flex-1">
                          <h5 className="font-medium text-gray-900">{song.title}</h5>
                          <p className="text-sm text-gray-600">AI-generated personalized song</p>
                        </div>

                        <div className="flex space-x-2">
                          <button className="p-2 text-gray-400 hover:text-accent-600 transition-colors">
                            <Download className="w-5 h-5" />
                          </button>
                          <button className="p-2 text-gray-400 hover:text-accent-600 transition-colors">
                            <Share2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Modals */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={closePaymentModal}
        onSuccess={handlePaymentSuccess}
      />
    </>
  );
}
