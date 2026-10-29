import React, { useState, useMemo } from 'react';
import {
  Users,
  Plus,
  Search,
  Mail,
  Phone,
  Edit2,
  Trash2,
  X,
  Loader2,
  CheckCircle2,
  Download,
  Upload,
  ShoppingBag,
  StickyNote
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { TRANSLATIONS } from '../constants/translations';
import { Customer, Sale, Settings } from '../types';
import { downloadCsv } from '../lib/csv';
import CsvImportModal, { ImportColumn } from '../components/CsvImportModal';

interface CustomersProps {
  customers: Customer[];
  sales: Sale[];
  onAdd: (customer: Omit<Customer, 'id' | 'user_id' | 'created_at'>) => void;
  onUpdate: (id: string, updates: Partial<Customer>) => void;
  onDelete: (id: string) => void;
  onImport: (rows: Omit<Customer, 'id' | 'user_id' | 'created_at'>[]) => Promise<number>;
  settings: Settings;
}

const normalizeName = (name: string) => name.trim().toLowerCase();

const CUSTOMER_COLUMNS: ImportColumn[] = [
  { key: 'name', label: 'name', required: true },
  { key: 'phone', label: 'phone' },
  { key: 'email', label: 'email' },
  { key: 'notes', label: 'notes' },
];

const Customers: React.FC<CustomersProps> = ({ customers, sales, onAdd, onUpdate, onDelete, onImport, settings }) => {
  const t = TRANSLATIONS[settings?.language || 'en'] || TRANSLATIONS.en;
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', notes: '' });

  // Purchase history per customer, matched by name against recorded sales.
  const purchaseStats = useMemo(() => {
    const byName = new Map<string, { count: number; total: number }>();
    for (const s of sales) {
      const key = normalizeName(s.customer_name || '');
      if (!key || key === 'walk-in' || key === 'walk-in guest') continue;
      const entry = byName.get(key) || { count: 0, total: 0 };
      entry.count += 1;
      entry.total += s.total_price || 0;
      byName.set(key, entry);
    }
    return byName;
  }, [sales]);

  const stats = useMemo(() => {
    let repeat = 0;
    let recordedRevenue = 0;
    for (const c of customers) {
      const s = purchaseStats.get(normalizeName(c.name));
      if (s) {
        if (s.count > 1) repeat += 1;
        recordedRevenue += s.total;
      }
    }
    return { total: customers.length, repeat, recordedRevenue };
  }, [customers, purchaseStats]);

  const filteredCustomers = customers.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.phone || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openAdd = () => {
    setEditing(null);
    setFormData({ name: '', phone: '', email: '', notes: '' });
    setIsModalOpen(true);
  };

  const openEdit = (customer: Customer) => {
    setEditing(customer);
    setFormData({ name: customer.name, phone: customer.phone || '', email: customer.email || '', notes: customer.notes || '' });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    setIsSaving(true);
    try {
      if (editing) {
        await onUpdate(editing.id, { ...formData, name: formData.name.trim() });
      } else {
        await onAdd({ ...formData, name: formData.name.trim() });
      }
      setIsModalOpen(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleExport = () => {
    downloadCsv(`stockbit_customers_${new Date().toISOString().split('T')[0]}.csv`, [
      ['name', 'phone', 'email', 'notes', 'purchases', 'total_spent'],
      ...customers.map((c) => {
        const s = purchaseStats.get(normalizeName(c.name));
        return [c.name, c.phone || '', c.email || '', c.notes || '', s?.count || 0, s?.total || 0];
      }),
    ]);
  };

  const skipExisting = (row: Record<string, unknown>): string | null => {
    const name = normalizeName(String(row.name || ''));
    const phone = String(row.phone || '').trim();
    const dup = customers.some((c) => normalizeName(c.name) === name && (c.phone || '').trim() === phone);
    return dup ? 'customer already exists' : null;
  };

  const inputClasses = "w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 font-medium text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-600/20 outline-none transition-all";

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-full px-4 md:px-0 pb-32">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white uppercase tracking-tight">{t.customers || 'Customers'}</h2>
          <p className="text-sm text-slate-500">Customer records, purchase history, and repeat-buyer tracking.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setIsImportOpen(true)}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:bg-slate-50 active:scale-95 transition-all font-bold text-sm"
          >
            <Upload size={18} /> Import CSV
          </button>
          <button
            onClick={handleExport}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:bg-slate-50 active:scale-95 transition-all font-bold text-sm"
          >
            <Download size={18} /> Export CSV
          </button>
          <button
            onClick={openAdd}
            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl shadow-sm hover:bg-indigo-700 active:scale-95 transition-all font-bold text-sm"
          >
            <Plus size={18} /> Add Customer
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search by name, phone, or email..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm placeholder:text-slate-400 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-primary/10 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="lg:col-span-4 bg-slate-900 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <Users size={20} className="text-indigo-400" />
            <h3 className="text-lg font-bold">{stats.total} Customers</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-2xl font-bold">{stats.repeat}</p>
              <p className="text-xs text-slate-400">Repeat buyers</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{settings.currency}{Math.round(stats.recordedRevenue).toLocaleString()}</p>
              <p className="text-xs text-slate-400">Recorded revenue</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredCustomers.map((customer) => {
            const s = purchaseStats.get(normalizeName(customer.name));
            return (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                key={customer.id}
                className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm group hover:border-indigo-600/30 transition-all flex flex-col"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="w-12 h-12 bg-indigo-600/10 text-indigo-600 rounded-xl flex items-center justify-center font-bold text-xl">
                    {(customer.name || '?').charAt(0).toUpperCase()}
                  </div>

                  <div className="flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(customer)} className="p-2 text-slate-400 hover:text-indigo-600 rounded-lg transition-colors">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => onDelete(customer.id)} className="p-2 text-slate-400 hover:text-rose-500 rounded-lg transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="mb-4">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">{customer.name}</h3>
                  {(s?.count || 0) > 0 && (
                    <p className="text-xs font-bold text-emerald-600 mt-1 flex items-center gap-1.5">
                      <ShoppingBag size={12} /> {s!.count} purchase{s!.count === 1 ? '' : 's'} · {settings.currency}{(s!.total || 0).toLocaleString()}
                    </p>
                  )}
                </div>

                <div className="space-y-2 flex-1">
                  {customer.phone && (
                    <a href={`tel:${customer.phone}`} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-indigo-600 transition-colors">
                      <Phone size={16} className="text-slate-400 shrink-0" />
                      <span className="truncate">{customer.phone}</span>
                    </a>
                  )}
                  {customer.email && (
                    <a href={`mailto:${customer.email}`} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-indigo-600 transition-colors">
                      <Mail size={16} className="text-slate-400 shrink-0" />
                      <span className="truncate">{customer.email}</span>
                    </a>
                  )}
                  {customer.notes && (
                    <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-sm text-slate-500 dark:text-slate-400">
                      <StickyNote size={16} className="text-slate-400 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{customer.notes}</span>
                    </div>
                  )}
                  {!customer.phone && !customer.email && !customer.notes && (
                    <p className="text-xs text-slate-400 px-1">No contact details yet — edit to add some.</p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {filteredCustomers.length === 0 && (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-center">
            <Users size={48} className="text-slate-200 mb-4" />
            <p className="text-slate-500 font-medium">No customers match your current search parameters</p>
          </div>
        )}
      </div>

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
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">{editing ? 'Edit Customer' : 'Add Customer'}</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Full Name</label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. Adaeze Okafor"
                      className={inputClasses}
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Phone</label>
                      <input
                        type="tel"
                        placeholder="0701 234 5678"
                        className={inputClasses}
                        value={formData.phone}
                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Email</label>
                      <input
                        type="email"
                        placeholder="customer@example.com"
                        className={inputClasses}
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Notes</label>
                    <textarea
                      rows={3}
                      placeholder="Preferences, delivery notes, credit terms..."
                      className={`${inputClasses} resize-none`}
                      value={formData.notes}
                      onChange={e => setFormData({ ...formData, notes: e.target.value })}
                    />
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
                      <><CheckCircle2 size={18} /> {editing ? 'Save Changes' : 'Add Customer'}</>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {isImportOpen && (
        <CsvImportModal
          title="Import Customers"
          description="Upload a CSV with customer records. Rows matching an existing name and phone are skipped."
          templateFilename="stockbit_customers_template.csv"
          columns={CUSTOMER_COLUMNS}
          skipCheck={skipExisting}
          onImport={async (rows) => onImport(rows as unknown as Omit<Customer, 'id' | 'user_id' | 'created_at'>[])}
          onClose={() => setIsImportOpen(false)}
        />
      )}
    </div>
  );
};

export default Customers;
