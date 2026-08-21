import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Card, Button, SectionHeading, DemoBadge, Skeleton, ErrorState } from '@/components/ui/Primitives';
import { GreetingHeader, TwinSummaryGrid, CurrentPlanCard, SavingsCard, ActivityFeed } from '@/components/dashboard/DashboardWidgets';
import { UsageOverviewChart } from '@/components/dashboard/UsageOverviewChart';
import { PersonaCard } from '@/components/shared/PersonaCard';
import { PlanCard } from '@/components/recommendations/PlanCard';
import { useCustomerBundle } from '@/lib/useCustomerBundle';
import { useAppStore } from '@/store/useAppStore';

export default function DashboardPage() {
  const customerName = useAppStore((s) => s.customerName);
  const { loading, error, customer, cluster, currentPlan, recommendations, plans, history, demo, reload } = useCustomerBundle();

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-24" />
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-80" />
      </div>
    );
  }

  if (error) {
    return <ErrorState description="We couldn't load your dashboard data." onRetry={reload} />;
  }

  const anyDemo = demo && Object.values(demo).some(Boolean);
  const topRec = recommendations?.[0];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <GreetingHeader name={customerName} persona={cluster?.personaName} tenureMonths={customer?.tenureMonths} />
        {anyDemo && <DemoBadge />}
      </div>

      <TwinSummaryGrid usage={customer.usage} monthlySpend={customer.monthlySpend} />

      <div className="grid lg:grid-cols-3 gap-5">
        <Card className="p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs uppercase tracking-wider text-base-400 font-semibold">Usage overview</p>
            <Button as={Link} to="/app/twin" variant="ghost" size="sm" iconRight={ArrowRight}>
              Full Telecom Twin
            </Button>
          </div>
          <UsageOverviewChart usage={customer.usage} />
        </Card>
        <CurrentPlanCard plan={currentPlan} />
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {cluster && <PersonaCard cluster={cluster} compact />}
        <SavingsCard currentPrice={currentPlan?.price ?? 0} recommendedPrice={topRec?.plan.price ?? currentPlan?.price ?? 0} />
        <ActivityFeed history={history} plans={plans} />
      </div>

      <SectionHeading eyebrow="AI Recommendation Center" title="Your top matches" description="A quick look — open the full recommendation center for match breakdowns and explanations.">
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
