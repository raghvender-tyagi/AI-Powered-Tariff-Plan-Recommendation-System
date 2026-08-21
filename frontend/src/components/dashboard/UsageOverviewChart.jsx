import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import { CATEGORICAL, CHART_CHROME } from '@/lib/chartPalette';

/**
 * Charts the engineered usage features the ML model actually consumes.
 * When the cluster's base-wide averages are available, each bar is indexed
 * against them so different units share one axis.
 */
const AVERAGE_KEYS = {
  dataGB: 'monthly_data_gb',
  streamingHours: 'streaming_hours',
  callMinutes: 'monthly_voice_minutes',
  smsCount: 'monthly_sms',
  roamingDataGB: 'roaming_data_gb',
  internationalMinutes: 'international_minutes',
};

const SERIES = [
  { key: 'dataGB', name: 'Data', unit: 'GB', decimals: 1 },
  { key: 'streamingHours', name: 'Streaming', unit: 'hrs', decimals: 1 },
  { key: 'callMinutes', name: 'Voice', unit: 'min', decimals: 0 },
  { key: 'smsCount', name: 'SMS', unit: 'msgs', decimals: 0 },
  { key: 'roamingDataGB', name: 'Roaming', unit: 'GB', decimals: 1 },
  { key: 'internationalMinutes', name: 'Intl.', unit: 'min', decimals: 1 },
];

function buildData(usage, averages) {
  return SERIES.map((series) => {
    const value = Number(usage?.[series.key] ?? 0);
    const average = averages ? Number(averages[AVERAGE_KEYS[series.key]] ?? 0) : 0;

    return {
      name: series.name,
      value: Number(value.toFixed(series.decimals)),
      unit: series.unit,
      average: average ? Number(average.toFixed(series.decimals)) : null,
      indexed: average > 0 ? Math.round((value / average) * 100) : 0,
    };
  });
}

function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;

  return (
    <div className="rounded-lg border border-base-600 bg-base-900 px-3 py-2 shadow-xl text-xs">
      <p className="font-semibold text-base-100">{point.name}</p>
      <p className="text-base-300">
        {point.value} {point.unit} this cycle
      </p>
      {point.average !== null && (
        <p className="text-base-400 mt-0.5">
          Segment average {point.average} {point.unit} · you are at {point.indexed}%
        </p>
      )}
    </div>
  );
}

export function UsageOverviewChart({ usage, averages, height = 260 }) {
  const data = buildData(usage, averages);
  const useIndexed = data.some((point) => point.indexed > 0);

  return (
    <>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }} barCategoryGap="28%">
          <CartesianGrid vertical={false} stroke={CHART_CHROME.grid} strokeDasharray="3 5" />
          <XAxis
            dataKey="name"
            tick={{ fill: CHART_CHROME.textSecondary, fontSize: 12 }}
            axisLine={{ stroke: CHART_CHROME.grid }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: CHART_CHROME.textSecondary, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={38}
            unit={useIndexed ? '%' : ''}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(139,147,184,0.06)' }} />
          <Bar dataKey={useIndexed ? 'indexed' : 'value'} radius={[6, 6, 0, 0]} maxBarSize={46}>
            {data.map((entry, index) => (
              <Cell key={entry.name} fill={CATEGORICAL[index % CATEGORICAL.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      {useIndexed && (
        <p className="text-xs text-base-500 mt-2">
          Each bar shows your usage against your segment's average (100% = the segment average).
        </p>
      )}
    </>
  );
}
