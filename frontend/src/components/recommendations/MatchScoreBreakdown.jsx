import { Wifi, PhoneCall, Wallet, Globe2, Fingerprint } from 'lucide-react';
import { ProgressBar } from '@/components/ui/Primitives';

const DIMENSIONS = [
  { key: 'dataFit', label: 'Data Fit', icon: Wifi, tone: 'cyan' },
  { key: 'callingFit', label: 'Calling Fit', icon: PhoneCall, tone: 'green' },
  { key: 'budgetFit', label: 'Budget Fit', icon: Wallet, tone: 'amber' },
  { key: 'roamingFit', label: 'Roaming Fit', icon: Globe2, tone: 'blue' },
  { key: 'personaFit', label: 'Persona Fit', icon: Fingerprint, tone: 'rose' },
];

export function MatchScoreBreakdown({ breakdown, dense = false }) {
  if (!breakdown) return null;
  return (
    <div className="space-y-3">
      {DIMENSIONS.map((dim) => {
        const value = breakdown[dim.key] ?? 0;
        return (
          <div key={dim.key}>
            <div className="flex items-center justify-between mb-1">
              <span className="flex items-center gap-1.5 text-xs text-base-300">
                <dim.icon className="h-3.5 w-3.5 text-base-400" aria-hidden="true" />
                {dim.label}
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
