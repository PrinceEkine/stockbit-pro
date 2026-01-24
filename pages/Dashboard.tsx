
import React, { useState, useMemo } from 'react';
import { 
  DollarSign, TrendingUp, AlertTriangle, ShoppingCart, Plus, ArrowRight, Activity, ShieldCheck
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

  const periodTotal = useMemo(() => chartData.reduce((acc, curr) => acc + curr.sales, 0), [chartData]);

  return (
    <div className="space-y-4 md:space-y-8 animate-in fade-in duration-700 px-1">
      {state?.error && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 p-3 rounded-2xl flex items-center gap-3 text-[10px] font-black uppercase text-amber-700 dark:text-amber-400">
           <AlertTriangle size={14} className="shrink-0" /> {state.error}
        </div>
      )}
      
      {/* Stats Overview Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        <StatsCard title={t.value_stock} value={totalStockValue} symbol={currency} icon={DollarSign} color="bg-indigo-600" />
        <StatsCard title={t.total_money} value={totalSalesRevenue} symbol={currency} icon={TrendingUp} color="bg-emerald-600" />
        <StatsCard title={t.total_sales} value={state?.sales?.length || 0} icon={ShoppingCart} color="bg-amber-600" />
        <StatsCard title={t.stock_warning} value={lowStockItems.length} icon={AlertTriangle} color="bg-rose-600" isAlert={lowStockItems.length > 0} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
        {/* Sales Chart Section */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 p-5 md:p-10 rounded-[2rem] md:rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-[0_8px_30px_rgb(0,0,0,0.02)] transition-colors">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-12 gap-8">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center text-indigo-600 shadow-inner">
                <Activity size={28} />
              </div>
              <div>
                <h3 className="text-lg md:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none mb-2">Performance Intelligence</h3>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Total for Period:</span>
                  <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">{currency}{periodTotal.toLocaleString()}</span>
                </div>
              </div>
            </div>
            
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-[1.2rem] w-full sm:w-auto shadow-inner border border-slate-200 dark:border-slate-700/50">
              <button 
                onClick={() => setTimeFrame('day')} 
                className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all duration-300 ${timeFrame === 'day' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-lg' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
              >
                Weekly
              </button>
              <button 
                onClick={() => setTimeFrame('month')} 
                className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all duration-300 ${timeFrame === 'month' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-lg' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
              >
                Yearly
              </button>
            </div>
          </div>
          
          <div className="w-full h-[350px] md:h-[450px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.25}/>
                    <stop offset="50%" stopColor="#4f46e5" stopOpacity={0.05}/>
                    <stop offset="100%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} stroke={state.settings.theme === 'dark' ? '#ffffff' : '#000000'} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 10, fill: '#94a3b8', fontWeight: 900}} 
                  dy={15} 
                />
                <YAxis hide domain={['auto', 'auto']} padding={{ top: 20, bottom: 20 }} />
                <Tooltip 
                  cursor={{ stroke: '#4f46e5', strokeWidth: 2, strokeDasharray: '6 6' }}
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-slate-900 dark:bg-black p-5 rounded-[1.5rem] shadow-2xl border border-white/10 animate-in fade-in zoom-in-95 duration-200 backdrop-blur-md">
                          <p className="text-[9px] font-black uppercase tracking-widest text-indigo-400 mb-2">{label}</p>
                          <div className="flex items-baseline gap-1">
                            <span className="text-[10px] font-black text-white/50">{currency}</span>
                            <span className="text-lg font-black text-white leading-none">
                              {(payload[0].value as number).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }} 
                />
                <Area 
                  type="monotone" 
                  dataKey="sales" 
                  stroke="#4f46e5" 
                  strokeWidth={5} 
                  fillOpacity={1} 
                  fill="url(#chartGradient)" 
                  activeDot={{ r: 8, strokeWidth: 4, stroke: state.settings.theme === 'dark' ? '#0f172a' : '#ffffff', fill: '#4f46e5' }}
                  animationDuration={1800}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Shortcuts & Trial Panel */}
        <div className="lg:col-span-4 space-y-6 md:space-y-8">
          <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
            <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
              <Plus size={12} className="text-indigo-500" /> Operational Shortcuts
            </h3>
            <div className="space-y-4">
              <ActionBtn onClick={() => onNavigate(View.Sales)} label={t.new_sale} sub="Launch Point of Sale" icon={Plus} color="indigo" />
              <ActionBtn onClick={() => onNavigate(View.Inventory)} label={t.inventory} sub="Manage Digital Assets" icon={ArrowRight} color="slate" />
            </div>
          </div>

          <div className="p-8 md:p-10 bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-[2rem] md:rounded-[3rem] shadow-2xl relative overflow-hidden group">
             <div className="relative z-10">
                <div className="flex items-center gap-3 mb-3">
                   <div className="w-2 h-2 bg-emerald-400 rounded-full animate-ping" />
                   <p className="text-[10px] font-black text-indigo-100 uppercase tracking-[0.3em]">Subscription Status</p>
                </div>
                <h4 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tighter mb-1">
                  {trialStatus?.daysLeft || 0} Days Remaining
                </h4>
                <p className="text-xs text-indigo-100/60 font-bold uppercase tracking-widest">Free Trial Active</p>
                
                {/* Visual Progress Track */}
                <div className="mt-6 h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                   <div 
                     className="h-full bg-white/30 transition-all duration-1000" 
                     style={{ width: `${Math.min(100, ((trialStatus?.daysLeft || 0) / 60) * 100)}%` }}
                   />
                </div>
             </div>
             <ShieldCheck size={120} className="absolute -bottom-4 -right-4 text-white/5 group-hover:scale-110 transition-transform duration-700" />
          </div>
        </div>
      </div>
    </div>
  );
};

const StatsCard = ({ title, value, symbol, icon: Icon, color, isAlert }: any) => (
  <div className="bg-white dark:bg-slate-900 p-4 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-[0_4px_20px_rgba(0,0,0,0.01)] group hover:shadow-xl hover:border-indigo-100 dark:hover:border-indigo-900 transition-all duration-500">
    <div className={`w-10 h-10 md:w-16 md:h-16 ${color} rounded-2xl md:rounded-[1.8rem] flex items-center justify-center text-white mb-4 md:mb-10 shadow-lg group-hover:scale-110 transition-transform duration-500`}>
      <Icon size={window.innerWidth < 768 ? 18 : 32} />
    </div>
    <p className="text-[8px] md:text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1 truncate">{title}</p>
    <div className="flex items-baseline gap-1 overflow-hidden">
      {symbol && <span className="text-xs md:text-lg font-black text-slate-300 dark:text-slate-600 mb-1">{symbol}</span>}
      <h4 className={`text-base md:text-3xl font-black tracking-tighter truncate ${isAlert ? 'text-rose-600' : 'text-slate-900 dark:text-white'}`}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </h4>
    </div>
  </div>
);

const ActionBtn = ({ label, sub, icon: Icon, onClick, color }: any) => (
  <button 
    onClick={onClick} 
    className={`w-full p-5 ${color === 'indigo' ? 'bg-indigo-50 dark:bg-indigo-900/20' : 'bg-slate-50 dark:bg-slate-800'} rounded-2xl md:rounded-[1.8rem] flex items-center justify-between group transition-all duration-300 text-left active:scale-[0.98] border border-transparent hover:border-indigo-200 dark:hover:border-indigo-800 shadow-sm`}
  >
    <div className="min-w-0">
      <p className={`text-[12px] font-black uppercase tracking-tight truncate ${color === 'indigo' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-900 dark:text-white'}`}>{label}</p>
      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{sub}</p>
    </div>
    <div className="w-10 h-10 bg-white dark:bg-slate-700 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-indigo-600 group-hover:rotate-12 transition-all duration-500 shadow-sm shrink-0 ml-4">
      <Icon size={16} />
    </div>
  </button>
);

export default Dashboard;
