'use client';
import { motion } from 'framer-motion';
import { Music, Mic, Video, Star, Check, CreditCard, RefreshCw } from 'lucide-react';
import { useLanguage } from '@/lib/languageContext';

export default function ServicesSection() {
  const { t } = useLanguage();

  const services = [
    { icon: Music, title: t('services.songCreation.title'), description: t('services.songCreation.description'), price: t('services.songCreation.price'), priceNote: t('services.songCreation.priceNote'), features: [t('services.songCreation.feature1'), t('services.songCreation.feature2'), t('services.songCreation.feature3'), t('services.songCreation.feature4'), t('services.songCreation.feature5'), t('services.songCreation.feature6')], popular: true, isFree: false },
    { icon: Mic, title: t('services.voiceCloning.title'), description: t('services.voiceCloning.description'), price: t('services.voiceCloning.price'), priceNote: t('services.voiceCloning.priceNote'), features: [t('services.voiceCloning.feature1'), t('services.voiceCloning.feature2'), t('services.voiceCloning.feature3'), t('services.voiceCloning.feature4'), t('services.voiceCloning.feature5'), t('services.voiceCloning.feature6')], popular: false, isFree: false },
    { icon: Video, title: t('services.videoAnimation.title'), description: t('services.videoAnimation.description'), price: t('services.videoAnimation.price'), priceNote: t('services.videoAnimation.priceNote'), features: [t('services.videoAnimation.feature1'), t('services.videoAnimation.feature2'), t('services.videoAnimation.feature3'), t('services.videoAnimation.feature4'), t('services.videoAnimation.feature5'), t('services.videoAnimation.feature6')], popular: false, isFree: false }
  ];

  const scrollToSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const pricingTiers = [
    { name: t('pricing.payPerUse.name'), price: t('pricing.payPerUse.price'), description: t('pricing.payPerUse.description'), features: [t('pricing.payPerUse.feature1'), t('pricing.payPerUse.feature2'), t('pricing.payPerUse.feature3'), t('pricing.payPerUse.feature4'), t('pricing.payPerUse.feature5'), t('pricing.payPerUse.feature6')], buttonText: t('pricing.payPerUse.button'), buttonStyle: 'btn-primary' }
  ];

  return (
    <section id="services" className="py-20 bg-dark-900">
      <motion.div initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="text-center mb-16">
        <h2 className="text-4xl font-bold mb-6">
          <span className="text-gradient">{t('services.title')}</span>
        </h2>
        <p className="text-xl text-dark-300 max-w-2xl mx-auto">
          {t('services.subtitle')}
        </p>
      </motion.div>

      {/* Payment Information Highlight */}
      <motion.div initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.2 }} className="text-center mb-16">
        <div className="card max-w-4xl mx-auto border-2 border-primary-500 bg-gradient-to-r from-primary-500/10 to-primary-600/10">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <CreditCard size={32} className="text-primary-500" />
            <h3 className="text-2xl font-bold text-white">{t('services.paymentInfo.title')}</h3>
          </div>
          <p className="text-lg text-dark-300 mb-6">
            {t('services.paymentInfo.description')}
          </p>
          <div className="grid md:grid-cols-3 gap-6 text-left">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl font-bold text-white">1</span>
              </div>
              <p className="text-dark-300">{t('services.paymentInfo.step1')}</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl font-bold text-white">2</span>
              </div>
              <p className="text-dark-300">{t('services.paymentInfo.step2')}</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl font-bold text-white">3</span>
              </div>
              <p className="text-dark-300">{t('services.paymentInfo.step3')}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Pricing Tier - Single tier now */}
      <div className="max-w-3xl mx-auto mb-16">
        {pricingTiers.map((tier, index) => (
          <motion.div key={tier.name} initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, delay: index * 0.2 }} className="relative">
            <div className="card h-full">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold mb-3">{tier.name}</h3>
                <p className="text-dark-300 mb-6">{tier.description}</p>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-white">{tier.price}</span>
                </div>
              </div>
              <ul className="space-y-3 mb-8">
                {tier.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start space-x-3">
                    <Check size={20} className="text-primary-500 mt-0.5 flex-shrink-0" />
                    <span className="text-dark-300">{feature}</span>
                  </li>
                ))}
              </ul>
              <button className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-300 ${ tier.buttonStyle === 'btn-primary' ? 'btn-primary' : 'btn-secondary' }`} onClick={() => scrollToSection('song-request')}>
                {tier.buttonText}
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Individual Services */}
      <motion.div initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.6 }} className="text-center mb-16">
        <h3 className="text-3xl font-bold mb-8">
          <span className="text-gradient">Individual Services</span>
        </h3>
        <div className="grid lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {services.map((service, index) => (
            <motion.div key={service.title} initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.8 + index * 0.1 }} className={`relative ${service.popular ? 'lg:scale-105' : ''}`}>
              {service.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-to-r from-primary-500 to-primary-600 text-white px-6 py-2 rounded-full text-sm font-semibold flex items-center space-x-2">
                    <RefreshCw size={16} />
                    <span>2 Re-generations</span>
                  </div>
                </div>
              )}
              <div className={`card h-full ${service.popular ? 'border-primary-500 ring-2 ring-primary-500/20' : ''}`}>
                <div className="text-center mb-8">
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${ service.popular ? 'bg-primary-500' : 'bg-dark-700' }`}>
                    <service.icon size={32} className="text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3">{service.title}</h3>
                  <p className="text-dark-300 mb-6">{service.description}</p>
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-white">{service.price}</span>
                    <span className="text-dark-400"> {service.priceNote}</span>
                  </div>
                </div>
                <ul className="space-y-3 mb-8">
                  {service.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start space-x-3">
                      <Check size={20} className="text-primary-500 mt-0.5 flex-shrink-0" />
                      <span className="text-dark-300">{feature}</span>
                    </li>
                  ))}
                </ul>
                <button className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-300 ${ service.popular ? 'bg-primary-600 hover:bg-primary-700 text-white transform hover:scale-105' : 'bg-dark-700 hover:bg-dark-600 text-white border border-dark-600' }`} onClick={() => {
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

      {/* Payment Information */}
      <motion.div initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 1.0 }} className="text-center mb-16">
        <div className="card max-w-4xl mx-auto border-2 border-primary-500 bg-gradient-to-r from-primary-500/10 to-primary-600/10">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <CreditCard size={32} className="text-primary-500" />
            <h3 className="text-2xl font-bold text-white">{t('payment.title')}</h3>
          </div>
          <p className="text-lg text-dark-300 mb-6">
            {t('payment.description')}
          </p>
          <div className="grid md:grid-cols-2 gap-8 text-left">
            <div>
              <h4 className="text-xl font-bold text-white mb-4">{t('payment.pricing.title')}</h4>
              <ul className="space-y-3">
                <li className="flex items-center space-x-3">
                  <Check size={20} className="text-primary-500" />
                  <span className="text-dark-300">{t('payment.songGeneration')}</span>
                </li>
                <li className="flex items-center space-x-3">
                  <Check size={20} className="text-primary-500" />
                  <span className="text-dark-300">{t('payment.voiceCloning')}</span>
                </li>
                <li className="flex items-center space-x-3">
                  <Check size={20} className="text-primary-500" />
                  <span className="text-dark-300">{t('payment.videoCreation')}</span>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-xl font-bold text-white mb-4">{t('payment.gateways.title')}</h4>
              <div className="space-y-4">
                <div className="p-4 bg-dark-700 rounded-lg">
                  <h5 className="font-semibold text-white mb-2">Iyzico</h5>
                  <p className="text-sm text-dark-300">{t('payment.iyzico')}</p>
                </div>
                <div className="p-4 bg-dark-700 rounded-lg">
                  <h5 className="font-semibold text-white mb-2">PayTR</h5>
                  <p className="text-sm text-dark-300">{t('payment.paytr')}</p>
                </div>
                <div className="p-4 bg-yellow-600/20 border border-yellow-500/30 rounded-lg">
                  <h5 className="font-semibold text-yellow-400 mb-2">{t('payment.comingSoon')}</h5>
                  <p className="text-sm text-yellow-300">{t('payment.accountsOpening')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* How It Works */}
      <motion.div initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 1.2 }} className="text-center">
        <h3 className="text-3xl font-bold mb-8">
          <span className="text-gradient">How It Works</span>
        </h3>
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="text-center">
            <div className="w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Music size={32} className="text-white" />
            </div>
            <h4 className="text-xl font-bold mb-2">1. Create Your Song</h4>
            <p className="text-dark-300">Describe your vision and let AI create your perfect song</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mic size={32} className="text-white" />
            </div>
            <h4 className="text-xl font-bold mb-2">2. Clone Your Voice</h4>
            <p className="text-dark-300">Upload a sample and get your unique voice clone</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Video size={32} className="text-white" />
            </div>
            <h4 className="text-xl font-bold mb-2">3. Animate Your Photos</h4>
            <p className="text-dark-300">Turn static images into dynamic videos</p>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
