import { useEffect, useState, useRef, useCallback } from 'react';
import { Zap, RefreshCcw, CloudCheck, ArrowUpRight, ArrowDownRight, Minus, Fingerprint } from 'lucide-react';
import { SectionHeading, Card, Badge, Skeleton, ErrorState } from '@/components/ui/Primitives';
import { SimulatorSliders } from '@/components/simulator/SimulatorSliders';
import { PlanCard } from '@/components/recommendations/PlanCard';
import { getCustomer } from '@/api/customers';
import { getWhatIf } from '@/api/recommendations';
import { useAppStore } from '@/store/useAppStore';
import { currency } from '@/lib/format';

/**
 * What-If flow. The sliders never score anything in the browser — every
 * update posts the simulated profile to /api/recommendations/what-if, which
 * runs the same recommendation engine on the baseline and the scenario and
 * returns the difference.
 */
export default function SimulatorPage() {
  const customerId = useAppStore((s) => s.customerId);

  const [baseline, setBaseline] = useState(null);
  const [profile, setProfile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [syncStatus, setSyncStatus] = useState('idle'); // idle | syncing | synced
  const debounceRef = useRef(null);

  // Seed the sliders from the signed-in customer's real usage where we can.
  useEffect(() => {
    let mounted = true;

    getCustomer(customerId)
      .then(({ data }) => {
        if (!mounted) return;
        const seeded = {
          dataNeedGB: Math.round(data.usage.dataGB ?? 15),
          callNeedMin: Math.round(data.usage.callMinutes ?? 500),
          budget: Math.round(data.usage.monthlyRecharge ?? 650),
          roamingRequired: (data.usage.roamingDataGB ?? 0) > 0,
          tenureMonths: data.tenureMonths,
        };
        setBaseline(seeded);
        setProfile(seeded);
        setLoading(false);
      })
      .catch(() => {
        // No stored customer (e.g. a brand-new visitor) — start from neutral
        // slider positions and simulate against those instead.
        if (!mounted) return;
        const seeded = { dataNeedGB: 15, callNeedMin: 500, budget: 650, roamingRequired: false };
        setBaseline(seeded);
        setProfile(seeded);
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [customerId]);

  const simulate = useCallback(
    async (next, base) => {
      setSyncStatus('syncing');
      try {
        const { data } = await getWhatIf({ baselineProfile: base, changes: next });
        setResult(data);
        setSyncStatus('synced');
        setError(null);
      } catch (err) {
        setError(err);
        setSyncStatus('idle');
      }
    },
    [],
  );

  useEffect(() => {
    if (!profile || !baseline) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    setSyncStatus('syncing');
    debounceRef.current = setTimeout(() => simulate(profile, baseline), 450);

    return () => clearTimeout(debounceRef.current);
  }, [profile, baseline, simulate]);

  if (loading) return <Skeleton className="h-96" />;

  const impact = result?.impact;
  const entries = result?.simulated?.top3 ?? [];

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="What-If Simulator"
        title="See how your recommendations change"
        description="Drag a slider to simulate a different usage pattern or budget. Each change is re-scored by the recommendation engine against all 25 plans."
      />

      {error && <ErrorState description={error.message} onRetry={() => simulate(profile, baseline)} />}

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <SimulatorSliders profile={profile} onChange={setProfile} />
          {baseline && (
            <Card className="p-5">
              <p className="text-xs uppercase tracking-wider text-base-400 font-semibold mb-3">
                Baseline (your current profile)
              </p>
              <ul className="space-y-1.5 text-xs text-base-400">
                <li>Data: {baseline.dataNeedGB} GB / month</li>
                <li>Calling: {baseline.callNeedMin} min / month</li>
                <li>Budget: {currency(baseline.budget)}</li>
                <li>Roaming: {baseline.roamingRequired ? 'needed' : 'not needed'}</li>
              </ul>
            </Card>
          )}
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <p className="text-xs uppercase tracking-wider text-base-400 font-semibold">
              Projected matches under this scenario
            </p>
            <SyncBadge status={syncStatus} />
          </div>

          {impact && (
            <Card className="p-5 space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge tone={impact.personaChanged ? 'amber' : 'neutral'} icon={Fingerprint}>
                  {result.simulated.persona}
                </Badge>
                {impact.personaChanged && (
                  <Badge tone="rose">Persona changed from {result.baseline.persona}</Badge>
                )}
                <PriceDeltaBadge delta={impact.priceDelta} />
              </div>
              <p className="text-sm text-base-200 leading-relaxed">{impact.narrative}</p>
            </Card>
          )}

          {entries.length === 0 ? (
            <Card className="p-8 text-center text-sm text-base-400">Adjust a slider to see live matches.</Card>
          ) : (
            <div className="grid sm:grid-cols-1 xl:grid-cols-3 gap-4">
              {entries.map((entry) => (
                <PlanCard key={entry.planId} entry={entry} featured={entry.rank === 1} />
              ))}
            </div>
          )}

          {impact?.movements?.length > 0 && (
            <Card className="p-5">
              <p className="text-xs uppercase tracking-wider text-base-400 font-semibold mb-3">
                Biggest score movements across all 25 plans
              </p>
              <ul className="space-y-2">
                {[...impact.movements]
                  .filter((movement) => movement.scoreDelta !== null)
                  .sort((a, b) => Math.abs(b.scoreDelta) - Math.abs(a.scoreDelta))
                  .slice(0, 5)
                  .map((movement) => (
                    <li key={movement.planId} className="flex items-center justify-between text-sm">
                      <span className="text-base-200">{movement.planName}</span>
                      <span
                        className={`flex items-center gap-1 text-xs font-semibold ${
                          movement.scoreDelta > 0
                            ? 'text-green-300'
                            : movement.scoreDelta < 0
                              ? 'text-rose-300'
                              : 'text-base-400'
                        }`}
                      >
                        {movement.scoreBefore}% → {movement.scoreAfter}%
                        {movement.scoreDelta > 0 ? (
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        ) : movement.scoreDelta < 0 ? (
                          <ArrowDownRight className="h-3.5 w-3.5" />
                        ) : (
                          <Minus className="h-3.5 w-3.5" />
                        )}
                      </span>
                    </li>
                  ))}
              </ul>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function PriceDeltaBadge({ delta }) {
  if (!Number.isFinite(delta) || delta === 0) {
    return <Badge tone="neutral">Same monthly price</Badge>;
  }
  return (
    <Badge tone={delta > 0 ? 'rose' : 'green'}>
      {delta > 0 ? '+' : '−'}
      {currency(Math.abs(delta))} per cycle
    </Badge>
  );
}

function SyncBadge({ status }) {
  if (status === 'synced')
    return (
      <Badge tone="green" icon={CloudCheck}>
        Scored by the recommendation engine
      </Badge>
    );
  if (status === 'syncing')
    return (
      <Badge tone="amber" icon={RefreshCcw}>
        Re-scoring 25 plans…
      </Badge>
    );
  return (
    <Badge tone="neutral" icon={Zap}>
      Ready
    </Badge>
  );
}
