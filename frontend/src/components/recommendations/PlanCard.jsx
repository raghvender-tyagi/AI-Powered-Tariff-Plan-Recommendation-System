import { motion } from 'framer-motion';
import { Wifi, CalendarClock, Users, Crown, Scale, HelpCircle, ArrowRight, Check, Sparkles } from 'lucide-react';
import { Card, Badge, Button } from '@/components/ui/Primitives';
import { Gauge } from '@/components/ui/Gauge';
import { currency } from '@/lib/format';
import { categoryLabel, categoryColor, dailyData, monthlyData, coverageLabel } from '@/lib/planShape';

export function PlanCard({
  entry,
  featured = false,
  onWhy,
  onViewDetails,
  onToggleCompare,
  isComparing = false,
  className = '',
}) {
  const { plan, matchPercent, rank, explanation } = entry;

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: ((rank ?? 1) - 1) * 0.08, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      <Card
        interactive
        className={`relative flex flex-col h-full p-6 ${
          featured
            ? 'border-cyan-400/50 bg-gradient-to-b from-cyan-400/[0.07] to-base-900 shadow-[0_0_0_1px_rgba(34,211,238,0.25),0_30px_60px_-30px_rgba(34,211,238,0.35)]'
            : ''
        }`}
      >
        {featured && (
          <div className="absolute -top-3 left-6 flex items-center gap-1 rounded-full bg-gradient-to-r from-cyan-400 to-green-400 px-3 py-1 text-xs font-bold text-base-950 shadow-lg">
            <Crown className="h-3.5 w-3.5" /> Top pick
          </div>
        )}
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium" style={{ color: categoryColor(plan) }}>
              {categoryLabel(plan)}
            </p>
            <h3 className="text-lg font-bold text-base-50 mt-0.5">{plan.planName}</h3>
          </div>
          {typeof matchPercent === 'number' && (
            <Gauge
              value={matchPercent}
              size={64}
              strokeWidth={6}
              tone={featured ? 'green' : 'cyan'}
              label={`${matchPercent}%`}
            />
          )}
        </div>

        <div className="mt-4 flex items-baseline gap-1">
          <span className="text-3xl font-extrabold font-display text-base-50">{currency(plan.price)}</span>
          <span className="text-sm text-base-400">/ {plan.validityDays} days</span>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <Entitlement icon={Wifi} value={dailyData(plan)} label="Per day" />
          <Entitlement icon={Sparkles} value={monthlyData(plan)} label="Per month" />
          <Entitlement icon={CalendarClock} value={`${plan.validityDays}d`} label="Validity" />
        </div>

        {(plan.members || plan.employees) && (
          <Badge tone="blue" icon={Users} className="mt-4 w-fit">
            {coverageLabel(plan)}
          </Badge>
        )}

        <ul className="mt-4 space-y-1.5">
          {plan.benefits?.slice(0, 3).map((benefit) => (
            <li key={benefit} className="flex items-start gap-2 text-xs text-base-400">
              <Check className="h-3.5 w-3.5 text-green-400 mt-0.5 shrink-0" />
              {benefit}
            </li>
          ))}
        </ul>

        {explanation && (
          <p className="mt-4 text-xs text-base-400 border-t border-base-700 pt-3 line-clamp-3">{explanation}</p>
        )}

        <div className="mt-5 pt-4 border-t border-base-700 flex flex-wrap gap-2">
          {onWhy && (
            <Button size="sm" variant="secondary" icon={HelpCircle} onClick={() => onWhy(entry)}>
              Why this plan?
            </Button>
          )}
          {onToggleCompare && (
            <Button
              size="sm"
              variant={isComparing ? 'outline' : 'ghost'}
              icon={Scale}
              onClick={() => onToggleCompare(plan._id)}
            >
              {isComparing ? 'Added' : 'Compare'}
            </Button>
          )}
          {onViewDetails && (
            <Button
              size="sm"
              variant="ghost"
              iconRight={ArrowRight}
              className="ml-auto"
              onClick={() => onViewDetails(entry)}
            >
              Details
            </Button>
          )}
        </div>
      </Card>
    </motion.div>
  );
}

function Entitlement({ icon: Icon, value, label }) {
  return (
    <div className="rounded-xl bg-base-800/60 border border-base-700 py-2.5">
      <Icon className="h-3.5 w-3.5 mx-auto text-cyan-300 mb-1" aria-hidden="true" />
      <p className="text-sm font-semibold text-base-100">{value}</p>
      <p className="text-[10px] text-base-500">{label}</p>
    </div>
  );
}
