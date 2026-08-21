import { Wifi, PhoneCall, MessageSquare, Globe2, Plane, Calendar, CreditCard, ShieldCheck, AlertTriangle, CheckCircle2, TrendingUp } from 'lucide-react';
import { Card, Badge, ProgressBar } from '@/components/ui/Primitives';
import { Gauge } from '@/components/ui/Gauge';
import { currency, number, clamp, formatDate } from '@/lib/format';

const USAGE_CARDS = [
  { key: 'dataGB', label: 'Data usage', icon: Wifi, unit: 'GB', max: 60, tone: 'cyan' },
  { key: 'avgCallMin', label: 'Calling minutes', icon: PhoneCall, unit: 'min', max: 1200, tone: 'green' },
  { key: 'smsCount', label: 'SMS sent', icon: MessageSquare, unit: 'msgs', max: 200, tone: 'blue' },
  { key: 'roamingUsage', label: 'Roaming days', icon: Globe2, unit: 'days', max: 20, tone: 'amber' },
  { key: 'internationalUsage', label: 'International calls', icon: Plane, unit: 'calls', max: 15, tone: 'rose' },
];

export function UsageGaugeGrid({ usage }) {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {USAGE_CARDS.map((c) => (
        <Card key={c.key} className="p-5 flex flex-col items-center text-center">
          <div className="flex items-center gap-1.5 text-base-400 mb-3">
            <c.icon className="h-3.5 w-3.5" />
            <span className="text-xs font-medium">{c.label}</span>
          </div>
          <Gauge value={usage[c.key]} max={c.max} size={100} strokeWidth={8} tone={c.tone} label={`${number(usage[c.key])}`} sublabel={c.unit} />
        </Card>
      ))}
    </div>
  );
}

export function ContractInfoCard({ customer, className }) {
  return (
    <Card className={`p-6 ${className || ''}`}>
      <p className="text-xs uppercase tracking-wider text-base-400 font-semibold mb-4">Contract information</p>
      <div className="space-y-4">
        <InfoRow icon={CreditCard} label="Contract type" value={customer.contractType === 'postpaid' ? 'Postpaid' : 'Prepaid'} />
        <InfoRow icon={Calendar} label="Customer tenure" value={`${customer.tenureMonths} months`} />
        <InfoRow icon={ShieldCheck} label="Customer since" value={formatDate(customer.createdAt)} />
        <InfoRow icon={PhoneCall} label="Registered number" value={customer.phone} />
      </div>
    </Card>
  );
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3">
      <span className="h-9 w-9 rounded-lg bg-base-800 flex items-center justify-center text-base-300 shrink-0">
        <Icon className="h-4 w-4" />
      </span>
      <div>
        <p className="text-xs text-base-400">{label}</p>
        <p className="text-sm text-base-100 font-medium">{value}</p>
      </div>
    </div>
  );
}

export function DayPartSplit({ split, className }) {
  const parts = [
    { key: 'day', label: 'Day', tone: 'cyan' },
    { key: 'evening', label: 'Evening', tone: 'blue' },
    { key: 'night', label: 'Night', tone: 'amber' },
  ];
  return (
    <Card className={`p-6 ${className || ''}`}>
      <p className="text-xs uppercase tracking-wider text-base-400 font-semibold mb-4">Calling pattern</p>
      <div className="flex h-3 rounded-full overflow-hidden mb-4">
        {parts.map((p) => (
          <div
            key={p.key}
            style={{ width: `${(split[p.key] ?? 0) * 100}%` }}
            className={
              p.tone === 'cyan' ? 'bg-cyan-400' : p.tone === 'blue' ? 'bg-blue-400' : 'bg-amber-400'
            }
          />
        ))}
      </div>
      <div className="flex justify-between text-xs">
        {parts.map((p) => (
          <div key={p.key} className="flex items-center gap-1.5 text-base-300">
            <span className={`h-2 w-2 rounded-full ${p.tone === 'cyan' ? 'bg-cyan-400' : p.tone === 'blue' ? 'bg-blue-400' : 'bg-amber-400'}`} />
            {p.label} · {Math.round((split[p.key] ?? 0) * 100)}%
          </div>
        ))}
      </div>
    </Card>
  );
}

function utilizationTone(pct) {
  if (pct > 100) return { tone: 'rose', statusLabel: 'Over allowance' };
  if (pct >= 60) return { tone: 'green', statusLabel: 'Well utilized' };
  if (pct >= 30) return { tone: 'amber', statusLabel: 'Under-utilized' };
  return { tone: 'rose', statusLabel: 'Barely used' };
}

export function CurrentPlanHealth({ usage, plan, className }) {
  if (!plan) return null;
  const dims = [
    { key: 'dataGB', planKey: 'dataGB', label: 'Data' },
    { key: 'avgCallMin', planKey: 'callMinutes', label: 'Calling' },
    { key: 'smsCount', planKey: 'sms', label: 'SMS' },
  ];
  const rows = dims.map((d) => {
    const used = usage[d.key] ?? 0;
    const allowance = plan[d.planKey] ?? 0;
    const pct = allowance > 0 ? clamp((used / allowance) * 100, 0, 160) : 0;
    return { ...d, used, allowance, pct, ...utilizationTone(pct) };
  });

  const unused = rows.filter((r) => r.pct < 35);
  const overAllowance = rows.some((r) => r.pct > 100);
  const wellFit = rows.every((r) => r.pct >= 45 && r.pct <= 100);

  let verdict = { label: 'Reasonable fit', tone: 'amber', icon: AlertTriangle };
  if (overAllowance) verdict = { label: 'Running over allowance', tone: 'rose', icon: AlertTriangle };
  else if (wellFit) verdict = { label: 'Great fit for your usage', tone: 'green', icon: CheckCircle2 };
  else if (unused.length >= 2) verdict = { label: 'Paying for unused capacity', tone: 'amber', icon: TrendingUp };

  return (
    <Card className={`p-6 ${className || ''}`}>
      <div className="flex items-center justify-between mb-5">
        <p className="text-xs uppercase tracking-wider text-base-400 font-semibold">Current plan health</p>
        <Badge tone={verdict.tone} icon={verdict.icon}>
          {verdict.label}
        </Badge>
      </div>
      <div className="space-y-4">
        {rows.map((r) => (
          <div key={r.key}>
            <div className="flex justify-between text-xs text-base-400 mb-1">
              <span>
                {r.label} <span className="text-base-500">· {r.statusLabel}</span>
              </span>
              <span>
                {number(r.used)} / {number(r.allowance)} used ({Math.round(r.pct)}%)
              </span>
            </div>
            <ProgressBar value={Math.min(100, r.pct)} tone={r.tone} />
          </div>
        ))}
      </div>
      {unused.length > 0 && (
        <div className="mt-5 pt-4 border-t border-base-700">
          <p className="text-xs text-base-400 mb-1">Possible improvement areas</p>
          <p className="text-sm text-base-200">
            You're using well under your {unused.map((u) => u.label.toLowerCase()).join(' and ')} allowance
            {unused.length > 1 ? 's' : ''} — a lighter or cheaper plan could offer better value. See your AI
            recommendations for a better match.
          </p>
        </div>
      )}
      <div className="mt-4 flex items-center justify-between text-sm">
        <span className="text-base-400">Value for money</span>
        <span className="font-medium text-base-100">{currency(plan.price / Math.max(1, plan.dataGB))} per GB</span>
      </div>
    </Card>
  );
}
