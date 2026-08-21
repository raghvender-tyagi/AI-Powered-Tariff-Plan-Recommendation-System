import { Sparkles, Activity, Wallet, Fingerprint, Tag } from 'lucide-react';
import { Drawer } from '@/components/ui/Drawer';
import { Badge, Divider } from '@/components/ui/Primitives';
import { MatchScoreBreakdown } from './MatchScoreBreakdown';
import { currency } from '@/lib/format';
import { categoryLabel, dailyData, monthlyData, allowanceLabel, coverageLabel } from '@/lib/planShape';

const REASON_ICONS = { usage: Activity, budget: Wallet, persona: Fingerprint };

/**
 * Explainable recommendation panel. Every line below comes from the
 * backend's explanation payload, which is derived from the recommendation
 * engine's own score components.
 */
export function WhyThisPlanDrawer({ entry, open, onClose }) {
  if (!entry) return null;

  const { plan, matchPercent, breakdown, explanation, explanationDetail } = entry;

  return (
    <Drawer open={open} onClose={onClose} subtitle="Why this plan?" title={plan.planName}>
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <Badge tone="green">{matchPercent}% match</Badge>
        <span className="text-sm text-base-400">
          {categoryLabel(plan)} · {currency(plan.price)} / {plan.validityDays} days
        </span>
      </div>

      <div className="rounded-xl border border-cyan-400/25 bg-cyan-400/[0.06] p-4 flex gap-3 mb-6">
        <Sparkles className="h-5 w-5 text-cyan-300 shrink-0 mt-0.5" />
        <p className="text-sm text-base-200 leading-relaxed">{explanation}</p>
      </div>

      <h3 className="text-sm font-semibold text-base-100 mb-3">Match score breakdown</h3>
      <MatchScoreBreakdown breakdown={breakdown} />

      {explanationDetail?.formula && (
        <p className="mt-3 text-[11px] font-mono text-base-500">{explanationDetail.formula}</p>
      )}

      <Divider className="my-6" />

      <h3 className="text-sm font-semibold text-base-100 mb-3">What's driving this recommendation</h3>
      <ul className="space-y-3">
        {explanationDetail?.reasons?.map((reason) => (
          <ReasonRow
            key={reason.key}
            icon={REASON_ICONS[reason.key] ?? Tag}
            label={`${reason.label} · ${Math.round(reason.score)}/100`}
            value={reason.detail}
          />
        ))}
      </ul>

      <Divider className="my-6" />

      <h3 className="text-sm font-semibold text-base-100 mb-3">Plan details</h3>
      <ul className="space-y-3">
        <ReasonRow icon={Activity} label="Daily data" value={`${dailyData(plan)} per day (${monthlyData(plan)} a month)`} />
        <ReasonRow icon={Tag} label="Allowance type" value={`${allowanceLabel(plan)} · ${coverageLabel(plan)}`} />
        <ReasonRow icon={Fingerprint} label="Mapped persona" value={`Cluster ${plan.clusterId} — ${plan.persona}`} />
        {plan.differentiator && <ReasonRow icon={Sparkles} label="Differentiator" value={plan.differentiator} />}
      </ul>

      <Divider className="my-6" />
      <p className="text-xs text-base-500 leading-relaxed">
        Scores come from the backend recommendation engine, which evaluates all 25 catalogue plans with the
        weighted formula shown above. This panel only explains that arithmetic — it never re-ranks anything.
      </p>
    </Drawer>
  );
}

function ReasonRow({ icon: Icon, label, value }) {
  return (
    <li className="flex items-start gap-3">
      <span className="h-8 w-8 rounded-lg bg-base-800 flex items-center justify-center text-base-300 shrink-0">
        <Icon className="h-4 w-4" />
      </span>
      <div>
        <p className="text-xs text-base-400">{label}</p>
        <p className="text-sm text-base-100">{value}</p>
      </div>
    </li>
  );
}
