'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { Heart, Sparkles, Music, ArrowRight } from 'lucide-react';
import { useLanguage } from '@/lib/languageContext';

interface HeroSectionProps {
  onCreateSong?: () => void;
}

export default function HeroSection({ onCreateSong }: HeroSectionProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const { language, t } = useLanguage();

  const slides = [
    {
      id: 1,
      image: '/images/pexels-cottonbro-7097831.jpg',
      alt: 'Wedding couple dancing',
      title: t('hero.slide1.title'),
      subtitle: t('hero.slide1.subtitle'),
      cta: t('hero.button')
    },
    {
      id: 2,
      image: '/images/pexels-ekaterina-121008470-9961400.jpg',
      alt: 'Birthday celebration',
      title: t('hero.slide2.title'),
      subtitle: t('hero.slide2.subtitle'),
      cta: t('hero.button')
    },
    {
      id: 3,
      image: '/images/pexels-juliano-goncalves-1623825-30817330.jpg',
      alt: 'Anniversary celebration',
      title: t('hero.slide3.title'),
      subtitle: t('hero.slide3.subtitle'),
      cta: t('hero.button')
    },
    {
      id: 4,
      image: '/images/pexels-karolina-grabowska-5882547.jpg',
      alt: 'Proposal celebration',
      title: t('hero.slide4.title'),
      subtitle: t('hero.slide4.subtitle'),
      cta: t('hero.button')
    },
    {
      id: 5,
      image: '/images/pexels-obviouslyarthur-1439261.jpg',
      alt: 'Graduation celebration',
      title: t('hero.slide5.title'),
      subtitle: t('hero.slide5.subtitle'),
      cta: t('hero.button')
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  const currentSlideData = slides[currentSlide];

  const handleCreateSong = () => {
    if (onCreateSong) {
      onCreateSong();
    } else {
      // Fallback: scroll to composer
      const element = document.getElementById('composer');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <section id="hero" className="min-h-screen relative overflow-hidden">
      {/* Enhanced Background with Multiple Layers */}
      <div className="absolute inset-0">
        {/* Special gradient background */}
        <div className="absolute inset-0 bg-hero-special"></div>
        
        {/* Animated geometric patterns */}
        <div className="absolute inset-0 opacity-25">
          <div className="absolute top-20 left-10 w-40 h-40 bg-gradient-to-br from-violet-300 to-purple-400 rounded-full blur-3xl animate-float"></div>
          <div className="absolute top-40 right-20 w-32 h-32 bg-gradient-to-br from-purple-300 to-pink-400 rounded-full blur-3xl animate-float animation-delay-1000"></div>
          <div className="absolute bottom-40 left-1/4 w-48 h-48 bg-gradient-to-br from-pink-300 to-red-400 rounded-full blur-3xl animate-float animation-delay-2000"></div>
          <div className="absolute top-1/2 right-1/3 w-24 h-24 bg-gradient-to-br from-red-300 to-orange-400 rounded-full blur-3xl animate-float animation-delay-1000"></div>
        </div>
        
        {/* Special grid pattern */}
        <div className="absolute inset-0 opacity-15">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(139, 92, 246, 0.4) 1px, transparent 0)`,
            backgroundSize: '80px 80px'
          }}></div>
        </div>
        
        {/* Floating musical notes with special colors */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 5 }}>
          <motion.div 
            className="absolute top-32 left-1/4 text-violet-400 text-7xl animate-bounce-gentle shadow-glow-violet"
            animate={{ 
              y: [0, -20, 0],
              rotate: [0, 5, -5, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            style={{ zIndex: 6 }}
          >
            ♪
          </motion.div>
          <motion.div 
            className="absolute top-64 right-1/4 text-purple-400 text-5xl animate-bounce-gentle animation-delay-1000 shadow-glow-violet"
            animate={{ 
              y: [0, -15, 0],
              rotate: [0, -3, 3, 0],
              scale: [1, 1.05, 1]
            }}
            transition={{ 
              duration: 3.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1
            }}
            style={{ zIndex: 6 }}
          >
            ♫
          </motion.div>
          <motion.div 
            className="absolute bottom-32 left-1/3 text-pink-400 text-6xl animate-bounce-gentle animation-delay-2000 shadow-glow-violet"
            animate={{ 
              y: [0, -25, 0],
              rotate: [0, 8, -8, 0],
              scale: [1, 1.15, 1]
            }}
            transition={{ 
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 2
            }}
            style={{ zIndex: 6 }}
          >
            ♬
          </motion.div>
          <motion.div 
            className="absolute top-1/3 right-1/3 text-indigo-400 text-4xl animate-bounce-gentle animation-delay-1000 shadow-glow-violet"
            animate={{ 
              y: [0, -18, 0],
              rotate: [0, -5, 5, 0],
              scale: [1, 1.08, 1]
            }}
            transition={{ 
              duration: 4.2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1
            }}
            style={{ zIndex: 6 }}
          >
            ♩
          </motion.div>
        </div>

        {/* Creative geometric shapes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 4 }}>
          <motion.div 
            className="absolute top-1/4 left-1/6 w-16 h-16 bg-gradient-to-br from-violet-300/30 to-purple-400/30 rounded-full"
            animate={{ 
              scale: [1, 1.5, 1],
              opacity: [0.3, 0.6, 0.3],
              rotate: [0, 180, 360]
            }}
            transition={{ 
              duration: 8,
              repeat: Infinity,
              ease: "linear"
            }}
            style={{ zIndex: 5 }}
          />
          <motion.div 
            className="absolute bottom-1/4 right-1/6 w-20 h-20 bg-gradient-to-br from-pink-300/30 to-red-400/30 rounded-full"
            animate={{ 
              scale: [1, 1.3, 1],
              opacity: [0.3, 0.5, 0.3],
              rotate: [360, 180, 0]
            }}
            transition={{ 
              duration: 10,
              repeat: Infinity,
              ease: "linear"
            }}
            style={{ zIndex: 5 }}
          />
          <motion.div 
            className="absolute top-1/2 left-1/2 w-12 h-12 bg-gradient-to-br from-blue-300/30 to-indigo-400/30 rounded-full"
            animate={{ 
              scale: [1, 1.4, 1],
              opacity: [0.3, 0.7, 0.3],
              rotate: [0, 90, 180, 270, 360]
            }}
            transition={{ 
              duration: 6,
              repeat: Infinity,
              ease: "linear"
            }}
            style={{ zIndex: 5 }}
          />
        </div>

        {/* Animated sparkles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 7 }}>
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-yellow-400 rounded-full"
              style={{
                left: `${20 + (i * 10)}%`,
                top: `${15 + (i * 8)}%`,
                zIndex: 8
              }}
              animate={{
                scale: [0, 1, 0],
                opacity: [0, 1, 0],
                rotate: [0, 180, 360]
              }}
              transition={{
                duration: 2 + i * 0.5,
                repeat: Infinity,
                delay: i * 0.3,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>
      </div>
      
      <div className="relative z-10 container-custom section-padding">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 items-center min-h-[60vh]">
            {/* Text Content - Left Side */}
            <motion.div 
              className="space-y-6 text-center lg:text-left"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="space-y-4">
                <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-violet-100 to-purple-100 text-violet-700 px-4 py-2 rounded-full text-sm font-medium mb-3 shadow-lg border-2 border-violet-200">
                  <Sparkles className="w-4 h-4" />
                  <span>{t('hero.aiPowered')}</span>
                </div>
                
                <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight text-balance">
                  <span className="text-gradient-wedding">
                    {currentSlideData.title}
                  </span>
                </h1>
                
                <p className="text-base md:text-lg lg:text-xl text-gray-700 leading-relaxed max-w-xl lg:max-w-none text-balance">
                  {currentSlideData.subtitle}
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                  <button 
                    onClick={handleCreateSong} 
                    className="btn-primary text-base px-6 py-3 transform hover:scale-105 transition-transform duration-300 flex items-center justify-center space-x-2 shadow-wedding hover:shadow-xl"
                  >
                    <Heart className="w-5 h-5" />
                    <span>{currentSlideData.cta}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Trust indicators with enhanced styling */}
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4">
                  <div className="flex items-center space-x-2 bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-soft border border-white/50">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs font-medium text-gray-700">{t('hero.trust.fastDelivery')}</span>
                  </div>
                  <div className="flex items-center space-x-2 bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-soft border border-white/50">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs font-medium text-gray-700">{t('hero.trust.studioQuality')}</span>
                  </div>
                  <div className="flex items-center space-x-2 bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-soft border border-white/50">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs font-medium text-gray-700">{t('hero.trust.royaltySafe')}</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Image - Right Side */}
            <motion.div 
              className="relative"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div className="relative w-full h-[250px] md:h-[300px] lg:h-[350px] rounded-2xl overflow-hidden shadow-wedding">
                <Image
                  src={currentSlideData.image}
                  alt={currentSlideData.alt}
                  fill
                  className="object-cover"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"></div>
                
                {/* Enhanced overlay content */}
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <div className="bg-white/20 backdrop-blur-md rounded-xl p-3 border border-white/30 shadow-lg">
                    <div className="flex items-center space-x-2 mb-1">
                      <Heart className="w-4 h-4 text-accent-300" />
                      <span className="text-xs font-medium">{t('hero.overlay.weddingSpecial')}</span>
                    </div>
                    <p className="text-xs opacity-90">{t('hero.overlay.perfectForFirstDance')}</p>
                  </div>
                </div>
              </div>
              
              {/* Enhanced slide indicators */}
              <div className="flex justify-center mt-4 space-x-2">
                {slides.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                      index === currentSlide 
                        ? 'bg-accent-500 scale-125 shadow-lg' 
                        : 'bg-gray-300 hover:bg-accent-300'
                    }`}
                  />
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Enhanced bottom wave decoration */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-full h-auto">
          <path 
            d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" 
            opacity=".25" 
            className="fill-accent-100"
          ></path>
          <path 
            d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z" 
            opacity=".5" 
            className="fill-accent-200"
          ></path>
          <path 
            d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z" 
            className="fill-accent-300"
          ></path>
        </svg>
      </div>
    </section>
  );
}
