import React, { useState } from 'react';
import { Wifi, PhoneCall, Radio, CreditCard, Sparkles, SlidersHorizontal } from 'lucide-react';
import { usePlanStore } from '../store/usePlanStore';

export const TelecomTwinCard = () => {
  const { usage, setUsageField, isDarkMode } = usePlanStore();
  const [activeTab, setActiveTab] = useState(null);

  // SVG Gauge calculations for circular progress
  const score = usage.matchScore || 96;
  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className={`relative w-full max-w-lg mx-auto backdrop-blur-xl rounded-[32px] p-6 sm:p-7 border shadow-2xl transition-all duration-300 ${
      isDarkMode
        ? 'bg-slate-900/90 border-slate-800 shadow-slate-950/70 text-white'
        : 'bg-white/95 border-sky-100/80 shadow-sky-900/10 text-slate-900'
    }`}>
      
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center space-x-2">
          <span className={`text-xs font-bold tracking-wider uppercase ${isDarkMode ? 'text-cyan-400' : 'text-[#0070F3]'}`}>
            YOUR TELECOM TWIN
          </span>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ${
            isDarkMode ? 'bg-cyan-950 text-cyan-300' : 'bg-sky-100/70 text-[#0070F3]'
          }`}>
            <Sparkles className="w-3 h-3" /> Interactive
          </span>
        </div>

        {/* Live Signal Badge */}
        <div className={`flex items-center space-x-2 border text-xs font-semibold px-3 py-1 rounded-full shadow-sm ${
          isDarkMode 
            ? 'bg-emerald-950/50 border-emerald-800/80 text-emerald-400' 
            : 'bg-emerald-50 border-emerald-200/60 text-emerald-700'
        }`}>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse pulse-green" />
          <span>Live signal</span>
        </div>
      </div>

      {/* 2x2 Usage Metrics Grid */}
      <div className="grid grid-cols-2 gap-3.5 mb-5">

        {/* Data Metric */}
        <div 
          onClick={() => setActiveTab(activeTab === 'data' ? null : 'data')}
          className={`p-4 rounded-2xl border transition-all duration-200 cursor-pointer group ${
            activeTab === 'data' 
              ? 'border-cyan-400 ring-2 ring-cyan-500/20 shadow-md' 
              : isDarkMode
              ? 'bg-slate-850 border-slate-800 hover:border-cyan-500/40 hover:bg-slate-800'
              : 'bg-[#F8FAFC] border-[#EEF4FB] hover:border-[#0070F3]/40 hover:bg-white hover:shadow-md'
          }`}
        >
          <div className={`w-9 h-9 rounded-full flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform ${
            isDarkMode ? 'bg-cyan-950 text-cyan-400' : 'bg-[#EBF5FF] text-[#0070F3]'
          }`}>
            <Wifi className="w-4 h-4 stroke-[2.5]" />
          </div>
          <p className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">DATA</p>
          <p className={`text-xl sm:text-2xl font-extrabold mt-0.5 ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>{usage.dataGB} GB</p>
        </div>

        {/* Voice Metric */}
        <div 
          onClick={() => setActiveTab(activeTab === 'voice' ? null : 'voice')}
          className={`p-4 rounded-2xl border transition-all duration-200 cursor-pointer group ${
            activeTab === 'voice' 
              ? 'border-cyan-400 ring-2 ring-cyan-500/20 shadow-md' 
              : isDarkMode
              ? 'bg-slate-850 border-slate-800 hover:border-cyan-500/40 hover:bg-slate-800'
              : 'bg-[#F8FAFC] border-[#EEF4FB] hover:border-[#0070F3]/40 hover:bg-white hover:shadow-md'
          }`}
        >
          <div className={`w-9 h-9 rounded-full flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform ${
            isDarkMode ? 'bg-cyan-950 text-cyan-400' : 'bg-[#EBF5FF] text-[#0070F3]'
          }`}>
            <PhoneCall className="w-4 h-4 stroke-[2.5]" />
          </div>
          <p className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">VOICE</p>
          <p className={`text-xl sm:text-2xl font-extrabold mt-0.5 ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>{usage.voiceMin} MIN</p>
        </div>

        {/* 5G Metric */}
        <div 
          onClick={() => setActiveTab(activeTab === '5g' ? null : '5g')}
          className={`p-4 rounded-2xl border transition-all duration-200 cursor-pointer group ${
            activeTab === '5g' 
              ? 'border-cyan-400 ring-2 ring-cyan-500/20 shadow-md' 
              : isDarkMode
              ? 'bg-slate-850 border-slate-800 hover:border-cyan-500/40 hover:bg-slate-800'
              : 'bg-[#F8FAFC] border-[#EEF4FB] hover:border-[#0070F3]/40 hover:bg-white hover:shadow-md'
          }`}
        >
          <div className={`w-9 h-9 rounded-full flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform ${
            isDarkMode ? 'bg-cyan-950 text-cyan-400' : 'bg-[#EBF5FF] text-[#0070F3]'
          }`}>
            <Radio className="w-4 h-4 stroke-[2.5]" />
          </div>
          <p className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">5G</p>
          <p className={`text-xl sm:text-2xl font-extrabold mt-0.5 ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>{usage.data5GGB} GB</p>
        </div>

        {/* Monthly Spend Metric */}
        <div 
          onClick={() => setActiveTab(activeTab === 'spend' ? null : 'spend')}
          className={`p-4 rounded-2xl border transition-all duration-200 cursor-pointer group ${
            activeTab === 'spend' 
              ? 'border-cyan-400 ring-2 ring-cyan-500/20 shadow-md' 
              : isDarkMode
              ? 'bg-slate-850 border-slate-800 hover:border-cyan-500/40 hover:bg-slate-800'
              : 'bg-[#F8FAFC] border-[#EEF4FB] hover:border-[#0070F3]/40 hover:bg-white hover:shadow-md'
          }`}
        >
          <div className={`w-9 h-9 rounded-full flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform ${
            isDarkMode ? 'bg-cyan-950 text-cyan-400' : 'bg-[#EBF5FF] text-[#0070F3]'
          }`}>
            <CreditCard className="w-4 h-4 stroke-[2.5]" />
          </div>
          <p className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">MONTHLY SPEND</p>
          <p className={`text-xl sm:text-2xl font-extrabold mt-0.5 ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>₹{usage.monthlySpend}</p>
        </div>

      </div>

      {/* Interactive Usage Slider Control Drawer (when tab clicked) */}
      {activeTab && (
        <div className={`mb-5 p-4 rounded-2xl border animate-fadeIn ${
          isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-gradient-to-r from-sky-50 to-blue-50/50 border-sky-200/80'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-xs font-bold flex items-center gap-1.5 ${isDarkMode ? 'text-cyan-300' : 'text-slate-700'}`}>
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Adjust {activeTab.toUpperCase()} Signal
            </span>
            <button 
              onClick={() => setActiveTab(null)}
              className="text-[11px] font-semibold text-slate-400 hover:text-slate-200"
            >
              Done
            </button>
          </div>

          {activeTab === 'data' && (
            <div>
              <input 
                type="range" min="10" max="150" value={usage.dataGB}
                onChange={(e) => setUsageField('dataGB', e.target.value)}
                className="w-full h-2 bg-sky-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-semibold">
                <span>10 GB</span>
                <span>{usage.dataGB} GB</span>
                <span>150 GB</span>
              </div>
            </div>
          )}

          {activeTab === 'voice' && (
            <div>
              <input 
                type="range" min="100" max="2500" step="50" value={usage.voiceMin}
                onChange={(e) => setUsageField('voiceMin', e.target.value)}
                className="w-full h-2 bg-sky-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-semibold">
                <span>100 MIN</span>
                <span>{usage.voiceMin} MIN</span>
                <span>2500 MIN</span>
              </div>
            </div>
          )}

          {activeTab === '5g' && (
            <div>
              <input 
                type="range" min="0" max="100" value={usage.data5GGB}
                onChange={(e) => setUsageField('data5GGB', e.target.value)}
                className="w-full h-2 bg-sky-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-semibold">
                <span>0 GB</span>
                <span>{usage.data5GGB} GB 5G</span>
                <span>100 GB</span>
              </div>
            </div>
          )}

          {activeTab === 'spend' && (
            <div>
              <input 
                type="range" min="149" max="999" step="10" value={usage.monthlySpend}
                onChange={(e) => setUsageField('monthlySpend', e.target.value)}
                className="w-full h-2 bg-sky-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-semibold">
                <span>₹149</span>
                <span>₹{usage.monthlySpend}</span>
                <span>₹999</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Bottom Score Gauge Display */}
      <div className={`relative rounded-2xl p-6 text-center border overflow-hidden ${
        isDarkMode ? 'bg-slate-950/80 border-slate-800' : 'bg-[#EAF4FF] border-[#DDECFF]'
      }`}>
        
        {/* SVG Ring Gauge */}
        <div className="relative w-44 h-44 mx-auto flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
            {/* Track Circle */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              className={isDarkMode ? 'stroke-slate-800' : 'stroke-sky-200/80'}
              strokeWidth="12"
              fill="transparent"
            />
            {/* Progress Circle with Cyan Gradient */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              stroke="url(#blueCyanGradient)"
              strokeWidth="12"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-700 ease-out"
            />
            <defs>
              <linearGradient id="blueCyanGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0066FF" />
                <stop offset="100%" stopColor="#00D8F6" />
              </linearGradient>
            </defs>
          </svg>

          {/* Centered Score Text */}
          <div className="absolute flex flex-col items-center justify-center inset-0 text-center">
            <span className={`text-4xl font-extrabold tracking-tight ${isDarkMode ? 'text-cyan-400' : 'text-[#0070F3]'}`}>
              {score}%
            </span>
            <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase mt-0.5">
              SMARTFIT SCORE
            </span>
          </div>
        </div>

        {/* Caption */}
        <p className="text-xs font-medium text-slate-400 max-w-xs mx-auto mt-2">
          Fit of your best-match plan against your projected usage
        </p>

      </div>

    </div>
  );
};
