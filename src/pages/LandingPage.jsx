import { PublicNav } from '@/components/landing/PublicNav';
import { Hero } from '@/components/landing/Hero';
import { FeatureGrid, JourneyPreview, RecommendationPreview, CTASection } from '@/components/landing/Sections';
import { useAppStore } from '@/store/useAppStore';

export default function LandingPage() {
  const isDarkMode = useAppStore((s) => s.isDarkMode);

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDarkMode ? 'bg-base-950 text-base-100' : 'bg-slate-50 text-slate-900'
    }`}>
      <PublicNav />
      <Hero />
      <JourneyPreview />
      <FeatureGrid />
      <RecommendationPreview />
      <CTASection />
    </div>
  );
}
