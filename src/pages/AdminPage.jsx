import { useEffect, useState } from 'react';
import { LayoutGrid, Fingerprint, LogOut } from 'lucide-react';
import { SectionHeading, Button, DemoBadge, Skeleton, ErrorState } from '@/components/ui/Primitives';
import { AdminLogin } from '@/components/admin/AdminLogin';
import { StatCardGrid, SegmentationChart, BatchJobCard } from '@/components/admin/AdminWidgets';
import { ClusterExplorer } from '@/components/admin/ClusterExplorer';
import { OperatorCompare } from '@/components/shared/OperatorCompare';
import { useAppStore } from '@/store/useAppStore';
import { getAdminStats } from '@/api/admin';
import { getClusters } from '@/api/clusters';
import { getPlans } from '@/api/plans';

const TABS = [
  { key: 'overview', label: 'Overview', icon: LayoutGrid },
  { key: 'clusters', label: 'Cluster Explorer', icon: Fingerprint },
];

export default function AdminPage() {
  const isAdmin = useAppStore((s) => s.isAdmin);
  const logoutAdmin = useAppStore((s) => s.logoutAdmin);
  const [tab, setTab] = useState('overview');
  const [state, setState] = useState({ loading: true });

  useEffect(() => {
    if (!isAdmin) return;
    let mounted = true;
    Promise.all([getAdminStats(), getClusters(), getPlans()])
      .then(([statsRes, clustersRes, plansRes]) => {
        if (!mounted) return;
        setState({
          loading: false,
          stats: statsRes.data,
          clusters: clustersRes.data,
          plans: plansRes.data,
          demo: statsRes.demo || clustersRes.demo || plansRes.demo,
        });
      })
      .catch((error) => mounted && setState({ loading: false, error }));
    return () => {
      mounted = false;
    };
  }, [isAdmin]);

  if (!isAdmin) return <AdminLogin />;
  if (state.loading) return <Skeleton className="h-96" />;
  if (state.error) return <ErrorState description="We couldn't load the admin dashboard." />;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <SectionHeading eyebrow="Admin" title="Operations dashboard" description="Segmentation, plan catalogue and batch-job health at a glance.">
          {state.demo && <DemoBadge />}
        </SectionHeading>
        <Button variant="ghost" size="sm" icon={LogOut} onClick={logoutAdmin}>
          Sign out
        </Button>
      </div>

      <div className="flex gap-2 border-b border-base-700 pb-px">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t.key ? 'border-cyan-400 text-cyan-300' : 'border-transparent text-base-400 hover:text-base-100'
            }`}
          >
            <t.icon className="h-4 w-4" /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' ? (
        <div className="space-y-6">
          <StatCardGrid stats={state.stats} />
          <div className="grid lg:grid-cols-2 gap-5">
            <SegmentationChart clusters={state.clusters} />
            <BatchJobCard stats={state.stats} />
          </div>
          <OperatorCompare plans={state.plans} />
        </div>
      ) : (
        <ClusterExplorer clusters={state.clusters} plans={state.plans} />
      )}
    </div>
  );
}
