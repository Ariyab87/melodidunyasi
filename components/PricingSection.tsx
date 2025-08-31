'use client';

import { motion } from 'framer-motion';
import { Check, Sparkles, Music, Heart, Zap, Shield } from 'lucide-react';

export default function PricingSection() {
  const features = [
    '3 total generations (1 song + 2 regenerations)',
    'Studio-quality vocals',
    'Any language support',
    'Fast delivery (usually within minutes)',
    'Royalty-free for personal use',
    'High-quality audio files',
    'Multiple style options',
    'Custom lyrics and melodies'
  ];

  const benefits = [
    {
      icon: <Heart className="w-6 h-6 text-accent-600" />,
      title: 'Perfect for Special Moments',
      description: 'Create the perfect soundtrack for weddings, birthdays, anniversaries, and proposals.'
    },
    {
      icon: <Zap className="w-6 h-6 text-accent-600" />,
      title: 'Lightning Fast',
      description: 'Get your personalized song in minutes, not days or weeks.'
    },
    {
      icon: <Shield className="w-6 h-6 text-accent-600" />,
      title: 'Risk-Free',
      description: 'Not satisfied? Use your regenerations to get it just right.'
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
          <span>Simple Pricing</span>
        </div>
        
        <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
          One Payment, Three Perfect Songs
        </h2>
        
        <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
          Our unique model gives you 3 total generations for one payment. Create your first song, then regenerate twice to get it exactly right.
        </p>
      </motion.div>

      {/* Main Pricing Card */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="mb-16"
      >
        <div className="relative max-w-2xl mx-auto">
          {/* Popular badge */}
          <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
            <div className="bg-accent-600 text-white px-6 py-2 rounded-full text-sm font-semibold shadow-lg">
              Most Popular
            </div>
          </div>

          <div className="card-premium border-2 border-accent-200 p-8">
            <div className="text-center mb-8">
              <div className="text-6xl font-bold text-accent-600 mb-2">₺500</div>
              <div className="text-xl text-gray-600 mb-4">One-time payment</div>
              <div className="text-lg text-accent-700 font-semibold">
                Includes 3 total generations
              </div>
            </div>

            {/* How it works */}
            <div className="bg-accent-50 rounded-2xl p-6 mb-8">
              <h4 className="font-semibold text-gray-900 mb-4">How the 3-Try System Works:</h4>
              <div className="space-y-3 text-left">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-accent-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                  <span className="text-gray-700">Create your first song (uses 1 try)</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-accent-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                  <span className="text-gray-700">Regenerate if needed (uses 1 try)</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-accent-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                  <span className="text-gray-700">Final regeneration (uses 1 try)</span>
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="space-y-4 mb-8">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="flex items-center space-x-3 text-left"
                >
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-gray-700">{feature}</span>
                </motion.div>
              ))}
            </div>

            {/* CTA */}
            <button className="w-full btn-primary text-lg py-4">
              <div className="flex items-center justify-center space-x-2">
                <Music className="w-5 h-5" />
                <span>Start Creating Now</span>
              </div>
            </button>

            {/* Note */}
            <p className="text-sm text-gray-500 mt-4">
              * Regenerations use the same prompt. You can change style/model each time.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Benefits Grid */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 0.4 }}
        className="grid md:grid-cols-3 gap-8 mb-16"
      >
        {benefits.map((benefit, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.6 + index * 0.1 }}
            className="text-center"
          >
            <div className="w-16 h-16 bg-accent-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              {benefit.icon}
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              {benefit.title}
            </h3>
            <p className="text-gray-600 leading-relaxed">
              {benefit.description}
            </p>
          </motion.div>
        ))}
      </motion.div>

      {/* FAQ Preview */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 0.6 }}
        className="bg-gradient-to-r from-gray-50 to-accent-50 rounded-3xl p-8 border-2 border-accent-100"
      >
        <h3 className="text-2xl font-bold text-gray-900 mb-4">
          Questions About Our Pricing?
        </h3>
        <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
          We've answered the most common questions about our unique 3-try system and pricing model.
        </p>
        <button className="btn-outline">
          <div className="flex items-center space-x-2">
            <span>View FAQ</span>
            <Sparkles className="w-4 h-4" />
          </div>
        </button>
      </motion.div>
    </div>
  );
}
