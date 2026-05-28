
import React, { useState } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Mail, 
  Phone, 
  Building2, 
  Edit2, 
  Trash2, 
  X,
  UserCircle,
  Briefcase,
  ExternalLink,
  ShieldCheck,
  Zap,
  Globe,
  Loader2,
  CheckCircle2,
  ChevronRight,
  ArrowUpRight,
  MapPin
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { TRANSLATIONS } from '../constants/translations';
import { Supplier, Settings } from '../types';
import { DEFAULT_CATEGORIES as CATEGORIES } from '../constants';

interface SuppliersProps {
  suppliers: Supplier[];
  onAdd: (supplier: Omit<Supplier, 'id' | 'user_id'>) => void;
  onUpdate: (id: string, updates: Partial<Supplier>) => void;
  onDelete: (id: string) => void;
  settings: Settings;
}

const Suppliers: React.FC<SuppliersProps> = ({ suppliers, onAdd, onUpdate, onDelete, settings }) => {
  const t = TRANSLATIONS[settings?.language || 'en'] || TRANSLATIONS.en;
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    contactName: '',
    email: '',
    phone: '',
    category: CATEGORIES[0]
  });

  const filteredSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    // Simulate a bit of loading for premium feel
    await new Promise(resolve => setTimeout(resolve, 600));
    onAdd(formData);
    setIsSaving(false);
    setIsModalOpen(false);
    setFormData({ name: '', contactName: '', email: '', phone: '', category: CATEGORIES[0] });
  };

  const inputClasses = "w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 font-medium text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-600/20 outline-none transition-all";

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-full px-4 md:px-0 pb-32">
      {/* Header Section */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white uppercase tracking-tight">{t.suppliers}</h2>
          <p className="text-sm text-slate-500">{t.suppliers_desc || 'Manage your procurement network and contact information.'}</p>
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl shadow-sm hover:bg-indigo-700 active:scale-95 transition-all font-bold text-sm"
        >
          <Plus size={18} /> {t.add_product ? `${t.add_product}` : 'Add New Supplier'}
        </button>
      </header>

      {/* Search & Stats Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by company name, category or contact person..." 
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm placeholder:text-slate-400 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-primary/10 transition-all" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="lg:col-span-4 bg-slate-900 rounded-2xl p-6 text-white shadow-lg flex flex-col justify-between">
           <div>
              <div className="flex items-center gap-3 mb-4">
                <Users size={20} className="text-indigo-400" />
                <h3 className="text-lg font-bold">Total Suppliers</h3>
              </div>
              <p className="text-3xl font-bold mb-1">{suppliers.length}</p>
              <p className="text-xs text-slate-400">Verified procurement partners</p>
           </div>
           
           <div className="pt-4 mt-4 border-t border-slate-800">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase text-emerald-400 tracking-wider">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Operational Consistency 100%
              </div>
           </div>
        </div>
      </div>

      {/* Supplier Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredSuppliers.map((supplier) => (
            <motion.div 
              layout
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              key={supplier.id} 
              className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm group hover:border-indigo-600/30 transition-all flex flex-col"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 bg-indigo-600/10 text-indigo-600 rounded-xl flex items-center justify-center font-bold text-xl">
                  {supplier.name.charAt(0)}
                </div>
                
                <div className="flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                  <button 
                    className="p-2 text-slate-400 hover:text-indigo-600 rounded-lg transition-colors"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    onClick={() => onDelete(supplier.id)}
                    className="p-2 text-slate-400 hover:text-rose-500 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-xs font-bold text-slate-500 uppercase mb-1 tracking-wider">{supplier.category}</p>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">{supplier.name}</h3>
              </div>

              <div className="space-y-3 flex-1">
                <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                  <UserCircle size={16} className="text-slate-400" />
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{supplier.contactName}</span>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <a 
                    href={`mailto:${supplier.email}`}
                    className="flex items-center justify-center gap-2 p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition-all"
                  >
                    <Mail size={16} />
                    <span className="text-[10px] font-bold uppercase">Email</span>
                  </a>
                  <a 
                    href={`tel:${supplier.phone}`}
                    className="flex items-center justify-center gap-2 p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 transition-all"
                  >
                    <Phone size={16} />
                    <span className="text-[10px] font-bold uppercase">Call</span>
                  </a>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                 <div className="flex items-center gap-2">
                   <ShieldCheck size={14} className="text-emerald-500" />
                   <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Verified Partner</span>
                 </div>
                 <ChevronRight size={14} className="text-slate-300" />
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredSuppliers.length === 0 && (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-center">
            <Users size={48} className="text-slate-200 mb-4" />
            <p className="text-slate-500 font-medium">No suppliers match your current search parameters</p>
          </div>
        )}
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
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Supplier Registration</h3>
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
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Company Name</label>
                    <input 
                      required 
                      type="text" 
                      placeholder="e.g. Worldwide Logistics Ltd."
                      className={inputClasses}
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Email Address</label>
                      <input 
                        required 
                        type="email" 
                        placeholder="contact@supplier.com"
                        className={inputClasses}
                        value={formData.email}
                        onChange={e => setFormData({...formData, email: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Phone Number</label>
                      <input 
                        required 
                        type="tel" 
                        placeholder="+1 234 567 890"
                        className={inputClasses}
                        value={formData.phone}
                        onChange={e => setFormData({...formData, phone: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Contact Person</label>
                      <input 
                        required 
                        type="text" 
                        placeholder="Primary Representative"
                        className={inputClasses}
                        value={formData.contactName}
                        onChange={e => setFormData({...formData, contactName: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Product Category</label>
                      <select 
                        className={inputClasses}
                        value={formData.category}
                        onChange={e => setFormData({...formData, category: e.target.value})}
                      >
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
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
                    className="flex-[2] py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-600/20 hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  >
                    {isSaving ? (
                      <><Loader2 size={18} className="animate-spin" /> Saving...</>
                    ) : (
                      <><CheckCircle2 size={18} /> Register Supplier</>
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

export default Suppliers;

