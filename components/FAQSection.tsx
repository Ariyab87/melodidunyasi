'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, HelpCircle, Sparkles } from 'lucide-react';

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      question: 'How does the "pay-once = 3 tries" system work?',
      answer: 'When you make a payment, you get 3 total generations for the same prompt. The first generation creates your initial song, and you can regenerate up to 2 more times to get it exactly right. Each regeneration uses 1 of your 3 tries.'
    },
    {
      question: 'What happens if I\'m not satisfied with my first song?',
      answer: 'That\'s exactly why we give you 3 tries! If you\'re not happy with the first result, simply click "Regenerate" to create a new version. You can change the style or model each time while keeping the same prompt.'
    },
    {
      question: 'Can I use different prompts for each regeneration?',
      answer: 'No, regenerations use the same original prompt to maintain consistency. However, you can change the musical style, model, or other parameters for each regeneration to get different variations of your song.'
    },
    {
      question: 'What if I use all 3 tries and still want more?',
      answer: 'If you use all 3 tries and want to create more songs, you can purchase another package. Each new payment gives you another 3 tries for a new song or project.'
    },
    {
      question: 'How long does it take to generate a song?',
      answer: 'Most songs are generated within 2-5 minutes. The process includes AI analysis of your prompt, music composition, and vocal generation. You\'ll see real-time progress updates in the composer.'
    },
    {
      question: 'What languages do you support?',
      answer: 'We support all major languages including English, Turkish, Dutch, Spanish, French, German, and many more. You can specify your preferred language in the composer, and the AI will generate lyrics and vocals in that language.'
    },
    {
      question: 'Are the songs royalty-free?',
      answer: 'Yes! All songs created through our platform are royalty-free for personal use. You can use them for weddings, birthdays, personal videos, and other non-commercial purposes without any additional fees.'
    },
    {
      question: 'What audio quality do you provide?',
      answer: 'We provide studio-quality audio files in high-resolution formats. The AI generates professional-grade vocals and instrumentation that rival commercial music production quality.'
    },
    {
      question: 'Can I request specific musical styles or artists?',
      answer: 'Absolutely! You can specify musical styles (pop, rock, jazz, classical, etc.) and even reference specific artists or songs as inspiration. The AI will create something unique while capturing the essence of your requested style.'
    },
    {
      question: 'What if I have a technical issue during generation?',
      answer: 'Our support team is here to help! If you experience any technical issues, contact us immediately. We\'ll either resolve the issue or credit you with additional tries to ensure you get your perfect song.'
    }
  ];

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

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
          <HelpCircle className="w-4 h-4" />
          <span>Frequently Asked Questions</span>
        </div>
        
        <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
          Everything You Need to Know
        </h2>
        
        <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
          Get answers to the most common questions about our unique 3-try system, pricing, and how to create your perfect personalized song.
        </p>
      </motion.div>

      {/* FAQ Grid */}
      <div className="max-w-4xl mx-auto">
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="card border-2 border-gray-100 hover:border-accent-200 transition-all duration-300"
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full text-left p-6 focus:outline-none"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 pr-4">
                    {faq.question}
                  </h3>
                  <div className="flex-shrink-0">
                    {openIndex === index ? (
                      <Minus className="w-6 h-6 text-accent-600" />
                    ) : (
                      <Plus className="w-6 h-6 text-accent-600" />
                    )}
                  </div>
                </div>
              </button>

              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-6">
                      <div className="border-t border-gray-100 pt-4">
                        <p className="text-gray-600 leading-relaxed">
                          {faq.answer}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Bottom CTA */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 0.4 }}
        className="mt-16"
      >
        <div className="bg-gradient-to-r from-accent-50 to-accent-100 rounded-3xl p-8 border-2 border-accent-200">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Still Have Questions?
          </h3>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Our support team is here to help you get started with creating your perfect personalized song. Don't hesitate to reach out!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="btn-primary">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5" />
                <span>Start Creating Now</span>
              </div>
            </button>
            <button className="btn-outline">
              <div className="flex items-center space-x-2">
                <HelpCircle className="w-5 h-5" />
                <span>Contact Support</span>
              </div>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
