'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import Navigation from '@/components/Navigation';
import HeroSection from '@/components/HeroSection';
import ServicesSection from '@/components/ServicesSection';
import InlineComposer from '@/components/InlineComposer';
import HowItWorksSection from '@/components/HowItWorksSection';
import FAQSection from '@/components/FAQSection';
import Footer from '@/components/Footer';
import { AuthProvider } from '@/lib/authContext';
import { PaymentProvider } from '@/lib/paymentContext';
import { SunoStatusProvider } from '@/lib/sunoStatusContext';
import { useLanguage } from '@/lib/languageContext';

export default function Home() {
  const [isComposerExpanded, setIsComposerExpanded] = useState(false);
  const { t, language } = useLanguage();

  const expandComposer = () => {
    setIsComposerExpanded(true);
    // Scroll to composer section after a short delay to ensure it's rendered
    setTimeout(() => {
      const element = document.getElementById('composer');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

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
                    
                    <form className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-white font-medium mb-2" key={`fullName-${language}`}>{t('songForm.fields.fullName')}</label>
                          <input
                            type="text"
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
                          <select className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent" required>
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
                          <select className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent" required>
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
                          <select className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent" required>
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
                          <select className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent" required>
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
                          <select className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent" required>
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
                          <select className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent" required>
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
                          className="w-full h-24 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-3 text-white placeholder-violet-300 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none"
                          placeholder="Any specific instruments, vocal style, or special elements you'd like? (e.g., 'Include piano solo', 'Female vocals', 'Add strings', 'Make it danceable')"
                        />
                        <p className="text-violet-300 text-xs mt-2">Optional: Add specific musical elements, instruments, or vocal preferences.</p>
                      </div>
                      
                      <div>
                        <label className="block text-white font-medium mb-2">Reference Songs (Optional)</label>
                        <input
                          type="text"
                          className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-3 text-white placeholder-violet-300 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                          placeholder="e.g., 'Like Ed Sheeran's Perfect', 'Similar to Adele's style'"
                        />
                        <p className="text-violet-300 text-xs mt-2">Mention songs or artists you like for reference (optional).</p>
                      </div>
                      
                      <div className="text-center pt-6">
                        <button
                          type="submit"
                          className="group relative px-8 py-4 bg-gradient-to-r from-violet-500 to-purple-600 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                        >
                                                  <div className="flex items-center space-x-3">
                          <span className="text-xl">💝</span>
                          <span key={`submit-button-${language}`}>{t('songForm.submitButton')}</span>
                          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
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
