
import React, { useMemo, useState } from 'react';
import { 
  BarChart3, 
  LineChart as LineIcon,
  Download,
  FileSpreadsheet,
  Calendar,
  ChevronDown,
  ArrowUpRight,
  TrendingUp,
  Target,
  Users,
  Briefcase,
  PieChart as PieIcon,
  Zap
} from 'lucide-react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Cell, 
  Pie,
  AreaChart,
  Area,
  BarChart,
  Bar
} from 'recharts';
import { AppState } from '../types';

interface ReportsProps {
  state: AppState;
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'];

const Reports: React.FC<ReportsProps> = ({ state }) => {
  const sales = state?.sales || [];
  const settings = state?.settings;
  const users = state?.users || [];
  
  const [revenuePeriod, setRevenuePeriod] = useState<'day' | 'week' | 'month'>('day');

  const revenueTrendData = useMemo(() => {
    const now = new Date();
    const data: { name: string, revenue: number, salesCount: number }[] = [];

    if (revenuePeriod === 'day') {
      for (let i = 14; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const daySales = (sales || []).filter(s => s.date.startsWith(dateStr));
        const dayTotal = daySales.reduce((sum, s) => sum + (s.total_price || 0), 0);
        data.push({ 
          name: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), 
          revenue: dayTotal,
          salesCount: daySales.length
        });
      }
    } else if (revenuePeriod === 'week') {
      for (let i = 7; i >= 0; i--) {
        const start = new Date(now);
        start.setDate(start.getDate() - (i * 7 + 6));
        const end = new Date(now);
        end.setDate(end.getDate() - (i * 7));
        const weekSales = (sales || []).filter(s => {
          const sDate = new Date(s.date);
          return sDate >= start && sDate <= end;
        });
        const weekTotal = weekSales.reduce((sum, s) => sum + (s.total_price || 0), 0);
        data.push({ name: `Week ${8 - i}`, revenue: weekTotal, salesCount: weekSales.length });
      }
    } else {
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthSales = (sales || []).filter(s => {
          const sDate = new Date(s.date);
          return sDate.getMonth() === date.getMonth() && sDate.getFullYear() === date.getFullYear();
        });
        const monthTotal = monthSales.reduce((sum, s) => sum + (s.total_price || 0), 0);
        data.push({ name: date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }), revenue: monthTotal, salesCount: monthSales.length });
      }
    }
    return data;
  }, [sales, revenuePeriod]);

  const staffPerformance = useMemo(() => {
    const map = new Map<string, { total: number, revenue: number, name: string, role: string }>();
    (users || []).forEach(u => map.set(u.id, { total: 0, revenue: 0, name: u.name, role: u.role }));
    (sales || []).forEach(s => {
      const staffId = s.user_id || 'unknown';
      const current = map.get(staffId);
      if (current) map.set(staffId, { ...current, total: current.total + 1, revenue: current.revenue + (s.total_price || 0) });
    });
    
    const totalRevenue = (sales || []).reduce((acc, s) => acc + (s.total_price || 0), 0);
    return Array.from(map.entries())
      .map(([id, data]) => ({ id, ...data, revenuePercent: totalRevenue > 0 ? (data.revenue / totalRevenue) * 100 : 0 }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [sales, users]);

  const stats = useMemo(() => {
    const totalRevenue = sales.reduce((acc, s) => acc + (s.total_price || 0), 0);
    const avgTicket = sales.length > 0 ? totalRevenue / sales.length : 0;
    const itemsSold = sales.reduce((acc, s) => acc + s.items.reduce((sum, i) => sum + i.quantity, 0), 0);
    
    return [
      { label: 'Total Revenue', value: totalRevenue, icon: Zap, color: 'emerald' },
      { label: 'Total Volume', value: sales.length, icon: TrendingUp, color: 'indigo' },
      { label: 'Average Ticket', value: avgTicket, icon: Target, color: 'amber' },
      { label: 'Assets Traded', value: itemsSold, icon: Briefcase, color: 'rose' },
    ];
  }, [sales]);

  const exportSalesCSV = () => {
    const headers = ['Date', 'Sale ID', 'Customer', 'Items', 'Total Price', 'Payment Method'];
    const csvData = sales.map(s => [
      new Date(s.date).toLocaleString(),
      s.id,
      s.customer_name || 'Walk-in',
      s.items.map(i => `${i.productName}(x${i.quantity})`).join('; '),
      s.total_price,
      s.payment_method
    ]);

    const csvContent = [headers, ...csvData].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `stockbit_sales_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatCurrency = (val: number) => `${settings?.currency || '₦'}${(val || 0).toLocaleString()}`;

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-32 no-print">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-primary/10 text-brand-primary rounded-full border border-brand-primary/20">
            <Zap size={14} className="animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-widest leading-none">Intelligence Bureau</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-display font-bold tracking-tighter text-slate-900 dark:text-white leading-tight">Operational Insights</h1>
          <div className="flex items-center gap-4 text-slate-400">
             <Calendar size={16} />
             <p className="text-[10px] font-bold uppercase tracking-[0.2em] leading-none">Last Synced: {new Date().toLocaleTimeString()}</p>
          </div>
        </div>
        <button 
          onClick={exportSalesCSV}
          className="flex items-center justify-center gap-4 px-8 py-5 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-neo font-bold text-[11px] uppercase tracking-widest active:scale-95 transition-all hover:bg-slate-50 dark:hover:bg-slate-800 group"
        >
          <div className="w-8 h-8 bg-brand-primary/10 text-brand-primary rounded-xl flex items-center justify-center group-hover:bg-brand-primary group-hover:text-white transition-all">
            <Download size={18} />
          </div>
          Export Central Ledger
        </button>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-neo group animate-in slide-in-from-bottom-5" style={{ animationDelay: `${i * 100}ms` }}>
            <div className="flex items-center justify-between mb-8">
               <div className={`w-14 h-14 rounded-2xl flex items-center justify-center bg-${stat.color}-500/10 text-${stat.color}-500 shadow-inner group-hover:scale-110 group-hover:rotate-12 transition-all duration-500`}>
                  <stat.icon size={28} />
               </div>
               <ArrowUpRight size={18} className="text-slate-300" />
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 leading-none">{stat.label}</p>
            <h3 className="text-3xl font-display font-bold tracking-tighter text-slate-900 dark:text-white">
               {stat.label.includes('Revenue') || stat.label.includes('Average') ? formatCurrency(stat.value) : stat.value.toLocaleString()}
            </h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 bg-white dark:bg-slate-900 p-10 md:p-14 rounded-[3.5rem] border border-slate-100 dark:border-slate-800 shadow-neo transition-all overflow-hidden relative">
           <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/5 blur-[100px] rounded-full -mr-32 -mt-32"></div>
           <div className="flex flex-col md:flex-row items-baseline justify-between gap-8 relative z-10 mb-14">
              <div className="space-y-1">
                 <h2 className="text-2xl font-display font-bold tracking-tight text-slate-900 dark:text-white uppercase">Revenue Stream</h2>
                 <p className="text-[10px] font-bold uppercase text-slate-400 tracking-[0.3em]">Value generation timeline</p>
              </div>
              <div className="flex bg-slate-50 dark:bg-slate-800 p-1.5 rounded-[1.5rem] border border-slate-100 dark:border-slate-800">
                {(['day', 'week', 'month'] as const).map((period) => (
                  <button
                    key={period}
                    onClick={() => setRevenuePeriod(period)}
                    className={`px-8 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${revenuePeriod === period ? 'bg-brand-primary text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    {period}
                  </button>
                ))}
              </div>
           </div>

           <div className="h-[450px] w-full relative z-10">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueTrendData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="6 6" vertical={false} stroke={state.settings.theme === 'dark' ? '#1e293b' : '#f1f5f9'} />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fontSize: 10, fill: '#94a3b8', fontWeight: 700}} 
                    dy={15} 
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fontSize: 10, fill: '#94a3b8', fontWeight: 700}}
                    tickFormatter={(val) => settings.currency + (val >= 1000 ? (val/1000).toFixed(0)+'K' : val)}
                  />
                  <Tooltip 
                    cursor={{ stroke: '#6366f1', strokeWidth: 2, strokeDasharray: '6 6' }}
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-slate-900 dark:bg-black p-6 rounded-[2rem] shadow-2xl border border-white/10 backdrop-blur-3xl animate-in zoom-in-95">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 mb-3">{label}</p>
                            <div className="space-y-1">
                               <p className="text-2xl font-display font-bold text-white">{formatCurrency(payload[0].value as number)}</p>
                               <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{payload[0].payload.salesCount} Manifests</p>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#6366f1" 
                    strokeWidth={4} 
                    fillOpacity={1} 
                    fill="url(#revenueGradient)" 
                    activeDot={{ r: 8, strokeWidth: 4, stroke: state.settings.theme === 'dark' ? '#0f172a' : '#ffffff', fill: '#6366f1' }} 
                  />
                </AreaChart>
              </ResponsiveContainer>
           </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-10 md:p-14 rounded-[3.5rem] border border-slate-100 dark:border-slate-800 shadow-neo flex flex-col relative overflow-hidden">
           <div className="space-y-1 mb-14">
              <h2 className="text-2xl font-display font-bold tracking-tight text-slate-900 dark:text-white uppercase">Personnel Yield</h2>
              <p className="text-[10px] font-bold uppercase text-slate-400 tracking-[0.3em]">Value contribution by operator</p>
           </div>
           
           <div className="flex-1 w-full min-h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={staffPerformance.filter(s => s.revenue > 0)}
                    innerRadius="65%"
                    outerRadius="90%"
                    paddingAngle={10}
                    dataKey="revenue"
                    stroke="none"
                    animationBegin={0}
                    animationDuration={1500}
                    cornerRadius={12}
                  >
                    {staffPerformance.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="outline-none" />
                    ))}
                  </Pie>
                  <Tooltip 
                     content={({ active, payload }) => {
                       if (active && payload && payload.length) {
                         const data = payload[0].payload;
                         return (
                           <div className="bg-slate-900 p-5 rounded-[2rem] shadow-2xl border border-white/10 backdrop-blur-xl">
                             <p className="text-[10px] font-bold uppercase text-indigo-400 mb-2">{data.name}</p>
                             <p className="text-xl font-display font-bold text-white">{formatCurrency(data.revenue)}</p>
                             <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">{data.revenuePercent.toFixed(1)}% Yield Share</p>
                           </div>
                         );
                       }
                       return null;
                     }}
                  />
                </PieChart>
              </ResponsiveContainer>
           </div>
           
           <div className="mt-14 space-y-6">
              {staffPerformance.filter(s => s.revenue > 0).slice(0, 4).map((staff, i) => (
                <div key={i} className="flex items-center justify-between p-5 bg-slate-50/50 dark:bg-slate-800/40 rounded-3xl border border-slate-100 dark:border-white/5 group hover:bg-white dark:hover:bg-slate-800 transition-all shadow-sm">
                   <div className="flex items-center gap-5">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs text-white shadow-lg shadow-inner" style={{ backgroundColor: COLORS[i % COLORS.length] }}>
                         {staff.name.charAt(0)}
                      </div>
                      <div>
                         <p className="text-[11px] font-bold text-slate-900 dark:text-white uppercase tracking-tight">{staff.name}</p>
                         <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{staff.total} Manifests</p>
                      </div>
                   </div>
                   <div className="text-right">
                      <p className="text-[13px] font-display font-bold text-brand-primary">{formatCurrency(staff.revenue)}</p>
                      <div className="flex items-center gap-1 justify-end text-emerald-500">
                         <TrendingUp size={10} />
                         <span className="text-[8px] font-bold uppercase">{staff.revenuePercent.toFixed(0)}%</span>
                      </div>
                   </div>
                </div>
              ))}
           </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-10 md:p-14 rounded-[3.5rem] border border-slate-100 dark:border-slate-800 shadow-neo">
         <div className="flex flex-col md:flex-row items-baseline justify-between mb-14 gap-6">
            <div className="space-y-1">
               <h2 className="text-2xl font-display font-bold tracking-tight text-slate-900 dark:text-white uppercase">Personnel Efficiency Bureau</h2>
               <p className="text-[10px] font-bold uppercase text-slate-400 tracking-[0.3em]">Comparative metrics analysis</p>
            </div>
            <div className="flex items-center gap-3 bg-brand-primary/10 text-brand-primary px-5 py-2 rounded-full border border-brand-primary/20">
               <Users size={16} />
               <span className="text-[10px] font-bold uppercase tracking-widest">{users.length} Active Nodes</span>
            </div>
         </div>

         <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
               <BarChart data={staffPerformance} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="6 6" vertical={false} stroke={state.settings.theme === 'dark' ? '#1e293b' : '#f1f5f9'} />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fontSize: 10, fill: '#94a3b8', fontWeight: 700}} 
                    dy={15} 
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fontSize: 10, fill: '#94a3b8', fontWeight: 700}}
                    tickFormatter={(val) => settings.currency + (val >= 1000 ? (val/1000).toFixed(0)+'K' : val)}
                  />
                  <Tooltip 
                    cursor={{fill: 'rgba(99, 102, 241, 0.05)'}}
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-slate-900 dark:bg-black p-5 rounded-[2rem] shadow-2xl border border-white/10 backdrop-blur-3xl">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 mb-2">{label}</p>
                            <p className="text-xl font-display font-bold text-white">{formatCurrency(payload[0].value as number)}</p>
                            <div className="h-0.5 bg-white/20 my-3 rounded-full"></div>
                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Aggregate Manifest Settlement</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="revenue" fill="#6366f1" radius={[12, 12, 0, 0]} barSize={40} />
               </BarChart>
            </ResponsiveContainer>
         </div>
      </div>
    </div>
  );
};

export default Reports;
