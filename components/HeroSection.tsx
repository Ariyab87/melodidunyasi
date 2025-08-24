'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { slides } from '@/lib/slides';
import { useLanguage } from '@/lib/languageContext';

export default function HeroSection() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const { language, t } = useLanguage();

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const currentSlideData = slides[currentSlide];

  const getTitle = () => {
    switch (language) {
      case 'tr': return currentSlideData.trTitle;
      case 'nl': return currentSlideData.nlTitle;
      default: return currentSlideData.enTitle;
    }
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <section id="hero" className="min-h-screen bg-dark-900 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900"></div>
      
      <div className="relative z-10 container mx-auto px-4 py-20">
        <div className="grid lg:grid-cols-2 gap-16 items-center min-h-[80vh]">
          {/* Text Content - Left Side */}
          <div className="space-y-10">
            <div className="space-y-8">
              <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight">
                <span className="text-gradient">
                  {getTitle()}
                </span>
              </h1>
              <p className="text-lg md:text-xl lg:text-2xl text-dark-300 leading-relaxed max-w-2xl">
                {t('hero.subtitle')}
              </p>
            </div>
            
            <div className="space-y-6">
              <button onClick={() => scrollToSection('song-request')} className="btn-primary text-lg md:text-xl px-10 py-5 text-xl transform hover:scale-105 transition-transform duration-300">
                {t('hero.button')}
              </button>
              <p className="text-base md:text-lg text-dark-400">
                {t('hero.process')}
              </p>
            </div>
          </div>

          {/* Image - Right Side */}
          <div className="relative">
            <div className="relative w-full h-[500px] md:h-[600px] lg:h-[700px] rounded-2xl overflow-hidden shadow-2xl">
              <Image
                src={currentSlideData.image}
                alt={currentSlideData.alt}
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-dark-900/50 to-transparent"></div>
            </div>
            
            {/* Slide Indicators */}
            <div className="flex justify-center mt-8 space-x-3">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`w-4 h-4 rounded-full transition-all duration-300 ${
                    index === currentSlide 
                      ? 'bg-primary-500 scale-125' 
                      : 'bg-dark-600 hover:bg-dark-500'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Floating Elements */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-primary-500/20 rounded-full blur-xl animate-pulse-slow"></div>
      <div className="absolute bottom-20 right-10 w-32 h-32 bg-primary-600/20 rounded-full blur-xl animate-pulse-slow animation-delay-1000"></div>
    </section>
  );
}
