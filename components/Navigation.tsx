'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Menu, X, Globe } from 'lucide-react';
import { useLanguage } from '@/lib/languageContext';

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const { language, changeLanguage, t } = useLanguage();

  const languages = [
    { code: 'tr', name: 'Türkçe' },
    { code: 'en', name: 'English' },
    { code: 'nl', name: 'Nederlands' }
  ];

  const navItems = [
    { name: 'services', id: 'services', tr: t('nav.services'), nl: t('nav.services') },
    { name: 'howItWorks', id: 'how-it-works', tr: t('nav.howItWorks'), nl: t('nav.howItWorks') },
    { name: 'songRequest', id: 'song-request', tr: t('nav.songRequest'), nl: t('nav.songRequest') },
    { name: 'voiceCloning', id: 'voice-cloning', tr: t('nav.voiceCloning'), nl: t('nav.voiceCloning') },
    { name: 'videoRequest', id: 'video-request', tr: t('nav.videoRequest'), nl: t('nav.videoRequest') }
  ];

  const getLocalizedName = (item: any) => {
    switch (language) {
      case 'tr': return item.tr;
      case 'nl': return item.nl;
      default: return item.name;
    }
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
    setIsOpen(false); // Close mobile menu
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-dark-900/90 backdrop-blur-md border-b border-dark-700">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center space-x-2 cursor-pointer"
            onClick={() => scrollToSection('hero')}
          >
            <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg"></div>
            <span className="text-xl font-bold text-white">SongCreator</span>
          </motion.div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item, index) => (
              <motion.button
                key={item.name}
                onClick={() => scrollToSection(item.id)}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="text-dark-300 hover:text-white transition-colors duration-300"
              >
                {getLocalizedName(item)}
              </motion.button>
            ))}
          </div>

          {/* Language Selector & CTA */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Admin Link */}
            <a
              href="/admin"
              className="text-dark-300 hover:text-white transition-colors duration-300 text-sm"
            >
              Admin
            </a>
            
            {/* Language Dropdown */}
            <div className="relative group">
              <button className="flex items-center space-x-2 text-dark-300 hover:text-white transition-colors duration-300">
                <Globe size={20} />
                <span>{languages.find(l => l.code === language)?.name}</span>
              </button>
              <div className="absolute top-full right-0 mt-2 w-40 bg-dark-800 border border-dark-700 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => changeLanguage(lang.code)}
                    className={`w-full text-left px-4 py-2 hover:bg-dark-700 transition-colors duration-200 ${
                      language === lang.code ? 'text-primary-500' : 'text-dark-300'
                    }`}
                  >
                    {lang.name}
                  </button>
                ))}
              </div>
            </div>

            <button 
              className="btn-primary"
              onClick={() => scrollToSection('song-request')}
            >
              {t('nav.getStarted')}
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden text-white p-2"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-dark-700"
          >
            <div className="py-4 space-y-4">
              {navItems.map((item) => (
                <button
                  key={item.name}
                  onClick={() => scrollToSection(item.id)}
                  className="block w-full text-left px-4 py-2 text-dark-300 hover:text-white transition-colors duration-300"
                >
                  {getLocalizedName(item)}
                </button>
              ))}
              <div className="px-4 py-2">
                <button 
                  className="btn-primary w-full"
                  onClick={() => scrollToSection('song-request')}
                >
                  {t('nav.getStarted')}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </nav>
  );
}
