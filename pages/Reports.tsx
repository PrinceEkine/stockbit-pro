
import React, { useMemo, useState } from 'react';
import { 
  BarChart3, 
  LineChart as LineIcon,
  Download,
  FileSpreadsheet,
  Calendar,
  ChevronDown
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
  Area
} from 'recharts';
import { AppState } from '../types';

interface ReportsProps {
  state: AppState;
}

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const Reports: React.FC<ReportsProps> = ({ state }) => {
  const sales = state?.sales || [];
  const settings = state?.settings;
  const users = state?.users || [];
  
  const [revenuePeriod, setRevenuePeriod] = useState<'day' | 'week' | 'month'>('day');

  const revenueTrendData = useMemo(() => {
    const now = new Date();
    const data: { name: string, revenue: number }[] = [];

    if (revenuePeriod === 'day') {
      for (let i = 14; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const dayTotal = (sales || [])
          .filter(s => s.date.startsWith(dateStr))
          .reduce((sum, s) => sum + (s.total_price || 0), 0);
        data.push({ 
          name: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), 
          revenue: dayTotal 
        });
      }
    } else if (revenuePeriod === 'week') {
      for (let i = 7; i >= 0; i--) {
        const start = new Date(now);
        start.setDate(start.getDate() - (i * 7 + 6));
        const end = new Date(now);
        end.setDate(end.getDate() - (i * 7));
        const weekTotal = (sales || []).filter(s => {
          const sDate = new Date(s.date);
          return sDate >= start && sDate <= end;
        }).reduce((sum, s) => sum + (s.total_price || 0), 0);
        data.push({ name: `Week ${8 - i}`, revenue: weekTotal });
      }
    } else {
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthTotal = (sales || []).filter(s => {
          const sDate = new Date(s.date);
          return sDate.getMonth() === date.getMonth() && sDate.getFullYear() === date.getFullYear();
        }).reduce((sum, s) => sum + (s.total_price || 0), 0);
        data.push({ name: date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }), revenue: monthTotal });
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
    <div className="space-y-6 md:space-y-10 animate-in fade-in duration-500 pb-20 no-print px-2 md:px-0">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3 uppercase tracking-tighter">
            Operational Intelligence <BarChart3 className="text-indigo-600" size={28} />
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-[9px] md:text-[10px] mt-1">Unified Shop Performance Data</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={exportSalesCSV}
            className="flex-1 md:flex-none px-6 py-3 bg-indigo-600 text-white rounded-2xl flex items-center justify-center gap-3 font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-all"
          >
            <Download size={16} /> Download Ledger (.csv)
          </button>
        </div>
      </header>

      <div className="bg-white dark:bg-slate-900 p-6 md:p-10 rounded-[2.5rem] md:rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-10 gap-6">
          <div className="space-y-1">
            <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2 uppercase tracking-tighter">
              <LineIcon size={20} className="text-indigo-600" /> Revenue Stream
            </h2>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Aggregate profit visualization</p>
          </div>
          <div className="flex bg-slate-50 dark:bg-slate-800/50 p-1.5 rounded-[1.2rem] w-full sm:w-auto overflow-x-auto border border-slate-100 dark:border-slate-800">
            {(['day', 'week', 'month'] as const).map((period) => (
              <button
                key={period}
                onClick={() => setRevenuePeriod(period)}
                className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${revenuePeriod === period ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-lg' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {period}
              </button>
            ))}
          </div>
        </div>
        
        <div className="w-full min-h-[400px] overflow-hidden min-w-0">
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={revenueTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="reportsSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={state.settings.theme === 'dark' ? '#1e293b' : '#f1f5f9'} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8', fontWeight: 900}} dy={15} />
              <YAxis hide />
              <Tooltip 
                cursor={{ stroke: '#4f46e5', strokeWidth: 2, strokeDasharray: '4 4' }}
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-slate-900 dark:bg-black p-5 rounded-[1.5rem] shadow-2xl border border-white/10 backdrop-blur-md">
                        <p className="text-[9px] font-black uppercase tracking-widest text-indigo-400 mb-1">{label}</p>
                        <p className="text-lg font-black text-white">{formatCurrency(payload[0].value as number)}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area type="monotone" dataKey="revenue" stroke="#4f46e5" fillOpacity={1} fill="url(#reportsSales)" strokeWidth={5} activeDot={{ r: 8, strokeWidth: 4, stroke: state.settings.theme === 'dark' ? '#0f172a' : '#ffffff', fill: '#4f46e5' }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-slate-900 p-8 md:p-10 rounded-[2.5rem] md:rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">
              Performance by Personnel
            </h2>
            <FileSpreadsheet size={20} className="text-slate-300" />
          </div>
          <div className="space-y-8">
            {staffPerformance.slice(0, 8).map((staff) => (
              <div key={staff.id} className="group">
                <div className="flex justify-between items-end mb-3">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center font-black text-xs group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                      {staff.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{staff.name}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{staff.total} Transactions Completed</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-indigo-600 dark:text-indigo-400">{staff.revenuePercent.toFixed(1)}%</p>
                  </div>
                </div>
                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-600 rounded-full transition-all duration-1000" style={{ width: `${staff.revenuePercent}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-8 md:p-10 rounded-[2.5rem] md:rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center min-h-[400px]">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-8">Revenue Distribution Model</h3>
          <div className="w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={staffPerformance.filter(s => s.revenue > 0)}
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={8}
                  dataKey="revenue"
                  stroke="none"
                  animationBegin={200}
                  animationDuration={1500}
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
                         <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-white/10">
                           <p className="text-[10px] font-black uppercase text-indigo-400 mb-1">{data.name}</p>
                           <p className="text-sm font-black">{formatCurrency(data.revenue)}</p>
                         </div>
                       );
                     }
                     return null;
                   }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-4 mt-8">
             {staffPerformance.filter(s => s.revenue > 0).map((s, i) => (
               <div key={i} className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                 <span className="text-[9px] font-black uppercase text-slate-500">{s.name}</span>
               </div>
             ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
