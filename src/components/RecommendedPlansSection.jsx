import React, { useState, useRef } from 'react';
import { Sparkles, Check, ChevronLeft, ChevronRight, Phone, Wifi, MessageSquare, Music, Shield, Award, Crown, Globe } from 'lucide-react';
import { PLANS_DATA, TELECOM_PROVIDERS } from '../data/plansData';
import { usePlanStore } from '../store/usePlanStore';

export const RecommendedPlansSection = () => {
  const { setCompareModalOpen, setSelectedPlan, selectedTelecom, setSelectedTelecom, isDarkMode } = usePlanStore();
  const [activePlanIndices, setActivePlanIndices] = useState({
    jio: 0,
    airtel: 0,
    vi: 0,
    bsnl: 0,
  });

  const scrollContainerRefs = useRef({});

  // Filter plans for the active selected telecom slug
  const activePlansForOperator = PLANS_DATA.filter(
    (p) => p.operatorSlug === selectedTelecom
  );

  const currentPlanIndex = activePlanIndices[selectedTelecom] || 0;
  const currentPlan = activePlansForOperator[currentPlanIndex] || activePlansForOperator[0] || PLANS_DATA[0];

  const handlePrevPlan = (slug) => {
    const plans = PLANS_DATA.filter((p) => p.operatorSlug === slug);
    if (!plans.length) return;
    setActivePlanIndices((prev) => {
      const curr = prev[slug] || 0;
      const nextIdx = (curr - 1 + plans.length) % plans.length;
      return { ...prev, [slug]: nextIdx };
    });
  };

  const handleNextPlan = (slug) => {
    const plans = PLANS_DATA.filter((p) => p.operatorSlug === slug);
    if (!plans.length) return;
    setActivePlanIndices((prev) => {
      const curr = prev[slug] || 0;
      const nextIdx = (curr + 1) % plans.length;
      return { ...prev, [slug]: nextIdx };
    });
  };

  const handleScrollLeft = (slug) => {
    if (scrollContainerRefs.current[slug]) {
      scrollContainerRefs.current[slug].scrollBy({ left: -320, behavior: 'smooth' });
    }
  };

  const handleScrollRight = (slug) => {
    if (scrollContainerRefs.current[slug]) {
      scrollContainerRefs.current[slug].scrollBy({ left: 320, behavior: 'smooth' });
    }
  };

  return (
    <section 
      id="perfect-plan-section" 
      className={`py-16 transition-colors duration-300 relative border-t ${
        isDarkMode 
          ? 'bg-slate-950 text-white border-slate-800' 
          : 'bg-[#F4F9FF] text-slate-900 border-sky-100'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="space-y-4 mb-10 text-center sm:text-left">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-sky-50 dark:bg-slate-800 border border-sky-200 dark:border-slate-700 text-brand-600 dark:text-cyan-400">
            <Sparkles className="w-4 h-4" />
            <span className="text-xs sm:text-sm font-semibold tracking-tight">Price plan recommendation</span>
          </div>

          <h2 className={`text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
            Best-fit tariff plans across Jio, Airtel, Vi and BSNL.
          </h2>

          <p className={`text-base sm:text-lg max-w-3xl leading-relaxed ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
            SmartFit ranks live tariffs matching your exact usage curve. Browse featured recommendation cards or scroll through every telecom provider's plans.
          </p>
        </div>

        {/* Featured Recommendation Banner Card (Exact Image Match) */}
        {currentPlan && (
          <div className="mb-12">
            <PlanBannerCard 
              plan={currentPlan} 
              onPrev={() => handlePrevPlan(currentPlan.operatorSlug)}
              onNext={() => handleNextPlan(currentPlan.operatorSlug)}
              onSelectTelecom={(slug) => setSelectedTelecom(slug)}
              selectedTelecom={selectedTelecom}
              onSeeFullRec={() => setCompareModalOpen(true, currentPlan)}
              onCompare={() => setCompareModalOpen(true, currentPlan)}
              isDarkMode={isDarkMode}
            />
          </div>
        )}

        {/* Section Title for Telecom Scrollbars */}
        <div className="mt-14 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-4 border-slate-200 dark:border-slate-800">
          <div>
            <h3 className={`text-2xl font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              Browse Tariff Plans by Telecom Operator
            </h3>
            <p className={`text-xs sm:text-sm mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Scroll left and right for every telecom operator to compare all available packages.
            </p>
          </div>

          {/* Operator Selector Filter Buttons */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
            <button
              onClick={() => setSelectedTelecom('all')}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                selectedTelecom === 'all'
                  ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/30 scale-105'
                  : isDarkMode
                  ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              ALL OPERATORS
            </button>
            {TELECOM_PROVIDERS.map((provider) => (
              <button
                key={provider.id}
                onClick={() => setSelectedTelecom(provider.id)}
                className={`px-4 py-2 rounded-full text-xs font-bold uppercase transition-all whitespace-nowrap ${
                  selectedTelecom === provider.id
                    ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/30 scale-105'
                    : isDarkMode
                    ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {provider.name}
              </button>
            ))}
          </div>
        </div>

        {/* Scroll Bar for Every Telecom Operator */}
        <div className="space-y-10">
          {TELECOM_PROVIDERS.filter(
            (prov) => selectedTelecom === 'all' || selectedTelecom === prov.id
          ).map((provider) => {
            const providerPlans = PLANS_DATA.filter((p) => p.operatorSlug === provider.id);
            return (
              <div 
                key={provider.id} 
                className={`p-6 rounded-3xl border shadow-lg transition-all ${
                  isDarkMode 
                    ? 'bg-slate-900/70 border-slate-800 shadow-slate-950/50' 
                    : 'bg-white border-slate-200/90 shadow-slate-100'
                }`}
              >
                {/* Telecom Header Row with Scroll Arrows */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <span 
                      className="w-3.5 h-3.5 rounded-full inline-block" 
                      style={{ backgroundColor: provider.color }}
                    />
                    <h4 className={`text-xl font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                      {provider.name} Tariff Plans
                    </h4>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-sky-100 dark:bg-slate-800 text-sky-700 dark:text-cyan-400">
                      {providerPlans.length} Plans Available
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleScrollLeft(provider.id)}
                      className={`p-2 rounded-full border transition-all ${
                        isDarkMode 
                          ? 'border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700' 
                          : 'border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                      aria-label={`Scroll ${provider.name} plans left`}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleScrollRight(provider.id)}
                      className={`p-2 rounded-full border transition-all ${
                        isDarkMode 
                          ? 'border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700' 
                          : 'border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                      aria-label={`Scroll ${provider.name} plans right`}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Horizontal Scroll Bar for this Telecom */}
                <div
                  ref={(el) => (scrollContainerRefs.current[provider.id] = el)}
                  className="flex space-x-5 overflow-x-auto pb-4 pt-2 scrollbar-thin scrollbar-thumb-cyan-500 scrollbar-track-transparent scroll-smooth focus:outline-none"
                  tabIndex={0}
                  aria-label={`${provider.name} plans list`}
                >
                  {providerPlans.map((plan) => (
                    <div
                      key={plan.id}
                      className={`w-[320px] sm:w-[360px] flex-shrink-0 rounded-2xl border p-5 flex flex-col justify-between transition-all duration-300 hover:shadow-xl ${
                        isDarkMode
                          ? 'bg-slate-850 border-slate-700/80 hover:border-cyan-500/50'
                          : 'bg-slate-50 border-slate-200 hover:border-cyan-400/60'
                      }`}
                    >
                      <div>
                        {/* Top Badges */}
                        <div className="flex items-center justify-between mb-3">
                          <span className="px-2.5 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-[11px] font-bold rounded-md uppercase">
                            {plan.operator}
                          </span>
                          <span className="px-2.5 py-0.5 bg-sky-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 text-[11px] font-bold rounded-full flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            {plan.badge}
                          </span>
                        </div>

                        {/* Title & Price */}
                        <h5 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                          {plan.title}
                        </h5>
                        <div className="mt-1 flex items-baseline space-x-1">
                          <span className={`text-3xl font-extrabold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                            ₹{plan.price}
                          </span>
                          <span className="text-xs text-slate-400 font-semibold">/ {plan.period}</span>
                        </div>

                        {/* Specs checklist */}
                        <ul className="mt-4 space-y-2 text-xs">
                          {plan.features.map((feat, idx) => (
                            <li key={idx} className={`flex items-start space-x-2 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                              <Check className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                              <span>{feat}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Bottom Button */}
                      <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
                        <span className="text-[11px] font-medium text-slate-400">
                          {plan.specs.validity}
                        </span>
                        <button
                          onClick={() => setCompareModalOpen(true, plan)}
                          className="bg-cyan-500 hover:bg-cyan-600 text-white text-xs font-bold px-4 py-2 rounded-full shadow transition-all flex items-center gap-1"
                        >
                          <span>Select Plan</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};

// Sub-component: Exact Plan Banner Card matching uploaded mockups
function PlanBannerCard({ 
  plan, 
  onPrev, 
  onNext, 
  onSelectTelecom, 
  selectedTelecom, 
  onSeeFullRec, 
  onCompare, 
  isDarkMode 
}) {
  const theme = plan.posterTheme;

  return (
    <div className={`rounded-3xl border shadow-2xl overflow-hidden flex flex-col lg:flex-row transition-all duration-300 ${
      isDarkMode 
        ? 'bg-slate-900 border-slate-800 shadow-slate-950' 
        : 'bg-white border-slate-200/90 shadow-xl shadow-slate-200/50'
    }`}>
      
      {/* LEFT OPERATOR GRAPHIC POSTER */}
      <div className={`lg:w-7/12 bg-gradient-to-br ${theme.bgColor} p-6 sm:p-8 text-white flex flex-col justify-between relative overflow-hidden min-h-[380px]`}>
        
        {/* Glow blur decorations */}
        <div className="absolute -top-16 -left-16 w-56 h-56 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -right-16 w-56 h-56 bg-black/30 rounded-full blur-2xl pointer-events-none" />

        {/* Poster Top Bar */}
        <div className="relative z-10 flex items-center justify-between mb-6">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-inner">
              <Phone className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-base font-black tracking-tight leading-none">{theme.headerLogo}</p>
              <p className="text-[10px] text-white/80 font-medium tracking-wide">{theme.headerSub}</p>
            </div>
          </div>

          {/* Top Right Network Badge Pill */}
          <span className="px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-[10px] font-extrabold tracking-wider uppercase border border-white/25 shadow-sm">
            {theme.badgeText}
          </span>
        </div>

        {/* Carousel Prev Arrow */}
        <button
          onClick={onPrev}
          className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/95 text-slate-900 flex items-center justify-center shadow-2xl hover:bg-white hover:scale-110 active:scale-95 transition-all z-20"
          aria-label="Previous plan"
        >
          <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
        </button>

        {/* Carousel Next Arrow */}
        <button
          onClick={onNext}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/95 text-slate-900 flex items-center justify-center shadow-2xl hover:bg-white hover:scale-110 active:scale-95 transition-all z-20"
          aria-label="Next plan"
        >
          <ChevronRight className="w-6 h-6 stroke-[2.5]" />
        </button>

        {/* Poster Main Body (Split layout: Left title/price, Right "WHAT YOU GET" panel) */}
        <div className="relative z-10 my-auto grid grid-cols-1 md:grid-cols-2 gap-6 items-center px-4">
          
          {/* Title & Price Column */}
          <div className="space-y-4">
            <div>
              <h3 className="text-3xl sm:text-4xl font-black tracking-tight drop-shadow-md">
                {theme.posterTitle}
              </h3>
              <p className="text-xs sm:text-sm text-white/90 font-medium tracking-wide mt-1">
                {theme.posterSub}
              </p>
            </div>

            {/* Price badge */}
            <div className="inline-block p-3.5 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 shadow-lg">
              <div className="flex items-baseline space-x-1">
                <span className="text-3xl sm:text-4xl font-black tracking-tight">₹{plan.price}</span>
                <span className="text-xs text-white/80 font-semibold">/ {plan.period}</span>
              </div>
              <p className="text-[10px] font-extrabold text-cyan-200 tracking-wider uppercase mt-1">
                {theme.tagline}
              </p>
            </div>
          </div>

          {/* WHAT YOU GET / Feature Grid Box */}
          <div className="p-4 sm:p-5 rounded-2xl bg-black/25 backdrop-blur-md border border-white/20 space-y-3">
            <div className="border-b border-white/15 pb-2 flex items-center justify-between">
              <span className="text-xs font-black tracking-wider uppercase text-cyan-300">
                {theme.exclusiveLabel}
              </span>
              <span className="text-[10px] text-white/70">
                {theme.exclusiveSub}
              </span>
            </div>

            <div className="space-y-2.5">
              {theme.whatYouGet?.map((item, idx) => (
                <div key={idx} className="flex items-center space-x-3 text-xs">
                  <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                    <FeatureIcon type={item.icon} />
                  </div>
                  <div>
                    <p className="font-bold leading-tight">{item.title}</p>
                    <p className="text-[10px] text-white/70 leading-tight">{item.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Poster Bottom Bar */}
        <div className="relative z-10 mt-6 pt-4 border-t border-white/20 flex flex-wrap items-center justify-between text-[9px] sm:text-[10px] font-bold text-white/80 uppercase tracking-wider gap-2">
          <div className="flex items-center space-x-3 overflow-x-auto">
            {theme.bottomBar?.map((item, idx) => (
              <span key={idx} className="whitespace-nowrap flex items-center gap-1">
                <Shield className="w-3 h-3 text-cyan-300 inline" /> {item}
              </span>
            ))}
          </div>
          <span className="text-cyan-200 font-extrabold">{theme.footerAction}</span>
        </div>

      </div>

      {/* RIGHT INFO & ACTION PANEL */}
      <div className={`lg:w-5/12 p-6 sm:p-8 flex flex-col justify-between space-y-6 ${
        isDarkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'
      }`}>
        
        <div className="space-y-5">
          {/* Badges Row */}
          <div className="flex items-center space-x-3">
            <span className={`px-3 py-1 text-xs font-extrabold rounded-full uppercase tracking-wider ${
              isDarkMode ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-800'
            }`}>
              {plan.operator}
            </span>
            <span className="px-3 py-1 bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 text-xs font-extrabold rounded-full flex items-center gap-1 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-cyan-500" />
              {plan.badge}
            </span>
          </div>

          {/* Plan Title */}
          <div>
            <h4 className="text-2xl sm:text-3xl font-black tracking-tight">
              {plan.title}
            </h4>

            {/* Big Price Tag */}
            <div className="mt-2 flex items-baseline space-x-1">
              <span className="text-4xl sm:text-5xl font-black tracking-tight">₹{plan.price}</span>
              <span className={`text-sm font-semibold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                / {plan.period}
              </span>
            </div>
          </div>

          {/* Checkmark List */}
          <ul className="space-y-2.5 pt-2">
            {plan.features.map((feat, idx) => (
              <li key={idx} className="flex items-start space-x-2.5 text-sm font-medium">
                <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0 stroke-[3]" />
                <span className={isDarkMode ? 'text-slate-200' : 'text-slate-700'}>{feat}</span>
              </li>
            ))}
          </ul>

          {/* Recommendation Reason Box (Light blue dashed/bordered callout box) */}
          <div className={`p-4 rounded-2xl border border-dashed text-xs leading-relaxed font-medium ${
            isDarkMode 
              ? 'bg-cyan-950/40 border-cyan-800 text-cyan-200' 
              : 'bg-sky-50/80 border-sky-200 text-slate-700'
          }`}>
            {plan.reason}
          </div>
        </div>

        {/* Action Buttons Row & Telecom Selector Tabs */}
        <div className="space-y-6 pt-2">
          
          {/* Main Buttons */}
          <div className="flex items-center space-x-4">
            <button
              onClick={onSeeFullRec}
              className="bg-[#0077FF] hover:bg-[#0060DF] text-white text-sm font-bold px-6 py-3.5 rounded-full shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center space-x-2"
            >
              <span>See full recommendation</span>
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              onClick={onCompare}
              className={`text-sm font-bold hover:underline transition-colors ${
                isDarkMode ? 'text-cyan-400 hover:text-cyan-300' : 'text-[#0077FF] hover:text-[#0055CC]'
              }`}
            >
              Compare plans
            </button>
          </div>

          {/* Bottom Telecom Selector Pills (JIO | AIRTEL | VI (IDEA) | BSNL) */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-center sm:justify-start space-x-2 overflow-x-auto">
            {TELECOM_PROVIDERS.map((prov) => {
              const isActive = selectedTelecom === prov.id;
              return (
                <button
                  key={prov.id}
                  onClick={() => onSelectTelecom(prov.id)}
                  className={`px-4 py-2 rounded-full text-xs font-black uppercase transition-all duration-200 ${
                    isActive
                      ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/40 scale-105'
                      : isDarkMode
                      ? 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                      : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                  }`}
                >
                  {prov.name}
                </button>
              );
            })}
          </div>

        </div>

      </div>

    </div>
  );
}

// Icon helper function
function FeatureIcon({ type }) {
  switch (type) {
    case 'data':
      return <Wifi className="w-3.5 h-3.5 text-white" />;
    case 'call':
      return <Phone className="w-3.5 h-3.5 text-white" />;
    case 'sms':
      return <MessageSquare className="w-3.5 h-3.5 text-white" />;
    case 'tune':
      return <Music className="w-3.5 h-3.5 text-white" />;
    case 'crown':
      return <Crown className="w-3.5 h-3.5 text-white" />;
    default:
      return <Shield className="w-3.5 h-3.5 text-white" />;
  }
}
