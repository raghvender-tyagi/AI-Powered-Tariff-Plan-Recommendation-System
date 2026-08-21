import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { X } from 'lucide-react';
import { Logo } from '@/components/layout/AppShell';
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';
import { AnalysisSequence } from '@/components/onboarding/AnalysisSequence';
import { useAppStore } from '@/store/useAppStore';
import { getRecommendationsByProfile } from '@/api/recommendations';
import { NEED_TO_GB, NEED_TO_MIN } from '@/components/onboarding/steps';

export default function OnboardingPage() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState('wizard'); // wizard | analyzing
  const setProfileField = useAppStore((s) => s.setProfileField);
  const completeOnboarding = useAppStore((s) => s.completeOnboarding);
  const setLastRecommendations = useAppStore((s) => s.setLastRecommendations);

  const handleComplete = async (answers) => {
    Object.entries(answers).forEach(([k, v]) => setProfileField(k, v));
    setPhase('analyzing');

    const profile = {
      dataNeedGB: NEED_TO_GB[answers.dataNeed] ?? 10,
      callNeedMin: NEED_TO_MIN[answers.callingNeed] ?? 400,
      budget: answers.budget ?? 649,
      roamingRequired: !!answers.roamingRequired,
      familyOrIndividual: answers.familyOrIndividual ?? 'individual',
      clusterId: undefined,
    };

    try {
      const { data } = await getRecommendationsByProfile(profile);
      setLastRecommendations(data.plans);
    } catch {
      // handled by fallback inside the API layer; nothing else to do here
    }
  };

  const finishAnalysis = () => {
    completeOnboarding();
    navigate('/app/recommendations', { state: { justOnboarded: true } });
  };

  return (
    <div className="min-h-screen bg-base-950 bg-grid flex flex-col">
      <header className="flex items-center justify-between px-4 sm:px-6 lg:px-8 h-16 border-b border-base-700/60">
        <Logo />
        <Link to="/" className="rounded-lg p-2 text-base-400 hover:text-base-100 hover:bg-base-800" aria-label="Exit onboarding">
          <X className="h-5 w-5" />
        </Link>
      </header>
      <main className="flex-1 flex items-center justify-center px-4 py-14">
        {phase === 'wizard' ? (
          <OnboardingWizard onComplete={handleComplete} />
        ) : (
          <AnalysisSequence onDone={finishAnalysis} />
        )}
      </main>
    </div>
  );
}
