import React, { useState, useEffect } from 'react';
import { 
  ClipboardCheck, 
  Search, 
  RefreshCw, 
  Save, 
  AlertCircle,
  CheckCircle2,
  ArrowRightLeft,
  Loader2,
  ShieldAlert,
  Fingerprint,
  History,
  Activity,
  ChevronRight,
  Database,
  ArrowUpRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Product, StocktakeItem, Settings } from '../types';
import { TRANSLATIONS } from '../constants/translations';

interface StocktakeProps {
  products: Product[];
  onReconcile: (items: StocktakeItem[]) => Promise<void>;
  settings: Settings;
}

const Stocktake: React.FC<StocktakeProps> = ({ products = [], onReconcile, settings }) => {
  const t = TRANSLATIONS[settings?.language || 'en'] || TRANSLATIONS.en;
  const [searchTerm, setSearchTerm] = useState('');
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const initialCounts: Record<string, number> = {};
    (products || []).forEach(p => {
      initialCounts[p.id] = p.quantity;
    });
    setCounts(initialCounts);
  }, [products]);

  const filteredProducts = (products || []).filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCountChange = (productId: string, value: string) => {
    const numValue = value === '' ? 0 : parseInt(value, 10);
    setCounts(prev => ({ ...prev, [productId]: numValue }));
  };

  const handleReconcile = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    
    try {
      const reconciliationItems: StocktakeItem[] = (products || []).map(p => ({
        productId: p.id,
        systemQty: p.quantity,
        physicalQty: counts[p.id] ?? p.quantity
      }));

      await onReconcile(reconciliationItems);
      setIsSuccess(true);
      setTimeout(() => setIsSuccess(false), 3000);
    } catch (err) {
      console.error("Reconciliation sync error:", err);
    } finally {
      setIsSyncing(false);
    }
  };

  const totalDiscrepancies = (products || []).reduce((acc, p) => {
    const diff = (counts[p.id] ?? p.quantity) - p.quantity;
    return acc + (diff !== 0 ? 1 : 0);
  }, 0);

  const inventoryHealth = products?.length > 0 ? Math.round(((products.length - totalDiscrepancies) / products.length) * 100) : 100;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-full px-4 md:px-0 pb-32">
      {/* Header Section */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white uppercase tracking-tight">{t.stocktake}</h2>
          <p className="text-sm text-slate-500">{t.stocktake_desc || 'Reconcile system inventory with physical shelf counts.'}</p>
        </div>
        
        <div className="flex gap-3">
          <button 
            disabled={isSyncing}
            onClick={() => {
              const reset: Record<string, number> = {};
              (products || []).forEach(p => reset[p.id] = p.quantity);
              setCounts(reset);
            }}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:bg-slate-50 active:scale-95 transition-all font-bold text-sm disabled:opacity-50"
          >
            <RefreshCw size={18} /> Reset
          </button>
          <button 
            disabled={isSyncing}
            onClick={handleReconcile}
            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-600/20 active:scale-95 transition-all font-bold text-sm disabled:opacity-70"
          >
            {isSyncing ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            {isSyncing ? 'Syncing...' : 'Save Audit'}
          </button>
        </div>
      </header>

      {/* Success Notification */}
      <AnimatePresence>
        {isSuccess && (
          <motion.div 
            initial={{ opacity: 0, height: 0, y: -20 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -20 }}
            className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800 p-4 rounded-xl flex items-center gap-3 text-emerald-700 dark:text-emerald-400 shadow-sm overflow-hidden"
          >
            <CheckCircle2 size={20} className="text-emerald-500" />
            <p className="text-sm font-medium">Physical counts successfully reconciled with system records.</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { 
            label: 'Tracked Items', 
            value: products?.length || 0, 
            sub: 'Total SKU count', 
            icon: ClipboardCheck, 
            color: 'indigo'
          },
          { 
            label: 'Discrepancies', 
            value: totalDiscrepancies, 
            sub: 'Units with variance', 
            icon: ShieldAlert, 
            color: totalDiscrepancies > 0 ? 'rose' : 'emerald'
          },
          { 
            label: 'Audit Match', 
            value: `${inventoryHealth}%`, 
            sub: 'Physical vs System', 
            icon: Activity, 
            color: 'indigo'
          }
        ].map((stat, i) => (
          <div 
            key={i} 
            className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2 bg-${stat.color}-100 dark:bg-${stat.color}-900/20 text-${stat.color}-600 rounded-xl`}>
                <stat.icon size={20} />
              </div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{stat.label}</p>
            </div>
            <div className="flex items-end gap-2">
              <h3 className="text-3xl font-bold text-slate-900 dark:text-white leading-none">
                {stat.value}
              </h3>
              <p className="text-xs text-slate-400 mb-1">{stat.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative group w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search products by name or SKU..." 
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm placeholder:text-slate-400 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-primary/10 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[800px]">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 text-xs uppercase font-bold tracking-wider">
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th className="px-6 py-4">Product Details</th>
                <th className="px-6 py-4">System Qty</th>
                <th className="px-6 py-4">Physical Count</th>
                <th className="px-6 py-4">Variance</th>
                <th className="px-6 py-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              <AnimatePresence mode="popLayout">
                {filteredProducts.map((p) => {
                  const physical = counts[p.id] ?? p.quantity;
                  const diff = physical - p.quantity;
                  
                  return (
                    <motion.tr 
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      key={p.id} 
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-bold text-slate-900 dark:text-white uppercase truncate max-w-[200px]">{p.name}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{p.sku}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-500">
                        {p.quantity} Units
                      </td>
                      <td className="px-6 py-4">
                        <div className="relative w-24">
                          <input 
                            type="number" 
                            min="0"
                            className={`w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 outline-none font-bold text-sm text-slate-900 dark:text-white transition-all tabular-nums ${
                              diff !== 0 ? 'ring-2 ring-amber-500/20 border-amber-500/50' : ''
                            }`}
                            value={counts[p.id] ?? p.quantity}
                            onChange={(e) => handleCountChange(p.id, e.target.value)}
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {diff === 0 ? (
                          <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Matched</span>
                        ) : (
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${diff > 0 ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' : 'bg-rose-50 dark:bg-rose-900/20 text-rose-600'}`}>
                            {diff > 0 ? `+${diff}` : diff}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {diff === 0 ? (
                          <div className="flex items-center justify-end gap-2 text-[10px] font-bold text-emerald-500 uppercase tracking-wider">
                             <CheckCircle2 size={14} /> Verified
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-2 text-[10px] font-bold text-amber-500 uppercase tracking-wider">
                             <AlertCircle size={14} /> Adjustment
                          </div>
                        )}
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {filteredProducts.length === 0 && (
          <div className="py-20 flex flex-col items-center justify-center text-center">
             <Search size={48} className="text-slate-200 mb-4" />
             <p className="text-slate-500 font-medium">No results match your search filtering</p>
          </div>
        )}
      </div>
      
      {/* Footer Info Box */}
      <footer className="bg-slate-900 rounded-2xl p-8 text-white shadow-xl overflow-hidden relative">
         <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
               <h4 className="text-lg font-bold">Audit & Compliance</h4>
               <p className="text-slate-400 text-sm leading-relaxed">System logs all physical inventory variances for your permanent audit records. Every reconciliation is timestamped for regulatory reporting compliance.</p>
            </div>
            <div className="flex flex-col items-end whitespace-nowrap">
               <p className="text-2xl font-black italic tracking-tighter text-indigo-400">STOCKBIT ENFORCED</p>
               <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mt-1">Audit Protocol V-1.4</p>
            </div>
         </div>
         <Fingerprint size={200} className="absolute -bottom-10 -right-10 opacity-[0.03] rotate-12" />
      </footer>
    </div>
  );
};

export default Stocktake;
