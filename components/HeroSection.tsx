'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Heart, Sparkles, Music, ArrowRight } from 'lucide-react';
import { useLanguage } from '@/lib/languageContext';

export default function HeroSection() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const { language, t } = useLanguage();

  const slides = [
    {
      id: 1,
      image: '/images/pexels-cottonbro-7097831.jpg',
      alt: 'Wedding couple dancing',
      title: 'Make Your First Dance Truly Yours',
      subtitle: 'Create a personalized song that captures the magic of your special moment. From first dances to wedding proposals, make every celebration unforgettable.',
      cta: 'Create Song',
      secondaryCta: 'See Examples'
    },
    {
      id: 2,
      image: '/images/pexels-ekaterina-121008470-9961400.jpg',
      alt: 'Birthday celebration',
      title: 'Every Birthday Deserves a Theme Song',
      subtitle: 'Turn your birthday into a musical celebration with a custom song that tells your story. Perfect for milestone birthdays and special celebrations.',
      cta: 'Create Song',
      secondaryCta: 'See Examples'
    },
    {
      id: 3,
      image: '/images/pexels-juliano-goncalves-1623825-30817330.jpg',
      alt: 'Anniversary celebration',
      title: 'Celebrate Your Love Story in Song',
      subtitle: 'Mark your anniversary with a beautiful, personalized song that captures your journey together. Every year deserves its own melody.',
      cta: 'Create Song',
      secondaryCta: 'See Examples'
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  const currentSlideData = slides[currentSlide];

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <section id="hero" className="min-h-screen hero-gradient relative overflow-hidden">
      {/* Floating elements */}
      <div className="floating-element top-20 left-10"></div>
      <div className="floating-element-delayed bottom-20 right-10"></div>
      <div className="floating-element top-1/2 left-1/4 animation-delay-2000"></div>
      
      <div className="relative z-10 container-custom section-padding">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center min-h-[70vh]">
            {/* Text Content - Left Side */}
            <motion.div 
              className="space-y-8 text-center lg:text-left"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="space-y-6">
                <div className="inline-flex items-center space-x-2 bg-accent-50 text-accent-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
                  <Sparkles className="w-4 h-4" />
                  <span>AI-Powered Music Creation</span>
                </div>
                
                <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight text-balance">
                  <span className="text-gradient-wedding">
                    {currentSlideData.title}
                  </span>
                </h1>
                
                <p className="text-lg md:text-xl lg:text-2xl text-gray-600 leading-relaxed max-w-2xl lg:max-w-none text-balance">
                  {currentSlideData.subtitle}
                </p>
              </div>
              
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <button 
                    onClick={() => scrollToSection('composer')} 
                    className="btn-primary text-lg px-8 py-5 transform hover:scale-105 transition-transform duration-300 flex items-center justify-center space-x-2"
                  >
                    <Heart className="w-6 h-6" />
                    <span>{currentSlideData.cta}</span>
                    <ArrowRight className="w-5 h-5" />
                  </button>
                  
                  <button 
                    onClick={() => scrollToSection('examples')} 
                    className="btn-secondary text-lg px-8 py-5 flex items-center justify-center space-x-2"
                  >
                    <Music className="w-5 h-5" />
                    <span>{currentSlideData.secondaryCta}</span>
                  </button>
                </div>

                {/* Trust indicators */}
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 text-sm text-gray-500">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Fast delivery</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Studio-quality vocals</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Royalty-safe</span>
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
              <div className="relative w-full h-[300px] md:h-[400px] lg:h-[500px] rounded-3xl overflow-hidden shadow-wedding">
                <Image
                  src={currentSlideData.image}
                  alt={currentSlideData.alt}
                  fill
                  className="object-cover"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
                
                {/* Overlay content */}
                <div className="absolute bottom-6 left-6 right-6 text-white">
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
                    <div className="flex items-center space-x-2 mb-2">
                      <Heart className="w-5 h-5 text-accent-300" />
                      <span className="text-sm font-medium">Wedding Special</span>
                    </div>
                    <p className="text-sm opacity-90">Perfect for your first dance</p>
                  </div>
                </div>
              </div>
              
              {/* Slide Indicators */}
              <div className="flex justify-center mt-6 space-x-3">
                {slides.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${
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

      {/* Bottom wave decoration */}
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
