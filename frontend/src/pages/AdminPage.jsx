import { useEffect, useState } from 'react';
import { LayoutGrid, Fingerprint, Cpu, LogOut } from 'lucide-react';
import { SectionHeading, Button, Card, Badge, Skeleton, ErrorState } from '@/components/ui/Primitives';
import { AdminLogin } from '@/components/admin/AdminLogin';
import { StatCardGrid, SegmentationChart, BatchJobCard } from '@/components/admin/AdminWidgets';
import { ClusterExplorer } from '@/components/admin/ClusterExplorer';
import { CategoryCompare } from '@/components/shared/OperatorCompare';
import { useAppStore } from '@/store/useAppStore';
import { getAdminStats } from '@/api/admin';
import { getClusters } from '@/api/clusters';
import { getPlans } from '@/api/plans';
import { percent } from '@/lib/format';

const TABS = [
  { key: 'overview', label: 'Overview', icon: LayoutGrid },
  { key: 'clusters', label: 'Cluster Explorer', icon: Fingerprint },
  { key: 'model', label: 'Model', icon: Cpu },
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
        });
      })
      .catch((error) => {
        if (mounted) setState({ loading: false, error });
      });

    return () => {
      mounted = false;
    };
  }, [isAdmin]);

  if (!isAdmin) return <AdminLogin />;
  if (state.loading) return <Skeleton className="h-96" />;
  if (state.error) return <ErrorState description={state.error.message} />;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <SectionHeading
          eyebrow="Admin"
          title="Operations dashboard"
          description="Segmentation, plan catalogue, model health and batch jobs at a glance."
        />
        <Button variant="ghost" size="sm" icon={LogOut} onClick={logoutAdmin}>
          Sign out
        </Button>
      </div>

      <div className="flex gap-2 border-b border-base-700 pb-px">
        {TABS.map((item) => (
          <button
            key={item.key}
            onClick={() => setTab(item.key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === item.key
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-base-400 hover:text-base-100'
            }`}
          >
            <item.icon className="h-4 w-4" /> {item.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="space-y-6">
          <StatCardGrid stats={state.stats} />
          <div className="grid lg:grid-cols-2 gap-5">
            <SegmentationChart clusters={state.clusters} />
            <BatchJobCard stats={state.stats} />
          </div>
          <CategoryCompare plans={state.plans} />
        </div>
      )}

      {tab === 'clusters' && <ClusterExplorer clusters={state.clusters} plans={state.plans} />}

      {tab === 'model' && <ModelPanel stats={state.stats} />}
    </div>
  );
}

function ModelPanel({ stats }) {
  const model = stats.model;
  if (!model) return null;

  return (
    <div className="space-y-5">
      <Card className="p-6">
        <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
          <p className="text-xs uppercase tracking-wider text-base-400 font-semibold">
            Production clustering model
          </p>
          <Badge tone="green">{model.comparison.productionMethod}</Badge>
        </div>
        <div className="grid sm:grid-cols-4 gap-4 text-sm">
          <Fact label="Algorithm" value={model.algorithm} />
          <Fact label="Optimal K" value={model.optimalK} />
          <Fact label="Best silhouette" value={model.bestSilhouetteScore} />
          <Fact label="Customers clustered" value={model.customers.toLocaleString('en-IN')} />
        </div>
        <p className="text-sm text-base-300 mt-4 leading-relaxed">{model.comparison.conclusion}</p>
      </Card>

      <div className="grid lg:grid-cols-2 gap-5">
        <Card className="p-6">
          <p className="text-xs uppercase tracking-wider text-base-400 font-semibold mb-4">
            Silhouette analysis (K sweep)
          </p>
          <ul className="space-y-1.5">
            {model.silhouetteResults.map((row) => (
              <li key={row.k} className="flex items-center gap-3 text-sm">
                <span className="w-12 text-base-400">K = {row.k}</span>
                <span className="flex-1 h-2 rounded-full bg-base-800 overflow-hidden">
                  <span
                    className={`block h-full rounded-full ${
                      row.k === model.optimalK ? 'bg-cyan-400' : 'bg-base-600'
                    }`}
                    style={{ width: `${(row.silhouette / model.bestSilhouetteScore) * 100}%` }}
                  />
                </span>
                <span className={`w-16 text-right ${row.k === model.optimalK ? 'text-cyan-300 font-semibold' : 'text-base-300'}`}>
                  {row.silhouette}
                </span>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-6 space-y-5">
          <div>
            <p className="text-xs uppercase tracking-wider text-base-400 font-semibold mb-3">
              Model comparison
            </p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <Fact
                label={model.comparison.kmeans.method}
                value={`silhouette ${model.comparison.kmeans.silhouette}`}
              />
              <Fact
                label={model.comparison.alternative.method}
                value={`silhouette ${Number(model.comparison.alternative.silhouette).toFixed(4)}`}
              />
            </div>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-base-400 font-semibold mb-3">
              PCA (visualisation only)
            </p>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <Fact label="PC1" value={percent(model.pca.explainedVariance[0] * 100, 1)} />
              <Fact label="PC2" value={percent(model.pca.explainedVariance[1] * 100, 1)} />
              <Fact label="Total" value={percent(model.pca.totalExplainedVariance * 100, 1)} />
            </div>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-base-400 font-semibold mb-3">
              Recommendation scoring weights
            </p>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <Fact label="Usage fit" value={percent(model.scoringWeights.usageFit * 100)} />
              <Fact label="Budget fit" value={percent(model.scoringWeights.budgetFit * 100)} />
              <Fact label="Persona match" value={percent(model.scoringWeights.personaMatch * 100)} />
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <p className="text-xs uppercase tracking-wider text-base-400 font-semibold mb-4">
          Clustering features ({model.features.length})
        </p>
        <div className="flex flex-wrap gap-2">
          {model.features.map((feature) => (
            <Badge key={feature} tone="neutral">
              {feature}
            </Badge>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <p className="text-xs uppercase tracking-wider text-base-400 font-semibold mb-4">Infrastructure</p>
        <div className="grid sm:grid-cols-3 gap-4 text-sm">
          <Fact label="Database driver" value={stats.database?.driver ?? '—'} />
          <Fact label="Knowledge-base documents" value={stats.knowledgeBaseDocuments ?? '—'} />
          <Fact label="Chat sessions" value={stats.chatSessions ?? 0} />
        </div>
        {stats.database?.detail && (
          <p className="text-xs text-base-500 mt-3">{stats.database.detail}</p>
        )}
      </Card>
    </div>
  );
}

function Fact({ label, value }) {
  return (
    <div>
      <p className="text-xs text-base-400">{label}</p>
      <p className="text-base-100 font-medium">{value}</p>
    </div>
  );
}
