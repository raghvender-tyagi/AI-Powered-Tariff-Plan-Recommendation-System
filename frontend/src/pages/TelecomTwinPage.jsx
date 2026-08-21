import { SectionHeading, Skeleton, ErrorState, Card, Badge } from '@/components/ui/Primitives';
import {
  UsageGaugeGrid,
  ContractInfoCard,
  UsageRatioCard,
  CurrentPlanHealth,
} from '@/components/twin/TwinWidgets';
import { PersonaCard } from '@/components/shared/PersonaCard';
import { useCustomerBundle } from '@/lib/useCustomerBundle';

export default function TelecomTwinPage() {
  const { loading, error, customer, cluster, currentPlan, recommendationMeta, reload } = useCustomerBundle();

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-16" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-44" />
          ))}
        </div>
      </div>
    );
  }

  if (error) return <ErrorState description={error.message} onRetry={reload} />;

  const assignment = recommendationMeta?.personaAssignment;

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="My Telecom Twin"
        title="A live model of how you actually use your phone"
        description="Every figure below is an engineered feature from the Group 1 pipeline — the same values the K-Means model and the recommendation engine consume."
      />

      <UsageGaugeGrid usage={customer.usage} />

      <div className="grid lg:grid-cols-3 gap-5">
        <ContractInfoCard customer={customer} />
        <UsageRatioCard usage={customer.usage} cluster={cluster} />
        {cluster && <PersonaCard cluster={cluster} compact />}
      </div>

      {assignment && (
        <Card className="p-6">
          <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
            <p className="text-xs uppercase tracking-wider text-base-400 font-semibold">
              How your persona was assigned
            </p>
            <Badge tone="cyan">Cluster {assignment.clusterId}</Badge>
          </div>
          <p className="text-sm text-base-300 leading-relaxed">{assignment.method}.</p>
          {assignment.imputedFeatures?.length > 0 && (
            <p className="text-xs text-base-500 mt-2">
              Features inferred rather than measured: {assignment.imputedFeatures.join(', ')}.
            </p>
          )}
        </Card>
      )}

      <CurrentPlanHealth usage={customer.usage} plan={currentPlan} />
    </div>
  );
}
