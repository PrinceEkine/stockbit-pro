import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Plus, 
  CheckCircle2, 
  PackageCheck,
  AlertCircle,
  Truck,
  RotateCcw,
  ShieldCheck,
  Box,
  BadgeAlert,
  ArrowUpRight,
  ArrowLeftRight,
  X,
  CreditCard,
  MapPin,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ProductReturn, Product, Settings } from '../types';

interface ReturnsProps {
  returns: ProductReturn[];
  products: Product[];
  onRecordReturn: (data: Omit<ProductReturn, 'id' | 'date' | 'user_id'>) => Promise<void>;
  settings: Settings;
}

const Returns: React.FC<ReturnsProps> = ({ returns, products, onRecordReturn, settings }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    productId: '',
    quantity: 1,
    reason: '',
    refunded: true,
    location: 'Main Branch'
  });

  const filteredReturns = useMemo(() => {
    return returns.filter(r => 
      r.product_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (r.sale_id || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [returns, searchTerm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const p = products.find(prod => prod.id === formData.productId);
    if (!p) return;
    
    setIsSaving(true);
    await onRecordReturn({
      product_id: formData.productId,
      product_name: p.name,
      quantity: formData.quantity,
      reason: formData.reason,
      refunded: formData.refunded,
      location: formData.location
    });
    setIsSaving(false);
    setIsModalOpen(false);
    setFormData({ productId: '', quantity: 1, reason: '', refunded: true, location: 'Main Branch' });
  };

  const inputClasses = "w-full px-8 py-5 bg-slate-100 dark:bg-slate-900/50 border-2 border-transparent focus:border-rose-500/50 rounded-[2rem] font-bold text-sm dark:text-white outline-none transition-all shadow-inner";

  return (
    <div className="space-y-12 animate-in fade-in duration-1000 max-w-7xl mx-auto px-4 md:px-8 pb-32">
      {/* Header Section */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
             <div className="w-14 h-14 bg-rose-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-rose-500/30">
               <RotateCcw className="text-white" size={28} />
             </div>
             <div>
               <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-none">Reverse <span className="text-rose-500 italic">Logistics</span></h1>
               <p className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px] mt-2">Inbound Inventory Management Protocol</p>
             </div>
          </div>
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-4 px-10 py-6 bg-rose-500 text-white rounded-[2.5rem] shadow-2xl shadow-rose-500/30 active:scale-95 transition-all font-black text-[11px] uppercase tracking-[0.3em] group"
        >
          <Plus size={22} className="group-hover:rotate-90 transition-transform" /> Register Return
        </button>
      </header>

      {/* Search & Stats Bento */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl border border-slate-200/50 dark:border-slate-800 p-8 md:p-10 rounded-[3.5rem] shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/5 blur-[100px] rounded-full -mr-32 -mt-32"></div>
          <div className="relative space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-[0.3em] flex items-center gap-3">
                Trace Transmission <Search size={16} className="text-rose-500" />
              </h2>
              <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest bg-rose-500/10 px-3 py-1 rounded-full">Monitoring Active</span>
            </div>
            <div className="relative group">
              <Search className="absolute left-7 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-rose-500 transition-all duration-300" size={24} />
              <input 
                type="text" 
                placeholder="Trace inbound units by name or transaction ID..." 
                className="w-full pl-18 pr-10 py-7 bg-slate-100/50 dark:bg-slate-950/50 border-2 border-transparent focus:border-rose-500/50 rounded-[2.5rem] text-sm font-bold placeholder:text-slate-400 text-slate-900 dark:text-white outline-none shadow-inner transition-all" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 bg-slate-900 rounded-[3.5rem] p-10 text-white relative overflow-hidden shadow-2xl flex flex-col justify-between group">
           <div className="relative z-10">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/10">
                  <Box size={24} className="text-rose-400" />
                </div>
                <div>
                   <h3 className="text-xl font-black uppercase tracking-tight">Recovery</h3>
                   <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Post-Sale Adjustment</p>
                </div>
              </div>
              <p className="text-4xl font-black tracking-tighter mb-2">{returns.length < 10 ? `0${returns.length}` : returns.length}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Inbound Incidents logged</p>
           </div>
           
           <div className="relative z-10 pt-8 border-t border-slate-800">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase text-emerald-400">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Network Healthy
              </div>
           </div>
           
           <div className="absolute -bottom-10 -right-10 opacity-[0.05] group-hover:rotate-12 transition-transform duration-[4000ms]">
              <RotateCcw size={300} />
           </div>
        </div>
      </div>

      {/* Returns Table Section */}
      <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl rounded-[4rem] border border-slate-200/50 dark:border-slate-800 shadow-2xl overflow-hidden relative group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/[0.02] rounded-full -mr-32 -mt-32"></div>
        
        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead className="bg-slate-50/50 dark:bg-slate-950/50 text-slate-400 dark:text-slate-500 text-[11px] uppercase font-black tracking-[0.2em]">
              <tr>
                <th className="px-12 py-10">Vulnerability Report</th>
                <th className="px-12 py-10 text-center">Inbound Qty</th>
                <th className="px-12 py-10 text-center">Resolution Protocol</th>
                <th className="px-12 py-10 text-right">Timestamp / Origin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              <AnimatePresence mode="popLayout">
                {filteredReturns.map((r, index) => (
                  <motion.tr 
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    key={r.id} 
                    className="group/row hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all duration-300"
                  >
                    <td className="px-12 py-10">
                      <div className="space-y-3">
                        <p className="text-xl font-black text-slate-900 dark:text-white group-hover/row:text-rose-600 transition-colors uppercase tracking-tight leading-none">{r.product_name}</p>
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-rose-500/5 text-rose-500 rounded-full text-[10px] font-black uppercase tracking-widest border border-rose-500/10">
                           <BadgeAlert size={12} /> {r.reason}
                        </div>
                      </div>
                    </td>
                    <td className="px-12 py-10 text-center">
                       <span className="text-4xl font-black text-rose-500/30 group-hover/row:text-rose-500 tracking-tighter tabular-nums transition-colors">{r.quantity < 10 ? `0${r.quantity}` : r.quantity}</span>
                    </td>
                    <td className="px-12 py-10 text-center">
                      <span className={`inline-flex items-center gap-3 px-6 py-3 rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest shadow-sm transition-all ${r.refunded ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-slate-100 dark:bg-slate-950 text-slate-400 border border-slate-200 dark:border-slate-800'}`}>
                        {r.refunded ? (
                          <>
                            <CreditCard size={14} /> Liquidity Refunded
                          </>
                        ) : (
                          <>
                            <Box size={14} /> Unit Credited
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-12 py-10 text-right">
                      <div className="space-y-2">
                         <p className="text-[12px] text-slate-900 dark:text-white font-black uppercase tracking-[0.2em] leading-none">{new Date(r.date).toLocaleDateString()}</p>
                         <div className="flex items-center justify-end gap-2 text-[10px] text-slate-400 font-black uppercase tracking-widest opacity-60">
                            <MapPin size={12} className="text-rose-500" /> {r.location}
                         </div>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>

              {filteredReturns.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-40 text-center">
                    <div className="flex flex-col items-center justify-center space-y-8">
                      <div className="w-24 h-24 bg-slate-50 dark:bg-slate-950 rounded-[2.5rem] flex items-center justify-center border border-slate-200 dark:border-slate-800 shadow-2xl">
                         <ShieldCheck size={40} className="text-emerald-500" />
                      </div>
                      <div className="space-y-2">
                         <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Zero Incidents</h2>
                         <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em]">Inbound recovery spectrum is currently dormant</p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Section */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-12">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-950/90 backdrop-blur-3xl" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 40 }}
              className="bg-white dark:bg-slate-900 rounded-[5rem] w-full max-w-2xl relative shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] overflow-hidden border border-white/5"
            >
              <div className="p-12 md:p-16 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-none">Incident <span className="text-rose-500 italic">Flow</span></h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mt-3">Link Inventory Recovery Node</p>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)} 
                  className="w-16 h-16 bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-rose-500 rounded-full flex items-center justify-center transition-all hover:rotate-90 shadow-inner group"
                >
                  <X size={28} className="group-hover:scale-110 transition-transform" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="p-12 md:p-16 space-y-12">
                <div className="space-y-8">
                  <div className="space-y-4">
                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] ml-6 flex items-center gap-2">
                       <PackageCheck size={14} className="text-rose-500" /> Affected Component
                    </label>
                    <div className="relative group">
                      <Box className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-rose-500 transition-colors" size={24} />
                      <select 
                        required 
                        className={`${inputClasses} pl-20 appearance-none cursor-pointer`}
                        value={formData.productId} 
                        onChange={e => setFormData({...formData, productId: e.target.value})}
                      >
                         <option value="">SCAN ENTITY MATRIX...</option>
                         {products.map(p => <option key={p.id} value={p.id}>{p.name} — SRN: {p.sku}</option>)}
                      </select>
                      <ChevronRight size={20} className="absolute right-8 top-1/2 -translate-y-1/2 text-slate-400 rotate-90 pointer-events-none" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <label className="block text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] ml-6">Inbound Qty</label>
                      <input 
                        type="number" 
                        min="1" 
                        required 
                        className={inputClasses}
                        value={formData.quantity} 
                        onChange={e => setFormData({...formData, quantity: Number(e.target.value)})} 
                      />
                    </div>
                    <div className="space-y-4">
                      <label className="block text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] ml-6">Liquidity Protocol</label>
                      <select 
                        className={`${inputClasses} appearance-none cursor-pointer`}
                        value={formData.refunded ? 'yes' : 'no'} 
                        onChange={e => setFormData({...formData, refunded: e.target.value === 'yes'})}
                      >
                        <option value="yes">EXECUTE LIQUID REFUND</option>
                        <option value="no">ASSIGN UNIT CREDIT</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] ml-6">Incident Diagnostics</label>
                    <textarea 
                      required 
                      className={`${inputClasses} h-40 resize-none py-8 leading-relaxed`} 
                      placeholder="Enter failure reason or diagnostic report..." 
                      value={formData.reason} 
                      onChange={e => setFormData({...formData, reason: e.target.value})} 
                    />
                  </div>
                </div>

                <div className="pt-10 flex flex-col md:flex-row gap-6">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-7 text-slate-400 font-black uppercase text-[12px] tracking-[0.4em] hover:text-slate-600 transition-colors"
                  >
                    Abort Flow
                  </button>
                  <button 
                    type="submit" 
                    disabled={isSaving}
                    className="flex-[2] py-7 bg-rose-500 text-white font-black rounded-[3rem] shadow-[0_30px_60px_rgba(244,63,94,0.4)] transition-all active:scale-95 uppercase text-[12px] tracking-[0.4em] flex items-center justify-center gap-4"
                  >
                    {isSaving ? (
                      <><Loader2 size={24} className="animate-spin" /> Committing</>
                    ) : (
                      <><ShieldCheck size={24} /> Commit Record</>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Returns;
