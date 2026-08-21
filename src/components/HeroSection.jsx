import React from 'react';
import { ArrowRight, BarChart2, Sparkles } from 'lucide-react';
import { TelecomTwinCard } from './TelecomTwinCard';
import { usePlanStore } from '../store/usePlanStore';

export const HeroSection = () => {
  const { setOperatorDashboardOpen, isDarkMode } = usePlanStore();

  const scrollToPlans = () => {
    const el = document.getElementById('perfect-plan-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className={`relative pt-10 pb-20 md:pt-14 md:pb-28 overflow-hidden transition-colors duration-300 ${
      isDarkMode ? 'bg-slate-950 text-white' : 'hero-mesh-bg text-slate-900'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Hero Content */}
          <div className="lg:col-span-7 space-y-7">
            
            {/* Top Workflow Process Badge */}
            <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full border shadow-sm backdrop-blur-md ${
              isDarkMode 
                ? 'bg-slate-900/90 border-slate-800 text-cyan-400' 
                : 'bg-white/90 border-sky-200/80 text-[#0070F3]'
            }`}>
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span className="text-xs sm:text-sm font-semibold tracking-tight">
                Understand <span className="opacity-60">→</span> Analyze <span className="opacity-60">→</span> Recommend <span className="opacity-60">→</span> Optimize
              </span>
            </div>

            {/* Main Headline */}
            <div className="space-y-1">
              <h1 className={`text-5xl sm:text-6xl xl:text-7xl font-extrabold tracking-tight leading-[1.08] ${
                isDarkMode ? 'text-white' : 'text-[#0F172A]'
              }`}>
                Your Plan Should <br />
                <span className="bg-gradient-to-r from-[#0066FF] via-[#0099FF] to-[#00D8F6] bg-clip-text text-transparent">Understand You.</span>
              </h1>
            </div>

            {/* Description Paragraph */}
            <p className={`text-base sm:text-lg font-normal leading-relaxed max-w-xl ${
              isDarkMode ? 'text-slate-300' : 'text-slate-500'
            }`}>
              SmartFit analyzes your Internet, 5G and calling behavior to recommend the tariff plan that fits your lifestyle — today and tomorrow.
            </p>

            {/* Action Buttons Row */}
            <div className="flex flex-wrap items-center gap-4 pt-1">
              <button
                onClick={scrollToPlans}
                className="inline-flex items-center justify-center space-x-2 bg-[#0070F3] hover:bg-[#0060DF] text-white font-semibold text-base px-7 py-3.5 rounded-full shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/35 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
              >
                <span>Find My Perfect Plan</span>
                <ArrowRight className="w-5 h-5" />
              </button>

              <button
                onClick={() => setOperatorDashboardOpen(true)}
                className={`inline-flex items-center justify-center space-x-2 font-semibold text-base px-6 py-3.5 rounded-full border shadow-sm hover:shadow transition-all duration-200 ${
                  isDarkMode
                    ? 'bg-slate-900 border-slate-800 text-slate-200 hover:bg-slate-850'
                    : 'bg-[#EEF5FC] hover:bg-[#E2EFFC] text-[#334155] border-slate-200/60'
                }`}
              >
                <BarChart2 className="w-5 h-5 text-cyan-400" />
                <span>Explore Operator Dashboard</span>
              </button>
            </div>

            {/* Key Statistics Row */}
            <div className={`pt-8 border-t grid grid-cols-3 gap-4 sm:gap-8 ${
              isDarkMode ? 'border-slate-800' : 'border-slate-200/60'
            }`}>
              <div>
                <p className={`text-3xl sm:text-4xl font-extrabold tracking-tight ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>640+</p>
                <p className="text-[11px] font-bold tracking-wider text-slate-400 uppercase mt-1">PLANS ANALYZED</p>
              </div>

              <div>
                <p className={`text-3xl sm:text-4xl font-extrabold tracking-tight ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>₹612/yr</p>
                <p className="text-[11px] font-bold tracking-wider text-slate-400 uppercase mt-1">AVG. EST. SAVING</p>
              </div>

              <div>
                <p className={`text-3xl sm:text-4xl font-extrabold tracking-tight ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>27.4%</p>
                <p className="text-[11px] font-bold tracking-wider text-slate-400 uppercase mt-1">MISMATCH FOUND</p>
              </div>
            </div>

          </div>

          {/* Right Telecom Twin Card */}
          <div className="lg:col-span-5 w-full flex justify-center">
            <TelecomTwinCard />
          </div>

        </div>
      </div>
    </section>
  );
};
