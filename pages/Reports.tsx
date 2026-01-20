
import React, { useMemo, useState } from 'react';
import { 
  BarChart3, 
  LineChart as LineIcon
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

  const formatCurrency = (val: number) => `${settings?.currency || '₦'}${(val || 0).toLocaleString()}`;

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-20 no-print px-2 md:px-0">
      <header>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2 uppercase tracking-tighter">
          Analytics & Intelligence <BarChart3 className="text-indigo-600" size={24} />
        </h1>
        <p className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-1">Cloud Financial Monitoring Active</p>
      </header>

      <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2 uppercase tracking-tighter">
            <LineIcon size={20} className="text-indigo-600" /> Revenue Curve
          </h2>
          <div className="flex bg-slate-50 dark:bg-slate-800 p-1 rounded-xl w-full sm:w-auto overflow-x-auto">
            {(['day', 'week', 'month'] as const).map((period) => (
              <button
                key={period}
                onClick={() => setRevenuePeriod(period)}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${revenuePeriod === period ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-400'}`}
              >
                {period}
              </button>
            ))}
          </div>
        </div>
        
        <div className="w-full min-h-[400px] overflow-hidden min-w-0" style={{ minHeight: '400px' }}>
          <ResponsiveContainer width="100%" height="100%" aspect={window.innerWidth < 1024 ? 1.5 : 2.5}>
            <AreaChart data={revenueTrendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="reportsSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#94a3b8', fontWeight: 800}} dy={10} />
              <YAxis hide />
              <Tooltip 
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">{label}</p>
                        <p className="text-base font-black">{formatCurrency(payload[0].value as number)}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area type="monotone" dataKey="revenue" stroke="#4f46e5" fillOpacity={1} fill="url(#reportsSales)" strokeWidth={4} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
          <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2 uppercase tracking-tighter mb-8">
            Terminal Leads
          </h2>
          <div className="space-y-8">
            {staffPerformance.slice(0, 5).map((staff) => (
              <div key={staff.id}>
                <div className="flex justify-between items-end mb-2">
                  <div>
                    <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{staff.name}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{staff.total} Sales</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-indigo-600">{staff.revenuePercent.toFixed(1)}%</p>
                  </div>
                </div>
                <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full">
                  <div className="h-full bg-indigo-600 rounded-full transition-all duration-1000" style={{ width: `${staff.revenuePercent}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center">
          <div className="w-full h-[350px] min-w-0" style={{ minHeight: '350px' }}>
            <ResponsiveContainer width="100%" height="100%" aspect={1.5}>
              <PieChart>
                <Pie
                  data={staffPerformance.filter(s => s.revenue > 0)}
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="revenue"
                  stroke="none"
                >
                  {staffPerformance.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
