'use client';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Heart, Globe, Sparkles } from 'lucide-react';
import { useLanguage } from '@/lib/languageContext';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const { t } = useLanguage();

  return (
    <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 1 }}>
        <motion.div
          className="absolute top-0 left-1/4 w-64 h-64 bg-gradient-to-br from-violet-500/10 to-purple-600/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.1, 0.2, 0.1],
            rotate: [0, 180, 360]
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
          style={{ zIndex: 2 }}
        />
        <motion.div
          className="absolute bottom-0 right-1/4 w-80 h-80 bg-gradient-to-br from-blue-500/10 to-indigo-600/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.4, 1],
            opacity: [0.1, 0.25, 0.1],
            rotate: [360, 180, 0]
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear"
          }}
          style={{ zIndex: 2 }}
        />
      </div>

      <div className="relative z-10 container-custom py-16">
        <div className="grid md:grid-cols-4 gap-8 mb-12">
          {/* Company Info */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="md:col-span-2"
          >
            <motion.div 
              className="flex items-center space-x-3 mb-6"
              whileHover={{ scale: 1.05 }}
            >
              <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Heart className="w-6 h-6 text-white animate-heartbeat" />
              </div>
              <span className="text-2xl font-bold">MelodiDunyasi</span>
            </motion.div>
            
            <p className="text-gray-300 mb-6 leading-relaxed max-w-md">
              {t('footer.description')}
            </p>
            
            <div className="flex space-x-4">
              {[
                { icon: '🎵', label: t('footer.features.aiMusic') },
                { icon: '🌍', label: t('footer.features.multiLanguage') },
                { icon: '⚡', label: t('footer.features.fastDelivery') }
              ].map((item, index) => (
                <motion.div
                  key={index}
                  className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm px-3 py-2 rounded-full text-sm"
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ scale: 1.05, y: -2 }}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span className="text-gray-300">{item.label}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Quick Links */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h3 className="text-lg font-semibold mb-4 text-white">{t('footer.quickLinks.title')}</h3>
            <ul className="space-y-3">
              {[
                { name: t('footer.quickLinks.howItWorks'), href: '#how-it-works' },
                { name: t('footer.quickLinks.createSong'), href: '#song-request' },
                                  { name: t('footer.quickLinks.aboutUs'), href: '#' },
                  { name: t('footer.quickLinks.contact'), href: '#' }
                ].map((link, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                >
                  <a
                    href={link.href}
                    className="text-gray-300 hover:text-violet-400 transition-colors duration-300 hover:translate-x-1 inline-block"
                  >
                    {link.name}
                  </a>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <h3 className="text-lg font-semibold mb-4 text-white">{t('footer.contact.title')}</h3>
            <div className="space-y-3 text-gray-300">
              <motion.div
                className="flex items-center space-x-2"
                whileHover={{ scale: 1.02, x: 5 }}
                transition={{ duration: 0.2 }}
              >
                <Mail className="w-4 h-4 text-violet-400" />
                <span>eviewsyardim@gmail.com</span>
              </motion.div>
              <motion.div
                className="flex items-center space-x-2"
                whileHover={{ scale: 1.02, x: 5 }}
                transition={{ duration: 0.2 }}
              >
                <Globe className="w-4 h-4 text-violet-400" />
                <span>melodidunyasi.com</span>
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Bottom Section */}
        <motion.div
          className="pt-8 border-t border-gray-700 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <div className="flex flex-col md:flex-row items-center justify-between">
            <p className="text-gray-400 mb-4 md:mb-0">
              © {currentYear} MelodiDunyasi. All rights reserved.
            </p>
            
            <div className="flex items-center space-x-6 text-sm text-gray-400">
              <motion.a
                href="#"
                className="hover:text-violet-400 transition-colors duration-300"
                whileHover={{ scale: 1.05 }}
              >
                {t('footer.privacyPolicy')}
              </motion.a>
              <motion.a
                href="#"
                className="hover:text-violet-400 transition-colors duration-300"
                whileHover={{ scale: 1.05 }}
              >
                {t('footer.termsOfService')}
              </motion.a>
              <motion.div
                className="flex items-center space-x-2 text-violet-400"
                whileHover={{ scale: 1.05 }}
              >
                <span className="text-xs">{t('footer.poweredBy.text')}</span>
                <span className="font-semibold">{t('footer.poweredBy.aiTechnology')}</span>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </footer>
  );
}
