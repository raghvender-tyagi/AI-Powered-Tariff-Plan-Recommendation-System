import {
  Wifi,
  PhoneCall,
  MessageSquare,
  Globe2,
  Plane,
  Calendar,
  CreditCard,
  MapPin,
  Signal,
  MonitorPlay,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';
import { Card, Badge, ProgressBar } from '@/components/ui/Primitives';
import { Gauge } from '@/components/ui/Gauge';
import { currency, number, clamp } from '@/lib/format';
import { dailyData, monthlyData, coverageLabel } from '@/lib/planShape';

// Keys and units match GET /api/customers/:id -> usage
const USAGE_CARDS = [
  { key: 'dataGB', label: 'Data usage', icon: Wifi, unit: 'GB', max: 60, tone: 'cyan', decimals: 1 },
  { key: 'streamingHours', label: 'Streaming', icon: MonitorPlay, unit: 'hrs', max: 150, tone: 'rose', decimals: 1 },
  { key: 'callMinutes', label: 'Voice minutes', icon: PhoneCall, unit: 'min', max: 600, tone: 'green' },
  { key: 'smsCount', label: 'SMS sent', icon: MessageSquare, unit: 'msgs', max: 200, tone: 'blue' },
  { key: 'roamingDataGB', label: 'Roaming data', icon: Globe2, unit: 'GB', max: 12, tone: 'amber', decimals: 1 },
  { key: 'internationalMinutes', label: 'International', icon: Plane, unit: 'min', max: 60, tone: 'rose', decimals: 1 },
];

export function UsageGaugeGrid({ usage }) {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {USAGE_CARDS.map((card) => (
        <Card key={card.key} className="p-5 flex flex-col items-center text-center">
          <div className="flex items-center gap-1.5 text-base-400 mb-3">
            <card.icon className="h-3.5 w-3.5" />
            <span className="text-xs font-medium">{card.label}</span>
          </div>
          <Gauge
            value={usage?.[card.key] ?? 0}
            max={card.max}
            size={100}
            strokeWidth={8}
            tone={card.tone}
            label={`${number(usage?.[card.key], card.decimals ?? 0)}`}
            sublabel={card.unit}
          />
        </Card>
      ))}
    </div>
  );
}

export function ContractInfoCard({ customer, className }) {
  return (
    <Card className={`p-6 ${className || ''}`}>
      <p className="text-xs uppercase tracking-wider text-base-400 font-semibold mb-4">Account information</p>
      <div className="space-y-4">
        <InfoRow icon={CreditCard} label="Account type" value={customer.contractType || '—'} />
        <InfoRow
          icon={Calendar}
          label="Customer tenure"
          value={customer.tenureMonths ? `${Math.round(customer.tenureMonths)} months` : '—'}
        />
        <InfoRow icon={MapPin} label="Circle" value={customer.city || '—'} />
        <InfoRow
          icon={Signal}
          label="Network"
          value={[customer.operator, customer.networkType].filter(Boolean).join(' · ') || '—'}
        />
        <InfoRow icon={CreditCard} label="Customer ID" value={customer.customerId ?? customer._id} />
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
      <div className="min-w-0">
        <p className="text-xs text-base-400">{label}</p>
        <p className="text-sm text-base-100 font-medium truncate">{value}</p>
      </div>
    </div>
  );
}

/**
 * Shows how this customer's engineered ratios compare with their segment's
 * averages. Both sides come from the API — nothing is estimated here.
 */
export function UsageRatioCard({ usage, cluster, className }) {
  if (!cluster?.averages) return null;

  const rows = [
    {
      label: 'Data vs segment',
      value: usage?.dataGB ?? 0,
      average: cluster.averages.monthly_data_gb,
      unit: 'GB',
    },
    {
      label: 'Streaming vs segment',
      value: usage?.streamingHours ?? 0,
      average: cluster.averages.streaming_hours,
      unit: 'hrs',
    },
    {
      label: 'Voice vs segment',
      value: usage?.callMinutes ?? 0,
      average: cluster.averages.monthly_voice_minutes,
      unit: 'min',
    },
    {
      label: 'Recharge vs segment',
      value: usage?.monthlyRecharge ?? 0,
      average: cluster.averages.monthly_recharge,
      unit: '₹',
    },
  ];

  return (
    <Card className={`p-6 ${className || ''}`}>
      <p className="text-xs uppercase tracking-wider text-base-400 font-semibold mb-4">
        You vs your segment
      </p>
      <div className="space-y-4">
        {rows.map((row) => {
          const pct = row.average > 0 ? clamp((row.value / row.average) * 100, 0, 200) : 0;
          const tone = pct > 130 ? 'rose' : pct >= 70 ? 'green' : 'amber';
          return (
            <div key={row.label}>
              <div className="flex justify-between text-xs text-base-400 mb-1">
                <span>{row.label}</span>
                <span>
                  {number(row.value, 1)} vs {number(row.average, 1)} {row.unit} ({Math.round(pct)}%)
                </span>
              </div>
              <ProgressBar value={Math.min(100, pct / 2)} tone={tone} />
            </div>
          );
        })}
      </div>
      <p className="text-xs text-base-500 mt-4">
        Segment averages come from cluster_profiles.json for {cluster.personaName} (
        {number(cluster.customerCount)} customers).
      </p>
    </Card>
  );
}

function utilizationTone(pct) {
  if (pct > 100) return { tone: 'rose', statusLabel: 'Over allowance' };
  if (pct >= 60) return { tone: 'green', statusLabel: 'Well utilised' };
  if (pct >= 30) return { tone: 'amber', statusLabel: 'Under-utilised' };
  return { tone: 'rose', statusLabel: 'Barely used' };
}

export function CurrentPlanHealth({ usage, plan, className }) {
  if (!plan) return null;

  const used = Number(usage?.dataGB ?? 0);
  const allowance = Number(plan.monthlyDataGb ?? 0);
  const pct = allowance > 0 ? clamp((used / allowance) * 100, 0, 160) : 0;
  const { tone, statusLabel } = utilizationTone(pct);

  const verdict =
    pct > 100
      ? { label: 'Running over allowance', tone: 'rose', icon: AlertTriangle }
      : pct >= 60
        ? { label: 'Great fit for your usage', tone: 'green', icon: CheckCircle2 }
        : { label: 'Paying for unused capacity', tone: 'amber', icon: TrendingUp };

  return (
    <Card className={`p-6 ${className || ''}`}>
      <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
        <p className="text-xs uppercase tracking-wider text-base-400 font-semibold">Current plan health</p>
        <Badge tone={verdict.tone} icon={verdict.icon}>
          {verdict.label}
        </Badge>
      </div>

      <div>
        <div className="flex justify-between text-xs text-base-400 mb-1">
          <span>
            Monthly data <span className="text-base-500">· {statusLabel}</span>
          </span>
          <span>
            {number(used, 1)} / {number(allowance)} GB used ({Math.round(pct)}%)
          </span>
        </div>
        <ProgressBar value={Math.min(100, pct)} tone={tone} />
      </div>

      <div className="mt-5 pt-4 border-t border-base-700 grid sm:grid-cols-3 gap-4 text-sm">
        <Fact label="Allowance" value={`${dailyData(plan)} / day (${monthlyData(plan)} a month)`} />
        <Fact label="Covers" value={coverageLabel(plan)} />
        <Fact
          label="Value for money"
          value={plan.pricePerGb ? `${currency(plan.pricePerGb, { decimals: 2 })} per GB` : '—'}
        />
      </div>
    </Card>
  );
}

function Fact({ label, value }) {
  return (
    <div>
      <p className="text-xs text-base-400">{label}</p>
      <p className="text-base-100 font-medium">{value}</p>
    </div>
  );
}
