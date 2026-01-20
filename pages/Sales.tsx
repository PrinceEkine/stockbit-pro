
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
  
  const [carts, setCarts] = useState<CartTab[]>([{ id: 'Order 1', items: [], customerName: '', createdAt: new Date().toISOString() }]);
  const [activeCartIndex, setActiveCartIndex] = useState(0);

  const currentCart = carts[activeCartIndex];

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

  const handleCheckout = async (status: 'completed' | 'pending') => {
    if (currentCart.items.length === 0 || isProcessing) return;
    setIsProcessing(true);
    try {
      // Create a temporary sale object for immediate printing
      const tempSale: Sale = {
        id: 'TEMP-' + Date.now(),
        user_id: currentUser?.id || '',
        items: currentCart.items,
        total_price: currentCart.items.reduce((acc, i) => acc + (i.price * i.quantity), 0) * (1 + (settings.taxRate / 100)),
        total_cost: currentCart.items.reduce((acc, i) => acc + (i.costPrice * i.quantity), 0),
        tax_amount: (currentCart.items.reduce((acc, i) => acc + (i.price * i.quantity), 0)) * (settings.taxRate / 100),
        date: new Date().toISOString(),
        customer_name: currentCart.customerName || 'Walk-in',
        location: BRANCHES[0],
        payment_method: paymentMethod,
        status: status
      };

      const success = await onRecordSale(currentCart.items, currentCart.customerName, BRANCHES[0], paymentMethod, status);
      
      if (success) {
        setSelectedSale(tempSale);
        // Wait for React to render the print-only div
        setTimeout(() => {
          window.print();
          handleCloseCart(activeCartIndex);
          setShowConfirmDialog(false);
          setIsNewOrderOpen(false);
        }, 300);
      }
    } catch (err: any) {
      alert(`Checkout failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
      return matchesSearch && matchesCategory && p.quantity > 0;
    });
  }, [products, searchTerm, selectedCategory]);

  const subtotal = currentCart.items.reduce((acc, i) => acc + (i.price * i.quantity), 0);
  const tax = subtotal * (settings.taxRate / 100);
  const total = subtotal + tax;

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-20">
      
      {/* PRINT-ONLY RECEIPT (DYNAMICALLY POPULATED) */}
      {selectedSale && (
        <div className="print-only">
          <div className="receipt-print">
            <div className="text-center border-b border-black pb-4 mb-4">
              <h1 className="text-xl font-black uppercase tracking-tighter">{settings.companyName}</h1>
              <p className="text-[10px] uppercase font-bold text-slate-500">Transaction Receipt</p>
              <p className="text-[10px] mt-1 italic">Date: {new Date(selectedSale.date).toLocaleString()}</p>
              <p className="text-[10px]">Ref: {selectedSale.id.slice(0, 12)}</p>
            </div>
            <div className="mb-4">
              <p className="text-[10px] font-bold uppercase">Customer: {selectedSale.customer_name || 'Walk-in'}</p>
              <p className="text-[10px] font-bold uppercase">Staff: {currentUser?.name || 'System'}</p>
            </div>
            <table className="w-full text-[10px] border-b border-black mb-4">
              <thead>
                <tr className="border-b border-black font-black uppercase text-left">
                  <th className="py-1">Item</th>
                  <th className="text-center py-1">Qty</th>
                  <th className="text-right py-1">Price</th>
                </tr>
              </thead>
              <tbody>
                {selectedSale.items.map((item, idx) => (
                  <tr key={idx} className="border-b border-dashed border-slate-200">
                    <td className="py-2 pr-2">{item.productName}</td>
                    <td className="py-2 text-center">{item.quantity}</td>
                    <td className="py-2 text-right">{settings.currency}{(item.price * item.quantity).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="space-y-1 text-right">
              <div className="flex justify-between">
                <span className="font-bold uppercase">Subtotal:</span>
                <span>{settings.currency}{(selectedSale.total_price - selectedSale.tax_amount).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold uppercase">Tax ({settings.taxRate}%):</span>
                <span>{settings.currency}{selectedSale.tax_amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-t border-black pt-1 mt-1 font-black text-sm">
                <span className="uppercase">Total:</span>
                <span>{settings.currency}{selectedSale.total_price.toLocaleString()}</span>
              </div>
            </div>
            <div className="mt-8 text-center border-t border-black pt-4">
              <p className="text-[10px] font-black uppercase tracking-widest">Thank you for your business!</p>
              <p className="text-[8px] mt-1 italic">Powered by StockBit Pro</p>
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-2 no-print">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Sales Operations</h2>
          <div className="flex items-center gap-3 mt-1">
             <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-800 rounded-lg">
                <Wifi size={10} className="text-emerald-500 animate-pulse" />
                <span className="text-emerald-600 dark:text-emerald-400 font-black uppercase text-[8px] tracking-widest">Scanner Standby</span>
             </div>
          </div>
        </div>
        <button 
          onClick={() => {
            handleAddNewCart();
            setIsNewOrderOpen(true);
          }}
          className="px-8 py-4 bg-indigo-600 text-white rounded-[1.8rem] flex items-center justify-center gap-3 font-black text-xs uppercase shadow-xl shadow-indigo-600/30 active:scale-95 transition-all"
        >
          <Plus size={20} /> Create New Ticket
        </button>
      </header>

      {/* TICKET LEDGER */}
      <div className="flex flex-col lg:flex-row gap-8 no-print min-h-[60vh]">
        <div className="flex-1 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
             <div className="flex items-center gap-3">
                <History size={18} className="text-indigo-600" />
                <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-900 dark:text-white">Transaction Ledger</h3>
             </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/50 dark:bg-slate-800/50 text-[9px] font-black uppercase tracking-widest text-slate-400">
                <tr>
                   <th className="px-8 py-5">Entity ID</th>
                   <th className="px-8 py-5">Customer Profile</th>
                   <th className="px-8 py-5">Value</th>
                   <th className="px-8 py-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {sales.map((sale) => (
                  <tr 
                    key={sale.id} 
                    onClick={() => setSelectedSale(sale)}
                    className={`cursor-pointer transition-all hover:bg-slate-50 dark:hover:bg-slate-800/40 ${selectedSale?.id === sale.id ? 'bg-indigo-50/50 dark:bg-indigo-900/10 border-l-4 border-l-indigo-600' : ''}`}
                  >
                    <td className="px-8 py-5 text-[11px] font-black text-slate-900 dark:text-white uppercase">#{sale.id.slice(0,8)}</td>
                    <td className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase">{sale.customer_name || 'Walk-in Client'}</td>
                    <td className="px-8 py-5 text-[11px] font-black text-indigo-600">{settings.currency}{sale.total_price.toLocaleString()}</td>
                    <td className="px-8 py-5 text-right">
                       <button onClick={(e) => { e.stopPropagation(); setSelectedSale(sale); setTimeout(() => window.print(), 100); }} className="p-2 text-slate-300 hover:text-indigo-600"><Printer size={18} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* DETAILS SIDEBAR */}
        <div className="w-full lg:w-[400px] bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col h-fit">
           {selectedSale ? (
             <div className="p-8 space-y-8 animate-in slide-in-from-right-4 duration-300">
                <div className="flex justify-between items-start">
                   <div>
                      <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Receipt Audit</h3>
                      <p className="text-[9px] text-slate-400 font-bold uppercase mt-2">Ref: {selectedSale.id}</p>
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
                        <p className="text-xs font-black text-slate-900 dark:text-white">{settings.currency}{(item.price * item.quantity).toLocaleString()}</p>
                     </div>
                   ))}
                </div>
                <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                   <div className="flex justify-between items-center">
                      <span className="text-[12px] font-black uppercase">Final Total</span>
                      <span className="text-2xl font-black text-indigo-600">{settings.currency}{selectedSale.total_price.toLocaleString()}</span>
                   </div>
                </div>
             </div>
           ) : (
             <div className="p-16 flex flex-col items-center justify-center text-center space-y-4 opacity-30">
                <ListChecks size={32} />
                <p className="text-[10px] font-black uppercase tracking-widest">Select a session to audit</p>
             </div>
           )}
        </div>
      </div>

      {/* POS MODAL */}
      {isNewOrderOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-0 md:p-8 bg-slate-950/95 backdrop-blur-3xl no-print">
          <div className="bg-slate-50 dark:bg-slate-950 w-full h-full md:rounded-[4rem] overflow-hidden flex flex-col shadow-2xl relative border border-white/5">
            <div className="h-20 md:h-24 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between px-6 md:px-12 shrink-0">
               <div className="flex items-center gap-5">
                  <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white"><ShoppingCart size={24} /></div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Unified Terminal</h3>
               </div>
               <button onClick={() => setIsNewOrderOpen(false)} className="p-3 bg-rose-50 dark:bg-rose-900/30 text-rose-500 rounded-2xl"><X size={24} /></button>
            </div>
            <div className="flex-1 flex flex-col lg:flex-row gap-6 p-6 md:p-12 overflow-hidden">
               <div className="flex-1 flex flex-col min-h-0 space-y-6">
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm shrink-0">
                     <input 
                        type="text" 
                        placeholder="Search inventory..." 
                        className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-[12px] font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                     />
                  </div>
                  <div className="flex-1 overflow-y-auto pr-2 scrollbar-hide grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                     {filteredProducts.map(p => (
                        <button key={p.id} onClick={() => handleProductSelection(p.id)} className="bg-white dark:bg-slate-900 p-5 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 text-left hover:border-indigo-600 active:scale-95 transition-all h-[180px] flex flex-col justify-between">
                           <h4 className="text-[11px] font-black text-slate-900 dark:text-white uppercase leading-tight line-clamp-2">{p.name}</h4>
                           <div className="flex items-baseline gap-0.5">
                              <span className="text-[9px] font-black text-slate-300">{settings.currency}</span>
                              <span className="text-lg font-black text-slate-900 dark:text-white">{p.price.toLocaleString()}</span>
                           </div>
                        </button>
                     ))}
                  </div>
               </div>
               <div className="w-full lg:w-[420px] bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden shrink-0">
                  <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 flex items-center gap-3">
                     <User size={18} className="text-slate-400" />
                     <input placeholder="Customer Name..." className="w-full px-4 py-3 bg-white dark:bg-slate-900 rounded-xl text-[12px] font-bold dark:text-white outline-none" value={currentCart.customerName} onChange={e => {
                        const updated = [...carts];
                        updated[activeCartIndex].customerName = e.target.value;
                        setCarts(updated);
                     }} />
                  </div>
                  <div className="flex-1 overflow-y-auto p-6 space-y-4">
                     {currentCart.items.map((item, idx) => (
                        <div key={idx} className="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-[2rem] border border-slate-100 dark:border-slate-800 flex justify-between items-center">
                           <div className="min-w-0">
                              <p className="text-[11px] font-black uppercase truncate">{item.productName}</p>
                              <p className="text-xs font-black text-indigo-600">{item.quantity} x {settings.currency}{item.price.toLocaleString()}</p>
                           </div>
                           <button onClick={() => {
                              const updated = [...carts];
                              updated[activeCartIndex].items = updated[activeCartIndex].items.filter((_, i) => i !== idx);
                              setCarts(updated);
                           }} className="p-2 text-rose-500"><Trash2 size={16}/></button>
                        </div>
                     ))}
                  </div>
                  <div className="p-8 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 space-y-6">
                     <div className="flex justify-between items-center">
                        <span className="text-[12px] font-black uppercase">Total Pay</span>
                        <span className="text-3xl font-black text-indigo-600">{settings.currency}{total.toLocaleString()}</span>
                     </div>
                     <button 
                        disabled={currentCart.items.length === 0 || isProcessing}
                        onClick={() => setShowConfirmDialog(true)}
                        className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl"
                     >
                        Checkout
                     </button>
                  </div>
               </div>
            </div>
          </div>
        </div>
      )}

      {showConfirmDialog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-3xl no-print">
          <div className="bg-white dark:bg-slate-900 rounded-[3.5rem] w-full max-w-lg p-10 md:p-14 shadow-2xl text-center">
            <h3 className="text-xl font-black uppercase tracking-tighter mb-4">Checkout Protocol</h3>
            <p className="text-5xl font-black text-indigo-600 mb-12">{settings.currency}{total.toLocaleString()}</p>
            <div className="grid grid-cols-2 gap-4 mb-10">
               <button onClick={() => setPaymentMethod('cash')} className={`py-5 rounded-[2rem] border-4 transition-all ${paymentMethod === 'cash' ? 'border-indigo-600 bg-indigo-50' : 'border-slate-50 opacity-60'}`}>
                  <Banknote size={28} className="mx-auto mb-2" />
                  <span className="text-[10px] font-black uppercase">Cash</span>
               </button>
               <button onClick={() => setPaymentMethod('paystack')} className={`py-5 rounded-[2rem] border-4 transition-all ${paymentMethod === 'paystack' ? 'border-indigo-600 bg-indigo-50' : 'border-slate-50 opacity-60'}`}>
                  <CreditCard size={28} className="mx-auto mb-2" />
                  <span className="text-[10px] font-black uppercase">Digital</span>
               </button>
            </div>
            <div className="flex flex-col gap-4">
               <button disabled={isProcessing} onClick={() => handleCheckout('completed')} className="w-full py-6 bg-indigo-600 text-white rounded-3xl font-black uppercase text-xs flex items-center justify-center gap-3">
                 {isProcessing ? <Loader2 className="animate-spin" /> : <Printer size={20} />}
                 {isProcessing ? 'Finalizing...' : 'Commit & Print Receipt'}
               </button>
               <button onClick={() => setShowConfirmDialog(false)} className="w-full py-4 text-slate-400 font-black uppercase text-[10px]">Go Back</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sales;
