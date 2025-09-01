'use client';
import { motion } from 'framer-motion';
import { Music, Mic, Video, Star, Check, CreditCard, RefreshCw } from 'lucide-react';
import { useLanguage } from '@/lib/languageContext';

export default function ServicesSection() {
  const { t } = useLanguage();

  const services = [
    { icon: Music, title: t('services.songCreation.title'), description: t('services.songCreation.description'), features: [t('services.songCreation.feature1'), t('services.songCreation.feature2'), t('services.songCreation.feature3'), t('services.songCreation.feature4'), t('services.songCreation.feature5'), t('services.songCreation.feature6')], popular: true },
    { icon: Mic, title: t('services.voiceCloning.title'), description: t('services.voiceCloning.description'), features: [t('services.voiceCloning.feature1'), t('services.voiceCloning.feature2'), t('services.voiceCloning.feature3'), t('services.voiceCloning.feature4'), t('services.voiceCloning.feature5'), t('services.voiceCloning.feature6')], popular: false },
    { icon: Video, title: t('services.videoAnimation.title'), description: t('services.videoAnimation.description'), features: [t('services.videoAnimation.feature1'), t('services.videoAnimation.feature2'), t('services.videoAnimation.feature3'), t('services.videoAnimation.feature4'), t('services.videoAnimation.feature5'), t('services.videoAnimation.feature6')], popular: false }
  ];

  const scrollToSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };



  return (
    <section id="services" className="py-16 bg-gradient-to-br from-violet-50 via-white to-purple-50">
      <motion.div initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="text-center mb-12">
        <h2 className="text-3xl font-bold mb-4">
          <span className="text-gradient">{t('services.title')}</span>
        </h2>
        <p className="text-lg text-gray-600 max-w-xl mx-auto">
          {t('services.subtitle')}
        </p>
      </motion.div>

      {/* Individual Services */}
      <motion.div initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.6 }} className="text-center mb-12">
        <h3 className="text-2xl font-bold mb-6">
          <span className="text-gradient">Individual Services</span>
        </h3>
        <div className="grid lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {services.map((service, index) => (
            <motion.div key={service.title} initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.8 + index * 0.1 }} className={`relative ${service.popular ? 'lg:scale-105' : ''}`}>
              {service.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-to-r from-violet-500 to-purple-600 text-white px-4 py-1 rounded-full text-xs font-semibold flex items-center space-x-2">
                    <RefreshCw size={14} />
                    <span>2 Re-generations</span>
                  </div>
                </div>
              )}
              <div className={`bg-white rounded-2xl shadow-lg hover:shadow-xl border border-gray-100 p-6 h-full transition-all duration-300 ${service.popular ? 'ring-2 ring-violet-500/20 shadow-violet-100' : 'hover:border-violet-200'}`}>
                <div className="text-center mb-6">
                  <div className={`w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center ${ service.popular ? 'bg-gradient-to-r from-violet-500 to-purple-600' : 'bg-gradient-to-r from-gray-600 to-gray-700' }`}>
                    <service.icon size={24} className="text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-gray-900">{service.title}</h3>
                  <p className="text-gray-600 mb-4 text-sm">{service.description}</p>
                </div>
                <ul className="space-y-2 mb-6">
                  {service.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start space-x-2">
                      <Check size={16} className="text-violet-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <button className={`w-full py-3 px-4 rounded-xl font-semibold transition-all duration-300 text-sm ${ service.popular ? 'bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white transform hover:scale-105' : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200 hover:border-gray-300' }`} onClick={() => {
                  if (service.popular) {
                    scrollToSection('song-request');
                  } else if (service.title === t('services.videoAnimation.title')) {
                    scrollToSection('video-request');
                  } else if (service.title === t('services.voiceCloning.title')) {
                    scrollToSection('voice-cloning');
                  } else {
                    scrollToSection('song-request');
                  }
                }}>
                  {service.popular ? 'Start Creating' : 'Get Started'}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* How It Works */}
      <motion.div initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 1.2 }} className="text-center">
        <h3 className="text-2xl font-bold mb-6">
          <span className="text-gradient">How It Works</span>
        </h3>
        <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto">
          <div className="text-center">
            <div className="w-12 h-12 bg-gradient-to-r from-violet-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <Music size={24} className="text-white" />
            </div>
            <h4 className="text-lg font-bold mb-2 text-gray-900">1. Create Your Song</h4>
            <p className="text-gray-600 text-sm">Describe your vision and let AI create your perfect song</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-gradient-to-r from-violet-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <Mic size={24} className="text-white" />
            </div>
            <h4 className="text-lg font-bold mb-2 text-gray-900">2. Clone Your Voice</h4>
            <p className="text-gray-600 text-sm">Upload a sample and get your unique voice clone</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-gradient-to-r from-violet-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <Video size={24} className="text-white" />
            </div>
            <h4 className="text-xl font-bold mb-2 text-gray-900">3. Animate Your Photos</h4>
            <p className="text-gray-600 text-sm">Turn static images into dynamic videos</p>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
