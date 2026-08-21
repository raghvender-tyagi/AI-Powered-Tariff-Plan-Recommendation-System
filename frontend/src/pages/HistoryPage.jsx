import { useEffect, useState } from 'react';
import { History as HistoryIcon, MessageCircle, Users, UserPlus, SlidersHorizontal, Sparkles } from 'lucide-react';
import { SectionHeading, Card, Badge, Skeleton, ErrorState, EmptyState } from '@/components/ui/Primitives';
import { getRecommendationHistory } from '@/api/recommendations';
import { getPlans } from '@/api/plans';
import { useAppStore } from '@/store/useAppStore';
import { currency, formatDate, timeAgo } from '@/lib/format';
import { categoryLabel } from '@/lib/planShape';

const SOURCE_META = {
  chat_profile: { label: 'AI Advisor chat', icon: MessageCircle, tone: 'cyan' },
  cluster: { label: 'Usage-based match', icon: Users, tone: 'blue' },
  profile: { label: 'Profile match', icon: Sparkles, tone: 'green' },
  onboarding: { label: 'Onboarding', icon: UserPlus, tone: 'green' },
  what_if: { label: 'What-If simulation', icon: SlidersHorizontal, tone: 'amber' },
};

export default function HistoryPage() {
  const customerId = useAppStore((s) => s.customerId);
  const [state, setState] = useState({ loading: true });

  useEffect(() => {
    let mounted = true;

    Promise.all([getRecommendationHistory(customerId), getPlans()])
      .then(([historyRes, plansRes]) => {
        if (!mounted) return;
        setState({ loading: false, history: historyRes.data, plans: plansRes.data });
      })
      .catch((error) => {
        if (mounted) setState({ loading: false, error });
      });

    return () => {
      mounted = false;
    };
  }, [customerId]);

  if (state.loading) return <Skeleton className="h-96" />;
  if (state.error) return <ErrorState description={state.error.message} />;

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="History"
        title="Your recommendation activity"
        description="Every time the recommendation engine matched you with plans — most recent first."
      />

      {state.history.length === 0 ? (
        <EmptyState
          icon={HistoryIcon}
          title="No activity yet"
          description="Once you get recommendations, they'll show up here."
        />
      ) : (
        <div className="space-y-4">
          {state.history.map((item) => {
            const meta = SOURCE_META[item.source] ?? SOURCE_META.cluster;

            return (
              <Card key={item._id} className="p-5">
                <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge tone={meta.tone} icon={meta.icon}>
                      {meta.label}
                    </Badge>
                    {item.persona && <Badge tone="neutral">{item.persona}</Badge>}
                  </div>
                  <span className="text-xs text-base-500">
                    {formatDate(item.generatedAt)} · {timeAgo(item.generatedAt)}
                  </span>
                </div>
                <div className="grid sm:grid-cols-3 gap-3">
                  {item.recommendedPlans.map((recommended, index) => {
                    const plan = state.plans.find((candidate) => candidate._id === recommended.planId);

                    return (
                      <div
                        key={recommended.planId}
                        className="rounded-xl border border-base-700 bg-base-900/50 p-4"
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs text-base-500">#{index + 1}</span>
                          <Badge tone="green">
                            {recommended.matchPercent ?? Math.round((recommended.score ?? 0) * 100)}%
                          </Badge>
                        </div>
                        <p className="text-sm font-semibold text-base-100">
                          {plan?.planName ?? recommended.planId}
                        </p>
                        {plan && (
                          <p className="text-xs text-base-500">
                            {categoryLabel(plan)} · {currency(plan.price)} / {plan.validityDays} days
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
