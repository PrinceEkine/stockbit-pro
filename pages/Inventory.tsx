import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  Search, 
  Plus, 
  Trash2, 
  Package, 
  Zap,
  Sparkles,
  Building2,
  FileText,
  Scan,
  Leaf,
  MapPin,
  Calendar,
  Layers,
  Tag,
  QrCode,
  Printer,
  X,
  CheckSquare,
  ShieldCheck,
  MoreVertical,
  ChevronRight,
  AlertTriangle,
  Grid
} from 'lucide-react';
import { Product, Supplier, Settings, User as UserType } from '../types';
import { DEFAULT_CATEGORIES as CATEGORIES } from '../constants';
import { TRANSLATIONS } from '../constants/translations';
import ScannerModal from '../components/ScannerModal';

// HELPER: Improved Barcode SVG Generator (High Contrast Code 128 Approximation)
const BarcodeSVG = ({ value }: { value: string }) => {
  // Use string hash to create unique but consistent bar pattern for SKU
  const hash = Array.from(value).reduce((acc, char, idx) => acc + (char.charCodeAt(0) * (idx + 1)), 0);
  const bars = [];
  let x = 2;
  // Code 128 usually has a start code, data, and stop code. 
  // We simulate a robust scannable pattern with higher contrast.
  for (let i = 0; i < 60; i++) {
    const isBar = (hash * (i + 7) ^ (i * 13)) % 2 === 0 || i < 3 || i > 57;
    const barWidth = ((hash + i) % 5 === 0) ? 1.4 : 0.7;
    if (isBar) {
      bars.push(<rect key={i} x={x} y="0" width={barWidth} height="20" fill="black" />);
    }
    x += barWidth + 0.3;
  }

  return (
    <div className="flex flex-col items-center w-full px-1">
      <svg viewBox={`0 0 ${x + 2} 26`} className="w-full h-12" preserveAspectRatio="none">
        {bars}
        <text x={(x + 2) / 2} y="25" fontSize="4" textAnchor="middle" fontWeight="900" fontFamily="monospace" fill="black">{value.toUpperCase()}</text>
      </svg>
    </div>
  );
};

interface InventoryProps {
  products: Product[];
  suppliers: Supplier[];
  onAdd: (product: Omit<Product, 'id' | 'last_updated' | 'created_at' | 'user_id'>) => void;
  onUpdate: (id: string, updates: Partial<Product>) => void;
  onDelete: (id: string) => void;
  settings: Settings;
  currentUser: UserType | null;
}

const BRANCHES = ['Main Branch', 'Jumia Mall Warehouse', 'Lagos Warehouse', 'Abuja Showroom', 'Port Harcourt Hub'];

const Inventory: React.FC<InventoryProps> = ({ products = [], suppliers = [], onAdd, onDelete, settings, currentUser }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedBranch, setSelectedBranch] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannerMode, setScannerMode] = useState<'id' | 'details'>('id');
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [printMode, setPrintMode] = useState<'labels' | 'ledger' | null>(null);
  const [printProducts, setPrintProducts] = useState<Product[]>([]);

  const [formData, setFormData] = useState({
    name: '', 
    sku: '', 
    category: CATEGORIES[0], 
    price: '', 
    cost_price: '', 
    quantity: '', 
    min_threshold: '5', 
    supplier_id: '', 
    batch_number: '', 
    expiry_date: '',
    location: BRANCHES[0],
    sustainability_score: '50'
  });

  const filteredProducts = useMemo(() => {
    return (products || []).filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
      const matchesBranch = selectedBranch === 'All' || p.location === selectedBranch;
      return matchesSearch && matchesCategory && matchesBranch;
    });
  }, [products, searchTerm, selectedCategory, selectedBranch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const submissionData = {
      name: formData.name,
      sku: formData.sku,
      category: formData.category,
      price: parseFloat(formData.price) || 0,
      cost_price: parseFloat(formData.cost_price) || 0,
      quantity: parseInt(formData.quantity) || 0,
      min_threshold: parseInt(formData.min_threshold) || 0,
      supplier_id: formData.supplier_id === '' ? null : formData.supplier_id,
      batch_number: formData.batch_number,
      expiry_date: formData.expiry_date || null,
      location: formData.location,
      sustainability_score: parseInt(formData.sustainability_score) || 0
    };

    onAdd(submissionData);
    setIsModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({ 
      name: '', 
      sku: '', 
      category: CATEGORIES[0], 
      price: '', 
      cost_price: '', 
      quantity: '', 
      min_threshold: '5', 
      supplier_id: '', 
      batch_number: '', 
      expiry_date: '', 
      location: BRANCHES[0],
      sustainability_score: '50'
    });
  };

  const handleScanResult = useCallback((res: any, stayOpen: boolean = false) => {
    if (scannerMode === 'details' && typeof res === 'object') {
      setFormData(prev => ({
        ...prev,
        name: res.name || prev.name,
        sku: res.sku || prev.sku,
        price: res.price?.toString() || prev.price,
        category: CATEGORIES.includes(res.category) ? res.category : prev.category,
        batch_number: res.batchNumber || prev.batch_number,
        expiry_date: res.expiryDate || prev.expiry_date,
        sustainability_score: res.sustainabilityScore?.toString() || prev.sustainability_score
      }));
      setIsModalOpen(true);
      setIsScannerOpen(false);
    } else {
      const skuRaw = typeof res === 'string' ? res : res?.sku;
      if (skuRaw) {
        const targetSku = skuRaw.trim().toUpperCase();
        const found = products.find(p => p.sku.trim().toUpperCase() === targetSku);
        if (found) {
          setSearchTerm(found.sku);
          setHighlightedId(found.id);
          setTimeout(() => setHighlightedId(null), 3000);
          if (!stayOpen) setIsScannerOpen(false);
        }
      } else {
        if (!stayOpen) setIsScannerOpen(false);
      }
    }
  }, [products, scannerMode]);

  const toggleSelection = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handlePrintLedger = () => {
    setPrintMode('ledger');
    setPrintProducts(filteredProducts);
    setTimeout(() => {
      window.print();
      setPrintMode(null);
      setPrintProducts([]);
    }, 500);
  };

  const handlePrintLabels = (selectedProducts?: Product[]) => {
    const targets = selectedProducts || products.filter(p => selectedIds.has(p.id));
    if (targets.length === 0) return;
    
    setPrintMode('labels');
    setPrintProducts(targets);
    setTimeout(() => {
      window.print();
      setPrintMode(null);
      setPrintProducts([]);
    }, 500);
  };

  const displayCompanyName = currentUser?.companyName || settings.companyName || 'StockBit Shop';

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-emerald-500';
    if (score >= 40) return 'text-amber-500';
    return 'text-rose-500';
  };

  return (
    <div className="space-y-6 md:space-y-10 animate-in fade-in duration-700 max-w-full overflow-x-hidden">
      
      {/* PROFESSIONAL BARCODE LABEL PRINT VIEW - PRECISE 1.5" x 1" */}
      {printMode === 'labels' && (
        <div className="print-only">
          <div className="label-grid">
            {printProducts.map((p) => (
              <div key={p.id} className="barcode-label bg-white border border-black flex flex-col items-center justify-between">
                 <div className="text-[7px] font-black uppercase text-center w-full truncate leading-tight border-b border-black/10 pb-0.5">{displayCompanyName}</div>
                 <div className="text-[8px] font-black uppercase text-center w-full truncate mb-0.5 leading-tight">{p.name}</div>
                 <div className="w-full flex-1 flex items-center justify-center overflow-hidden">
                    <BarcodeSVG value={p.sku} />
                 </div>
                 <div className="text-[9px] font-black w-full flex justify-between px-1 mt-0.5 border-t border-black/10 pt-0.5">
                    <span>{settings.currency}{p.price.toLocaleString()}</span>
                    <span className="opacity-60 text-[6px]">{p.location.split(' ')[0]}</span>
                 </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* LEDGER PRINT VIEW */}
      {printMode === 'ledger' && (
        <div className="print-only p-10 font-sans">
          <div className="flex justify-between items-end mb-8 border-b-2 border-slate-900 pb-4">
             <div>
                <h1 className="text-2xl font-black uppercase">{displayCompanyName}</h1>
                <p className="text-xs font-bold text-slate-500">Inventory Status Ledger - {new Date().toLocaleDateString()}</p>
             </div>
             <div className="text-right">
                <p className="text-sm font-black">TOTAL ASSETS: {printProducts.length}</p>
             </div>
          </div>
          <table className="w-full text-left text-sm">
             <thead>
                <tr className="border-b border-slate-300">
                   <th className="py-2">SKU</th>
                   <th className="py-2">PRODUCT NAME</th>
                   <th className="py-2">QTY</th>
                   <th className="py-2">PRICE</th>
                   <th className="py-2">LOCATION</th>
                </tr>
             </thead>
             <tbody>
                {printProducts.map(p => (
                   <tr key={p.id} className="border-b border-slate-100">
                      <td className="py-2 font-mono text-xs">{p.sku}</td>
                      <td className="py-2 font-bold uppercase">{p.name}</td>
                      <td className="py-2">{p.quantity}</td>
                      <td className="py-2">{settings.currency}{p.price.toLocaleString()}</td>
                      <td className="py-2 text-xs">{p.location}</td>
                   </tr>
                ))}
             </tbody>
          </table>
        </div>
      )}

      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-10 no-print px-6 md:px-12">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-primary/10 text-brand-primary rounded-full border border-brand-primary/20">
             <Layers size={14} className="animate-pulse" />
             <span className="text-[10px] font-bold uppercase tracking-widest leading-none">Global Asset Command</span>
          </div>
          <h2 className="text-4xl md:text-7xl font-display font-bold text-slate-900 dark:text-white tracking-tighter leading-tight">Neural Catalog</h2>
          <div className="flex items-center gap-6">
             <div className="flex -space-x-4">
               {[1,2,3,4].map(i => (
                 <div key={i} className="w-10 h-10 rounded-2xl border-[3px] border-white dark:border-slate-950 bg-slate-100 dark:bg-slate-800 shadow-xl overflow-hidden group">
                    <div className="w-full h-full bg-gradient-to-br from-brand-primary/20 to-transparent group-hover:bg-brand-primary/40 transition-colors"></div>
                 </div>
               ))}
             </div>
             <div className="h-10 w-px bg-slate-200 dark:bg-slate-800"></div>
             <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] leading-none">{filteredProducts.length} Registry Units Indexed</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <button onClick={() => { resetForm(); setIsModalOpen(true); }} className="flex-1 sm:flex-none px-10 py-5 bg-brand-primary text-white rounded-3xl flex items-center justify-center gap-4 font-bold text-[11px] uppercase tracking-[0.2em] shadow-neo-brand active:scale-95 transition-all group overflow-hidden relative">
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
            <Plus size={20} className="relative z-10" /> <span className="relative z-10">Initialize Asset</span>
          </button>
          <div className="h-14 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block"></div>
          <button onClick={() => { setScannerMode('id'); setIsScannerOpen(true); }} className="w-14 h-14 bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-500 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-center hover:bg-brand-primary hover:text-white hover:border-brand-primary transition-all active:scale-95 shadow-neo">
            <Scan size={22} />
          </button>
          <button onClick={() => { setScannerMode('details'); setIsScannerOpen(true); }} className="w-14 h-14 bg-emerald-500/10 text-emerald-500 rounded-2xl border border-emerald-500/20 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all active:scale-95 shadow-neo">
            <Sparkles size={22} />
          </button>
        </div>
      </header>

      {/* INTELLIGENT SEARCH BUREAU */}
      <div className="bg-white dark:bg-slate-900 p-8 md:p-12 rounded-[3.5rem] border border-slate-100 dark:border-slate-800 flex flex-col lg:flex-row gap-10 no-print shadow-neo mx-6 md:mx-12 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-2 h-full bg-brand-primary"></div>
        <div className="relative flex-1 group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-primary transition-all duration-300 group-focus-within:scale-110" size={24} />
          <input 
            type="text" 
            placeholder="Search catalog registry..." 
            className="w-full pl-16 pr-10 py-6 bg-slate-50 dark:bg-slate-800/50 border-none rounded-3xl text-sm font-bold placeholder:text-slate-400 text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-brand-primary/10 transition-all shadow-inner" 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
        </div>
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 px-6 py-3 rounded-2xl border border-slate-100 dark:border-slate-800">
             <Grid size={16} className="text-slate-400" />
             <select 
               value={selectedCategory} 
               onChange={(e) => setSelectedCategory(e.target.value)}
               className="bg-transparent border-none p-0 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 outline-none cursor-pointer focus:ring-0"
             >
               <option value="All">All Categories</option>
               {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
             </select>
          </div>
          <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 px-6 py-3 rounded-2xl border border-slate-100 dark:border-slate-800">
             <MapPin size={16} className="text-slate-400" />
             <select 
               value={selectedBranch} 
               onChange={(e) => setSelectedBranch(e.target.value)}
               className="bg-transparent border-none p-0 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 outline-none cursor-pointer focus:ring-0"
             >
               <option value="All">All Locations</option>
               {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
             </select>
          </div>
          {selectedIds.size > 0 && (
            <button onClick={() => handlePrintLabels()} className="px-10 py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[1.5rem] flex items-center justify-center gap-4 font-bold text-[10px] uppercase tracking-widest shadow-2xl active:scale-95 transition-all animate-in slide-in-from-right-4 group">
              <Printer size={18} className="group-hover:animate-bounce" /> {selectedIds.size} Manifest Labels
            </button>
          )}
        </div>
      </div>

      {/* MOBILE LIST */}
      <div className="lg:hidden space-y-6 px-6 pb-32 no-print">
        {filteredProducts.map((p) => {
          const isLow = p.quantity <= p.min_threshold;
          const isOut = p.quantity === 0;
          return (
            <div 
              key={p.id} 
              className={`bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-neo space-y-8 transition-all relative overflow-hidden active:scale-[0.98] ${highlightedId === p.id ? 'ring-4 ring-brand-primary/20' : ''}`}
              onClick={() => toggleSelection(p.id)}
            >
              {isLow && (
                 <div className="absolute top-0 left-0 right-0 h-1.5 bg-amber-500"></div>
              )}
              {isOut && (
                 <div className="absolute top-0 left-0 right-0 h-1.5 bg-rose-500"></div>
              )}

              <div className="flex justify-between items-start">
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-lg text-[8px] font-black uppercase tracking-widest leading-none border border-slate-200 dark:border-slate-700">
                      {p.category}
                    </span>
                    <span className={`px-3 py-1 bg-slate-100 dark:bg-slate-800 ${getScoreColor(p.sustainability_score || 0)} rounded-lg text-[8px] font-black uppercase tracking-widest leading-none border border-slate-200 dark:border-slate-700 flex items-center gap-1.5`}>
                      <Leaf size={10}/> {p.sustainability_score || 0}% ECO
                    </span>
                  </div>
                  <h4 className="font-display font-bold text-slate-900 dark:text-white uppercase text-xl leading-tight tracking-tight">
                    {p.name}
                  </h4>
                  <p className="font-mono text-[9px] text-slate-400 uppercase tracking-widest leading-none">{p.sku}</p>
                </div>
                <div className={`w-8 h-8 rounded-xl border-2 transition-all flex items-center justify-center ${selectedIds.has(p.id) ? 'bg-brand-primary border-brand-primary text-white' : 'border-slate-200 dark:border-slate-800'}`}>
                   {selectedIds.has(p.id) && <CheckSquare size={16} />}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 dark:bg-slate-800/40 p-6 rounded-[2rem] border border-slate-100 dark:border-white/5 flex flex-col justify-between h-28">
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.2em]">Inventory Level</p>
                  <span className={`text-3xl font-display font-bold tracking-tighter ${isOut ? 'text-rose-500' : isLow ? 'text-amber-500' : 'text-emerald-500'}`}>
                    {p.quantity} <span className="text-[11px] uppercase ml-1 opacity-60">UNITS</span>
                  </span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/40 p-6 rounded-[2rem] border border-slate-100 dark:border-white/5 flex flex-col justify-between h-28">
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.2em]">Gross Worth</p>
                  <span className="text-3xl font-display font-bold text-slate-900 dark:text-white tracking-tighter">
                    {settings.currency}{p.price.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* DESKTOP TABLE BUREAU */}
      <div className="hidden lg:block bg-white dark:bg-slate-900 rounded-[4rem] border border-slate-100 dark:border-slate-800 shadow-neo-lg overflow-hidden no-print mx-12 mb-32 relative">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[1000px] border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/30">
                <th className="pl-14 py-10 w-24">
                  <div className="flex items-center">
                    <input 
                      type="checkbox" 
                      className="w-6 h-6 rounded-xl border-slate-200 bg-white text-brand-primary focus:ring-brand-primary/20 cursor-pointer shadow-sm transition-all active:scale-90" 
                      onChange={(e) => {
                        if (e.target.checked) setSelectedIds(new Set(filteredProducts.map(p => p.id)));
                        else setSelectedIds(new Set());
                      }} 
                      checked={selectedIds.size === filteredProducts.length && filteredProducts.length > 0} 
                    />
                  </div>
                </th>
                <th className="px-10 py-10 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Asset Identity</th>
                <th className="px-10 py-10 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 text-center">Protocol Node</th>
                <th className="px-10 py-10 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 text-center">Climate Score</th>
                <th className="px-10 py-10 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 text-center">Level Integrity</th>
                <th className="px-10 py-10 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 text-center">Unit Valuation</th>
                <th className="pr-14 py-10 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 text-right">Utility</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredProducts.map((p, index) => {
                const isLow = p.quantity <= p.min_threshold;
                const isOut = p.quantity === 0;
                return (
                  <tr key={p.id} className={`group transition-all duration-500 animate-in fade-in slide-in-from-bottom-4 ${highlightedId === p.id ? 'bg-brand-primary/5' : 'hover:bg-slate-50/50 dark:hover:bg-slate-801/30'}`} style={{ animationDelay: `${index * 40}ms` }}>
                    <td className="pl-14 py-10">
                      <input type="checkbox" className="w-6 h-6 rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-brand-primary focus:ring-brand-primary/20 cursor-pointer shadow-sm transition-all active:scale-90" checked={selectedIds.has(p.id)} onChange={() => toggleSelection(p.id)} />
                    </td>
                    <td className="px-10 py-10">
                      <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-3xl flex items-center justify-center text-slate-400 shadow-inner group-hover:bg-brand-primary/10 group-hover:text-brand-primary transition-all duration-500 overflow-hidden relative">
                           <Package size={28} className="relative z-10 group-hover:scale-110 transition-transform" />
                           <div className="absolute inset-0 bg-brand-primary/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        </div>
                        <div className="min-w-0">
                          <p className={`text-lg font-display font-bold tracking-tight truncate max-w-[280px] transition-colors ${highlightedId === p.id ? 'text-brand-primary' : 'text-slate-900 dark:text-white group-hover:text-brand-primary underline decoration-transparent group-hover:decoration-brand-primary/30'}`}>{p.name}</p>
                          <div className="flex items-center gap-3 mt-1.5">
                             <span className="font-mono text-[10px] text-slate-400 uppercase tracking-widest leading-none bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-100 dark:border-slate-700">{p.sku}</span>
                             <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest leading-none">{p.category}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-10 text-center">
                      <div className="inline-flex items-center gap-2.5 px-4 py-2 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-white/5 transition-all group-hover:border-slate-200">
                        <MapPin size={12} className="text-brand-primary" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 leading-none">{p.location}</span>
                      </div>
                    </td>
                    <td className="px-10 py-10 text-center">
                      <div className="inline-flex items-center gap-3 px-5 py-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-white/5 hover:scale-105 transition-transform">
                        <div className={`w-2 h-2 rounded-full animate-pulse transition-colors ${getScoreColor(p.sustainability_score || 0).replace('text-', 'bg-')}`}></div>
                        <span className={`text-[11px] font-display font-bold ${getScoreColor(p.sustainability_score || 0)}`}>{p.sustainability_score || 0}%</span>
                      </div>
                    </td>
                    <td className="px-10 py-10 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="flex items-baseline gap-2">
                          <span className={`text-4xl font-display font-bold tracking-tighter group-hover:scale-110 transition-transform duration-500 ${isOut ? 'text-rose-500' : isLow ? 'text-amber-500' : 'text-emerald-500'}`}>{p.quantity}</span>
                          <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 opacity-60">UNITS</span>
                        </div>
                        <div className="w-32 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
                          <div 
                            className={`h-full transition-all duration-[1.5s] ease-out shadow-[0_0_15px_rgba(0,0,0,0.2)] ${isOut ? 'bg-rose-500' : isLow ? 'bg-amber-500' : 'bg-emerald-500'}`} 
                            style={{ width: `${Math.min(100, (p.quantity / (p.min_threshold * 4)) * 100)}%` }} 
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-10 text-center">
                      <div className="flex items-baseline justify-center gap-1.5 font-display">
                         <span className="text-[11px] font-bold text-slate-400 opacity-50">{settings.currency}</span>
                         <span className="text-3xl font-bold text-slate-900 dark:text-white tracking-tighter group-hover:tracking-normal transition-all duration-500">{p.price.toLocaleString()}</span>
                      </div>
                    </td>
                    <td className="pr-14 py-10 text-right">
                      <div className="flex items-center justify-end gap-3 translate-x-10 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-500">
                        <button 
                          onClick={() => { setFormData({
                            name: p.name, sku: p.sku, category: p.category, price: p.price.toString(),
                            cost_price: p.cost_price.toString(), quantity: p.quantity.toString(),
                            min_threshold: p.min_threshold.toString(), supplier_id: p.supplier_id || '',
                            batch_number: p.batch_number || '', expiry_date: p.expiry_date || '',
                            location: p.location, sustainability_score: (p.sustainability_score || 50).toString()
                          }); setIsModalOpen(true); }} 
                          className="w-12 h-12 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-400 hover:text-brand-primary hover:border-brand-primary hover:shadow-xl rounded-2xl transition-all hover:scale-110 active:scale-90"
                        >
                          <Plus size={20} className="mx-auto" />
                        </button>
                        <button 
                          onClick={() => { if (confirm(TRANSLATIONS[settings.language]?.confirm_delete || 'Are you sure?')) onDelete(p.id); }} 
                          className="w-12 h-12 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-400 hover:text-rose-500 hover:border-rose-500 hover:shadow-xl rounded-2xl transition-all hover:scale-110 active:scale-90"
                        >
                          <Trash2 size={20} className="mx-auto" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {filteredProducts.length === 0 && (
           <div className="py-40 flex flex-col items-center justify-center space-y-8 animate-in fade-in duration-1000">
              <div className="w-32 h-32 bg-slate-50 dark:bg-slate-800/50 rounded-[3rem] flex items-center justify-center text-slate-200 dark:text-slate-700 shadow-inner">
                 <Package size={64} />
              </div>
              <div className="text-center space-y-2">
                 <h2 className="text-3xl font-display font-bold text-slate-900 dark:text-white uppercase tracking-tight">Void Detected</h2>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No registry entries match the current filter</p>
              </div>
           </div>
        )}
      </div>

      {/* ADD/EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-2xl no-print">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] md:rounded-[4rem] w-full max-w-4xl p-6 md:p-14 shadow-neo-lg animate-in zoom-in-95 overflow-y-auto max-h-[92vh] border border-white/5">
            <div className="flex items-center justify-between mb-12">
              <div>
                <h3 className="text-3xl md:text-4xl font-display font-bold text-slate-900 dark:text-white tracking-tighter">Manifest Entry</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em] mt-1">Operational Node Protocol</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="w-12 h-12 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-rose-500 rounded-full flex items-center justify-center transition-all hover:rotate-90">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-12">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                <div className="md:col-span-2 space-y-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2"><Tag size={12} className="text-brand-primary" /> Product Identity</label>
                    <input required className="w-full px-8 py-5 bg-slate-50 dark:bg-slate-800 rounded-[1.5rem] border-none font-bold text-lg text-slate-900 dark:text-white focus:ring-4 focus:ring-brand-primary/10 transition-all" placeholder="Enter full asset name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Serial / SKU Identifier</label>
                      <input required className="w-full px-8 py-5 bg-slate-50 dark:bg-slate-800 rounded-[1.5rem] border-none font-mono font-bold text-slate-900 dark:text-white focus:ring-4 focus:ring-brand-primary/10 transition-all uppercase tracking-widest" placeholder="ALFA-001" value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Classification</label>
                      <select className="w-full px-8 py-5 bg-slate-50 dark:bg-slate-800 rounded-[1.5rem] border-none font-bold text-slate-600 dark:text-white focus:ring-4 focus:ring-brand-primary/10 transition-all" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="space-y-8 bg-slate-50 dark:bg-slate-800/40 p-8 rounded-[2.5rem] border border-slate-100 dark:border-white/5">
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-brand-primary uppercase tracking-[0.2em] ml-1 flex items-center gap-2"><Layers size={14}/> Active Units</label>
                    <input required type="number" className="w-full px-6 py-4 bg-white dark:bg-slate-900 rounded-[1.2rem] border-none font-display font-bold text-3xl text-brand-primary focus:ring-4 focus:ring-brand-primary/10 shadow-inner" value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-emerald-500 uppercase tracking-[0.2em] ml-1 flex items-center gap-2"><Leaf size={14}/> Eco Compliance %</label>
                    <input type="number" min="0" max="100" className="w-full px-6 py-4 bg-white dark:bg-slate-900 rounded-[1.2rem] border-none font-display font-bold text-3xl text-emerald-600 focus:ring-4 focus:ring-emerald-500/10 shadow-inner" value={formData.sustainability_score} onChange={e => setFormData({...formData, sustainability_score: e.target.value})} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-slate-100 dark:border-slate-800">
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Unit Valuation ({settings.currency})</label>
                  <input required type="number" step="0.01" className="w-full px-8 py-5 bg-slate-50 dark:bg-slate-800 rounded-[1.5rem] border-none font-mono font-bold text-xl text-slate-900 dark:text-white focus:ring-4 focus:ring-brand-primary/10 transition-all" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2"><MapPin size={12} className="text-brand-primary" /> Logistics Node</label>
                  <select className="w-full px-8 py-5 bg-slate-50 dark:bg-slate-800 rounded-[1.5rem] border-none font-bold text-slate-600 dark:text-white focus:ring-4 focus:ring-brand-primary/10 transition-all" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})}>
                    {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-6 pt-10">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-12 py-6 font-bold uppercase text-[10px] text-slate-400 hover:text-rose-500 transition-colors tracking-widest leading-none">Terminate</button>
                <button type="submit" className="flex-1 py-6 bg-brand-primary text-white rounded-[2rem] font-bold uppercase text-xs tracking-[0.2em] shadow-xl shadow-brand-primary/20 active:scale-95 transition-all">
                   commit to neural ledger
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isScannerOpen && (
        <ScannerModal 
          mode={scannerMode}
          onScan={handleScanResult} 
          onClose={() => setIsScannerOpen(false)} 
        />
      )}
    </div>
  );
};

export default Inventory;