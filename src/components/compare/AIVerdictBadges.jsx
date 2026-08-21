import { Trophy, PiggyBank, Wifi, PhoneCall } from 'lucide-react';
import { Card, Badge } from '@/components/ui/Primitives';

export function computeVerdicts(entries) {
  if (!entries || entries.length < 2) return [];
  const verdicts = [];

  const allHaveMatch = entries.every((e) => typeof e.matchPercent === 'number');
  if (allHaveMatch) {
    const best = [...entries].sort((a, b) => b.matchPercent - a.matchPercent)[0];
    verdicts.push({ key: 'overall', label: 'Best Overall', icon: Trophy, tone: 'cyan', planId: best.plan._id, planName: best.plan.planName });
  }

  const withValue = entries.filter((e) => e.plan.dataGB > 0);
  if (withValue.length > 1) {
    const best = [...withValue].sort((a, b) => a.plan.price / a.plan.dataGB - b.plan.price / b.plan.dataGB)[0];
    verdicts.push({ key: 'value', label: 'Best Value', icon: PiggyBank, tone: 'green', planId: best.plan._id, planName: best.plan.planName });
  }

  const dataSpread = new Set(entries.map((e) => e.plan.dataGB)).size > 1;
  if (dataSpread) {
    const best = [...entries].sort((a, b) => b.plan.dataGB - a.plan.dataGB)[0];
    verdicts.push({ key: 'data', label: 'Best for Heavy Data', icon: Wifi, tone: 'blue', planId: best.plan._id, planName: best.plan.planName });
  }

  const callSpread = new Set(entries.map((e) => e.plan.callMinutes)).size > 1;
  if (callSpread) {
    const best = [...entries].sort((a, b) => b.plan.callMinutes - a.plan.callMinutes)[0];
    verdicts.push({ key: 'calling', label: 'Best for Calling', icon: PhoneCall, tone: 'amber', planId: best.plan._id, planName: best.plan.planName });
  }

  return verdicts;
}

export function AIVerdictBadges({ entries }) {
  const verdicts = computeVerdicts(entries);
  if (verdicts.length === 0) return null;

  return (
    <Card className="p-5">
      <p className="text-xs uppercase tracking-wider text-base-400 font-semibold mb-3">AI verdict</p>
      <div className="flex flex-wrap gap-2.5">
        {verdicts.map((v) => (
          <Badge key={v.key} tone={v.tone} icon={v.icon} className="py-1.5 px-3">
            {v.label}: <span className="font-semibold ml-1">{v.planName}</span>
          </Badge>
        ))}
      </div>
    </Card>
  );
}
