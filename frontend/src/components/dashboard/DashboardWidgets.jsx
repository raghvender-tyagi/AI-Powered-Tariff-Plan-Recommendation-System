import { Link } from 'react-router-dom';
import { Wifi, PhoneCall, MessageSquare, Globe2, Wallet, ArrowRight, Clock, Sparkles, PiggyBank } from 'lucide-react';
import { Card, Badge, Button } from '@/components/ui/Primitives';
import { MiniMeter } from '@/components/ui/Gauge';
import { currency, number, timeAgo } from '@/lib/format';
import { operatorName } from '@/components/recommendations/PlanCard';

export function GreetingHeader({ name, persona, tenureMonths }) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
      <div>
        <p className="text-sm text-base-400">
          {greeting}, <span className="text-base-100 font-medium">{name}</span>
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold text-base-50 mt-1">Your Telecom Twin overview</h1>
        {persona && (
          <p className="text-sm text-base-400 mt-1">
            You're a <span className="text-cyan-300 font-medium">{persona}</span>
            {tenureMonths ? ` · ${tenureMonths} months with us` : ''}
          </p>
        )}
      </div>
      <Button as={Link} to="/app/simulator" variant="secondary" size="sm" iconRight={ArrowRight}>
        Try the What-If Simulator
      </Button>
    </div>
  );
}

const TWIN_STATS = [
  { key: 'dataGB', label: 'Data used', icon: Wifi, unit: 'GB', tone: 'cyan', max: 50 },
  { key: 'avgCallMin', label: 'Calling', icon: PhoneCall, unit: 'min', tone: 'green', max: 1000 },
  { key: 'smsCount', label: 'SMS sent', icon: MessageSquare, unit: 'msgs', tone: 'blue', max: 200 },
  { key: 'roamingUsage', label: 'Roaming', icon: Globe2, unit: 'days', tone: 'amber', max: 15 },
];

export function TwinSummaryGrid({ usage, monthlySpend }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
      {TWIN_STATS.map((s) => (
        <Card key={s.key} className="p-4">
          <div className="flex items-center gap-2 text-base-400 mb-2">
            <s.icon className="h-4 w-4" aria-hidden="true" />
            <span className="text-xs font-medium">{s.label}</span>
          </div>
          <p className="text-xl font-bold text-base-50 font-display">
            {number(usage[s.key])} <span className="text-xs text-base-500 font-normal">{s.unit}</span>
          </p>
          <div className="mt-2">
            <MiniMeter value={usage[s.key]} max={s.max} tone={s.tone} />
          </div>
        </Card>
      ))}
      <Card className="p-4">
        <div className="flex items-center gap-2 text-base-400 mb-2">
          <Wallet className="h-4 w-4" aria-hidden="true" />
          <span className="text-xs font-medium">Monthly spend</span>
        </div>
        <p className="text-xl font-bold text-base-50 font-display">{currency(monthlySpend)}</p>
        <div className="mt-2">
          <MiniMeter value={monthlySpend} max={1500} tone="rose" />
        </div>
      </Card>
    </div>
  );
}

export function CurrentPlanCard({ plan, className }) {
  if (!plan) {
    return (
      <Card className={`p-6 ${className || ''}`}>
        <p className="text-sm text-base-400">No active plan on file yet.</p>
      </Card>
    );
  }
  return (
    <Card className={`p-6 ${className || ''}`}>
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs uppercase tracking-wider text-base-400 font-semibold">Current plan</p>
        <Badge tone="neutral">{operatorName(plan.operator)}</Badge>
      </div>
      <h3 className="text-lg font-bold text-base-50">{plan.planName}</h3>
      <p className="text-2xl font-extrabold font-display text-base-50 mt-1">
        {currency(plan.price)} <span className="text-sm font-normal text-base-400">/ {plan.validityDays} days</span>
      </p>
      <div className="grid grid-cols-3 gap-2 mt-4 text-center">
        <div className="rounded-lg bg-base-800/60 py-2">
          <p className="text-sm font-semibold text-base-100">{plan.dataGB}GB</p>
          <p className="text-[10px] text-base-500">Data</p>
        </div>
        <div className="rounded-lg bg-base-800/60 py-2">
          <p className="text-sm font-semibold text-base-100">{number(plan.callMinutes)}</p>
          <p className="text-[10px] text-base-500">Mins</p>
        </div>
        <div className="rounded-lg bg-base-800/60 py-2">
          <p className="text-sm font-semibold text-base-100">{number(plan.sms)}</p>
          <p className="text-[10px] text-base-500">SMS</p>
        </div>
      </div>
    </Card>
  );
}

export function SavingsCard({ currentPrice, recommendedPrice, className }) {
  const monthly = Math.max(0, currentPrice - recommendedPrice);
  const yearly = monthly * 12;
  const better = recommendedPrice < currentPrice;
  return (
    <Card className={`p-6 ${className || ''}`}>
      <div className="flex items-center gap-2 mb-4">
        <PiggyBank className="h-4 w-4 text-green-300" />
        <p className="text-xs uppercase tracking-wider text-base-400 font-semibold">Potential savings</p>
      </div>
      {better ? (
        <>
          <p className="text-3xl font-extrabold font-display text-green-300">{currency(monthly)}</p>
          <p className="text-sm text-base-400 mt-1">per month · {currency(yearly)} per year</p>
          <div className="mt-4 space-y-2">
            <BarRow label="Current plan" value={currentPrice} max={Math.max(currentPrice, recommendedPrice)} tone="neutral" />
            <BarRow label="Top recommendation" value={recommendedPrice} max={Math.max(currentPrice, recommendedPrice)} tone="green" />
          </div>
        </>
      ) : (
        <p className="text-sm text-base-400">Your current plan already matches or beats your top recommendation on price.</p>
      )}
    </Card>
  );
}

function BarRow({ label, value, max, tone }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div>
      <div className="flex justify-between text-xs text-base-400 mb-1">
        <span>{label}</span>
        <span>{currency(value)}</span>
      </div>
      <div className="h-2 rounded-full bg-base-800 overflow-hidden">
        <div
          className={`h-full rounded-full ${tone === 'green' ? 'bg-gradient-to-r from-green-400 to-cyan-400' : 'bg-base-500'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function ActivityFeed({ history, plans, className }) {
  if (!history || history.length === 0) {
    return (
      <Card className={`p-6 ${className || ''}`}>
        <p className="text-sm text-base-400">No recommendation activity yet.</p>
      </Card>
    );
  }
  return (
    <Card className={`p-6 ${className || ''}`}>
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs uppercase tracking-wider text-base-400 font-semibold">Recent activity</p>
        <Button as={Link} to="/app/history" variant="ghost" size="sm" iconRight={ArrowRight}>
          View all
        </Button>
      </div>
      <ul className="space-y-4">
        {history.slice(0, 3).map((item) => {
          const top = item.recommendedPlans?.[0];
          const plan = plans?.find((p) => p._id === top?.planId);
          return (
            <li key={item._id} className="flex items-start gap-3">
              <span className="h-8 w-8 rounded-lg bg-cyan-400/10 text-cyan-300 flex items-center justify-center shrink-0">
                <Sparkles className="h-4 w-4" />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-base-100 truncate">
                  Matched to <span className="font-medium">{plan?.planName ?? 'a plan'}</span>
                </p>
                <p className="text-xs text-base-500 flex items-center gap-1 mt-0.5">
                  <Clock className="h-3 w-3" /> {timeAgo(item.generatedAt)} · {Math.round((top?.score ?? 0) * 100)}% match
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
