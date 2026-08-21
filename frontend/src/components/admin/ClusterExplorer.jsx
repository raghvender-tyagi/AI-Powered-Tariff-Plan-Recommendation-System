import { useState } from 'react';
import { ChevronDown, Fingerprint, Users, Loader2 } from 'lucide-react';
import { Card, Badge } from '@/components/ui/Primitives';
import { number, currency } from '@/lib/format';
import { categoryLabel } from '@/lib/planShape';
import { getClusterCustomers } from '@/api/clusters';

const TRAIT_TONE = { 'Very High': 'rose', High: 'amber', Medium: 'blue', Low: 'green', 'Very Low': 'green' };

export function ClusterExplorer({ clusters, plans }) {
  const [openId, setOpenId] = useState(null);
  const [customersById, setCustomersById] = useState({});
  const [loadingId, setLoadingId] = useState(null);

  const toggle = async (cluster) => {
    if (openId === cluster._id) {
      setOpenId(null);
      return;
    }
    setOpenId(cluster._id);
    if (!customersById[cluster._id]) {
      setLoadingId(cluster._id);
      const { data } = await getClusterCustomers(cluster._id);
      setCustomersById((s) => ({ ...s, [cluster._id]: data }));
      setLoadingId(null);
    }
  };

  return (
    <div className="space-y-3">
      {clusters.map((cluster) => {
        const popularPlans = plans.filter((p) => p.clusterId === cluster.clusterLabel).slice(0, 4);
        const isOpen = openId === cluster._id;
        return (
          <Card key={cluster._id} className="overflow-hidden">
            <button
              onClick={() => toggle(cluster)}
              className="w-full flex items-center justify-between gap-4 p-5 text-left"
              aria-expanded={isOpen}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${cluster.color}1f`, color: cluster.color }}
                >
                  <Fingerprint className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-base-50 truncate">{cluster.personaName}</p>
                  <p className="text-xs text-base-400 truncate">{cluster.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <Badge tone="neutral" icon={Users}>
                  {number(cluster.customerCount)}
                </Badge>
                <ChevronDown className={`h-4 w-4 text-base-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </div>
            </button>

            {isOpen && (
              <div className="px-5 pb-5 border-t border-base-700 pt-4 grid md:grid-cols-2 gap-6">
                <div>
                  <p className="text-xs uppercase tracking-wider text-base-400 font-semibold mb-3">Usage characteristics</p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {Object.entries(cluster.traits ?? {}).map(([k, v]) => (
                      <Badge key={k} tone={TRAIT_TONE[v] || 'neutral'}>
                        {k[0].toUpperCase() + k.slice(1)}: {v}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-xs uppercase tracking-wider text-base-400 font-semibold mb-2">Popular plans</p>
                  <ul className="space-y-1.5">
                    {popularPlans.map((p) => (
                      <li key={p._id} className="text-sm text-base-200 flex justify-between">
                        <span>{p.planName}</span>
                        <span className="text-base-500">
                          {categoryLabel(p)} · {currency(p.price)}
                        </span>
                      </li>
                    ))}
                    {popularPlans.length === 0 && <li className="text-sm text-base-500">No plans mapped to this cluster yet.</li>}
                  </ul>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-base-400 font-semibold mb-3">Sample customers</p>
                  {loadingId === cluster._id ? (
                    <div className="flex items-center gap-2 text-sm text-base-400">
                      <Loader2 className="h-4 w-4 animate-spin" /> Loading…
                    </div>
                  ) : (
                    <ul className="space-y-1.5">
                      {(customersById[cluster._id] ?? []).slice(0, 6).map((c) => (
                        <li key={c._id} className="text-sm text-base-300 flex justify-between">
                          <span>{c.customerId ?? c._id}</span>
                          <span className="text-base-500">{Number(c.usage?.dataGB ?? 0).toFixed(1)}GB · {Math.round(c.usage?.callMinutes ?? 0)}min</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
