import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Card, Button, SectionHeading, Skeleton, ErrorState } from '@/components/ui/Primitives';
import {
  GreetingHeader,
  TwinSummaryGrid,
  CurrentPlanCard,
  SavingsCard,
  ActivityFeed,
} from '@/components/dashboard/DashboardWidgets';
import { UsageOverviewChart } from '@/components/dashboard/UsageOverviewChart';
import { PersonaCard } from '@/components/shared/PersonaCard';
import { PlanCard } from '@/components/recommendations/PlanCard';
import { useCustomerBundle } from '@/lib/useCustomerBundle';

export default function DashboardPage() {
  const {
    loading,
    error,
    customer,
    cluster,
    currentPlan,
    recommendations,
    recommendationMeta,
    plans,
    history,
    reload,
  } = useCustomerBundle();

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-24" />
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-80" />
      </div>
    );
  }

  if (error) {
    return <ErrorState description={error.message} onRetry={reload} />;
  }

  const topRec = recommendations?.[0];

  return (
    <div className="space-y-8">
      <GreetingHeader
        name={customer.name ?? customer.customerId}
        persona={cluster?.personaName ?? recommendationMeta?.persona}
        tenureMonths={customer.tenureMonths}
      />

      <TwinSummaryGrid usage={customer.usage} monthlySpend={customer.monthlySpend} />

      <div className="grid lg:grid-cols-3 gap-5">
        <Card className="p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs uppercase tracking-wider text-base-400 font-semibold">Usage overview</p>
            <Button as={Link} to="/app/twin" variant="ghost" size="sm" iconRight={ArrowRight}>
              Full Telecom Twin
            </Button>
          </div>
          <UsageOverviewChart usage={customer.usage} averages={cluster?.averages} />
        </Card>
        <CurrentPlanCard plan={currentPlan} monthlySpend={customer.monthlySpend} />
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {cluster && <PersonaCard cluster={cluster} compact />}
        <SavingsCard
          currentPrice={currentPlan?.price ?? customer.monthlySpend ?? 0}
          recommendedPrice={topRec?.plan.price ?? 0}
        />
        <ActivityFeed history={history} plans={plans} />
      </div>

      <SectionHeading
        eyebrow="AI Recommendation Center"
        title="Your top matches"
        description={`Scored against all ${recommendationMeta?.plansEvaluated ?? 25} catalogue plans by the recommendation engine.`}
      >
        <Button as={Link} to="/app/recommendations" size="sm" icon={Sparkles} iconRight={ArrowRight}>
          View all
        </Button>
      </SectionHeading>

      {recommendations?.length > 0 ? (
        <div className="grid md:grid-cols-3 gap-5">
          {recommendations.map((entry) => (
            <PlanCard key={entry.planId} entry={entry} featured={entry.rank === 1} />
          ))}
        </div>
      ) : (
        <Card className="p-8 text-center text-sm text-base-400">
          No recommendations yet.{' '}
          <Link to="/onboarding" className="text-cyan-300 underline underline-offset-2">
            Build your Telecom Twin
          </Link>{' '}
          to get matched.
        </Card>
      )}
    </div>
  );
}
