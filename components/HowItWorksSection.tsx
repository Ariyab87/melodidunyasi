'use client';
import { motion } from 'framer-motion';
import { Music, Sparkles, CreditCard, Heart, ArrowRight } from 'lucide-react';

export default function HowItWorksSection() {
  const steps = [
    {
      icon: Music,
      title: 'Describe Your Vision',
      description: 'Tell us about your special moment, the mood you want, and any specific details that make it unique.',
      details: [
        'Share your story and emotions',
        'Choose your preferred musical style',
        'Specify language and any special requests'
      ],
      color: 'from-blue-500 to-blue-600'
    },
    {
      icon: Sparkles,
      title: 'AI Creates Your Song',
      description: 'Our advanced AI analyzes your prompt and generates a personalized song with studio-quality vocals.',
      details: [
        'AI composes original music and lyrics',
        'Generates professional-quality vocals',
        'Creates a unique melody just for you'
      ],
      color: 'from-purple-500 to-purple-600'
    },
    {
      icon: CreditCard,
      title: 'Review & Perfect',
      description: 'Listen to your song and use your regenerations to get it exactly right. Not satisfied? Try again!',
      details: [
        'Listen to your generated song',
        'Use regenerations to improve it',
        'Download your perfect final version'
      ],
      color: 'from-accent-500 to-accent-600'
    }
  ];

  return (
    <div className="text-center">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="mb-16"
      >
        <div className="inline-flex items-center space-x-2 bg-accent-50 text-accent-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
          <Sparkles className="w-4 h-4" />
          <span>Simple Process</span>
        </div>
        
        <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
          Create Your Song in 3 Simple Steps
        </h2>
        
        <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
          From idea to finished song in minutes. Our AI-powered platform makes creating personalized music as easy as describing your vision.
        </p>
      </motion.div>

      {/* Steps Grid */}
      <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto mb-16">
        {steps.map((step, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: index * 0.2 }}
            className="relative"
          >
            {/* Step Number */}
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
              <div className={`w-12 h-12 bg-gradient-to-r ${step.color} rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg`}>
                {index + 1}
              </div>
            </div>

            {/* Step Content */}
            <div className="card-premium h-full pt-8 text-center">
              <div className="mb-6">
                <div className={`w-16 h-16 bg-gradient-to-r ${step.color} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                  <step.icon size={32} className="text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">{step.title}</h3>
                <p className="text-gray-600 mb-6 leading-relaxed">{step.description}</p>
              </div>

              {/* Step Details */}
              <div className="space-y-3 text-left">
                {step.details.map((detail, detailIndex) => (
                  <motion.div
                    key={detailIndex}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.3 + detailIndex * 0.1 }}
                    className="flex items-start space-x-3"
                  >
                    <div className={`w-2 h-2 bg-gradient-to-r ${step.color} rounded-full mt-2 flex-shrink-0`}></div>
                    <span className="text-gray-700 text-sm leading-relaxed">{detail}</span>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Connecting Line */}
            {index < steps.length - 1 && (
              <div className="hidden lg:block absolute top-1/2 left-full w-full h-1 bg-gradient-to-r from-gray-200 to-transparent transform -translate-y-1/2 z-0">
                <div className="w-full h-full bg-gradient-to-r from-accent-200 to-transparent"></div>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Bottom CTA */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 0.8 }}
        className="text-center"
      >
        <div className="bg-gradient-to-r from-accent-50 to-blue-50 rounded-3xl p-8 border-2 border-accent-200 max-w-4xl mx-auto">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <Heart className="w-8 h-8 text-accent-600" />
            <h3 className="text-2xl font-bold text-gray-900">Ready to Create Your Perfect Song?</h3>
          </div>
          <p className="text-lg text-gray-600 mb-6 max-w-2xl mx-auto">
            Join thousands of happy customers who have created personalized songs for their special moments. Start your musical journey today.
          </p>
          <button 
            className="btn-primary text-lg px-8 py-4"
            onClick={() => {
              const el = document.getElementById('composer');
              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
          >
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5" />
              <span>Start Creating Now</span>
              <ArrowRight className="w-5 h-5" />
            </div>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
