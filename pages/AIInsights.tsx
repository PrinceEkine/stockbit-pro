import React, { useState, useEffect } from 'react';
import { Sparkles, RefreshCw, Zap, TrendingUp, AlertTriangle, ShieldCheck, PieChart, Activity, ExternalLink, Globe, BookOpen, Leaf, Lock } from 'lucide-react';
import { AppState } from '../types';
import { getInventoryInsights, InsightResult } from '../services/geminiService';

interface AIInsightsProps {
  state: AppState;
}

const AIInsights: React.FC<AIInsightsProps> = ({ state }) => {
  const [insightData, setInsightData] = useState<InsightResult | null>(null);
  const [loading, setLoading] = useState(false);

  const isMegaPro = state.currentUser?.plan === 'mega_pro';

  const fetchInsights = async () => {
    setLoading(true);
    // Passing sustainability score context into the AI engine
    const result = await getInventoryInsights(state?.products || [], state?.sales || []);
    setInsightData(result);
    setLoading(false);
  };

  useEffect(() => {
    if (state && !insightData) fetchInsights();
  }, []);

  const highVelocityItems = (state?.sales || [])
    .slice(0, 5)
    .flatMap(s => s.items || [])
    .reduce((acc: any, item) => {
      acc[item.productName] = (acc[item.productName] || 0) + item.quantity;
      return acc;
    }, {});

  const sortedVelocity = Object.entries(highVelocityItems)
    .sort(([, a]: any, [, b]: any) => b - a)
    .slice(0, 3);

  const riskItems = (state?.products || [])
    .filter(p => p.quantity <= (p.min_threshold || 0))
    .slice(0, 3);

  const lowSustainabilityItems = (state?.products || [])
    .filter(p => (p.sustainability_score || 0) < 40)
    .slice(0, 3);

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">
            Market Intelligence
          </h1>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-1 flex items-center gap-2">
            <Activity size={14} className="text-indigo-600" /> Advanced Gemini 3 Predictive Engine
          </p>
        </div>
        <button 
          onClick={fetchInsights}
          disabled={loading}
          className="bg-slate-900 dark:bg-white dark:text-slate-900 text-white px-8 py-3 rounded-2xl flex items-center gap-3 font-black text-[10px] uppercase tracking-widest transition-all shadow-xl active:scale-95 disabled:opacity-50"
        >
          {loading ? <RefreshCw size={18} className="animate-spin" /> : <RefreshCw size={18} />}
          Generate Predictive Roadmap
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          {/* Main Insights Panel */}
          <div className="bg-white dark:bg-slate-900 p-8 md:p-10 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group">
            <Sparkles className="absolute -top-10 -right-10 text-indigo-500/5 w-64 h-64 rotate-12 group-hover:scale-110 transition-transform duration-1000" />
            
            <div className="flex items-center justify-between mb-10">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/30">
                     <ShieldCheck size={24} />
                  </div>
                  <div>
                     <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Executive Strategy</h2>
                     <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Real-time Data & Market Correlation</p>
                  </div>
               </div>
               {loading && (
                 <div className="px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-full text-[9px] font-black uppercase tracking-widest animate-pulse">
                   Researching Trends...
                 </div>
               )}
            </div>

            {loading ? (
              <div className="space-y-6">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="flex gap-4 animate-pulse">
                    <div className="w-2 h-16 bg-slate-100 dark:bg-slate-800 rounded-full"></div>
                    <div className="flex-1 space-y-2 py-1">
                       <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-1/4"></div>
                       <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-full"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : insightData ? (
              <div className="space-y-10">
                <div className="prose prose-slate dark:prose-invert max-w-none text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-line font-medium text-sm">
                  {insightData.text}
                </div>

                {insightData.sources.length > 0 && (
                  <div className="pt-8 border-t border-slate-50 dark:border-slate-800">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                      <Globe size={14} className="text-indigo-500" /> Research Sources & Market Data
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {insightData.sources.map((source, i) => (
                        <a 
                          key={i} 
                          href={source.uri} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between group hover:border-indigo-200 transition-all"
                        >
                          <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 truncate pr-4">{source.title}</span>
                          <ExternalLink size={12} className="text-slate-400 group-hover:text-indigo-600 shrink-0" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-20 bg-slate-50 dark:bg-slate-800/50 rounded-[2rem] border-2 border-dashed border-slate-200 dark:border-slate-700">
                <BookOpen size={48} className="mx-auto mb-4 text-slate-200" />
                <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest">Tap the button above to begin analysis</p>
              </div>
            )}
          </div>

          {/* Sustainability Audit Section - MEGA PRO ONLY */}
          <div className="bg-white dark:bg-slate-900 p-8 md:p-10 rounded-[3rem] border-2 border-emerald-500/20 shadow-sm relative overflow-hidden group">
            <Leaf className={`absolute -top-10 -right-10 text-emerald-500/5 w-64 h-64 rotate-12 group-hover:scale-110 transition-transform duration-1000 ${!isMegaPro ? 'grayscale opacity-10' : ''}`} />
            
            <div className="flex items-center justify-between mb-8">
               <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 ${isMegaPro ? 'bg-emerald-600' : 'bg-slate-200 dark:bg-slate-800'} text-white rounded-2xl flex items-center justify-center shadow-lg`}>
                     <Leaf size={24} />
                  </div>
                  <div>
                     <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Sustainability Audit</h2>
                     <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Environmental Risk Analysis</p>
                  </div>
               </div>
               {!isMegaPro && (
                 <div className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
                   <Lock size={12} /> Upgrade to Mega Pro
                 </div>
               )}
            </div>

            {isMegaPro ? (
              <div className="space-y-6">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400 leading-relaxed">
                  The AI is evaluating the supply chain footprint and eco-reliability of your current stock. High priority is placed on items with a Sustainability Score below 40%.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                   <div className="p-5 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100 dark:border-emerald-800/50">
                      <p className="text-[9px] font-black uppercase text-emerald-600 mb-2 tracking-widest">Average Portfolio Score</p>
                      <h4 className="text-3xl font-black text-emerald-700">
                        {Math.round((state.products.reduce((a,b)=>a+(b.sustainability_score||0),0) / (state.products.length||1)))}%
                      </h4>
                   </div>
                   <div className="p-5 bg-amber-50 dark:bg-amber-900/10 rounded-2xl border border-amber-100 dark:border-amber-800/50">
                      <p className="text-[9px] font-black uppercase text-amber-600 mb-2 tracking-widest">Eco-Risks Detected</p>
                      <h4 className="text-3xl font-black text-amber-700">{lowSustainabilityItems.length} Items</h4>
                   </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-10">
                <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest max-w-xs mx-auto">
                  Unlock the Sustainability Hub to track ecological impact and minimize supply chain waste.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-4 space-y-8">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-3">
              <TrendingUp size={16} className="text-emerald-500" /> Top Sales Velocity
            </h3>
            <div className="space-y-6">
              {sortedVelocity.map(([name, qty]: any, i) => (
                <div key={i} className="flex items-center gap-5">
                  <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center font-black text-xs shadow-inner">
                    #{i+1}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight truncate w-32">{name}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{qty} units sold recently</p>
                  </div>
                </div>
              ))}
              {sortedVelocity.length === 0 && (
                 <p className="text-center py-6 text-[10px] text-slate-400 font-black uppercase tracking-widest">No Recent Data</p>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-3">
              <AlertTriangle size={16} className="text-amber-500" /> Critical Stockouts
            </h3>
            <div className="space-y-6">
              {riskItems.map((p, i) => (
                <div key={i} className="flex items-center gap-5">
                  <div className="w-12 h-12 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-2xl flex items-center justify-center font-black text-xs shadow-inner">
                    !
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight truncate w-32">{p.name}</p>
                    <p className="text-[10px] text-rose-500 font-bold uppercase tracking-widest">{p.quantity} Units Left (Warn at {p.min_threshold})</p>
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