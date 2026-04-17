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
import { Product, StocktakeItem } from '../types';

interface StocktakeProps {
  products: Product[];
  onReconcile: (items: StocktakeItem[]) => Promise<void>;
}

const Stocktake: React.FC<StocktakeProps> = ({ products = [], onReconcile }) => {
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
    <div className="space-y-12 animate-in fade-in duration-1000 max-w-7xl mx-auto px-4 md:px-8 pb-32">
      {/* Header Section */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
             <div className="w-14 h-14 bg-amber-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-amber-500/30">
               <Fingerprint className="text-white" size={28} />
             </div>
             <div>
               <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-none">Stock <span className="text-amber-500 italic">Audit</span></h1>
               <p className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px] mt-2">Physical Reconciliation Protocol</p>
             </div>
          </div>
        </div>
        
        <div className="flex gap-4">
          <button 
            disabled={isSyncing}
            onClick={() => {
              const reset: Record<string, number> = {};
              (products || []).forEach(p => reset[p.id] = p.quantity);
              setCounts(reset);
            }}
            className="flex items-center justify-center gap-3 px-8 py-5 bg-white dark:bg-slate-900 text-slate-800 dark:text-white rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl shadow-black/5 active:scale-95 transition-all font-bold text-[11px] uppercase tracking-widest disabled:opacity-50"
          >
            <RefreshCw size={18} /> Reset Matrix
          </button>
          <button 
            disabled={isSyncing}
            onClick={handleReconcile}
            className="flex items-center justify-center gap-4 px-10 py-5 bg-amber-500 text-white rounded-[2.5rem] shadow-2xl shadow-amber-500/30 active:scale-95 transition-all font-black text-[11px] uppercase tracking-[0.2em] disabled:opacity-70 group"
          >
            {isSyncing ? <Loader2 size={18} className="animate-spin" /> : <Save size={20} className="group-hover:scale-110 transition-transform" />}
            {isSyncing ? 'Writing Data...' : 'Commit Audit'}
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
            className="bg-emerald-500/10 dark:bg-emerald-500/5 border border-emerald-500/20 p-8 rounded-[3.5rem] flex items-center gap-6 text-emerald-600 dark:text-emerald-400 shadow-2xl shadow-emerald-500/5 overflow-hidden"
          >
            <div className="w-14 h-14 bg-emerald-500 text-white rounded-[2rem] flex items-center justify-center shadow-lg">
               <CheckCircle2 size={28} />
            </div>
            <div className="space-y-1">
               <h3 className="text-2xl font-black uppercase tracking-tighter leading-none">Sync Successful</h3>
               <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Physical counts successfully committed to master database.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { 
            label: 'Scan Depth', 
            value: products?.length || 0, 
            sub: 'Active SKU Identifiers', 
            icon: ClipboardCheck, 
            color: 'indigo',
            data: products?.length || 0
          },
          { 
            label: 'Deviation Count', 
            value: totalDiscrepancies, 
            sub: 'Physical Variance', 
            icon: ShieldAlert, 
            color: totalDiscrepancies > 0 ? 'amber' : 'emerald',
            data: totalDiscrepancies
          },
          { 
            label: 'Integrity Score', 
            value: `${inventoryHealth}%`, 
            sub: 'Node Match Ratio', 
            icon: Activity, 
            color: 'indigo',
            data: inventoryHealth,
            progress: true
          }
        ].map((stat, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            key={i} 
            className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl p-10 rounded-[4rem] border border-slate-200/50 dark:border-slate-800 shadow-2xl relative overflow-hidden group"
          >
            <div className={`absolute top-0 right-0 p-8 opacity-5 group-hover:scale-125 transition-transform duration-[2000ms] text-${stat.color}-500`}>
               <stat.icon size={120} />
            </div>
            <div className="relative space-y-8">
              <p className="text-[11px] font-black text-slate-400 tracking-[0.3em] uppercase">Metric: {stat.label}</p>
              <div className="space-y-2">
                <h3 className={`text-6xl font-black tracking-tighter text-slate-900 dark:text-white`}>
                  {stat.value}
                </h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.sub}</p>
              </div>
              
              {stat.progress && (
                <div className="flex items-center gap-4">
                  <div className="flex-1 h-3 bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden shadow-inner">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${stat.data}%` }}
                      transition={{ duration: 2, ease: "easeOut" }}
                      className="h-full bg-indigo-600 shadow-[0_0_20px_rgba(79,70,229,0.5)]" 
                    />
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Content Table Area */}
      <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl rounded-[4rem] border border-slate-200/50 dark:border-slate-800 shadow-2xl overflow-hidden relative group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/[0.02] rounded-full -mr-32 -mt-32"></div>
        
        <div className="p-10 md:p-14 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-4">
            <span className="w-10 h-10 bg-slate-100 dark:bg-slate-950 rounded-xl flex items-center justify-center border border-slate-200 dark:border-slate-800">
               <Database size={18} className="text-indigo-500" />
            </span>
            Audit Matrix
          </h2>
          
          <div className="relative group/search w-full md:w-96">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/search:text-amber-500 transition-colors duration-300" size={24} />
            <input 
              type="text" 
              placeholder="Filter by name or SKU..." 
              className="w-full pl-18 pr-8 py-6 bg-slate-100/50 dark:bg-slate-950/50 border-2 border-transparent focus:border-amber-500/50 rounded-[2.5rem] text-sm font-bold placeholder:text-slate-400 text-slate-900 dark:text-white outline-none shadow-inner transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead className="bg-slate-50/50 dark:bg-slate-950/50 text-slate-400 dark:text-slate-500 text-[11px] uppercase font-black tracking-[0.2em]">
              <tr>
                <th className="px-12 py-10">Entity Identifier</th>
                <th className="px-12 py-10">Virtual State</th>
                <th className="px-12 py-10">Physical Observation</th>
                <th className="px-12 py-10">Deviation</th>
                <th className="px-12 py-10">Integrity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              <AnimatePresence mode="popLayout">
                {filteredProducts.map((p, index) => {
                  const physical = counts[p.id] ?? p.quantity;
                  const diff = physical - p.quantity;
                  
                  return (
                    <motion.tr 
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      key={p.id} 
                      className="group/row hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all duration-300"
                    >
                      <td className="px-12 py-10">
                        <div className="space-y-1">
                          <p className="text-xl font-black text-slate-900 dark:text-white group-hover/row:text-indigo-600 transition-colors uppercase tracking-tight leading-none">{p.name}</p>
                          <div className="flex items-center gap-2">
                             <span className="text-[10px] font-black text-slate-400 bg-slate-100 dark:bg-slate-950 px-3 py-1 rounded-full tracking-widest border border-slate-200 dark:border-slate-800">{p.sku}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-12 py-10 text-base font-black text-slate-500 dark:text-slate-400 tabular-nums">
                        {p.quantity} Unit(s)
                      </td>
                      <td className="px-12 py-10">
                        <div className="relative w-36">
                          <input 
                            type="number" 
                            min="0"
                            className={`w-full px-8 py-5 bg-slate-100 dark:bg-slate-950 rounded-[2rem] border-2 border-transparent focus:border-indigo-600/50 outline-none font-black text-lg text-slate-900 dark:text-white transition-all tabular-nums shadow-inner ${
                              diff !== 0 ? 'bg-amber-500/5 border-amber-500/30' : ''
                            }`}
                            value={counts[p.id] ?? p.quantity}
                            onChange={(e) => handleCountChange(p.id, e.target.value)}
                          />
                        </div>
                      </td>
                      <td className="px-12 py-10">
                        {diff === 0 ? (
                          <span className="text-[11px] font-black text-slate-300 dark:text-slate-700 tracking-[0.2em] uppercase">Nominal</span>
                        ) : (
                          <div className={`inline-flex items-center gap-3 px-6 py-3 rounded-[1.5rem] text-[12px] font-black tracking-widest uppercase tabular-nums shadow-sm ${diff > 0 ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'}`}>
                            {diff > 0 ? `+${diff}` : diff}
                            <ArrowRightLeft size={16} className="opacity-50" />
                          </div>
                        )}
                      </td>
                      <td className="px-12 py-10">
                        <div className="flex items-center gap-4">
                          {diff === 0 ? (
                            <div className="flex items-center gap-3 text-[11px] font-black text-emerald-500 uppercase tracking-widest">
                               <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                               Verified
                            </div>
                          ) : (
                            <div className="flex items-center gap-3 text-[11px] font-black text-amber-500 uppercase tracking-widest ring-1 ring-amber-500/20 px-4 py-2 rounded-full bg-amber-500/5">
                               <AlertCircle size={18} />
                               Adjust
                            </div>
                          )}
                          <ArrowUpRight size={20} className="text-slate-400 opacity-0 group-hover/row:opacity-100 group-hover/row:translate-x-1 transition-all" />
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {filteredProducts.length === 0 && (
          <div className="py-40 flex flex-col items-center justify-center text-center space-y-8">
             <div className="w-24 h-24 bg-slate-50 dark:bg-slate-950 rounded-[2.5rem] flex items-center justify-center border border-slate-200 dark:border-slate-800 shadow-2xl">
                <Search size={40} className="text-slate-300" />
             </div>
             <p className="text-[12px] font-black text-slate-400 uppercase tracking-[0.4em] max-w-sm px-10">No audit data matches your current filtering parameters</p>
          </div>
        )}
      </div>
      
      {/* Footer Info Box */}
      <footer className="bg-slate-900 rounded-[4rem] p-12 text-white relative overflow-hidden group shadow-2xl">
         <div className="grid grid-cols-1 md:grid-cols-2 gap-12 relative z-10">
            <div className="space-y-6">
               <h4 className="text-3xl font-black uppercase tracking-tighter">Audit Compliance</h4>
               <p className="text-slate-400 text-sm font-bold uppercase tracking-widest leading-relaxed">System performs real-time indexing of all physical variances. Every reconciliation is signed with an immutable cryptographic timestamp for audit trails.</p>
            </div>
            <div className="flex flex-col md:items-end justify-center space-y-8">
               <div className="flex flex-col items-end">
                  <p className="text-4xl font-black italic tracking-tighter text-indigo-400">STOCKBIT ENFORCED</p>
                  <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-500 mt-2">Protocol Zero-V1</p>
               </div>
            </div>
         </div>
         <Fingerprint size={300} className="absolute -bottom-20 -right-20 opacity-[0.03] rotate-12 group-hover:rotate-0 transition-transform duration-[5000ms]" />
      </footer>
    </div>
  );
};

export default Stocktake;
