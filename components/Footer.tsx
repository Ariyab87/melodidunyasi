'use client';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin } from 'lucide-react';
import { useLanguage } from '@/lib/languageContext';

export default function Footer() {
  const { t } = useLanguage();

  const footerLinks = {
    services: [
      t('footer.services.songCreation'),
      t('footer.services.voiceCloning'),
      t('footer.services.videoAnimation')
    ],
    company: [
      t('footer.company.aboutUs'),
      t('footer.company.contact')
    ],
    support: [
      t('footer.support.helpCenter'),
      t('footer.support.termsOfService'),
      t('footer.support.privacyPolicy')
    ],
    resources: [
      t('footer.resources.examplesGallery'),
      t('footer.resources.pricingCalculator')
    ]
  };

  return (
    <footer className="bg-dark-900 border-t border-dark-700">
      <div className="container mx-auto px-4 py-16">
        <div className="grid lg:grid-cols-5 gap-8 mb-12">
          {/* Company Info */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="flex items-center space-x-2 mb-6">
                <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg"></div>
                <span className="text-xl font-bold text-white">SongCreator</span>
              </div>
              <p className="text-dark-300 mb-6 leading-relaxed">
                {t('footer.description')}
              </p>
              {/* Contact Info */}
              <div className="space-y-3">
                <div className="flex items-center space-x-3 text-dark-300">
                  <Mail size={20} className="text-primary-500" />
                  <span>eviewsyardim@gmail.com</span>
                </div>
                <div className="flex items-center space-x-3 text-dark-300">
                  <Phone size={20} className="text-primary-500" />
                  <span>+32651544223</span>
                </div>
                <div className="flex items-center space-x-3 text-dark-300">
                  <MapPin size={20} className="text-primary-500" />
                  <span>{t('footer.location')}</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Footer Links */}
          {Object.entries(footerLinks).map(([category, links], index) => (
            <motion.div
              key={category}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <h3 className="text-white font-semibold mb-4 capitalize">
                {t(`footer.categories.${category}`)}
              </h3>
              <ul className="space-y-2">
                {links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <a
                      href="#"
                      className="text-dark-300 hover:text-white transition-colors duration-300 text-sm"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Bottom Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="border-t border-dark-700 pt-8"
        >
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-dark-400 text-sm">
              {t('footer.copyright')}
            </p>
          </div>
        </motion.div>
      </div>
    </footer>
  );
}
