
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
    label: 'SALE 1'
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
      label: `SALE ${nextNum}`
    };
    setCarts([...carts, newCart]);
    setActiveCartIndex(carts.length);
  };

  const handleCloseCart = (index: number) => {
    if (carts.length === 1) {
      setCarts([{ id: '1', items: [], customerName: '', label: 'SALE 1' }]);
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
      const success = await onRecordSale(currentCart.items, currentCart.customerName, 'POS TERMINAL', paymentMethod);
      
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
        setErrorMsg("Failed to synchronize with server. Please try again.");
        setIsProcessing(false);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("A network error occurred. Please check your connection.");
      setIsProcessing(false);
    }
  };

  const handleReprint = (sale: Sale) => {
    const saleData: CartTab = {
      id: sale.id,
      items: sale.items,
      customerName: sale.customer_name || 'Walk-in Guest',
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

  const displayCompanyName = currentUser?.companyName || settings.companyName || 'StockBit Pro';

  return (
    <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors overflow-hidden">
      
      {scanFeedback && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-8 py-5 rounded-2xl shadow-xl flex items-center gap-6 animate-in slide-in-from-top-10 duration-500 no-print">
          <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Items Scanned</p>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[200px]">{scanFeedback.name}</h4>
          </div>
          <div className="ml-4 pl-6 border-l border-slate-100 dark:border-slate-800">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Cart Qty</p>
            <h4 className="text-2xl font-bold text-indigo-600">{scanFeedback.qty}</h4>
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
                <p className="text-[10px] font-bold uppercase opacity-90 border-t border-b border-black border-dotted py-1 mb-2">Sales Receipt</p>
             </div>
             
             <div className="space-y-1 mb-4 text-[10px] uppercase">
                <div className="flex justify-between"><span>ORDER REF:</span> <span>{lastSaleForPrint.ref}</span></div>
                <div className="flex justify-between"><span>DATE:</span> <span>{new Date(lastSaleForPrint.date || Date.now()).toLocaleString()}</span></div>
                <div className="flex justify-between"><span>CUSTOMER:</span> <span className="truncate max-w-[120px]">{lastSaleForPrint.customerName || 'WALK-IN GUEST'}</span></div>
                <div className="flex justify-between"><span>CASHIER:</span> <span className="truncate max-w-[120px]">{currentUser?.name || 'ADMIN'}</span></div>
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
                        {item.quantity} x {settings.currency}{item.price.toLocaleString()}
                     </div>
                  </div>
                ))}
             </div>

             <div className="w-full border-b border-black border-dashed mb-4"></div>

             <div className="space-y-1.5 text-[11px] uppercase">
                <div className="flex justify-between font-bold"><span>SUBTOTAL</span> <span>{settings.currency}{lastSaleForPrint.items.reduce((a,c)=>a+(c.price*c.quantity),0).toLocaleString()}</span></div>
                <div className="flex justify-between font-bold text-[10px]"><span>VAT ({settings.taxRate}%)</span> <span>{settings.currency}{(lastSaleForPrint.items.reduce((a,c)=>a+(c.price*c.quantity),0) * (settings.taxRate/100)).toLocaleString()}</span></div>
                
                <div className={`flex justify-between font-bold ${receiptSize === '58mm' ? 'text-lg' : 'text-2xl'} border-t-2 border-black pt-2 mt-2 leading-none`}>
                  <span>TOTAL</span> 
                  <span>{settings.currency}{(lastSaleForPrint.items.reduce((a,c)=>a+(c.price*c.quantity),0) * (1 + settings.taxRate/100)).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-[10px] font-bold mt-1">
                   <span>PAYMENT:</span>
                   <span>{paymentMethod.toUpperCase()}</span>
                </div>
             </div>

             <div className="text-center mt-10 pb-8 space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-widest">THANK YOU FOR YOUR PATRONAGE</p>
                <div className="w-full border-b border-black border-dotted my-2"></div>
                <p className="text-[7px] font-bold opacity-40 uppercase tracking-widest">SALE ID: {lastSaleForPrint.id}</p>
                <p className="text-[6px] font-bold opacity-30 tracking-widest uppercase">POWERED BY STOCKBIT PRO</p>
             </div>
          </div>
        </div>
      )}

      {!isTerminalOpen && (
        <div className="flex-1 p-6 md:p-10 space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto w-full no-print">
          <header className="flex flex-col md:flex-row items-baseline justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">Sales & Transactions</h1>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider leading-none">Point of Sale Terminal</p>
            </div>
            <button 
              onClick={() => setIsTerminalOpen(true)}
              className="group px-8 py-4 bg-indigo-600 text-white rounded-xl font-bold uppercase text-xs tracking-wider shadow-lg shadow-indigo-600/20 active:scale-95 transition-all flex items-center gap-3"
            >
              <ShoppingCart size={18} className="group-hover:rotate-12 transition-transform" /> 
              <span>Record New Sale</span>
            </button>
          </header>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
               <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Transaction History</h3>
               <History size={18} className="text-indigo-600 opacity-40" />
            </div>
            <div className="overflow-x-auto">
               <table className="w-full text-left font-normal">
                  <thead className="bg-slate-50/50 dark:bg-slate-800/50 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800">
                     <tr>
                        <th className="px-6 py-4">Ref ID</th>
                        <th className="px-6 py-4">Customer</th>
                        <th className="px-6 py-4">Total Amount</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                     {(sales || []).slice(0, 10).map((sale, index) => (
                        <tr key={sale.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-all group animate-in slide-in-from-left-2" style={{ animationDelay: `${index * 50}ms` }}>
                           <td className="px-6 py-6">
                             <span className="font-mono text-[10px] text-slate-400">#{sale.id.slice(0,10).toUpperCase()}</span>
                           </td>
                           <td className="px-6 py-6 font-bold text-sm tracking-tight text-slate-900 dark:text-white">
                             {sale.customer_name || 'Walk-in Guest'}
                           </td>
                           <td className="px-6 py-6 font-bold text-sm text-indigo-600">
                             <span className="text-[10px] font-sans opacity-40 mr-1 uppercase">{settings.currency}</span>
                             {sale.total_price.toLocaleString()}
                           </td>
                           <td className="px-6 py-6 text-right">
                              <button 
                                onClick={() => handleReprint(sale)}
                                className="w-9 h-9 bg-slate-100 dark:bg-slate-800 group-hover:bg-indigo-600 rounded-lg text-slate-400 group-hover:text-white transition-all ml-auto flex items-center justify-center"
                                title="Reprint Receipt"
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
          
          <div className="h-20 bg-white dark:bg-slate-900 flex items-stretch border-b border-slate-100 dark:border-slate-800 shrink-0 shadow-sm relative z-10">
             <div className="flex-1 flex items-end px-6 gap-2 overflow-x-auto scrollbar-hide">
                {carts.map((cart, idx) => (
                  <button 
                    key={cart.id} 
                    onClick={() => setActiveCartIndex(idx)}
                    className={`h-14 px-8 rounded-t-xl text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-3 relative whitespace-nowrap shrink-0 border-t-2 border-x-2 border-transparent ${
                      activeCartIndex === idx 
                      ? 'bg-slate-50 dark:bg-slate-950 text-indigo-600 border-slate-100 dark:border-slate-800' 
                      : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                    }`}
                  >
                     <ReceiptText size={16} className={activeCartIndex === idx ? 'text-indigo-600' : 'text-slate-300'} />
                     <span className="mb-0.5">{cart.label}</span>
                     {cart.items.length > 0 && <span className="w-2 h-2 rounded-full bg-emerald-500"></span>}
                     {carts.length > 1 && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleCloseCart(idx); }} 
                          className="ml-3 w-5 h-5 bg-white dark:bg-slate-800 text-slate-300 hover:text-rose-500 rounded-full flex items-center justify-center transition-all"
                        >
                           <X size={10} />
                        </button>
                     )}
                  </button>
                ))}
                <button onClick={handleAddNewCart} className="h-14 px-5 text-slate-300 hover:text-indigo-600 transition-all shrink-0"><Plus size={20}/></button>
             </div>

             <div className="flex items-center gap-4 px-6 border-l border-slate-100 dark:border-slate-800">
                <div className="hidden md:block text-right">
                   <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">CASHIER</p>
                   <p className="text-[11px] font-bold text-slate-900 dark:text-white uppercase truncate max-w-[120px]">{currentUser?.name || 'ADMIN'}</p>
                </div>
                <button 
                  onClick={() => setIsTerminalOpen(false)} 
                  className="w-10 h-10 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center active:scale-95"
                >
                   <X size={20} />
                </button>
             </div>
          </div>

          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-slate-50 dark:bg-slate-950 m-2 md:m-4 rounded-2xl md:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl relative transition-colors">
             
             <div className="flex-1 flex flex-col min-w-0 border-r border-slate-200 dark:border-slate-800">
                <div className="p-6 md:p-10 pb-4 md:pb-6 flex flex-col lg:flex-row gap-4 shrink-0">
                   <div className="relative flex-1 group">
                      <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" size={20} />
                      <input 
                        type="text" 
                        placeholder="Search products by SKU or name..." 
                        className="w-full pl-16 pr-8 py-4 md:py-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-xs font-bold uppercase tracking-wider outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-slate-900 dark:text-white"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                   </div>
                   <button 
                     onClick={() => setIsScannerOpen(true)}
                     className="px-8 py-4 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-center gap-3 font-bold text-xs uppercase tracking-wider active:scale-95 transition-all hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm"
                   >
                      <Scan size={20} className="text-indigo-600" /> Barcode Scan
                   </button>
                </div>

                <div className="px-6 md:px-10 py-2 flex gap-2 overflow-x-auto scrollbar-hide shrink-0 border-b border-slate-100 dark:border-slate-800">
                   {['ALL', ...settings.categories.slice(0, 12)].map(cat => (
                     <button 
                       key={cat} 
                       onClick={() => setSelectedCategory(cat.toUpperCase())}
                       className={`px-5 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap border ${selectedCategory === cat.toUpperCase() ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'bg-white dark:bg-slate-900 text-slate-400 border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-slate-200 shadow-sm'}`}
                     >
                       {cat}
                     </button>
                   ))}
                </div>

                <div className="flex-1 overflow-y-auto p-6 md:p-10 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-6 scrollbar-hide pb-32">
                   {filteredProducts.map((p, pIdx) => (
                     <button 
                       key={p.id} 
                       onClick={() => handleProductSelection(p.id)}
                       className="group bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 transition-all flex flex-col text-left aspect-[4/5] relative overflow-hidden active:scale-95 shadow-sm hover:shadow-md animate-in fade-in zoom-in-95"
                       style={{ animationDelay: `${pIdx * 30}ms` }}
                     >
                        <div className="absolute top-4 right-4 px-2 py-0.5 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-white/5">
                           <span className={`text-[9px] font-bold uppercase tracking-wider ${p.quantity === 0 ? 'text-rose-500' : p.quantity < 10 ? 'text-amber-500' : 'text-emerald-500'}`}>{p.quantity} Unit</span>
                        </div>
                        <div className="flex-1 space-y-4">
                           <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-300 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner">
                              <Package size={20} />
                           </div>
                           <h4 className="text-[11px] font-bold text-slate-900 dark:text-white uppercase leading-tight line-clamp-3">{p.name}</h4>
                        </div>
                        <div className="mt-6 flex items-center justify-between">
                           <div className="flex flex-col">
                              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Price</p>
                              <span className="text-base font-bold text-indigo-600"><span className="text-[10px] opacity-40 mr-0.5 uppercase">{settings.currency}</span>{p.price.toLocaleString()}</span>
                           </div>
                           <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner">
                              <Plus size={18} />
                           </div>
                        </div>
                     </button>
                   ))}
                </div>
             </div>

             <div className="hidden lg:flex w-96 flex-col bg-white dark:bg-slate-900 overflow-hidden border-l border-slate-200 dark:border-slate-800 transition-colors">
                <div className="p-8 space-y-4 bg-slate-50/50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 shadow-sm border border-slate-200 dark:border-slate-800">
                         <User size={18} />
                      </div>
                      <input 
                        placeholder="CUSTOMER NAME..." 
                        className="flex-1 bg-white dark:bg-slate-800 border-none focus:ring-2 focus:ring-indigo-500/20 rounded-xl px-4 py-3 text-[10px] font-bold uppercase tracking-wider outline-none shadow-sm text-slate-900 dark:text-white transition-all placeholder:text-slate-300 font-sans" 
                        value={currentCart.customerName} 
                        onChange={e => updateActiveCart({ customerName: e.target.value })} 
                      />
                   </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-3 scrollbar-hide bg-white dark:bg-slate-900">
                   {currentCart.items.map((item, idx) => (
                     <div key={idx} className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-4 border border-slate-200 dark:border-white/5 group animate-in slide-in-from-right-4" style={{ animationDelay: `${idx * 50}ms` }}>
                        <div className="flex justify-between items-start mb-3">
                           <p className="text-[10px] font-bold uppercase tracking-tight truncate pr-4 text-slate-900 dark:text-white">{item.productName}</p>
                           <button onClick={() => {
                             const updated = [...currentCart.items];
                             updated.splice(idx, 1);
                             updateActiveCart({ items: updated });
                           }} className="text-slate-300 hover:text-rose-500 transition-all"><Trash2 size={16}/></button>
                        </div>
                        <div className="flex items-center justify-between">
                           <div className="flex flex-col">
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Subtotal</p>
                              <p className="text-sm font-bold text-indigo-600">{settings.currency}{(item.price * item.quantity).toLocaleString()}</p>
                           </div>
                           <div className="flex items-center gap-1 bg-white dark:bg-slate-950 rounded-xl p-1 border border-slate-200 dark:border-slate-800 shadow-sm">
                              <button onClick={() => {
                                const updated = [...currentCart.items];
                                if (updated[idx].quantity > 1) updated[idx].quantity -= 1;
                                else updated.splice(idx, 1);
                                updateActiveCart({ items: updated });
                              }} className="w-8 h-8 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-slate-400 transition-all active:scale-90"><Minus size={14}/></button>
                              
                              <input 
                                type="number"
                                className="w-10 h-8 bg-transparent border-none text-center text-xs font-bold p-0 focus:ring-0 text-slate-900 dark:text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
                              }} className="w-8 h-8 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-slate-400 transition-all active:scale-90"><Plus size={14}/></button>
                           </div>
                        </div>
                     </div>
                   ))}
                   {currentCart.items.length === 0 && (
                     <div className="flex flex-col items-center justify-center h-full opacity-20 py-20">
                        <ShoppingCart size={48} strokeWidth={1} />
                        <p className="text-[10px] font-bold uppercase tracking-widest mt-4">Empty Bag</p>
                     </div>
                   )}
                </div>

                <div className="p-8 bg-slate-50 dark:bg-slate-950 space-y-6 transition-colors border-t border-slate-200 dark:border-slate-800">
                   <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      <span>GROSS TOTAL</span>
                      <span>{settings.currency}{subtotal.toLocaleString()}</span>
                   </div>
                   <div className="flex justify-between items-end border-t border-slate-200/50 dark:border-slate-800 pt-6">
                      <p className="text-[11px] font-bold uppercase text-indigo-600 tracking-wider mb-1">TOTAL AMOUNT</p>
                      <h4 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{settings.currency}{total.toLocaleString()}</h4>
                   </div>
                   <button 
                     disabled={currentCart.items.length === 0 || isProcessing}
                     onClick={() => { setErrorMsg(null); setShowConfirmDialog(true); }}
                     className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold uppercase text-xs tracking-wider shadow-lg shadow-indigo-600/20 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-30 disabled:grayscale"
                   >
                      Proceed to Checkout <ChevronRight size={18} />
                   </button>
                </div>
             </div>

             <div className="lg:hidden fixed bottom-6 left-6 right-6 z-50">
                <button 
                  onClick={() => setMobileCartOpen(true)}
                  className="w-full bg-indigo-600 text-white p-4 rounded-2xl flex items-center justify-between shadow-2xl active:scale-95 transition-all"
                >
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-white relative">
                         <ShoppingCart size={20} />
                         {currentCart.items.length > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-600 text-white rounded-full text-[9px] flex items-center justify-center font-bold">{currentCart.items.length}</span>}
                      </div>
                      <div className="text-left">
                         <p className="text-[13px] font-bold leading-none">{settings.currency}{total.toLocaleString()}</p>
                         <p className="text-[9px] font-bold opacity-60 uppercase mt-1">Review Current Sale</p>
                      </div>
                   </div>
                   <ChevronUp size={18} className="animate-bounce" />
                </button>
             </div>

             {mobileCartOpen && (
               <div className="lg:hidden fixed inset-0 z-[70] bg-slate-900/50 backdrop-blur-sm animate-in fade-in flex items-end">
                  <div className="w-full bg-white dark:bg-slate-900 rounded-t-3xl p-6 pb-24 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom-10 flex flex-col border-t border-slate-200 dark:border-slate-800 transition-colors">
                     <div className="flex justify-between items-center mb-6">
                        <div>
                           <h3 className="text-xl font-bold text-slate-900 dark:text-white">Review Sale</h3>
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Order Summary</p>
                        </div>
                        <button onClick={() => setMobileCartOpen(false)} className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 active:scale-90 transition-all"><X size={20}/></button>
                     </div>
                     <div className="space-y-3 mb-6">
                        {currentCart.items.map((item, idx) => (
                           <div key={idx} className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-white/5">
                              <div className="flex justify-between items-start mb-3">
                                 <p className="text-[11px] font-bold uppercase truncate pr-4 text-slate-900 dark:text-white">{item.productName}</p>
                                 <button onClick={() => {
                                    const updated = [...currentCart.items];
                                    updated.splice(idx, 1);
                                    updateActiveCart({ items: updated });
                                 }} className="text-slate-400"><Trash2 size={14}/></button>
                              </div>
                              <div className="flex items-center justify-between">
                                 <p className="text-sm font-bold text-indigo-600">{settings.currency}{(item.price * item.quantity).toLocaleString()}</p>
                                 <div className="flex items-center gap-1 bg-white dark:bg-black/20 rounded-lg p-1 border border-slate-200 dark:border-white/5">
                                    <button onClick={() => {
                                       const updated = [...currentCart.items];
                                       if (updated[idx].quantity > 1) updated[idx].quantity -= 1;
                                       else updated.splice(idx, 1);
                                       updateActiveCart({ items: updated });
                                    }} className="w-8 h-8 flex items-center justify-center text-slate-400"><Minus size={14}/></button>
                                    <input 
                                       type="number" 
                                       className="w-10 text-center text-xs font-bold p-0 border-none bg-transparent text-slate-900 dark:text-white focus:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
                     <div className="mt-auto space-y-6 pt-6 border-t border-slate-100 dark:border-white/5">
                        <div className="flex justify-between items-center">
                           <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Settle Amount</span>
                           <span className="text-3xl font-bold text-slate-900 dark:text-white">{settings.currency}{total.toLocaleString()}</span>
                        </div>
                        <button 
                           onClick={() => { setErrorMsg(null); setShowConfirmDialog(true); }}
                           disabled={currentCart.items.length === 0 || isProcessing}
                           className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold uppercase text-xs tracking-wider shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3"
                        >
                           Finalize Sale <ChevronRight size={18} />
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm no-print animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500 flex flex-col md:flex-row transition-colors">
             <div className="flex-1 p-8 md:p-10 space-y-8 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-center text-center md:text-left transition-colors">
                <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/10 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto md:mx-0 mb-4">
                   <CreditCard size={32} />
                </div>
                <div>
                   <h3 className="text-3xl font-bold text-slate-900 dark:text-white leading-tight">Confirm Payment</h3>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-2">Select receipt size and verify details</p>
                </div>
                
                <div className="flex flex-col gap-2 p-5 bg-slate-50/50 dark:bg-slate-950/50 rounded-2xl border border-slate-200 dark:border-slate-800">
                   <div className="flex bg-white dark:bg-slate-900 p-1 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
                      <button onClick={() => setReceiptSize('80mm')} className={`flex-1 py-2 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${receiptSize === '80mm' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>
                        <Monitor size={14}/> 80MM STD
                      </button>
                      <button onClick={() => setReceiptSize('58mm')} className={`flex-1 py-2 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${receiptSize === '58mm' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>
                        <Tablet size={14}/> 58MM COMPACT
                      </button>
                   </div>
                   <p className="text-[9px] text-center font-bold text-slate-400 uppercase tracking-wider mt-2">Select output format for physical receipt</p>
                </div>
             </div>

             <div className="flex-1 p-8 md:p-10 space-y-6 bg-slate-50/30 dark:bg-slate-950/30 flex flex-col justify-between transition-colors">
                <div className="space-y-4">
                   <div className="flex flex-col gap-3">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Settlement Method</p>
                      <div className="grid grid-cols-1 gap-2">
                         {(['cash', 'pos', 'transfer'] as const).map(method => (
                           <button 
                             key={method}
                             onClick={() => setPaymentMethod(method)}
                             className={`group relative py-4 rounded-2xl border-2 transition-all flex items-center px-6 gap-4 ${paymentMethod === method ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:border-indigo-500/40'}`}
                           >
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${paymentMethod === method ? 'bg-white/20 text-white' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 group-hover:bg-indigo-500/10 group-hover:text-indigo-600 shadow-inner'}`}>
                                 {method === 'cash' && <Banknote size={20} />}
                                 {method === 'pos' && <CreditCard size={20} />}
                                 {method === 'transfer' && <ArrowUpRight size={20} />}
                              </div>
                              <span className="text-xs font-bold uppercase tracking-wider">{method}</span>
                              {paymentMethod === method && <CheckCircle2 size={16} className="ml-auto text-white" />}
                           </button>
                         ))}
                      </div>
                   </div>
                </div>

                <div className="space-y-4">
                   <div className="flex justify-between items-end border-t border-slate-200 dark:border-slate-800 pt-4">
                      <p className="text-[10px] font-bold uppercase text-slate-400 mb-1">FINAL TOTAL</p>
                      <h4 className="text-3xl font-bold text-slate-900 dark:text-white">{settings.currency}{total.toLocaleString()}</h4>
                   </div>
                   
                   {errorMsg && (
                     <div className="p-3 bg-rose-50 text-rose-600 text-[10px] font-bold uppercase rounded-lg border border-rose-100 flex items-center gap-2 animate-shake">
                        <AlertCircle size={14} /> {errorMsg}
                     </div>
                   )}

                   <div className="flex gap-2">
                      <button 
                        onClick={() => setShowConfirmDialog(false)}
                        className="flex-1 py-4 bg-white dark:bg-slate-800 text-slate-500 rounded-xl font-bold uppercase text-[10px] tracking-wider border border-slate-200 dark:border-slate-700 hover:bg-slate-50 active:scale-95 transition-all"
                      >
                         Cancel
                      </button>
                      <button 
                        onClick={handleCheckout}
                        disabled={isProcessing}
                        className="flex-[2] py-4 bg-indigo-600 text-white rounded-xl font-bold uppercase text-[10px] tracking-wider shadow-lg shadow-indigo-600/30 hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-2"
                      >
                         {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
                         {isProcessing ? 'Processing...' : 'Complete Sale'}
                      </button>
                   </div>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sales;
