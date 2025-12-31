
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  AlertCircle,
  X,
  Package,
  Maximize,
  QrCode,
  Download,
  Sparkles,
  AlertTriangle,
  FileSpreadsheet,
  RefreshCw,
  Calendar,
  Hash,
  HelpCircle,
  Filter,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Product, Supplier, Settings } from '../types';
import { DEFAULT_CATEGORIES as CATEGORIES } from '../constants';
import ScannerModal from '../components/ScannerModal';
import QRCode from 'qrcode';

interface InventoryProps {
  products: Product[];
  suppliers: Supplier[];
  onAdd: (product: Omit<Product, 'id' | 'lastUpdated'>) => void;
  onUpdate: (id: string, updates: Partial<Product>) => void;
  onDelete: (id: string) => void;
  settings: Settings;
}

const Inventory: React.FC<InventoryProps> = ({ products, suppliers, onAdd, onUpdate, onDelete, settings }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [qrPreview, setQrPreview] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isGeneratingCSV, setIsGeneratingCSV] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Advanced Filters State
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [minQty, setMinQty] = useState<string>('');
  const [maxQty, setMaxQty] = useState<string>('');
  const [minExpiry, setMinExpiry] = useState<string>('');
  const [maxExpiry, setMaxExpiry] = useState<string>('');
  const [batchFilter, setBatchFilter] = useState<string>('');
  
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: CATEGORIES[0],
    price: 0,
    costPrice: 0,
    quantity: 0,
    minThreshold: 5,
    supplierId: suppliers[0]?.id || '',
    batchNumber: '',
    expiryDate: ''
  });

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           p.batchNumber?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
      
      const priceNum = p.price;
      const matchesMinPrice = minPrice === '' || priceNum >= parseFloat(minPrice);
      const matchesMaxPrice = maxPrice === '' || priceNum <= parseFloat(maxPrice);
      
      const qtyNum = p.quantity;
      const matchesMinQty = minQty === '' || qtyNum >= parseInt(minQty);
      const matchesMaxQty = maxQty === '' || qtyNum <= parseInt(maxQty);
      
      const matchesMinExpiry = minExpiry === '' || (p.expiryDate && p.expiryDate >= minExpiry);
      const matchesMaxExpiry = maxExpiry === '' || (p.expiryDate && p.expiryDate <= maxExpiry);
      
      const matchesBatchFilter = batchFilter === '' || (p.batchNumber && p.batchNumber.toLowerCase().includes(batchFilter.toLowerCase()));

      return matchesSearch && matchesCategory && matchesMinPrice && matchesMaxPrice && matchesMinQty && matchesMaxQty && matchesMinExpiry && matchesMaxExpiry && matchesBatchFilter;
    });
  }, [products, searchTerm, selectedCategory, minPrice, maxPrice, minQty, maxQty, minExpiry, maxExpiry, batchFilter]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd(formData);
    setIsModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      sku: '',
      category: CATEGORIES[0],
      price: 0,
      costPrice: 0,
      quantity: 0,
      minThreshold: 5,
      supplierId: suppliers[0]?.id || '',
      batchNumber: '',
      expiryDate: ''
    });
  };

  const handleScanResult = (result: any) => {
    if (typeof result === 'object') {
      setFormData(prev => ({
        ...prev,
        name: result.name || prev.name,
        sku: result.sku || prev.sku,
        price: result.price || prev.price,
        category: CATEGORIES.includes(result.category) ? result.category : prev.category,
        batchNumber: result.batchNumber || prev.batchNumber,
        expiryDate: result.expiryDate || prev.expiryDate
      }));
    } else {
      setSearchTerm(result);
    }
  };

  const showQr = async (sku: string) => {
    try {
      const url = await QRCode.toDataURL(sku, { width: 400 });
      setQrPreview(url);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDownloadQRCSV = async () => {
    setIsGeneratingCSV(true);
    try {
      const header = "Product Name,SKU,Batch No,Expiry Date,Price,QR_Code_Base64\n";
      const rows = await Promise.all(products.map(async (p) => {
        const qrBase64 = await QRCode.toDataURL(p.sku, { width: 300 });
        const escapedName = p.name.replace(/"/g, '""');
        const formattedPrice = `${settings.currency}${p.price.toLocaleString()}`;
        return `"${escapedName}","${p.sku}","${p.batchNumber}","${p.expiryDate}","${formattedPrice}","${qrBase64}"`;
      }));

      const csvContent = "data:text/csv;charset=utf-8," + header + rows.join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `Inventory_QR_Sheet_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Failed to generate QR CSV:", err);
    } finally {
      setIsGeneratingCSV(false);
    }
  };

  const confirmDelete = (id: string) => {
    onDelete(id);
    setDeleteConfirmId(null);
  };

  const inputClasses = "w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900";
  const filterInputClasses = "w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900";

  const getExpiryStatus = (dateString: string) => {
    if (!dateString) return null;
    const expiry = new Date(dateString);
    const now = new Date();
    const diffDays = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { label: 'Expired', color: 'text-rose-600 bg-rose-50' };
    if (diffDays <= 30) return { label: 'Expires Soon', color: 'text-amber-600 bg-amber-50' };
    return null;
  };

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('All');
    setMinPrice('');
    setMaxPrice('');
    setMinQty('');
    setMaxQty('');
    setMinExpiry('');
    setMaxExpiry('');
    setBatchFilter('');
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 no-print">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Inventory Management</h1>
          <p className="text-slate-500">Oversee stock levels, monitor expiry dates, and manage product batches.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={handleDownloadQRCSV}
            disabled={isGeneratingCSV || products.length === 0}
            data-tooltip="Export QR codes and prices to a CSV sheet for printing"
            className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-xl flex items-center gap-2 font-medium hover:bg-slate-50 transition-all shadow-sm disabled:opacity-50 text-sm"
          >
            {isGeneratingCSV ? <RefreshCw size={18} className="animate-spin" /> : <FileSpreadsheet size={18} />} 
            <span className="hidden sm:inline">Download QR Sheet</span>
            <span className="sm:hidden">Export</span>
          </button>
          <button 
            onClick={() => setIsScannerOpen(true)}
            data-tooltip="Quickly check price and stock by scanning a barcode"
            className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-xl flex items-center gap-2 font-medium hover:bg-slate-50 transition-all shadow-sm text-sm"
          >
            <Maximize size={18} /> <span className="hidden sm:inline">Price Check</span>
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            data-tooltip="Manually add a new item to your stock"
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-medium transition-colors shadow-lg shadow-indigo-600/20 text-sm"
          >
            <Plus size={18} /> <span>Add Product</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by name, SKU, or batch..." 
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 transition-all outline-none text-slate-900"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <select 
              data-tooltip="Filter inventory by product category"
              className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="All">All Categories</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2 rounded-xl border flex items-center gap-2 text-sm font-medium transition-all ${showFilters ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-slate-50 border-slate-200 text-slate-600'}`}
            >
              <Filter size={16} /> 
              Advanced Filters
              {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100 animate-in slide-in-from-top-2">
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Price Range ({settings.currency})</label>
              <div className="flex items-center gap-2">
                <input type="number" placeholder="Min" className={filterInputClasses} value={minPrice} onChange={e => setMinPrice(e.target.value)} />
                <span className="text-slate-400">-</span>
                <input type="number" placeholder="Max" className={filterInputClasses} value={maxPrice} onChange={e => setMaxPrice(e.target.value)} />
              </div>
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Stock Qty Range</label>
              <div className="flex items-center gap-2">
                <input type="number" placeholder="Min" className={filterInputClasses} value={minQty} onChange={e => setMinQty(e.target.value)} />
                <span className="text-slate-400">-</span>
                <input type="number" placeholder="Max" className={filterInputClasses} value={maxQty} onChange={e => setMaxQty(e.target.value)} />
              </div>
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Expiry Range</label>
              <div className="flex items-center gap-2">
                <input type="date" className={filterInputClasses} value={minExpiry} onChange={e => setMinExpiry(e.target.value)} />
                <span className="text-slate-400">-</span>
                <input type="date" className={filterInputClasses} value={maxExpiry} onChange={e => setMaxExpiry(e.target.value)} />
              </div>
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Specific Batch</label>
              <input 
                type="text" 
                placeholder="Batch Number..." 
                className={filterInputClasses} 
                value={batchFilter} 
                onChange={e => setBatchFilter(e.target.value)} 
              />
            </div>
            <div className="flex items-end pb-0.5">
              <button 
                onClick={resetFilters}
                className="w-full py-1.5 bg-white border border-slate-200 text-slate-500 text-xs font-bold rounded-lg hover:bg-slate-100 transition-all flex items-center justify-center gap-2"
              >
                <X size={14} /> Clear All
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[800px]">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold tracking-wider">
              <tr>
                <th className="px-6 py-4">QR</th>
                <th className="px-6 py-4">Product Info</th>
                <th className="px-6 py-4">Batch/Expiry</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Price</th>
                <th className="px-6 py-4">Stock Level</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map((product) => {
                const isCritical = product.quantity <= product.minThreshold;
                const isWarning = !isCritical && product.quantity <= product.minThreshold * 2;
                const stockPercentage = Math.min(100, (product.quantity / (product.minThreshold * 3)) * 100);
                const expiryStatus = getExpiryStatus(product.expiryDate);

                return (
                  <tr 
                    key={product.id} 
                    className={`hover:bg-slate-50 transition-colors group ${
                      isCritical ? 'bg-rose-50 border-l-4 border-l-rose-500' : 'border-l-4 border-l-transparent'
                    }`}
                  >
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => showQr(product.sku)}
                        data-tooltip="View and print QR label for this SKU"
                        className={`p-2 rounded-lg transition-all ${isCritical ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-400'} hover:text-indigo-600 hover:bg-indigo-50`}
                      >
                        <QrCode size={18} />
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold shrink-0 ${isCritical ? 'bg-rose-600 text-white shadow-lg' : 'bg-indigo-50 text-indigo-600'}`}>
                          {product.name.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-semibold text-slate-900">{product.name}</p>
                            {isCritical && <AlertCircle size={14} className="text-rose-500 animate-pulse" />}
                          </div>
                          <p className="text-xs text-slate-500 font-mono">{product.sku}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-xs text-slate-600">
                          <Hash size={12} className="text-slate-400" />
                          <span>{product.batchNumber || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-600">
                          <Calendar size={12} className="text-slate-400" />
                          <span>{product.expiryDate ? new Date(product.expiryDate).toLocaleDateString() : 'N/A'}</span>
                        </div>
                        {expiryStatus && (
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-tighter ${expiryStatus.color}`}>
                            {expiryStatus.label}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-medium px-2 py-1 bg-slate-100 text-slate-600 rounded-lg">
                        {product.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">
                      {settings.currency}{product.price.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 min-w-[140px]">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex justify-between items-center text-xs">
                          <span className={`font-bold ${isCritical ? 'text-rose-600' : isWarning ? 'text-amber-600' : 'text-emerald-600'}`}>
                            {product.quantity}
                          </span>
                          <span className="text-slate-400 font-medium">Goal: {product.minThreshold * 3}</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-700 ease-out ${
                              isCritical ? 'bg-rose-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${stockPercentage}%` }}
                          ></div>
                        </div>
                        {isCritical && (
                          <span className="text-[9px] text-rose-600 font-bold uppercase tracking-tighter flex items-center gap-1">
                            <AlertTriangle size={10} /> Critical Stock
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"
                          data-tooltip="Modify product details"
                          onClick={() => {
                            setFormData({...product});
                            setIsModalOpen(true);
                          }}
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => setDeleteConfirmId(product.id)}
                          className="p-2 text-slate-400 hover:text-rose-600 transition-colors"
                          data-tooltip="Permanently remove from inventory"
                        >
                          <Trash2 size={16} />
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
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Package size={48} className="mb-4 opacity-20" />
            <p className="text-lg">No products found matching filters</p>
          </div>
        )}
      </div>

      {isScannerOpen && (
        <ScannerModal 
          onScan={handleScanResult} 
          onClose={() => setIsScannerOpen(false)} 
          mode="price_check"
        />
      )}

      {deleteConfirmId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
          <div className="bg-white p-8 rounded-3xl shadow-2xl flex flex-col items-center gap-6 max-w-sm w-full animate-in zoom-in-95">
            <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center">
              <AlertTriangle size={32} />
            </div>
            <div className="text-center">
              <h3 className="text-xl font-bold text-slate-900">Are you sure?</h3>
              <p className="text-sm text-slate-500 mt-2">
                This will permanently delete <strong>{products.find(p => p.id === deleteConfirmId)?.name}</strong>. This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-3 w-full">
              <button 
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200"
              >
                Cancel
              </button>
              <button 
                onClick={() => confirmDelete(deleteConfirmId)}
                className="flex-1 py-3 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 shadow-lg shadow-rose-600/20 transition-all"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {qrPreview && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
          <div className="bg-white p-8 rounded-3xl shadow-2xl flex flex-col items-center gap-6 max-w-sm w-full animate-in zoom-in-95">
            <h3 className="text-xl font-bold text-slate-900">Product QR Label</h3>
            <img src={qrPreview} alt="QR Code" className="w-full h-auto border-8 border-slate-50 rounded-2xl shadow-inner" />
            <div className="text-center">
              <p className="font-bold text-slate-900">Label Generated</p>
              <p className="text-sm text-slate-500">Print or scan to identify items</p>
            </div>
            <div className="flex gap-3 w-full">
              <button 
                onClick={() => setQrPreview(null)}
                className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200"
              >
                Close
              </button>
              <button 
                onClick={() => window.print()}
                className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 flex items-center justify-center gap-2"
              >
                <Download size={18} /> Print Label
              </button>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 overflow-y-auto">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="bg-white rounded-3xl w-full max-w-lg relative z-10 shadow-2xl animate-in zoom-in-95 duration-200 my-8">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Product Details</h3>
                <p className="text-xs text-slate-400">Configure core product properties and tracking info.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="flex justify-center">
                <button 
                  type="button"
                  onClick={() => setIsScannerOpen(true)}
                  className="bg-indigo-50 text-indigo-600 px-6 py-3 rounded-2xl flex items-center gap-2 font-bold hover:bg-indigo-100 transition-all border border-indigo-100 w-full justify-center group"
                >
                  <Sparkles size={20} className="group-hover:animate-pulse" /> AI Scanner Auto-fill
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Product Name</label>
                  <input 
                    required 
                    type="text" 
                    className={inputClasses}
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">SKU / Barcode</label>
                  <input 
                    required 
                    type="text" 
                    className={inputClasses}
                    value={formData.sku}
                    onChange={e => setFormData({...formData, sku: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Category</label>
                  <select 
                    className={inputClasses}
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value})}
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Batch Number</label>
                  <input 
                    type="text" 
                    placeholder="e.g. B-1234"
                    className={inputClasses}
                    value={formData.batchNumber}
                    onChange={e => setFormData({...formData, batchNumber: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Expiry Date</label>
                  <input 
                    type="date" 
                    className={inputClasses}
                    value={formData.expiryDate}
                    onChange={e => setFormData({...formData, expiryDate: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Selling Price ({settings.currency})</label>
                  <input 
                    required 
                    type="number" 
                    step="0.01"
                    className={inputClasses}
                    value={formData.price}
                    onChange={e => setFormData({...formData, price: Number(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1 flex items-center gap-1">
                    Cost Price ({settings.currency})
                    <div className="cursor-help text-indigo-400" data-tooltip="The purchase cost per unit. Used to calculate gross profit (Selling Price - Cost Price).">
                      <HelpCircle size={12} />
                    </div>
                  </label>
                  <input 
                    required 
                    type="number" 
                    step="0.01"
                    className={inputClasses}
                    value={formData.costPrice}
                    onChange={e => setFormData({...formData, costPrice: Number(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Initial Qty</label>
                  <input 
                    required 
                    type="number" 
                    className={inputClasses}
                    value={formData.quantity}
                    onChange={e => setFormData({...formData, quantity: Number(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Min. Alert Level</label>
                  <input 
                    required 
                    type="number" 
                    className={inputClasses}
                    value={formData.minThreshold}
                    onChange={e => setFormData({...formData, minThreshold: Number(e.target.value)})}
                  />
                </div>
              </div>
              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 text-slate-600 font-semibold hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 transition-all"
                >
                  Save to Inventory
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
