
import React, { useState, useMemo } from 'react';
import { 
  ShoppingCart, 
  Search, 
  Plus, 
  DollarSign,
  X,
  AlertCircle,
  Maximize,
  Printer,
  CheckCircle2,
  TrendingUp,
  Trash2,
  ChevronRight,
  ArrowLeft,
  Filter,
  ChevronDown,
  ChevronUp,
  UserPlus,
  LineChart as ChartIcon,
  CheckSquare,
  Square,
  Archive,
  Eye,
  EyeOff,
  MoreVertical
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { Sale, Product, Settings, SaleItem } from '../types';
import ScannerModal from '../components/ScannerModal';

interface SalesProps {
  sales: Sale[];
  products: Product[];
  onRecordSale: (items: SaleItem[], customerName?: string) => Promise<boolean>;
  onDeleteSales: (ids: string[]) => Promise<void>;
  onUpdateSalesStatus: (ids: string[], updates: { isChecked?: boolean, isArchived?: boolean }) => Promise<void>;
  settings: Settings;
}

const Sales: React.FC<SalesProps> = ({ sales, products, onRecordSale, onDeleteSales, onUpdateSalesStatus, settings }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [minTotal, setMinTotal] = useState<string>('');
  const [maxTotal, setMaxTotal] = useState<string>('');
  const [minItems, setMinItems] = useState<string>('');
  const [maxItems, setMaxItems] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [lastSale, setLastSale] = useState<Sale | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  
  // Selection State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Cart Logic
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [activeTab, setActiveTab] = useState<'cart' | 'confirm'>('cart');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedQty, setSelectedQty] = useState(1);
  const [customerName, setCustomerName] = useState('');
  const [formError, setFormError] = useState('');

  const filteredSales = useMemo(() => {
    return sales.filter(sale => {
      const matchesSearch = 
        sale.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (sale.customerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.items.some(item => item.productName.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const saleDate = new Date(sale.date).toISOString().split('T')[0];
      const matchesStart = !startDate || saleDate >= startDate;
      const matchesEnd = !endDate || saleDate <= endDate;
      
      const matchesMinTotal = minTotal === '' || sale.totalPrice >= parseFloat(minTotal);
      const matchesMaxTotal = maxTotal === '' || sale.totalPrice <= parseFloat(maxTotal);

      const itemsCount = sale.items.length;
      const matchesMinItems = minItems === '' || itemsCount >= parseInt(minItems);
      const matchesMaxItems = maxItems === '' || itemsCount <= parseInt(maxItems);

      const matchesArchived = showArchived ? true : !sale.isArchived;
      
      return matchesSearch && matchesStart && matchesEnd && matchesMinTotal && matchesMaxTotal && matchesMinItems && matchesMaxItems && matchesArchived;
    });
  }, [sales, searchTerm, startDate, endDate, minTotal, maxTotal, minItems, maxItems, showArchived]);

  const stats = useMemo(() => {
    const revenue = filteredSales.reduce((acc, s) => acc + s.totalPrice, 0);
    const cost = filteredSales.reduce((acc, s) => acc + s.totalCost, 0);
    return { revenue, cost, profit: revenue - cost, count: filteredSales.length };
  }, [filteredSales]);

  const salesTrendData = useMemo(() => {
    const dailyData: Record<string, number> = {};
    const sortedSales = [...filteredSales].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    sortedSales.forEach(sale => {
      const dateKey = new Date(sale.date).toLocaleDateString([], { month: 'short', day: 'numeric' });
      dailyData[dateKey] = (dailyData[dateKey] || 0) + sale.totalPrice;
    });
    return Object.entries(dailyData).map(([name, revenue]) => ({ name, revenue }));
  }, [filteredSales]);

  const formatCurrency = (val: number) => `${settings.currency}${val.toLocaleString()}`;

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredSales.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredSales.map(s => s.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleBulkDelete = async () => {
    if (window.confirm(`Are you sure you want to delete ${selectedIds.size} sales?`)) {
      await onDeleteSales(Array.from(selectedIds));
      setSelectedIds(new Set());
    }
  };

  const handleBulkCheck = async (status: boolean) => {
    await onUpdateSalesStatus(Array.from(selectedIds), { isChecked: status });
    setSelectedIds(new Set());
  };

  const handleBulkArchive = async (status: boolean) => {
    await onUpdateSalesStatus(Array.from(selectedIds), { isArchived: status });
    setSelectedIds(new Set());
  };

  const addToCart = () => {
    setFormError('');
    if (!selectedProductId) return;
    const product = products.find(p => p.id === selectedProductId);
    if (!product) return;
    if (product.quantity < selectedQty) {
      setFormError(`Insufficient stock. Only ${product.quantity} units available.`);
      return;
    }
    const existingIndex = cart.findIndex(item => item.productId === selectedProductId);
    if (existingIndex !== -1) {
      const newQty = cart[existingIndex].quantity + selectedQty;
      if (product.quantity < newQty) {
        setFormError(`Cannot add more. Stock limit: ${product.quantity}.`);
        return;
      }
      const newCart = [...cart];
      newCart[existingIndex].quantity = newQty;
      setCart(newCart);
    } else {
      setCart([...cart, {
        productId: product.id,
        productName: product.name,
        quantity: selectedQty,
        price: product.price,
        costPrice: product.costPrice
      }]);
    }
    setSelectedProductId('');
    setSelectedQty(1);
  };

  const removeFromCart = (id: string) => setCart(cart.filter(item => item.productId !== id));

  const handleFinalCheckout = async () => {
    if (cart.length === 0) {
      setFormError('Cart is empty.');
      return;
    }
    const finalCustomer = customerName.trim() || 'Guest Customer';
    const success = await onRecordSale(cart, finalCustomer);
    if (success) {
      const totalP = cart.reduce((acc, i) => acc + (i.price * i.quantity), 0);
      const totalC = cart.reduce((acc, i) => acc + (i.costPrice * i.quantity), 0);
      const trxId = 'TRX-' + Math.random().toString(36).slice(2, 8).toUpperCase();
      setLastSale({
        id: trxId, items: [...cart], totalPrice: totalP, totalCost: totalC, date: new Date().toISOString(), customerName: finalCustomer
      });
      resetCart();
      setIsModalOpen(false);
    }
  };

  const resetCart = () => {
    setCart([]);
    setActiveTab('cart');
    setSelectedProductId('');
    setSelectedQty(1);
    setCustomerName('');
    setFormError('');
  };

  const resetFilters = () => {
    setSearchTerm('');
    setStartDate('');
    setEndDate('');
    setMinTotal('');
    setMaxTotal('');
    setMinItems('');
    setMaxItems('');
  };

  const cartTotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const inputClasses = "w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 transition-all";
  const filterInputClasses = "w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900";

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            Sales & POS <ShoppingCart className="text-indigo-600" />
          </h1>
          <p className="text-slate-500">Record sales, manage carts, and audit transactions with ease.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-xl flex items-center gap-2 font-medium transition-all shadow-lg shadow-indigo-600/20"
        >
          <Plus size={18} /> Record New Sale
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 no-print">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><DollarSign size={20} /></div>
            <p className="text-sm font-medium text-slate-500">Revenue</p>
          </div>
          <h3 className="text-2xl font-bold text-slate-900">{formatCurrency(stats.revenue)}</h3>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-rose-50 text-rose-600 rounded-lg"><DollarSign size={20} /></div>
            <p className="text-sm font-medium text-slate-500">Total Cost</p>
          </div>
          <h3 className="text-2xl font-bold text-slate-900">{formatCurrency(stats.cost)}</h3>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><TrendingUp size={20} /></div>
            <p className="text-sm font-medium text-slate-500">Gross Profit</p>
          </div>
          <h3 className="text-2xl font-bold text-indigo-600">{formatCurrency(stats.profit)}</h3>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><ShoppingCart size={20} /></div>
            <p className="text-sm font-medium text-slate-500">Sales Count</p>
          </div>
          <h3 className="text-2xl font-bold text-slate-900">{stats.count}</h3>
        </div>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm no-print">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <ChartIcon size={20} className="text-indigo-600" /> Revenue Trend
          </h2>
        </div>
        <div className="h-64">
          {salesTrendData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesTrendData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b'}} minTickGap={30} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b'}} tickFormatter={(val) => `${settings.currency}${val.toLocaleString()}`} />
                <Tooltip formatter={(value: number) => [formatCurrency(value), 'Revenue']} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Area type="monotone" dataKey="revenue" stroke="#6366f1" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-300 border-2 border-dashed border-slate-100 rounded-2xl">
              <ChartIcon size={40} className="opacity-20 mb-2" />
              <p className="text-sm">No sales data to visualize</p>
            </div>
          )}
        </div>
      </div>

      {/* Bulk Action Toolbar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[55] bg-slate-900 text-white px-6 py-4 rounded-3xl shadow-2xl flex items-center gap-6 animate-in slide-in-from-bottom-4">
          <div className="flex items-center gap-2 border-r border-slate-700 pr-4">
            <span className="bg-indigo-600 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black">{selectedIds.size}</span>
            <span className="text-sm font-bold">Selected</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => handleBulkCheck(true)} className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-800 rounded-xl transition-all text-xs font-bold">
              <CheckCircle2 size={16} className="text-emerald-400" /> Mark Checked
            </button>
            <button onClick={() => handleBulkArchive(true)} className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-800 rounded-xl transition-all text-xs font-bold">
              <Archive size={16} className="text-amber-400" /> Archive
            </button>
            <button onClick={handleBulkDelete} className="flex items-center gap-2 px-3 py-1.5 hover:bg-rose-500/20 text-rose-400 rounded-xl transition-all text-xs font-bold">
              <Trash2 size={16} /> Delete
            </button>
          </div>
          <button onClick={() => setSelectedIds(new Set())} className="p-2 hover:bg-slate-800 rounded-full">
            <X size={16} />
          </button>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden no-print">
        <div className="p-4 border-b border-slate-100 flex flex-col gap-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Search by ID, customer, or product..." 
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
               <button 
                onClick={() => setShowArchived(!showArchived)}
                className={`px-4 py-2 rounded-xl border flex items-center gap-2 text-sm font-medium transition-all ${showArchived ? 'bg-amber-50 border-amber-200 text-amber-600' : 'bg-slate-50 border-slate-200 text-slate-600'}`}
              >
                {showArchived ? <Eye size={16} /> : <EyeOff size={16} />}
                {showArchived ? 'Hide Archived' : 'Show Archived'}
              </button>
               <button 
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-2 rounded-xl border flex items-center gap-2 text-sm font-medium transition-all ${showFilters ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-slate-50 border-slate-200 text-slate-600'}`}
              >
                <Filter size={16} /> Filters {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            </div>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100 animate-in slide-in-from-top-2">
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Date Range</label>
                <div className="flex items-center gap-2">
                  <input type="date" className={filterInputClasses} value={startDate} onChange={e => setStartDate(e.target.value)} />
                  <span className="text-slate-400">-</span>
                  <input type="date" className={filterInputClasses} value={endDate} onChange={e => setEndDate(e.target.value)} />
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Amount ({settings.currency})</label>
                <div className="flex items-center gap-2">
                  <input type="number" placeholder="Min" className={filterInputClasses} value={minTotal} onChange={e => setMinTotal(e.target.value)} />
                  <span className="text-slate-400">-</span>
                  <input type="number" placeholder="Max" className={filterInputClasses} value={maxTotal} onChange={e => setMaxTotal(e.target.value)} />
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Unique Items Count</label>
                <div className="flex items-center gap-2">
                  <input type="number" placeholder="Min" className={filterInputClasses} value={minItems} onChange={e => setMinItems(e.target.value)} />
                  <span className="text-slate-400">-</span>
                  <input type="number" placeholder="Max" className={filterInputClasses} value={maxItems} onChange={e => setMaxItems(e.target.value)} />
                </div>
              </div>
              <div className="flex items-end pb-0.5">
                <button onClick={resetFilters} className="w-full py-1.5 bg-white border border-slate-200 text-slate-500 text-xs font-bold rounded-lg hover:bg-slate-100 transition-all flex items-center justify-center gap-2">
                  <X size={14} /> Reset Filters
                </button>
              </div>
            </div>
          )}
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[800px]">
            <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-black tracking-widest">
              <tr>
                <th className="px-6 py-4 w-10">
                  <button onClick={toggleSelectAll} className="text-indigo-600">
                    {selectedIds.size === filteredSales.length && filteredSales.length > 0 ? <CheckSquare size={18} /> : <Square size={18} />}
                  </button>
                </th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Transaction</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Items</th>
                <th className="px-6 py-4 text-right">Amount</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSales.map((sale) => (
                <tr key={sale.id} className={`hover:bg-slate-50 transition-colors ${selectedIds.has(sale.id) ? 'bg-indigo-50/50' : ''}`}>
                  <td className="px-6 py-4">
                    <button onClick={() => toggleSelect(sale.id)} className="text-indigo-600">
                      {selectedIds.has(sale.id) ? <CheckSquare size={18} /> : <Square size={18} />}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      {sale.isChecked ? (
                        <span className="p-1 bg-emerald-100 text-emerald-600 rounded-full" data-tooltip="Sale Audited & Checked">
                          <CheckCircle2 size={14} />
                        </span>
                      ) : (
                        <span className="p-1 bg-slate-100 text-slate-300 rounded-full" data-tooltip="Unchecked">
                          <CheckCircle2 size={14} />
                        </span>
                      )}
                      {sale.isArchived && (
                        <span className="p-1 bg-amber-100 text-amber-600 rounded-full" data-tooltip="Archived Record">
                          <Archive size={14} />
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs font-bold text-slate-700">{sale.id}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-slate-900">{sale.customerName || 'Guest'}</td>
                  <td className="px-6 py-4 text-xs text-slate-500">{new Date(sale.date).toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <span className="text-xs px-2 py-1 bg-slate-100 rounded-lg text-slate-600">
                      {sale.items.length} unique items
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-black text-slate-900">{formatCurrency(sale.totalPrice)}</td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-slate-300 hover:text-indigo-600">
                      <MoreVertical size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredSales.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-20 text-center text-slate-400 italic">No transactions found matching the criteria.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={resetCart}></div>
          <div className="bg-white rounded-3xl w-full max-w-2xl relative z-10 shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2"><ShoppingCart className="text-indigo-600" size={24} /> {activeTab === 'cart' ? 'Point of Sale' : 'Transaction Summary'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {formError && <div className="bg-rose-50 text-rose-600 p-3 rounded-xl flex items-center gap-2 text-sm"><AlertCircle size={16} /> {formError}</div>}
              {activeTab === 'cart' ? (
                <div className="space-y-4">
                  <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                    <label className="text-[10px] font-bold text-indigo-600 uppercase mb-2 block">Customer Details (Optional)</label>
                    <div className="relative">
                      <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400" size={18} />
                      <input type="text" placeholder="Search or enter customer name..." className="w-full pl-10 pr-4 py-2.5 bg-white border border-indigo-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm" value={customerName} onChange={e => setCustomerName(e.target.value)} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Select Product</label>
                          <button onClick={() => setIsScannerOpen(true)} className="text-[10px] font-bold text-indigo-600 uppercase flex items-center gap-1"><Maximize size={10} /> Barcode Scan</button>
                        </div>
                        <select className={inputClasses} value={selectedProductId} onChange={e => setSelectedProductId(e.target.value)}>
                          <option value="">Choose item...</option>
                          {products.map(p => <option key={p.id} value={p.id} disabled={p.quantity <= 0}>{p.name} - {formatCurrency(p.price)}</option>)}
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Quantity</label>
                          <input type="number" min="1" className={inputClasses} value={selectedQty} onChange={e => setSelectedQty(Math.max(1, parseInt(e.target.value) || 1))} />
                        </div>
                        <div className="flex items-end"><button type="button" onClick={addToCart} className="w-full py-2.5 bg-indigo-50 text-indigo-600 font-bold rounded-xl border border-indigo-100 hover:bg-indigo-100 transition-colors">Add to Cart</button></div>
                      </div>
                    </div>
                    <div className="bg-slate-50 rounded-2xl p-4 flex flex-col border border-slate-100">
                      <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center justify-between">Current Order ({cart.length}) {cart.length > 0 && <span className="text-indigo-600">{formatCurrency(cartTotal)}</span>}</h4>
                      <div className="flex-1 space-y-2 overflow-y-auto max-h-[250px] pr-1">
                        {cart.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between bg-white p-2 rounded-lg text-xs shadow-sm border border-slate-100">
                            <div className="min-w-0"><p className="font-bold truncate text-slate-900">{item.productName}</p><p className="text-slate-400">{item.quantity} x {formatCurrency(item.price)}</p></div>
                            <button onClick={() => removeFromCart(item.productId)} className="p-1.5 text-slate-300 hover:text-rose-500 transition-colors"><Trash2 size={14} /></button>
                          </div>
                        ))}
                        {cart.length === 0 && <div className="h-full flex flex-col items-center justify-center text-slate-300 py-10 border-2 border-dashed border-slate-200 rounded-xl"><p>Order is empty</p></div>}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-indigo-50/50 p-6 rounded-3xl border border-indigo-100 flex flex-col items-center text-center">
                    <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center text-white mb-3 shadow-lg"><CheckCircle2 size={24} /></div>
                    <h4 className="text-xl font-bold text-slate-900">Review Summary</h4>
                    <p className="text-sm text-slate-500">Customer: {customerName || 'Guest'}</p>
                  </div>
                  <div className="divide-y divide-slate-100 border rounded-2xl overflow-hidden bg-white shadow-sm">
                    <div className="p-4 space-y-3">{cart.map((item, idx) => (<div key={idx} className="flex justify-between text-sm"><span className="text-slate-600 font-medium">{item.productName} (x{item.quantity})</span><span className="font-bold text-slate-900">{formatCurrency(item.price * item.quantity)}</span></div>))}</div>
                    <div className="p-4 bg-indigo-600 text-white flex justify-between items-center rounded-b-2xl"><span className="font-bold">Total Payable</span><span className="text-xl font-black">{formatCurrency(cartTotal)}</span></div>
                  </div>
                </div>
              )}
            </div>
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-4">
              {activeTab === 'cart' ? (
                <>
                  <button onClick={resetCart} className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-200 rounded-2xl transition-all">Discard</button>
                  <button disabled={cart.length === 0} onClick={() => setActiveTab('confirm')} className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-all">Next Step <ChevronRight size={18} /></button>
                </>
              ) : (
                <>
                  <button onClick={() => setActiveTab('cart')} className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-200 rounded-2xl transition-all flex items-center justify-center gap-2"><ArrowLeft size={18} /> Edit Cart</button>
                  <button onClick={handleFinalCheckout} className="flex-1 py-3 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 flex items-center justify-center gap-2 transition-all">Complete Transaction</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {lastSale && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm no-print">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 flex flex-col">
            <div className="p-6 text-center space-y-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner"><CheckCircle2 size={32} /></div>
              <h3 className="text-xl font-bold text-slate-900">Sale Confirmed</h3>
              <p className="text-sm text-slate-500">Customer: {lastSale.customerName}</p>
            </div>
            <div className="px-6 py-4 bg-slate-50 border-y border-slate-100 space-y-3">
              <div className="flex justify-between text-xs"><span className="text-slate-400">Order ID</span><span className="font-mono font-bold text-slate-700">{lastSale.id}</span></div>
              <div className="pt-2 border-t border-slate-200"><div className="flex justify-between text-sm"><span className="text-slate-600">{lastSale.items.length} unique items</span><span className="font-bold text-slate-900">{formatCurrency(lastSale.totalPrice)}</span></div></div>
            </div>
            <div className="p-6 flex flex-col gap-2">
              <button onClick={() => window.print()} className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 flex items-center justify-center gap-2 shadow-xl shadow-indigo-600/20"><Printer size={20} /> Print Receipt</button>
              <button onClick={() => setLastSale(null)} className="w-full py-3 text-slate-500 font-semibold hover:bg-slate-50 rounded-xl">Return to POS</button>
            </div>
          </div>
        </div>
      )}

      {lastSale && (
        <div className="print-only p-8 text-slate-900 font-mono text-sm max-w-xs mx-auto">
          <div className="text-center mb-6"><h1 className="text-xl font-bold uppercase">{settings.companyName}</h1><p className="text-[10px] text-slate-500 tracking-widest mt-1">RECEIPT #{lastSale.id}</p></div>
          <div className="border-b border-dashed border-slate-400 mb-4"></div>
          <div className="space-y-1 mb-4 text-[12px]"><div className="flex justify-between"><span>Customer:</span> <span>{lastSale.customerName}</span></div><div className="flex justify-between"><span>Date:</span> <span>{new Date(lastSale.date).toLocaleString()}</span></div></div>
          <div className="border-b border-slate-200 mb-4"></div>
          <div className="space-y-2 mb-6">{lastSale.items.map((item, i) => (<div key={i} className="flex justify-between"><div className="flex flex-col"><span>{item.productName}</span><span className="text-[10px] text-slate-500">{item.quantity} x {formatCurrency(item.price)}</span></div><span className="font-bold">{formatCurrency(item.price * item.quantity)}</span></div>))}</div>
          <div className="border-b border-dashed border-slate-400 mb-4"></div>
          <div className="flex justify-between text-lg font-black"><span>TOTAL</span><span>{formatCurrency(lastSale.totalPrice)}</span></div>
          <div className="mt-10 text-center"><p className="text-[10px] font-bold uppercase">Thank you for your business!</p><p className="text-[8px] mt-2 text-slate-400">Powered by StockBit Pro</p></div>
        </div>
      )}

      {isScannerOpen && <ScannerModal onScan={(sku: string) => { const match = products.find(p => p.sku === sku); if (match) setSelectedProductId(match.id); setIsScannerOpen(false); }} onClose={() => setIsScannerOpen(false)} />}
    </div>
  );
};

export default Sales;
