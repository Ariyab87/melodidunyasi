'use client';
import { motion } from 'framer-motion';
import { Music, Mic, Video, Sparkles, CreditCard } from 'lucide-react';
import { useLanguage } from '@/lib/languageContext';

export default function HowItWorksSection() {
  const { t } = useLanguage();
  
  const steps = [
    {
      icon: Music,
      title: t('howItWorks.step1.title'),
      description: t('howItWorks.step1.description'),
      details: [
        t('howItWorks.step1.detail1'),
        t('howItWorks.step1.detail2'),
        t('howItWorks.step1.detail3')
      ]
    },
    {
      icon: Mic,
      title: t('howItWorks.step2.title'),
      description: t('howItWorks.step2.description'),
      details: [
        t('howItWorks.step2.detail1'),
        t('howItWorks.step2.detail2'),
        t('howItWorks.step2.detail3')
      ]
    },
    {
      icon: Video,
      title: t('howItWorks.step3.title'),
      description: t('howItWorks.step3.description'),
      details: [
        t('howItWorks.step3.detail1'),
        t('howItWorks.step3.detail2'),
        t('howItWorks.step3.detail3')
      ]
    }
  ];

  return (
    <section id="how-it-works" className="py-16 bg-dark-800">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold mb-4">
            <span className="text-gradient">{t('howItWorks.title')}</span>
          </h2>
          <p className="text-lg text-dark-300 max-w-xl mx-auto">
            {t('howItWorks.subtitle')}
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: index * 0.2 }}
              className="relative"
            >
              {/* Step Number */}
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {index + 1}
                </div>
              </div>

              {/* Step Content */}
              <div className="card h-full pt-6">
                <div className="text-center mb-4">
                  <div className="w-12 h-12 bg-primary-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <step.icon size={24} className="text-primary-500" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                  <p className="text-dark-300 mb-4 text-sm">{step.description}</p>
                </div>

                {/* Step Details */}
                <div className="space-y-3">
                  {step.details.map((detail, detailIndex) => (
                    <motion.div
                      key={detailIndex}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: 0.3 + detailIndex * 0.1 }}
                      className="flex items-start space-x-2"
                    >
                      <div className="w-1.5 h-1.5 bg-primary-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-dark-300 text-xs leading-relaxed">{detail}</span>
                    </motion.div>
                  ))}
                </div>

                {/* Action Button */}
                <div className="mt-6 text-center">
                  <button className="btn-secondary text-xs px-4 py-1">
                    {t('howItWorks.learnMore')}
                  </button>
                </div>
              </div>

              {/* Connecting Line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 left-full w-full h-0.5 bg-gradient-to-r from-primary-500/50 to-transparent transform -translate-y-1/2 z-0"></div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="text-center mt-12"
        >
          <div className="card max-w-xl mx-auto bg-gradient-to-r from-primary-500/10 to-primary-600/10 border border-primary-500/20">
            <div className="flex items-center justify-center space-x-3 mb-3">
              <Sparkles size={24} className="text-primary-500" />
              <h3 className="text-xl font-bold text-white">{t('howItWorks.cta.title')}</h3>
            </div>
            <p className="text-base text-dark-300 mb-4">
              {t('howItWorks.cta.description')}
            </p>
            <button className="btn-primary text-base px-6 py-2" onClick={() => {
              const el = document.getElementById('song-request');
              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}>
              {t('howItWorks.cta.button')}
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
