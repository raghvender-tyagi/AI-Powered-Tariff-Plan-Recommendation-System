import { motion } from 'framer-motion';
import { Wifi, PhoneCall, MessageSquare, Globe2, Gauge as GaugeIcon } from 'lucide-react';
import { usePrefersReducedMotion } from '@/lib/motion';

const NODES = [
  { icon: Wifi, label: 'Data', value: '34 GB/mo', angle: -70, tone: '#22d3ee' },
  { icon: PhoneCall, label: 'Calls', value: '420 min', angle: -10, tone: '#34d399' },
  { icon: MessageSquare, label: 'SMS', value: '65 msgs', angle: 55, tone: '#60a5fa' },
  { icon: Globe2, label: 'Roaming', value: '2 countries', angle: 130, tone: '#fbbf24' },
  { icon: GaugeIcon, label: 'Spend', value: '₹649/mo', angle: 200, tone: '#fb7185' },
];

export function NetworkVisual({ className = '' }) {
  const reduced = usePrefersReducedMotion();
  const radius = 168;

  return (
    <div className={`relative aspect-square w-full max-w-[520px] mx-auto ${className}`} aria-hidden="true">
      {/* concentric scan rings */}
      {[1, 2, 3].map((i) => (
        <motion.div
          key={i}
          className="absolute inset-0 rounded-full border border-cyan-400/15"
          style={{ margin: `${i * 34}px` }}
          animate={reduced ? {} : { scale: [1, 1.03, 1], opacity: [0.5, 0.9, 0.5] }}
          transition={{ duration: 4 + i, repeat: Infinity, ease: 'easeInOut', delay: i * 0.4 }}
        />
      ))}

      {/* connecting lines */}
      <svg className="absolute inset-0 h-full w-full overflow-visible">
        {NODES.map((node, i) => {
          const rad = (node.angle * Math.PI) / 180;
          const x = 50 + (radius / 5.2) * Math.cos(rad);
          const y = 50 + (radius / 5.2) * Math.sin(rad);
          return (
            <line
              key={i}
              x1="50%"
              y1="50%"
              x2={`${x}%`}
              y2={`${y}%`}
              stroke={node.tone}
              strokeOpacity="0.25"
              strokeWidth="1.5"
              strokeDasharray="3 4"
            />
          );
        })}
      </svg>

      {/* central AI core */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          className="relative h-28 w-28 rounded-full bg-gradient-to-br from-cyan-400 via-blue-500 to-green-400 flex items-center justify-center shadow-[0_0_60px_-6px_rgba(34,211,238,0.6)]"
          animate={reduced ? {} : { boxShadow: ['0 0 40px -6px rgba(34,211,238,0.45)', '0 0 70px -6px rgba(34,211,238,0.75)', '0 0 40px -6px rgba(34,211,238,0.45)'] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          <span className="text-base-950 font-display font-extrabold text-sm tracking-tight">AI</span>
          <motion.span
            className="absolute inset-0 rounded-full border border-white/40"
            animate={reduced ? {} : { scale: [1, 1.5], opacity: [0.6, 0] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeOut' }}
          />
        </motion.div>
      </div>

      {/* orbiting data nodes */}
      {NODES.map((node, i) => {
        const rad = (node.angle * Math.PI) / 180;
        const x = 50 + (radius / 5.2) * Math.cos(rad);
        const y = 50 + (radius / 5.2) * Math.sin(rad);
        const Icon = node.icon;
        return (
          <motion.div
            key={node.label}
            className="absolute"
            style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1, y: reduced ? 0 : [0, -6, 0] }}
            transition={{
              opacity: { delay: 0.4 + i * 0.12, duration: 0.5 },
              scale: { delay: 0.4 + i * 0.12, duration: 0.5 },
              y: { duration: 3.4 + i * 0.3, repeat: Infinity, ease: 'easeInOut', delay: i * 0.2 },
            }}
          >
            <div className="flex flex-col items-center gap-1.5 rounded-2xl border border-base-700 bg-base-900/90 px-3 py-2.5 shadow-lg backdrop-blur">
              <div className="flex items-center gap-1.5">
                <span className="h-6 w-6 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${node.tone}22`, color: node.tone }}>
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <span className="text-[11px] text-base-400 font-medium">{node.label}</span>
              </div>
              <span className="text-xs font-semibold text-base-100">{node.value}</span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
