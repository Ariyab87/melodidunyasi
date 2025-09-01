'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Music, Heart, Sparkles, Star, ArrowRight } from 'lucide-react';
import { useLanguage } from '@/lib/languageContext';

interface SongGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SongGenerationModal({ isOpen, onClose }: SongGenerationModalProps) {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    songDescription: '',
    occasion: 'birthday',
    mood: 'happy',
    language: 'english',
    musicalStyle: 'pop'
  });
  const [isGenerating, setIsGenerating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsGenerating(false);
      // Handle success
    }, 3000);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-4xl bg-gradient-to-br from-violet-900 via-purple-900 to-indigo-900 rounded-3xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0" style={{
                backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.15) 1px, transparent 0)`,
                backgroundSize: '40px 40px'
              }}></div>
            </div>

            {/* Floating Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <motion.div
                className="absolute top-10 right-10 text-violet-400/30 text-6xl"
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              >
                ♪
              </motion.div>
              <motion.div
                className="absolute bottom-20 left-16 text-purple-400/30 text-4xl"
                animate={{ y: [0, -20, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              >
                ♫
              </motion.div>
              <motion.div
                className="absolute top-1/2 left-1/4 text-pink-400/30 text-5xl"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              >
                ♬
              </motion.div>
            </div>

            {/* Header */}
            <div className="relative z-10 p-8 border-b border-white/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <Music className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-white mb-2">Create Your Song</h2>
                    <p className="text-violet-200">AI-powered personalized music creation</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="inline-flex items-center space-x-2 bg-pink-500/20 text-pink-300 px-3 py-1 rounded-full text-sm font-medium border border-pink-500/30">
                    <Star className="w-4 h-4" />
                    <span>ADMIN</span>
                  </div>
                  <p className="text-violet-300 text-sm mt-1">∞ Unlimited Access</p>
                </div>
              </div>
            </div>

            {/* Form Content */}
            <div className="relative z-10 p-8">
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Song Description */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center">
                      <Music className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-white">Describe your song</h3>
                  </div>
                  
                  <div className="relative">
                    <textarea
                      value={formData.songDescription}
                      onChange={(e) => handleInputChange('songDescription', e.target.value)}
                      placeholder="Tell us about your special moment, the emotions you want to convey, any specific story or message that should be in the song..."
                      className="w-full h-32 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4 text-white placeholder-violet-300 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none"
                    />
                    <div className="absolute bottom-4 right-4 text-violet-300 text-sm">
                      {formData.songDescription.length}/500
                    </div>
                  </div>
                  
                  <p className="text-violet-200 text-sm">
                    <Sparkles className="w-4 h-4 inline mr-2" />
                    Be specific! Include details about the occasion, people involved, and what makes this moment special.
                  </p>
                </div>

                {/* Form Fields Grid */}
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Occasion */}
                  <div className="space-y-3">
                    <label className="flex items-center space-x-2 text-white font-medium">
                      <span>🎉</span>
                      <span>Occasion</span>
                    </label>
                    <select
                      value={formData.occasion}
                      onChange={(e) => handleInputChange('occasion', e.target.value)}
                      className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    >
                      <option value="birthday">Birthday</option>
                      <option value="wedding">Wedding</option>
                      <option value="anniversary">Anniversary</option>
                      <option value="graduation">Graduation</option>
                      <option value="proposal">Proposal</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  {/* Mood */}
                  <div className="space-y-3">
                    <label className="flex items-center space-x-2 text-white font-medium">
                      <span>😊</span>
                      <span>Mood</span>
                    </label>
                    <select
                      value={formData.mood}
                      onChange={(e) => handleInputChange('mood', e.target.value)}
                      className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    >
                      <option value="happy">Happy</option>
                      <option value="romantic">Romantic</option>
                      <option value="energetic">Energetic</option>
                      <option value="calm">Calm</option>
                      <option value="nostalgic">Nostalgic</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  {/* Language */}
                  <div className="space-y-3">
                    <label className="flex items-center space-x-2 text-white font-medium">
                      <span>🌍</span>
                      <span>Language</span>
                    </label>
                    <select
                      value={formData.language}
                      onChange={(e) => handleInputChange('language', e.target.value)}
                      className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    >
                      <option value="english">English</option>
                      <option value="turkish">Turkish</option>
                      <option value="dutch">Dutch</option>
                      <option value="spanish">Spanish</option>
                      <option value="french">French</option>
                    </select>
                  </div>

                  {/* Musical Style */}
                  <div className="space-y-3">
                    <label className="flex items-center space-x-2 text-white font-medium">
                      <span>🎵</span>
                      <span>Musical Style</span>
                    </label>
                    <select
                      value={formData.musicalStyle}
                      onChange={(e) => handleInputChange('musicalStyle', e.target.value)}
                      className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    >
                      <option value="pop">Pop - Catchy, upbeat melodies</option>
                      <option value="rock">Rock - Powerful, energetic</option>
                      <option value="jazz">Jazz - Smooth, sophisticated</option>
                      <option value="classical">Classical - Elegant, timeless</option>
                      <option value="folk">Folk - Warm, acoustic</option>
                      <option value="electronic">Electronic - Modern, innovative</option>
                    </select>
                  </div>
                </div>

                {/* Generation Status */}
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                      <Music className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-white">Generation Status</h3>
                  </div>
                  <p className="text-violet-200">
                    {isGenerating ? 'Generating your song...' : 'Ready to generate'}
                  </p>
                </div>

                {/* Submit Button */}
                <div className="flex justify-center">
                  <button
                    type="submit"
                    disabled={isGenerating || !formData.songDescription.trim()}
                    className="group relative px-8 py-4 bg-gradient-to-r from-violet-500 to-purple-600 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    <div className="flex items-center space-x-3">
                      <Heart className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                      <span>{isGenerating ? 'Generating...' : 'Generate My Song'}</span>
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                    </div>
                  </button>
                </div>
              </form>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-6 right-6 z-20 p-2 text-white/70 hover:text-white transition-colors duration-300"
            >
              <X className="w-6 h-6" />
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
