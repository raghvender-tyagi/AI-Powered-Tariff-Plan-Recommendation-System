import { Card } from '@/components/ui/Primitives';
import { currency } from '@/lib/format';
import { demoOperators } from '@/api/mockData';

export function OperatorCompare({ plans, className }) {
  const rows = demoOperators.map((op) => {
    const opPlans = plans.filter((p) => p.operator === op.id);
    const avgPrice = opPlans.length ? opPlans.reduce((s, p) => s + p.price, 0) / opPlans.length : 0;
    const avgData = opPlans.length ? opPlans.reduce((s, p) => s + p.dataGB, 0) / opPlans.length : 0;
    const roamingCount = opPlans.filter((p) => p.roamingIncluded).length;
    return { ...op, count: opPlans.length, avgPrice, avgData, roamingCount };
  }).filter((r) => r.count > 0);

  const maxAvgPrice = Math.max(...rows.map((r) => r.avgPrice), 1);

  return (
    <Card className={`p-6 ${className || ''}`}>
      <p className="text-xs uppercase tracking-wider text-base-400 font-semibold mb-4">Operator comparison</p>
      <div className="space-y-4">
        {rows.map((op) => (
          <div key={op.id}>
            <div className="flex items-center justify-between text-sm mb-1.5">
              <span className="flex items-center gap-2 font-medium text-base-100">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: op.color }} />
                {op.name}
              </span>
              <span className="text-base-400 text-xs">
                {op.count} plans · avg {currency(Math.round(op.avgPrice))} · {Math.round(op.avgData)}GB avg
                {op.roamingCount > 0 ? ` · ${op.roamingCount} with roaming` : ''}
              </span>
            </div>
            <div className="h-2 rounded-full bg-base-800 overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${(op.avgPrice / maxAvgPrice) * 100}%`, backgroundColor: op.color }} />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
