
import React, { useState, useMemo } from 'react';
import { 
  DollarSign, TrendingUp, AlertTriangle, ShoppingCart, Plus, ArrowRight, Activity, ShieldCheck, History, Clock, ArrowUpRight, Cpu, Zap, Globe, MessageSquare, BarChart3, Scan
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { AppState, View } from '../types';
import { getTrialStatus } from '../store';
import { TRANSLATIONS } from '../constants/translations';

interface DashboardProps {
  state: AppState;
  onNavigate: (view: View) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ state, onNavigate }) => {
  const [timeFrame, setTimeFrame] = useState<'day' | 'week' | 'month'>('day');
  const t = TRANSLATIONS[state.settings.language || 'en'];
  const currency = state?.settings?.currency || '₦';
  
  const totalStockValue = (state?.products || []).reduce((acc, p) => acc + (p.price * p.quantity), 0);
  const totalSalesRevenue = (state?.sales || []).reduce((acc, s) => acc + (s.total_price || 0), 0);
  const lowStockItems = (state?.products || []).filter(p => p.quantity <= (p.min_threshold || 5));
  
  const trialStatus = useMemo(() => getTrialStatus(state?.currentUser || null), [state?.currentUser]);

  const stats = useMemo(() => [
    { title: t.value_stock, value: totalStockValue, symbol: currency, icon: BarChart3, color: "text-brand-primary", bg: "bg-brand-primary/10", detail: "Global Inventory Value" },
    { title: t.total_money, value: totalSalesRevenue, symbol: currency, icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-500/10", detail: "Gross Pipeline Liquidity" },
    { title: t.total_sales, value: state?.sales?.length || 0, icon: Zap, color: "text-indigo-500", bg: "bg-indigo-500/10", detail: "Active Node Transactions" },
    { title: t.stock_warning, value: lowStockItems.length, icon: AlertTriangle, color: "text-rose-500", bg: "bg-rose-500/10", isAlert: lowStockItems.length > 0, detail: "Critical Supply Voids" },
  ], [totalStockValue, totalSalesRevenue, state?.sales?.length, lowStockItems.length, t, currency]);

  const chartData = useMemo(() => {
    const now = new Date();
    const data: { name: string, sales: number }[] = [];
    const sales = state?.sales || [];
    
    if (timeFrame === 'day') {
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const dayTotal = sales.filter(s => s.date && s.date.startsWith(dateStr)).reduce((sum, s) => sum + (s.total_price || 0), 0);
        data.push({ 
          name: date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(), 
          sales: dayTotal 
        });
      }
    } else {
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthTotal = sales.filter(s => {
          if (!s.date) return false;
          const sDate = new Date(s.date);
          return sDate.getMonth() === date.getMonth() && sDate.getFullYear() === date.getFullYear();
        }).reduce((sum, s) => sum + (s.total_price || 0), 0);
        data.push({ 
          name: date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(), 
          sales: monthTotal 
        });
      }
    }
    return data;
  }, [state?.sales, timeFrame]);

  const recentSales = useMemo(() => {
    return (state?.sales || []).slice(0, 5);
  }, [state?.sales]);

  const periodTotal = useMemo(() => chartData.reduce((acc, curr) => acc + curr.sales, 0), [chartData]);

  return (
    <div className="space-y-10 animate-in fade-in duration-1000 px-1 pb-32">
      {/* HEADER SECTION */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-10 no-print px-4 md:px-0">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-primary/10 text-brand-primary rounded-full border border-brand-primary/20">
             <Cpu size={14} className="animate-pulse" />
             <span className="text-[10px] font-bold uppercase tracking-widest leading-none">Operational Nexus Alpha</span>
          </div>
          <h1 className="text-4xl md:text-7xl font-display font-bold text-slate-900 dark:text-white tracking-tighter leading-tight">System Intel</h1>
           <div className="flex items-center gap-4 text-slate-400">
             <Globe size={16} />
             <p className="text-[10px] font-bold uppercase tracking-[0.2em] leading-none">Real-time Node Connectivity Active</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
           <button 
            onClick={() => onNavigate(View.AIInsights)} 
            className="flex items-center justify-center gap-3 px-8 py-5 bg-white dark:bg-slate-900 text-slate-800 dark:text-white rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-neo active:scale-95 transition-all font-bold text-[11px] uppercase tracking-widest"
          >
            <MessageSquare size={18} className="text-brand-primary" /> Core Insights
          </button>
          <button 
            onClick={() => onNavigate(View.Sales)} 
            className="flex items-center justify-center gap-4 px-10 py-5 bg-brand-primary text-white rounded-[2rem] shadow-neo-brand active:scale-95 transition-all font-bold text-[11px] uppercase tracking-widest group"
          >
            <Scan size={20} className="group-hover:scale-110 transition-transform" /> Initiate Sale Node
          </button>
        </div>
      </header>

      {state?.error && (
        <div className="mx-4 md:mx-0 bg-rose-500/10 border border-rose-500/20 p-6 rounded-[2.5rem] flex items-center gap-5 text-rose-600 dark:text-rose-400 animate-in slide-in-from-top-4 backdrop-blur-md">
           <AlertTriangle size={24} className="shrink-0" /> 
           <div className="space-y-1">
             <p className="text-[10px] font-black uppercase tracking-widest leading-none">Protocol Violation Detected</p>
             <p className="text-sm font-bold opacity-80">{state.error}</p>
           </div>
        </div>
      )}
      
      {/* KPI BENTO GRID */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 lg:gap-10">
        {stats.map((stat, i) => (
          <StatsCard key={i} {...stat} index={i} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* MAIN ANALYTICS NODE */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 p-8 md:p-14 rounded-[4rem] border border-slate-100 dark:border-slate-800 shadow-neo group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/5 blur-3xl rounded-full -mr-32 -mt-32"></div>
          
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between mb-16 gap-8">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-brand-primary/10 rounded-[2.5rem] flex items-center justify-center text-brand-primary shadow-inner">
                <Activity size={36} />
              </div>
              <div>
                <h3 className="text-2xl md:text-4xl font-display font-bold text-slate-900 dark:text-white tracking-tighter leading-none mb-3 uppercase">Activity Stream</h3>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] opacity-60">Revenue Flux:</span>
                  <span className="text-xl font-display font-bold text-brand-primary tabular-nums tracking-tight">{currency}{periodTotal.toLocaleString()}</span>
                </div>
              </div>
            </div>
            
            <div className="flex bg-slate-100/50 dark:bg-slate-800/50 p-2 rounded-[2rem] w-full sm:w-auto shadow-inner border border-slate-200/50 dark:border-white/5 backdrop-blur-sm">
              <button onClick={() => setTimeFrame('day')} className={`flex-1 sm:flex-none px-10 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all duration-500 ${timeFrame === 'day' ? 'bg-white dark:bg-slate-700 text-brand-primary shadow-xl scale-[1.02]' : 'text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}`}>Diurnal</button>
              <button onClick={() => setTimeFrame('month')} className={`flex-1 sm:flex-none px-10 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all duration-500 ${timeFrame === 'month' ? 'bg-white dark:bg-slate-700 text-brand-primary shadow-xl scale-[1.02]' : 'text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}`}>Sidereal</button>
            </div>
          </div>
          
          <div className="w-full h-[400px] md:h-[550px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                    <stop offset="50%" stopColor="#4f46e5" stopOpacity={0.1}/>
                    <stop offset="100%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.03} stroke={state.settings.theme === 'dark' ? '#ffffff' : '#000000'} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#64748b', fontWeight: 900, letterSpacing: '0.1em'}} dy={25} />
                <YAxis hide domain={['auto', 'auto']} padding={{ top: 40, bottom: 40 }} />
                <Tooltip 
                  cursor={{ stroke: '#4f46e5', strokeWidth: 2, strokeDasharray: '6 6' }}
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-slate-950/90 p-8 rounded-[2.5rem] shadow-neo-lg border border-white/10 animate-in fade-in zoom-in-95 duration-200 backdrop-blur-xl">
                          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500 mb-4">{label}</p>
                          <div className="flex items-baseline gap-2">
                            <span className="text-[10px] font-black text-white/30 truncate uppercase">{currency}</span>
                            <span className="text-4xl font-display font-bold text-white leading-none tracking-tighter">{(payload[0].value as number).toLocaleString()}</span>
                          </div>
                          <div className="mt-4 flex items-center gap-2">
                             <div className="w-1 h-1 bg-emerald-500 rounded-full" />
                             <p className="text-[8px] font-bold text-emerald-500 uppercase tracking-widest">Inbound Recorded</p>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }} 
                />
                <Area type="monotone" dataKey="sales" stroke="#4f46e5" strokeWidth={8} fillOpacity={1} fill="url(#chartGradient)" activeDot={{ r: 12, strokeWidth: 8, stroke: state.settings.theme === 'dark' ? '#0f172a' : '#ffffff', fill: '#4f46e5' }} animationDuration={3000} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-10">
          {/* RECENT SALES NODE */}
          <div className="bg-white dark:bg-slate-900 p-10 md:p-14 rounded-[4rem] border border-slate-100 dark:border-slate-800 shadow-neo group relative overflow-hidden">
            <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.4em] mb-12 flex items-center justify-between">
              <span className="flex items-center gap-3"><History size={16} className="text-brand-primary" /> Event Log</span>
              <Activity size={12} className="text-emerald-500 animate-pulse" />
            </h3>
            <div className="space-y-10">
              {recentSales.map((sale, i) => (
                <div key={sale.id} className="flex items-center gap-6 animate-in slide-in-from-right-8 group/item" style={{ animationDelay: `${i * 150}ms` }}>
                  <div className="w-14 h-14 bg-slate-50 dark:bg-slate-800 text-slate-300 group-hover/item:text-brand-primary group-hover/item:bg-brand-primary/10 rounded-[1.5rem] flex items-center justify-center shrink-0 transition-all duration-700 shadow-sm">
                    <ShoppingCart size={24} />
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="text-sm font-bold text-slate-900 dark:text-white uppercase truncate tracking-tight group-hover/item:text-brand-primary transition-colors">{sale.customer_name || 'Anonymous Entity'}</p>
                    <div className="flex items-center gap-3">
                       <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-1.5"><Clock size={10} /> {new Date(sale.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                       <span className="w-1 h-1 bg-slate-200 dark:bg-slate-700 rounded-full" />
                       <p className="text-[9px] text-slate-900 dark:text-white font-bold tabular-nums tracking-widest uppercase">{currency}{sale.total_price.toLocaleString()}</p>
                    </div>
                  </div>
                  <ArrowUpRight size={18} className="text-slate-200 dark:text-slate-800 group-hover/item:text-brand-primary group-hover/item:translate-x-1 group-hover/item:-translate-y-1 transition-all" />
                </div>
              ))}
              {recentSales.length === 0 && (
                <div className="text-center py-20 flex flex-col items-center gap-6">
                   <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800 rounded-[2.5rem] flex items-center justify-center text-slate-200 dark:text-slate-700 shadow-inner">
                      <ShoppingCart size={40} />
                   </div>
                   <div className="space-y-2">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Temporal Void</p>
                       <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">No active transaction telemetry</p>
                   </div>
                </div>
              )}
              <button 
                onClick={() => onNavigate(View.Reports)} 
                className="group w-full py-6 mt-6 bg-slate-50 dark:bg-slate-800/50 rounded-[2rem] text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-brand-primary hover:text-white shadow-inner transition-all duration-700 flex items-center justify-center gap-4"
              >
                Access History Protocol <ArrowRight size={14} className="group-hover:translate-x-2 transition-transform" />
              </button>
            </div>
          </div>

          {/* TRIAL / PLAN BANNER */}
          <div className="p-10 md:p-14 bg-gradient-to-br from-brand-primary via-indigo-700 to-brand-primary rounded-[4rem] shadow-neo-brand relative overflow-hidden group">
             <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_-20%,rgba(255,255,255,0.15),transparent)] pointer-events-none"></div>
             <div className="relative z-10">
                <div className="flex items-center gap-4 mb-6">
                   <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_20px_rgba(52,211,153,0.8)] border-2 border-white/20" />
                   <p className="text-[10px] font-black text-white uppercase tracking-[0.5em] opacity-80">Security Status: Synchronized</p>
                </div>
                <div className="space-y-2 mb-10">
                  <h4 className="text-8xl md:text-9xl font-display font-bold text-white tracking-tighter leading-none">
                    {trialStatus?.daysLeft || 0}
                  </h4>
                  <p className="text-[11px] text-white/50 font-black uppercase tracking-[0.3em] ml-2">Days Remaining In Cycle</p>
                </div>
                
                <div className="space-y-4">
                  <div className="h-3 w-full bg-black/20 rounded-full overflow-hidden p-1">
                    <div className="h-full bg-white/40 rounded-full group-hover:bg-white/80 transition-all duration-1000 ease-out" style={{ width: `${Math.max(5, ((trialStatus?.daysLeft || 0) / 30) * 100)}%` }} />
                  </div>
                  <div className="flex justify-between items-center px-1">
                     <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">Start_Session</p>
                     <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">End_Session</p>
                  </div>
                </div>
             </div>
             <ShieldCheck size={280} className="absolute -bottom-20 -right-20 text-white/5 group-hover:scale-110 group-hover:rotate-12 transition-all duration-1000 ease-out" />
          </div>
        </div>
      </div>
    </div>
  );
};

const StatsCard = ({ title, value, symbol, icon: Icon, color, bg, detail, index, isAlert }: any) => (
  <div 
    className="bg-white dark:bg-slate-900 p-8 md:p-12 rounded-[3.5rem] md:rounded-[4.5rem] border border-slate-100 dark:border-slate-800 shadow-neo group hover:shadow-neo-lg hover:border-brand-primary/20 transition-all duration-700 animate-in fade-in slide-in-from-bottom-10 relative overflow-hidden"
    style={{ animationDelay: `${index * 150}ms` }}
  >
    <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
       <ArrowUpRight size={24} className="text-slate-100 dark:text-slate-800" />
    </div>
    <div className={`w-16 h-16 md:w-24 md:h-24 ${bg} ${color} rounded-[2rem] md:rounded-[2.8rem] flex items-center justify-center mb-10 md:mb-14 shadow-inner group-hover:scale-110 group-hover:rotate-6 transition-all duration-700`}>
      <Icon size={window.innerWidth < 768 ? 28 : 44} strokeWidth={2.5} />
    </div>
    <div className="space-y-2">
      <p className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-[0.3em] truncate opacity-70">{title}</p>
      <div className="flex items-baseline gap-2 overflow-hidden">
        {symbol && <span className="text-xs md:text-2xl font-black text-slate-200 dark:text-slate-700 mb-1 leading-none uppercase">{symbol}</span>}
        <h4 className={`text-4xl md:text-7xl font-display font-bold tracking-tighter truncate leading-none ${isAlert ? 'text-rose-500' : 'text-slate-900 dark:text-white'}`}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </h4>
      </div>
      <p className="text-[9px] font-bold text-slate-300 dark:text-slate-600 uppercase tracking-widest pt-2">{detail}</p>
    </div>
  </div>
);

export default Dashboard;
