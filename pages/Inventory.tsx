
import React, { useState, useMemo, useEffect } from 'react';
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
  AlertTriangle
} from 'lucide-react';
import { Product, Supplier, Settings } from '../types';
import { DEFAULT_CATEGORIES as CATEGORIES } from '../constants';
import ScannerModal from '../components/ScannerModal';

interface InventoryProps {
  products: Product[];
  suppliers: Supplier[];
  onAdd: (product: Omit<Product, 'id' | 'last_updated' | 'created_at' | 'user_id'>) => void;
  onUpdate: (id: string, updates: Partial<Product>) => void;
  onDelete: (id: string) => void;
  settings: Settings;
}

const BRANCHES = ['Main Branch', 'Jumia Mall Warehouse', 'Lagos Warehouse', 'Abuja Showroom', 'Port Harcourt Hub'];

const Inventory: React.FC<InventoryProps> = ({ products = [], suppliers = [], onAdd, onDelete, settings }) => {
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

  const handleScanResult = (res: any, stayOpen: boolean = false) => {
    if (scannerMode === 'details' && typeof res === 'object') {
      setFormData(prev => ({
        ...prev,
        name: res.name || prev.name,
        sku: res.sku || prev.sku,
        price: res.price?.toString() || prev.price,
        category: CATEGORIES.includes(res.category) ? res.category : prev.category,
        batch_number: res.batchNumber || prev.batch_number,
        expiry_date: res.expiryDate || prev.expiry_date
      }));
      setIsModalOpen(true);
      setIsScannerOpen(false);
    } else {
      const sku = typeof res === 'string' ? res : res?.sku;
      if (sku) {
        const found = products.find(p => p.sku === sku);
        if (found) {
          setSearchTerm(sku);
          setHighlightedId(found.id);
          setTimeout(() => setHighlightedId(null), 3000);
          if (!stayOpen) setIsScannerOpen(false);
        }
      } else {
        if (!stayOpen) setIsScannerOpen(false);
      }
    }
  };

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

  return (
    <div className="space-y-6 md:space-y-10 animate-in fade-in duration-700 max-w-full overflow-x-hidden">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 no-print px-4">
        <div className="min-w-0">
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight uppercase leading-tight truncate">Inventory Control</h2>
          <p className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-[9px] md:text-[10px] mt-1 flex items-center gap-2">
            <Building2 size={14} className="text-indigo-600 shrink-0" /> Enterprise Asset Repository
          </p>
        </div>
        <div className="flex flex-wrap gap-2 sm:gap-3 shrink-0">
          <button onClick={() => { resetForm(); setIsModalOpen(true); }} className="flex-1 sm:flex-none px-5 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl flex items-center justify-center gap-3 font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-all">
            <Plus size={18} /> <span className="sm:inline">Add Product</span>
          </button>
          <button onClick={() => { setScannerMode('id'); setIsScannerOpen(true); }} className="px-5 py-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-2xl flex items-center justify-center gap-3 font-black text-[10px] uppercase tracking-widest shadow-sm transition-all active:scale-95">
            <Scan size={18} /> <span className="hidden sm:inline">Strict Sensor</span>
          </button>
          <button onClick={handlePrintLedger} className="hidden sm:flex px-5 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-2xl items-center justify-center gap-3 font-black text-[9px] uppercase tracking-widest shadow-sm active:scale-95 transition-all">
            <FileText size={16} /> Print List
          </button>
        </div>
      </header>

      {/* PRINT VIEW: LEDGER */}
      {printMode === 'ledger' && (
        <div className="print-only">
          <div className="inventory-ledger-print p-10">
            <h1 className="text-2xl font-black mb-8 uppercase text-center border-b-2 border-slate-900 pb-4">{settings.companyName} - Inventory Ledger</h1>
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-100 text-[10px] font-black uppercase text-left">
                  <th className="p-3 border">SKU</th>
                  <th className="p-3 border">Product Name</th>
                  <th className="p-3 border">Category</th>
                  <th className="p-3 border">Price</th>
                  <th className="p-3 border">Qty</th>
                  <th className="p-3 border">Location</th>
                </tr>
              </thead>
              <tbody>
                {printProducts.map(p => (
                  <tr key={p.id} className="text-[10px] border-b">
                    <td className="p-3 border font-mono">{p.sku}</td>
                    <td className="p-3 border font-bold uppercase">{p.name}</td>
                    <td className="p-3 border uppercase">{p.category}</td>
                    <td className="p-3 border font-bold">{settings.currency}{p.price.toLocaleString()}</td>
                    <td className="p-3 border">{p.quantity}</td>
                    <td className="p-3 border">{p.location}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PRINT VIEW: ADVANCED QR LABELS */}
      {printMode === 'labels' && (
        <div className="print-only">
          <div className="flex flex-wrap gap-4 p-4">
            {printProducts.map(p => (
              <div key={p.id} className="qr-label-print w-[65mm] h-[40mm] border-2 border-black flex flex-col p-2 bg-white relative">
                 <div className="flex justify-between items-center border-b border-black pb-1 mb-1">
                    <span className="text-[8px] font-black uppercase tracking-tighter truncate w-32">{settings.companyName}</span>
                    <span className="text-[6px] font-black uppercase border border-black px-1 rounded">Verified Asset</span>
                 </div>
                 <div className="flex flex-1 gap-2">
                    <div className="w-20 h-20 flex items-center justify-center border border-slate-100 p-1">
                       <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${p.sku}`} alt="QR" className="w-full h-full" />
                    </div>
                    <div className="flex-1 flex flex-col justify-between py-0.5">
                       <div>
                          <h4 className="text-[10px] font-black uppercase leading-[1.1] line-clamp-2 mb-0.5">{p.name}</h4>
                          <div className="flex gap-1 items-center">
                             <span className="text-[6px] font-black uppercase bg-black text-white px-1 rounded-sm">{p.category}</span>
                             <span className="text-[7px] font-mono font-bold tracking-widest opacity-60">#{p.sku}</span>
                          </div>
                       </div>
                       <div className="flex items-end justify-between">
                          <div className="flex flex-col">
                             <span className="text-[5px] font-black uppercase opacity-40 leading-none">Net Value</span>
                             <span className="text-[14px] font-black tracking-tighter leading-none">{settings.currency}{p.price.toLocaleString()}</span>
                          </div>
                          <div className="w-5 h-5 opacity-10"><ShieldCheck size={20} /></div>
                       </div>
                    </div>
                 </div>
                 <div className="absolute top-0 right-0 h-full w-1.5 bg-slate-900"></div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 p-4 md:p-6 rounded-[2rem] md:rounded-[2.5rem] border border-slate-100 dark:border-slate-800 flex flex-col md:flex-row gap-4 no-print shadow-sm mx-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input type="text" placeholder="Filter Assets..." className="w-full pl-12 pr-6 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-bold placeholder:text-slate-400 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        {selectedIds.size > 0 && (
          <button onClick={() => handlePrintLabels()} className="px-5 py-4 bg-indigo-600 text-white rounded-2xl flex items-center justify-center gap-3 font-black text-[9px] uppercase tracking-widest shadow-xl active:scale-95 transition-all animate-in slide-in-from-right-2">
            <QrCode size={16} /> Print {selectedIds.size} Labels
          </button>
        )}
      </div>

      {/* MOBILE OPTIMIZED LIST (Enhanced Stacked Cards) */}
      <div className="lg:hidden space-y-5 px-4 pb-24 no-print">
        {filteredProducts.map((p) => {
          const isLow = p.quantity <= p.min_threshold;
          const isOut = p.quantity === 0;
          return (
            <div 
              key={p.id} 
              className={`bg-[#0f172a] p-6 rounded-[2.5rem] border border-white/5 shadow-2xl space-y-6 transition-all relative overflow-hidden active:scale-[0.99] ${highlightedId === p.id ? 'ring-4 ring-indigo-500/20' : ''}`}
              onClick={() => toggleSelection(p.id)}
            >
              {/* Card Header: Product Identity */}
              <div className="flex justify-between items-start gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="px-2 py-0.5 bg-white/5 text-indigo-400 rounded-md text-[8px] font-black uppercase tracking-widest border border-white/5">
                      {p.category}
                    </span>
                  </div>
                  <h4 className="font-black text-white uppercase text-sm leading-tight tracking-tight pr-4">
                    {p.name}
                  </h4>
                  <p className="font-mono text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-2">
                    SKU: {p.sku}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <input 
                    type="checkbox" 
                    className="rounded-lg border-white/10 bg-white/5 text-indigo-600 focus:ring-indigo-500 w-6 h-6 transition-all" 
                    checked={selectedIds.has(p.id)} 
                    onChange={(e) => { e.stopPropagation(); toggleSelection(p.id); }} 
                  />
                </div>
              </div>

              {/* Card Body: Critical Metrics */}
              <div className="grid grid-cols-2 gap-3">
                {/* Stock Metric */}
                <div className="bg-black/20 p-4 rounded-3xl border border-white/5 flex flex-col justify-between h-24">
                  <p className="text-[7px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Stock Position</p>
                  <div className="flex items-end justify-between">
                    <span className={`text-xl font-black tracking-tighter ${isOut ? 'text-rose-500' : isLow ? 'text-amber-500' : 'text-emerald-400'}`}>
                      {p.quantity} <span className="text-[10px] uppercase ml-1">Units</span>
                    </span>
                    {isLow && <AlertTriangle size={16} className="text-amber-500 mb-1 animate-pulse" />}
                  </div>
                </div>
                {/* Price Metric */}
                <div className="bg-black/20 p-4 rounded-3xl border border-white/5 flex flex-col justify-between h-24">
                  <p className="text-[7px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Asset Value</p>
                  <span className="text-xl font-black text-white tracking-tighter">
                    {settings.currency}{p.price.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Card Footer: Metadata & Quick Ops */}
              <div className="flex items-center justify-between pt-5 border-t border-white/5">
                <div className="flex items-center gap-2 text-slate-500">
                  <div className="w-8 h-8 bg-white/5 rounded-xl flex items-center justify-center">
                    <MapPin size={14} className="text-indigo-400" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[7px] font-black uppercase text-slate-600 leading-none mb-1">Location Node</span>
                    <span className="text-[9px] font-black uppercase text-slate-300 truncate max-w-[140px]">{p.location}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={(e) => { e.stopPropagation(); handlePrintLabels([p]); }} 
                    className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-slate-400 active:bg-indigo-600 active:text-white transition-all border border-white/5"
                    aria-label="Print QR"
                  >
                    <QrCode size={20} />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); if(confirm(`Confirm deletion of asset ${p.sku}?`)) onDelete(p.id); }} 
                    className="w-12 h-12 bg-rose-500/10 rounded-2xl flex items-center justify-center text-rose-500 active:bg-rose-600 active:text-white transition-all border border-rose-500/10"
                    aria-label="Delete Asset"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        {filteredProducts.length === 0 && (
          <div className="py-24 text-center">
             <div className="w-20 h-20 bg-[#0f172a] rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-white/5">
                <Search size={32} className="text-slate-700" />
             </div>
             <p className="text-slate-500 font-black uppercase text-[10px] tracking-[0.3em]">No Assets Detected</p>
             <p className="text-slate-600 text-[9px] mt-2 font-bold uppercase">Refine filter protocol</p>
          </div>
        )}
      </div>

      {/* DESKTOP TABLE VIEW */}
      <div className="hidden lg:block bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden no-print mx-4 mb-20">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[800px]">
            <thead className="bg-slate-50/50 dark:bg-slate-800/50 text-slate-500 text-[10px] uppercase font-black tracking-widest">
              <tr>
                <th className="pl-10 py-6 w-10">
                  <input type="checkbox" className="rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500" onChange={(e) => {
                    if (e.target.checked) setSelectedIds(new Set(filteredProducts.map(p => p.id)));
                    else setSelectedIds(new Set());
                  }} checked={selectedIds.size === filteredProducts.length && filteredProducts.length > 0} />
                </th>
                <th className="px-10 py-6">Asset Intelligence</th>
                <th className="px-10 py-6 text-center">Location</th>
                <th className="px-10 py-6 text-center">Health</th>
                <th className="px-10 py-6 text-center">Price</th>
                <th className="px-10 py-6 text-right">Ops</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {filteredProducts.map((p) => {
                const isLow = p.quantity <= p.min_threshold;
                const isOut = p.quantity === 0;
                return (
                  <tr key={p.id} id={`prod-${p.id}`} className={`transition-all duration-500 ${highlightedId === p.id ? 'bg-indigo-50 dark:bg-indigo-900/30 ring-4 ring-indigo-500/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}>
                    <td className="pl-10 py-6">
                      <input type="checkbox" className="rounded-md border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-transparent" checked={selectedIds.has(p.id)} onChange={() => toggleSelection(p.id)} />
                    </td>
                    <td className="px-10 py-6">
                      <div className="min-w-0">
                        <p className={`font-black uppercase tracking-tight truncate max-w-[200px] transition-colors ${highlightedId === p.id ? 'text-indigo-600' : 'text-slate-900 dark:text-white'}`}>{p.name}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{p.sku}</p>
                      </div>
                    </td>
                    <td className="px-10 py-6 text-center">
                      <span className="text-[9px] font-black uppercase tracking-widest px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-full">{p.location}</span>
                    </td>
                    <td className="px-10 py-6 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <p className={`font-black text-sm ${isOut ? 'text-rose-600' : isLow ? 'text-amber-600' : 'text-slate-900 dark:text-white'}`}>{p.quantity} Units</p>
                      </div>
                    </td>
                    <td className="px-10 py-6 text-center font-black text-indigo-600">{settings.currency}{(p.price || 0).toLocaleString()}</td>
                    <td className="px-10 py-6 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => handlePrintLabels([p])} className="p-3 text-slate-300 hover:text-indigo-600 transition-colors" title="Print Advanced QR Label"><QrCode size={18} /></button>
                        <button onClick={() => onDelete(p.id)} className="p-3 text-slate-300 hover:text-rose-600 transition-colors" title="Delete Product"><Trash2 size={18} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl no-print">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] md:rounded-[3.5rem] w-full max-w-4xl p-6 md:p-12 shadow-2xl animate-in zoom-in-95 overflow-y-auto max-h-[95vh] border border-white/5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
              <div>
                <h3 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Inventory Provision</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">Synchronizing to Database Node</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-rose-500 transition-colors md:hidden">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-10 pb-10">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2"><Tag size={12}/> Product Identity</label>
                    <input required className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none font-bold dark:text-white focus:ring-2 focus:ring-indigo-500" placeholder="Product Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase ml-1">SKU / Barcode</label>
                      <input required className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none font-bold dark:text-white focus:ring-2 focus:ring-indigo-500" placeholder="SKU0000" value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Category</label>
                      <select className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none font-bold dark:text-white focus:ring-2 focus:ring-indigo-500" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="space-y-6 bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl border border-slate-100 dark:border-slate-800">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-indigo-500 uppercase tracking-widest ml-1 flex items-center gap-2"><Layers size={12}/> On-Hand Qty</label>
                    <input required type="number" className="w-full px-5 py-3 bg-white dark:bg-slate-900 rounded-xl border-none font-black text-xl text-indigo-600 focus:ring-2 focus:ring-indigo-500" value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Selling Price ({settings.currency})</label>
                  <input required type="number" step="0.01" className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none font-bold dark:text-white focus:ring-2 focus:ring-indigo-500" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2"><MapPin size={12}/> Warehouse Location</label>
                  <select className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none font-bold dark:text-white focus:ring-2 focus:ring-indigo-500" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})}>
                    {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex flex-col-reverse md:flex-row gap-4 pt-10">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-5 font-black uppercase text-[11px] text-slate-400 hover:text-rose-500 transition-colors">Discard</button>
                <button type="submit" className="flex-1 py-5 bg-indigo-600 text-white rounded-3xl font-black uppercase text-[11px] shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-all">
                   Save to Ledger
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
