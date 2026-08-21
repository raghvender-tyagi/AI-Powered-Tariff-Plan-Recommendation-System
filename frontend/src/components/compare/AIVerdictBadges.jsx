import { Trophy, PiggyBank, Wifi, Tag, CalendarClock } from 'lucide-react';
import { Card, Badge } from '@/components/ui/Primitives';

const VERDICT_META = {
  overall: { icon: Trophy, tone: 'cyan' },
  value: { icon: PiggyBank, tone: 'green' },
  data: { icon: Wifi, tone: 'blue' },
  price: { icon: Tag, tone: 'amber' },
  validity: { icon: CalendarClock, tone: 'rose' },
};

/**
 * Verdicts are computed by the backend against the real catalogue; the
 * "best overall match" verdict uses the recommendation engine's own score.
 */
export function AIVerdictBadges({ verdicts }) {
  if (!verdicts || verdicts.length === 0) return null;

  return (
    <Card className="p-5">
      <p className="text-xs uppercase tracking-wider text-base-400 font-semibold mb-3">AI verdict</p>
      <div className="flex flex-wrap gap-2.5">
        {verdicts.map((verdict) => {
          const meta = VERDICT_META[verdict.key] ?? { icon: Tag, tone: 'neutral' };
          return (
            <Badge key={verdict.key} tone={meta.tone} icon={meta.icon} className="py-1.5 px-3">
              {verdict.label}: <span className="font-semibold ml-1">{verdict.planName}</span>
            </Badge>
          );
        })}
      </div>
      <ul className="mt-3 space-y-1">
        {verdicts.map((verdict) => (
          <li key={`${verdict.key}-basis`} className="text-xs text-base-500">
            <span className="text-base-400">{verdict.label}:</span> {verdict.basis}
          </li>
        ))}
      </ul>
    </Card>
  );
}
