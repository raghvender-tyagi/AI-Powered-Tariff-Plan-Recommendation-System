import { useEffect, useState, useRef } from 'react';
import { Zap, RefreshCcw, CloudCheck } from 'lucide-react';
import { SectionHeading, Card, Badge, Skeleton, ErrorState } from '@/components/ui/Primitives';
import { SimulatorSliders } from '@/components/simulator/SimulatorSliders';
import { PlanCard } from '@/components/recommendations/PlanCard';
import { getPlans } from '@/api/plans';
import { getRecommendationsByProfile } from '@/api/recommendations';
import { rankPlans } from '@/lib/scoring';

export default function SimulatorPage() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profile, setProfile] = useState({ dataNeedGB: 15, callNeedMin: 500, budget: 650, roamingRequired: false });
  const [liveEntries, setLiveEntries] = useState([]);
  const [syncStatus, setSyncStatus] = useState('idle'); // idle | syncing | synced
  const debounceRef = useRef(null);

  useEffect(() => {
    getPlans()
      .then(({ data }) => {
        setPlans(data);
        setLoading(false);
      })
      .catch((e) => {
        setError(e);
        setLoading(false);
      });
  }, []);

  // Instant client-side estimate on every drag — mirrors the backend formula.
  useEffect(() => {
    if (plans.length === 0) return;
    const ranked = rankPlans(plans, profile, 3);
    setLiveEntries(
      ranked.map((r, i) => ({
        planId: r.plan._id,
        plan: r.plan,
        matchPercent: r.total,
        breakdown: r.breakdown,
        rank: i + 1,
        explanation: `Estimated live from your simulated usage — ${profile.dataNeedGB}GB data, ${profile.callNeedMin} mins, ${
          '₹'
        }${profile.budget} budget.`,
      })),
    );
    setSyncStatus('syncing');

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const { data } = await getRecommendationsByProfile(profile);
        setLiveEntries(data.plans);
        setSyncStatus('synced');
      } catch {
        setSyncStatus('idle');
      }
    }, 700);

    return () => clearTimeout(debounceRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, plans]);

  if (loading) return <Skeleton className="h-96" />;
  if (error) return <ErrorState description="We couldn't load the plan catalogue for the simulator." />;

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="What-If Simulator"
        title="See how your recommendations change"
        description="Drag the sliders to simulate a different usage pattern or budget — recommendations update instantly."
      />

      <div className="grid lg:grid-cols-3 gap-6">
        <SimulatorSliders profile={profile} onChange={setProfile} className="lg:col-span-1" />

        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wider text-base-400 font-semibold">Live projected matches</p>
            <SyncBadge status={syncStatus} />
          </div>
          {liveEntries.length === 0 ? (
            <Card className="p-8 text-center text-sm text-base-400">Adjust a slider to see live matches.</Card>
          ) : (
            <div className="grid sm:grid-cols-1 xl:grid-cols-3 gap-4">
              {liveEntries.map((entry) => (
                <PlanCard key={entry.planId} entry={entry} featured={entry.rank === 1} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SyncBadge({ status }) {
  if (status === 'synced')
    return (
      <Badge tone="green" icon={CloudCheck}>
        Synced with recommendation engine
      </Badge>
    );
  if (status === 'syncing')
    return (
      <Badge tone="amber" icon={RefreshCcw}>
        Estimating…
      </Badge>
    );
  return (
    <Badge tone="neutral" icon={Zap}>
      Live estimate
    </Badge>
  );
}
