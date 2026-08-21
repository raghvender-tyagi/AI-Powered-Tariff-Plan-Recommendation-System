import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, Scale, RefreshCcw } from 'lucide-react';
import { SectionHeading, Button, Card, DemoBadge, Skeleton, ErrorState, EmptyState } from '@/components/ui/Primitives';
import { PlanCard } from '@/components/recommendations/PlanCard';
import { WhyThisPlanDrawer } from '@/components/recommendations/WhyThisPlanDrawer';
import { JourneyTimeline } from '@/components/shared/JourneyTimeline';
import { PersonaCard } from '@/components/shared/PersonaCard';
import { useCustomerBundle } from '@/lib/useCustomerBundle';
import { useAppStore } from '@/store/useAppStore';
import { fadeUp } from '@/lib/motion';

export default function RecommendationsPage() {
  const { loading, error, recommendations, cluster, demo, reload } = useCustomerBundle();
  const [activeEntry, setActiveEntry] = useState(null);
  const compareIds = useAppStore((s) => s.compareIds);
  const toggleCompare = useAppStore((s) => s.toggleCompare);
  const location = useLocation();
  const navigate = useNavigate();
  const justOnboarded = location.state?.justOnboarded;

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="AI Recommendation Center"
        title={justOnboarded ? 'Here are your best-fit plans' : 'Your top plan recommendations'}
        description="Ranked by an overall match score built from data, calling, budget, roaming and persona fit."
      >
        {demo?.recommendations && <DemoBadge />}
      </SectionHeading>

      <Card className="p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-base-400 mb-3">AI Recommendation Journey</p>
        <JourneyTimeline activeKey="explanation" />
      </Card>

      {loading && (
        <div className="grid md:grid-cols-3 gap-5">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-[420px]" />
          ))}
        </div>
      )}

      {!loading && error && <ErrorState description="We couldn't load your recommendations right now." onRetry={reload} />}

      {!loading && !error && (!recommendations || recommendations.length === 0) && (
        <EmptyState
          icon={Sparkles}
          title="No recommendations yet"
          description="Complete your Telecom Twin profile to get AI-matched plan recommendations."
          action={
            <Button onClick={() => navigate('/onboarding')} icon={Sparkles}>
              Start onboarding
            </Button>
          }
        />
      )}

      {!loading && !error && recommendations?.length > 0 && (
        <>
          <div className="grid md:grid-cols-3 gap-5 items-stretch">
            {recommendations.map((entry) => (
              <PlanCard
                key={entry.planId}
                entry={entry}
                featured={entry.rank === 1}
                onWhy={setActiveEntry}
                onViewDetails={setActiveEntry}
                onToggleCompare={toggleCompare}
                isComparing={compareIds.includes(entry.planId)}
              />
            ))}
          </div>

          <motion.div {...fadeUp} className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-base-700 bg-base-900/60 px-6 py-4">
            <p className="text-sm text-base-300">
              {compareIds.length > 0
                ? `${compareIds.length} plan${compareIds.length > 1 ? 's' : ''} added to compare.`
                : 'Add plans to compare side-by-side.'}
            </p>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" icon={RefreshCcw} onClick={reload}>
                Refresh
              </Button>
              <Button size="sm" icon={Scale} disabled={compareIds.length === 0} onClick={() => navigate('/app/compare')}>
                Compare selected
              </Button>
            </div>
          </motion.div>

          {cluster && <PersonaCard cluster={cluster} />}
        </>
      )}

      <WhyThisPlanDrawer entry={activeEntry} open={!!activeEntry} onClose={() => setActiveEntry(null)} />
    </div>
  );
}
