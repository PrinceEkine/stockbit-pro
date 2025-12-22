
import React, { useState, useEffect } from 'react';
import { Sparkles, RefreshCw, Zap, TrendingUp, AlertTriangle } from 'lucide-react';
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
    const result = await getInventoryInsights(state.products, state.sales);
    setInsights(result);
    setLoading(false);
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            AI Stock Insights <Sparkles className="text-indigo-600" size={24} />
          </h1>
          <p className="text-slate-500">Leverage Gemini AI to optimize your warehouse operations and detect trends.</p>
        </div>
        <button 
          onClick={fetchInsights}
          disabled={loading}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-6 py-2 rounded-xl flex items-center gap-2 font-medium transition-all shadow-lg shadow-indigo-600/20"
        >
          {loading ? <RefreshCw size={18} className="animate-spin" /> : <RefreshCw size={18} />}
          Refresh Insights
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-3xl border border-indigo-100 shadow-xl shadow-indigo-500/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <Sparkles size={120} />
            </div>
            
            <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Zap className="text-amber-500" size={20} /> Smart Recommendations
            </h2>

            {loading ? (
              <div className="space-y-4 animate-pulse">
                <div className="h-4 bg-slate-100 rounded w-3/4"></div>
                <div className="h-4 bg-slate-100 rounded w-full"></div>
                <div className="h-4 bg-slate-100 rounded w-5/6"></div>
                <div className="h-4 bg-slate-100 rounded w-2/3"></div>
              </div>
            ) : insights ? (
              <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed whitespace-pre-line">
                {insights}
              </div>
            ) : (
              <div className="text-center py-20">
                <p className="text-slate-400">No insights available. Click refresh to generate.</p>
              </div>
            )}
          </div>

          <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-8 rounded-3xl text-white shadow-xl shadow-indigo-600/20">
            <h3 className="text-xl font-bold mb-4">Inventory Strategy Tip</h3>
            <p className="text-indigo-100 leading-relaxed">
              Based on global trends, electronics often see a 15% spike during the first week of the month. 
              Ensure your safety stock for "MacBook" and related accessories is at least 20% higher than average monthly demand.
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <TrendingUp size={18} className="text-emerald-500" /> Hot Items
            </h3>
            <div className="space-y-4">
              {/* Fix: Flatten sales items to correctly access productName and quantity properties */}
              {state.sales.slice(0, 3).flatMap(s => s.items).slice(0, 3).map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center text-xs font-bold">
                    #{i+1}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{item.productName}</p>
                    <p className="text-xs text-slate-500">{item.quantity} units sold recently</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <AlertTriangle size={18} className="text-amber-500" /> Critical Focus
            </h3>
            <div className="space-y-4">
              {state.products.filter(p => p.quantity <= p.minThreshold).slice(0, 3).map((p, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center text-xs font-bold">
                    !
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{p.name}</p>
                    <p className="text-xs text-slate-500">{p.quantity} units left (Min: {p.minThreshold})</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIInsights;
