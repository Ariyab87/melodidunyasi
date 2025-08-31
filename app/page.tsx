'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Navigation from '@/components/Navigation';
import HeroSection from '@/components/HeroSection';
import InlineComposer from '@/components/InlineComposer';
import HowItWorksSection from '@/components/HowItWorksSection';
import ExamplesSection from '@/components/ExamplesSection';
import PricingSection from '@/components/PricingSection';
import FAQSection from '@/components/FAQSection';
import Footer from '@/components/Footer';
import { AuthProvider } from '@/lib/authContext';
import { PaymentProvider } from '@/lib/paymentContext';
import { SunoStatusProvider } from '@/lib/sunoStatusContext';

export default function Home() {
  const [isComposerExpanded, setIsComposerExpanded] = useState(false);

  const expandComposer = () => {
    setIsComposerExpanded(true);
    // Scroll to composer section
    setTimeout(() => {
      const element = document.getElementById('composer');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  return (
    <AuthProvider>
      <PaymentProvider>
        <SunoStatusProvider>
          <main className="min-h-screen bg-white">
            <Navigation />
            
            <HeroSection />
            
            {/* Inline Composer Section */}
            <section id="composer" className="section-padding bg-gradient-to-b from-white to-gray-50">
              <div className="container-custom">
                <InlineComposer 
                  isExpanded={isComposerExpanded} 
                  onClose={() => setIsComposerExpanded(false)} 
                />
              </div>
            </section>

            {/* How It Works Section */}
            <section id="how-it-works" className="section-padding bg-white">
              <div className="container-custom">
                <HowItWorksSection />
              </div>
            </section>

            {/* Examples Section */}
            <section id="examples" className="section-padding bg-gray-50">
              <div className="container-custom">
                <ExamplesSection />
              </div>
            </section>

            {/* Pricing Section */}
            <section id="pricing" className="section-padding bg-white">
              <div className="container-custom">
                <PricingSection />
              </div>
            </section>

            {/* FAQ Section */}
            <section id="faq" className="section-padding bg-gray-50">
              <div className="container-custom">
                <FAQSection />
              </div>
            </section>

            <Footer />
          </main>
        </SunoStatusProvider>
      </PaymentProvider>
    </AuthProvider>
  );
}
