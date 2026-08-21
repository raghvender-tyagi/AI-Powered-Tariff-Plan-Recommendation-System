import React from 'react';
import { X, Sparkles, Layers } from 'lucide-react';
import { PLANS_DATA } from '../data/plansData';
import { usePlanStore } from '../store/usePlanStore';

export const PlanComparisonModal = () => {
  const { isCompareModalOpen, setCompareModalOpen, selectedPlan, isDarkMode } = usePlanStore();

  if (!isCompareModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className={`rounded-3xl max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border p-6 sm:p-8 relative transition-colors ${
        isDarkMode 
          ? 'bg-slate-900 border-slate-800 text-white' 
          : 'bg-white border-slate-100 text-slate-900'
      }`}>
        
        {/* Close Button */}
        <button
          onClick={() => setCompareModalOpen(false)}
          className={`absolute top-6 right-6 p-2 rounded-full transition-colors ${
            isDarkMode 
              ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' 
              : 'bg-slate-100 hover:bg-slate-200 text-slate-500'
          }`}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300 flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-2xl font-extrabold tracking-tight">
              Detailed Tariff Plan Comparison
            </h3>
            <p className="text-xs text-slate-400 font-medium">
              Comparing selected {selectedPlan?.title || 'Plan'} against top operator offerings
            </p>
          </div>
        </div>

        {/* Comparison Table */}
        <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl mb-6">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className={isDarkMode ? 'bg-slate-850 border-b border-slate-800' : 'bg-slate-50 border-b border-slate-200'}>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Operator & Plan</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Price / Month</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">SmartFit Match</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Daily Data / 5G</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Voice & SMS</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Special Perk</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {PLANS_DATA.map((plan) => {
                const isSelected = selectedPlan?.id === plan.id;
                return (
                  <tr 
                    key={plan.id} 
                    className={`transition-colors ${
                      isSelected 
                        ? isDarkMode ? 'bg-cyan-950/40 font-semibold' : 'bg-sky-50/70 font-semibold' 
                        : isDarkMode ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="p-4">
                      <div className="font-extrabold flex items-center gap-2">
                        {plan.title}
                        {isSelected && (
                          <span className="px-2 py-0.5 bg-cyan-500 text-white text-[10px] rounded-full">
                            Active
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 font-normal">{plan.operator}</div>
                    </td>

                    <td className="p-4 font-black text-base">
                      ₹{plan.price}
                    </td>

                    <td className="p-4">
                      <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300">
                        <Sparkles className="w-3 h-3" />
                        {plan.matchScore}%
                      </span>
                    </td>

                    <td className="p-4 font-medium text-slate-300">
                      {plan.specs.dailyData}
                    </td>

                    <td className="p-4 font-medium text-slate-300">
                      {plan.specs.voice}
                    </td>

                    <td className="p-4 text-xs font-medium text-slate-400">
                      {plan.specs.perk}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Action Button */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setCompareModalOpen(false)}
            className="bg-[#0077FF] hover:bg-[#0060DF] text-white font-semibold text-sm px-6 py-2.5 rounded-full transition-colors"
          >
            Select Best Plan & Proceed
          </button>
        </div>

      </div>
    </div>
  );
};
