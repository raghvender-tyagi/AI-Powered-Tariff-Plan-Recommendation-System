import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Check, Waves, Brain, Fingerprint, GitCompareArrows, Target, PackageCheck } from 'lucide-react';
import { Card } from '@/components/ui/Primitives';

const STAGES = [
  { label: 'Understanding your usage', icon: Waves },
  { label: 'Analyzing your profile', icon: Brain },
  { label: 'Identifying your telecom persona', icon: Fingerprint },
  { label: 'Comparing available plans', icon: GitCompareArrows },
  { label: 'Calculating plan fit', icon: Target },
  { label: 'Preparing recommendations', icon: PackageCheck },
];

export function AnalysisSequence({ onDone, stageDuration = 620 }) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (activeIndex >= STAGES.length) {
      const t = setTimeout(onDone, 450);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setActiveIndex((i) => i + 1), stageDuration);
    return () => clearTimeout(t);
  }, [activeIndex, onDone, stageDuration]);

  return (
    <div className="max-w-lg mx-auto text-center">
      <div className="relative mx-auto mb-8 h-20 w-20">
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-cyan-400/30"
          animate={{ scale: [1, 1.25, 1], opacity: [0.6, 0, 0.6] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-400 to-green-400 flex items-center justify-center">
          <Loader2 className="h-8 w-8 text-base-950 animate-spin" />
        </div>
      </div>
      <h2 className="text-xl font-bold text-base-50 mb-1">Your AI Advisor is on it</h2>
      <p className="text-sm text-base-400 mb-8">This takes just a few seconds.</p>

      <Card className="p-5 text-left">
        <ul className="space-y-1">
          {STAGES.map((stage, i) => {
            const state = i < activeIndex ? 'done' : i === activeIndex ? 'active' : 'pending';
            return (
              <li key={stage.label} className="flex items-center gap-3 py-2.5">
                <span
                  className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                    state === 'done'
                      ? 'bg-green-400/15 text-green-300'
                      : state === 'active'
                        ? 'bg-cyan-400/15 text-cyan-300'
                        : 'bg-base-800 text-base-500'
                  }`}
                >
                  {state === 'done' ? (
                    <Check className="h-4 w-4" />
                  ) : state === 'active' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <stage.icon className="h-3.5 w-3.5" />
                  )}
                </span>
                <span
                  className={`text-sm transition-colors ${
                    state === 'pending' ? 'text-base-500' : state === 'active' ? 'text-base-50 font-medium' : 'text-base-300'
                  }`}
                >
                  {stage.label}
                </span>
              </li>
            );
          })}
        </ul>
      </Card>
    </div>
  );
}
