import { Wifi, PhoneCall, Wallet, Globe2 } from 'lucide-react';
import { Card } from '@/components/ui/Primitives';
import { currency, number } from '@/lib/format';

function SliderField({ icon: Icon, label, value, onChange, min, max, step, format }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="flex items-center gap-2 text-sm text-base-300">
          <Icon className="h-4 w-4 text-cyan-300" /> {label}
        </span>
        <span className="text-sm font-semibold text-base-50">{format(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-cyan-400 h-2"
        aria-label={label}
      />
    </div>
  );
}

export function SimulatorSliders({ profile, onChange, className }) {
  if (!profile) return null;

  return (
    <Card className={`p-6 space-y-6 ${className || ''}`}>
      <p className="text-xs uppercase tracking-wider text-base-400 font-semibold">Adjust your usage</p>
      <SliderField
        icon={Wifi}
        label="Data usage / month"
        value={profile.dataNeedGB}
        onChange={(v) => onChange({ ...profile, dataNeedGB: v })}
        min={1}
        max={80}
        step={1}
        format={(v) => `${v} GB`}
      />
      <SliderField
        icon={PhoneCall}
        label="Calling minutes / month"
        value={profile.callNeedMin}
        onChange={(v) => onChange({ ...profile, callNeedMin: v })}
        min={0}
        max={2500}
        step={25}
        format={(v) => `${number(v)} min`}
      />
      <SliderField
        icon={Wallet}
        label="Monthly budget"
        value={profile.budget}
        onChange={(v) => onChange({ ...profile, budget: v })}
        min={99}
        max={1999}
        step={10}
        format={(v) => currency(v)}
      />
      <div>
        <span className="flex items-center gap-2 text-sm text-base-300 mb-2">
          <Globe2 className="h-4 w-4 text-cyan-300" /> Roaming needed
        </span>
        <div className="flex gap-2">
          {[true, false].map((v) => (
            <button
              key={String(v)}
              onClick={() => onChange({ ...profile, roamingRequired: v })}
              className={`flex-1 rounded-lg border px-3 py-2 text-sm transition-colors ${
                profile.roamingRequired === v
                  ? 'border-cyan-400/60 bg-cyan-400/10 text-cyan-300'
                  : 'border-base-700 text-base-400 hover:border-base-500'
              }`}
            >
              {v ? 'Yes' : 'No'}
            </button>
          ))}
        </div>
      </div>
    </Card>
  );
}
