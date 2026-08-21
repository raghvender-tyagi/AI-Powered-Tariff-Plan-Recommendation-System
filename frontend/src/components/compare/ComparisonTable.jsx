import { Crown } from 'lucide-react';
import { currency } from '@/lib/format';
import { categoryLabel } from '@/lib/planShape';

/**
 * Renders the comparison table exactly as the backend built it
 * (POST /api/plans/compare). Row definitions, "best value" winners and
 * verdicts are all computed server-side against the real catalogue.
 */
const formatValue = (row, value) => {
  if (value === null || value === undefined || value === '') return '—';
  if (row.unit === 'INR') return currency(value, { decimals: row.key === 'pricePerGb' ? 2 : 0 });
  if (row.unit) return `${value} ${row.unit}`;
  return String(value);
};

export function ComparisonTable({ comparison, matchScores = {} }) {
  if (!comparison) return null;

  const { plans, rows } = comparison;
  const hasMatch = plans.every((plan) => Number.isFinite(matchScores[plan._id]));

  return (
    <div className="overflow-x-auto rounded-2xl border border-base-700 scrollbar-thin">
      <table className="w-full text-sm border-collapse min-w-[560px]">
        <thead>
          <tr className="bg-base-900/80">
            <th className="text-left text-xs uppercase tracking-wider text-base-400 font-semibold px-4 py-3 sticky left-0 bg-base-900/80">
              Plan
            </th>
            {plans.map((plan) => (
              <th key={plan._id} className="px-4 py-3 text-center min-w-[160px]">
                <div className="flex flex-col items-center gap-1">
                  {matchScores[plan._id] === Math.max(...Object.values(matchScores)) &&
                    hasMatch && <Crown className="h-3.5 w-3.5 text-amber-400" />}
                  <span className="font-semibold text-base-50">{plan.planName}</span>
                  <span className="text-xs text-base-500">{categoryLabel(plan)}</span>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {hasMatch && (
            <tr className="border-t border-base-700 bg-cyan-400/[0.04]">
              <td className="px-4 py-3 text-base-300 font-medium sticky left-0 bg-base-950/95">
                Match score
              </td>
              {plans.map((plan) => (
                <td key={plan._id} className="px-4 py-3 text-center font-bold text-cyan-300">
                  {matchScores[plan._id]}%
                </td>
              ))}
            </tr>
          )}

          {rows.map((row, index) => (
            <tr key={row.key} className={`border-t border-base-700 ${index % 2 === 0 ? '' : 'bg-base-900/30'}`}>
              <td className="px-4 py-3 text-base-300 font-medium sticky left-0 bg-base-950/95">
                {row.label}
                {row.better && (
                  <span className="text-base-500 text-xs ml-1">({row.better} is better)</span>
                )}
              </td>
              {row.values.map((cell) => (
                <td
                  key={cell.planId}
                  className={`px-4 py-3 text-center ${
                    cell.planId === row.bestPlanId ? 'text-green-300 font-semibold' : 'text-base-100'
                  }`}
                >
                  {formatValue(row, cell.value)}
                </td>
              ))}
            </tr>
          ))}

          <tr className="border-t border-base-700">
            <td className="px-4 py-3 text-base-300 font-medium align-top sticky left-0 bg-base-950/95">
              Key benefits
            </td>
            {plans.map((plan) => (
              <td key={plan._id} className="px-4 py-3 align-top">
                <ul className="space-y-1 text-xs text-base-400">
                  {plan.benefits?.map((benefit) => (
                    <li key={benefit}>• {benefit}</li>
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
