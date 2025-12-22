
import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, 
  Building, 
  Tag, 
  Plus, 
  X, 
  Save, 
  Bell, 
  Mail, 
  CreditCard, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  ChevronRight,
  Copy,
  ExternalLink
} from 'lucide-react';
import { Settings as SettingsType, User } from '../types';
import { useStore } from '../store';

interface SettingsProps {
  settings: SettingsType;
  onUpdate: (updates: Partial<SettingsType>) => void;
  onAddCategory: (cat: string) => void;
}

const Settings: React.FC<SettingsProps> = ({ settings, onUpdate, onAddCategory }) => {
  const store = useStore();
  const [newCat, setNewCat] = useState('');
  const [companyName, setCompanyName] = useState(settings.companyName);
  const [notifEmail, setNotifEmail] = useState(settings.notificationEmail);
  const [showBillingModal, setShowBillingModal] = useState(false);

  const user = store.currentUser;

  const handleSaveProfile = () => {
    onUpdate({ companyName, notificationEmail: notifEmail });
  };

  const handleAddCat = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCat.trim()) {
      onAddCategory(newCat.trim());
      setNewCat('');
    }
  };

  const getSubscriptionInfo = () => {
    if (!user) return null;
    if (user.role === 'admin') return { plan: 'System Admin', status: 'Life-time', color: 'text-indigo-600 bg-indigo-50' };
    
    if (user.isSubscribed) {
      return { 
        plan: user.subscriptionExpiry ? 'Annual Enterprise' : 'Monthly Basic', 
        status: 'Active', 
        expiry: user.subscriptionExpiry || 'Renewed Monthly',
        color: 'text-emerald-600 bg-emerald-50' 
      };
    }

    const start = new Date(user.trialStartDate);
    const now = new Date();
    const expiry = new Date(start);
    expiry.setMonth(expiry.getMonth() + 2);
    
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return { 
      plan: 'Free Trial', 
      status: diffDays > 0 ? `${diffDays} days left` : 'Expired', 
      expiry: expiry.toLocaleDateString(),
      color: diffDays > 7 ? 'text-amber-600 bg-amber-50' : 'text-rose-600 bg-rose-50'
    };
  };

  const subInfo = getSubscriptionInfo();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <header>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          System Settings <SettingsIcon className="text-slate-400" />
        </h1>
        <p className="text-slate-500">Configure your system preferences and business profile.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Company Profile */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
            <Building size={20} className="text-indigo-600" /> Company Profile
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Company Name</label>
              <input 
                type="text" 
                data-tooltip="Displayed on dashboard and receipts"
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
                value={companyName}
                onChange={e => setCompanyName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Currency Symbol</label>
              <select 
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
                value={settings.currency}
                data-tooltip="The currency symbol used across the application"
                onChange={e => onUpdate({ currency: e.target.value })}
              >
                <option value="$">USD ($)</option>
                <option value="£">GBP (£)</option>
                <option value="€">EUR (€)</option>
                <option value="₦">NGN (₦)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Subscription & Billing Section */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <CreditCard size={20} className="text-indigo-600" /> Subscription & Billing
            </h2>
            {subInfo && (
              <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-tighter ${subInfo.color}`}>
                {subInfo.plan}
              </span>
            )}
          </div>
          
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 mb-6 space-y-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500">Account Status</span>
              <span className="font-bold text-slate-900 flex items-center gap-1.5">
                {subInfo?.status === 'Active' || subInfo?.status === 'Life-time' ? (
                  <CheckCircle2 size={16} className="text-emerald-500" />
                ) : (
                  <Clock size={16} className="text-amber-500" />
                )}
                {subInfo?.status}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500">Renewal / Expiry Date</span>
              <span className="font-bold text-slate-900">{subInfo?.expiry || 'N/A'}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500">Payment Status</span>
              <span className="font-bold text-indigo-600">{user?.isSubscribed ? 'Verified' : 'Pending Upgrade'}</span>
            </div>
          </div>

          <button 
            onClick={() => setShowBillingModal(true)}
            className="mt-auto w-full py-3 bg-slate-900 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-800 transition-all"
          >
            Upgrade or Manage Plan <ChevronRight size={16} />
          </button>
        </div>

        {/* Notification Settings */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
            <Bell size={20} className="text-indigo-600" /> Notification Settings
          </h2>
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-3">
                <Mail className="text-slate-400" size={20} />
                <div>
                  <p className="text-sm font-bold text-slate-900">Email Alerts</p>
                  <p className="text-xs text-slate-500">Send notifications for low stock events</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer" data-tooltip="Enable or disable email notifications">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={settings.lowStockEmailAlerts}
                  onChange={() => onUpdate({ lowStockEmailAlerts: !settings.lowStockEmailAlerts })}
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Alert Email Address</label>
              <input 
                type="email" 
                placeholder="alerts@company.com"
                data-tooltip="Destination address for automated stock alerts"
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
                value={notifEmail}
                onChange={e => setNotifEmail(e.target.value)}
              />
              <p className="text-[10px] text-slate-400 mt-1">Leave empty to use your account email.</p>
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
            <Tag size={20} className="text-indigo-600" /> Category Management
          </h2>
          
          <form onSubmit={handleAddCat} className="flex gap-2 mb-6">
            <input 
              type="text" 
              placeholder="Add new category..."
              data-tooltip="Enter a unique category name"
              className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
              value={newCat}
              onChange={e => setNewCat(e.target.value)}
            />
            <button type="submit" className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700" data-tooltip="Add new category tag">
              <Plus size={20} />
            </button>
          </form>

          <div className="flex flex-wrap gap-2 max-h-[150px] overflow-y-auto">
            {settings.categories.map(cat => (
              <span key={cat} className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-600 rounded-xl text-sm font-medium">
                {cat}
                <button 
                  onClick={() => onUpdate({ categories: settings.categories.filter(c => c !== cat) })}
                  className="text-slate-400 hover:text-rose-500"
                  data-tooltip={`Remove ${cat} category`}
                >
                  <X size={14} />
                </button>
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <button 
          onClick={handleSaveProfile}
          data-tooltip="Commit all configuration changes to memory"
          className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 flex items-center gap-2"
        >
          <Save size={18} /> Save All Changes
        </button>
      </div>

      {/* Billing Modal */}
      {showBillingModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 relative">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <CreditCard className="text-indigo-600" /> Billing Center
              </h3>
              <button onClick={() => setShowBillingModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="bg-indigo-600 rounded-2xl p-6 text-white shadow-xl shadow-indigo-600/20">
                <p className="text-xs font-bold uppercase tracking-widest opacity-80 mb-1">Current Plan</p>
                <h4 className="text-2xl font-black mb-4">{subInfo?.plan}</h4>
                <div className="flex items-center gap-2 text-sm bg-white/10 px-3 py-1.5 rounded-lg w-fit">
                   <Clock size={16} /> {subInfo?.status}
                </div>
              </div>

              <div className="space-y-4">
                <h5 className="font-bold text-slate-900 flex items-center gap-2">
                  <AlertCircle size={18} className="text-amber-500" /> Nigerian Bank Transfer
                </h5>
                <div className="bg-slate-50 p-5 rounded-2xl space-y-3 border border-slate-100">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500 uppercase font-bold">Bank Name</span>
                    <span className="text-slate-900 font-bold">Opay Digital Bank</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 uppercase font-bold">Account No.</span>
                    <div className="flex items-center gap-2">
                      <span className="text-indigo-600 font-black text-lg">7010698264</span>
                      <button onClick={() => copyToClipboard('7010698264')} className="p-1 hover:text-indigo-600">
                        <Copy size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500 uppercase font-bold">Account Name</span>
                    <span className="text-slate-900 font-bold">Prince Dagogo EKine</span>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                   <a 
                    href="https://wa.me/2347072127949" 
                    target="_blank"
                    className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
                   >
                     <ExternalLink size={16} /> Send Proof via WhatsApp
                   </a>
                   <p className="text-[10px] text-center text-slate-400 italic">
                     * Activation usually occurs within 1-2 hours after verification.
                   </p>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
              <button 
                onClick={() => setShowBillingModal(false)}
                className="text-slate-500 font-bold text-sm hover:text-slate-900"
              >
                Close Billing Center
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
