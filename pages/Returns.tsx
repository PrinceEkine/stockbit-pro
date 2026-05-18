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

  const inputClasses = "w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 font-medium text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500/20 outline-none transition-all";

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-full px-4 md:px-0 pb-32">
      {/* Header Section */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Returns & Recovery</h2>
          <p className="text-sm text-slate-500">Record and track product returns, refunds, and restocks.</p>
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 px-6 py-2.5 bg-rose-500 text-white rounded-xl shadow-sm hover:bg-rose-600 active:scale-95 transition-all font-bold text-sm"
        >
          <Plus size={18} /> Record New Return
        </button>
      </header>

      {/* Search & Stats Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search returns by product name or sale ID..." 
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm placeholder:text-slate-400 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-primary/10 transition-all" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="lg:col-span-4 bg-slate-900 rounded-2xl p-6 text-white shadow-lg flex flex-col justify-between">
           <div>
              <div className="flex items-center gap-3 mb-4">
                <RotateCcw size={20} className="text-rose-400" />
                <h3 className="text-lg font-bold">Inbound Returns</h3>
              </div>
              <p className="text-3xl font-bold mb-1">{returns.length}</p>
              <p className="text-xs text-slate-400">Total recovery incidents recorded</p>
           </div>
           
           <div className="pt-4 mt-4 border-t border-slate-800">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase text-emerald-400 tracking-wider">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                System Active
              </div>
           </div>
        </div>
      </div>

      {/* Returns Table Section */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[800px]">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 text-xs uppercase font-bold tracking-wider">
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th className="px-6 py-4">Product Details</th>
                <th className="px-6 py-4 text-center">Quantity</th>
                <th className="px-6 py-4 text-center">Resolution</th>
                <th className="px-6 py-4 text-right">Date / Location</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              <AnimatePresence mode="popLayout">
                {filteredReturns.map((r) => (
                  <motion.tr 
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    key={r.id} 
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white uppercase truncate max-w-[200px]">{r.product_name}</p>
                        <p className="text-xs text-rose-500 mt-1 flex items-center gap-1.5">
                          <AlertCircle size={12} /> {r.reason}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                       <span className="text-2xl font-bold text-slate-300 tabular-nums">{r.quantity}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${r.refunded ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 border border-emerald-100 dark:border-emerald-800' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700'}`}>
                        {r.refunded ? (
                          <><CreditCard size={12} /> Refunded</>
                        ) : (
                          <><Box size={12} /> Restocked</>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="space-y-1">
                         <p className="text-xs font-bold text-slate-900 dark:text-white">{new Date(r.date).toLocaleDateString()}</p>
                         <p className="text-[10px] text-slate-400 flex items-center justify-end gap-1">
                            <MapPin size={10} /> {r.location}
                         </p>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>

              {filteredReturns.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-20 text-center">
                    <div className="flex flex-col items-center justify-center">
                       <CheckCircle2 size={48} className="text-emerald-200 mb-4" />
                       <p className="text-slate-500 font-medium">No return incidents recorded in this view</p>
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm no-print">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-800"
            >
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Record Return</h3>
                <button 
                  onClick={() => setIsModalOpen(false)} 
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Select Product</label>
                    <select 
                      required 
                      className={inputClasses}
                      value={formData.productId} 
                      onChange={e => setFormData({...formData, productId: e.target.value})}
                    >
                       <option value="">Choose product...</option>
                       {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Quantity</label>
                      <input 
                        type="number" 
                        min="1" 
                        required 
                        className={inputClasses}
                        value={formData.quantity} 
                        onChange={e => setFormData({...formData, quantity: Number(e.target.value)})} 
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Refund Status</label>
                      <select 
                        className={inputClasses}
                        value={formData.refunded ? 'yes' : 'no'} 
                        onChange={e => setFormData({...formData, refunded: e.target.value === 'yes'})}
                      >
                        <option value="yes">Issue Refund</option>
                        <option value="no">Restock Only</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Reason for Return</label>
                    <textarea 
                      required 
                      className={`${inputClasses} h-24 resize-none`} 
                      placeholder="Why is this product being returned?" 
                      value={formData.reason} 
                      onChange={e => setFormData({...formData, reason: e.target.value})} 
                    />
                  </div>
                </div>

                <div className="pt-4 flex gap-4">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-3 text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={isSaving}
                    className="flex-[2] py-3 bg-rose-500 text-white font-bold rounded-xl shadow-lg shadow-rose-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  >
                    {isSaving ? (
                      <><Loader2 size={18} className="animate-spin" /> Recording...</>
                    ) : (
                      <><CheckCircle2 size={18} /> Record Return</>
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
