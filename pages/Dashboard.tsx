import React, { useState, useMemo } from 'react';
import { 
  DollarSign, TrendingUp, AlertTriangle, ShoppingCart, Plus, ArrowRight
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { AppState, View } from '../types';
import { getTrialStatus } from '../store';

interface DashboardProps {
  state: AppState;
  onNavigate: (view: View) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ state, onNavigate }) => {
  const [timeFrame, setTimeFrame] = useState<'day' | 'week' | 'month'>('day');
  
  // Safety guards for calculation
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
        data.push({ name: date.toLocaleDateString('en-US', { weekday: 'short' }), sales: dayTotal });
      }
    } else {
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthTotal = sales.filter(s => {
          if (!s.date) return false;
          const sDate = new Date(s.date);
          return sDate.getMonth() === date.getMonth() && sDate.getFullYear() === date.getFullYear();
        }).reduce((sum, s) => sum + (s.total_price || 0), 0);
        data.push({ name: date.toLocaleDateString('en-US', { month: 'short' }), sales: monthTotal });
      }
    }
    return data;
  }, [state?.sales, timeFrame]);

  return (
    <div className="space-y-4 md:space-y-8 animate-in fade-in duration-500 px-1">
      {state?.error && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 p-3 rounded-2xl flex items-center gap-3 text-[10px] font-black uppercase text-amber-700 dark:text-amber-400">
           <AlertTriangle size={14} className="shrink-0" /> {state.error}
        </div>
      )}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        <StatsCard title="Value of Stock" value={totalStockValue} symbol={state?.settings?.currency || '₦'} icon={DollarSign} color="bg-indigo-600" />
        <StatsCard title="Total Money Made" value={totalSalesRevenue} symbol={state?.settings?.currency || '₦'} icon={TrendingUp} color="bg-emerald-600" />
        <StatsCard title="Total Sales" value={state?.sales?.length || 0} icon={ShoppingCart} color="bg-amber-600" />
        <StatsCard title="Stock Warning" value={lowStockItems.length} icon={AlertTriangle} color="bg-rose-600" isAlert={lowStockItems.length > 0} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 p-4 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm relative min-h-[400px]">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
            <div>
              <h3 className="text-sm md:text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Sales Performance</h3>
              <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5 tracking-widest">Money flow in your shop</p>
            </div>
            <div className="flex bg-slate-50 dark:bg-slate-800 p-1 rounded-xl w-full sm:w-auto overflow-x-auto scrollbar-hide">
              {(['day', 'month'] as const).map((t) => (
                <button key={t} onClick={() => setTimeFrame(t)} className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-[8px] md:text-[9px] font-black uppercase tracking-widest transition-all ${timeFrame === t ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-400'}`}>
                  {t === 'day' ? 'Today' : 'This Month'}
                </button>
              ))}
            </div>
          </div>
          
          <div className="w-full h-[300px] md:h-[400px] min-w-0" style={{ minHeight: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/><stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 8, fill: '#94a3b8', fontWeight: 800}} dy={10} />
                <YAxis hide />
                <Tooltip content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-slate-900 text-white px-3 py-1.5 rounded-xl text-[9px] font-black shadow-2xl">
                        {state?.settings?.currency || '₦'}&nbsp;{(payload[0].value as number).toLocaleString()}
                      </div>
                    );
                  }
                  return null;
                }} />
                <Area type="monotone" dataKey="sales" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-4 bg-white dark:bg-slate-900 p-4 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm h-fit">
          <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4">Quick Shortcuts</h3>
          <div className="space-y-3">
            <ActionBtn onClick={() => onNavigate(View.Sales)} label="Open Sales Counter" sub="Sell items to customers" icon={Plus} />
            <ActionBtn onClick={() => onNavigate(View.Inventory)} label="My Stock Room" sub="View items and quantities" icon={ArrowRight} />
          </div>
          <div className="mt-8 p-6 bg-indigo-50 dark:bg-indigo-900/20 rounded-[2rem] border border-indigo-100 dark:border-indigo-800">
             <div className="flex items-center gap-3 mb-2">
                <div className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse" />
                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Free Trial Active</p>
             </div>
             <p className="text-[14px] font-black text-slate-900 dark:text-white uppercase">{trialStatus?.daysLeft || 0} Days Remaining</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatsCard = ({ title, value, symbol, icon: Icon, color, isAlert }: any) => (
  <div className="bg-white dark:bg-slate-900 p-3 md:p-6 rounded-[1.2rem] md:rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm group">
    <div className={`w-8 h-8 md:w-12 md:h-12 ${color} rounded-[0.8rem] md:rounded-2xl flex items-center justify-center text-white mb-3 md:mb-6 shadow-lg`}>
      <Icon size={window.innerWidth < 768 ? 16 : 24} />
    </div>
    <p className="text-[7px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5 truncate">{title}</p>
    <div className="flex items-baseline gap-0.5 overflow-hidden">
      {symbol && <span className="text-[10px] md:text-xs font-black text-slate-300 mb-1">{symbol}&nbsp;</span>}
      <h4 className={`text-[13px] md:text-2xl font-black tracking-tighter truncate ${isAlert ? 'text-rose-600' : 'text-slate-900 dark:text-white'}`}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </h4>
    </div>
  </div>
);

const ActionBtn = ({ label, sub, icon: Icon, onClick }: any) => (
  <button onClick={onClick} className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-between group transition-all text-left active:scale-95">
    <div>
      <p className="text-[11px] font-black text-slate-900 dark:text-white uppercase">{label}</p>
      <p className="text-[8px] text-slate-400 font-bold uppercase">{sub}</p>
    </div>
    <div className="w-8 h-8 bg-white dark:bg-slate-700 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-indigo-600 shadow-sm">
      <Icon size={14} />
    </div>
  </button>
);

export default Dashboard;