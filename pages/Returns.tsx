
import React, { useState, useMemo } from 'react';
import { 
  ArrowLeftRight, 
  Search, 
  Plus, 
  RefreshCcw, 
  CheckCircle2, 
  XCircle,
  PackageCheck,
  AlertCircle
} from 'lucide-react';
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
  const [formData, setFormData] = useState({
    productId: '',
    quantity: 1,
    reason: '',
    refunded: true,
    location: 'Main Branch'
  });

  const filteredReturns = useMemo(() => {
    return returns.filter(r => 
      // Fix: productName changed to product_name and saleId to sale_id
      r.product_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (r.sale_id || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [returns, searchTerm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const p = products.find(prod => prod.id === formData.productId);
    if (!p) return;
    
    // Fix: mapping to snake_case product_name
    await onRecordReturn({
      product_id: formData.productId,
      product_name: p.name,
      quantity: formData.quantity,
      reason: formData.reason,
      refunded: formData.refunded,
      location: formData.location
    });
    setIsModalOpen(false);
    setFormData({ productId: '', quantity: 1, reason: '', refunded: true, location: 'Main Branch' });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight uppercase">Reverse Logistics</h2>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-1 flex items-center gap-2">
            <ArrowLeftRight size={14} className="text-indigo-600" /> Inventory Inbound Recovery
          </p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="px-6 py-3 bg-slate-900 text-white rounded-2xl flex items-center gap-3 font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-all">
          <Plus size={18} /> Log Return
        </button>
      </header>

      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Search return history or Sale ID..." 
            className="w-full pl-12 pr-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-indigo-600 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50/50 text-slate-500 text-[10px] uppercase font-black tracking-widest">
            <tr>
              <th className="px-8 py-4">Item & Reason</th>
              <th className="px-8 py-4 text-center">Qty</th>
              <th className="px-8 py-4 text-center">Status</th>
              <th className="px-8 py-4 text-right">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredReturns.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-8 py-6">
                  {/* Fix: productName changed to product_name */}
                  <p className="text-sm font-black text-slate-900 uppercase truncate">{r.product_name}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 italic">"{r.reason}"</p>
                </td>
                <td className="px-8 py-6 text-center font-black text-indigo-600">{r.quantity}</td>
                <td className="px-8 py-6 text-center">
                  <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-full ${r.refunded ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'}`}>
                    {r.refunded ? 'Refunded' : 'Credit Only'}
                  </span>
                </td>
                <td className="px-8 py-6 text-right">
                   <p className="text-[10px] text-slate-500 font-bold uppercase">{new Date(r.date).toLocaleDateString()}</p>
                   <p className="text-[8px] text-slate-300 font-bold uppercase tracking-widest">{r.location}</p>
                </td>
              </tr>
            ))}
            {filteredReturns.length === 0 && (
              <tr><td colSpan={4} className="py-24 text-center text-slate-400 font-black uppercase text-[10px] tracking-widest"><PackageCheck size={48} className="mx-auto mb-4 opacity-10" /> No return history.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl">
          <div className="bg-white rounded-[3rem] w-full max-w-lg p-12 shadow-2xl animate-in zoom-in-95">
            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-8">Process Return</h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Item Selection</label>
                <select required className="w-full px-6 py-4 bg-slate-50 rounded-2xl border-none outline-none font-bold text-sm" value={formData.productId} onChange={e => setFormData({...formData, productId: e.target.value})}>
                   <option value="">Select Item...</option>
                   {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Return Qty</label>
                  <input type="number" min="1" required className="w-full px-6 py-4 bg-slate-50 rounded-2xl border-none outline-none font-bold text-sm" value={formData.quantity} onChange={e => setFormData({...formData, quantity: Number(e.target.value)})} />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Refund Issued?</label>
                  <select className="w-full px-6 py-4 bg-slate-50 rounded-2xl border-none outline-none font-bold text-sm" value={formData.refunded ? 'yes' : 'no'} onChange={e => setFormData({...formData, refunded: e.target.value === 'yes'})}>
                    <option value="yes">Yes (Cash Back)</option>
                    <option value="no">No (Store Credit)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Reason for Return</label>
                <textarea required className="w-full px-6 py-4 bg-slate-50 rounded-2xl border-none outline-none font-bold text-sm h-24 resize-none" placeholder="Defective, size mismatch, etc." value={formData.reason} onChange={e => setFormData({...formData, reason: e.target.value})} />
              </div>
              <button type="submit" className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-xl active:scale-95 transition-all">Submit Return & Restock</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Returns;
