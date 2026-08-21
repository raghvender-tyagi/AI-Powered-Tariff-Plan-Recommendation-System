import { PublicNav } from '@/components/landing/PublicNav';
import { Hero } from '@/components/landing/Hero';
import { FeatureGrid, JourneyPreview, RecommendationPreview, CTASection } from '@/components/landing/Sections';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-base-950">
      <PublicNav />
      <Hero />
      <JourneyPreview />
      <FeatureGrid />
      <RecommendationPreview />
      <CTASection />
    </div>
  );
}
