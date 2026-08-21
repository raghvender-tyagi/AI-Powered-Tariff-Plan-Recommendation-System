import { clamp } from '@/lib/format';

const TONE_COLORS = {
  cyan: '#22d3ee',
  green: '#34d399',
  amber: '#fbbf24',
  rose: '#fb7185',
  blue: '#60a5fa',
};

export function Gauge({ value, max = 100, size = 128, strokeWidth = 10, tone = 'cyan', label, sublabel }) {
  const pct = clamp((value / max) * 100, 0, 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - pct / 100);
  const color = TONE_COLORS[tone] || TONE_COLORS.cyan;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--color-base-800)" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 900ms cubic-bezier(0.16,1,0.3,1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold text-base-50 font-display">{label ?? `${Math.round(pct)}%`}</span>
        {sublabel && <span className="text-[11px] text-base-400 mt-0.5">{sublabel}</span>}
      </div>
    </div>
  );
}

export function MiniMeter({ value, max = 100, tone = 'cyan' }) {
  const pct = clamp((value / max) * 100, 0, 100);
  const color = TONE_COLORS[tone] || TONE_COLORS.cyan;
  return (
    <svg viewBox="0 0 36 8" className="w-full h-2">
      <rect x="0" y="0" width="36" height="8" rx="4" fill="var(--color-base-800)" />
      <rect x="0" y="0" width={(pct / 100) * 36} height="8" rx="4" fill={color} />
    </svg>
  );
}
