'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Menu, X, Globe, User, LogOut, Heart } from 'lucide-react';
import { useLanguage } from '@/lib/languageContext';
import { useAuth } from '@/lib/authContext';

interface NavigationProps {
  onCreateSong?: () => void;
}

export default function Navigation({ onCreateSong }: NavigationProps) {
  const { language, changeLanguage, t } = useLanguage();
  const { isAuthenticated, user, logout } = useAuth();
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

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

  const handleLanguageChange = (langCode: string) => {
    if (changeLanguage) {
      changeLanguage(langCode);
    }
    setIsLanguageOpen(false);
  };

  const languages = [
    { code: 'tr', name: 'Türkçe' },
    { code: 'en', name: 'English' },
    { code: 'nl', name: 'Nederlands' }
  ];

  const navItems = [
    { name: 'howItWorks', id: 'how-it-works', tr: t('nav.howItWorks'), nl: 'Hoe het werkt' },
    { name: 'requestSong', id: 'song-request', tr: t('nav.requestSong'), nl: 'Liedje Aanvraag' },
    { name: 'requestVideo', id: 'video-request', tr: t('nav.requestVideo'), nl: 'Video Aanvraag' }
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
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-soft">
      <div className="container-custom">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center space-x-3 cursor-pointer"
            onClick={() => scrollToSection('hero')}
          >
            <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">MelodiDunyasi</span>
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
                className="text-gray-600 hover:text-violet-600 transition-colors duration-300 font-medium"
              >
                {getLocalizedName(item)}
              </motion.button>
            ))}
          </div>

          {/* Right side controls */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Language Dropdown */}
            <div className="relative group">
              <button className="flex items-center space-x-2 text-gray-600 hover:text-violet-600 transition-colors duration-300 p-2 rounded-xl hover:bg-gray-50">
                <Globe size={20} />
                <span className="font-medium">{languages.find(l => l.code === language)?.name}</span>
              </button>
              <div className="absolute top-full right-0 mt-2 w-40 bg-white border border-gray-200 rounded-2xl shadow-premium opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => handleLanguageChange(lang.code)}
                    className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors duration-200 rounded-2xl ${
                      language === lang.code ? 'text-violet-600 bg-violet-50' : 'text-gray-600'
                    }`}
                  >
                    {lang.name}
                  </button>
                ))}
              </div>
            </div>

            {/* User menu or auth buttons */}
            {isAuthenticated ? (
              <div className="relative group">
                <button className="flex items-center space-x-2 text-gray-600 hover:text-violet-600 transition-colors duration-300 p-2 rounded-xl hover:bg-gray-50">
                  <div className="w-8 h-8 bg-violet-100 rounded-xl flex items-center justify-center">
                    <User size={16} className="text-violet-600" />
                  </div>
                  <span className="font-medium">{user?.name}</span>
                </button>
                <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-gray-200 rounded-2xl shadow-premium opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300">
                  <div className="p-2">
                    <div className="px-3 py-2 text-sm text-gray-500 border-b border-gray-100">
                      {user?.email}
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-3 py-2 text-gray-600 hover:text-violet-600 hover:bg-violet-50 transition-colors duration-200 rounded-xl flex items-center space-x-2"
                    >
                      <LogOut size={16} />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <button className="text-violet-600 hover:text-violet-700 font-medium transition-colors duration-300">
                  Sign In
                </button>
                <button className="btn-outline text-sm py-2 px-4">
                  Sign Up
                </button>
              </div>
            )}

            {/* Primary CTA */}
            <button 
              className="btn-primary"
              onClick={handleCreateSong}
            >
              Create Song
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden text-gray-600 p-2 hover:text-violet-600 transition-colors"
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
            className="md:hidden border-t border-gray-100 bg-white"
          >
            <div className="py-6 space-y-4">
              {navItems.map((item) => (
                <button
                  key={item.name}
                  onClick={() => scrollToSection(item.id)}
                  className="block w-full text-left px-4 py-3 text-gray-600 hover:text-violet-600 hover:bg-violet-50 transition-colors duration-300 rounded-xl"
                >
                  {getLocalizedName(item)}
                </button>
              ))}
              
              <div className="px-4 py-3 border-t border-gray-100">
                {isAuthenticated ? (
                  <div className="space-y-3">
                    <div className="px-3 py-2 text-sm text-gray-500">
                      Signed in as {user?.email}
                    </div>
                    <button 
                      onClick={handleLogout}
                      className="w-full btn-outline text-sm py-2 px-4"
                    >
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                                    <button className="w-full text-violet-600 hover:text-violet-700 font-medium transition-colors duration-300 text-left px-3 py-2">
                  Sign In
                </button>
                    <button className="w-full btn-outline text-sm py-2 px-4">
                      Sign Up
                    </button>
                  </div>
                )}
                
                <button 
                  className="w-full btn-primary mt-3"
                  onClick={handleCreateSong}
                >
                  Create Song
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </nav>
  );
}
