
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { 
  ShoppingCart, Search, Plus, Minus, X, Scan, User, Edit3, ChevronRight, Loader2, Printer, 
  Trash2, ReceiptText, Banknote, CreditCard, History, Package, ChevronUp, ChevronDown, ShieldCheck,
  CheckCircle2, AlertCircle, Monitor, Tablet, ArrowUpRight
} from 'lucide-react';
import { Sale, Product, Settings, SaleItem, User as UserType, PaymentMethod } from '../types';
import ScannerModal from '../components/ScannerModal';

interface SalesProps {
  sales: Sale[];
  products: Product[];
  onRecordSale: (items: SaleItem[], customerName?: string, location?: string, paymentMethod?: PaymentMethod) => Promise<boolean>;
  settings: Settings;
  currentUser: UserType | null;
}

interface CartTab {
  id: string;
  items: SaleItem[];
  customerName: string;
  label: string;
  date?: string;
  ref?: string;
}

const Sales: React.FC<SalesProps> = ({ sales = [], products = [], onRecordSale, settings, currentUser }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [mobileCartOpen, setMobileCartOpen] = useState(false);
  const [lastSaleForPrint, setLastSaleForPrint] = useState<CartTab | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [receiptSize, setReceiptSize] = useState<'80mm' | '58mm'>('80mm');
  
  const [scanFeedback, setScanFeedback] = useState<{name: string, qty: number} | null>(null);
  
  const [carts, setCarts] = useState<CartTab[]>([{ 
    id: '1', 
    items: [], 
    customerName: '', 
    label: 'ORDER 1'
  }]);
  const [activeCartIndex, setActiveCartIndex] = useState(0);

  const currentCart = carts[activeCartIndex];

  const handleAddNewCart = () => {
    if (carts.length >= 8) return;
    const nextNum = carts.length + 1;
    const newCart = { 
      id: Math.random().toString(36).substr(2, 9), 
      items: [], 
      customerName: '', 
      label: `ORDER ${nextNum}`
    };
    setCarts([...carts, newCart]);
    setActiveCartIndex(carts.length);
  };

  const handleCloseCart = (index: number) => {
    if (carts.length === 1) {
      setCarts([{ id: '1', items: [], customerName: '', label: 'ORDER 1' }]);
      setActiveCartIndex(0);
      return;
    }
    const newCarts = carts.filter((_, i) => i !== index);
    setCarts(newCarts);
    setActiveCartIndex(Math.max(0, index - 1));
  };

  const updateActiveCart = (updates: Partial<CartTab>) => {
    const updated = [...carts];
    updated[activeCartIndex] = { ...updated[activeCartIndex], ...updates };
    setCarts(updated);
  };

  const handleProductSelection = useCallback((productId: string) => {
    let finalQty = 0;
    let productName = '';

    setCarts(prevCarts => {
      const newCarts = [...prevCarts];
      const cart = { ...newCarts[activeCartIndex] };
      const p = products.find(prod => prod.id === productId);
      
      if (!p || p.quantity <= 0) return prevCarts;
      productName = p.name;
      
      let salePrice = p.price;
      if (settings.isPromoActive) salePrice *= (1 - (settings.promoDiscount / 100));

      const cartItems = [...cart.items];
      const idx = cartItems.findIndex(item => item.productId === p.id);
      
      if (idx > -1) {
        const nextQty = Math.min(cartItems[idx].quantity + 1, p.quantity);
        cartItems[idx] = { ...cartItems[idx], quantity: nextQty };
        finalQty = nextQty;
      } else {
        cartItems.push({ 
          productId: p.id, 
          productName: p.name, 
          quantity: 1, 
          price: salePrice, 
          costPrice: p.cost_price 
        });
        finalQty = 1;
      }
      
      cart.items = cartItems;
      newCarts[activeCartIndex] = cart;
      return newCarts;
    });

    if (productName) {
      setScanFeedback({ name: productName, qty: finalQty });
      setTimeout(() => setScanFeedback(null), 2000);
    }

    if (navigator.vibrate) navigator.vibrate(10);
  }, [products, settings.isPromoActive, settings.promoDiscount, activeCartIndex]);

  const handleScanResult = useCallback((res: any) => {
    const skuRaw = typeof res === 'string' ? res : res?.sku;
    if (skuRaw) {
      const targetSku = skuRaw.trim().toUpperCase();
      const product = products.find(p => p.sku.trim().toUpperCase() === targetSku);
      if (product) {
        handleProductSelection(product.id);
      }
    }
  }, [products, handleProductSelection]);

  const handleQuantityChange = (idx: number, val: string) => {
    const updated = [...currentCart.items];
    const p = products.find(prod => prod.id === updated[idx].productId);
    const newQty = val === '' ? 0 : parseInt(val);
    
    if (p && !isNaN(newQty)) {
      updated[idx].quantity = Math.min(Math.max(0, newQty), p.quantity);
      if (updated[idx].quantity === 0 && val !== '') {
        updated.splice(idx, 1);
      }
      updateActiveCart({ items: updated });
    }
  };

  const handleCheckout = async () => {
    if (currentCart.items.length === 0 || isProcessing) return;
    setIsProcessing(true);
    setErrorMsg(null);
    
    const saleCopy = {
      ...JSON.parse(JSON.stringify(currentCart)),
      ref: `#${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      date: new Date().toISOString()
    };
    setLastSaleForPrint(saleCopy);

    try {
      const success = await onRecordSale(currentCart.items, currentCart.customerName, 'UNIFIED TERMINAL', paymentMethod);
      
      if (success) {
        setIsProcessing(false);
        setTimeout(() => {
          window.print();
          handleCloseCart(activeCartIndex);
          setShowConfirmDialog(false);
          setIsTerminalOpen(false);
          setMobileCartOpen(false);
        }, 200);
      } else {
        setErrorMsg("DATABASE SYNC FAILED. PLEASE TRY AGAIN.");
        setIsProcessing(false);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("A NETWORK ERROR OCCURRED.");
      setIsProcessing(false);
    }
  };

  const handleReprint = (sale: Sale) => {
    const saleData: CartTab = {
      id: sale.id,
      items: sale.items,
      customerName: sale.customer_name || 'Walk-in',
      label: 'HISTORICAL',
      date: sale.date,
      ref: `#${sale.id.slice(0, 8).toUpperCase()}`
    };
    setLastSaleForPrint(saleData);
    setTimeout(() => {
      window.print();
    }, 300);
  };

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = (p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || (p.sku || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'ALL' || (p.category || '').toUpperCase() === selectedCategory.toUpperCase();
      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, selectedCategory]);

  const subtotal = currentCart.items.reduce((acc, i) => acc + (i.price * i.quantity), 0);
  const tax = subtotal * (settings.taxRate / 100);
  const total = subtotal + tax;

  const displayCompanyName = currentUser?.companyName || settings.companyName || 'StockBit Enterprise';

  return (
    <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors overflow-hidden">
      
      {scanFeedback && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 px-8 py-5 rounded-[2.5rem] shadow-neo-lg flex items-center gap-6 animate-in slide-in-from-top-10 duration-500 no-print">
          <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">Stock Synchronized</p>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[200px] leading-tight">{scanFeedback.name}</h4>
          </div>
          <div className="ml-4 pl-6 border-l border-slate-100 dark:border-slate-800">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">Queue Size</p>
            <h4 className="text-2xl font-display font-bold text-brand-primary">{scanFeedback.qty}</h4>
          </div>
        </div>
      )}

      {lastSaleForPrint && (
        <div className="print-only">
          <div className={`receipt-container ${receiptSize === '58mm' ? 'size-58mm' : ''} text-black bg-white mx-auto font-mono`}>
             <div className="text-center mb-6">
                <h1 className={`${receiptSize === '58mm' ? 'text-base' : 'text-xl'} font-bold uppercase tracking-tight leading-none mb-2`}>
                   {displayCompanyName}
                </h1>
                <p className="text-[10px] font-bold uppercase opacity-90 border-t border-b border-black border-dotted py-1 mb-2">Operational Manifest Entry</p>
             </div>
             
             <div className="space-y-1 mb-4 text-[10px] uppercase">
                <div className="flex justify-between"><span>LOG REF:</span> <span>{lastSaleForPrint.ref}</span></div>
                <div className="flex justify-between"><span>TIMESTAMP:</span> <span>{new Date(lastSaleForPrint.date || Date.now()).toLocaleString([], {dateStyle: 'short', timeStyle: 'short'})}</span></div>
                <div className="flex justify-between"><span>COUNTERPARTY:</span> <span className="truncate max-w-[120px]">{lastSaleForPrint.customerName || 'GENERAL ADMISSION'}</span></div>
                <div className="flex justify-between"><span>OPERATOR:</span> <span className="truncate max-w-[120px]">{currentUser?.name || 'ROOT'}</span></div>
             </div>

             <div className="w-full border-b-2 border-black mb-3"></div>
             
             <div className="space-y-3 mb-6">
                {lastSaleForPrint.items.map((item, i) => (
                  <div key={i} className="text-[10px] uppercase">
                     <div className="flex justify-between font-bold">
                        <span className="truncate flex-1 pr-4">{item.productName}</span>
                        <span className="shrink-0">{settings.currency}{(item.price * item.quantity).toLocaleString()}</span>
                     </div>
                     <div className="text-[9px] font-medium opacity-80 mt-0.5">
                        {item.quantity} QTY x {settings.currency}{item.price.toLocaleString()}
                     </div>
                  </div>
                ))}
             </div>

             <div className="w-full border-b border-black border-dashed mb-4"></div>

             <div className="space-y-1.5 text-[11px] uppercase">
                <div className="flex justify-between font-bold"><span>GROSS</span> <span>{settings.currency}{lastSaleForPrint.items.reduce((a,c)=>a+(c.price*c.quantity),0).toLocaleString()}</span></div>
                <div className="flex justify-between font-bold text-[10px]"><span>VAT ({settings.taxRate}%)</span> <span>{settings.currency}{(lastSaleForPrint.items.reduce((a,c)=>a+(c.price*c.quantity),0) * (settings.taxRate/100)).toLocaleString()}</span></div>
                
                <div className={`flex justify-between font-bold ${receiptSize === '58mm' ? 'text-lg' : 'text-2xl'} border-t-2 border-black pt-2 mt-2 leading-none`}>
                  <span>SETTLE</span> 
                  <span>{settings.currency}{(lastSaleForPrint.items.reduce((a,c)=>a+(c.price*c.quantity),0) * (1 + settings.taxRate/100)).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-[10px] font-bold mt-1">
                   <span>PROTOCOL:</span>
                   <span>{paymentMethod.toUpperCase()}</span>
                </div>
             </div>

             <div className="text-center mt-10 pb-8 space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-widest">VALIDATED TRANSACTION COMPLETE</p>
                <div className="w-full border-b border-black border-dotted my-2"></div>
                <p className="text-[7px] font-bold opacity-40 uppercase tracking-widest">NEURAL ID: {lastSaleForPrint.id}</p>
                <p className="text-[6px] font-bold opacity-30 tracking-widest uppercase">Infrastructure: STK-BIT CORE UNIT</p>
             </div>
          </div>
        </div>
      )}

      {!isTerminalOpen && (
        <div className="flex-1 p-6 md:p-12 space-y-12 animate-in fade-in duration-700 max-w-7xl mx-auto w-full no-print">
          <header className="flex flex-col md:flex-row items-baseline justify-between gap-8">
            <div>
              <h1 className="text-3xl md:text-5xl font-display font-bold tracking-tighter text-slate-900 dark:text-white mb-3">Trade Manifest</h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em] font-mono leading-none">Unified Commerce Terminal [0.9.4]</p>
            </div>
            <button 
              onClick={() => setIsTerminalOpen(true)}
              className="group px-10 py-5 bg-brand-primary text-white rounded-2xl font-bold uppercase text-xs tracking-widest shadow-xl shadow-brand-primary/20 active:scale-95 transition-all flex items-center gap-4"
            >
              <ShoppingCart size={20} className="group-hover:rotate-12 transition-transform" /> 
              <span>Initiate New Trade</span>
            </button>
          </header>

          <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-neo overflow-hidden">
            <div className="p-10 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between">
               <h3 className="text-[11px] font-bold uppercase tracking-[0.25em] text-slate-400">Historical Registry</h3>
               <History size={18} className="text-brand-primary opacity-40" />
            </div>
            <div className="overflow-x-auto">
               <table className="w-full text-left">
                  <thead className="bg-slate-50/50 dark:bg-slate-800/50 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                     <tr>
                        <th className="px-10 py-8">Neural Reference</th>
                        <th className="px-10 py-8">Counterparty</th>
                        <th className="px-10 py-8">Settlement</th>
                        <th className="px-10 py-8 text-right">Validation</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                     {(sales || []).slice(0, 10).map((sale, index) => (
                        <tr key={sale.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-all group animate-in slide-in-from-left-4" style={{ animationDelay: `${index * 50}ms` }}>
                           <td className="px-10 py-8">
                             <span className="font-mono text-[11px] text-slate-400 opacity-60">#{sale.id.slice(0,12).toUpperCase()}</span>
                           </td>
                           <td className="px-10 py-8 font-display font-bold text-sm tracking-tight text-slate-900 dark:text-white">
                             {sale.customer_name || 'Anonymous Client'}
                           </td>
                           <td className="px-10 py-8 font-display font-bold text-sm text-brand-primary">
                             <span className="text-[10px] font-sans opacity-40 mr-1 uppercase">{settings.currency}</span>
                             {sale.total_price.toLocaleString()}
                           </td>
                           <td className="px-10 py-8 text-right">
                              <button 
                                onClick={() => handleReprint(sale)}
                                className="w-10 h-10 bg-slate-100 dark:bg-slate-800 group-hover:bg-brand-primary rounded-xl text-slate-400 group-hover:text-white transition-all ml-auto flex items-center justify-center shadow-inner"
                                title="Reprint Protocol"
                              >
                                <Printer size={16} />
                              </button>
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
          </div>
        </div>
      )}

      {isTerminalOpen && (
        <div className="fixed inset-0 z-[60] bg-slate-50 dark:bg-slate-950 flex flex-col animate-in slide-in-from-bottom-5 duration-500 no-print transition-colors">
          
          <div className="h-20 bg-white dark:bg-slate-900 flex items-stretch border-b border-slate-100 dark:border-slate-800 shrink-0 overflow-hidden shadow-sm">
             <div className="flex-1 flex items-end px-6 gap-2 overflow-x-auto scrollbar-hide">
                {carts.map((cart, idx) => (
                  <button 
                    key={cart.id} 
                    onClick={() => setActiveCartIndex(idx)}
                    className={`h-14 px-8 rounded-t-2xl text-[10px] font-bold uppercase tracking-[0.15em] transition-all flex items-center gap-3 relative whitespace-nowrap shrink-0 border-t-2 border-x-2 border-transparent ${
                      activeCartIndex === idx 
                      ? 'bg-slate-50 dark:bg-slate-950 text-brand-primary border-slate-100 dark:border-slate-800 shadow-[0_-8px_16px_rgba(0,0,0,0.02)]' 
                      : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                    }`}
                  >
                     <ReceiptText size={16} className={activeCartIndex === idx ? 'text-brand-primary' : 'text-slate-300'} />
                     <span className="mb-0.5">{cart.label}</span>
                     {cart.items.length > 0 && <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/20"></span>}
                     {carts.length > 1 && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleCloseCart(idx); }} 
                          className="ml-3 w-5 h-5 bg-white dark:bg-slate-800 text-slate-300 hover:text-rose-500 rounded-full flex items-center justify-center transition-all hover:rotate-90"
                        >
                           <X size={10} />
                        </button>
                     )}
                  </button>
                ))}
                <button onClick={handleAddNewCart} className="h-14 px-5 text-slate-300 hover:text-brand-primary transition-all shrink-0 hover:scale-110"><Plus size={20}/></button>
             </div>

             <div className="flex items-center gap-6 px-8 border-l border-slate-100 dark:border-slate-800">
                <div className="hidden md:block text-right">
                   <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest font-mono">NODE OPERATOR</p>
                   <p className="text-[11px] font-bold text-slate-900 dark:text-white uppercase truncate max-w-[120px]">{currentUser?.name || 'ADMIN'}</p>
                </div>
                <button 
                  onClick={() => setIsTerminalOpen(false)} 
                  className="w-12 h-12 bg-rose-500 shadow-lg shadow-rose-500/20 text-white rounded-2xl hover:bg-rose-600 transition-all flex items-center justify-center active:scale-95"
                >
                   <X size={24} />
                </button>
             </div>
          </div>

          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-slate-50 dark:bg-slate-950 m-2 md:m-4 rounded-[2rem] md:rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-neo-lg relative transition-colors">
             
             <div className="flex-1 flex flex-col min-w-0 border-r border-slate-100 dark:border-slate-800">
                <div className="p-4 md:p-12 pb-4 md:pb-8 flex flex-col lg:flex-row gap-6 shrink-0">
                   <div className="relative flex-1 group">
                      <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-brand-primary transition-colors" size={20} />
                      <input 
                        type="text" 
                        placeholder="Search assets by SKU or name..." 
                        className="w-full pl-16 pr-8 py-5 md:py-6 bg-white dark:bg-slate-900 border-none rounded-[1.5rem] text-[11px] font-bold uppercase tracking-wider outline-none focus:ring-4 focus:ring-brand-primary/10 transition-all placeholder:text-slate-300 dark:placeholder:text-slate-700 text-slate-900 dark:text-white"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                   </div>
                   <button 
                     onClick={() => setIsScannerOpen(true)}
                     className="px-10 py-5 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-slate-800 rounded-[1.5rem] flex items-center justify-center gap-4 font-bold text-xs uppercase tracking-widest active:scale-95 transition-all hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm"
                   >
                      <Scan size={20} className="text-brand-primary" /> Visual Scan
                   </button>
                </div>

                <div className="px-6 md:px-12 py-3 flex gap-3 overflow-x-auto scrollbar-hide shrink-0 border-b border-slate-50 dark:border-slate-800">
                   {['ALL', ...settings.categories.slice(0, 12)].map(cat => (
                     <button 
                       key={cat} 
                       onClick={() => setSelectedCategory(cat.toUpperCase())}
                       className={`px-6 py-3 rounded-full text-[9px] font-bold uppercase tracking-widest transition-all whitespace-nowrap border ${selectedCategory === cat.toUpperCase() ? 'bg-brand-primary border-brand-primary text-white shadow-lg shadow-brand-primary/20 scale-105' : 'bg-white dark:bg-slate-900 text-slate-400 border-slate-100 dark:border-slate-800 hover:text-slate-900 dark:hover:text-slate-200 shadow-sm'}`}
                     >
                       {cat}
                     </button>
                   ))}
                </div>

                <div className="flex-1 overflow-y-auto p-6 md:p-12 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8 scrollbar-hide pb-32">
                   {filteredProducts.map((p, pIdx) => (
                     <button 
                       key={p.id} 
                       onClick={() => handleProductSelection(p.id)}
                       className="group bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 md:p-10 border border-slate-100 dark:border-slate-800 hover:border-brand-primary/50 transition-all flex flex-col text-left aspect-[4/5] relative overflow-hidden active:scale-95 shadow-sm hover:shadow-neo animate-in fade-in zoom-in-95"
                       style={{ animationDelay: `${pIdx * 30}ms` }}
                     >
                        <div className="absolute top-6 right-6 px-3 py-1 bg-slate-50 dark:bg-slate-800 rounded-full border border-slate-100 dark:border-white/5">
                           <span className={`text-[8px] font-bold uppercase tracking-widest ${p.quantity === 0 ? 'text-rose-500' : p.quantity < 10 ? 'text-amber-500' : 'text-emerald-500'}`}>{p.quantity} Units</span>
                        </div>
                        <div className="flex-1 space-y-4">
                           <div className="w-14 h-14 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-300 group-hover:scale-110 group-hover:bg-brand-primary group-hover:text-white transition-all duration-500 shadow-inner">
                              <Package size={24} />
                           </div>
                           <h4 className="text-[11px] font-bold text-slate-900 dark:text-white uppercase leading-tight line-clamp-3 tracking-tight">{p.name}</h4>
                        </div>
                        <div className="mt-8 flex items-center justify-between">
                           <div className="flex flex-col">
                              <p className="text-[8px] text-slate-300 font-bold uppercase tracking-widest mb-0.5">Valuation</p>
                              <span className="text-base font-display font-bold text-brand-primary"><span className="text-[10px] opacity-40 mr-0.5 uppercase">{settings.currency}</span>{p.price.toLocaleString()}</span>
                           </div>
                           <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center group-hover:bg-brand-primary group-hover:text-white transition-all shadow-inner group-hover:rotate-12">
                              <Plus size={20} />
                           </div>
                        </div>
                     </button>
                   ))}
                </div>
             </div>

             <div className="hidden lg:flex w-[480px] flex-col bg-white dark:bg-slate-900 overflow-hidden border-l border-slate-100 dark:border-slate-800 transition-colors">
                <div className="p-10 space-y-6 bg-slate-50/30 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
                   <div className="flex items-center gap-5">
                      <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400 shadow-sm border border-slate-100 dark:border-slate-800">
                         <User size={20} />
                      </div>
                      <input 
                        placeholder="IDENTIFY COUNTERPARTY..." 
                        className="flex-1 bg-white dark:bg-slate-800 border-none focus:ring-4 focus:ring-brand-primary/10 rounded-2xl px-6 py-4 text-[11px] font-bold uppercase tracking-widest outline-none shadow-sm text-slate-900 dark:text-white transition-all placeholder:text-slate-300" 
                        value={currentCart.customerName} 
                        onChange={e => updateActiveCart({ customerName: e.target.value })} 
                      />
                   </div>
                   <div className="flex items-center gap-5">
                      <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400 shadow-sm border border-slate-100 dark:border-slate-800">
                         <Edit3 size={20} />
                      </div>
                      <input 
                        placeholder="ORDER IDENTIFIER..." 
                        className="flex-1 bg-white dark:bg-slate-800 border-none focus:ring-4 focus:ring-brand-primary/10 rounded-2xl px-6 py-4 text-[11px] font-bold uppercase tracking-widest outline-none shadow-sm text-slate-900 dark:text-white transition-all placeholder:text-slate-300" 
                        value={currentCart.label} 
                        onChange={e => updateActiveCart({ label: e.target.value })} 
                      />
                   </div>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-4 scrollbar-hide bg-white dark:bg-slate-900">
                   {currentCart.items.map((item, idx) => (
                     <div key={idx} className="bg-slate-50 dark:bg-slate-800/40 rounded-[2rem] p-6 border border-slate-100 dark:border-white/5 group animate-in slide-in-from-right-8" style={{ animationDelay: `${idx * 50}ms` }}>
                        <div className="flex justify-between items-start mb-4">
                           <p className="text-[11px] font-bold uppercase tracking-tight truncate pr-6 text-slate-900 dark:text-white">{item.productName}</p>
                           <button onClick={() => {
                             const updated = [...currentCart.items];
                             updated.splice(idx, 1);
                             updateActiveCart({ items: updated });
                           }} className="text-slate-300 hover:text-rose-500 transition-all hover:scale-110 active:scale-90"><Trash2 size={18}/></button>
                        </div>
                        <div className="flex items-center justify-between">
                           <div className="flex flex-col">
                              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Asset Settle</p>
                              <p className="text-base font-display font-bold text-brand-primary tracking-tight">{settings.currency}{(item.price * item.quantity).toLocaleString()}</p>
                           </div>
                           <div className="flex items-center gap-2 bg-white dark:bg-slate-900 rounded-2xl p-1.5 border border-slate-100 dark:border-slate-800 shadow-sm">
                              <button onClick={() => {
                                const updated = [...currentCart.items];
                                if (updated[idx].quantity > 1) updated[idx].quantity -= 1;
                                else updated.splice(idx, 1);
                                updateActiveCart({ items: updated });
                              }} className="w-10 h-10 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-slate-400 transition-all active:scale-90"><Minus size={16}/></button>
                              
                              <input 
                                type="number"
                                className="w-14 h-10 bg-transparent border-none text-center text-xs font-bold p-0 focus:ring-0 text-slate-900 dark:text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                value={item.quantity}
                                onChange={(e) => handleQuantityChange(idx, e.target.value)}
                              />
                              
                              <button onClick={() => {
                                const updated = [...currentCart.items];
                                const p = products.find(prod => prod.id === item.productId);
                                if (p && updated[idx].quantity < p.quantity) {
                                  updated[idx].quantity += 1;
                                  updateActiveCart({ items: updated });
                                }
                              }} className="w-10 h-10 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-slate-400 transition-all active:scale-90"><Plus size={16}/></button>
                           </div>
                        </div>
                     </div>
                   ))}
                   {currentCart.items.length === 0 && (
                     <div className="flex flex-col items-center justify-center h-full opacity-20 py-20">
                        <ShoppingCart size={64} strokeWidth={1} />
                        <p className="text-[10px] font-bold uppercase tracking-[0.3em] mt-6">Awaiting Manifest</p>
                     </div>
                   )}
                </div>

                <div className="p-10 bg-slate-50 dark:bg-slate-950 space-y-8 transition-colors border-t border-slate-100 dark:border-slate-800">
                   <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400">
                      <span>GROSS SETTLE</span>
                      <span>{settings.currency}{subtotal.toLocaleString()}</span>
                   </div>
                   <div className="flex justify-between items-end border-t border-slate-200/50 dark:border-slate-800 pt-6">
                      <p className="text-[11px] font-bold uppercase text-brand-primary tracking-[0.3em] mb-1.5">NET TOTAL</p>
                      <h4 className="text-5xl font-display font-bold tracking-tighter text-slate-900 dark:text-white">{settings.currency}{total.toLocaleString()}</h4>
                   </div>
                   <button 
                     disabled={currentCart.items.length === 0 || isProcessing}
                     onClick={() => { setErrorMsg(null); setShowConfirmDialog(true); }}
                     className="w-full py-6 bg-brand-primary text-white rounded-[2rem] font-bold uppercase text-xs tracking-[0.2em] shadow-xl shadow-brand-primary/20 active:scale-95 transition-all flex items-center justify-center gap-4 disabled:opacity-20 disabled:grayscale"
                   >
                      FINALIZE MANIFEST <ChevronRight size={20} />
                   </button>
                </div>
             </div>

             <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 px-4 pb-6 pt-2 bg-gradient-to-t from-slate-200 dark:from-[#020617] to-transparent">
                <button 
                  onClick={() => setMobileCartOpen(true)}
                  className="w-full bg-[#4f46e5] dark:bg-white text-white dark:text-[#020617] p-5 rounded-[2.5rem] flex items-center justify-between shadow-[0_20px_50px_rgba(0,0,0,0.3)] active:scale-95 transition-all"
                >
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white/20 dark:bg-[#4f46e5] rounded-[1.2rem] flex items-center justify-center text-white relative shadow-lg">
                         <ShoppingCart size={22} />
                         {currentCart.items.length > 0 && <span className="absolute -top-1 -right-1 w-6 h-6 bg-rose-600 text-white rounded-full text-[10px] flex items-center justify-center border-4 border-[#4f46e5] dark:border-white font-black">{currentCart.items.length}</span>}
                      </div>
                      <div className="text-left">
                         <p className="text-[14px] font-black leading-none">{settings.currency}{total.toLocaleString()}</p>
                         <p className="text-[9px] font-black opacity-60 dark:text-slate-400 uppercase tracking-widest mt-1">Review Current Trade</p>
                      </div>
                   </div>
                   <div className="flex items-center gap-2 pr-2">
                      <span className="text-[9px] font-black uppercase tracking-widest">Review Cart</span>
                      <ChevronUp size={20} className="animate-bounce" />
                   </div>
                </button>
             </div>

             {mobileCartOpen && (
               <div className="lg:hidden fixed inset-0 z-[70] bg-slate-900/50 dark:bg-[#020617]/90 backdrop-blur-xl animate-in fade-in flex items-end">
                  <div className="w-full bg-white dark:bg-[#0a0f1d] rounded-t-[3rem] p-8 pb-24 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom-10 flex flex-col border-t border-slate-200 dark:border-white/5 transition-colors">
                     <div className="flex justify-between items-center mb-8">
                        <div>
                           <h3 className="text-xl font-black uppercase tracking-tighter text-slate-900 dark:text-white">Review Trade</h3>
                           <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Order Summary Protocol</p>
                        </div>
                        <button onClick={() => setMobileCartOpen(false)} className="w-10 h-10 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center text-slate-400 active:scale-90 transition-all"><X size={20}/></button>
                     </div>
                     <div className="space-y-4 mb-8">
                        {currentCart.items.map((item, idx) => (
                           <div key={idx} className="bg-slate-50 dark:bg-[#0f172a] p-5 rounded-[2rem] border border-slate-100 dark:border-white/5">
                              <div className="flex justify-between items-start mb-4">
                                 <p className="text-11px] font-black uppercase truncate pr-4 text-slate-900 dark:text-white">{item.productName}</p>
                                 <button onClick={() => {
                                    const updated = [...currentCart.items];
                                    updated.splice(idx, 1);
                                    updateActiveCart({ items: updated });
                                 }} className="text-slate-400 dark:text-slate-600"><Trash2 size={16}/></button>
                              </div>
                              <div className="flex items-center justify-between">
                                 <p className="text-[13px] font-black text-[#4f46e5] dark:text-indigo-400">{settings.currency}{(item.price * item.quantity).toLocaleString()}</p>
                                 <div className="flex items-center gap-1 bg-white dark:bg-black/40 rounded-xl p-1 border border-slate-200 dark:border-white/5 shadow-sm">
                                    <button onClick={() => {
                                       const updated = [...currentCart.items];
                                       if (updated[idx].quantity > 1) updated[idx].quantity -= 1;
                                       else updated.splice(idx, 1);
                                       updateActiveCart({ items: updated });
                                    }} className="w-8 h-8 flex items-center justify-center text-slate-400"><Minus size={14}/></button>
                                    <input 
                                       type="number" 
                                       className="w-12 text-center text-xs font-black p-0 border-none bg-transparent text-slate-900 dark:text-white focus:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                       value={item.quantity}
                                       onChange={(e) => handleQuantityChange(idx, e.target.value)}
                                    />
                                    <button onClick={() => {
                                       const updated = [...currentCart.items];
                                       const p = products.find(prod => prod.id === item.productId);
                                       if (p && updated[idx].quantity < p.quantity) {
                                          updated[idx].quantity += 1;
                                          updateActiveCart({ items: updated });
                                       }
                                    }} className="w-8 h-8 flex items-center justify-center text-slate-400"><Plus size={14}/></button>
                                 </div>
                              </div>
                           </div>
                        ))}
                     </div>
                     <div className="mt-auto space-y-6 pt-6 border-t border-slate-200 dark:border-white/5">
                        <div className="flex justify-between items-center">
                           <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Net Settle Amount</span>
                           <span className="text-3xl font-black text-slate-900 dark:text-white">{settings.currency}{total.toLocaleString()}</span>
                        </div>
                        <button 
                           onClick={() => { setErrorMsg(null); setShowConfirmDialog(true); }}
                           disabled={currentCart.items.length === 0 || isProcessing}
                           className="w-full py-6 bg-[#4f46e5] text-white rounded-[2rem] font-black uppercase text-xs tracking-[0.2em] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-4"
                        >
                           Finalize Trade <ChevronRight size={20} />
                        </button>
                     </div>
                  </div>
               </div>
             )}
          </div>

          {isScannerOpen && (
            <ScannerModal 
              onScan={handleScanResult} 
              onClose={() => setIsScannerOpen(false)} 
            />
          )}
        </div>
      )}

      {showConfirmDialog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-3xl no-print animate-in fade-in duration-500">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[4rem] border border-slate-100 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-700 delay-100 flex flex-col md:flex-row transition-colors">
             <div className="flex-1 p-10 md:p-14 space-y-10 border-r border-slate-100 dark:border-slate-800 flex flex-col justify-center text-center md:text-left transition-colors">
                <div className="w-20 h-20 bg-brand-primary/10 text-brand-primary rounded-[2rem] flex items-center justify-center mx-auto md:mx-0 mb-8 border border-brand-primary/20 shadow-sm animate-bounce-gentle">
                   <CreditCard size={36} />
                </div>
                <div>
                   <h3 className="text-3xl md:text-4xl font-display font-bold text-slate-900 dark:text-white leading-tight tracking-tighter">Trade Finalization</h3>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-3">Identity Validation Protocol 0.9.1</p>
                </div>
                
                <div className="flex flex-col gap-1.5 p-6 bg-slate-50/50 dark:bg-slate-950/50 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-inner">
                   <div className="flex bg-white dark:bg-slate-900 p-1.5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
                      <button onClick={() => setReceiptSize('80mm')} className={`flex-1 py-3 rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${receiptSize === '80mm' ? 'bg-brand-primary text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>
                        <Monitor size={14}/> 80MM STD
                      </button>
                      <button onClick={() => setReceiptSize('58mm')} className={`flex-1 py-3 rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${receiptSize === '58mm' ? 'bg-brand-primary text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>
                        <Tablet size={14}/> 58MM COMPACT
                      </button>
                   </div>
                   <p className="text-[8px] text-center font-bold text-slate-300 uppercase tracking-widest mt-2 px-6">Select preferred output protocol for physical manifest</p>
                </div>
             </div>

             <div className="flex-1 p-10 md:p-14 space-y-10 bg-slate-50/30 dark:bg-slate-950/30 flex flex-col justify-between transition-colors">
                <div className="space-y-6">
                   <div className="flex flex-col gap-4">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Settlement Protocol</p>
                      <div className="grid grid-cols-1 gap-3">
                         {(['cash', 'pos', 'transfer'] as const).map(method => (
                           <button 
                             key={method}
                             onClick={() => setPaymentMethod(method)}
                             className={`group relative py-6 rounded-[2rem] border-2 transition-all flex items-center px-10 gap-6 ${paymentMethod === method ? 'bg-brand-primary border-brand-primary text-white shadow-xl shadow-brand-primary/20 scale-105' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-400 hover:border-brand-primary/40 shadow-sm'}`}
                           >
                              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${paymentMethod === method ? 'bg-white/20 text-white' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 group-hover:bg-brand-primary/10 group-hover:text-brand-primary shadow-inner'}`}>
                                 {method === 'cash' && <Banknote size={24} />}
                                 {method === 'pos' && <CreditCard size={24} />}
                                 {method === 'transfer' && <ArrowUpRight size={24} />}
                              </div>
                              <span className="text-[11px] font-bold uppercase tracking-[0.2em]">{method}</span>
                              {paymentMethod === method && <div className="ml-auto w-3 h-3 bg-white rounded-full shadow-lg animate-pulse"></div>}
                           </button>
                         ))}
                      </div>
                   </div>

                   <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-neo">
                      <div className="flex justify-between items-center text-[10px] font-bold text-brand-primary uppercase tracking-[0.3em] mb-3">
                         <span>Net Total Settle</span>
                         <span className="bg-brand-primary/10 px-3 py-1 rounded-full text-[8px] tracking-tight">VALIDATED</span>
                      </div>
                      <div className="text-4xl md:text-5xl font-display font-bold text-slate-900 dark:text-white tracking-tighter tabular-nums">{settings.currency}{total.toLocaleString()}</div>
                   </div>

                   {errorMsg && (
                      <div className="p-5 bg-rose-50 dark:bg-rose-500/10 text-rose-500 border border-rose-100 dark:border-rose-500/20 rounded-2xl flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest animate-shake">
                         <AlertCircle size={20} className="shrink-0" /> <span className="flex-1">{errorMsg}</span>
                      </div>
                   )}
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                   <button 
                     onClick={() => setShowConfirmDialog(false)}
                     className="flex-1 py-5 px-8 text-slate-400 hover:text-rose-500 font-bold uppercase text-[10px] tracking-widest transition-all"
                   >
                      Abort Manifest
                   </button>
                   <button 
                     disabled={isProcessing}
                     onClick={handleCheckout}
                     className="flex-[1.5] py-5 px-10 bg-slate-900 dark:bg-brand-primary text-white rounded-[1.5rem] font-bold uppercase text-xs tracking-widest shadow-xl shadow-brand-primary/20 active:scale-95 transition-all flex items-center justify-center gap-4 disabled:opacity-50 disabled:grayscale group"
                   >
                      {isProcessing ? 'SYNCHRONIZING...' : 'VALIDATE TRADE'} 
                      {!isProcessing && <ChevronRight size={22} className="group-hover:translate-x-1 transition-transform" />}
                   </button>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sales;
