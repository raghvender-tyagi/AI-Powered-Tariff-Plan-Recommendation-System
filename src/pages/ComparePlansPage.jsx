import { useMemo } from 'react';
import { Scale } from 'lucide-react';
import { SectionHeading, Button, EmptyState, DemoBadge, Skeleton, ErrorState } from '@/components/ui/Primitives';
import { PlanPicker } from '@/components/compare/PlanPicker';
import { ComparisonTable } from '@/components/compare/ComparisonTable';
import { AIVerdictBadges } from '@/components/compare/AIVerdictBadges';
import { OperatorCompare } from '@/components/shared/OperatorCompare';
import { useAppStore } from '@/store/useAppStore';
import { getPlans } from '@/api/plans';
import { useEffect, useState } from 'react';

export default function ComparePlansPage() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [demo, setDemo] = useState(false);
  const compareIds = useAppStore((s) => s.compareIds);
  const toggleCompare = useAppStore((s) => s.toggleCompare);
  const clearCompare = useAppStore((s) => s.clearCompare);
  const lastRecommendations = useAppStore((s) => s.lastRecommendations);

  useEffect(() => {
    let mounted = true;
    getPlans()
      .then(({ data, demo: isDemo }) => {
        if (!mounted) return;
        setPlans(data);
        setDemo(isDemo);
        setLoading(false);
      })
      .catch((e) => mounted && (setError(e), setLoading(false)));
    return () => {
      mounted = false;
    };
  }, []);

  const entries = useMemo(() => {
    return compareIds
      .map((id, i) => {
        const plan = plans.find((p) => p._id === id);
        if (!plan) return null;
        const rec = lastRecommendations?.find((r) => r.planId === id);
        return rec ? { ...rec, plan } : { plan, rank: i + 1 };
      })
      .filter(Boolean);
  }, [compareIds, plans, lastRecommendations]);

  if (loading) return <Skeleton className="h-96" />;
  if (error) return <ErrorState description="We couldn't load the plan catalogue." />;

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Compare plans"
        title="See exactly how plans stack up"
        description="Add up to 4 plans and compare price, data, calling, SMS, roaming and validity side-by-side."
      >
        {demo && <DemoBadge />}
      </SectionHeading>

      <PlanPicker plans={plans} selectedIds={compareIds} onToggle={toggleCompare} />

      {entries.length === 0 ? (
        <EmptyState
          icon={Scale}
          title="Nothing to compare yet"
          description="Search above and add at least two plans to see a full side-by-side comparison."
        />
      ) : entries.length === 1 ? (
        <EmptyState
          icon={Scale}
          title="Add one more plan"
          description="Comparisons need at least two plans — add another to see the table and AI verdict."
        />
      ) : (
        <>
          <AIVerdictBadges entries={entries} />
          <ComparisonTable entries={entries} />
          <div className="flex justify-end">
            <Button variant="ghost" size="sm" onClick={clearCompare}>
              Clear comparison
            </Button>
          </div>
        </>
      )}

      <OperatorCompare plans={plans} />
    </div>
  );
}
