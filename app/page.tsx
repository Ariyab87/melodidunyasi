'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Download, Play, Pause, Loader2 } from 'lucide-react';
import { useLanguage } from '@/lib/languageContext';
import { submitSongForm, StatusResp, getSongStatus } from '@/lib/api';
import Navigation from '@/components/Navigation';
import HeroSection from '@/components/HeroSection';
import HowItWorksSection from '@/components/HowItWorksSection';
import ServicesSection from '@/components/ServicesSection';
import InlineComposer from '@/components/InlineComposer';
import Footer from '@/components/Footer';
import { AuthProvider } from '@/lib/authContext';
import { PaymentProvider } from '@/lib/paymentContext';
import { SunoStatusProvider } from '@/lib/sunoStatusContext';
import React from 'react';

export default function Home() {
  const [isComposerExpanded, setIsComposerExpanded] = useState(false);
  const { t, language } = useLanguage();
  
  // Form state management
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    songDescription: '',
    occasion: '',
    musicalStyle: '',
    mood: '',
    tempo: '',
    language: '',
    songLength: '',
    specialInstructions: '',
    referenceSongs: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [submitMessage, setSubmitMessage] = useState('');
  
  // Song generation state
  const [songId, setSongId] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [songStatus, setSongStatus] = useState<'idle' | 'generating' | 'completed' | 'failed'>('idle');
  const [songProgress, setSongProgress] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  
  // Audio player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  const expandComposer = () => {
    setIsComposerExpanded(!isComposerExpanded);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');
    setSubmitMessage('');
    setSongStatus('idle');

    try {
      // Validate required fields
      const requiredFields = ['fullName', 'email', 'songDescription', 'occasion', 'musicalStyle', 'mood', 'tempo', 'language', 'songLength'];
      const missingFields = requiredFields.filter(field => !formData[field as keyof typeof formData]);
      
      if (missingFields.length > 0) {
        throw new Error(`Please fill in all required fields: ${missingFields.join(', ')}`);
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        throw new Error('Please enter a valid email address');
      }

      // Prepare the data for Suno API submission
      const songFormData = {
        fullName: formData.fullName,
        email: formData.email,
        specialOccasion: formData.occasion,
        songStyle: formData.musicalStyle,
        mood: formData.mood,
        tempo: formData.tempo,
        language: formData.language === 'instrumental' ? 'en' : formData.language,
        namesToInclude: formData.fullName,
        yourStory: formData.songDescription,
        additionalNotes: `${formData.specialInstructions ? `Special Instructions: ${formData.specialInstructions}. ` : ''}${formData.referenceSongs ? `Reference Songs: ${formData.referenceSongs}. ` : ''}Song Length: ${formData.songLength}`,
        instrumental: formData.language === 'instrumental'
      };

      // Submit to Suno API for song generation
      const response = await submitSongForm(songFormData);
      
      if (response.success) {
        setSongId(response.songId);
        setJobId(response.jobId);
        setSongStatus('generating');
        setSubmitStatus('success');
        setSubmitMessage('Song generation started! This may take a few minutes. We\'ll notify you when it\'s ready.');
        
        // Start polling for song status
        pollSongStatus(response.songId);
      } else {
        throw new Error('Failed to start song generation');
      }

    } catch (error) {
      setSubmitStatus('error');
      setSubmitMessage(error instanceof Error ? error.message : 'An error occurred while submitting your request. Please try again.');
      setSongStatus('failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Poll song status until completion
  const pollSongStatus = async (songId: string) => {
    const maxAttempts = 60; // 5 minutes with 5-second intervals
    let attempts = 0;
    
    const poll = async () => {
      if (attempts >= maxAttempts) {
        setSongStatus('failed');
        setSubmitMessage('Song generation timed out. Please try again.');
        return;
      }
      
      try {
        const response = await getSongStatus(songId);
        const statusData: StatusResp = response;
        
        if (statusData.status === 'completed' && statusData.audioUrl) {
          setSongStatus('completed');
          setAudioUrl(statusData.audioUrl);
          setSubmitMessage('Your song is ready! You can now play and download it.');
          
          // Download audio for offline use
          downloadAudio(statusData.audioUrl);
        } else if (statusData.status === 'failed' || statusData.status === 'error') {
          setSongStatus('failed');
          setSubmitMessage('Song generation failed. Please try again.');
        } else {
          // Still processing, continue polling
          setSongProgress(statusData.progress || 0);
          attempts++;
          setTimeout(poll, 5000); // Poll every 5 seconds
        }
      } catch (error) {
        console.error('Error polling song status:', error);
        attempts++;
        setTimeout(poll, 5000);
      }
    };
    
    poll();
  };

  // Download audio file
  const downloadAudio = async (url: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      setAudioBlob(blob);
    } catch (error) {
      console.error('Error downloading audio:', error);
    }
  };

  // Audio player controls
  const togglePlayPause = () => {
    if (!audioElement) return;
    
    if (isPlaying) {
      audioElement.pause();
      setIsPlaying(false);
    } else {
      audioElement.play();
      setIsPlaying(true);
    }
  };

  const handleDownload = () => {
    if (!audioBlob) return;
    
    const url = URL.createObjectURL(audioBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `song_${songId}.mp3`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Initialize audio element when audioUrl changes
  React.useEffect(() => {
    if (audioUrl && !audioElement) {
      const audio = new Audio(audioUrl);
      audio.addEventListener('ended', () => setIsPlaying(false));
      setAudioElement(audio);
    }
  }, [audioUrl, audioElement]);

  // Cleanup audio element
  React.useEffect(() => {
    return () => {
      if (audioElement) {
        audioElement.pause();
        audioElement.src = '';
      }
    };
  }, [audioElement]);

  return (
    <AuthProvider>
      <PaymentProvider>
        <SunoStatusProvider>
          <main className="min-h-screen bg-special-gradient relative overflow-hidden">
            {/* Animated background particles */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 1 }}>
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 bg-violet-400/30 rounded-full"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    zIndex: 2
                  }}
                  animate={{
                    y: [0, -100, 0],
                    opacity: [0, 1, 0],
                    scale: [0, 1, 0]
                  }}
                  transition={{
                    duration: 3 + Math.random() * 2,
                    repeat: Infinity,
                    delay: Math.random() * 2,
                    ease: "easeInOut"
                  }}
                />
              ))}
            </div>

            <Navigation onCreateSong={() => {
              const element = document.getElementById('song-request');
              if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
            }} />
            
            <HeroSection onCreateSong={() => {
              const element = document.getElementById('song-request');
              if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
            }} />
            
            {/* Services Section */}
            <motion.section 
              id="services" 
              className="section-padding bg-gradient-to-b from-violet-50/80 to-white/70 relative"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1 }}
            >
              <div className="container-custom relative z-10">
                <ServicesSection />
              </div>
            </motion.section>
            
            {/* Song Request Section */}
            <motion.section 
              id="song-request" 
              className="section-padding bg-gradient-to-b from-white/70 to-violet-50/80 relative"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1 }}
            >
              <div className="container-custom relative z-10">
                <div className="text-center mb-16">
                  <motion.h2
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="text-4xl font-bold text-gray-900 mb-6"
                    key={`page-title-${language}`}
                  >
                    {t('songForm.title')}
                  </motion.h2>
                  <p className="text-xl text-gray-600 max-w-3xl mx-auto" key={`page-subtitle-${language}`}>
                    {t('songForm.subtitle')}
                  </p>
                </div>
                
                {/* Song Request Form */}
                <div className="max-w-4xl mx-auto" key={language}>
                  <div className="bg-gradient-to-br from-violet-900 via-purple-900 to-indigo-900 rounded-3xl p-8 shadow-2xl">
                    <div className="text-center mb-8">
                      <div className="w-20 h-20 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <span className="text-4xl">🎵</span>
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-2" key={`header-title-${language}`}>{t('songForm.header.title')}</h3>
                      <p className="text-violet-200" key={`header-subtitle-${language}`}>{t('songForm.header.subtitle')}</p>
                    </div>
                    
                    <form onSubmit={handleFormSubmit} className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-white font-medium mb-2" key={`fullName-${language}`}>{t('songForm.fields.fullName')}</label>
                          <input
                            type="text"
                            value={formData.fullName}
                            onChange={(e) => handleInputChange('fullName', e.target.value)}
                            className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-3 text-white placeholder-violet-300 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                            placeholder={t('songForm.placeholders.fullName')}
                            required
                            key={`fullName-input-${language}`}
                          />
                        </div>
                        <div>
                          <label className="block text-white font-medium mb-2" key={`email-${language}`}>{t('songForm.fields.email')}</label>
                          <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => handleInputChange('email', e.target.value)}
                            className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-3 text-white placeholder-violet-300 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                            placeholder={t('songForm.placeholders.email')}
                            required
                            key={`email-input-${language}`}
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-white font-medium mb-2" key={`songDescription-${language}`}>{t('songForm.fields.songDescription')}</label>
                        <textarea
                          value={formData.songDescription}
                          onChange={(e) => handleInputChange('songDescription', e.target.value)}
                          className="w-full h-32 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-3 text-white placeholder-violet-300 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none"
                          placeholder={t('songForm.placeholders.songDescription')}
                          required
                          key={`songDescription-textarea-${language}`}
                        />
                        <p className="text-violet-300 text-xs mt-2" key={`songDescription-help-${language}`}>{t('songForm.helpText.songDescription')}</p>
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-white font-medium mb-2">Occasion *</label>
                          <select 
                            value={formData.occasion}
                            onChange={(e) => handleInputChange('occasion', e.target.value)}
                            className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent" 
                            required
                          >
                            <option value="">Select an occasion</option>
                            <option value="wedding">Wedding / Marriage</option>
                            <option value="proposal">Proposal / Engagement</option>
                            <option value="anniversary">Anniversary</option>
                            <option value="birthday">Birthday</option>
                            <option value="graduation">Graduation</option>
                            <option value="baby">Baby Shower / New Baby</option>
                            <option value="memorial">Memorial / Tribute</option>
                            <option value="celebration">General Celebration</option>
                            <option value="love">Love Song</option>
                            <option value="friendship">Friendship</option>
                            <option value="family">Family</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-white font-medium mb-2">Musical Style *</label>
                          <select 
                            value={formData.musicalStyle}
                            onChange={(e) => handleInputChange('musicalStyle', e.target.value)}
                            className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent" 
                            required
                          >
                            <option value="">Select musical style</option>
                            <option value="pop">Pop - Catchy, upbeat melodies</option>
                            <option value="rock">Rock - Powerful, energetic</option>
                            <option value="jazz">Jazz - Smooth, sophisticated</option>
                            <option value="classical">Classical - Elegant, timeless</option>
                            <option value="folk">Folk - Warm, acoustic</option>
                            <option value="electronic">Electronic - Modern, innovative</option>
                            <option value="country">Country - Storytelling, heartfelt</option>
                            <option value="r&b">R&B - Soulful, smooth</option>
                            <option value="indie">Indie - Alternative, unique</option>
                            <option value="latin">Latin - Rhythmic, passionate</option>
                          </select>
                        </div>
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-white font-medium mb-2">Mood & Emotion *</label>
                          <select 
                            value={formData.mood}
                            onChange={(e) => handleInputChange('mood', e.target.value)}
                            className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent" 
                            required
                          >
                            <option value="">Select mood</option>
                            <option value="romantic">Romantic & Loving</option>
                            <option value="joyful">Joyful & Happy</option>
                            <option value="nostalgic">Nostalgic & Sentimental</option>
                            <option value="energetic">Energetic & Upbeat</option>
                            <option value="calm">Calm & Peaceful</option>
                            <option value="melancholic">Melancholic & Reflective</option>
                            <option value="celebratory">Celebratory & Festive</option>
                            <option value="inspirational">Inspirational & Uplifting</option>
                            <option value="intimate">Intimate & Personal</option>
                            <option value="playful">Playful & Fun</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-white font-medium mb-2">Tempo *</label>
                          <select 
                            value={formData.tempo}
                            onChange={(e) => handleInputChange('tempo', e.target.value)}
                            className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent" 
                            required
                          >
                            <option value="">Select tempo</option>
                            <option value="slow">Slow & Ballad-like (60-80 BPM)</option>
                            <option value="medium-slow">Medium-Slow (80-100 BPM)</option>
                            <option value="medium">Medium (100-120 BPM)</option>
                            <option value="medium-fast">Medium-Fast (120-140 BPM)</option>
                            <option value="fast">Fast & Energetic (140+ BPM)</option>
                          </select>
                        </div>
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-white font-medium mb-2">Language *</label>
                          <select 
                            value={formData.language}
                            onChange={(e) => handleInputChange('language', e.target.value)}
                            className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent" 
                            required
                          >
                            <option value="">Select language</option>
                            <option value="english">English</option>
                            <option value="turkish">Turkish</option>
                            <option value="dutch">Dutch</option>
                            <option value="spanish">Spanish</option>
                            <option value="french">French</option>
                            <option value="german">German</option>
                            <option value="italian">Italian</option>
                            <option value="portuguese">Portuguese</option>
                            <option value="instrumental">Instrumental (No Lyrics)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-white font-medium mb-2">Song Length *</label>
                          <select 
                            value={formData.songLength}
                            onChange={(e) => handleInputChange('songLength', e.target.value)}
                            className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent" 
                            required
                          >
                            <option value="">Select length</option>
                            <option value="short">Short (1-2 minutes)</option>
                            <option value="medium">Medium (2-3 minutes)</option>
                            <option value="long">Long (3-4 minutes)</option>
                            <option value="extended">Extended (4+ minutes)</option>
                          </select>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-white font-medium mb-2">Special Instructions</label>
                        <textarea
                          value={formData.specialInstructions}
                          onChange={(e) => handleInputChange('specialInstructions', e.target.value)}
                          className="w-full h-24 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-3 text-white placeholder-violet-300 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none"
                          placeholder="Any specific instruments, vocal style, or special elements you'd like? (e.g., 'Include piano solo', 'Female vocals', 'Add strings', 'Make it danceable')"
                        />
                        <p className="text-violet-300 text-xs mt-2">Optional: Add specific musical elements, instruments, or vocal preferences.</p>
                      </div>
                      
                      <div>
                        <label className="block text-white font-medium mb-2">Reference Songs (Optional)</label>
                        <input
                          type="text"
                          value={formData.referenceSongs}
                          onChange={(e) => handleInputChange('referenceSongs', e.target.value)}
                          className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-3 text-white placeholder-violet-300 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                          placeholder="e.g., 'Like Ed Sheeran's Perfect', 'Similar to Adele's style'"
                        />
                        <p className="text-violet-300 text-xs mt-2">Mention songs or artists you like for reference (optional).</p>
                      </div>
                      
                                            <div className="text-center pt-6">
                        {/* Status Messages */}
                        {submitStatus === 'success' && (
                          <div className="mb-4 p-4 bg-green-500/20 border border-green-500/30 rounded-xl">
                            <p className="text-green-300 text-sm">{submitMessage}</p>
                          </div>
                        )}
                        
                        {submitStatus === 'error' && (
                          <div className="mb-4 p-4 bg-red-500/20 border border-red-500/30 rounded-xl">
                            <p className="text-red-300 text-sm">{submitMessage}</p>
                          </div>
                        )}
                        
                        {/* Song Generation Status */}
                        {songStatus === 'generating' && (
                          <div className="mb-4 p-4 bg-blue-500/20 border border-blue-500/30 rounded-xl">
                            <div className="flex items-center justify-center space-x-3 mb-2">
                              <Loader2 className="w-5 h-5 animate-spin text-blue-300" />
                              <span className="text-blue-300 text-sm">Generating your song...</span>
                            </div>
                            <div className="w-full bg-blue-500/20 rounded-full h-2">
                              <div 
                                className="bg-blue-400 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${songProgress}%` }}
                              ></div>
                            </div>
                            <p className="text-blue-300 text-xs mt-2">This may take a few minutes</p>
                          </div>
                        )}
                        
                        {/* Audio Player */}
                        {songStatus === 'completed' && audioUrl && (
                          <div className="mb-6 p-6 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-xl">
                            <h4 className="text-lg font-semibold text-green-300 mb-4">🎵 Your Song is Ready!</h4>
                            
                            {/* Audio Controls */}
                            <div className="flex items-center justify-center space-x-4 mb-4">
                              <button
                                onClick={togglePlayPause}
                                className="flex items-center justify-center w-16 h-16 bg-green-500 hover:bg-green-600 rounded-full transition-colors duration-200"
                              >
                                {isPlaying ? (
                                  <Pause className="w-8 h-8 text-white" />
                                ) : (
                                  <Play className="w-8 h-8 text-white ml-1" />
                                )}
                              </button>
                              
                              <button
                                onClick={handleDownload}
                                className="flex items-center space-x-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-colors duration-200"
                              >
                                <Download className="w-5 h-5" />
                                <span>Download MP3</span>
                              </button>
                            </div>
                            
                            <p className="text-green-300 text-sm">Your personalized song has been generated successfully!</p>
                          </div>
                        )}
                        
                        <button
                          type="submit"
                          disabled={isSubmitting || songStatus === 'generating'}
                          className={`group relative px-8 py-4 bg-gradient-to-r from-violet-500 to-purple-600 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 ${
                            (isSubmitting || songStatus === 'generating') ? 'opacity-70 cursor-not-allowed' : ''
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            {isSubmitting ? (
                              <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                <span>Submitting...</span>
                              </>
                            ) : songStatus === 'generating' ? (
                              <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span>Generating Song...</span>
                              </>
                            ) : (
                              <>
                                <span className="text-xl">💝</span>
                                <span key={`submit-button-${language}`}>{t('songForm.submitButton')}</span>
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                              </>
                            )}
                          </div>
                        </button>
                        <p className="text-violet-300 text-sm mt-3" key={`response-time-${language}`}>
                          {t('songForm.responseTime')}
                        </p>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </motion.section>
            
            {/* Inline Composer Section */}
            <motion.section 
              id="composer" 
              className="section-padding bg-gradient-to-b from-transparent to-white/70 relative"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1 }}
            >
              {/* Decorative elements */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <motion.div
                  className="absolute top-10 left-10 w-32 h-32 bg-gradient-to-br from-violet-200/20 to-purple-300/20 rounded-full blur-3xl"
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.2, 0.4, 0.2]
                  }}
                  transition={{
                    duration: 6,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
                <motion.div
                  className="absolute bottom-10 right-10 w-40 h-40 bg-gradient-to-br from-blue-200/20 to-indigo-300/20 rounded-full blur-3xl"
                  animate={{
                    scale: [1, 1.4, 1],
                    opacity: [0.2, 0.3, 0.2]
                  }}
                  transition={{
                    duration: 8,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 2
                  }}
                />
              </div>

              <div className="container-custom relative z-10">
                <InlineComposer 
                  isExpanded={isComposerExpanded} 
                  onClose={() => setIsComposerExpanded(false)} 
                />
              </div>
            </motion.section>

            {/* How It Works Section */}
            <motion.section 
              id="how-it-works" 
              className="section-padding bg-gradient-to-b from-white/70 to-violet-50/80 relative"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1 }}
            >
              {/* Decorative wave */}
              <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-white/70 to-transparent" />
              
              <div className="container-custom relative z-10">
                <HowItWorksSection />
              </div>
            </motion.section>

            {/* Video Request Section */}
            <motion.section 
              id="video-request" 
              className="section-padding bg-gradient-to-b from-violet-50/80 to-blue-50/80 relative"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1 }}
            >
              {/* Decorative elements */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <motion.div
                  className="absolute top-20 right-20 w-40 h-40 bg-gradient-to-br from-blue-200/20 to-indigo-300/20 rounded-full blur-3xl"
                  animate={{
                    scale: [1, 1.4, 1],
                    opacity: [0.2, 0.3, 0.2]
                  }}
                  transition={{
                    duration: 8,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 1
                  }}
                />
              </div>

              <div className="container-custom relative z-10">
                <div className="text-center mb-16">
                  <motion.h2
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="text-4xl font-bold text-gray-900 mb-6"
                  >
                    {t('videoRequest.title')}{' '}
                    <span className="text-gradient-wedding">AI Magic</span>
                  </motion.h2>
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="text-xl text-gray-600 max-w-3xl mx-auto"
                  >
                    {t('videoRequest.subtitle')}
                  </motion.p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                  {[
                    {
                      icon: '🎬',
                      title: t('videoRequest.features.photoToVideo.title'),
                      description: t('videoRequest.features.photoToVideo.description'),
                      features: [t('videoRequest.features.photoToVideo.feature1'), t('videoRequest.features.photoToVideo.feature2'), t('videoRequest.features.photoToVideo.feature3')]
                    },
                    {
                      icon: '🎵',
                      title: t('videoRequest.features.musicIntegration.title'),
                      description: t('videoRequest.features.musicIntegration.description'),
                      features: [t('videoRequest.features.musicIntegration.feature1'), t('videoRequest.features.musicIntegration.feature2'), t('videoRequest.features.musicIntegration.feature3')]
                    },
                    {
                      icon: '✨',
                      title: t('videoRequest.features.aiEffects.title'),
                      description: t('videoRequest.features.aiEffects.description'),
                      features: [t('videoRequest.features.aiEffects.feature1'), t('videoRequest.features.aiEffects.feature2'), t('videoRequest.features.aiEffects.feature3')]
                    }
                  ].map((feature, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 50 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.6, delay: index * 0.2 }}
                      whileHover={{ scale: 1.05, y: -10 }}
                      className="bg-white/90 backdrop-blur-md rounded-3xl p-8 border-2 border-white/60 shadow-xl hover:shadow-2xl transition-all duration-500"
                    >
                      <div className="text-6xl mb-6">{feature.icon}</div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-4">{feature.title}</h3>
                      <p className="text-gray-600 mb-6">{feature.description}</p>
                      <ul className="space-y-2">
                        {feature.features.map((item, idx) => (
                          <li key={idx} className="flex items-center space-x-2 text-sm text-gray-600">
                            <div className="w-2 h-2 bg-violet-500 rounded-full"></div>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  ))}
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 0.6 }}
                  className="text-center mt-12"
                >
                  <button 
                    className="btn-primary text-lg px-8 py-4"
                    onClick={() => {
                      const element = document.getElementById('voice-cloning');
                      if (element) {
                        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }
                    }}
                  >
                    <div className="flex items-center space-x-2">
                      <span>🎬</span>
                      <span>{t('videoRequest.cta.button')}</span>
                      <ArrowRight className="w-5 h-5" />
                    </div>
                  </button>
                </motion.div>
              </div>
            </motion.section>

            {/* Voice Cloning Section */}
            <motion.section 
              id="voice-cloning" 
              className="section-padding bg-gradient-to-b from-blue-50/80 to-indigo-100/80 relative"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1 }}
            >
              {/* Decorative elements */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 1 }}>
                <motion.div
                  className="absolute bottom-20 left-20 w-48 h-48 bg-gradient-to-br from-indigo-200/20 to-purple-300/20 rounded-full blur-3xl"
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.2, 0.4, 0.2]
                  }}
                  transition={{
                    duration: 10,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 2
                  }}
                  style={{ zIndex: 2 }}
                />
              </div>

              <div className="container-custom relative z-10">
                <div className="text-center mb-16">
                  <motion.h2
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="text-4xl font-bold text-gray-900 mb-6"
                  >
                    {t('voiceCloning.title')}{' '}
                    <span className="text-gradient-wedding">AI Technology</span>
                  </motion.h2>
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="text-xl text-gray-600 max-w-3xl mx-auto"
                  >
                    {t('voiceCloning.subtitle')}
                  </motion.p>
                </div>

                <div className="grid lg:grid-cols-2 gap-12 items-center">
                  {/* Left side - Features */}
                  <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="space-y-8"
                  >
                    {[
                      {
                        icon: '🎤',
                        title: t('voiceCloning.features.recording.title'),
                        description: t('voiceCloning.features.recording.description'),
                        details: t('voiceCloning.features.recording.details')
                      },
                      {
                        icon: '🤖',
                        title: t('voiceCloning.features.processing.title'),
                        description: t('voiceCloning.features.processing.description'),
                        details: t('voiceCloning.features.processing.details')
                      },
                      {
                        icon: '🎵',
                        title: t('voiceCloning.features.integration.title'),
                        description: t('voiceCloning.features.integration.description'),
                        details: t('voiceCloning.features.integration.details')
                      }
                    ].map((feature, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: index * 0.2 }}
                        className="flex space-x-4"
                      >
                        <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-violet-100 to-purple-100 rounded-2xl flex items-center justify-center text-3xl">
                          {feature.icon}
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                          <p className="text-gray-600 mb-2">{feature.description}</p>
                          <p className="text-sm text-gray-500">{feature.details}</p>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>

                  {/* Right side - Visual */}
                  <motion.div
                    initial={{ opacity: 0, x: 50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className="relative"
                  >
                    <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-3xl p-8 border-2 border-violet-200">
                      <div className="text-center space-y-6">
                        <div className="w-24 h-24 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full flex items-center justify-center mx-auto shadow-lg">
                          <span className="text-4xl">🎤</span>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900">{t('voiceCloning.cta.title')}</h3>
                        <p className="text-gray-600">{t('voiceCloning.cta.description')}</p>
                        <button className="btn-primary">
                          <div className="flex items-center space-x-2">
                            <span>🎙️</span>
                            <span>{t('voiceCloning.cta.button')}</span>
                          </div>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </div>
                
                {/* Call to Action */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 0.8 }}
                  className="text-center mt-16"
                >
                  <button 
                    className="btn-primary text-lg px-8 py-4"
                    onClick={() => {
                      const element = document.getElementById('song-request');
                      if (element) {
                        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }
                    }}
                  >
                    <div className="flex items-center space-x-2">
                      <span>🎵</span>
                                              <span>{t('cta.createSongNow')}</span>
                      <ArrowRight className="w-5 h-5" />
                    </div>
                  </button>
                  <p className="text-gray-600 mt-4 max-w-2xl mx-auto">
                    {t('cta.readyToCreate')}
                  </p>
                </motion.div>
              </div>
            </motion.section>

            <Footer />
          </main>
        </SunoStatusProvider>
      </PaymentProvider>
    </AuthProvider>
  );
}
