
import React from 'react';
import { 
  Package, 
  DollarSign, 
  TrendingUp, 
  AlertTriangle,
  ArrowRight,
  ShoppingCart,
  FileText
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';
import { AppState, View } from '../types';
import StatsCard from '../components/StatsCard';

interface DashboardProps {
  state: AppState;
  onNavigate: (view: View) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ state, onNavigate }) => {
  const totalStockValue = state.products.reduce((acc, p) => acc + (p.price * p.quantity), 0);
  const totalSalesRevenue = state.sales.reduce((acc, s) => acc + s.totalPrice, 0);
  const totalSalesCost = state.sales.reduce((acc, s) => acc + s.totalCost, 0);
  const lowStockItems = state.products.filter(p => p.quantity <= p.minThreshold).length;
  const recentSales = state.sales.slice(0, 5);

  const formatCurrency = (val: number) => {
    return `${state.settings.currency}${val.toLocaleString()}`;
  };

  const chartData = [
    { name: 'Mon', sales: totalSalesRevenue * 0.1 },
    { name: 'Tue', sales: totalSalesRevenue * 0.15 },
    { name: 'Wed', sales: totalSalesRevenue * 0.12 },
    { name: 'Thu', sales: totalSalesRevenue * 0.18 },
    { name: 'Fri', sales: totalSalesRevenue * 0.22 },
    { name: 'Sat', sales: totalSalesRevenue * 0.13 },
    { name: 'Sun', sales: totalSalesRevenue * 0.10 },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard Overview</h1>
        <p className="text-slate-500">Welcome back! Here's what's happening today.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div data-tooltip="Estimated total value of items currently in stock">
          <StatsCard 
            title="Total Stock Value" 
            value={formatCurrency(totalStockValue)} 
            icon={DollarSign} 
            color="bg-indigo-600"
            trend="+12.5%"
            trendUp={true}
          />
        </div>
        <div data-tooltip="Gross revenue from all recorded sales">
          <StatsCard 
            title="Total Revenue" 
            value={formatCurrency(totalSalesRevenue)} 
            icon={TrendingUp} 
            color="bg-emerald-600"
            trend={formatCurrency(totalSalesRevenue - totalSalesCost)}
            trendUp={true}
          />
        </div>
        <div data-tooltip="Total number of unique products in inventory">
          <StatsCard 
            title="Total Products" 
            value={state.products.length} 
            icon={Package} 
            color="bg-blue-600"
          />
        </div>
        <div data-tooltip="Number of products currently below minimum stock thresholds">
          <StatsCard 
            title="Low Stock Alerts" 
            value={lowStockItems} 
            icon={AlertTriangle} 
            color="bg-amber-500"
            trend={lowStockItems > 0 ? "Action Required" : "All Good"}
            trendUp={lowStockItems === 0}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-900">Weekly Revenue</h2>
            <select 
              className="text-sm border-slate-200 rounded-lg px-2 py-1 outline-none"
              data-tooltip="Select the time period for revenue visualization"
            >
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
            </select>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                <Tooltip 
                  formatter={(value: number) => [formatCurrency(value), 'Sales']}
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
                <Area type="monotone" dataKey="sales" stroke="#4f46e5" fillOpacity={1} fill="url(#colorSales)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-900">Recent Transactions</h2>
            <button 
              onClick={() => onNavigate(View.Sales)}
              className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              data-tooltip="Go to sales history page"
            >
              View All <ArrowRight size={14} />
            </button>
          </div>
          <div className="space-y-4">
            {recentSales.length > 0 ? recentSales.map((sale) => (
              <div key={sale.id} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-colors border-b border-slate-50 last:border-0">
                <div className="flex items-center gap-3 text-slate-900">
                  <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                    <FileText size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-mono font-bold">{sale.id}</p>
                    <p className="text-xs text-slate-500">{new Date(sale.date).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-900">{formatCurrency(sale.totalPrice)}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{sale.items.length} unique items</p>
                </div>
              </div>
            )) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 py-10">
                <ShoppingCart size={40} className="mb-2 opacity-20" />
                <p>No transactions recorded yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
