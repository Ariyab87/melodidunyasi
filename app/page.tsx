'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Navigation from '@/components/Navigation';
import HeroSection from '@/components/HeroSection';
import InlineComposer from '@/components/InlineComposer';
import HowItWorksSection from '@/components/HowItWorksSection';
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
          <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
            <Navigation />
            
            <HeroSection />
            
            {/* Inline Composer Section */}
            <section id="composer" className="section-padding bg-gradient-to-b from-transparent to-white/60">
              <div className="container-custom">
                <InlineComposer 
                  isExpanded={isComposerExpanded} 
                  onClose={() => setIsComposerExpanded(false)} 
                />
              </div>
            </section>

            {/* How It Works Section */}
            <section id="how-it-works" className="section-padding bg-gradient-to-b from-white/60 to-slate-50/80">
              <div className="container-custom">
                <HowItWorksSection />
              </div>
            </section>

            {/* FAQ Section */}
            <section id="faq" className="section-padding bg-gradient-to-b from-slate-50/80 to-blue-100/60">
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
