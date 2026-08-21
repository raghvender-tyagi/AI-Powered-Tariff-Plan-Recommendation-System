import { useState } from 'react';
import { Search, Plus, X } from 'lucide-react';
import { Card } from '@/components/ui/Primitives';
import { operatorName } from '@/components/recommendations/PlanCard';

export function PlanPicker({ plans, selectedIds, onToggle, max = 4 }) {
  const [query, setQuery] = useState('');
  const filtered = plans.filter(
    (p) =>
      !selectedIds.includes(p._id) &&
      (p.planName.toLowerCase().includes(query.toLowerCase()) || operatorName(p.operator).toLowerCase().includes(query.toLowerCase())),
  );

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 rounded-lg border border-base-700 bg-base-900 px-3 py-2 mb-3">
        <Search className="h-4 w-4 text-base-500" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search plans to add to comparison…"
          aria-label="Search plans to compare"
          className="bg-transparent text-sm text-base-100 placeholder:text-base-500 flex-1 outline-none"
        />
      </div>
      <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto scrollbar-thin">
        {selectedIds.length >= max && <p className="text-xs text-base-500">Up to {max} plans can be compared at once.</p>}
        {selectedIds.length < max &&
          filtered.slice(0, 12).map((p) => (
            <button
              key={p._id}
              onClick={() => onToggle(p._id)}
              className="flex items-center gap-1.5 rounded-full border border-base-700 bg-base-800/60 pl-3 pr-2 py-1.5 text-xs text-base-200 hover:border-cyan-400/50 hover:text-cyan-300 transition-colors"
            >
              {p.planName}
              <Plus className="h-3 w-3" />
            </button>
          ))}
      </div>
      {selectedIds.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-base-700">
          {selectedIds.map((id) => {
            const p = plans.find((pl) => pl._id === id);
            if (!p) return null;
            return (
              <span key={id} className="flex items-center gap-1.5 rounded-full bg-cyan-400/10 border border-cyan-400/30 pl-3 pr-2 py-1.5 text-xs text-cyan-300">
                {p.planName}
                <button onClick={() => onToggle(id)} aria-label={`Remove ${p.planName} from comparison`}>
                  <X className="h-3 w-3" />
                </button>
              </span>
            );
          })}
        </div>
      )}
    </Card>
  );
}
