'use client';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Heart, Globe, Sparkles } from 'lucide-react';

export default function Footer() {
  const footerLinks = {
    services: [
      'Custom Song Creation',
      'AI-Powered Music',
      'Personalized Lyrics',
      'Studio Quality Audio'
    ],
    company: [
      'About MelodiDunyasi',
      'Our Story',
      'Contact Us',
      'Careers'
    ],
    support: [
      'Help Center',
      'Terms of Service',
      'Privacy Policy',
      'Support Chat'
    ],
    resources: [
      'Examples Gallery',
      'Pricing Guide',
      'Music Styles',
      'Wedding Guide'
    ]
  };

  return (
    <footer className="bg-gray-900 border-t border-gray-800">
      <div className="container-custom py-16">
        <div className="grid lg:grid-cols-5 gap-8 mb-12">
          {/* Company Info */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-accent-500 to-accent-600 rounded-2xl flex items-center justify-center">
                  <Heart className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold text-white">MelodiDunyasi</span>
              </div>
              <p className="text-gray-300 mb-6 leading-relaxed">
                We create personalized songs and videos that make your special moments unforgettable. 
                Powered by the latest AI technologies including Suno API, KITS AI, and RunwayML.
              </p>
              {/* Contact Info */}
              <div className="space-y-3">
                <div className="flex items-center space-x-3 text-gray-300">
                  <Mail size={20} className="text-accent-500" />
                  <span>hello@melodidunyasi.com</span>
                </div>
                <div className="flex items-center space-x-3 text-gray-300">
                  <Phone size={20} className="text-accent-500" />
                  <span>+90 212 XXX XX XX</span>
                </div>
                <div className="flex items-center space-x-3 text-gray-300">
                  <MapPin size={20} className="text-accent-500" />
                  <span>Istanbul, Turkey</span>
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
                {category}
              </h3>
              <ul className="space-y-2">
                {links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <a
                      href="#"
                      className="text-gray-300 hover:text-accent-400 transition-colors duration-300 text-sm"
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
          className="border-t border-gray-800 pt-8"
        >
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-gray-400 text-sm">
              © 2024 MelodiDunyasi. All rights reserved.
            </p>
            
            {/* Language and Social */}
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2 text-gray-400">
                <Globe size={16} />
                <span className="text-sm">English</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-400">
                <Sparkles size={16} />
                <span className="text-sm">AI-Powered</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </footer>
  );
}
