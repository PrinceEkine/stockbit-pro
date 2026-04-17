
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
import { Supplier } from '../types';
import { DEFAULT_CATEGORIES as CATEGORIES } from '../constants';

interface SuppliersProps {
  suppliers: Supplier[];
  onAdd: (supplier: Omit<Supplier, 'id' | 'user_id'>) => void;
  onUpdate: (id: string, updates: Partial<Supplier>) => void;
  onDelete: (id: string) => void;
}

const Suppliers: React.FC<SuppliersProps> = ({ suppliers, onAdd, onUpdate, onDelete }) => {
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

  const inputClasses = "w-full px-8 py-5 bg-slate-100 dark:bg-slate-900/50 border-2 border-transparent focus:border-indigo-600/50 rounded-[2rem] font-bold text-sm dark:text-white outline-none transition-all shadow-inner";

  return (
    <div className="space-y-12 animate-in fade-in duration-1000 max-w-7xl mx-auto px-4 md:px-8 pb-32">
      {/* Header Section */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
             <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-600/30">
               <Users className="text-white" size={28} />
             </div>
             <div>
               <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-none">Supply <span className="text-indigo-600 italic">Nodes</span></h1>
               <p className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px] mt-2">Global Procurement Network Management</p>
             </div>
          </div>
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-4 px-10 py-6 bg-indigo-600 text-white rounded-[2.5rem] shadow-2xl shadow-indigo-600/30 active:scale-95 transition-all font-black text-[11px] uppercase tracking-[0.3em] group"
        >
          <Plus size={22} className="group-hover:rotate-90 transition-transform" /> Register New Partner
        </button>
      </header>

      {/* Search & Stats Bento */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl border border-slate-200/50 dark:border-slate-800 p-8 md:p-10 rounded-[3.5rem] shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/5 blur-[100px] rounded-full -mr-32 -mt-32"></div>
          <div className="relative space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-[0.3em] flex items-center gap-3">
                Neural Search <Search size={16} className="text-indigo-500" />
              </h2>
              <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-500/10 px-3 py-1 rounded-full">System Live</span>
            </div>
            <div className="relative group">
              <Search className="absolute left-7 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-all duration-300" size={24} />
              <input 
                type="text" 
                placeholder="Lookup partner or procurement sector..." 
                className="w-full pl-18 pr-10 py-7 bg-slate-100/50 dark:bg-slate-950/50 border-2 border-transparent focus:border-indigo-600/50 rounded-[2.5rem] text-sm font-bold placeholder:text-slate-400 text-slate-900 dark:text-white outline-none shadow-inner transition-all" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 bg-slate-900 rounded-[3.5rem] p-10 text-white relative overflow-hidden shadow-2xl flex flex-col justify-between group">
           <div className="relative z-10">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/10">
                  <Globe size={24} className="text-indigo-400" />
                </div>
                <div>
                   <h3 className="text-xl font-black uppercase tracking-tight">Logistic Health</h3>
                   <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Global Terminal Status</p>
                </div>
              </div>
              <p className="text-4xl font-black tracking-tighter mb-2">0{suppliers.length}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Authenticated Partners</p>
           </div>
           
           <div className="relative z-10 pt-8 border-t border-slate-800">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase text-emerald-400">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Operational Consistency 100%
              </div>
           </div>
           
           <div className="absolute -bottom-10 -right-10 opacity-[0.05] group-hover:scale-125 transition-transform duration-[4000ms]">
              <Globe size={300} />
           </div>
        </div>
      </div>

      {/* Supplier Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <AnimatePresence mode="popLayout">
          {filteredSuppliers.map((supplier, index) => (
            <motion.div 
              layout
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ delay: index * 0.05 }}
              key={supplier.id} 
              className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl p-10 rounded-[4rem] border border-slate-200/50 dark:border-slate-800 shadow-2xl group relative transition-all hover:translate-y-[-8px] flex flex-col justify-between overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/[0.03] rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-1000"></div>
              
              <div className="relative">
                <div className="flex justify-between items-start mb-10">
                  <div className="w-20 h-20 bg-indigo-600 text-white rounded-[2rem] flex items-center justify-center font-black text-3xl shadow-xl shadow-indigo-600/20 group-hover:rotate-6 transition-transform">
                    {supplier.name.charAt(0)}
                  </div>
                  
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-500">
                    <button 
                      className="w-12 h-12 bg-white dark:bg-slate-800 text-slate-400 hover:text-indigo-600 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center justify-center transition-all hover:scale-110"
                      onClick={() => {}}
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => onDelete(supplier.id)}
                      className="w-12 h-12 bg-white dark:bg-slate-800 text-slate-400 hover:text-rose-500 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center justify-center transition-all hover:scale-110"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 mb-10">
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">{supplier.name}</h3>
                  <div className="flex items-center gap-2">
                    <div className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-full text-[9px] font-black uppercase tracking-widest border border-slate-200 dark:border-white/5">
                      {supplier.category}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-6 bg-slate-50/50 dark:bg-slate-950/50 backdrop-blur-sm rounded-[2.5rem] border border-slate-100 dark:border-white/5 flex items-center gap-5 transition-colors group-hover:bg-white dark:group-hover:bg-slate-850">
                    <div className="w-12 h-12 bg-indigo-500/10 text-indigo-500 rounded-2xl flex items-center justify-center shadow-inner">
                       <UserCircle size={22} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.2em] mb-1">Chief Operator</p>
                      <p className="text-sm font-black text-slate-900 dark:text-white truncate tracking-tight">{supplier.contactName}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <a 
                      href={`mailto:${supplier.email}`}
                      className="flex flex-col items-center justify-center p-6 bg-slate-50/50 dark:bg-slate-950/50 rounded-[2.5rem] border border-slate-100 dark:border-white/5 hover:bg-white dark:hover:bg-slate-800 hover:shadow-2xl hover:text-indigo-600 transition-all group/link"
                    >
                      <Mail size={22} className="mb-2 text-slate-400 group-hover/link:text-indigo-600 group-hover/link:scale-110 transition-all" />
                      <span className="text-[9px] font-black uppercase tracking-widest">Email</span>
                    </a>
                    <a 
                      href={`tel:${supplier.phone}`}
                      className="flex flex-col items-center justify-center p-6 bg-slate-50/50 dark:bg-slate-950/50 rounded-[2.5rem] border border-slate-100 dark:border-white/5 hover:bg-white dark:hover:bg-slate-800 hover:shadow-2xl hover:text-emerald-500 transition-all group/link"
                    >
                      <Phone size={22} className="mb-2 text-slate-400 group-hover/link:text-emerald-500 group-hover/link:scale-110 transition-all" />
                      <span className="text-[9px] font-black uppercase tracking-widest">Call</span>
                    </a>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-slate-400 group-hover:text-indigo-600 transition-all relative z-10">
                 <div className="flex items-center gap-2">
                   <ShieldCheck size={14} className="text-emerald-500" />
                   <span className="text-[9px] font-black uppercase tracking-widest leading-none">Verified Channel</span>
                 </div>
                 <ArrowUpRight size={18} className="translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all" />
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredSuppliers.length === 0 && (
          <div className="col-span-full py-40 flex flex-col items-center justify-center text-center space-y-10 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl rounded-[5rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
            <div className="w-32 h-32 bg-white dark:bg-slate-800 rounded-[3rem] flex items-center justify-center text-slate-200 dark:text-slate-700 shadow-2xl">
               <Users size={64} />
            </div>
            <div className="space-y-4">
               <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Network Void</h2>
               <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.3em] max-w-sm">No active procurement nodes match your current search parameters</p>
            </div>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="px-12 py-6 bg-indigo-600 text-white rounded-[2.5rem] font-black uppercase text-[11px] tracking-[0.3em] shadow-2xl shadow-indigo-600/30 active:scale-95 transition-all"
            >
              Provision First Node
            </button>
          </div>
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-12">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-950/90 backdrop-blur-3xl" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 40 }}
              className="bg-white dark:bg-slate-900 rounded-[5rem] w-full max-w-2xl relative shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] overflow-hidden border border-white/5"
            >
              <div className="p-12 md:p-16 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-none">Partner <span className="text-indigo-600 italic">Entry</span></h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mt-3">Neural Logistics Registry</p>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)} 
                  className="w-16 h-16 bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-rose-500 rounded-full flex items-center justify-center transition-all hover:rotate-90 shadow-inner group"
                >
                  <X size={28} className="group-hover:scale-110 transition-transform" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="p-12 md:p-16 space-y-12">
                <div className="space-y-8">
                  <div className="space-y-4">
                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] ml-6">Node Entity Identity</label>
                    <div className="relative group">
                      <Building2 className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={24} />
                      <input 
                        required 
                        type="text" 
                        placeholder="e.g. Kinetic Logistics Corp."
                        className={`${inputClasses} pl-20`}
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <label className="block text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] ml-6 flex items-center gap-2">
                         <Mail size={14} className="text-indigo-500" /> Comms Channel
                      </label>
                      <input 
                        required 
                        type="email" 
                        placeholder="transmission@node.io"
                        className={inputClasses}
                        value={formData.email}
                        onChange={e => setFormData({...formData, email: e.target.value})}
                      />
                    </div>
                    <div className="space-y-4">
                      <label className="block text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] ml-6 flex items-center gap-2">
                         <Phone size={14} className="text-emerald-500" /> Secure Line
                      </label>
                      <input 
                        required 
                        type="tel" 
                        placeholder="+234 000 000 0000"
                        className={inputClasses}
                        value={formData.phone}
                        onChange={e => setFormData({...formData, phone: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <label className="block text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] ml-6">Lead Operator</label>
                      <input 
                        required 
                        type="text" 
                        placeholder="Full Legal Name"
                        className={inputClasses}
                        value={formData.contactName}
                        onChange={e => setFormData({...formData, contactName: e.target.value})}
                      />
                    </div>
                    <div className="space-y-4">
                      <label className="block text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] ml-6 text-slate-400">Assignment Sector</label>
                      <div className="relative">
                        <select 
                          className={`${inputClasses} appearance-none cursor-pointer`}
                          value={formData.category}
                          onChange={e => setFormData({...formData, category: e.target.value})}
                        >
                          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <ChevronRight size={18} className="absolute right-8 top-1/2 -translate-y-1/2 text-slate-400 rotate-90 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-10 flex flex-col md:flex-row gap-6">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-7 text-slate-400 font-black uppercase text-[12px] tracking-[0.4em] hover:text-slate-600 transition-colors"
                  >
                    Abort Entry
                  </button>
                  <button 
                    type="submit"
                    disabled={isSaving}
                    className="flex-[2] py-7 bg-indigo-600 text-white font-black rounded-[3rem] shadow-[0_30px_60px_rgba(79,70,229,0.4)] transition-all active:scale-95 uppercase text-[12px] tracking-[0.4em] flex items-center justify-center gap-4"
                  >
                    {isSaving ? (
                      <><Loader2 size={24} className="animate-spin" /> Provisioning</>
                    ) : (
                      <><ShieldCheck size={24} /> Confirm Link</>
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

