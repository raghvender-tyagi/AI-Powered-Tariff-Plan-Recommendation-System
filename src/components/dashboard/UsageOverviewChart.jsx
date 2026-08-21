import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import { CATEGORICAL, CHART_CHROME } from '@/lib/chartPalette';

function buildData(usage) {
  return [
    { name: 'Data', value: usage.dataGB, unit: 'GB', target: 40 },
    { name: 'Calls', value: usage.avgCallMin, unit: 'min', target: 800 },
    { name: 'SMS', value: usage.smsCount, unit: 'msgs', target: 150 },
    { name: 'Roaming', value: usage.roamingUsage, unit: 'days', target: 10 },
    { name: 'Intl.', value: usage.internationalUsage, unit: 'calls', target: 10 },
  ];
}

function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-lg border border-base-600 bg-base-900 px-3 py-2 shadow-xl text-xs">
      <p className="font-semibold text-base-100">{p.name}</p>
      <p className="text-base-300">
        {p.value} {p.unit} this month
      </p>
    </div>
  );
}

export function UsageOverviewChart({ usage, height = 260 }) {
  const data = buildData(usage);
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }} barCategoryGap="28%">
        <CartesianGrid vertical={false} stroke={CHART_CHROME.grid} strokeDasharray="3 5" />
        <XAxis dataKey="name" tick={{ fill: CHART_CHROME.textSecondary, fontSize: 12 }} axisLine={{ stroke: CHART_CHROME.grid }} tickLine={false} />
        <YAxis tick={{ fill: CHART_CHROME.textSecondary, fontSize: 11 }} axisLine={false} tickLine={false} width={34} />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(139,147,184,0.06)' }} />
        <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={46}>
          {data.map((entry, i) => (
            <Cell key={entry.name} fill={CATEGORICAL[i % CATEGORICAL.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
