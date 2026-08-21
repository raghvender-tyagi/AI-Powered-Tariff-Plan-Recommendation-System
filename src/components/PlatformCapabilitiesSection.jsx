import React from 'react';
import { Fingerprint, Gauge, Sparkles, TrendingUp, Compass, ArrowRight } from 'lucide-react';
import { usePlanStore } from '../store/usePlanStore';

export const PlatformCapabilitiesSection = () => {
  const { setSimulatorOpen } = usePlanStore();

  const capabilities = [
    {
      icon: Fingerprint,
      title: 'Understand',
      description: 'Builds a living Telecom Twin from your real usage signals.',
    },
    {
      icon: Gauge,
      title: 'Analyze',
      description: 'Scores plan fit across data, voice, 5G, price and benefit use.',
    },
    {
      icon: Sparkles,
      title: 'Recommend',
      description: 'Surfaces the top 3 plans with a reason for each one.',
    },
    {
      icon: TrendingUp,
      title: 'Simulate',
      description: "Projects tomorrow's usage before you commit to a plan.",
    },
  ];

  return (
    <section className="py-24 bg-[#F8FAFC]/80 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Section Headline */}
        <div className="max-w-3xl mb-16 space-y-3">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
            An intelligent telecom decision platform — not just a recommendation model.
          </h2>
        </div>

        {/* 4 Feature Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          {capabilities.map((item, idx) => {
            const IconComp = item.icon;
            return (
              <div
                key={idx}
                className="bg-white rounded-3xl p-7 border border-slate-200/70 shadow-lg shadow-slate-100/60 hover:shadow-xl hover:border-brand-200 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  {/* Cyan Circle Icon */}
                  <div className="w-14 h-14 rounded-2xl bg-cyanBrand-400 flex items-center justify-center text-white mb-6 group-hover:scale-110 group-hover:bg-brand-600 transition-all duration-300 shadow-md shadow-cyan-500/20">
                    <IconComp className="w-7 h-7 stroke-[2.2]" />
                  </div>

                  <h3 className="text-xl font-extrabold text-slate-900 tracking-tight mb-2">
                    {item.title}
                  </h3>

                  <p className="text-sm text-slate-600 font-medium leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Banner Card: "See your plan health in five seconds." */}
        <div className="relative rounded-[32px] bg-gradient-to-r from-sky-50 via-blue-50/70 to-cyan-50/50 p-8 sm:p-12 border border-sky-200/80 shadow-2xl shadow-sky-900/5 flex flex-col lg:flex-row items-center justify-between gap-8">
          
          {/* Decorative backdrop glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-brand-400/10 rounded-full blur-3xl pointer-events-none" />

          {/* Left Text Content */}
          <div className="max-w-2xl space-y-3 relative z-10">
            <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              See your plan health in five seconds.
            </h3>
            <p className="text-base sm:text-lg text-slate-600 font-normal leading-relaxed">
              What you're using, whether your plan fits, which plan to pick, how much you could save, and what happens if your usage changes.
            </p>
          </div>

          {/* Right CTA Buttons */}
          <div className="flex flex-wrap items-center gap-4 relative z-10 flex-shrink-0">
            <button
              onClick={() => {
                const el = document.getElementById('perfect-plan-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="bg-[#0077FF] hover:bg-[#0060DF] text-white font-semibold text-sm sm:text-base px-7 py-4 rounded-full shadow-lg shadow-blue-500/30 hover:shadow-xl transition-all"
            >
              Find My Perfect Plan
            </button>

            <button
              onClick={() => setSimulatorOpen(true)}
              className="inline-flex items-center space-x-2 bg-white/90 hover:bg-white text-slate-800 font-semibold text-sm sm:text-base px-6 py-4 rounded-full border border-slate-200/80 shadow-sm hover:shadow transition-all"
            >
              <Compass className="w-5 h-5 text-brand-600" />
              <span>Try the Simulator</span>
            </button>
          </div>

        </div>

      </div>
    </section>
  );
};
