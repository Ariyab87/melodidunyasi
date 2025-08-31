'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import Navigation from '@/components/Navigation';
import HeroSection from '@/components/HeroSection';
import InlineComposer from '@/components/InlineComposer';
import HowItWorksSection from '@/components/HowItWorksSection';
import FAQSection from '@/components/FAQSection';
import Footer from '@/components/Footer';
import { AuthProvider } from '@/lib/authContext';
import { PaymentProvider } from '@/lib/paymentContext';
import { SunoStatusProvider } from '@/lib/sunoStatusContext';

export default function Home() {
  const [isComposerExpanded, setIsComposerExpanded] = useState(false);

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
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 bg-violet-400/30 rounded-full"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`
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

            <Navigation onCreateSong={expandComposer} />
            
            <HeroSection onCreateSong={expandComposer} />
            
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
                    Create Personalized Videos with{' '}
                    <span className="text-gradient-wedding">AI Magic</span>
                  </motion.h2>
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="text-xl text-gray-600 max-w-3xl mx-auto"
                  >
                    Transform your photos into stunning videos with AI-generated music, effects, and animations. Perfect for social media, presentations, and special memories.
                  </motion.p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                  {[
                    {
                      icon: '🎬',
                      title: 'Photo to Video',
                      description: 'Convert your photos into engaging videos with smooth transitions and effects.',
                      features: ['AI-generated transitions', 'Custom music overlay', 'Professional effects']
                    },
                    {
                      icon: '🎵',
                      title: 'Music Integration',
                      description: 'Add personalized music that perfectly matches your video content and mood.',
                      features: ['Custom song creation', 'Mood-based selection', 'Perfect timing sync']
                    },
                    {
                      icon: '✨',
                      title: 'AI Effects',
                      description: 'Enhance your videos with AI-powered effects, filters, and animations.',
                      features: ['Smart filters', 'Motion effects', 'Style transfer']
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
                  <button className="btn-primary text-lg px-8 py-4">
                    <div className="flex items-center space-x-2">
                      <span>🎬</span>
                      <span>Start Creating Videos</span>
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
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
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
                    Clone Your Voice with{' '}
                    <span className="text-gradient-wedding">AI Technology</span>
                  </motion.h2>
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="text-xl text-gray-600 max-w-3xl mx-auto"
                  >
                    Create a digital copy of your voice to use in songs, videos, podcasts, and more. Our advanced AI captures the unique characteristics of your voice perfectly.
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
                        title: 'Voice Recording',
                        description: 'Record a few minutes of your voice to create a high-quality voice model.',
                        details: 'We recommend 3-5 minutes of clear speech in a quiet environment'
                      },
                      {
                        icon: '🤖',
                        title: 'AI Processing',
                        description: 'Our AI analyzes your voice patterns and creates a digital voice clone.',
                        details: 'Advanced neural networks capture tone, pitch, and unique characteristics'
                      },
                      {
                        icon: '🎵',
                        title: 'Voice Integration',
                        description: 'Use your cloned voice in songs, videos, and other creative projects.',
                        details: 'Perfect for personalized content, presentations, and entertainment'
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
                        <h3 className="text-2xl font-bold text-gray-900">Start Voice Cloning</h3>
                        <p className="text-gray-600">Record your voice and let AI create your digital voice twin</p>
                        <button className="btn-primary">
                          <div className="flex items-center space-x-2">
                            <span>🎙️</span>
                            <span>Start Recording</span>
                          </div>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>
            </motion.section>

            <Footer />
          </main>
        </SunoStatusProvider>
      </PaymentProvider>
    </AuthProvider>
  );
}
