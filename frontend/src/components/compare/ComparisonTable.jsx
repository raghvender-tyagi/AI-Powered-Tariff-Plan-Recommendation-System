import { Check, X, Crown } from 'lucide-react';
import { currency, number } from '@/lib/format';
import { operatorName } from '@/components/recommendations/PlanCard';
import { computeVerdicts } from './AIVerdictBadges';

const ROWS = [
  { key: 'price', label: 'Price', render: (p) => currency(p.price), best: (p) => -p.price },
  { key: 'dataGB', label: 'Data', render: (p) => `${p.dataGB} GB`, best: (p) => p.dataGB },
  { key: 'callMinutes', label: 'Calling minutes', render: (p) => number(p.callMinutes), best: (p) => p.callMinutes },
  { key: 'sms', label: 'SMS', render: (p) => number(p.sms), best: (p) => p.sms },
  { key: 'roamingIncluded', label: 'Roaming', render: (p) => (p.roamingIncluded ? <Check className="h-4 w-4 text-green-400 mx-auto" /> : <X className="h-4 w-4 text-base-600 mx-auto" />) },
  { key: 'validityDays', label: 'Validity', render: (p) => `${p.validityDays} days` },
];

export function ComparisonTable({ entries }) {
  const verdicts = computeVerdicts(entries);
  const winnerByCategory = {
    data: verdicts.find((v) => v.key === 'data')?.planId,
    calling: verdicts.find((v) => v.key === 'calling')?.planId,
  };
  const hasMatch = entries.every((e) => typeof e.matchPercent === 'number');

  const bestPlanIdFor = (row) => {
    if (!row.best) return null;
    let best = null;
    let bestVal = -Infinity;
    entries.forEach((e) => {
      const v = row.best(e.plan);
      if (v > bestVal) {
        bestVal = v;
        best = e.plan._id;
      }
    });
    return best;
  };

  return (
    <div className="overflow-x-auto rounded-2xl border border-base-700 scrollbar-thin">
      <table className="w-full text-sm border-collapse min-w-[560px]">
        <thead>
          <tr className="bg-base-900/80">
            <th className="text-left text-xs uppercase tracking-wider text-base-400 font-semibold px-4 py-3 sticky left-0 bg-base-900/80">
              Plan
            </th>
            {entries.map((e) => (
              <th key={e.plan._id} className="px-4 py-3 text-center min-w-[160px]">
                <div className="flex flex-col items-center gap-1">
                  {e.rank === 1 && <Crown className="h-3.5 w-3.5 text-amber-400" />}
                  <span className="font-semibold text-base-50">{e.plan.planName}</span>
                  <span className="text-xs text-base-500">{operatorName(e.plan.operator)}</span>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {hasMatch && (
            <tr className="border-t border-base-700 bg-cyan-400/[0.04]">
              <td className="px-4 py-3 text-base-300 font-medium sticky left-0 bg-base-950/95">Match score</td>
              {entries.map((e) => (
                <td key={e.plan._id} className="px-4 py-3 text-center font-bold text-cyan-300">
                  {e.matchPercent}%
                </td>
              ))}
            </tr>
          )}
          {ROWS.map((row, i) => {
            const bestId = bestPlanIdFor(row) ?? winnerByCategory[row.key];
            return (
              <tr key={row.key} className={`border-t border-base-700 ${i % 2 === 0 ? '' : 'bg-base-900/30'}`}>
                <td className="px-4 py-3 text-base-300 font-medium sticky left-0 bg-base-950/95">{row.label}</td>
                {entries.map((e) => (
                  <td
                    key={e.plan._id}
                    className={`px-4 py-3 text-center ${e.plan._id === bestId && row.best ? 'text-green-300 font-semibold' : 'text-base-100'}`}
                  >
                    {row.render(e.plan)}
                  </td>
                ))}
              </tr>
            );
          })}
          <tr className="border-t border-base-700">
            <td className="px-4 py-3 text-base-300 font-medium align-top sticky left-0 bg-base-950/95">Key benefits</td>
            {entries.map((e) => (
              <td key={e.plan._id} className="px-4 py-3 align-top">
                <ul className="space-y-1 text-xs text-base-400">
                  {e.plan.benefits?.slice(0, 3).map((b) => (
                    <li key={b}>• {b}</li>
                  ))}
                </ul>
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
