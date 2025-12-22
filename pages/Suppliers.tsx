
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
  Briefcase
} from 'lucide-react';
import { Supplier } from '../types';
import { DEFAULT_CATEGORIES as CATEGORIES } from '../constants';

interface SuppliersProps {
  suppliers: Supplier[];
  onAdd: (supplier: Omit<Supplier, 'id'>) => void;
  onUpdate: (id: string, updates: Partial<Supplier>) => void;
  onDelete: (id: string) => void;
}

const Suppliers: React.FC<SuppliersProps> = ({ suppliers, onAdd, onUpdate, onDelete }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd(formData);
    setIsModalOpen(false);
    setFormData({ name: '', contactName: '', email: '', phone: '', category: CATEGORIES[0] });
  };

  const inputClasses = "w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 transition-all";

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            Supplier Management <Users className="text-indigo-600" />
          </h1>
          <p className="text-slate-500">Manage your procurement network and supplier contact details.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          data-tooltip="Register a new procurement partner"
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-xl flex items-center gap-2 font-medium transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
        >
          <Plus size={18} /> Add Supplier
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search suppliers by company, contact, or category..." 
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSuppliers.map((supplier) => (
          <div key={supplier.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="flex gap-1">
                <button 
                  className="p-2 text-slate-400 hover:text-indigo-600 bg-slate-50 rounded-lg"
                  data-tooltip="Edit supplier details"
                >
                  <Edit2 size={14} />
                </button>
                <button 
                  onClick={() => onDelete(supplier.id)}
                  className="p-2 text-slate-400 hover:text-rose-600 bg-slate-50 rounded-lg"
                  data-tooltip="Remove supplier"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center font-bold text-xl shrink-0 shadow-inner">
                {supplier.name.charAt(0)}
              </div>
              <div className="min-w-0">
                <h3 className="text-lg font-bold text-slate-900 truncate">{supplier.name}</h3>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full uppercase tracking-wider">
                  <Briefcase size={10} /> {supplier.category}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-slate-600 bg-slate-50 p-3 rounded-2xl">
                <UserCircle size={18} className="text-slate-400" />
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Contact Person</span>
                  <span className="font-medium">{supplier.contactName}</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <a 
                  href={`mailto:${supplier.email}`}
                  data-tooltip={`Email ${supplier.name}`}
                  className="flex flex-col items-center justify-center p-3 bg-slate-50 rounded-2xl hover:bg-indigo-50 hover:text-indigo-600 transition-all text-slate-500"
                >
                  <Mail size={18} className="mb-1" />
                  <span className="text-[10px] font-bold uppercase">Email</span>
                </a>
                <a 
                  href={`tel:${supplier.phone}`}
                  data-tooltip={`Call ${supplier.name}`}
                  className="flex flex-col items-center justify-center p-3 bg-slate-50 rounded-2xl hover:bg-emerald-50 hover:text-emerald-600 transition-all text-slate-500"
                >
                  <Phone size={18} className="mb-1" />
                  <span className="text-[10px] font-bold uppercase">Call</span>
                </a>
              </div>
            </div>
          </div>
        ))}

        {filteredSuppliers.length === 0 && (
          <div className="col-span-full py-24 flex flex-col items-center justify-center text-slate-400 bg-white rounded-3xl border border-dashed border-slate-200">
            <Users size={64} className="mb-4 opacity-10" />
            <p className="text-xl font-medium">No suppliers match your search</p>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="mt-4 text-indigo-600 font-bold hover:underline"
            >
              Add your first supplier
            </button>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="bg-white rounded-[2rem] w-full max-w-lg relative z-10 shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-2xl font-bold text-slate-900">Add New Supplier</h3>
                <p className="text-sm text-slate-500">Fill in the details to register a new vendor.</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white rounded-full transition-all"
                data-tooltip="Discard and close"
              >
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Company Name</label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      required 
                      type="text" 
                      placeholder="e.g. Apex Logistics Ltd."
                      className={`${inputClasses} pl-10`}
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Contact Person</label>
                  <div className="relative">
                    <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      required 
                      type="text" 
                      placeholder="e.g. Sarah Jenkins"
                      className={`${inputClasses} pl-10`}
                      value={formData.contactName}
                      onChange={e => setFormData({...formData, contactName: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        required 
                        type="email" 
                        placeholder="contact@apex.com"
                        className={`${inputClasses} pl-10`}
                        value={formData.email}
                        onChange={e => setFormData({...formData, email: e.target.value})}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        required 
                        type="tel" 
                        placeholder="+1 (555) 000-0000"
                        className={`${inputClasses} pl-10`}
                        value={formData.phone}
                        onChange={e => setFormData({...formData, phone: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Business Category</label>
                  <select 
                    className={inputClasses}
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value})}
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="pt-4 flex gap-4">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-4 text-slate-500 font-bold hover:bg-slate-50 rounded-2xl transition-colors border border-transparent hover:border-slate-200"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  data-tooltip="Save supplier to your directory"
                  className="flex-1 py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 shadow-xl shadow-indigo-600/20 transition-all active:scale-95"
                >
                  Save Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Suppliers;
