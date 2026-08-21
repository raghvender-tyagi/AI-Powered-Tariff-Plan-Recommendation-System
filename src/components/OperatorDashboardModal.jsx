import React from 'react';
import { X, BarChart2, TrendingUp, Users, DollarSign, Award } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line, Legend } from 'recharts';
import { OPERATOR_METRICS, USAGE_HISTORICAL_DATA } from '../data/plansData';
import { usePlanStore } from '../store/usePlanStore';

export const OperatorDashboardModal = () => {
  const { isOperatorDashboardOpen, setOperatorDashboardOpen } = usePlanStore();

  if (!isOperatorDashboardOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100 p-6 sm:p-8 relative">
        
        {/* Close Button */}
        <button
          onClick={() => setOperatorDashboardOpen(false)}
          className="absolute top-6 right-6 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600">
            <BarChart2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Operator Intelligence Dashboard
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Live market ranking, tariff pricing comparison & usage trends across Jio, Airtel, Vi, BSNL
            </p>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="flex items-center space-x-2 text-slate-400 text-xs font-bold uppercase mb-1">
              <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
              <span>Lowest Avg Price</span>
            </div>
            <p className="text-xl font-extrabold text-slate-900">BSNL (₹249)</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="flex items-center space-x-2 text-slate-400 text-xs font-bold uppercase mb-1">
              <Award className="w-3.5 h-3.5 text-brand-500" />
              <span>Top Match Score</span>
            </div>
            <p className="text-xl font-extrabold text-slate-900">Jio (96%)</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="flex items-center space-x-2 text-slate-400 text-xs font-bold uppercase mb-1">
              <TrendingUp className="w-3.5 h-3.5 text-cyanBrand-600" />
              <span>Fastest 5G</span>
            </div>
            <p className="text-xl font-extrabold text-slate-900">315 Mbps</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="flex items-center space-x-2 text-slate-400 text-xs font-bold uppercase mb-1">
              <Users className="w-3.5 h-3.5 text-purple-500" />
              <span>Active Subscriptions</span>
            </div>
            <p className="text-xl font-extrabold text-slate-900">1.13 Billion</p>
          </div>
        </div>

        {/* Recharts Analytics Graphs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          
          {/* Chart 1: Average Monthly Price vs SmartFit Match Score */}
          <div className="p-5 rounded-2xl bg-sky-50/40 border border-sky-100">
            <h4 className="text-sm font-extrabold text-slate-800 mb-4">
              Operator Average Plan Price (₹)
            </h4>
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={OPERATOR_METRICS}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="name" stroke="#64748B" fontSize={12} />
                  <YAxis stroke="#64748B" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #E2E8F0' }}
                  />
                  <Bar dataKey="averageCost" fill="#0066FF" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Usage Curve Progression */}
          <div className="p-5 rounded-2xl bg-sky-50/40 border border-sky-100">
            <h4 className="text-sm font-extrabold text-slate-800 mb-4">
              Your Telecom Twin Usage Growth (GB & Min)
            </h4>
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={USAGE_HISTORICAL_DATA}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="month" stroke="#64748B" fontSize={12} />
                  <YAxis stroke="#64748B" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #E2E8F0' }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="dataGB" name="Data (GB)" stroke="#00D8F6" strokeWidth={3} />
                  <Line type="monotone" dataKey="voiceMin" name="Voice (Min/10)" stroke="#0066FF" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* Footer Action */}
        <div className="flex justify-end pt-4 border-t border-slate-100">
          <button
            onClick={() => setOperatorDashboardOpen(false)}
            className="bg-[#0077FF] text-white font-semibold text-sm px-6 py-2.5 rounded-full hover:bg-brand-700 transition-colors"
          >
            Close Dashboard
          </button>
        </div>

      </div>
    </div>
  );
};
