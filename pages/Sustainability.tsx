
import React, { useMemo } from 'react';
import { 
  Leaf, 
  Trash2, 
  AlertTriangle, 
  TrendingDown, 
  ShieldCheck, 
  Globe, 
  Activity,
  Zap
} from 'lucide-react';
import { AppState } from '../types';

interface SustainabilityProps {
  state: AppState;
}

const Sustainability: React.FC<SustainabilityProps> = ({ state }) => {
  const products = state?.products || [];

  const expiredItems = useMemo(() => {
    const now = new Date();
    return products.filter(p => p.expiry_date && new Date(p.expiry_date) < now);
  }, [products]);

  const upcomingExpiry = useMemo(() => {
    const now = new Date();
    const threshold = new Date();
    threshold.setMonth(now.getMonth() + 1);
    return products.filter(p => p.expiry_date && new Date(p.expiry_date) > now && new Date(p.expiry_date) < threshold);
  }, [products]);

  const avgSustainabilityScore = useMemo(() => {
    if (products.length === 0) return 0;
    const total = products.reduce((acc, p) => acc + (p.sustainability_score || 0), 0);
    return Math.round(total / products.length);
  }, [products]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-full pb-20">
      <header>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Sustainability Dashboard</h2>
        <p className="text-sm text-slate-500">Track ethical sourcing, waste reduction, and inventory lifespan.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-2">Portfolio Score</p>
          <div className="flex items-center gap-3">
             <h3 className="text-3xl font-bold text-slate-900 dark:text-white">{avgSustainabilityScore}%</h3>
             <div className="p-1 px-2 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-lg border border-emerald-100 flex items-center gap-1">
                <Leaf size={12} /> High
             </div>
          </div>
          <p className="text-xs text-slate-500 mt-2">Ethical Sourcing Reliability Index</p>
        </div>

        <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-2">Loss Prevention</p>
          <div className="flex items-center gap-3">
             <h3 className="text-3xl font-bold text-slate-900 dark:text-white">{expiredItems.length}</h3>
             <div className="p-1 px-2 bg-rose-50 text-rose-600 text-[10px] font-bold rounded-lg border border-rose-100 flex items-center gap-1">
                <Trash2 size={12} /> Critical
             </div>
          </div>
          <p className="text-xs text-slate-500 mt-2">Expired stock requiring disposal</p>
        </div>

        <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-2">Expiring Soon</p>
          <div className="flex items-center gap-3">
             <h3 className="text-3xl font-bold text-slate-900 dark:text-white">{upcomingExpiry.length}</h3>
             <div className="p-1 px-2 bg-amber-50 text-amber-600 text-[10px] font-bold rounded-lg border border-amber-100 flex items-center gap-1">
                <AlertTriangle size={12} /> Warning
             </div>
          </div>
          <p className="text-xs text-slate-500 mt-2">Stock expiring within 30 days</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
           <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
             <TrendingDown className="text-emerald-500" size={20} /> Expiry Risk Pipeline
           </h3>
           <div className="space-y-4">
              {upcomingExpiry.length > 0 ? upcomingExpiry.map(p => (
                <div key={p.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50">
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white uppercase">{p.name}</p>
                    <p className="text-[10px] text-slate-400 font-bold">EXPIRES: {p.expiry_date ? new Date(p.expiry_date).toLocaleDateString() : '—'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-rose-500">{p.quantity} Units</p>
                    <button className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 transition-colors uppercase">Optimize Price</button>
                  </div>
                </div>
              )) : (
                <div className="text-center py-12 text-slate-400 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl">
                   <ShieldCheck size={40} className="mx-auto mb-3 opacity-20" />
                   <p className="text-xs font-medium">No immediate disposal risks detected</p>
                </div>
              )}
           </div>
        </div>

        <div className="space-y-6">
           <div className="bg-slate-900 p-8 rounded-2xl text-white shadow-xl relative overflow-hidden">
              <Zap className="absolute -bottom-6 -right-6 w-32 h-32 text-white/5" />
              <h4 className="text-md font-bold uppercase tracking-tight mb-4 flex items-center gap-2">
                 <Leaf className="text-emerald-400" size={18} /> Strategic Insight
              </h4>
              <p className="text-sm text-slate-300 leading-relaxed relative z-10">
                By optimizing stock buffers for "{upcomingExpiry[0]?.name || 'Perishables'}", you can recover ₦{expiredItems.reduce((acc, p) => acc + (p.cost_price * p.quantity), 0).toLocaleString()} in potential waste capital this cycle.
              </p>
           </div>

           <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6 flex items-center gap-2">
                <Activity size={16} className="text-indigo-600" /> Environmental Metrics
              </h4>
              <div className="space-y-4">
                 <MetricBar label="Supply Chain Efficiency" value="740km" progress={65} />
                 <MetricBar label="Recyclable Packaging" value="82%" progress={82} color="bg-emerald-500" />
                 <MetricBar label="Operational Energy" value="Low" progress={30} color="bg-indigo-500" />
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

const MetricBar = ({ label, value, progress, color = "bg-emerald-600" }: any) => (
  <div>
    <div className="flex justify-between items-center mb-1.5">
      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{label}</span>
      <span className="text-[10px] font-bold text-slate-900 dark:text-white uppercase">{value}</span>
    </div>
    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
      <div 
        className={`h-full ${color} transition-all duration-1000`} 
        style={{ width: `${progress}%` }}
      />
    </div>
  </div>
);

export default Sustainability;
