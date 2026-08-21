import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Radar,
  Sparkles,
  MessageCircle,
  SlidersHorizontal,
  Scale,
  ShieldCheck,
  ArrowRight,
  Compass,
  Gauge as GaugeIcon,
  Brain,
  Fingerprint,
  Wand2,
  Eye,
  Split,
  Repeat,
  PiggyBank,
  CheckCircle2,
} from 'lucide-react';
import { Card, Button, SectionHeading, Badge } from '@/components/ui/Primitives';
import { Gauge } from '@/components/ui/Gauge';
import { fadeUp } from '@/lib/motion';

const FEATURES = [
  {
    icon: Radar,
    title: 'Your Telecom Twin',
    tone: 'cyan',
    description: 'A live visual model of your data, calls, SMS, roaming and spend — built from real usage, not guesses.',
  },
  {
    icon: Sparkles,
    title: 'AI Recommendation Center',
    tone: 'green',
    description: 'Your top 3 plans, ranked with a match score and a plain-language reason for every pick.',
  },
  {
    icon: Fingerprint,
    title: 'Telecom Persona',
    tone: 'blue',
    description: 'We translate the underlying customer segment into a human persona you can actually understand.',
  },
  {
    icon: Scale,
    title: 'Side-by-side comparison',
    tone: 'amber',
    description: 'Compare plans across price, data, calls, SMS and roaming — with an AI verdict for each category.',
  },
  {
    icon: SlidersHorizontal,
    title: 'What-If Simulator',
    tone: 'cyan',
    description: 'Drag your usage up or down and watch recommendations update instantly, before you commit.',
  },
  {
    icon: MessageCircle,
    title: 'Conversational AI Advisor',
    tone: 'green',
    description: 'Prefer to just talk it through? Chat naturally and get recommendations inside the conversation.',
  },
];

export function FeatureGrid() {
  return (
    <section id="experience" className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 py-20">
      <SectionHeading
        eyebrow="Everything in one place"
        title="A complete picture of your telecom life — explained by AI"
        description="Every screen is built to answer one question at a time: what do I use, who am I as a customer, and which plan actually fits."
        align="center"
        className="mb-12"
      />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {FEATURES.map((f, i) => (
          <motion.div key={f.title} {...fadeUp} transition={{ ...fadeUp.transition, delay: i * 0.06 }}>
            <Card interactive className="p-6 h-full">
              <div
                className="h-11 w-11 rounded-xl flex items-center justify-center mb-4"
                style={{ backgroundColor: 'rgba(34,211,238,0.08)' }}
              >
                <f.icon className="h-5 w-5 text-cyan-300" />
              </div>
              <h3 className="font-semibold text-base-50 mb-1.5">{f.title}</h3>
              <p className="text-sm text-base-400 leading-relaxed">{f.description}</p>
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

const JOURNEY = [
  { icon: Compass, label: 'Discover' },
  { icon: GaugeIcon, label: 'Understand Usage' },
  { icon: Radar, label: 'Build Telecom Twin' },
  { icon: Brain, label: 'Analyze Profile' },
  { icon: Fingerprint, label: 'Identify Persona' },
  { icon: Sparkles, label: 'Get Recommendations' },
  { icon: Eye, label: 'Understand Why' },
  { icon: Split, label: 'Compare Plans' },
  { icon: Repeat, label: 'Simulate Usage' },
  { icon: PiggyBank, label: 'See Savings' },
  { icon: CheckCircle2, label: 'Decide' },
];

export function JourneyPreview() {
  return (
    <section id="how-it-works" className="border-y border-base-700/60 bg-base-900/40 py-20">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="The journey"
          title="From first click to a confident decision"
          description="Eleven small steps, each one explainable — you always know why you're seeing what you're seeing."
          align="center"
          className="mb-12"
        />
        <div className="flex flex-wrap justify-center gap-3">
          {JOURNEY.map((step, i) => (
            <div key={step.label} className="flex items-center gap-3">
              <motion.div
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: i * 0.04 }}
                className="flex flex-col items-center gap-2 w-[92px] text-center"
              >
                <div className="h-11 w-11 rounded-full border border-base-600 bg-base-900 flex items-center justify-center text-cyan-300">
                  <step.icon className="h-5 w-5" />
                </div>
                <span className="text-[11px] leading-tight text-base-300 font-medium">{step.label}</span>
              </motion.div>
              {i < JOURNEY.length - 1 && <ArrowRight className="h-4 w-4 text-base-600 hidden sm:block" />}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function RecommendationPreview() {
  return (
    <section id="recommendations" className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 py-20">
      <div className="grid lg:grid-cols-2 gap-12 items-center">
        <motion.div {...fadeUp}>
          <SectionHeading
            eyebrow="AI Recommendation Center"
            title="Not just a plan — a reason"
            description="Every recommendation ships with a full match-score breakdown across data, calling, budget, roaming and persona fit, plus a plain-English explanation grounded in real plan data."
          />
          <ul className="mt-6 space-y-3">
            {['Top 3 ranked plans with match %', 'Why This Plan? explanation drawer', 'Instant side-by-side comparison'].map((t) => (
              <li key={t} className="flex items-center gap-2.5 text-sm text-base-300">
                <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0" />
                {t}
              </li>
            ))}
          </ul>
          <Button as={Link} to="/onboarding" className="mt-8" icon={Sparkles}>
            See my matches
          </Button>
        </motion.div>
        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.1 }}>
          <Card className="p-6 relative overflow-hidden">
            <Badge tone="green" className="absolute top-6 right-6">
              96% match
            </Badge>
            <p className="text-xs uppercase tracking-wider text-base-400 font-semibold mb-1">#1 recommended</p>
            <h3 className="text-xl font-bold text-base-50 mb-4">Everyday Smart</h3>
            <div className="flex items-center gap-6">
              <Gauge value={96} size={104} strokeWidth={9} tone="green" />
              <div className="space-y-2 flex-1">
                {[
                  ['Data fit', 94],
                  ['Budget fit', 90],
                  ['Calling fit', 88],
                ].map(([label, val]) => (
                  <div key={label}>
                    <div className="flex justify-between text-xs text-base-400 mb-1">
                      <span>{label}</span>
                      <span>{val}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-base-800 overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-green-400" style={{ width: `${val}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <p className="mt-5 text-sm text-base-400 border-t border-base-700 pt-4">
              "Matches your ~20GB monthly usage and stays under your ₹650 budget while keeping unlimited local calling."
            </p>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}

export function CTASection() {
  return (
    <section className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 pb-24">
      <motion.div {...fadeUp}>
        <Card className="relative overflow-hidden px-8 py-14 text-center bg-gradient-to-br from-base-900 via-base-900 to-base-850">
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />
          <ShieldCheck className="h-10 w-10 text-cyan-300 mx-auto mb-5" />
          <h2 className="text-2xl sm:text-3xl font-bold text-base-50 mb-3 text-balance">Find your best-fit plan in under two minutes</h2>
          <p className="text-base-400 max-w-xl mx-auto mb-8 text-balance">
            Answer a few quick questions or just talk to the AI Advisor — either way, you'll see exactly why each plan was recommended.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button as={Link} to="/onboarding" size="lg" icon={Wand2}>
              Start onboarding
            </Button>
            <Button as={Link} to="/app/advisor" size="lg" variant="outline" icon={MessageCircle}>
              Talk to the AI Advisor
            </Button>
          </div>
        </Card>
      </motion.div>
    </section>
  );
}
