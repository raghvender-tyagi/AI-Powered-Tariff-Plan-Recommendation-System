import { useEffect, useState } from 'react';
import { History as HistoryIcon, MessageCircle, Users } from 'lucide-react';
import { SectionHeading, Card, Badge, DemoBadge, Skeleton, ErrorState, EmptyState } from '@/components/ui/Primitives';
import { getRecommendationHistory } from '@/api/recommendations';
import { getPlans } from '@/api/plans';
import { useAppStore } from '@/store/useAppStore';
import { currency, formatDate, timeAgo } from '@/lib/format';
import { operatorName } from '@/components/recommendations/PlanCard';

const SOURCE_META = {
  chat_profile: { label: 'AI Advisor chat', icon: MessageCircle, tone: 'cyan' },
  cluster: { label: 'Usage-based match', icon: Users, tone: 'blue' },
};

export default function HistoryPage() {
  const customerId = useAppStore((s) => s.customerId);
  const [state, setState] = useState({ loading: true });

  useEffect(() => {
    let mounted = true;
    Promise.all([getRecommendationHistory(customerId), getPlans()])
      .then(([hist, plansRes]) => {
        if (!mounted) return;
        setState({ loading: false, history: hist.data, demo: hist.demo || plansRes.demo, plans: plansRes.data });
      })
      .catch((error) => mounted && setState({ loading: false, error }));
    return () => {
      mounted = false;
    };
  }, [customerId]);

  if (state.loading) return <Skeleton className="h-96" />;
  if (state.error) return <ErrorState description="We couldn't load your recommendation history." />;

  return (
    <div className="space-y-8">
      <SectionHeading eyebrow="History" title="Your recommendation activity" description="Every time the AI matched you with plans — most recent first.">
        {state.demo && <DemoBadge />}
      </SectionHeading>

      {state.history.length === 0 ? (
        <EmptyState icon={HistoryIcon} title="No activity yet" description="Once you get recommendations, they'll show up here." />
      ) : (
        <div className="space-y-4">
          {state.history.map((item) => {
            const meta = SOURCE_META[item.source] ?? SOURCE_META.cluster;
            return (
              <Card key={item._id} className="p-5">
                <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
                  <Badge tone={meta.tone} icon={meta.icon}>
                    {meta.label}
                  </Badge>
                  <span className="text-xs text-base-500">
                    {formatDate(item.generatedAt)} · {timeAgo(item.generatedAt)}
                  </span>
                </div>
                <div className="grid sm:grid-cols-3 gap-3">
                  {item.recommendedPlans.map((rp, i) => {
                    const plan = state.plans.find((p) => p._id === rp.planId);
                    if (!plan) return null;
                    return (
                      <div key={rp.planId} className="rounded-xl border border-base-700 bg-base-900/50 p-4">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs text-base-500">#{i + 1}</span>
                          <Badge tone="green">{Math.round(rp.score * 100)}%</Badge>
                        </div>
                        <p className="text-sm font-semibold text-base-100">{plan.planName}</p>
                        <p className="text-xs text-base-500">
                          {operatorName(plan.operator)} · {currency(plan.price)}/mo
                        </p>
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
