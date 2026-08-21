import { Card } from '@/components/ui/Primitives';
import { currency } from '@/lib/format';

/**
 * The catalogue is a single-operator portfolio of 25 plans, so the
 * meaningful comparison is across its five plan categories. Every figure is
 * aggregated from the plans the API returned.
 */
export function CategoryCompare({ plans, className }) {
  if (!plans || plans.length === 0) return null;

  const byCategory = new Map();

  for (const plan of plans) {
    if (!byCategory.has(plan.category)) {
      byCategory.set(plan.category, {
        id: plan.category,
        name: plan.categoryLabel ?? plan.category,
        color: plan.categoryColor ?? '#94a3b8',
        plans: [],
      });
    }
    byCategory.get(plan.category).plans.push(plan);
  }

  const rows = [...byCategory.values()].map((group) => {
    const count = group.plans.length;
    const avgPrice = group.plans.reduce((sum, plan) => sum + plan.price, 0) / count;
    const avgDailyData = group.plans.reduce((sum, plan) => sum + plan.dailyDataGb, 0) / count;
    const minPrice = Math.min(...group.plans.map((plan) => plan.price));
    const maxPrice = Math.max(...group.plans.map((plan) => plan.price));
    return { ...group, count, avgPrice, avgDailyData, minPrice, maxPrice };
  });

  const maxAvgPrice = Math.max(...rows.map((row) => row.avgPrice), 1);

  return (
    <Card className={`p-6 ${className || ''}`}>
      <p className="text-xs uppercase tracking-wider text-base-400 font-semibold mb-4">
        Category comparison ({plans.length} plans)
      </p>
      <div className="space-y-4">
        {rows.map((row) => (
          <div key={row.id}>
            <div className="flex items-center justify-between text-sm mb-1.5 gap-3 flex-wrap">
              <span className="flex items-center gap-2 font-medium text-base-100">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: row.color }} />
                {row.name}
              </span>
              <span className="text-base-400 text-xs">
                {row.count} plans · {currency(row.minPrice)}–{currency(row.maxPrice)} · avg{' '}
                {currency(Math.round(row.avgPrice))} · {row.avgDailyData.toFixed(1)} GB/day avg
              </span>
            </div>
            <div className="h-2 rounded-full bg-base-800 overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{ width: `${(row.avgPrice / maxAvgPrice) * 100}%`, backgroundColor: row.color }}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

// Kept as an alias so existing imports keep working.
export const OperatorCompare = CategoryCompare;
