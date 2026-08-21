import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { Button, Card, ProgressBar } from '@/components/ui/Primitives';
import { STEPS } from './steps';
import { currency } from '@/lib/format';

export function OnboardingWizard({ onComplete }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState({ budget: STEPS.find((s) => s.key === 'budget').default });

  const step = STEPS[stepIndex];
  const isLast = stepIndex === STEPS.length - 1;
  const canAdvance = answers[step.key] !== undefined;

  const setAnswer = (value) => setAnswers((a) => ({ ...a, [step.key]: value }));

  const goNext = () => {
    if (isLast) {
      onComplete(answers);
    } else {
      setStepIndex((i) => i + 1);
    }
  };
  const goBack = () => setStepIndex((i) => Math.max(0, i - 1));

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between text-xs text-base-400 mb-2">
          <span>
            Step {stepIndex + 1} of {STEPS.length}
          </span>
          <span>{Math.round(((stepIndex + (canAdvance ? 1 : 0)) / STEPS.length) * 100)}% profile complete</span>
        </div>
        <ProgressBar value={stepIndex + (canAdvance ? 1 : 0)} max={STEPS.length} tone="blue" />
        <div className="flex gap-1.5 mt-3">
          {STEPS.map((s, i) => (
            <div
              key={s.key}
              className={`h-1 flex-1 rounded-full transition-colors ${
                i < stepIndex || answers[s.key] !== undefined ? 'bg-cyan-400' : i === stepIndex ? 'bg-base-500' : 'bg-base-800'
              }`}
            />
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step.key}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          <Card className="p-8">
            <div className="flex items-center gap-3 mb-1">
              <div className="h-10 w-10 rounded-xl bg-cyan-400/10 flex items-center justify-center text-cyan-300">
                <step.icon className="h-5 w-5" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-base-50 mt-4">{step.title}</h2>
            <p className="text-sm text-base-400 mt-1">{step.subtitle}</p>

            <div className="mt-7">
              {step.type === 'choice' && (
                <div className="grid gap-3">
                  {step.options.map((opt) => (
                    <ChoiceOption
                      key={String(opt.value)}
                      option={opt}
                      selected={answers[step.key] === opt.value}
                      onClick={() => setAnswer(opt.value)}
                    />
                  ))}
                </div>
              )}
              {step.type === 'toggle' && (
                <div className="grid sm:grid-cols-2 gap-3">
                  {step.options.map((opt) => (
                    <ChoiceOption
                      key={String(opt.value)}
                      option={opt}
                      selected={answers[step.key] === opt.value}
                      onClick={() => setAnswer(opt.value)}
                    />
                  ))}
                </div>
              )}
              {step.type === 'slider' && (
                <div>
                  <div className="text-center mb-4">
                    <span className="text-4xl font-extrabold font-display text-base-50">
                      {currency(answers[step.key] ?? step.default)}
                    </span>
                    <span className="text-base-400 text-sm">/month</span>
                  </div>
                  <input
                    type="range"
                    min={step.min}
                    max={step.max}
                    step={step.step}
                    value={answers[step.key] ?? step.default}
                    onChange={(e) => setAnswer(Number(e.target.value))}
                    className="w-full accent-cyan-400 h-2"
                    aria-label="Monthly budget"
                  />
                  <div className="flex justify-between text-xs text-base-500 mt-1">
                    <span>{currency(step.min)}</span>
                    <span>{currency(step.max)}</span>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </motion.div>
      </AnimatePresence>

      <div className="flex items-center justify-between mt-6">
        <Button variant="ghost" onClick={goBack} disabled={stepIndex === 0} icon={ArrowLeft}>
          Back
        </Button>
        <Button onClick={goNext} disabled={!canAdvance} iconRight={isLast ? Check : ArrowRight}>
          {isLast ? 'Build my recommendations' : 'Continue'}
        </Button>
      </div>
    </div>
  );
}

function ChoiceOption({ option, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`text-left rounded-xl border px-4 py-3.5 transition-all duration-200 focus-visible:outline-2 focus-visible:outline-cyan-400 ${
        selected
          ? 'border-cyan-400/60 bg-cyan-400/10 shadow-[0_0_0_1px_rgba(34,211,238,0.3)]'
          : 'border-base-700 bg-base-900/60 hover:border-base-500 hover:bg-base-800/60'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className={`font-medium ${selected ? 'text-cyan-300' : 'text-base-100'}`}>{option.label}</p>
          <p className="text-xs text-base-400 mt-0.5">{option.hint}</p>
        </div>
        <div
          className={`h-5 w-5 rounded-full border flex items-center justify-center shrink-0 ${
            selected ? 'border-cyan-400 bg-cyan-400' : 'border-base-500'
          }`}
        >
          {selected && <Check className="h-3.5 w-3.5 text-base-950" />}
        </div>
      </div>
    </button>
  );
}
