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
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 max-w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">AI Intelligence</h2>
          <p className="text-sm text-slate-500">
            Powered by Gemini, providing predictive insights and strategic recommendations.
          </p>
        </div>
        <button 
          onClick={fetchInsights}
          disabled={loading}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl flex items-center gap-2 font-bold text-sm transition-all shadow-lg shadow-indigo-600/20 active:scale-95 disabled:opacity-50"
        >
          {loading ? <RefreshCw size={18} className="animate-spin" /> : <Sparkles size={18} />}
          Refresh Insights
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          {/* Main Insights Panel */}
          <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
            <div className="flex items-center justify-between mb-8">
               <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-50 dark:bg-indigo-900/10 text-indigo-600 rounded-xl">
                     <ShieldCheck size={20} />
                  </div>
                  <div>
                     <h3 className="text-lg font-bold text-slate-900 dark:text-white">Inventory Strategy</h3>
                     <p className="text-xs text-slate-400">Analysis based on current stock levels and historical sales.</p>
                  </div>
               </div>
            </div>

            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="space-y-2 animate-pulse">
                     <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-1/4"></div>
                     <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-full"></div>
                     <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-5/6"></div>
                  </div>
                ))}
              </div>
            ) : insightData ? (
              <div className="space-y-8">
                <div className="prose prose-slate dark:prose-invert max-w-none text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-line text-sm border-none shadow-none">
                  {insightData.text}
                </div>

                {insightData.sources.length > 0 && (
                  <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                    <h4 className="text-xs font-bold text-slate-500 mb-4 flex items-center gap-2">
                       <Globe size={14} className="text-indigo-400" /> Research & Citations
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {insightData.sources.map((source, i) => (
                        <a 
                          key={i} 
                          href={source.uri} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-between group hover:border-indigo-300 transition-all"
                        >
                          <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 truncate max-w-[150px]">{source.title}</span>
                          <ExternalLink size={12} className="text-slate-400 group-hover:text-indigo-600 shrink-0" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-20 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl">
                <BookOpen size={48} className="mx-auto mb-4 text-slate-100 dark:text-slate-800" />
                <p className="text-slate-400 font-medium text-sm">Click the refresh button to generate your business insights</p>
              </div>
            )}
          </div>

          {/* Sustainability Audit Section */}
          <div className={`bg-white dark:bg-slate-900 p-6 md:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group ${!isMegaPro ? 'opacity-70 grayscale' : ''}`}>
            <div className="flex items-center justify-between mb-8">
               <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${isMegaPro ? 'bg-emerald-50 dark:bg-emerald-900/10 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                     <Leaf size={20} />
                  </div>
                  <div>
                     <h3 className="text-lg font-bold text-slate-900 dark:text-white">ESG Impact Audit</h3>
                     <p className="text-xs text-slate-400">Environmental and supply chain reliability check.</p>
                  </div>
               </div>
               {!isMegaPro && (
                 <div className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-bold flex items-center gap-2">
                   <Lock size={12} /> Pro-Feature
                 </div>
               )}
            </div>

            {isMegaPro ? (
              <div className="space-y-6">
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
                  Evaluating supply chain sustainability scores. Prioritizing re-sourcing for items with low environmental reliability ratings.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                   <div className="p-4 bg-emerald-50 dark:bg-emerald-900/5 rounded-xl border border-emerald-100 dark:border-emerald-800">
                      <p className="text-[10px] font-bold uppercase text-emerald-600 mb-1 tracking-wider">Average Compliance</p>
                      <h4 className="text-2xl font-bold text-emerald-700 dark:text-emerald-500">
                        {Math.round((state.products.reduce((a,b)=>a+(b.sustainability_score||0),0) / (state.products.length||1)))}%
                      </h4>
                   </div>
                   <div className="p-4 bg-amber-50 dark:bg-amber-900/5 rounded-xl border border-amber-100 dark:border-amber-800">
                      <p className="text-[10px] font-bold uppercase text-amber-600 mb-1 tracking-wider">Risk Identifiers</p>
                      <h4 className="text-2xl font-bold text-amber-700 dark:text-amber-500">{lowSustainabilityItems.length} SKUs</h4>
                   </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-slate-500 text-xs font-medium max-w-xs mx-auto">
                  Upgrade your plan to unlock ESG tracking and sustainable supply chain analytics.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-4 space-y-8">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-6 flex items-center gap-2">
              <TrendingUp size={16} className="text-emerald-500" /> High Velocity
            </h3>
            <div className="space-y-4">
              {sortedVelocity.map(([name, qty]: any, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-slate-50 dark:bg-slate-800 text-indigo-600 rounded-lg flex items-center justify-center font-bold text-xs">
                    {i+1}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 dark:text-white uppercase truncate">{name}</p>
                    <p className="text-[10px] text-slate-400 font-bold">{qty} units sold recently</p>
                  </div>
                </div>
              ))}
              {sortedVelocity.length === 0 && (
                 <p className="text-center py-4 text-xs text-slate-400">No sales data available</p>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-6 flex items-center gap-2">
              <AlertTriangle size={16} className="text-amber-500" /> Low Stock Risks
            </h3>
            <div className="space-y-4">
              {riskItems.map((p, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-rose-50 dark:bg-rose-900/20 text-rose-600 rounded-lg flex items-center justify-center">
                    <AlertTriangle size={14} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 dark:text-white uppercase truncate">{p.name}</p>
                    <p className="text-[10px] text-rose-500 font-bold">{p.quantity} Units (Threshold: {p.min_threshold})</p>
                  </div>
                </div>
              ))}
              {riskItems.length === 0 && (
                <p className="text-center py-4 text-xs text-slate-400">All stock levels normalized</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIInsights;