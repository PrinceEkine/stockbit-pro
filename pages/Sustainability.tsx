
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
    <div className="space-y-10 animate-in fade-in duration-700">
      <header>
        <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Sustainability Dashboard</h1>
        <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-1 flex items-center gap-2">
          <Leaf size={14} className="text-emerald-600" /> Waste Minimization & Ethical Sourcing
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-8 bg-emerald-50 dark:bg-emerald-900/10 rounded-[2rem] border border-emerald-100 dark:border-emerald-800 shadow-sm relative overflow-hidden group">
          <Globe className="absolute -bottom-6 -right-6 text-emerald-600/5 w-32 h-32" />
          <p className="text-[10px] font-black uppercase text-emerald-600 tracking-widest mb-2">Portfolio Impact</p>
          <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-1">{avgSustainabilityScore}%</h3>
          <p className="text-[10px] text-emerald-700 font-bold uppercase">Eco-Reliability Index</p>
        </div>
        <div className="p-8 bg-rose-50 dark:bg-rose-900/10 rounded-[2rem] border border-rose-100 dark:border-rose-800 shadow-sm relative overflow-hidden group">
          <Trash2 className="absolute -bottom-6 -right-6 text-rose-600/5 w-32 h-32" />
          <p className="text-[10px] font-black uppercase text-rose-600 tracking-widest mb-2">Wasted Capital</p>
          <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-1">{expiredItems.length} Items</h3>
          <p className="text-[10px] text-rose-700 font-bold uppercase">Expired Stock Loss</p>
        </div>
        <div className="p-8 bg-amber-50 dark:bg-amber-900/10 rounded-[2rem] border border-amber-100 dark:border-amber-800 shadow-sm relative overflow-hidden group">
          <AlertTriangle className="absolute -bottom-6 -right-6 text-amber-600/5 w-32 h-32" />
          <p className="text-[10px] font-black uppercase text-amber-600 tracking-widest mb-2">Critical Risk</p>
          <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-1">{upcomingExpiry.length} Items</h3>
          <p className="text-[10px] text-amber-700 font-bold uppercase">Expiring in 30 Days</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm">
           <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-8 flex items-center gap-3">
             <TrendingDown className="text-emerald-600" size={24} /> Waste Prevention Pipeline
           </h2>
           <div className="space-y-6">
              {upcomingExpiry.length > 0 ? upcomingExpiry.map(p => (
                <div key={p.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <div>
                    <p className="text-sm font-black text-slate-900 dark:text-white uppercase">{p.name}</p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase">Expires: {new Date(p.expiry_date).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black text-rose-500">{p.quantity} Units at Risk</p>
                    <button className="text-[8px] font-black uppercase text-indigo-600 hover:underline">Apply Slash Price</button>
                  </div>
                </div>
              )) : (
                <div className="text-center py-20 text-slate-300">
                   <ShieldCheck size={48} className="mx-auto mb-4 opacity-20" />
                   <p className="text-[10px] font-black uppercase tracking-widest">No immediate waste risks detected</p>
                </div>
              )}
           </div>
        </div>

        <div className="space-y-8">
           <div className="bg-slate-900 p-10 rounded-[3rem] text-white shadow-xl relative overflow-hidden group">
              <Zap className="absolute -bottom-10 -right-10 w-48 h-48 text-white/5 rotate-12" />
              <h3 className="text-lg font-black uppercase tracking-tighter mb-4 flex items-center gap-3">
                 <Leaf className="text-emerald-400" size={20} /> AI Recommendation
              </h3>
              <p className="text-indigo-100/80 font-medium leading-relaxed">
                By optimizing stock buffers for "{upcomingExpiry[0]?.name || 'Perishables'}", you can reduce your operational carbon footprint by 4.2% next month and recover ₦{expiredItems.reduce((acc, p) => acc + (p.cost_price * p.quantity), 0).toLocaleString()} in wasted capital.
              </p>
           </div>

           <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
             <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-3">
               <Activity size={16} className="text-indigo-600" /> Environmental Metrics
             </h3>
             <div className="space-y-5">
                <MetricBar label="Supply Chain Distance" value="740km" progress={65} />
                <MetricBar label="Recyclable Packaging" value="82%" progress={82} color="bg-emerald-500" />
                <MetricBar label="Energy Intensity" value="Low" progress={30} color="bg-indigo-500" />
             </div>
           </div>
        </div>
      </div>
    </div>
  );
};

const MetricBar = ({ label, value, progress, color = "bg-emerald-600" }: any) => (
  <div>
    <div className="flex justify-between text-[9px] font-black uppercase text-slate-500 mb-2">
      <span>{label}</span>
      <span>{value}</span>
    </div>
    <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
      <div className={`h-full ${color} rounded-full`} style={{ width: `${progress}%` }}></div>
    </div>
  </div>
);

export default Sustainability;
