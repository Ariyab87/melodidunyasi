import Navigation from '@/components/Navigation';
import HeroSection from '@/components/HeroSection';
import ServicesSection from '@/components/ServicesSection';
import HowItWorksSection from '@/components/HowItWorksSection';
import SongRequestForm from '@/components/SongRequestForm';
import VoiceCloningForm from '@/components/VoiceCloningForm';
import PhotoVideoForm from '@/components/PhotoVideoForm';
import Footer from '@/components/Footer';
import { SunoStatusProvider } from '@/lib/sunoStatusContext';

export default function Home() {
  return (
    <SunoStatusProvider>
      <main className="min-h-screen bg-dark-900">
        <Navigation />
        <HeroSection />
        <ServicesSection />
        <HowItWorksSection />
        <SongRequestForm />
        <VoiceCloningForm />
        <PhotoVideoForm />
        <Footer />
      </main>
    </SunoStatusProvider>
  );
}
