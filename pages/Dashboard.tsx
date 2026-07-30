
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
    { title: t.value_stock, value: totalStockValue, symbol: currency, icon: BarChart3, color: "text-brand-primary", bg: "bg-brand-primary/10", detail: "Total Inventory Value" },
    { title: t.total_money, value: totalSalesRevenue, symbol: currency, icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-500/10", detail: "Total Revenue Generated" },
    { title: t.total_sales, value: state?.sales?.length || 0, icon: Zap, color: "text-indigo-500", bg: "bg-indigo-500/10", detail: "Recent Sales Volume" },
    { title: t.stock_warning, value: lowStockItems.length, icon: AlertTriangle, color: "text-rose-500", bg: "bg-rose-500/10", isAlert: lowStockItems.length > 0, detail: "Low Stock Inventory" },
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

  if (state.loading) {
    return (
      <div className="space-y-10 px-1 pb-32 animate-pulse">
        {/* HEADER SECTION SKELETON */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-2">
          <div className="space-y-3">
            <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded-xl" />
            <div className="h-4 w-72 bg-slate-200 dark:bg-slate-800 rounded-lg" />
          </div>
          <div className="flex gap-3">
            <div className="h-10 w-28 bg-slate-200 dark:bg-slate-800 rounded-xl" />
            <div className="h-10 w-28 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          </div>
        </header>

        {/* KPI GRID SKELETON */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800/80 rounded-xl" />
              <div className="space-y-2">
                <div className="h-3 w-20 bg-slate-200 dark:bg-slate-800 rounded" />
                <div className="h-7 w-28 bg-slate-200 dark:bg-slate-800 rounded-lg" />
              </div>
            </div>
          ))}
        </div>

        {/* TWO COLUMN GRID SKELETON */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* REVENUE CHART SKELETON */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-2">
                <div className="h-6 w-36 bg-slate-200 dark:bg-slate-800 rounded-lg" />
                <div className="h-4 w-28 bg-slate-200 dark:bg-slate-800 rounded" />
              </div>
              <div className="h-8 w-32 bg-slate-200 dark:bg-slate-800 rounded-lg" />
            </div>
            <div className="w-full h-[300px] bg-slate-50 dark:bg-slate-800/30 rounded-2xl flex items-end justify-between p-6 gap-3 border border-slate-100 dark:border-slate-800">
              {[35, 45, 30, 60, 50, 75, 55, 90].map((h, index) => (
                <div key={index} className="flex-1 bg-slate-200 dark:bg-slate-800/60 rounded-md" style={{ height: `${h}%` }} />
              ))}
            </div>
          </div>

          <div className="space-y-8">
            {/* RECENT SALES SKELETON */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <div className="h-6 w-28 bg-slate-200 dark:bg-slate-800 rounded-lg" />
                <div className="h-4 w-16 bg-slate-200 dark:bg-slate-800 rounded" />
              </div>
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((item) => (
                  <div key={item} className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-lg shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
                      <div className="h-3 w-12 bg-slate-200 dark:bg-slate-800 rounded" />
                    </div>
                    <div className="h-5 w-16 bg-slate-200 dark:bg-slate-800 rounded-lg" />
                  </div>
                ))}
              </div>
            </div>

            {/* SUBSCRIPTION STATUS SKELETON */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="h-4 w-16 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="h-10 w-20 bg-slate-200 dark:bg-slate-800 rounded-lg" />
              <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full animate-pulse" />
              <div className="h-3 w-40 bg-slate-200 dark:bg-slate-800 rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-1000 px-1 pb-32">
      {/* HEADER SECTION */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
          <p className="text-sm text-slate-500">Welcome back! Here's what's happening with your store today.</p>
        </div>
        <div className="flex gap-3">
           <button 
            onClick={() => onNavigate(View.AIInsights)} 
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 transition-all font-medium text-sm"
          >
            <MessageSquare size={18} className="text-brand-primary" /> AI Insights
          </button>
          <button 
            onClick={() => onNavigate(View.Sales)} 
            className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-xl hover:bg-brand-primary/90 transition-all font-medium text-sm"
          >
            <Plus size={20} /> New Sale
          </button>
        </div>
      </header>

      {state?.error && (
        <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl flex items-center gap-3 text-rose-700">
           <AlertTriangle size={20} className="shrink-0" /> 
           <p className="text-sm">{state.error}</p>
        </div>
      )}
      
      {/* KPI GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <StatsCard key={i} {...stat} index={i} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* REVENUE CHART */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Revenue Overview</h3>
              <p className="text-sm text-slate-500">Period Total: {currency}{periodTotal.toLocaleString()}</p>
            </div>
            
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
              <button onClick={() => setTimeFrame('day')} className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${timeFrame === 'day' ? 'bg-white dark:bg-slate-700 text-brand-primary shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}>Weekly</button>
              <button onClick={() => setTimeFrame('month')} className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${timeFrame === 'month' ? 'bg-white dark:bg-slate-700 text-brand-primary shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}>Monthly</button>
            </div>
          </div>
          
          <div className="w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} dy={10} />
                <YAxis hide domain={['auto', 'auto']} />
                <Tooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-lg border border-slate-100 dark:border-slate-700">
                          <p className="text-xs font-medium text-slate-500 mb-1">{label}</p>
                          <p className="text-lg font-bold text-slate-900 dark:text-white">{currency}{(payload[0].value as number).toLocaleString()}</p>
                        </div>
                      );
                    }
                    return null;
                  }} 
                />
                <Area type="monotone" dataKey="sales" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#chartGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-8">
          {/* RECENT SALES */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Recent Sales</h3>
              <button 
                onClick={() => onNavigate(View.Reports)}
                className="text-xs font-medium text-brand-primary hover:underline"
              >
                View reports
              </button>
            </div>

            <div className="space-y-4">
              {recentSales.map((sale) => (
                <div key={sale.id} className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800 text-slate-400 rounded-lg flex items-center justify-center shrink-0">
                    <ShoppingCart size={20} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{sale.customer_name || 'Walking Customer'}</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">{new Date(sale.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{currency}{sale.total_price.toLocaleString()}</p>
                </div>
              ))}
              {recentSales.length === 0 && (
                <div className="text-center py-10">
                   <p className="text-sm text-slate-400 italic">No sales recorded yet</p>
                </div>
              )}
            </div>
          </div>

          {/* SUBSCRIPTION STATUS */}
          <div className="bg-brand-primary p-6 rounded-2xl text-white shadow-sm relative overflow-hidden group">
            <div className="relative z-10">
              <p className="text-xs font-semibold uppercase tracking-wider opacity-80 mb-1">Trial Status</p>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-4xl font-bold">{trialStatus?.daysLeft || 0}</span>
                <span className="text-sm opacity-80 font-medium">days left</span>
              </div>
              
              <div className="h-2 w-full bg-white/20 rounded-full overflow-hidden mb-4">
                <div 
                  className="h-full bg-white rounded-full transition-all duration-1000" 
                  style={{ width: `${Math.max(5, ((trialStatus?.daysLeft || 0) / 30) * 100)}%` }} 
                />
              </div>
              <p className="text-[10px] opacity-70">
                Your trial will end on {new Date(new Date(state?.currentUser?.trialStartDate || Date.now()).getTime() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}
              </p>
            </div>
            <ShieldCheck size={120} className="absolute -bottom-10 -right-10 text-white/10" />
          </div>
        </div>
      </div>
    </div>
  );
};

const StatsCard = ({ title, value, symbol, icon: Icon, color, bg, index, isAlert }: any) => (
  <div 
    className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group"
  >
    <div className={`w-12 h-12 ${bg} ${color} rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110`}>
      <Icon size={24} />
    </div>
    <div className="space-y-1">
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{title}</p>
      <div className="flex items-baseline gap-1">
        {symbol && <span className="text-sm font-bold text-slate-400">{symbol}</span>}
        <h4 className={`text-2xl font-bold tracking-tight ${isAlert ? 'text-rose-500' : 'text-slate-900 dark:text-white'}`}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </h4>
      </div>
    </div>
  </div>
);

export default Dashboard;
