
import React, { useState, useEffect } from 'react';
import { 
  ClipboardCheck, 
  Search, 
  RefreshCw, 
  Save, 
  AlertCircle,
  CheckCircle2,
  ArrowRightLeft
} from 'lucide-react';
import { Product, StocktakeItem } from '../types';

interface StocktakeProps {
  products: Product[];
  // Fix: Return type changed to Promise<void> to properly handle the async reconcileInventory method from store
  onReconcile: (items: StocktakeItem[]) => Promise<void>;
}

const Stocktake: React.FC<StocktakeProps> = ({ products, onReconcile }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [isSuccess, setIsSuccess] = useState(false);

  // Initialize counts from products if not already set
  useEffect(() => {
    const initialCounts: Record<string, number> = {};
    products.forEach(p => {
      initialCounts[p.id] = p.quantity;
    });
    setCounts(initialCounts);
  }, [products]);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCountChange = (productId: string, value: string) => {
    const numValue = value === '' ? 0 : parseInt(value, 10);
    setCounts(prev => ({ ...prev, [productId]: numValue }));
  };

  // Fix: handleReconcile is now async to properly wait for the onReconcile operation to finish
  const handleReconcile = async () => {
    const reconciliationItems: StocktakeItem[] = products.map(p => ({
      productId: p.id,
      systemQty: p.quantity,
      physicalQty: counts[p.id] ?? p.quantity
    }));

    await onReconcile(reconciliationItems);
    setIsSuccess(true);
    setTimeout(() => setIsSuccess(false), 3000);
  };

  const totalDiscrepancies = products.reduce((acc, p) => {
    const diff = (counts[p.id] ?? p.quantity) - p.quantity;
    return acc + (diff !== 0 ? 1 : 0);
  }, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            Stocktaking & Reconciliation <ClipboardCheck className="text-indigo-600" />
          </h1>
          <p className="text-slate-500">Conduct physical counts and update system inventory to match reality.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => {
              const reset: Record<string, number> = {};
              products.forEach(p => reset[p.id] = p.quantity);
              setCounts(reset);
            }}
            data-tooltip="Reset all counts to match current system values"
            className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-xl flex items-center gap-2 font-medium hover:bg-slate-50 transition-all"
          >
            <RefreshCw size={18} /> Reset Counts
          </button>
          <button 
            onClick={handleReconcile}
            data-tooltip="Update system inventory with these physical counts"
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-xl flex items-center gap-2 font-medium transition-all shadow-lg shadow-indigo-600/20"
          >
            <Save size={18} /> Sync Inventory
          </button>
        </div>
      </div>

      {isSuccess && (
        <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex items-center gap-3 text-emerald-700 animate-in slide-in-from-top-4">
          <CheckCircle2 size={20} />
          <p className="font-medium">Inventory successfully reconciled and updated.</p>
        </div>
      )}

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm" data-tooltip="Total products evaluated during this session">
          <p className="text-sm font-medium text-slate-500 mb-1">Items Checked</p>
          <h3 className="text-2xl font-bold text-slate-900">{products.length}</h3>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm" data-tooltip="Count of items where physical quantity differs from system">
          <p className="text-sm font-medium text-slate-500 mb-1">Discrepancies Found</p>
          <h3 className={`text-2xl font-bold ${totalDiscrepancies > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
            {totalDiscrepancies}
          </h3>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm" data-tooltip="Percentage of items that perfectly match records">
          <p className="text-sm font-medium text-slate-500 mb-1">Inventory Health</p>
          <h3 className="text-2xl font-bold text-slate-900">
            {products.length > 0 ? Math.round(((products.length - totalDiscrepancies) / products.length) * 100) : 100}% Match
          </h3>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Filter products to count..." 
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold tracking-wider">
              <tr>
                <th className="px-6 py-4">Product</th>
                <th className="px-6 py-4">System Qty</th>
                <th className="px-6 py-4">Physical Count</th>
                <th className="px-6 py-4">Discrepancy</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map((p) => {
                const physical = counts[p.id] ?? p.quantity;
                const diff = physical - p.quantity;
                
                return (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-slate-900">{p.name}</p>
                      <p className="text-xs text-slate-500">{p.sku}</p>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-600">
                      {p.quantity}
                    </td>
                    <td className="px-6 py-4">
                      <input 
                        type="number" 
                        min="0"
                        data-tooltip="Enter the actual number of items found in warehouse"
                        className={`w-24 px-3 py-1.5 rounded-lg border-2 outline-none transition-all ${
                          diff === 0 ? 'border-slate-100' : 'border-indigo-100 bg-indigo-50/30 text-slate-900'
                        } focus:border-indigo-500 text-slate-900`}
                        value={counts[p.id] ?? p.quantity}
                        onChange={(e) => handleCountChange(p.id, e.target.value)}
                      />
                    </td>
                    <td className="px-6 py-4">
                      {diff === 0 ? (
                        <span className="text-sm text-slate-400">-</span>
                      ) : (
                        <span className={`text-sm font-bold flex items-center gap-1 ${diff > 0 ? 'text-emerald-600' : 'text-rose-600'}`} data-tooltip="Difference between physical and system count">
                          {diff > 0 ? `+${diff}` : diff}
                          <ArrowRightLeft size={12} className="opacity-50" />
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {diff === 0 ? (
                        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full" data-tooltip="System and physical counts are in sync">Matched</span>
                      ) : (
                        <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-full flex items-center gap-1 w-fit" data-tooltip="This item will be updated to match the physical count">
                          <AlertCircle size={12} /> Needs Adjustment
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Stocktake;
