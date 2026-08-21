import { UserCircle2, Activity, Fingerprint, GitCompareArrows, Sparkles, MessageSquareText, Check } from 'lucide-react';
import { motion } from 'framer-motion';

const STAGES = [
  { key: 'profile', label: 'Profile', icon: UserCircle2 },
  { key: 'usage', label: 'Usage Analysis', icon: Activity },
  { key: 'persona', label: 'Persona Detection', icon: Fingerprint },
  { key: 'evaluation', label: 'Plan Evaluation', icon: GitCompareArrows },
  { key: 'recommendation', label: 'Recommendation', icon: Sparkles },
  { key: 'explanation', label: 'AI Explanation', icon: MessageSquareText },
];

export function JourneyTimeline({ activeKey = 'explanation', className = '' }) {
  const activeIdx = STAGES.findIndex((s) => s.key === activeKey);
  return (
    <div className={`overflow-x-auto scrollbar-thin ${className}`}>
      <ol className="flex items-center gap-0 min-w-max px-1 py-2" aria-label="AI recommendation journey">
        {STAGES.map((stage, i) => {
          const done = i <= activeIdx;
          return (
            <li key={stage.key} className="flex items-center">
              <div className="flex flex-col items-center gap-2 w-[104px]">
                <motion.div
                  initial={{ scale: 0.85, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: i * 0.06, duration: 0.35 }}
                  className={`h-10 w-10 rounded-full flex items-center justify-center border ${
                    done
                      ? 'bg-cyan-400/15 border-cyan-400/40 text-cyan-300'
                      : 'bg-base-900 border-base-700 text-base-500'
                  }`}
                >
                  {done && i < activeIdx ? <Check className="h-4 w-4" /> : <stage.icon className="h-4 w-4" />}
                </motion.div>
                <span className={`text-[11px] text-center leading-tight font-medium ${done ? 'text-base-200' : 'text-base-500'}`}>
                  {stage.label}
                </span>
              </div>
              {i < STAGES.length - 1 && (
                <div className={`h-px w-8 sm:w-12 -mt-5 ${i < activeIdx ? 'bg-cyan-400/50' : 'bg-base-700'}`} />
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
