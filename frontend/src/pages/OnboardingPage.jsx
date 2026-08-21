import { useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { X } from 'lucide-react';
import { Logo } from '@/components/layout/AppShell';
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';
import { AnalysisSequence } from '@/components/onboarding/AnalysisSequence';
import { ErrorState } from '@/components/ui/Primitives';
import { useAppStore } from '@/store/useAppStore';
import { createCustomer } from '@/api/customers';
import { getRecommendationsByProfile } from '@/api/recommendations';

/**
 * New-user journey:
 *   wizard answers -> POST /api/customers (K-Means assigns a persona)
 *                  -> POST /api/recommendations/by-profile (engine ranks 25 plans)
 *                  -> Top 3 on the recommendations page.
 */
export default function OnboardingPage() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState('wizard'); // wizard | analyzing | error
  const [error, setError] = useState(null);
  const readyRef = useRef(false);

  const setProfileField = useAppStore((s) => s.setProfileField);
  const completeOnboarding = useAppStore((s) => s.completeOnboarding);
  const setLastRecommendations = useAppStore((s) => s.setLastRecommendations);
  const setCustomer = useAppStore((s) => s.setCustomer);

  const handleComplete = async (answers) => {
    Object.entries(answers).forEach(([key, value]) => setProfileField(key, value));
    setPhase('analyzing');
    setError(null);

    const profile = {
      dataNeed: answers.dataNeed,
      callingNeed: answers.callingNeed,
      smsNeed: answers.smsNeed,
      budget: answers.budget,
      roamingRequired: !!answers.roamingRequired,
      familyOrIndividual: answers.familyOrIndividual ?? 'individual',
    };

    try {
      const { data: created } = await createCustomer(profile, answers.name);
      setCustomer(created.customer._id, created.customer.name);

      const { data } = await getRecommendationsByProfile(profile, created.customer._id, 'onboarding');
      setLastRecommendations(data.plans);
      readyRef.current = true;
    } catch (err) {
      setError(err);
      setPhase('error');
    }
  };

  const finishAnalysis = () => {
    if (!readyRef.current) return; // keep the sequence running until the API answers
    completeOnboarding();
    navigate('/app/recommendations', { state: { justOnboarded: true } });
  };

  return (
    <div className="min-h-screen bg-base-950 bg-grid flex flex-col">
      <header className="flex items-center justify-between px-4 sm:px-6 lg:px-8 h-16 border-b border-base-700/60">
        <Logo />
        <Link
          to="/"
          className="rounded-lg p-2 text-base-400 hover:text-base-100 hover:bg-base-800"
          aria-label="Exit onboarding"
        >
          <X className="h-5 w-5" />
        </Link>
      </header>
      <main className="flex-1 flex items-center justify-center px-4 py-14">
        {phase === 'wizard' && <OnboardingWizard onComplete={handleComplete} />}
        {phase === 'analyzing' && <AnalysisSequence onDone={finishAnalysis} />}
        {phase === 'error' && (
          <div className="max-w-lg w-full">
            <ErrorState description={error?.message} onRetry={() => setPhase('wizard')} />
          </div>
        )}
      </main>
    </div>
  );
}
