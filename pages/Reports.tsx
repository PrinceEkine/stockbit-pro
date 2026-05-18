
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
    <div className="space-y-8 animate-in fade-in duration-500 pb-32 no-print max-w-full">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Business Intelligence</h2>
          <p className="text-sm text-slate-500">Comprehensive overview of sales, revenue, and staff performance.</p>
        </div>
        <button 
          onClick={exportSalesCSV}
          className="flex items-center justify-center gap-2 px-6 py-2.5 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:bg-slate-50 active:scale-95 transition-all font-bold text-sm"
        >
          <Download size={18} />
          Export Sales CSV
        </button>
      </header>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-transform hover:translate-y-[-2px]">
            <div className="flex items-center gap-3 mb-4">
               <div className={`p-2 rounded-xl bg-${stat.color}-500/10 text-${stat.color}-500`}>
                  <stat.icon size={20} />
               </div>
               <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{stat.label}</p>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
               {stat.label.includes('Revenue') || stat.label.includes('Average') ? formatCurrency(stat.value) : stat.value.toLocaleString()}
            </h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 bg-white dark:bg-slate-900 p-6 md:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
           <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
              <div>
                 <h2 className="text-lg font-bold text-slate-900 dark:text-white">Revenue Trend</h2>
                 <p className="text-xs text-slate-400">Net revenue over selected time period</p>
              </div>
              <div className="flex bg-slate-50 dark:bg-slate-800/50 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                {(['day', 'week', 'month'] as const).map((period) => (
                  <button
                    key={period}
                    onClick={() => setRevenuePeriod(period)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${revenuePeriod === period ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    {period}
                  </button>
                ))}
              </div>
           </div>

           <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueTrendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenueArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={state.settings.theme === 'dark' ? '#1e293b' : '#f1f5f9'} />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fontSize: 10, fill: '#94a3b8'}} 
                    dy={10} 
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fontSize: 10, fill: '#94a3b8'}}
                    tickFormatter={(val) => settings.currency + (val >= 1000 ? (val/1000).toFixed(0)+'K' : val)}
                  />
                  <Tooltip 
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-slate-900 dark:bg-slate-800 p-4 rounded-xl shadow-xl border border-slate-700">
                            <p className="text-xs font-bold text-slate-500 mb-2">{label}</p>
                            <p className="text-lg font-bold text-white">{formatCurrency(payload[0].value as number)}</p>
                            <p className="text-[10px] text-indigo-400 font-bold uppercase mt-1">{payload[0].payload.salesCount} Sales Record</p>
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
                    strokeWidth={3} 
                    fillOpacity={1} 
                    fill="url(#revenueArea)" 
                    activeDot={{ r: 6, strokeWidth: 0, fill: '#6366f1' }} 
                  />
                </AreaChart>
              </ResponsiveContainer>
           </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
           <div className="mb-8">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Staff Revenue Share</h2>
              <p className="text-xs text-slate-400">Performance distribution by operator</p>
           </div>
           
           <div className="flex-1 min-h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={staffPerformance.filter(s => s.revenue > 0).slice(0, 5)}
                    innerRadius="65%"
                    outerRadius="90%"
                    paddingAngle={5}
                    dataKey="revenue"
                    stroke="none"
                    animationBegin={0}
                    animationDuration={1000}
                    cornerRadius={8}
                  >
                    {staffPerformance.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                     content={({ active, payload }) => {
                       if (active && payload && payload.length) {
                         const data = payload[0].payload;
                         return (
                           <div className="bg-slate-900 p-3 rounded-xl border border-slate-700 shadow-xl">
                             <p className="text-xs font-bold text-white mb-1">{data.name}</p>
                             <p className="text-sm font-bold text-indigo-400">{formatCurrency(data.revenue)}</p>
                           </div>
                         );
                       }
                       return null;
                     }}
                  />
                </PieChart>
              </ResponsiveContainer>
           </div>
           
           <div className="mt-8 space-y-4">
              {staffPerformance.filter(s => s.revenue > 0).slice(0, 4).map((staff, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                   <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-[10px] text-white" style={{ backgroundColor: COLORS[i % COLORS.length] }}>
                         {staff.name.charAt(0)}
                      </div>
                      <div>
                         <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate max-w-[100px]">{staff.name}</p>
                         <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{staff.total} Sales</p>
                      </div>
                   </div>
                   <div className="text-right">
                      <p className="text-xs font-bold text-slate-900 dark:text-white">{formatCurrency(staff.revenue)}</p>
                      <p className="text-[10px] text-emerald-500 font-bold">{staff.revenuePercent.toFixed(0)}% Share</p>
                   </div>
                </div>
              ))}
           </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
         <div className="flex items-center justify-between mb-8">
            <div>
               <h2 className="text-lg font-bold text-slate-900 dark:text-white">Performance Overview</h2>
               <p className="text-xs text-slate-400">Total revenue generated by each staff member</p>
            </div>
            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/10 text-indigo-600 rounded-xl text-xs font-bold">
               {users.length} Active Staff Members
            </div>
         </div>

         <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
               <BarChart data={staffPerformance} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={state.settings.theme === 'dark' ? '#1e293b' : '#f1f5f9'} />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fontSize: 10, fill: '#94a3b8'}} 
                    dy={10} 
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fontSize: 10, fill: '#94a3b8'}}
                    tickFormatter={(val) => settings.currency + (val >= 1000 ? (val/1000).toFixed(0)+'K' : val)}
                  />
                  <Tooltip 
                    cursor={{fill: 'rgba(99, 102, 241, 0.05)'}}
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-slate-900 dark:bg-slate-800 p-4 rounded-xl shadow-xl border border-slate-700">
                             <p className="text-xs font-bold text-slate-500 mb-1">{label}</p>
                             <p className="text-lg font-bold text-white">{formatCurrency(payload[0].value as number)}</p>
                             <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-wider">Total Contribution</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="revenue" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={40} />
               </BarChart>
            </ResponsiveContainer>
         </div>
      </div>
    </div>
  );
};

export default Reports;
