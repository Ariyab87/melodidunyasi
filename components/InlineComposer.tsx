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
  Sparkles,
  Upload
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
    seed: '',
    occasion: 'birthday',
    mood: 'happy',
    tempo: 'medium',
    duration: 'short',
    vocals: 'vocal',
    instruments: 'piano',
    referenceArtist: '',
    specialInstructions: '',
    imagePreview: ''
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

  const occasions = [
    { value: 'birthday', label: 'Birthday', emoji: '🎉' },
    { value: 'anniversary', label: 'Anniversary', emoji: '💑' },
    { value: 'wedding', label: 'Wedding', emoji: '👰' },
    { value: 'graduation', label: 'Graduation', emoji: '🎓' },
    { value: 'prom', label: 'Prom', emoji: '🎊' },
    { value: 'party', label: 'Party', emoji: '🎉' },
    { value: 'holiday', label: 'Holiday', emoji: '🎄' },
    { value: 'valentines', label: 'Valentine\'s Day', emoji: '💖' },
    { value: 'christmas', label: 'Christmas', emoji: '🎄' },
    { value: 'newyear', label: 'New Year', emoji: '🎉' }
  ];

  const moods = [
    { value: 'happy', label: 'Happy', emoji: '😊' },
    { value: 'sad', label: 'Sad', emoji: '😢' },
    { value: 'romantic', label: 'Romantic', emoji: '💖' },
    { value: 'angry', label: 'Angry', emoji: '😠' },
    { value: 'relaxed', label: 'Relaxed', emoji: '😌' },
    { value: 'energetic', label: 'Energetic', emoji: '💪' },
    { value: 'mysterious', label: 'Mysterious', emoji: '🤫' },
    { value: 'mysterious', label: 'Mysterious', emoji: '🤫' },
    { value: 'mysterious', label: 'Mysterious', emoji: '🤫' }
  ];

  const tempos = [
    { value: 'slow', label: 'Slow', description: 'Gentle, relaxed pace' },
    { value: 'medium', label: 'Medium', description: 'Balanced, easy to sing' },
    { value: 'fast', label: 'Fast', description: 'Energetic, lively pace' },
    { value: 'upbeat', label: 'Upbeat', description: 'High energy, perfect for dancing' },
    { value: 'chill', label: 'Chill', description: 'Calm, soothing pace' }
  ];

  const durations = [
    { value: 'short', label: 'Short (2-3 minutes)', description: 'Perfect for a quick listen' },
    { value: 'medium', label: 'Medium (4-5 minutes)', description: 'Good for a full song' },
    { value: 'long', label: 'Long (6+ minutes)', description: 'Perfect for a full album track' }
  ];

  const vocals = [
    { value: 'vocal', label: 'Vocal', description: 'Mainly vocal melody' },
    { value: 'instrumental', label: 'Instrumental', description: 'No vocal melody, just instrumental' },
    { value: 'both', label: 'Both', description: 'Both vocal and instrumental' }
  ];

  const instruments = [
    { value: 'piano', label: 'Piano', emoji: '🎹' },
    { value: 'guitar', label: 'Guitar', emoji: '🎸' },
    { value: 'drums', label: 'Drums', emoji: '🥁' },
    { value: 'bass', label: 'Bass', emoji: '🎸' },
    { value: 'violin', label: 'Violin', emoji: '🎻' },
    { value: 'saxophone', label: 'Saxophone', emoji: '🎷' },
    { value: 'flute', label: 'Flute', emoji: '🎺' },
    { value: 'trumpet', label: 'Trumpet', emoji: '🎺' },
    { value: 'clarinet', label: 'Clarinet', emoji: '🎷' },
    { value: 'cello', label: 'Cello', emoji: '🎻' }
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, imagePreview: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setFormData(prev => ({ ...prev, imagePreview: '' }));
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

    // Check if user has tries left (skip for admins)
    if (!user?.isAdmin && (user?.triesLeft ?? 0) <= 0) {
      openPaymentModal();
      return;
    }

    try {
      setError(null);
      setIsGenerating(true);
      setGenerationStatus('queued');

      // Prepare form data for API
      const songData = {
        name: user?.name || 'User',
        email: user?.email || '',
        specialOccasion: formData.occasion,
        songStyle: formData.style,
        mood: formData.mood,
        story: formData.prompt,
        additionalNotes: formData.specialInstructions,
        instrumental: false,
        tempo: formData.tempo,
        duration: formData.duration,
        vocals: formData.vocals,
        mainInstrument: formData.instruments,
        referenceArtist: formData.referenceArtist,
        imageUrl: formData.imagePreview || undefined,
        seed: formData.seed
      };

      // Submit song generation
      const result = await submitSongForm(songData);

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
        
        // Decrement tries (skip for admins)
        if (!user?.isAdmin) {
          decrementTries();
        }
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
    // Clear previous results
    setSongResults([]);
    setError(null);
    
    // Check if user has tries left (skip for admins)
    if (!user?.isAdmin && (user?.triesLeft ?? 0) <= 0) {
      openPaymentModal();
      return;
    }
    
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
        <div className="bg-gradient-to-r from-accent-50 to-accent-100 p-6 border-b-2 border-accent-200 relative z-20">
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
              <div className="text-right relative z-30">
                {user.isAdmin ? (
                  <div className="space-y-2">
                    <div className="flex justify-end">
                      <span className="px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold rounded-full shadow-lg">
                        ADMIN
                      </span>
                    </div>
                    <div className="text-sm text-accent-600 font-medium">♾️ Unlimited Access</div>
                  </div>
                ) : (
                  <>
                    <div className="text-sm text-accent-600 font-medium">Tries left</div>
                    <div className="text-2xl font-bold text-accent-700">{user.triesLeft}/3</div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Composer Form */}
        <div className="p-8">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Left side - Form */}
            <div className="space-y-6">
              {/* Main Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <span className="text-lg">🎵</span> Describe your song
                </label>
                <textarea
                  name="prompt"
                  value={formData.prompt}
                  onChange={handleInputChange}
                  rows={4}
                  className="input-field resize-none"
                  placeholder="Tell us about your special moment, the emotions you want to convey, any specific story or message that should be in the song..."
                />
                <p className="text-xs text-gray-500 mt-2">
                  Be specific! Include details about the occasion, people involved, and what makes this moment special.
                </p>
              </div>

              {/* Occasion and Mood */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <span className="text-lg">🎉</span> Occasion
                  </label>
                  <select
                    name="occasion"
                    value={formData.occasion}
                    onChange={handleInputChange}
                    className="input-field"
                  >
                    {occasions.map(occasion => (
                      <option key={occasion.value} value={occasion.value}>
                        {occasion.emoji} {occasion.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <span className="text-lg">💫</span> Mood
                  </label>
                  <select
                    name="mood"
                    value={formData.mood}
                    onChange={handleInputChange}
                    className="input-field"
                  >
                    {moods.map(mood => (
                      <option key={mood.value} value={mood.value}>
                        {mood.emoji} {mood.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Language and Style */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <span className="text-lg">🌍</span> Language
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
                    <span className="text-lg">🎼</span> Musical Style
                  </label>
                  <select
                    name="style"
                    value={formData.style}
                    onChange={handleInputChange}
                    className="input-field"
                  >
                    {styles.map(style => (
                      <option key={style.value} value={style.value}>
                        {style.label} - {style.description}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Tempo and Duration */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <span className="text-lg">⏱️</span> Tempo
                  </label>
                  <select
                    name="tempo"
                    value={formData.tempo}
                    onChange={handleInputChange}
                    className="input-field"
                  >
                    {tempos.map(tempo => (
                      <option key={tempo.value} value={tempo.value}>
                        {tempo.label} - {tempo.description}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <span className="text-lg">⏰</span> Duration
                  </label>
                  <select
                    name="duration"
                    value={formData.duration}
                    onChange={handleInputChange}
                    className="input-field"
                  >
                    {durations.map(duration => (
                      <option key={duration.value} value={duration.value}>
                        {duration.label} - {duration.description}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Vocals and Instruments */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <span className="text-lg">🎤</span> Vocals
                  </label>
                  <select
                    name="vocals"
                    value={formData.vocals}
                    onChange={handleInputChange}
                    className="input-field"
                  >
                    {vocals.map(vocal => (
                      <option key={vocal.value} value={vocal.value}>
                        {vocal.label} - {vocal.description}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <span className="text-lg">🎹</span> Main Instrument
                  </label>
                  <select
                    name="instruments"
                    value={formData.instruments}
                    onChange={handleInputChange}
                    className="input-field"
                  >
                    {instruments.map(instrument => (
                      <option key={instrument.value} value={instrument.value}>
                        {instrument.emoji} {instrument.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Reference Artist */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <span className="text-lg">🎭</span> Reference Artist (Optional)
                </label>
                <input
                  type="text"
                  name="referenceArtist"
                  value={formData.referenceArtist}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="e.g., 'like Ed Sheeran' or 'similar to Adele'"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Help us understand the style you're looking for by referencing artists you like.
                </p>
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <span className="text-lg">🖼️</span> Upload Inspiration Image (Optional)
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-2xl p-6 text-center hover:border-violet-400 transition-colors duration-300">
                  {formData.imagePreview ? (
                    <div className="space-y-4">
                      <img 
                        src={formData.imagePreview} 
                        alt="Preview" 
                        className="w-32 h-32 object-cover rounded-xl mx-auto shadow-lg"
                      />
                      <div className="flex justify-center space-x-3">
                        <button
                          type="button"
                          onClick={removeImage}
                          className="px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors duration-300"
                        >
                          Remove Image
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="w-16 h-16 bg-violet-100 rounded-full flex items-center justify-center mx-auto">
                        <Upload className="w-8 h-8 text-violet-600" />
                      </div>
                      <div>
                        <p className="text-gray-600 font-medium">Click to upload or drag and drop</p>
                        <p className="text-sm text-gray-500">PNG, JPG up to 5MB</p>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        id="image-upload"
                      />
                      <label
                        htmlFor="image-upload"
                        className="inline-block px-6 py-3 bg-violet-100 text-violet-700 rounded-lg hover:bg-violet-200 transition-colors duration-300 cursor-pointer"
                      >
                        Choose Image
                      </label>
                    </div>
                  )}
                </div>
              </div>

              {/* Special Instructions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <span className="text-lg">💡</span> Special Instructions (Optional)
                </label>
                <textarea
                  name="specialInstructions"
                  value={formData.specialInstructions}
                  onChange={handleInputChange}
                  rows={3}
                  className="input-field resize-none"
                  placeholder="Any specific details, lyrics you want included, or special requests..."
                />
                <p className="text-xs text-gray-500 mt-2">
                  Add any extra details that will help us create your perfect song.
                </p>
              </div>

              {/* Error Display */}
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

              {/* Action Buttons */}
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
                      <span>Generate Song</span>
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

              {/* Out of Tries Warning */}
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
