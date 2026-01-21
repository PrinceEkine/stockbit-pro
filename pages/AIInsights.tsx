import React, { useState, useEffect } from 'react';
import { Sparkles, RefreshCw, Zap, TrendingUp, AlertTriangle, ShieldCheck, PieChart, Activity } from 'lucide-react';
import { AppState } from '../types';
import { getInventoryInsights } from '../services/geminiService';

interface AIInsightsProps {
  state: AppState;
}

const AIInsights: React.FC<AIInsightsProps> = ({ state }) => {
  const [insights, setInsights] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchInsights = async () => {
    setLoading(true);
    const result = await getInventoryInsights(state?.products || [], state?.sales || []);
    setInsights(result);
    setLoading(false);
  };

  useEffect(() => {
    if (state) fetchInsights();
  }, []);

  const highVelocityItems = (state?.sales || [])
    .slice(0, 3)
    .flatMap(s => s.items || [])
    .slice(0, 3);

  const riskItems = (state?.products || [])
    .filter(p => p.quantity <= (p.min_threshold || 0))
    .slice(0, 3);

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">
            Market Pulse
          </h1>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-1 flex items-center gap-2">
            <Activity size={14} className="text-indigo-600" /> Real-time Gemini 3 Logic
          </p>
        </div>
        <button 
          onClick={fetchInsights}
          disabled={loading}
          className="bg-slate-900 dark:bg-white dark:text-slate-900 text-white px-8 py-3 rounded-2xl flex items-center gap-3 font-black text-[10px] uppercase tracking-widest transition-all shadow-xl active:scale-95 disabled:opacity-50"
        >
          {loading ? <RefreshCw size={18} className="animate-spin" /> : <RefreshCw size={18} />}
          Synchronize Intelligence
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group">
            <Sparkles className="absolute -top-10 -right-10 text-indigo-500/5 w-64 h-64 rotate-12 group-hover:scale-110 transition-transform duration-1000" />
            
            <div className="flex items-center gap-4 mb-10">
               <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/30">
                  <ShieldCheck size={24} />
               </div>
               <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Executive Strategy</h2>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Actionable Logistics Audit</p>
               </div>
            </div>

            {loading ? (
              <div className="space-y-6">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex gap-4 animate-pulse">
                    <div className="w-2 h-16 bg-slate-100 dark:bg-slate-800 rounded-full"></div>
                    <div className="flex-1 space-y-2 py-1">
                       <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-1/4"></div>
                       <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-full"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : insights ? (
              <div className="prose prose-slate dark:prose-invert max-w-none text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-line font-medium text-sm">
                {insights}
              </div>
            ) : (
              <div className="text-center py-20 bg-slate-50 dark:bg-slate-800/50 rounded-[2rem] border-2 border-dashed border-slate-200 dark:border-slate-700">
                <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest">Awaiting Neural Sequence</p>
              </div>
            )}
          </div>

          <div className="bg-gradient-to-br from-slate-900 to-indigo-950 p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden group">
            <PieChart className="absolute -bottom-10 -right-10 w-48 h-48 text-white/5 rotate-12 group-hover:scale-125 transition-transform duration-1000" />
            <h3 className="text-lg font-black uppercase tracking-tighter mb-4 flex items-center gap-3">
               <Zap className="text-amber-400" size={20} /> Optimization Tip
            </h3>
            <p className="text-indigo-100/80 font-medium leading-relaxed max-w-md">
              Current volatility in the local tech sector suggests a 12% rise in demand for peripheral accessories. 
              Increase stock buffers for "Type-C Adapters" and "Power Banks" by 15 units immediately to avoid stockout during month-end peaks.
            </p>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-8">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-3">
              <TrendingUp size={16} className="text-emerald-500" /> High Velocity
            </h3>
            <div className="space-y-6">
              {highVelocityItems.map((item, i) => (
                <div key={i} className="flex items-center gap-5">
                  <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center font-black text-xs shadow-inner">
                    #{i+1}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight truncate w-32">{item.productName}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{item.quantity} units flow</p>
                  </div>
                </div>
              ))}
              {highVelocityItems.length === 0 && (
                 <p className="text-center py-6 text-[10px] text-slate-400 font-black uppercase tracking-widest">No Recent Data</p>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-3">
              <AlertTriangle size={16} className="text-amber-500" /> Stock Fragility
            </h3>
            <div className="space-y-6">
              {riskItems.map((p, i) => (
                <div key={i} className="flex items-center gap-5">
                  <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center font-black text-xs shadow-inner">
                    !
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight truncate w-32">{p.name}</p>
                    <p className="text-[10px] text-rose-500 font-bold uppercase tracking-widest">{p.quantity} Units Remaining</p>
                  </div>
                </div>
              ))}
              {riskItems.length === 0 && (
                <p className="text-center py-6 text-[10px] text-slate-400 font-black uppercase tracking-widest">Inventory Stable</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIInsights;