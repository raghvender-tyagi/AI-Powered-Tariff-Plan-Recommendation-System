import React from 'react';
import { Signal, Sun, Moon } from 'lucide-react';
import { usePlanStore } from '../store/usePlanStore';

export const Header = () => {
  const { setOperatorDashboardOpen, setSimulatorOpen, isDarkMode, toggleDarkMode } = usePlanStore();

  return (
    <header className={`sticky top-0 z-40 w-full backdrop-blur-md border-b shadow-sm transition-colors duration-300 ${
      isDarkMode ? 'bg-slate-900/90 border-slate-800 text-white' : 'bg-white/80 border-sky-100/60 text-slate-900'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Brand Logo */}
        <div className="flex items-center space-x-3 cursor-pointer group" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#0066FF] via-[#0099FF] to-[#00D8F6] p-0.5 shadow-md shadow-sky-500/20 group-hover:scale-105 transition-transform duration-300">
            <div className="w-full h-full bg-[#0080FF] rounded-[14px] flex items-center justify-center text-white">
              <Signal className="w-6 h-6 stroke-[2.5]" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className={`text-xl font-extrabold tracking-tight transition-colors ${isDarkMode ? 'text-white group-hover:text-cyan-400' : 'text-slate-900 group-hover:text-brand-600'}`}>
              SmartFit
            </span>
            <span className={`text-[10px] font-bold tracking-widest uppercase -mt-0.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-400'}`}>
              TELECOM PLAN ADVISOR
            </span>
          </div>
        </div>

        {/* Navigation / Actions */}
        <div className="flex items-center space-x-4 sm:space-x-6">
          <button
            onClick={() => setOperatorDashboardOpen(true)}
            className={`text-sm font-semibold transition-colors py-2 px-1 relative after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-brand-600 hover:after:w-full after:transition-all ${
              isDarkMode ? 'text-slate-200 hover:text-cyan-400' : 'text-slate-700 hover:text-brand-600'
            }`}
          >
            Operator
          </button>

          <button
            onClick={() => setSimulatorOpen(true)}
            className={`hidden sm:inline-flex text-sm font-semibold transition-colors py-2 px-1 ${
              isDarkMode ? 'text-slate-200 hover:text-cyan-400' : 'text-slate-700 hover:text-brand-600'
            }`}
          >
            Simulator
          </button>

          {/* Day / Night Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            className={`p-2.5 rounded-full transition-all duration-300 flex items-center gap-2 text-xs font-bold border shadow-inner ${
              isDarkMode 
                ? 'bg-slate-800 border-slate-700 text-amber-400 hover:bg-slate-700 hover:text-amber-300' 
                : 'bg-sky-50 border-sky-200 text-slate-700 hover:bg-sky-100 hover:text-slate-900'
            }`}
            title={isDarkMode ? 'Switch to Day Mode' : 'Switch to Night Mode'}
            aria-label="Toggle Day or Night Mode"
          >
            {isDarkMode ? (
              <>
                <Moon className="w-4 h-4 text-cyan-300 fill-cyan-300/20" />
                <span className="hidden md:inline text-cyan-300">Night</span>
              </>
            ) : (
              <>
                <Sun className="w-4 h-4 text-amber-500 fill-amber-400/30" />
                <span className="hidden md:inline text-amber-600">Day</span>
              </>
            )}
          </button>

          <button
            onClick={() => {
              const el = document.getElementById('perfect-plan-section');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="bg-[#0077FF] hover:bg-[#0060DF] text-white text-sm font-semibold px-6 py-2.5 rounded-full shadow-md shadow-blue-500/25 hover:shadow-lg hover:shadow-blue-500/35 active:scale-[0.98] transition-all duration-200"
          >
            Open App
          </button>
        </div>

      </div>
    </header>
  );
};
