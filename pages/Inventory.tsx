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
  const t = TRANSLATIONS[settings.language || 'en'] || TRANSLATIONS.en;
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

      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-2 px-4 md:px-0">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white uppercase tracking-tight">{t.inventory}</h2>
          <p className="text-sm text-slate-500">{t.everything_needs || 'Manage your product catalog, stock levels, and locations.'}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={() => { resetForm(); setIsModalOpen(true); }} 
            className="flex-1 sm:flex-none px-6 py-2.5 bg-brand-primary text-white rounded-xl flex items-center justify-center gap-2 font-medium text-sm hover:bg-brand-primary/90 transition-all active:scale-95 shadow-sm"
          >
            <Plus size={18} /> {t.add_product}
          </button>
          <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block"></div>
          <button 
            onClick={() => { setScannerMode('id'); setIsScannerOpen(true); }} 
            className="w-10 h-10 bg-white dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-700 transition-all active:scale-95"
            title={t.scan}
          >
            <Scan size={20} />
          </button>
          <button 
            onClick={() => { setScannerMode('details'); setIsScannerOpen(true); }} 
            className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800 rounded-xl flex items-center justify-center hover:bg-emerald-100 dark:hover:bg-emerald-800 transition-all active:scale-95"
            title="AI Scanner"
          >
            <Sparkles size={18} />
          </button>
        </div>
      </header>

      {/* FILTER SECTION */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row gap-4 no-print shadow-sm mx-4 md:mx-0">
        <div className="relative flex-1 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder={t.search} 
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm placeholder:text-slate-400 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-primary/10 transition-all" 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700">
             <Grid size={14} className="text-slate-400" />
             <select 
               value={selectedCategory} 
               onChange={(e) => setSelectedCategory(e.target.value)}
               className="bg-transparent border-none p-0 text-xs font-medium text-slate-600 dark:text-slate-300 outline-none cursor-pointer focus:ring-0"
             >
               <option value="All">All Categories</option>
               {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
             </select>
          </div>
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700">
             <MapPin size={14} className="text-slate-400" />
             <select 
               value={selectedBranch} 
               onChange={(e) => setSelectedBranch(e.target.value)}
               className="bg-transparent border-none p-0 text-xs font-medium text-slate-600 dark:text-slate-300 outline-none cursor-pointer focus:ring-0"
             >
               <option value="All">All Locations</option>
               {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
             </select>
          </div>
          <button 
            onClick={handlePrintLedger}
            className="p-2.5 text-slate-500 hover:text-brand-primary hover:bg-brand-primary/10 rounded-xl transition-all"
            title="Print Inventory Ledger"
          >
            <FileText size={20} />
          </button>
          {selectedIds.size > 0 && (
            <button 
              onClick={() => handlePrintLabels()} 
              className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl flex items-center justify-center gap-2 font-bold text-xs shadow-sm hover:opacity-90 active:scale-95 transition-all"
            >
              <Printer size={16} /> Print {selectedIds.size} Labels
            </button>
          )}
        </div>
      </div>

      {/* MOBILE LIST */}
      <div className="lg:hidden space-y-4 px-4 pb-32 no-print">
        {filteredProducts.map((p) => {
          const isLow = p.quantity <= p.min_threshold;
          const isOut = p.quantity === 0;
          return (
            <div 
              key={p.id} 
              className={`bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 transition-all relative overflow-hidden active:scale-[0.98] ${highlightedId === p.id ? 'ring-2 ring-brand-primary/20' : ''}`}
              onClick={() => toggleSelection(p.id)}
            >
              <div className="flex justify-between items-start">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded text-[10px] font-bold uppercase tracking-wider">
                      {p.category}
                    </span>
                    {isLow && <span className="text-[10px] font-bold text-amber-600 uppercase">Low Stock</span>}
                    {isOut && <span className="text-[10px] font-bold text-rose-600 uppercase">Out of Stock</span>}
                  </div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-base">
                    {p.name}
                  </h4>
                  <p className="text-xs text-slate-500 font-mono">{p.sku}</p>
                </div>
                <div className={`w-6 h-6 rounded border transition-all flex items-center justify-center ${selectedIds.has(p.id) ? 'bg-brand-primary border-brand-primary text-white' : 'border-slate-200 dark:border-slate-700'}`}>
                   {selectedIds.has(p.id) && <CheckSquare size={14} />}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                  <p className="text-[10px] font-medium text-slate-500 uppercase">Stock Level</p>
                  <p className={`text-xl font-bold ${isOut ? 'text-rose-500' : isLow ? 'text-amber-500' : 'text-slate-900 dark:text-white'}`}>
                    {p.quantity} <span className="text-[10px] font-normal opacity-60">units</span>
                  </p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                  <p className="text-[10px] font-medium text-slate-500 uppercase">Unit Price</p>
                  <p className="text-xl font-bold text-slate-900 dark:text-white">
                    {settings.currency}{p.price.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button 
                  onClick={(e) => { e.stopPropagation(); setFormData({
                    name: p.name, sku: p.sku, category: p.category, price: p.price.toString(),
                    cost_price: p.cost_price.toString(), quantity: p.quantity.toString(),
                    min_threshold: p.min_threshold.toString(), supplier_id: p.supplier_id || '',
                    batch_number: p.batch_number || '', expiry_date: p.expiry_date || '',
                    location: p.location, sustainability_score: (p.sustainability_score || 50).toString()
                  }); setIsModalOpen(true); }}
                  className="p-2 text-slate-400 hover:text-brand-primary transition-colors"
                >
                  <Plus size={18} />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); if (confirm(TRANSLATIONS[settings.language]?.confirm_delete || 'Are you sure?')) onDelete(p.id); }}
                  className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* DESKTOP TABLE */}
      <div className="hidden lg:block bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden no-print mx-0 mb-32 relative">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[1000px] border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                <th className="pl-6 py-4 w-12">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 rounded border-slate-300 text-brand-primary focus:ring-brand-primary/20" 
                    onChange={(e) => {
                      if (e.target.checked) setSelectedIds(new Set(filteredProducts.map(p => p.id)));
                      else setSelectedIds(new Set());
                    }} 
                    checked={selectedIds.size === filteredProducts.length && filteredProducts.length > 0} 
                  />
                </th>
                <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Product Name</th>
                <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">SKU</th>
                <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Category</th>
                <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-center">Stock Level</th>
                <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Location</th>
                <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Price</th>
                <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Sustainability</th>
                <th className="pr-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filteredProducts.map((p) => {
                const isLow = p.quantity <= p.min_threshold;
                const isOut = p.quantity === 0;
                return (
                  <tr key={p.id} className={`group hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors ${highlightedId === p.id ? 'bg-brand-primary/5' : ''}`}>
                    <td className="pl-6 py-4">
                      <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-brand-primary focus:ring-brand-primary/20" checked={selectedIds.has(p.id)} onChange={() => toggleSelection(p.id)} />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center text-slate-400 shadow-inner group-hover:text-brand-primary transition-colors">
                           <Package size={20} />
                        </div>
                        <div>
                          <p className={`text-sm font-bold truncate max-w-[200px] ${highlightedId === p.id ? 'text-brand-primary' : 'text-slate-900 dark:text-white'}`}>{p.name}</p>
                          <p className="text-[10px] text-slate-500 uppercase">{p.location}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-xs font-mono text-slate-500">
                      {p.sku}
                    </td>
                    <td className="px-4 py-4">
                      <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded text-[10px] font-bold uppercase tracking-wider">
                        {p.category}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="flex flex-col items-center">
                        <span className={`text-sm font-bold ${isOut ? 'text-rose-500' : isLow ? 'text-amber-500' : 'text-emerald-600'}`}>{p.quantity}</span>
                        <div className="w-20 h-1 bg-slate-100 dark:bg-slate-800 rounded-full mt-1.5 overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-1000 ${isOut ? 'bg-rose-500' : isLow ? 'bg-amber-500' : 'bg-emerald-500'}`} 
                            style={{ width: `${Math.min(100, (p.quantity / (p.min_threshold * 3)) * 100)}%` }} 
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-xs text-slate-500">
                      {p.location}
                    </td>
                    <td className="px-4 py-4 text-sm font-bold text-right text-slate-900 dark:text-white">
                      {settings.currency}{p.price.toLocaleString()}
                    </td>
                    <td className="px-4 py-4 text-right">
                       <span className={`text-xs font-bold ${getScoreColor(p.sustainability_score || 0)}`}>
                        {p.sustainability_score || 0}%
                       </span>
                    </td>
                    <td className="pr-6 py-4 text-right text-slate-400">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => { setFormData({
                            name: p.name, sku: p.sku, category: p.category, price: p.price.toString(),
                            cost_price: p.cost_price.toString(), quantity: p.quantity.toString(),
                            min_threshold: p.min_threshold.toString(), supplier_id: p.supplier_id || '',
                            batch_number: p.batch_number || '', expiry_date: p.expiry_date || '',
                            location: p.location, sustainability_score: (p.sustainability_score || 50).toString()
                          }); setIsModalOpen(true); }} 
                          className="p-2 hover:text-brand-primary"
                        >
                          <Plus size={18} />
                        </button>
                        <button 
                          onClick={() => { if (confirm(TRANSLATIONS[settings.language]?.confirm_delete || 'Are you sure?')) onDelete(p.id); }} 
                          className="p-2 hover:text-rose-500"
                        >
                          <Trash2 size={18} />
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
           <div className="py-20 flex flex-col items-center justify-center text-center">
              <Package size={48} className="text-slate-200 mb-4" />
              <p className="text-slate-500 font-medium">No products found matching your filters</p>
           </div>
        )}
      </div>

      {/* ADD/EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm no-print">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl p-6 shadow-xl animate-in zoom-in-95 overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Product Manifest</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2 space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Product Name</label>
                  <input required className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-primary/20 transition-all" placeholder="Enter product name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">SKU</label>
                  <input required className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 font-mono text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-primary/20 transition-all" placeholder="SKU-123" value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Category</label>
                  <select className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-primary/20 outline-none" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Selling Price ({settings.currency})</label>
                  <input required type="number" step="0.01" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-primary/20 transition-all" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cost Price ({settings.currency})</label>
                  <input required type="number" step="0.01" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-primary/20 transition-all" value={formData.cost_price} onChange={e => setFormData({...formData, cost_price: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Stock Quantity</label>
                  <input required type="number" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-primary/20 transition-all" value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Min Threshold</label>
                  <input required type="number" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-primary/20 transition-all" value={formData.min_threshold} onChange={e => setFormData({...formData, min_threshold: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Storage Location</label>
                  <select className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-primary/20 outline-none" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})}>
                    {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sustainability Score (%)</label>
                  <input type="number" min="0" max="100" className="w-full px-4 py-2.5 bg-slate-100 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 rounded-xl border border-emerald-100 dark:border-emerald-900/50 font-bold focus:ring-2 focus:ring-emerald-500/20" value={formData.sustainability_score} onChange={e => setFormData({...formData, sustainability_score: e.target.value})} />
                </div>
              </div>

              <div className="flex gap-4 pt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors">Cancel</button>
                <button type="submit" className="flex-[2] py-3 bg-brand-primary text-white rounded-xl font-bold text-sm shadow-lg shadow-brand-primary/20 hover:opacity-90 active:scale-[0.98] transition-all">
                   Save Product Entry
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