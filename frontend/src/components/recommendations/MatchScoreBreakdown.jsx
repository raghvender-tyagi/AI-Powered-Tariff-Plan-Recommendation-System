import { Activity, Wallet, Fingerprint } from 'lucide-react';
import { ProgressBar } from '@/components/ui/Primitives';
import { SCORE_DIMENSIONS } from '@/lib/planShape';

const ICONS = { usageFit: Activity, budgetFit: Wallet, personaMatch: Fingerprint };

/**
 * Renders the three score components the recommendation engine actually
 * produces, with the weights it applies. Nothing is recomputed here.
 */
export function MatchScoreBreakdown({ breakdown, dense = false }) {
  if (!breakdown) return null;

  return (
    <div className="space-y-3">
      {SCORE_DIMENSIONS.map((dim) => {
        const value = breakdown[dim.key] ?? 0;
        const Icon = ICONS[dim.key];
        return (
          <div key={dim.key}>
            <div className="flex items-center justify-between mb-1">
              <span className="flex items-center gap-1.5 text-xs text-base-300">
                <Icon className="h-3.5 w-3.5 text-base-400" aria-hidden="true" />
                {dim.label}
                <span className="text-base-500">· weight {dim.weight}</span>
              </span>
              <span className="text-xs font-semibold text-base-100">{value}%</span>
            </div>
            <ProgressBar value={value} tone={dim.tone} height={dense ? 'h-1.5' : 'h-2'} />
          </div>
        );
      })}
    </div>
  );
}
