import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, PlayCircle, Sparkles } from 'lucide-react';
import { Button, Badge } from '@/components/ui/Primitives';
import { NetworkVisual } from './NetworkVisual';
import { fadeUp } from '@/lib/motion';

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-grid">
      <div className="absolute inset-x-0 top-0 h-[560px] bg-gradient-to-b from-cyan-500/10 via-transparent to-transparent pointer-events-none" />
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 pt-16 pb-20 sm:pt-24 sm:pb-28">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div {...fadeUp}>
            <Badge tone="cyan" icon={Sparkles} className="mb-6">
              AI-powered plan matching
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-[3.4rem] font-extrabold leading-[1.08] text-base-50 text-balance">
              Stop guessing which
              <span className="bg-gradient-to-r from-cyan-300 via-cyan-400 to-green-400 bg-clip-text text-transparent"> tariff plan</span> actually fits you
            </h1>
            <p className="mt-6 text-lg text-base-300 max-w-xl text-balance">
              Tariff Twin builds a live digital twin of how you actually use your phone — data, calls,
              SMS, roaming — then uses AI to match, explain, and simulate the plan that fits best. No
              spreadsheets, no guesswork.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Button as={Link} to="/onboarding" size="lg" icon={Sparkles} iconRight={ArrowRight}>
                Build my Telecom Twin
              </Button>
              <Button as={Link} to="/app/dashboard" size="lg" variant="secondary" icon={PlayCircle}>
                Explore live demo
              </Button>
            </div>
            <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm text-base-400">
              <Stat value="98%" label="explainable matches" />
              <Stat value="< 2 min" label="to first recommendation" />
              <Stat value="25+" label="plans continuously scored" />
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}>
            <NetworkVisual />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function Stat({ value, label }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="text-base-50 font-bold font-display">{value}</span>
      <span>{label}</span>
    </div>
  );
}
