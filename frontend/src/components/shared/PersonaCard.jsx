import { Fingerprint, Users } from 'lucide-react';
import { Card, Badge } from '@/components/ui/Primitives';
import { number } from '@/lib/format';

const TRAIT_TONE = { 'Very High': 'rose', High: 'amber', Medium: 'blue', Low: 'green', 'Very Low': 'green' };

export function PersonaCard({ cluster, compact = false, className }) {
  if (!cluster) return null;
  return (
    <Card className={`p-6 ${className || ''}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="h-11 w-11 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${cluster.color}1f`, color: cluster.color }}
          >
            <Fingerprint className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-base-400 font-semibold">Your telecom persona</p>
            <h3 className="text-lg font-bold text-base-50">{cluster.personaName}</h3>
          </div>
        </div>
        {cluster.customerCount && (
          <Badge tone="neutral" icon={Users}>
            {number(cluster.customerCount)} similar users
          </Badge>
        )}
      </div>
      <p className="text-sm text-base-300 mt-4 leading-relaxed">{cluster.description}</p>
      {!compact && cluster.traits && (
        <div className="mt-4 flex flex-wrap gap-2">
          {Object.entries(cluster.traits).map(([key, val]) => (
            <Badge key={key} tone={TRAIT_TONE[val] || 'neutral'}>
              {key[0].toUpperCase() + key.slice(1)}: {val}
            </Badge>
          ))}
        </div>
      )}
    </Card>
  );
}
