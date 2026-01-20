
import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { 
  ShoppingCart, Search, Plus, Minus, X, Trash2, CheckCircle2, 
  Scan, CreditCard, Package, DollarSign, ChevronDown, ChevronUp, ChevronRight, Loader2,
  Printer, Hash, User, Layout, Clock, ReceiptText, Banknote, ShieldCheck, Sparkles, QrCode,
  LayoutGrid, ListChecks, Wifi, Laptop, History, ArrowUpRight, Filter, TrendingUp, Calendar, ArrowRight,
  MapPin, MousePointer2, Layers
} from 'lucide-react';
import { Sale, Product, Settings, SaleItem, User as UserType, PaymentMethod } from '../types';
import ScannerModal from '../components/ScannerModal';

interface SalesProps {
  sales: Sale[];
  products: Product[];
  onRecordSale: (items: SaleItem[], customerName?: string, location?: string, paymentMethod?: PaymentMethod, status?: 'completed' | 'pending') => Promise<boolean>;
  settings: Settings;
  currentUser: UserType | null;
}

interface CartTab {
  id: string;
  items: SaleItem[];
  customerName: string;
  createdAt: string;
}

const BRANCHES = ['Main Branch', 'Lagos Warehouse', 'Abuja Showroom', 'Port Harcourt Hub'];

const Sales: React.FC<SalesProps> = ({ sales = [], products = [], onRecordSale, settings, currentUser }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [viewMode, setViewMode] = useState<'history' | 'active'>('history');
  
  // Multiple Carts State
  const [carts, setCarts] = useState<CartTab[]>([{ id: 'Order 1', items: [], customerName: '', createdAt: new Date().toISOString() }]);
  const [activeCartIndex, setActiveCartIndex] = useState(0);

  const barcodeBuffer = useRef<string>('');
  const lastKeyTime = useRef<number>(0);

  const currentCart = carts[activeCartIndex];

  const updateCustomerName = (name: string) => {
    setCarts(prev => {
      const updated = [...prev];
      updated[activeCartIndex] = { ...updated[activeCartIndex], customerName: name };
      return updated;
    });
  };

  const handleAddNewCart = () => {
    const nextNum = carts.length + 1;
    const newCart = { id: `Order ${nextNum}`, items: [], customerName: '', createdAt: new Date().toISOString() };
    setCarts([...carts, newCart]);
    setActiveCartIndex(carts.length);
  };

  const handleCloseCart = (index: number) => {
    if (carts.length === 1) {
      setCarts([{ id: 'Order 1', items: [], customerName: '', createdAt: new Date().toISOString() }]);
      return;
    }
    const newCarts = carts.filter((_, i) => i !== index);
    setCarts(newCarts);
    setActiveCartIndex(Math.max(0, index - 1));
  };

  // Logic to calculate stats
  const todaySales = sales.filter(s => new Date(s.date).toDateString() === new Date().toDateString());
  const todayRevenue = todaySales.reduce((acc, s) => acc + s.total_price, 0);

  const handleProductSelection = useCallback((productId: string) => {
    const p = products.find(prod => prod.id === productId);
    if (!p || p.quantity <= 0) return;
    
    let salePrice = p.price;
    if (settings.isPromoActive) salePrice *= (1 - (settings.promoDiscount / 100));

    setCarts(prevCarts => {
      const updatedCarts = [...prevCarts];
      const cartItems = [...updatedCarts[activeCartIndex].items];
      const idx = cartItems.findIndex(item => item.productId === p.id);
      
      if (idx > -1) {
        cartItems[idx] = { ...cartItems[idx], quantity: Math.min(cartItems[idx].quantity + 1, p.quantity) };
      } else {
        cartItems.push({ 
          productId: p.id, 
          productName: p.name, 
          quantity: 1, 
          price: salePrice, 
          costPrice: p.cost_price 
        });
      }
      
      updatedCarts[activeCartIndex].items = cartItems;
      return updatedCarts;
    });
  }, [products, settings.isPromoActive, settings.promoDiscount, activeCartIndex]);

  const handleScanResult = (res: any) => {
    const sku = typeof res === 'string' ? res : res?.sku;
    if (sku) {
      const found = products.find(p => p.sku === sku);
      if (found) {
        handleProductSelection(found.id);
        setIsScannerOpen(false);
      }
    }
  };

  useEffect(() => {
    if (!isNewOrderOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const now = Date.now();
      if (now - lastKeyTime.current > 100) barcodeBuffer.current = '';
      
      if (e.key === 'Enter') {
        if (barcodeBuffer.current.length > 2) {
          const sku = barcodeBuffer.current;
          const found = products.find(p => p.sku === sku);
          if (found) handleProductSelection(found.id);
          barcodeBuffer.current = '';
        }
      } else if (e.key.length === 1) {
        barcodeBuffer.current += e.key;
      }
      lastKeyTime.current = now;
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isNewOrderOpen, products, handleProductSelection]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
      return matchesSearch && matchesCategory && p.quantity > 0;
    });
  }, [products, searchTerm, selectedCategory]);

  const handleCheckout = async (status: 'completed' | 'pending', finalMethod?: PaymentMethod) => {
    if (currentCart.items.length === 0 || isProcessing) return;
    setIsProcessing(true);
    try {
      const success = await onRecordSale(currentCart.items, currentCart.customerName, BRANCHES[0], finalMethod || paymentMethod, status);
      if (success) {
        handleCloseCart(activeCartIndex);
        setShowConfirmDialog(false);
        setIsNewOrderOpen(false);
      }
    } catch (err: any) {
      alert(`Checkout failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const subtotal = currentCart.items.reduce((acc, i) => acc + (i.price * i.quantity), 0);
  const tax = subtotal * (settings.taxRate / 100);
  const total = subtotal + tax;

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-20">
      
      {/* HEADER */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-2 no-print">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Sales Operations</h2>
          <div className="flex items-center gap-3 mt-1">
             <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-800 rounded-lg">
                <Wifi size={10} className="text-emerald-500 animate-pulse" />
                <span className="text-emerald-600 dark:text-emerald-400 font-black uppercase text-[8px] tracking-widest">Scanner Standby</span>
             </div>
             <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Global Terminal #102</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => {
              handleAddNewCart();
              setIsNewOrderOpen(true);
            }}
            className="flex-1 md:flex-none px-8 py-4 bg-indigo-600 text-white rounded-[1.8rem] flex items-center justify-center gap-3 font-black text-xs uppercase shadow-xl shadow-indigo-600/30 active:scale-95 transition-all"
          >
            <Plus size={20} /> Create New Ticket
          </button>
        </div>
      </header>

      {/* STATS STRIP */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 no-print">
         <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm">
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Today's Revenue</p>
            <p className="text-2xl font-black text-indigo-600">{settings.currency}{todayRevenue.toLocaleString()}</p>
         </div>
         <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm">
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Tickets Build</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white">{carts.filter(c => c.items.length > 0).length}</p>
         </div>
         <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm">
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Completed (Today)</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white">{todaySales.length}</p>
         </div>
         <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm">
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Avg Ticket</p>
            <p className="text-2xl font-black text-emerald-500">{settings.currency}{todaySales.length ? Math.round(todayRevenue/todaySales.length).toLocaleString() : 0}</p>
         </div>
      </div>

      {/* VIEW TOGGLE */}
      <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl w-fit no-print">
         <button onClick={() => setViewMode('history')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'history' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-400'}`}>Finalized History</button>
         <button onClick={() => setViewMode('active')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'active' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-400'}`}>Active Tickets ({carts.filter(c => c.items.length > 0).length})</button>
      </div>

      {/* MAIN VIEW */}
      <div className="flex flex-col lg:flex-row gap-8 no-print min-h-[60vh]">
        
        {/* Sales List Table */}
        <div className="flex-1 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
             <div className="flex items-center gap-3">
                <History size={18} className="text-indigo-600" />
                <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-900 dark:text-white">{viewMode === 'history' ? 'Transaction Ledger' : 'Live Ticket Queue'}</h3>
             </div>
             <div className="flex items-center gap-2">
                <div className="relative">
                   <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                   <input 
                     type="text" 
                     placeholder="Search records..." 
                     className="pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border-none text-[10px] font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                   />
                </div>
             </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/50 dark:bg-slate-800/50 text-[9px] font-black uppercase tracking-widest text-slate-400">
                <tr>
                   <th className="px-8 py-5">Entity ID</th>
                   <th className="px-8 py-5">Customer Profile</th>
                   <th className="px-8 py-5">Item Count</th>
                   <th className="px-8 py-5 text-right">Settlement Value</th>
                   <th className="px-8 py-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {viewMode === 'history' ? (
                  sales.map((sale) => (
                    <tr 
                      key={sale.id} 
                      onClick={() => setSelectedSale(sale)}
                      className={`cursor-pointer transition-all hover:bg-slate-50 dark:hover:bg-slate-800/40 ${selectedSale?.id === sale.id ? 'bg-indigo-50/50 dark:bg-indigo-900/10 border-l-4 border-l-indigo-600' : ''}`}
                    >
                      <td className="px-8 py-5">
                         <span className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-tighter">#{sale.id.slice(0,8)}</span>
                      </td>
                      <td className="px-8 py-5">
                         <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase">{sale.customer_name || 'Walk-in Client'}</p>
                      </td>
                      <td className="px-8 py-5">
                         <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">{sale.items.length} units</span>
                      </td>
                      <td className="px-8 py-5 text-right">
                         <p className="text-[11px] font-black text-slate-900 dark:text-white">{settings.currency}{sale.total_price.toLocaleString()}</p>
                      </td>
                      <td className="px-8 py-5 text-right">
                         <button className="p-2 text-slate-300 hover:text-indigo-600 transition-colors"><ChevronRight size={18} /></button>
                      </td>
                    </tr>
                  ))
                ) : (
                  carts.filter(c => c.items.length > 0).map((cart, idx) => (
                    <tr 
                      key={idx} 
                      onClick={() => {
                        setActiveCartIndex(carts.indexOf(cart));
                        setIsNewOrderOpen(true);
                      }}
                      className="cursor-pointer transition-all hover:bg-slate-50 dark:hover:bg-slate-800/40"
                    >
                      <td className="px-8 py-5">
                         <span className="text-[11px] font-black text-indigo-600 uppercase tracking-tighter">{cart.id}</span>
                      </td>
                      <td className="px-8 py-5">
                         <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase">{cart.customerName || 'Awaiting Profile'}</p>
                      </td>
                      <td className="px-8 py-5 text-indigo-600">
                         <span className="text-[10px] font-black">{cart.items.length} Units</span>
                      </td>
                      <td className="px-8 py-5 text-right">
                         <p className="text-[11px] font-black text-slate-900 dark:text-white">{settings.currency}{cart.items.reduce((a,i)=>a+(i.price*i.quantity),0).toLocaleString()}</p>
                      </td>
                      <td className="px-8 py-5 text-right">
                         <button className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-[9px] font-black uppercase">Resume Ticket</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* DETAILS PANEL */}
        <div className="w-full lg:w-[400px] bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col h-fit sticky top-24">
           {selectedSale ? (
             <div className="p-8 space-y-8 animate-in slide-in-from-right-4 duration-300">
                <div className="flex justify-between items-start">
                   <div>
                      <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">Receipt Breakdown</h3>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-2">Ref: {selectedSale.id}</p>
                   </div>
                   <button onClick={() => window.print()} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl text-slate-400 hover:text-indigo-600"><Printer size={20} /></button>
                </div>

                <div className="space-y-4">
                   {selectedSale.items.map((item, idx) => (
                     <div key={idx} className="flex justify-between items-center py-2 border-b border-slate-50 dark:border-slate-800 last:border-0">
                        <div className="min-w-0">
                           <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase truncate">{item.productName}</p>
                           <p className="text-[8px] text-slate-400 font-bold uppercase">{item.quantity} x {settings.currency}{item.price.toLocaleString()}</p>
                        </div>
                        <p className="text-xs font-black text-slate-900 dark:text-white whitespace-nowrap">{settings.currency}{(item.price * item.quantity).toLocaleString()}</p>
                     </div>
                   ))}
                </div>

                <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-2">
                   <div className="flex justify-between items-center">
                      <span className="text-[12px] font-black text-slate-900 dark:text-white uppercase">Final Total</span>
                      <span className="text-2xl font-black text-indigo-600">{settings.currency}{selectedSale.total_price.toLocaleString()}</span>
                   </div>
                </div>

                <div className="p-5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl space-y-4">
                   <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-white dark:bg-slate-700 rounded-xl flex items-center justify-center text-slate-400"><Banknote size={16} /></div>
                      <div>
                         <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Strategy</p>
                         <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase">{selectedSale.payment_method}</p>
                      </div>
                   </div>
                </div>
             </div>
           ) : (
             <div className="p-16 flex flex-col items-center justify-center text-center space-y-4 opacity-30">
                <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center">
                   <ListChecks size={32} />
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest leading-relaxed">Select a session from the log<br/>to audit items</p>
             </div>
           )}
        </div>
      </div>

      {/* MULTI-TAB POS MODAL */}
      {isNewOrderOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-0 md:p-8 bg-slate-950/95 backdrop-blur-3xl no-print">
          <div className="bg-slate-50 dark:bg-slate-950 w-full h-full md:rounded-[4rem] overflow-hidden flex flex-col shadow-2xl relative animate-in zoom-in-95 duration-500 border border-white/5">
            
            {/* Modal Header */}
            <div className="h-20 md:h-24 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between px-6 md:px-12 shrink-0">
               <div className="flex items-center gap-5">
                  <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl">
                     <ShoppingCart size={24} />
                  </div>
                  <div>
                     <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">Multi-Session POS</h3>
                     <div className="flex items-center gap-2 mt-1">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Live Terminal Sync</span>
                     </div>
                  </div>
               </div>

               {/* TAB BAR */}
               <div className="hidden lg:flex flex-1 mx-12 items-center gap-3 overflow-x-auto scrollbar-hide">
                  {carts.map((cart, idx) => (
                    <button 
                      key={idx}
                      onClick={() => setActiveCartIndex(idx)}
                      className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-3 ${activeCartIndex === idx ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-50 dark:bg-slate-800 text-slate-400'}`}
                    >
                      {cart.customerName || cart.id}
                      {activeCartIndex === idx && <div className="w-2 h-2 bg-white rounded-full animate-pulse" />}
                      <X size={14} className="hover:text-rose-300" onClick={(e) => { e.stopPropagation(); handleCloseCart(idx); }} />
                    </button>
                  ))}
                  <button onClick={handleAddNewCart} className="p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl text-indigo-600 hover:scale-105 transition-transform"><Plus size={20} /></button>
               </div>

               <div className="flex items-center gap-3">
                  <button onClick={() => setIsScannerOpen(true)} className="hidden md:flex px-5 py-3 bg-slate-50 dark:bg-slate-800 rounded-2xl items-center gap-3 text-[10px] font-black uppercase tracking-widest hover:text-indigo-600 transition-colors">
                     <Scan size={18} /> Sensor
                  </button>
                  <button onClick={() => setIsNewOrderOpen(false)} className="p-3 bg-rose-50 dark:bg-rose-900/30 text-rose-500 rounded-2xl hover:bg-rose-100 transition-all">
                     <X size={24} />
                  </button>
               </div>
            </div>

            {/* Mobile Tab Bar */}
            <div className="lg:hidden flex p-4 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 gap-2 overflow-x-auto scrollbar-hide shrink-0">
               {carts.map((cart, idx) => (
                 <button key={idx} onClick={() => setActiveCartIndex(idx)} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeCartIndex === idx ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-400'}`}>
                   {cart.customerName || cart.id}
                 </button>
               ))}
               <button onClick={handleAddNewCart} className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl"><Plus size={16} /></button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 flex flex-col lg:flex-row gap-6 p-6 md:p-12 overflow-hidden">
               
               {/* Left: Product Catalog */}
               <div className="flex-1 flex flex-col min-h-0 space-y-6">
                  <div className="flex flex-col md:flex-row gap-4 bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm shrink-0">
                     <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                           type="text" 
                           placeholder="Search inventory..." 
                           className="w-full pl-12 pr-6 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-[12px] font-bold placeholder:text-slate-400 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                           value={searchTerm}
                           onChange={(e) => setSearchTerm(e.target.value)}
                        />
                     </div>
                     <select 
                        className="px-6 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 outline-none"
                        value={selectedCategory}
                        onChange={e => setSelectedCategory(e.target.value)}
                     >
                        <option value="All">Categories</option>
                        {settings.categories.map(c => <option key={c} value={c}>{c}</option>)}
                     </select>
                  </div>

                  <div className="flex-1 overflow-y-auto pr-2 scrollbar-hide">
                     <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredProducts.map(p => (
                           <button 
                              key={p.id} 
                              onClick={() => handleProductSelection(p.id)}
                              className="group bg-white dark:bg-slate-900 p-5 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 text-left hover:border-indigo-600 active:scale-95 transition-all shadow-sm flex flex-col justify-between h-[180px]"
                           >
                              <div>
                                 <div className="flex justify-between items-start mb-3">
                                    <span className="text-[8px] font-black uppercase px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-full">{p.category}</span>
                                    <span className={`w-1.5 h-1.5 rounded-full ${p.quantity < p.min_threshold ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
                                 </div>
                                 <h4 className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-tight line-clamp-2 leading-tight group-hover:text-indigo-600 transition-colors">{p.name}</h4>
                              </div>
                              <div className="flex items-end justify-between">
                                 <div className="flex items-baseline gap-0.5">
                                    <span className="text-[9px] font-black text-slate-300">{settings.currency}</span>
                                    <span className="text-lg font-black text-slate-900 dark:text-white">{p.price.toLocaleString()}</span>
                                 </div>
                                 <div className="w-8 h-8 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                    <Plus size={16} />
                                 </div>
                              </div>
                           </button>
                        ))}
                     </div>
                  </div>
               </div>

               {/* Right: Active Cart */}
               <div className="w-full lg:w-[420px] bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden shrink-0">
                  <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center gap-3">
                     <User size={18} className="text-slate-400" />
                     <input 
                        placeholder="Customer Identity..."
                        className="w-full px-4 py-3 bg-white dark:bg-slate-900 rounded-xl border-none text-[12px] font-bold dark:text-white focus:ring-2 focus:ring-indigo-500"
                        value={currentCart.customerName}
                        onChange={e => updateCustomerName(e.target.value)}
                     />
                  </div>

                  <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide">
                     {currentCart.items.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-300 space-y-4 opacity-40">
                           <div className="p-10 bg-slate-50 dark:bg-slate-800/50 rounded-full animate-pulse"><ShoppingCart size={64} /></div>
                           <p className="text-[10px] font-black uppercase tracking-widest text-center">Ticket Empty<br/>Scanning protocol active</p>
                        </div>
                     ) : (
                        currentCart.items.map((item, idx) => (
                           <div key={idx} className="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-[2rem] border border-slate-100 dark:border-slate-800 animate-in slide-in-from-right-4">
                              <div className="flex justify-between items-start mb-3">
                                 <p className="text-[11px] font-black uppercase text-slate-900 dark:text-white truncate pr-4">{item.productName}</p>
                                 <button onClick={() => {
                                    const updated = [...carts];
                                    updated[activeCartIndex].items = updated[activeCartIndex].items.filter((_, i) => i !== idx);
                                    setCarts(updated);
                                 }} className="text-slate-300 hover:text-rose-500"><Trash2 size={16}/></button>
                              </div>
                              <div className="flex items-center justify-between">
                                 <div className="flex items-center bg-white dark:bg-slate-800 rounded-2xl px-3 py-1.5 gap-4 border border-slate-100 dark:border-slate-700 shadow-sm">
                                    <button onClick={() => {
                                       const updated = [...carts];
                                       const items = [...updated[activeCartIndex].items];
                                       if (items[idx].quantity > 1) {
                                          items[idx].quantity -= 1;
                                          updated[activeCartIndex].items = items;
                                          setCarts(updated);
                                       }
                                    }} className="text-slate-400"><Minus size={14}/></button>
                                    <span className="text-xs font-black text-slate-900 dark:text-white">{item.quantity}</span>
                                    <button onClick={() => handleProductSelection(item.productId)} className="text-indigo-600"><Plus size={14}/></button>
                                 </div>
                                 <p className="text-sm font-black text-slate-900 dark:text-white">{settings.currency}{(item.price * item.quantity).toLocaleString()}</p>
                              </div>
                           </div>
                        ))
                     )}
                  </div>

                  <div className="p-8 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 space-y-6">
                     <div className="space-y-2">
                        <div className="flex justify-between items-center pt-2">
                           <span className="text-[12px] font-black text-slate-900 dark:text-white uppercase tracking-widest">Total Pay</span>
                           <span className="text-3xl font-black text-indigo-600">{settings.currency}{total.toLocaleString()}</span>
                        </div>
                     </div>
                     <div className="grid grid-cols-2 gap-3">
                        <button 
                           onClick={() => setIsNewOrderOpen(false)}
                           className="py-4 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-2xl font-black uppercase text-[9px] tracking-widest flex items-center justify-center gap-2"
                        >
                           <Layers size={14} /> Hold Order
                        </button>
                        <button 
                           disabled={currentCart.items.length === 0 || isProcessing}
                           onClick={() => setShowConfirmDialog(true)}
                           className="py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[9px] tracking-widest shadow-xl flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                           <CreditCard size={14} /> Checkout
                        </button>
                     </div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* FINAL CHECKOUT DIALOG */}
      {showConfirmDialog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-3xl no-print">
          <div className="bg-white dark:bg-slate-900 rounded-[3.5rem] w-full max-w-lg p-10 md:p-14 shadow-2xl text-center animate-in zoom-in-95">
            <h3 className="text-xl font-black uppercase tracking-tighter mb-4 text-slate-900 dark:text-white">Checkout Protocol</h3>
            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mb-2">Final Settlement Value</p>
            <p className="text-5xl font-black text-indigo-600 mb-12">{settings.currency}{total.toLocaleString()}</p>
            
            <div className="grid grid-cols-2 gap-4 mb-10">
               <button onClick={() => setPaymentMethod('cash')} className={`py-5 rounded-[2rem] flex flex-col items-center gap-3 border-4 transition-all ${paymentMethod === 'cash' ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30' : 'border-slate-50 dark:border-slate-800 opacity-60'}`}>
                  <Banknote size={28} className={paymentMethod === 'cash' ? 'text-indigo-600' : 'text-slate-400'} />
                  <span className={`text-[10px] font-black uppercase tracking-widest ${paymentMethod === 'cash' ? 'text-indigo-600' : 'text-slate-400'}`}>Currency</span>
               </button>
               <button onClick={() => setPaymentMethod('paystack')} className={`py-5 rounded-[2rem] flex flex-col items-center gap-3 border-4 transition-all ${paymentMethod === 'paystack' ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30' : 'border-slate-50 dark:border-slate-800 opacity-60'}`}>
                  <CreditCard size={28} className={paymentMethod === 'paystack' ? 'text-indigo-600' : 'text-slate-400'} />
                  <span className={`text-[10px] font-black uppercase tracking-widest ${paymentMethod === 'paystack' ? 'text-indigo-600' : 'text-slate-400'}`}>Digital</span>
               </button>
            </div>

            <div className="flex flex-col gap-4">
               <button disabled={isProcessing} onClick={() => handleCheckout('completed')} className="w-full py-6 bg-indigo-600 text-white rounded-3xl font-black uppercase text-xs flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all">
                 {isProcessing ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle2 size={20} />}
                 {isProcessing ? 'Finalizing...' : 'Commit & Print Receipt'}
               </button>
               <button onClick={() => setShowConfirmDialog(false)} className="w-full py-4 text-slate-400 font-black uppercase text-[10px] hover:text-rose-500 transition-colors">Go Back</button>
            </div>
          </div>
        </div>
      )}

      {isScannerOpen && (
        <ScannerModal 
          onScan={handleScanResult} 
          onClose={() => setIsScannerOpen(false)} 
          cartCount={currentCart.items.length} 
        />
      )}
    </div>
  );
};

export default Sales;
