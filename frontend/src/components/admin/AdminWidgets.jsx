import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import { Users, Layers, Fingerprint, Sparkles, PlayCircle, Loader2, CheckCircle2, Clock } from 'lucide-react';
import { Card, Button, Badge } from '@/components/ui/Primitives';
import { number, timeAgo } from '@/lib/format';
import { CATEGORICAL, CHART_CHROME } from '@/lib/chartPalette';
import { runClusteringJob, getClusteringJobStatus } from '@/api/admin';

export function StatCardGrid({ stats }) {
  const cards = [
    { label: 'Total customers', value: number(stats.totalCustomers), icon: Users, tone: 'cyan' },
    { label: 'Plans in catalogue', value: number(stats.totalPlans), icon: Layers, tone: 'green' },
    { label: 'Clusters / personas', value: number(stats.totalClusters), icon: Fingerprint, tone: 'blue' },
    { label: 'Recommendations stored', value: number(stats.recommendationsGenerated), icon: Sparkles, tone: 'amber' },
  ];
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c) => (
        <Card key={c.label} className="p-5">
          <div className="flex items-center gap-2 text-base-400 mb-3">
            <c.icon className="h-4 w-4" />
            <span className="text-xs font-medium">{c.label}</span>
          </div>
          <p className="text-2xl font-bold font-display text-base-50">{c.value}</p>
        </Card>
      ))}
    </div>
  );
}

function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-lg border border-base-600 bg-base-900 px-3 py-2 shadow-xl text-xs">
      <p className="font-semibold text-base-100">{p.name}</p>
      <p className="text-base-300">{number(p.value)} customers</p>
    </div>
  );
}

export function SegmentationChart({ clusters }) {
  const data = clusters.map((c) => ({ name: c.personaName, value: c.customerCount }));
  return (
    <Card className="p-6">
      <p className="text-xs uppercase tracking-wider text-base-400 font-semibold mb-4">Customer segmentation by persona</p>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} layout="vertical" margin={{ left: 12, right: 16 }}>
          <CartesianGrid horizontal={false} stroke={CHART_CHROME.grid} strokeDasharray="3 5" />
          <XAxis type="number" tick={{ fill: CHART_CHROME.textSecondary, fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis
            type="category"
            dataKey="name"
            width={150}
            tick={{ fill: CHART_CHROME.textSecondary, fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(139,147,184,0.06)' }} />
          <Bar dataKey="value" radius={[0, 6, 6, 0]} maxBarSize={22}>
            {data.map((entry, i) => (
              <Cell key={entry.name} fill={CATEGORICAL[i % CATEGORICAL.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}

export function BatchJobCard({ stats, className }) {
  const [status, setStatus] = useState(stats.lastBatchJobStatus);
  const [jobError, setJobError] = useState(null);
  const [running, setRunning] = useState(false);
  const [lastRun, setLastRun] = useState(stats.lastClusteringRun);

  const handleRun = async () => {
    setRunning(true);
    setJobError(null);
    setStatus('running');

    try {
      const { data: job } = await runClusteringJob();

      const poll = async () => {
        try {
          const { data } = await getClusteringJobStatus(job.jobId);
          if (data.status === 'success' || data.status === 'failed') {
            setStatus(data.status);
            setJobError(data.error ?? null);
            setRunning(false);
            setLastRun(data.finishedAt ?? new Date().toISOString());
          } else {
            setTimeout(poll, 800);
          }
        } catch (error) {
          setStatus('failed');
          setJobError(error.message);
          setRunning(false);
        }
      };

      poll();
    } catch (error) {
      setStatus('failed');
      setJobError(error.message);
      setRunning(false);
    }
  };

  const statusMeta = {
    success: { label: 'Last run succeeded', tone: 'green', icon: CheckCircle2 },
    running: { label: 'Clustering job running…', tone: 'amber', icon: Loader2 },
    failed: { label: 'Last run failed', tone: 'rose', icon: CheckCircle2 },
    never_run: { label: 'Never run', tone: 'neutral', icon: Clock },
  }[status] ?? { label: status, tone: 'neutral', icon: Clock };

  return (
    <Card className={`p-6 ${className || ''}`}>
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs uppercase tracking-wider text-base-400 font-semibold">Batch clustering job</p>
        <Badge tone={statusMeta.tone} icon={statusMeta.icon}>
          {statusMeta.label}
        </Badge>
      </div>
      <p className="text-sm text-base-300 mb-1">POST /api/admin/clusters/run</p>
      <p className="text-xs text-base-500 mb-2">
        {lastRun ? `Last run ${timeAgo(lastRun)}` : 'Never run from here'} · re-extracts the K-Means
        centroids and normalisation stats, refreshes the catalogue caches and re-syncs every
        customer's cluster label.
      </p>
      {jobError && <p className="text-xs text-rose-300 mb-3">{jobError}</p>}
      <Button onClick={handleRun} loading={running} icon={PlayCircle} variant="secondary" size="sm">
        Run clustering now
      </Button>
    </Card>
  );
}
