import { forwardRef } from 'react';
import clsx from 'clsx';

export const Card = forwardRef(function Card({ className, children, as: As = 'div', interactive = false, ...props }, ref) {
  return (
    <As
      ref={ref}
      className={clsx(
        'rounded-2xl border border-base-700/80 bg-base-900/60 shadow-[0_1px_0_0_rgba(255,255,255,0.03)_inset,0_20px_40px_-24px_hsl(var(--shadow-color)/0.9)]',
        'backdrop-blur-[2px]',
        interactive &&
          'transition-all duration-300 hover:border-base-500/70 hover:-translate-y-0.5 hover:shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset,0_24px_48px_-20px_rgba(34,211,238,0.18)]',
        className,
      )}
      {...props}
    >
      {children}
    </As>
  );
});

export function Button({
  className,
  variant = 'primary',
  size = 'md',
  as: As = 'button',
  icon: Icon,
  iconRight: IconRight,
  loading = false,
  children,
  ...props
}) {
  const base =
    'inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all duration-200 focus-visible:outline-2 focus-visible:outline-cyan-400 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]';
  const sizes = {
    sm: 'text-sm px-3 py-1.5',
    md: 'text-sm px-4 py-2.5',
    lg: 'text-base px-6 py-3.5',
  };
  const variants = {
    primary:
      'bg-gradient-to-b from-cyan-400 to-cyan-500 text-base-950 shadow-[0_1px_0_rgba(255,255,255,0.4)_inset,0_8px_20px_-6px_rgba(34,211,238,0.55)] hover:shadow-[0_1px_0_rgba(255,255,255,0.4)_inset,0_10px_28px_-6px_rgba(34,211,238,0.7)] hover:brightness-105',
    secondary: 'bg-base-800 text-base-100 border border-base-600 hover:bg-base-700 hover:border-base-500',
    ghost: 'text-base-200 hover:bg-base-800/70',
    outline: 'border border-cyan-400/40 text-cyan-300 hover:bg-cyan-400/10',
    danger: 'bg-rose-500/15 text-rose-300 border border-rose-500/30 hover:bg-rose-500/25',
  };
  return (
    <As className={clsx(base, sizes[size], variants[variant], className)} {...props}>
      {loading ? (
        <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
      ) : (
        Icon && <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
      )}
      {children}
      {IconRight && !loading && <IconRight className="h-4 w-4 shrink-0" aria-hidden="true" />}
    </As>
  );
}

export function Badge({ className, tone = 'neutral', children, icon: Icon }) {
  const tones = {
    neutral: 'bg-base-800 text-base-200 border-base-600',
    cyan: 'bg-cyan-400/10 text-cyan-300 border-cyan-400/25',
    green: 'bg-green-400/10 text-green-300 border-green-400/25',
    amber: 'bg-amber-400/10 text-amber-300 border-amber-400/25',
    rose: 'bg-rose-400/10 text-rose-300 border-rose-400/25',
    blue: 'bg-blue-400/10 text-blue-300 border-blue-400/25',
    demo: 'bg-base-800 text-base-300 border-base-500 border-dashed',
  };
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium',
        tones[tone],
        className,
      )}
    >
      {Icon && <Icon className="h-3 w-3" aria-hidden="true" />}
      {children}
    </span>
  );
}

export function DemoBadge({ className }) {
  return (
    <Badge tone="demo" className={className}>
      Demo data
    </Badge>
  );
}

export function SectionHeading({ eyebrow, title, description, className, align = 'left', children }) {
  return (
    <div className={clsx('flex flex-col gap-3', align === 'center' && 'items-center text-center', className)}>
      <div className="flex items-center gap-3 flex-wrap justify-between w-full">
        <div>
          {eyebrow && (
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-400/90 mb-2">{eyebrow}</p>
          )}
          <h2 className="text-2xl sm:text-3xl font-bold text-base-50 text-balance">{title}</h2>
          {description && <p className="mt-2 text-base-300 max-w-2xl text-balance">{description}</p>}
        </div>
        {children}
      </div>
    </div>
  );
}

export function ProgressBar({ value, max = 100, tone = 'cyan', className, height = 'h-2', showLabel = false }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const tones = {
    cyan: 'from-cyan-400 to-cyan-300',
    green: 'from-green-400 to-green-300',
    amber: 'from-amber-400 to-amber-300',
    rose: 'from-rose-400 to-rose-300',
    blue: 'from-blue-500 to-cyan-400',
  };
  return (
    <div className={clsx('w-full', className)}>
      <div className={clsx('w-full rounded-full bg-base-800 overflow-hidden', height)}>
        <div
          role="progressbar"
          aria-valuenow={Math.round(pct)}
          aria-valuemin={0}
          aria-valuemax={100}
          className={clsx('h-full rounded-full bg-gradient-to-r transition-[width] duration-700 ease-out', tones[tone])}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && <div className="mt-1 text-xs text-base-300">{Math.round(pct)}%</div>}
    </div>
  );
}

export function Skeleton({ className }) {
  return <div className={clsx('rounded-lg shimmer-bg', className)} aria-hidden="true" />;
}

export function EmptyState({ icon: Icon, title, description, action, className }) {
  return (
    <div className={clsx('flex flex-col items-center text-center gap-3 py-12 px-6', className)}>
      {Icon && (
        <div className="h-12 w-12 rounded-full bg-base-800 flex items-center justify-center text-base-400">
          <Icon className="h-6 w-6" aria-hidden="true" />
        </div>
      )}
      <h3 className="font-semibold text-base-100">{title}</h3>
      {description && <p className="text-sm text-base-400 max-w-sm">{description}</p>}
      {action}
    </div>
  );
}

export function ErrorState({ title = 'Something went wrong', description, onRetry, className }) {
  return (
    <div className={clsx('flex flex-col items-center text-center gap-3 py-12 px-6', className)} role="alert">
      <div className="h-12 w-12 rounded-full bg-rose-400/10 flex items-center justify-center text-rose-300 text-xl">
        !
      </div>
      <h3 className="font-semibold text-base-100">{title}</h3>
      {description && <p className="text-sm text-base-400 max-w-sm">{description}</p>}
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

export function IconTile({ icon: Icon, tone = 'cyan', className }) {
  const tones = {
    cyan: 'bg-cyan-400/10 text-cyan-300',
    green: 'bg-green-400/10 text-green-300',
    amber: 'bg-amber-400/10 text-amber-300',
    blue: 'bg-blue-400/10 text-blue-300',
    rose: 'bg-rose-400/10 text-rose-300',
  };
  return (
    <div className={clsx('h-10 w-10 rounded-xl flex items-center justify-center', tones[tone], className)}>
      <Icon className="h-5 w-5" aria-hidden="true" />
    </div>
  );
}

export function Divider({ className }) {
  return <div className={clsx('h-px w-full bg-base-700/80', className)} />;
}
