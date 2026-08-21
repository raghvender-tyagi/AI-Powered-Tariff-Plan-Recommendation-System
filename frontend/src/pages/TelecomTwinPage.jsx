import { SectionHeading, DemoBadge, Skeleton, ErrorState } from '@/components/ui/Primitives';
import { UsageGaugeGrid, ContractInfoCard, DayPartSplit, CurrentPlanHealth } from '@/components/twin/TwinWidgets';
import { PersonaCard } from '@/components/shared/PersonaCard';
import { useCustomerBundle } from '@/lib/useCustomerBundle';

export default function TelecomTwinPage() {
  const { loading, error, customer, cluster, currentPlan, demo, reload } = useCustomerBundle();

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-16" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-44" />
          ))}
        </div>
      </div>
    );
  }
  if (error) return <ErrorState description="We couldn't load your Telecom Twin." onRetry={reload} />;

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="My Telecom Twin"
        title="A live model of how you actually use your phone"
        description="Every card below reflects your real usage this billing cycle — the same data the AI uses to score plans."
      >
        {demo?.customer && <DemoBadge />}
      </SectionHeading>

      <UsageGaugeGrid usage={customer.usage} />

      <div className="grid lg:grid-cols-3 gap-5">
        <ContractInfoCard customer={customer} />
        <DayPartSplit split={customer.usage.dayEveningNightSplit} />
        {cluster && <PersonaCard cluster={cluster} compact />}
      </div>

      <CurrentPlanHealth usage={customer.usage} plan={currentPlan} />
    </div>
  );
}
