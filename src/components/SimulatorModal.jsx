import React, { useState } from 'react';
import { X, Compass, Sliders, RefreshCw, CheckCircle2 } from 'lucide-react';
import { usePlanStore } from '../store/usePlanStore';

export const SimulatorModal = () => {
  const { isSimulatorOpen, setSimulatorOpen } = usePlanStore();
  const [dataGrowth, setDataGrowth] = useState(25); // percentage growth
  const [voiceGrowth, setVoiceGrowth] = useState(10);
  const [isSimulated, setIsSimulated] = useState(false);

  if (!isSimulatorOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 p-6 sm:p-8 relative">
        
        {/* Close Button */}
        <button
          onClick={() => setSimulatorOpen(false)}
          className="absolute top-6 right-6 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-cyanBrand-400 text-white flex items-center justify-center shadow-md shadow-cyan-500/20">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Telecom Usage Simulator
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Simulate future data and voice growth to stress test tariff recommendation health
            </p>
          </div>
        </div>

        {/* Simulator Controls */}
        <div className="space-y-6 mb-8">
          <div>
            <div className="flex justify-between text-sm font-bold text-slate-800 mb-2">
              <span>Projected 6-Month Data Growth</span>
              <span className="text-brand-600">+{dataGrowth}%</span>
            </div>
            <input
              type="range" min="0" max="100" step="5" value={dataGrowth}
              onChange={(e) => { setDataGrowth(Number(e.target.value)); setIsSimulated(true); }}
              className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-600"
            />
          </div>

          <div>
            <div className="flex justify-between text-sm font-bold text-slate-800 mb-2">
              <span>Projected Calling Volume Growth</span>
              <span className="text-brand-600">+{voiceGrowth}%</span>
            </div>
            <input
              type="range" min="0" max="100" step="5" value={voiceGrowth}
              onChange={(e) => { setVoiceGrowth(Number(e.target.value)); setIsSimulated(true); }}
              className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-600"
            />
          </div>
        </div>

        {/* Simulation Output Card */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-sky-50 to-blue-50/60 border border-sky-200 space-y-3 mb-6">
          <div className="flex items-center space-x-2 text-emerald-600 font-extrabold text-sm">
            <CheckCircle2 className="w-5 h-5" />
            <span>Simulation Projection Complete</span>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-1">
            <div>
              <p className="text-[11px] font-bold uppercase text-slate-400">Future Monthly Data</p>
              <p className="text-xl font-black text-slate-900">{Math.round(48 * (1 + dataGrowth / 100))} GB / mo</p>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase text-slate-400">Optimal Future Plan</p>
              <p className="text-xl font-black text-brand-600">Jio True 5G (₹299)</p>
            </div>
          </div>
          <p className="text-xs text-slate-600 font-medium">
            Your projected growth remains 100% covered under the 5G uncapped tier without incurring data overage charges.
          </p>
        </div>

        {/* Modal Actions */}
        <div className="flex justify-end space-x-3">
          <button
            onClick={() => setSimulatorOpen(false)}
            className="bg-[#0077FF] text-white font-semibold text-sm px-6 py-2.5 rounded-full hover:bg-brand-700 transition-colors"
          >
            Apply Projection to Twin
          </button>
        </div>

      </div>
    </div>
  );
};
