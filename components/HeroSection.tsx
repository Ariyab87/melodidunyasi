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
    <section id="hero" className="min-h-screen bg-dark-800 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-dark-800 via-dark-700 to-dark-800"></div>
      
      <div className="relative z-10 container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 items-center min-h-[50vh]">
            {/* Text Content - Left Side */}
            <div className="space-y-6 text-center lg:text-left">
              <div className="space-y-4">
                <h1 className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold leading-tight">
                  <span className="text-gradient">
                    {getTitle()}
                  </span>
                </h1>
                <p className="text-sm md:text-base lg:text-lg text-dark-300 leading-relaxed max-w-lg lg:max-w-none">
                  {t('hero.subtitle')}
                </p>
              </div>
              
              <div className="space-y-3">
                <button onClick={() => scrollToSection('song-request')} className="btn-primary text-sm md:text-base px-6 py-3 text-base transform hover:scale-105 transition-transform duration-300">
                  {t('hero.button')}
                </button>
                <p className="text-xs md:text-sm text-dark-400">
                  {t('hero.process')}
                </p>
              </div>
            </div>

            {/* Image - Right Side */}
            <div className="relative">
              <div className="relative w-full h-[250px] md:h-[300px] lg:h-[400px] rounded-lg overflow-hidden shadow-md">
                <Image
                  src={currentSlideData.image}
                  alt={currentSlideData.alt}
                  fill
                  className="object-cover"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-dark-800/20 to-transparent"></div>
              </div>
              
              {/* Slide Indicators */}
              <div className="flex justify-center mt-3 space-x-2">
                {slides.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
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
      </div>

      {/* Floating Elements - Reduced opacity */}
      <div className="absolute top-20 left-10 w-16 h-16 bg-primary-500/10 rounded-full blur-xl animate-pulse-slow"></div>
      <div className="absolute bottom-20 right-10 w-24 h-24 bg-primary-600/10 rounded-full blur-xl animate-pulse-slow animation-delay-1000"></div>
    </section>
  );
}
