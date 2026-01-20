
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { 
  ShoppingCart, Search, Plus, Minus, X, Scan, User, Edit3, ChevronRight, Loader2, Printer, 
  Trash2, ReceiptText, Banknote, CreditCard, History, Package, ChevronUp, ChevronDown, ShieldCheck,
  CheckCircle2
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
  
  // Feedback for continuous scanning
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

    // Provide immediate visual feedback for the scan
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

  const handleCheckout = async (status: 'completed' | 'pending') => {
    if (currentCart.items.length === 0 || isProcessing) return;
    setIsProcessing(true);
    
    const saleCopy = {
      ...JSON.parse(JSON.stringify(currentCart)),
      ref: `#${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      date: new Date().toISOString()
    };
    setLastSaleForPrint(saleCopy);

    try {
      const success = await onRecordSale(currentCart.items, currentCart.customerName, 'UNIFIED TERMINAL', paymentMethod, status);
      if (success) {
        setTimeout(() => {
          window.print();
          handleCloseCart(activeCartIndex);
          setShowConfirmDialog(false);
          setIsTerminalOpen(false);
          setMobileCartOpen(false);
        }, 300);
      }
    } catch (err) {
      console.error(err);
    } finally {
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
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'ALL' || p.category.toUpperCase() === selectedCategory.toUpperCase();
      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, selectedCategory]);

  const subtotal = currentCart.items.reduce((acc, i) => acc + (i.price * i.quantity), 0);
  const tax = subtotal * (settings.taxRate / 100);
  const total = subtotal + tax;

  const displayCompanyName = currentUser?.companyName || settings.companyName;

  return (
    <div className="h-full flex flex-col bg-[#020617] text-white overflow-hidden">
      
      {/* SCAN FEEDBACK OVERLAY */}
      {scanFeedback && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] bg-emerald-600 text-white px-8 py-4 rounded-[2rem] shadow-2xl flex items-center gap-4 animate-in slide-in-from-top-10 duration-300">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase opacity-80 tracking-widest leading-none mb-1">Product Added</p>
            <h4 className="text-sm font-black uppercase truncate max-w-[200px]">{scanFeedback.name}</h4>
          </div>
          <div className="ml-4 pl-4 border-l border-white/20">
            <p className="text-[10px] font-black uppercase opacity-80 tracking-widest leading-none mb-1">Cart Qty</p>
            <h4 className="text-xl font-black">{scanFeedback.qty}</h4>
          </div>
        </div>
      )}

      {/* HIDDEN PRINT RECEIPT */}
      {lastSaleForPrint && (
        <div className="print-only">
          <div className="receipt-print p-8 text-black bg-white max-w-[80mm] mx-auto border border-dashed border-black">
             <div className="text-center mb-6">
                <h2 className="text-xl font-black uppercase tracking-tight leading-none mb-1">{displayCompanyName}</h2>
                <p className="text-[10px] font-bold uppercase opacity-60">Professional Retail Receipt</p>
                <div className="w-full border-b border-black border-dashed my-4"></div>
             </div>
             
             <div className="space-y-1 mb-6 text-[10px] font-mono">
                <div className="flex justify-between uppercase"><span>REF NO:</span> <span>{lastSaleForPrint.ref}</span></div>
                <div className="flex justify-between uppercase"><span>DATE:</span> <span>{new Date(lastSaleForPrint.date || Date.now()).toLocaleDateString()} {new Date(lastSaleForPrint.date || Date.now()).toLocaleTimeString()}</span></div>
                <div className="flex justify-between uppercase"><span>CLIENT:</span> <span>{lastSaleForPrint.customerName || 'WALK-IN'}</span></div>
                <div className="flex justify-between uppercase"><span>OPERATOR:</span> <span>{currentUser?.name || 'ADMIN'}</span></div>
             </div>

             <div className="w-full border-b border-black border-dashed mb-4"></div>
             
             <div className="space-y-4 mb-6">
                {lastSaleForPrint.items.map((item, i) => (
                  <div key={i} className="text-[10px] uppercase font-mono">
                     <div className="flex justify-between font-bold">
                        <span>{item.productName}</span>
                        <span>{settings.currency}{(item.price * item.quantity).toLocaleString()}</span>
                     </div>
                     <div className="text-[8px] opacity-60">
                        {item.quantity} UNIT(S) @ {settings.currency}{item.price.toLocaleString()}
                     </div>
                  </div>
                ))}
             </div>

             <div className="w-full border-b border-black border-dashed mb-4"></div>

             <div className="space-y-1 text-[11px] uppercase font-mono">
                <div className="flex justify-between"><span>SUBTOTAL</span> <span>{settings.currency}{lastSaleForPrint.items.reduce((a,c)=>a+(c.price*c.quantity),0).toLocaleString()}</span></div>
                <div className="flex justify-between"><span>TAX ({settings.taxRate}%)</span> <span>{settings.currency}{(lastSaleForPrint.items.reduce((a,c)=>a+(c.price*c.quantity),0) * (settings.taxRate/100)).toLocaleString()}</span></div>
                <div className="flex justify-between font-black text-sm border-t border-black pt-2 mt-2"><span>TOTAL</span> <span>{settings.currency}{(lastSaleForPrint.items.reduce((a,c)=>a+(c.price*c.quantity),0) * (1 + settings.taxRate/100)).toLocaleString()}</span></div>
             </div>

             <div className="text-center mt-10">
                <p className="text-[8px] font-black uppercase tracking-widest mb-1">Thank you for your business</p>
                <p className="text-[7px] font-bold opacity-40">System Powered by StockBit Pro AI</p>
             </div>
          </div>
        </div>
      )}

      {!isTerminalOpen && (
        <div className="flex-1 p-6 md:p-12 space-y-10 animate-in fade-in duration-500 max-w-7xl mx-auto w-full">
          <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <h1 className="text-4xl font-black tracking-tighter uppercase">Unified Protocol</h1>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em] mt-1">Terminal Hub v4.2</p>
            </div>
            <button 
              onClick={() => setIsTerminalOpen(true)}
              className="px-10 py-5 bg-[#4f46e5] text-white rounded-[2rem] font-black uppercase text-xs tracking-[0.2em] shadow-2xl shadow-indigo-600/30 active:scale-95 transition-all flex items-center gap-3"
            >
              <ShoppingCart size={20} /> Open Terminal
            </button>
          </header>

          <div className="bg-[#0f172a] rounded-[3rem] border border-white/5 overflow-hidden shadow-2xl">
            <div className="p-8 border-b border-white/5 flex items-center justify-between">
               <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Transaction History</h3>
               <History size={18} className="text-indigo-500" />
            </div>
            <div className="overflow-x-auto">
               <table className="w-full text-left">
                  <thead className="bg-black/20 text-[9px] font-black uppercase tracking-widest text-slate-500">
                     <tr>
                        <th className="px-8 py-5">REF</th>
                        <th className="px-8 py-5">Customer</th>
                        <th className="px-8 py-5">Value</th>
                        <th className="px-8 py-5 text-right">Reprint</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                     {sales.slice(0, 10).map((sale) => (
                        <tr key={sale.id} className="hover:bg-white/5 transition-colors group">
                           <td className="px-8 py-5 font-mono text-[11px] text-slate-500">#{sale.id.slice(0,8)}</td>
                           <td className="px-8 py-5 font-black text-[11px] uppercase">{sale.customer_name || 'Walk-in'}</td>
                           <td className="px-8 py-5 font-black text-[11px] text-indigo-400">{settings.currency}{sale.total_price.toLocaleString()}</td>
                           <td className="px-8 py-5 text-right">
                              <button 
                                onClick={() => handleReprint(sale)}
                                className="p-2 bg-white/5 hover:bg-indigo-600 rounded-lg text-slate-400 hover:text-white transition-all ml-auto block"
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
        <div className="fixed inset-0 z-[60] bg-[#020617] flex flex-col animate-in zoom-in-95 duration-300 no-print">
          
          <div className="h-14 bg-[#0a0f1d] flex items-end px-4 gap-1.5 shrink-0 overflow-x-auto scrollbar-hide">
             {carts.map((cart, idx) => (
               <div key={cart.id} className="flex items-center">
                  <button 
                    onClick={() => setActiveCartIndex(idx)}
                    className={`h-10 px-6 rounded-t-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 relative whitespace-nowrap ${
                      activeCartIndex === idx 
                      ? 'bg-white text-[#4f46e5] shadow-lg' 
                      : 'text-slate-500 hover:text-slate-300 bg-white/5'
                    }`}
                  >
                     <ReceiptText size={14} className={activeCartIndex === idx ? 'text-[#4f46e5]' : 'text-slate-500'} />
                     {cart.label}
                     {cart.items.length > 0 && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 ml-1"></span>}
                     {carts.length > 1 && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleCloseCart(idx); }} 
                          className={`ml-2 hover:bg-black/10 rounded p-0.5 ${activeCartIndex === idx ? 'text-[#4f46e5]' : 'text-slate-500'}`}
                        >
                           <X size={10} />
                        </button>
                     )}
                  </button>
               </div>
             ))}
             <button onClick={handleAddNewCart} className="h-10 px-4 text-slate-500 hover:text-white transition-all mb-0.5 shrink-0"><Plus size={18}/></button>
             
             <div className="ml-auto mb-3 hidden md:flex items-center gap-4 pr-2">
                <div className="text-right">
                   <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest">OPERATOR</p>
                   <p className="text-[10px] font-black text-white uppercase">{currentUser?.name || 'ADMIN'}</p>
                </div>
                <button 
                  onClick={() => setIsTerminalOpen(false)} 
                  className="w-10 h-10 bg-rose-600/10 text-rose-600 rounded-xl hover:bg-rose-600 transition-all flex items-center justify-center group"
                >
                   <X size={20} className="group-hover:text-white" />
                </button>
             </div>
          </div>

          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-[#0a0f1d] m-2 md:m-4 rounded-[1.5rem] md:rounded-[2.5rem] border border-white/5 shadow-2xl relative">
             
             <div className="flex-1 flex flex-col min-w-0 border-r border-white/5">
                <div className="p-4 md:p-10 pb-4 md:pb-6 flex flex-col md:flex-row gap-4 shrink-0">
                   <div className="relative flex-1 group">
                      <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400" size={18} />
                      <input 
                        type="text" 
                        placeholder="SEARCH SKU OR PRODUCT NAME..." 
                        className="w-full pl-14 pr-6 py-4 md:py-5 bg-[#0f172a] border-none rounded-2xl text-[10px] md:text-[11px] font-black uppercase outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-slate-600"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                   </div>
                   <button 
                     onClick={() => setIsScannerOpen(true)}
                     className="px-8 py-4 md:py-5 bg-[#0f172a] text-white border border-white/5 rounded-2xl flex items-center justify-center gap-3 font-black text-[9px] md:text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-all hover:bg-[#1e293b]"
                   >
                      <Scan size={18}/> SENSOR SCAN
                   </button>
                </div>

                <div className="px-4 md:px-10 py-2 md:py-4 flex gap-2 overflow-x-auto scrollbar-hide shrink-0 border-b border-white/5">
                   {['ALL', ...settings.categories.slice(0, 12)].map(cat => (
                     <button 
                       key={cat} 
                       onClick={() => setSelectedCategory(cat.toUpperCase())}
                       className={`px-5 md:px-6 py-2 md:py-2.5 rounded-full text-[8px] md:text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${selectedCategory === cat.toUpperCase() ? 'bg-[#4f46e5] text-white shadow-lg' : 'bg-[#0f172a] text-slate-500 hover:text-slate-300'}`}
                     >
                       {cat}
                     </button>
                   ))}
                </div>

                <div className="flex-1 overflow-y-auto p-4 md:p-10 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 scrollbar-hide pb-32">
                   {filteredProducts.map(p => (
                     <button 
                       key={p.id} 
                       onClick={() => handleProductSelection(p.id)}
                       className="group bg-[#0f172a] rounded-2xl md:rounded-[2rem] p-5 md:p-8 border border-white/5 hover:border-[#4f46e5] transition-all flex flex-col text-left aspect-[4/5] relative overflow-hidden active:scale-95"
                     >
                        <div className="absolute top-4 right-4 px-2 py-0.5 bg-white/5 rounded-md border border-white/10">
                           <span className="text-[7px] font-black uppercase text-emerald-400">{p.quantity} IN STOCK</span>
                        </div>
                        <div className="flex-1 space-y-3 md:space-y-4">
                           <div className="w-10 h-10 md:w-12 md:h-12 bg-white/5 rounded-xl md:rounded-2xl flex items-center justify-center text-slate-600 group-hover:text-indigo-400 transition-colors">
                              <Package size={20} />
                           </div>
                           <h4 className="text-[10px] md:text-[11px] font-black text-white uppercase leading-tight line-clamp-3">{p.name}</h4>
                        </div>
                        <div className="mt-4 md:mt-6 flex items-center justify-between">
                           <span className="text-[10px] md:text-xs font-black text-[#4f46e5]">{settings.currency}{p.price.toLocaleString()}</span>
                           <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-[#4f46e5] group-hover:text-white transition-all">
                              <Plus size={16} />
                           </div>
                        </div>
                     </button>
                   ))}
                </div>
             </div>

             <div className="hidden lg:flex w-[460px] flex-col bg-[#0a0f1d] overflow-hidden border-l border-white/5 shadow-[-10px_0_30px_rgba(0,0,0,0.02)]">
                <div className="p-8 space-y-4 bg-[#0a0f1d] border-b border-white/5">
                   <div className="flex items-center gap-4">
                      <User size={18} className="text-slate-600" />
                      <input 
                        placeholder="CLIENT PROFILE NAME..." 
                        className="flex-1 bg-white border-none rounded-xl px-5 py-3 text-[10px] font-black uppercase outline-none shadow-inner text-slate-900" 
                        value={currentCart.customerName} 
                        onChange={e => updateActiveCart({ customerName: e.target.value })} 
                      />
                   </div>
                   <div className="flex items-center gap-4">
                      <Edit3 size={18} className="text-slate-600" />
                      <input 
                        placeholder="ORDER LABEL..." 
                        className="flex-1 bg-white border-none rounded-xl px-5 py-3 text-[10px] font-black uppercase outline-none shadow-inner text-slate-900" 
                        value={currentCart.label} 
                        onChange={e => updateActiveCart({ label: e.target.value })} 
                      />
                   </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide">
                   {currentCart.items.map((item, idx) => (
                     <div key={idx} className="bg-[#0f172a] rounded-2xl p-5 border border-white/5 group animate-in slide-in-from-right-4">
                        <div className="flex justify-between items-start mb-3">
                           <p className="text-[10px] font-black uppercase truncate pr-4 text-white">{item.productName}</p>
                           <button onClick={() => {
                             const updated = [...currentCart.items];
                             updated.splice(idx, 1);
                             updateActiveCart({ items: updated });
                           }} className="text-slate-600 hover:text-rose-500 transition-colors"><Trash2 size={16}/></button>
                        </div>
                        <div className="flex items-center justify-between">
                           <p className="text-[11px] font-black text-[#4f46e5]">{settings.currency}{(item.price * item.quantity).toLocaleString()}</p>
                           <div className="flex items-center gap-1 bg-black/20 rounded-xl p-1 border border-white/5">
                              <button onClick={() => {
                                const updated = [...currentCart.items];
                                if (updated[idx].quantity > 1) updated[idx].quantity -= 1;
                                else updated.splice(idx, 1);
                                updateActiveCart({ items: updated });
                              }} className="w-8 h-8 flex items-center justify-center hover:bg-white/5 rounded-lg text-slate-400"><Minus size={14}/></button>
                              
                              <input 
                                type="number"
                                className="w-12 h-8 bg-transparent border-none text-center text-[11px] font-black p-0 focus:ring-0 text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
                              }} className="w-8 h-8 flex items-center justify-center hover:bg-white/5 rounded-lg text-slate-400"><Plus size={14}/></button>
                           </div>
                        </div>
                     </div>
                   ))}
                </div>

                <div className="p-10 bg-[#020617] space-y-6">
                   <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">
                      <span>GROSS VAL</span>
                      <span>{settings.currency}{subtotal.toLocaleString()}</span>
                   </div>
                   <div className="flex justify-between items-end border-t border-white/5 pt-4">
                      <p className="text-[10px] font-black uppercase text-indigo-500 tracking-[0.3em]">NET SETTLE</p>
                      <h4 className="text-4xl font-black tracking-tighter">{settings.currency}{total.toLocaleString()}</h4>
                   </div>
                   <button 
                     disabled={currentCart.items.length === 0 || isProcessing}
                     onClick={() => setShowConfirmDialog(true)}
                     className="w-full py-6 bg-[#4f46e5] text-white rounded-[2rem] font-black uppercase text-xs tracking-[0.2em] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-20"
                   >
                      FINALIZE TICKET <ChevronRight size={18} />
                   </button>
                </div>
             </div>

             <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 px-4 pb-6 pt-2 bg-gradient-to-t from-[#020617] to-transparent">
                <button 
                  onClick={() => setMobileCartOpen(true)}
                  className="w-full bg-white text-[#020617] p-5 rounded-[2.5rem] flex items-center justify-between shadow-[0_20px_50px_rgba(0,0,0,0.5)] active:scale-95 transition-all"
                >
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-[#4f46e5] rounded-[1.2rem] flex items-center justify-center text-white relative shadow-lg">
                         <ShoppingCart size={22} />
                         {currentCart.items.length > 0 && <span className="absolute -top-1 -right-1 w-6 h-6 bg-rose-600 text-white rounded-full text-[10px] flex items-center justify-center border-4 border-white font-black">{currentCart.items.length}</span>}
                      </div>
                      <div className="text-left">
                         <p className="text-[14px] font-black leading-none">{settings.currency}{total.toLocaleString()}</p>
                         <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Review Current Trade</p>
                      </div>
                   </div>
                   <div className="flex items-center gap-2 pr-2">
                      <span className="text-[9px] font-black uppercase tracking-widest">Review Cart</span>
                      <ChevronUp size={20} className="animate-bounce" />
                   </div>
                </button>
             </div>

             {mobileCartOpen && (
               <div className="lg:hidden fixed inset-0 z-[70] bg-[#020617]/90 backdrop-blur-xl animate-in fade-in flex items-end">
                  <div className="w-full bg-[#0a0f1d] rounded-t-[3rem] p-8 pb-24 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom-10 flex flex-col border-t border-white/5">
                     <div className="flex justify-between items-center mb-8">
                        <div>
                           <h3 className="text-xl font-black uppercase tracking-tighter">Review Trade</h3>
                           <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">Order Summary Protocol</p>
                        </div>
                        <button onClick={() => setMobileCartOpen(false)} className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-slate-400 active:scale-90 transition-all"><X size={20}/></button>
                     </div>
                     <div className="space-y-4 mb-8">
                        {currentCart.items.map((item, idx) => (
                           <div key={idx} className="bg-[#0f172a] p-5 rounded-[2rem] border border-white/5">
                              <div className="flex justify-between items-start mb-4">
                                 <p className="text-[11px] font-black uppercase truncate pr-4 text-white">{item.productName}</p>
                                 <button onClick={() => {
                                    const updated = [...currentCart.items];
                                    updated.splice(idx, 1);
                                    updateActiveCart({ items: updated });
                                 }} className="text-slate-600"><Trash2 size={16}/></button>
                              </div>
                              <div className="flex items-center justify-between">
                                 <p className="text-[13px] font-black text-[#4f46e5]">{settings.currency}{(item.price * item.quantity).toLocaleString()}</p>
                                 <div className="flex items-center gap-1 bg-black/40 rounded-xl p-1 border border-white/5">
                                    <button onClick={() => {
                                       const updated = [...currentCart.items];
                                       if (updated[idx].quantity > 1) updated[idx].quantity -= 1;
                                       else updated.splice(idx, 1);
                                       updateActiveCart({ items: updated });
                                    }} className="w-8 h-8 flex items-center justify-center text-slate-400"><Minus size={14}/></button>
                                    <input 
                                       type="number" 
                                       className="w-12 text-center text-xs font-black p-0 border-none bg-transparent text-white focus:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
                     <div className="mt-auto space-y-6 pt-6 border-t border-white/5">
                        <div className="flex justify-between items-center">
                           <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Net Settle Amount</span>
                           <span className="text-3xl font-black text-white">{settings.currency}{total.toLocaleString()}</span>
                        </div>
                        <button 
                           onClick={() => { setShowConfirmDialog(true); }}
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#020617]/98 backdrop-blur-3xl no-print">
          <div className="bg-white rounded-[4rem] w-full max-w-lg p-10 md:p-16 shadow-2xl text-center animate-in zoom-in-95 duration-500">
             <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner"><CreditCard size={32} /></div>
             <h3 className="text-2xl font-black uppercase tracking-tighter mb-4 text-slate-900">Checkout Finalization</h3>
             <p className="text-5xl font-black text-[#4f46e5] mb-12 tracking-tighter leading-none">{settings.currency}{total.toLocaleString()}</p>
             <div className="grid grid-cols-2 gap-4 mb-10">
                <button onClick={() => setPaymentMethod('cash')} className={`py-6 rounded-[2.5rem] border-4 transition-all ${paymentMethod === 'cash' ? 'border-[#4f46e5] bg-indigo-50 text-[#4f46e5] shadow-xl' : 'border-slate-50 text-slate-400 opacity-60'}`}>
                   <Banknote size={32} className="mx-auto mb-2" />
                   <span className="text-[11px] font-black uppercase">Liquid Cash</span>
                </button>
                <button onClick={() => setPaymentMethod('paystack')} className={`py-6 rounded-[2.5rem] border-4 transition-all ${paymentMethod === 'paystack' ? 'border-[#4f46e5] bg-indigo-50 text-[#4f46e5] shadow-xl' : 'border-slate-50 text-slate-400 opacity-60'}`}>
                   <CreditCard size={32} className="mx-auto mb-2" />
                   <span className="text-[11px] font-black uppercase">Digital Card</span>
                </button>
             </div>
             <div className="space-y-4">
                <button 
                  disabled={isProcessing} 
                  onClick={() => handleCheckout('completed')} 
                  className="w-full py-6 bg-[#4f46e5] text-white rounded-[2.5rem] font-black uppercase text-xs flex items-center justify-center gap-4 active:scale-95 shadow-2xl shadow-indigo-600/30 transition-all"
                >
                   {isProcessing ? <Loader2 className="animate-spin" /> : <Printer size={22} />}
                   {isProcessing ? 'SYNCHRONIZING...' : 'COMMIT & PRINT'}
                </button>
                <button onClick={() => setShowConfirmDialog(false)} className="w-full py-4 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-rose-600 transition-colors">Abort & Return</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sales;
