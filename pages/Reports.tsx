
import React, { useMemo } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Package, 
  ArrowUpRight, 
  ArrowDownRight,
  PieChart as PieIcon,
  Calendar,
  DollarSign
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Cell, 
  Pie 
} from 'recharts';
import { AppState } from '../types';

interface ReportsProps {
  state: AppState;
}

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const Reports: React.FC<ReportsProps> = ({ state }) => {
  const { sales, products, settings } = state;

  // 1. Customer Insights
  const customerSales = useMemo(() => {
    const map = new Map<string, { total: number, count: number }>();
    sales.forEach(s => {
      const name = s.customerName || 'Guest';
      const current = map.get(name) || { total: 0, count: 0 };
      map.set(name, { total: current.total + s.totalPrice, count: current.count + 1 });
    });
    return Array.from(map.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [sales]);

  // 2. Profitability by Category
  const categoryProfit = useMemo(() => {
    const map = new Map<string, { revenue: number, profit: number }>();
    sales.forEach(s => {
      s.items.forEach(item => {
        const prod = products.find(p => p.id === item.productId);
        const cat = prod?.category || 'Other';
        const current = map.get(cat) || { revenue: 0, profit: 0 };
        const revenue = item.price * item.quantity;
        const profit = (item.price - item.costPrice) * item.quantity;
        map.set(cat, { revenue: current.revenue + revenue, profit: current.profit + profit });
      });
    });
    return Array.from(map.entries()).map(([name, data]) => ({ name, ...data }));
  }, [sales, products]);

  // 3. Stock Aging (Mocking logic based on createdAt)
  const stockHealth = useMemo(() => {
    const now = new Date();
    let fresh = 0; // < 30 days
    let stable = 0; // 30-90 days
    let dead = 0; // > 90 days
    
    products.forEach(p => {
      const created = p.createdAt ? new Date(p.createdAt) : now;
      const ageDays = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
      if (ageDays < 30) fresh++;
      else if (ageDays < 90) stable++;
      else dead++;
    });

    return [
      { name: 'Fresh Stock', value: fresh },
      { name: 'Stable Stock', value: stable },
      { name: 'Dead Stock', value: dead }
    ];
  }, [products]);

  const totalRevenue = sales.reduce((acc, s) => acc + s.totalPrice, 0);
  const totalProfit = sales.reduce((acc, s) => acc + (s.totalPrice - s.totalCost), 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <header>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          Business Reports & Analytics <BarChart3 className="text-indigo-600" />
        </h1>
        <p className="text-slate-500">Advanced financial breakdowns and customer behavior mapping.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-xs font-bold text-slate-500 uppercase mb-1">Net Margin</p>
          <h3 className="text-2xl font-black text-indigo-600">
            {totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : 0}%
          </h3>
          <p className="text-[10px] text-emerald-600 mt-2 font-bold flex items-center gap-1">
            <ArrowUpRight size={12} /> Above industry avg
          </p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-xs font-bold text-slate-500 uppercase mb-1">Avg. Sale Value</p>
          <h3 className="text-2xl font-black text-slate-900">
            {settings.currency}{sales.length > 0 ? (totalRevenue / sales.length).toLocaleString() : 0}
          </h3>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-xs font-bold text-slate-500 uppercase mb-1">Loyalty Rate</p>
          <h3 className="text-2xl font-black text-slate-900">
            {customerSales.length > 0 ? (customerSales.filter(c => c.count > 1).length / customerSales.length * 100).toFixed(0) : 0}%
          </h3>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-xs font-bold text-slate-500 uppercase mb-1">Stock Aging Index</p>
          <h3 className="text-2xl font-black text-rose-600">
            {stockHealth.find(h => h.name === 'Dead Stock')?.value || 0} Items
          </h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Category Profitability */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
            <TrendingUp size={20} className="text-indigo-600" /> Category Performance
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryProfit} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                />
                <Bar dataKey="profit" name="Net Profit" fill="#4f46e5" radius={[0, 8, 8, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Stock Aging Pie Chart */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
            <PieIcon size={20} className="text-indigo-600" /> Inventory Health Status
          </h2>
          <div className="h-64 flex flex-col md:flex-row items-center">
            <div className="flex-1 h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stockHealth}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {stockHealth.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-4 pr-8">
              {stockHealth.map((h, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{backgroundColor: COLORS[i]}}></div>
                  <span className="text-xs font-bold text-slate-600">{h.name}: <span className="text-slate-900">{h.value}</span></span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Customers Table */}
        <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
             <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Users size={20} className="text-indigo-600" /> VIP Customers (Top Spend)
            </h2>
            <button className="text-xs font-bold text-indigo-600 uppercase tracking-widest hover:underline">Download CRM List</button>
          </div>
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 text-slate-500 text-[10px] uppercase font-black tracking-widest">
              <tr>
                <th className="px-8 py-4">Customer</th>
                <th className="px-8 py-4">Total Orders</th>
                <th className="px-8 py-4 text-right">Lifetime Spend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {customerSales.map((c, i) => (
                <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-8 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                        {c.name.charAt(0)}
                      </div>
                      <span className="font-bold text-slate-900">{c.name}</span>
                    </div>
                  </td>
                  <td className="px-8 py-4 text-sm font-medium text-slate-600">{c.count} Visits</td>
                  <td className="px-8 py-4 text-right font-black text-slate-900">{settings.currency}{c.total.toLocaleString()}</td>
                </tr>
              ))}
              {customerSales.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-8 py-12 text-center text-slate-400 italic">No customer data recorded yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;
