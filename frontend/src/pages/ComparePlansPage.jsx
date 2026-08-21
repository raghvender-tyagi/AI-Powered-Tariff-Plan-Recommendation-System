import { useEffect, useMemo, useState } from 'react';
import { Scale } from 'lucide-react';
import { SectionHeading, Button, EmptyState, Skeleton, ErrorState } from '@/components/ui/Primitives';
import { PlanPicker } from '@/components/compare/PlanPicker';
import { ComparisonTable } from '@/components/compare/ComparisonTable';
import { AIVerdictBadges } from '@/components/compare/AIVerdictBadges';
import { CategoryCompare } from '@/components/shared/OperatorCompare';
import { useAppStore } from '@/store/useAppStore';
import { getPlans, comparePlans } from '@/api/plans';

export default function ComparePlansPage() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [comparison, setComparison] = useState(null);
  const [comparing, setComparing] = useState(false);
  const [compareError, setCompareError] = useState(null);

  const compareIds = useAppStore((s) => s.compareIds);
  const toggleCompare = useAppStore((s) => s.toggleCompare);
  const clearCompare = useAppStore((s) => s.clearCompare);
  const lastRecommendations = useAppStore((s) => s.lastRecommendations);

  useEffect(() => {
    let mounted = true;
    getPlans()
      .then(({ data }) => {
        if (!mounted) return;
        setPlans(data);
        setLoading(false);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err);
        setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  // Match scores come from the last engine response — never recomputed here.
  const matchScores = useMemo(() => {
    const scores = {};
    for (const id of compareIds) {
      const entry = lastRecommendations?.find((rec) => rec.planId === id);
      if (entry && Number.isFinite(entry.matchPercent)) scores[id] = entry.matchPercent;
    }
    return scores;
  }, [compareIds, lastRecommendations]);

  useEffect(() => {
    if (compareIds.length < 2) {
      setComparison(null);
      setCompareError(null);
      return;
    }

    let mounted = true;
    setComparing(true);
    setCompareError(null);

    comparePlans(compareIds, matchScores)
      .then(({ data }) => {
        if (!mounted) return;
        setComparison(data);
        setComparing(false);
      })
      .catch((err) => {
        if (!mounted) return;
        setCompareError(err);
        setComparing(false);
      });

    return () => {
      mounted = false;
    };
  }, [compareIds, matchScores]);

  if (loading) return <Skeleton className="h-96" />;
  if (error) return <ErrorState description={error.message} />;

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Compare plans"
        title="See exactly how plans stack up"
        description={`Add up to 4 of the ${plans.length} catalogue plans and compare price, daily data, validity, coverage and value per GB side by side.`}
      />

      <PlanPicker plans={plans} selectedIds={compareIds} onToggle={toggleCompare} />

      {compareIds.length === 0 ? (
        <EmptyState
          icon={Scale}
          title="Nothing to compare yet"
          description="Search above and add at least two plans to see the full side-by-side comparison."
        />
      ) : compareIds.length === 1 ? (
        <EmptyState
          icon={Scale}
          title="Add one more plan"
          description="Comparisons need at least two plans — add another to see the table and the AI verdict."
        />
      ) : comparing ? (
        <Skeleton className="h-72" />
      ) : compareError ? (
        <ErrorState description={compareError.message} />
      ) : (
        comparison && (
          <>
            <AIVerdictBadges verdicts={comparison.verdicts} />
            <ComparisonTable comparison={comparison} matchScores={matchScores} />
            <div className="flex justify-end">
              <Button variant="ghost" size="sm" onClick={clearCompare}>
                Clear comparison
              </Button>
            </div>
          </>
        )
      )}

      <CategoryCompare plans={plans} />
    </div>
  );
}
