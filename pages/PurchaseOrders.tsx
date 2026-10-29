import React, { useState, useMemo } from 'react';
import {
  ClipboardList,
  Plus,
  Search,
  X,
  Loader2,
  CheckCircle2,
  Trash2,
  Send,
  PackageCheck,
  Ban,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { TRANSLATIONS } from '../constants/translations';
import { PurchaseOrder, PurchaseOrderStatus, Product, Supplier, Settings } from '../types';
import { useToast } from '../components/ui/Toast';

interface PurchaseOrdersProps {
  orders: PurchaseOrder[];
  products: Product[];
  suppliers: Supplier[];
  onCreate: (supplierId: string | null, notes: string, lines: { product_id: string; quantity_ordered: number; unit_cost: number }[]) => Promise<void>;
  onUpdateStatus: (id: string, status: 'sent' | 'cancelled') => Promise<void>;
  onReceive: (orderId: string, lines: { id: string; quantity: number }[]) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  settings: Settings;
}

type Filter = 'all' | 'open' | 'received' | 'cancelled';

const STATUS_STYLES: Record<PurchaseOrderStatus, string> = {
  draft: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  sent: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-300',
  partial: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-300',
  received: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-300',
  cancelled: 'bg-rose-50 text-rose-500 dark:bg-rose-900/20 dark:text-rose-300',
};

const orderTotal = (o: PurchaseOrder) =>
  o.items.reduce((sum, l) => sum + l.quantity_ordered * (l.unit_cost || 0), 0);

const outstandingTotal = (o: PurchaseOrder) =>
  o.items.reduce((sum, l) => sum + (l.quantity_ordered - l.quantity_received) * (l.unit_cost || 0), 0);

const isOpen = (o: PurchaseOrder) => ['draft', 'sent', 'partial'].includes(o.status);

interface DraftLine {
  product_id: string;
  quantity_ordered: string;
  unit_cost: string;
}

const PurchaseOrders: React.FC<PurchaseOrdersProps> = ({
  orders, products, suppliers, onCreate, onUpdateStatus, onReceive, onDelete, settings
}) => {
  const t = TRANSLATIONS[settings?.language || 'en'] || TRANSLATIONS.en;
  const toast = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [receiveOrder, setReceiveOrder] = useState<PurchaseOrder | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  // Create-order form state.
  const [supplierId, setSupplierId] = useState('');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<DraftLine[]>([{ product_id: '', quantity_ordered: '', unit_cost: '' }]);
  const [creating, setCreating] = useState(false);

  // Receive form state: line id -> arriving quantity.
  const [receipt, setReceipt] = useState<Record<string, string>>({});
  const [receiving, setReceiving] = useState(false);

  const supplierName = (id: string | null) =>
    suppliers.find((s) => s.id === id)?.name || 'No supplier';

  const stats = useMemo(() => {
    const open = orders.filter(isOpen);
    return {
      openCount: open.length,
      outstanding: open.reduce((sum, o) => sum + outstandingTotal(o), 0),
      receivedCount: orders.filter((o) => o.status === 'received').length,
    };
  }, [orders]);

  const filtered = orders.filter((o) => {
    if (filter === 'open' && !isOpen(o)) return false;
    if (filter === 'received' && o.status !== 'received') return false;
    if (filter === 'cancelled' && o.status !== 'cancelled') return false;
    const q = searchTerm.trim().toLowerCase();
    if (!q) return true;
    return (
      supplierName(o.supplier_id).toLowerCase().includes(q) ||
      (o.notes || '').toLowerCase().includes(q) ||
      o.items.some((l) => l.product_name.toLowerCase().includes(q))
    );
  });

  const resetCreateForm = () => {
    setSupplierId('');
    setNotes('');
    setLines([{ product_id: '', quantity_ordered: '', unit_cost: '' }]);
  };

  const pickProduct = (index: number, productId: string) => {
    const product = products.find((p) => p.id === productId);
    setLines((prev) => prev.map((l, i) =>
      i === index
        ? { ...l, product_id: productId, unit_cost: product ? String(product.cost_price || product.price || 0) : l.unit_cost }
        : l
    ));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = lines
      .filter((l) => l.product_id)
      .map((l) => ({
        product_id: l.product_id,
        quantity_ordered: Math.floor(Number(l.quantity_ordered)),
        unit_cost: Number(l.unit_cost),
      }));
    if (parsed.length === 0) {
      toast.error('No order lines', 'Add at least one product line.');
      return;
    }
    const bad = parsed.find((l) => !Number.isInteger(l.quantity_ordered) || l.quantity_ordered < 1 || !(l.unit_cost >= 0));
    if (bad) {
      toast.error('Invalid line', 'Quantities must be whole numbers of 1+, costs must not be negative.');
      return;
    }
    setCreating(true);
    try {
      await onCreate(supplierId || null, notes.trim(), parsed);
      toast.success('Order created', 'Saved as a draft — send it when ready.');
      setIsCreateOpen(false);
      resetCreateForm();
    } catch (err: unknown) {
      toast.error('Could not create order', err instanceof Error ? err.message : undefined);
    } finally {
      setCreating(false);
    }
  };

  const openReceive = (order: PurchaseOrder) => {
    const initial: Record<string, string> = {};
    order.items.forEach((l) => {
      const remaining = l.quantity_ordered - l.quantity_received;
      if (remaining > 0) initial[l.id] = String(remaining);
    });
    setReceipt(initial);
    setReceiveOrder(order);
  };

  const handleReceive = async () => {
    if (!receiveOrder) return;
    const payload = receiveOrder.items
      .map((l) => ({ id: l.id, quantity: Math.floor(Number(receipt[l.id] || 0)), remaining: l.quantity_ordered - l.quantity_received }))
      .filter((l) => l.quantity > 0);
    if (payload.length === 0) {
      toast.error('Nothing to receive', 'Enter an arriving quantity on at least one line.');
      return;
    }
    const over = payload.find((l) => l.quantity > l.remaining);
    if (over) {
      toast.error('Too many units', 'A line cannot receive more than its remaining quantity.');
      return;
    }
    setReceiving(true);
    try {
      await onReceive(receiveOrder.id, payload.map((l) => ({ id: l.id, quantity: l.quantity })));
      toast.success('Stock received', 'Inventory quantities have been updated.');
      setReceiveOrder(null);
    } catch (err: unknown) {
      toast.error('Could not receive', err instanceof Error ? err.message : undefined);
    } finally {
      setReceiving(false);
    }
  };

  const runAction = async (id: string, action: () => Promise<void>, ok: string, okDetail: string, fail: string) => {
    setBusyId(id);
    try {
      await action();
      toast.success(ok, okDetail);
    } catch (err: unknown) {
      toast.error(fail, err instanceof Error ? err.message : undefined);
    } finally {
      setBusyId(null);
    }
  };

  const inputClasses = "w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 font-medium text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-600/20 outline-none transition-all";

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-full px-4 md:px-0 pb-32">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white uppercase tracking-tight">{t.purchase_orders || 'Purchase Orders'}</h2>
          <p className="text-sm text-slate-500">Raise orders to suppliers, receive stock, and reconcile.</p>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl shadow-sm hover:bg-indigo-700 active:scale-95 transition-all font-bold text-sm"
        >
          <Plus size={18} /> New Order
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search supplier, product, or notes..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm placeholder:text-slate-400 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-primary/10 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2 mt-3">
            {(['all', 'open', 'received', 'cancelled'] as Filter[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${filter === f ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-7 bg-slate-900 rounded-2xl p-6 text-white shadow-lg grid grid-cols-3 gap-4 items-center">
          <div>
            <p className="text-2xl font-bold">{stats.openCount}</p>
            <p className="text-xs text-slate-400">Open orders</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{settings.currency}{Math.round(stats.outstanding).toLocaleString()}</p>
            <p className="text-xs text-slate-400">Outstanding value</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{stats.receivedCount}</p>
            <p className="text-xs text-slate-400">Fully received</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {filtered.map((order) => {
            const expanded = expandedId === order.id;
            const receivedQty = order.items.reduce((s, l) => s + l.quantity_received, 0);
            const orderedQty = order.items.reduce((s, l) => s + l.quantity_ordered, 0);
            const progress = orderedQty > 0 ? Math.round((receivedQty / orderedQty) * 100) : 0;
            return (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.99 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.99 }}
                key={order.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden"
              >
                <button
                  onClick={() => setExpandedId(expanded ? null : order.id)}
                  className="w-full p-5 md:p-6 flex items-center gap-4 text-left"
                >
                  <div className="w-12 h-12 bg-indigo-600/10 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                    <ClipboardList size={22} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-slate-900 dark:text-white truncate">{supplierName(order.supplier_id)}</h3>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${STATUS_STYLES[order.status]}`}>
                        {order.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      {new Date(order.created_at).toLocaleDateString()} · {order.items.length} line{order.items.length === 1 ? '' : 's'} · {settings.currency}{Math.round(orderTotal(order)).toLocaleString()}
                    </p>
                    {order.status !== 'draft' && order.status !== 'cancelled' && (
                      <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mt-2.5 overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
                      </div>
                    )}
                  </div>
                  <ChevronDown size={20} className={`text-slate-400 shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                </button>

                {expanded && (
                  <div className="px-5 md:px-6 pb-5 md:pb-6 space-y-4 border-t border-slate-100 dark:border-slate-800 pt-4">
                    {order.notes && <p className="text-sm text-slate-500 dark:text-slate-400">{order.notes}</p>}
                    <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-slate-50 dark:bg-slate-800/50 text-left text-[10px] uppercase tracking-wider text-slate-500">
                            <th className="px-4 py-2.5 font-bold">Product</th>
                            <th className="px-4 py-2.5 font-bold text-right">Ordered</th>
                            <th className="px-4 py-2.5 font-bold text-right">Received</th>
                            <th className="px-4 py-2.5 font-bold text-right">Unit cost</th>
                          </tr>
                        </thead>
                        <tbody>
                          {order.items.map((l) => (
                            <tr key={l.id} className="border-t border-slate-100 dark:border-slate-800">
                              <td className="px-4 py-2.5 font-medium text-slate-900 dark:text-white">{l.product_name}</td>
                              <td className="px-4 py-2.5 text-right text-slate-600 dark:text-slate-300">{l.quantity_ordered}</td>
                              <td className="px-4 py-2.5 text-right text-slate-600 dark:text-slate-300">{l.quantity_received}</td>
                              <td className="px-4 py-2.5 text-right text-slate-600 dark:text-slate-300">{settings.currency}{(l.unit_cost || 0).toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="flex flex-wrap gap-2.5" onClick={(e) => e.stopPropagation()}>
                      {order.status === 'draft' && (
                        <>
                          <button
                            disabled={busyId === order.id}
                            onClick={() => runAction(order.id, () => onUpdateStatus(order.id, 'sent'), 'Order sent', 'The supplier can now fulfill it.', 'Could not send order')}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50"
                          >
                            <Send size={14} /> Send order
                          </button>
                          <button
                            disabled={busyId === order.id}
                            onClick={() => runAction(order.id, () => onDelete(order.id), 'Draft deleted', '', 'Could not delete order')}
                            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 text-rose-500 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold hover:bg-rose-50 transition-all disabled:opacity-50"
                          >
                            <Trash2 size={14} /> Delete draft
                          </button>
                        </>
                      )}
                      {(order.status === 'sent' || order.status === 'partial') && (
                        <>
                          <button
                            onClick={() => openReceive(order)}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 active:scale-95 transition-all"
                          >
                            <PackageCheck size={14} /> Receive stock
                          </button>
                          <button
                            disabled={busyId === order.id}
                            onClick={() => runAction(order.id, () => onUpdateStatus(order.id, 'cancelled'), 'Order cancelled', '', 'Could not cancel order')}
                            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all disabled:opacity-50"
                          >
                            <Ban size={14} /> Cancel
                          </button>
                        </>
                      )}
                      {order.status === 'cancelled' && (
                        <button
                          disabled={busyId === order.id}
                          onClick={() => runAction(order.id, () => onDelete(order.id), 'Order deleted', '', 'Could not delete order')}
                          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 text-rose-500 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold hover:bg-rose-50 transition-all disabled:opacity-50"
                        >
                          <Trash2 size={14} /> Delete
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>

        {filtered.length === 0 && (
          <div className="py-20 flex flex-col items-center justify-center text-center">
            <ClipboardList size={48} className="text-slate-200 mb-4" />
            <p className="text-slate-500 font-medium">No purchase orders here yet</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isCreateOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm no-print">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-800 max-h-[90vh] flex flex-col"
            >
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">New Purchase Order</h3>
                <button onClick={() => setIsCreateOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleCreate} className="p-6 space-y-5 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Supplier</label>
                    <select className={inputClasses} value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
                      <option value="">No supplier</option>
                      {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Notes</label>
                    <input
                      type="text"
                      placeholder="Delivery instructions, reference..."
                      className={inputClasses}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Order lines</label>
                    <button
                      type="button"
                      onClick={() => setLines((prev) => [...prev, { product_id: '', quantity_ordered: '', unit_cost: '' }])}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                    >
                      <Plus size={14} /> Add line
                    </button>
                  </div>
                  {lines.map((line, i) => (
                    <div key={i} className="grid grid-cols-12 gap-2 items-center">
                      <select
                        className={`${inputClasses} col-span-6`}
                        value={line.product_id}
                        onChange={(e) => pickProduct(i, e.target.value)}
                      >
                        <option value="">Select product…</option>
                        {products
                          .filter((p) => !lines.some((l, li) => li !== i && l.product_id === p.id))
                          .map((p) => <option key={p.id} value={p.id}>{p.name} (stock {p.quantity})</option>)}
                      </select>
                      <input
                        type="number"
                        min={1}
                        step={1}
                        placeholder="Qty"
                        className={`${inputClasses} col-span-2`}
                        value={line.quantity_ordered}
                        onChange={(e) => setLines((prev) => prev.map((l, li) => li === i ? { ...l, quantity_ordered: e.target.value } : l))}
                      />
                      <input
                        type="number"
                        min={0}
                        step="any"
                        placeholder="Cost"
                        className={`${inputClasses} col-span-3`}
                        value={line.unit_cost}
                        onChange={(e) => setLines((prev) => prev.map((l, li) => li === i ? { ...l, unit_cost: e.target.value } : l))}
                      />
                      <button
                        type="button"
                        onClick={() => setLines((prev) => prev.filter((_, li) => li !== i))}
                        disabled={lines.length === 1}
                        className="col-span-1 p-2.5 text-slate-400 hover:text-rose-500 transition-colors disabled:opacity-30"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="pt-2 flex gap-4">
                  <button
                    type="button"
                    onClick={() => setIsCreateOpen(false)}
                    className="flex-1 py-3 text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="flex-[2] py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-600/20 hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  >
                    {creating ? (<><Loader2 size={18} className="animate-spin" /> Saving...</>) : (<><CheckCircle2 size={18} /> Create draft</>)}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {receiveOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm no-print">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-800 max-h-[90vh] flex flex-col"
            >
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Receive Stock</h3>
                  <p className="text-sm text-slate-500 mt-0.5">Enter arrived quantities — partial receipts are fine.</p>
                </div>
                <button onClick={() => setReceiveOrder(null)} className="text-slate-400 hover:text-slate-600 transition-colors">
                  <X size={24} />
                </button>
              </div>

              <div className="p-6 space-y-3 overflow-y-auto">
                {receiveOrder.items.map((l) => {
                  const remaining = l.quantity_ordered - l.quantity_received;
                  return (
                    <div key={l.id} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{l.product_name}</p>
                        <p className="text-xs text-slate-400">{l.quantity_received} of {l.quantity_ordered} received</p>
                      </div>
                      <input
                        type="number"
                        min={0}
                        max={remaining}
                        step={1}
                        disabled={remaining <= 0}
                        placeholder="0"
                        className={`${inputClasses} !w-24 text-center`}
                        value={receipt[l.id] || ''}
                        onChange={(e) => setReceipt((prev) => ({ ...prev, [l.id]: e.target.value }))}
                      />
                    </div>
                  );
                })}

                <button
                  onClick={handleReceive}
                  disabled={receiving}
                  className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-emerald-600/20 hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {receiving ? (<><Loader2 size={18} className="animate-spin" /> Receiving...</>) : (<><PackageCheck size={18} /> Confirm receipt</>)}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PurchaseOrders;
