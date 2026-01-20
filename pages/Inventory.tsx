
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
  CheckSquare
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
    <div className="space-y-6 md:space-y-10 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 no-print">
        <div>
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight uppercase leading-tight">Inventory Control</h2>
          <p className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-[9px] md:text-[10px] mt-1 flex items-center gap-2">
            <Building2 size={14} className="text-indigo-600 shrink-0" /> Enterprise Asset Repository
          </p>
        </div>
        <div className="flex flex-wrap gap-2 sm:gap-3">
          {selectedIds.size > 0 && (
            <button onClick={() => handlePrintLabels()} className="px-5 py-3 bg-indigo-600 text-white rounded-2xl flex items-center justify-center gap-3 font-black text-[9px] uppercase tracking-widest shadow-xl active:scale-95 transition-all animate-in slide-in-from-right-2">
              <QrCode size={16} /> Print {selectedIds.size} Labels
            </button>
          )}
          <button onClick={handlePrintLedger} className="px-5 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-2xl flex items-center justify-center gap-3 font-black text-[9px] uppercase tracking-widest shadow-sm active:scale-95 transition-all">
            <FileText size={16} /> Print List
          </button>
          <button onClick={() => { setScannerMode('id'); setIsScannerOpen(true); }} className="px-5 py-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-2xl flex items-center justify-center gap-3 font-black text-[10px] uppercase tracking-widest shadow-sm transition-all active:scale-95">
            <Scan size={18} /> Strict Sensor
          </button>
          <button onClick={() => { resetForm(); setIsModalOpen(true); }} className="px-5 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl flex items-center justify-center gap-3 font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-all">
            <Plus size={18} /> Add Product
          </button>
        </div>
      </header>

      {/* PRINT VIEW: LEDGER */}
      {printMode === 'ledger' && (
        <div className="print-only">
          <div className="inventory-ledger-print p-10">
            <h1 className="text-2xl font-black mb-8 uppercase text-center border-b pb-4">{settings.companyName} - Inventory Ledger</h1>
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
                    <td className="p-3 border font-bold">{p.name}</td>
                    <td className="p-3 border">{p.category}</td>
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
          <div className="flex flex-wrap gap-4">
            {printProducts.map(p => (
              <div key={p.id} className="qr-label-print">
                 <div className="w-full text-center border-b border-black/10 pb-1 mb-1">
                    <p className="text-[7px] font-black uppercase tracking-tighter truncate opacity-60">{settings.companyName}</p>
                 </div>
                 <div className="flex items-center justify-between w-full px-2">
                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${p.sku}`} alt="QR" className="w-14 h-14" />
                    <div className="flex-1 pl-2 flex flex-col justify-center min-w-0">
                       <h4 className="text-[9px] font-black uppercase leading-tight line-clamp-2 mb-1">{p.name}</h4>
                       <p className="text-[7px] font-bold font-mono tracking-widest text-slate-500 mb-1">{p.sku}</p>
                       <p className="text-[12px] font-black">{settings.currency}{p.price.toLocaleString()}</p>
                    </div>
                 </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 p-4 md:p-6 rounded-[2rem] md:rounded-[2.5rem] border border-slate-100 dark:border-slate-800 flex flex-col md:flex-row gap-4 no-print shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input type="text" placeholder="Filter Assets..." className="w-full pl-12 pr-6 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-bold placeholder:text-slate-400 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[2rem] md:rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden no-print mx-2">
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
                        <button onClick={() => handlePrintLabels([p])} className="p-3 text-slate-300 hover:text-indigo-600 transition-colors" title="Print QR Label"><QrCode size={18} /></button>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl no-print">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] md:rounded-[3.5rem] w-full max-w-4xl p-6 md:p-12 shadow-2xl animate-in zoom-in-95 overflow-y-auto max-h-[95vh] border border-white/5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
              <div>
                <h3 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Inventory Provision</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">Synchronizing to Database Node</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2"><Tag size={12}/> Product Identity</label>
                    <input required className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none font-bold dark:text-white focus:ring-2 focus:ring-indigo-500" placeholder="Product Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
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
                  <input required type="number" step="0.01" className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none font-bold dark:text-white" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2"><MapPin size={12}/> Warehouse Location</label>
                  <select className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none font-bold dark:text-white" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})}>
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
