
import React, { useState, useEffect } from 'react';
import { 
  Building, 
  Save, 
  Users, 
  CreditCard, 
  Trash2, 
  Zap, 
  Settings as SettingsIcon,
  ShoppingBag,
  ShieldCheck,
  Sun,
  Moon,
  BellRing,
  Mail,
  CheckCircle2,
  Plus,
  Rocket,
  Star,
  Globe,
  MessageCircle,
  Layout,
  Copy,
  Share2,
  ChevronRight,
  Loader2,
  Key
} from 'lucide-react';
import { Settings as SettingsType, User, SubscriptionPlan } from '../types';

interface SettingsProps {
  settings: SettingsType;
  onUpdate: (updates: Partial<SettingsType>) => void;
  staff: User[];
  currentUser: User | null;
  onAddStaff: (data: any) => Promise<void>;
  onRemoveStaff: (id: string) => Promise<void>;
  onActivateSubscription: (plan: SubscriptionPlan, cycle: 'monthly' | 'annual') => Promise<void>;
}

const Settings: React.FC<SettingsProps> = ({ settings, onUpdate, staff, currentUser, onAddStaff, onRemoveStaff, onActivateSubscription }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'market' | 'staff' | 'billing'>('profile');
  const [companyName, setCompanyName] = useState(settings.companyName);
  const [notificationEmail, setNotificationEmail] = useState(settings.notificationEmail);
  const [lowStockAlerts, setLowStockAlerts] = useState(settings.lowStockEmailAlerts);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isAddingStaff, setIsAddingStaff] = useState(false);
  const [staffFormData, setStaffFormData] = useState({ name: '', email: '', password: '' });
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  useEffect(() => {
    if (settings) {
      setCompanyName(settings.companyName);
      setNotificationEmail(settings.notificationEmail);
      setLowStockAlerts(settings.lowStockEmailAlerts);
    }
  }, [settings]);

  const handleApplyChanges = async () => {
    setIsSaving(true);
    try {
      await onUpdate({ 
        companyName, 
        notificationEmail, 
        lowStockEmailAlerts: lowStockAlerts
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error("Settings update failed", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePaystackActivation = (plan: SubscriptionPlan, cycle: 'monthly' | 'annual') => {
    if (!settings.paystackPublicKey) {
      alert("CRITICAL: Payment gateway not configured by system administrator.");
      return;
    }

    const prices: Record<SubscriptionPlan, { monthly: number; annual: number }> = {
      beta: { monthly: 5000, annual: 50000 },
      mega: { monthly: 7999, annual: 80000 },
      mega_pro: { monthly: 12999, annual: 128000 }
    };

    const amount = cycle === 'monthly' ? prices[plan].monthly : prices[plan].annual;

    const handler = (window as any).PaystackPop.setup({
      key: settings.paystackPublicKey,
      email: currentUser?.email || 'billing@stockbit.pro',
      amount: amount * 100, 
      currency: "NGN",
      callback: () => onActivateSubscription(plan, cycle),
      onClose: () => console.log("Payment window closed.")
    });
    handler.openIframe();
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onAddStaff(staffFormData);
      setStaffFormData({ name: '', email: '', password: '' });
      setIsAddingStaff(false);
    } catch (error: any) {
      alert(error.message || "Failed to add staff.");
    } finally {
      setIsSaving(false);
    }
  };

  const copyInviteId = () => {
    if (currentUser?.id) {
      navigator.clipboard.writeText(currentUser.id);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Org', icon: Building },
    { id: 'market', label: 'Sales', icon: ShoppingBag },
    { id: 'staff', label: 'Staff', icon: Users },
    { id: 'billing', label: 'Plan', icon: CreditCard }
  ];

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-700 max-w-5xl no-print mx-auto px-2 md:px-4">
      <header>
        <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase flex items-center gap-3">
          Business Settings <SettingsIcon className="text-indigo-600" size={24} />
        </h1>
        <p className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-[9px] md:text-[10px] mt-1">Operational Protocol Management</p>
      </header>

      <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl md:rounded-[2rem] border border-slate-200 dark:border-slate-800 overflow-x-auto scrollbar-hide shadow-sm sticky top-20 z-20 backdrop-blur-md">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 flex items-center justify-center gap-2 px-3 md:px-8 py-3 rounded-xl md:rounded-[1.5rem] text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <tab.icon size={14} className="md:w-4 md:h-4" /> <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="pb-10">
        {activeTab === 'profile' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="lg:col-span-7 space-y-6 md:space-y-8">
              <div className="bg-white dark:bg-slate-900 p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-8">
                <section className="space-y-6">
                  <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block border-b border-slate-50 dark:border-slate-800 pb-4 flex items-center gap-2">General Configuration</h3>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase ml-1 block tracking-widest">Business Name</label>
                      <input className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl font-bold text-sm dark:text-white focus:ring-2 focus:ring-indigo-600 outline-none transition-all" value={companyName} onChange={e => setCompanyName(e.target.value)} />
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1 block tracking-widest">Currency Symbol</label>
                        <select className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl font-bold text-sm dark:text-white focus:ring-2 focus:ring-indigo-600 outline-none transition-all cursor-pointer" value={settings.currency} onChange={e => onUpdate({ currency: e.target.value })}>
                          <option value="₦">Naira (₦)</option>
                          <option value="$">US Dollar ($)</option>
                          <option value="£">Pounds (£)</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1 block tracking-widest">UI Mode</label>
                        <div className="flex bg-slate-50 dark:bg-slate-800 p-1 rounded-2xl h-[52px]">
                          <button onClick={() => onUpdate({ theme: 'light' })} className={`flex-1 rounded-xl flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-widest transition-all ${settings.theme === 'light' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}><Sun size={14}/> Light</button>
                          <button onClick={() => onUpdate({ theme: 'dark' })} className={`flex-1 rounded-xl flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-widest transition-all ${settings.theme === 'dark' ? 'bg-slate-700 shadow-sm text-indigo-400' : 'text-slate-400'}`}><Moon size={14}/> Dark</button>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="space-y-6 pt-6 md:pt-8 border-t border-slate-50 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Risk Alerts</h3>
                      <p className="text-[8px] text-slate-400 font-bold uppercase mt-0.5">Automated low stock emails</p>
                    </div>
                    <button onClick={() => setLowStockAlerts(!lowStockAlerts)} className={`w-12 h-6 md:w-14 md:h-7 rounded-full transition-all duration-300 relative shadow-inner ${lowStockAlerts ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'}`}>
                      <div className={`absolute top-1 w-4 h-4 md:w-5 md:h-5 bg-white rounded-full transition-all duration-300 shadow-md ${lowStockAlerts ? 'left-7 md:left-8' : 'left-1'}`} />
                    </button>
                  </div>
                  
                  {lowStockAlerts && (
                    <div className="mt-4 animate-in slide-in-from-top-4 duration-500 ease-out space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase ml-1 block tracking-widest">Destination Email</label>
                      <div className="relative group">
                        <div className="absolute left-6 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                           <Mail size={18} />
                        </div>
                        <input 
                          type="email" 
                          placeholder="alerts@business.com" 
                          className="w-full pl-20 pr-5 py-5 bg-slate-50 dark:bg-slate-900/50 border-2 border-transparent dark:border-slate-800 rounded-3xl font-bold text-sm dark:text-white focus:ring-4 focus:ring-indigo-600/20 focus:border-indigo-600 outline-none transition-all" 
                          value={notificationEmail} 
                          onChange={e => setNotificationEmail(e.target.value)} 
                        />
                      </div>
                    </div>
                  )}
                </section>

                <button onClick={handleApplyChanges} disabled={isSaving} className={`w-full py-5 rounded-3xl font-black uppercase text-[10px] md:text-[11px] tracking-widest transition-all flex items-center justify-center gap-3 shadow-xl active:scale-95 disabled:opacity-50 ${saveSuccess ? 'bg-emerald-600 text-white' : 'bg-indigo-600 text-white shadow-indigo-600/20'}`}>
                  {saveSuccess ? <><CheckCircle2 size={18} /> Protocol Updated</> : <>{isSaving ? <Loader2 size={18} className="animate-spin"/> : <Save size={18} />} {isSaving ? 'Synchronizing...' : 'Save All Changes'}</>}
                </button>
              </div>
            </div>
            
            <div className="lg:col-span-5 bg-slate-900 rounded-[2rem] md:rounded-[3rem] p-8 md:p-12 text-white flex flex-col justify-between relative overflow-hidden shadow-2xl min-h-[300px]">
              <div className="relative z-10">
                <ShieldCheck size={40} className="text-indigo-400 mb-8" />
                <h3 className="text-xl md:text-2xl font-black uppercase tracking-tighter mb-4 leading-tight">Sync Integrity</h3>
                <p className="text-slate-400 text-xs md:text-sm font-medium leading-relaxed">Your operational data is encrypted end-to-end. Settings changes here propagate instantly to all staff terminals globally.</p>
              </div>
              <div className="mt-8 pt-8 border-t border-slate-800 relative z-10 flex justify-between items-center text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                  <span>Cloud Replication</span>
                  <span className="text-emerald-400 flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"/> Active</span>
              </div>
              <div className="absolute -bottom-10 -right-10 opacity-5">
                <ShieldCheck size={240} />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'market' && (
          <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
             <div className="bg-white dark:bg-slate-900 p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm">
                <h2 className="text-lg md:text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-4">Multi-Channel Bridge</h2>
                <p className="text-[11px] md:text-xs text-slate-500 font-medium mb-10 leading-relaxed">Connect to Nigeria's largest e-commerce platforms. Orders on these platforms will automatically deduct from your main warehouse inventory.</p>
                
                <div className="space-y-4">
                  <ChannelToggle label="Jumia Mall" desc="Real-time seller portal sync" icon={<Globe size={18} />} active={settings.marketplaces.jumia} onChange={() => onUpdate({ marketplaces: { ...settings.marketplaces, jumia: !settings.marketplaces.jumia }})} />
                  <ChannelToggle label="Konga Bridge" desc="Daily logistics ledger export" icon={<ShoppingBag size={18} />} active={settings.marketplaces.konga} onChange={() => onUpdate({ marketplaces: { ...settings.marketplaces, konga: !settings.marketplaces.konga }})} />
                  <ChannelToggle label="WhatsApp" desc="Direct catalog broadcast" icon={<MessageCircle size={18} />} active={settings.marketplaces.whatsapp} onChange={() => onUpdate({ marketplaces: { ...settings.marketplaces, whatsapp: !settings.marketplaces.whatsapp }})} />
                </div>
             </div>
          </div>
        )}

        {activeTab === 'staff' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
             <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
                <div className="relative z-10">
                   <div className="flex items-center gap-3 mb-4">
                      <Share2 size={24} className="text-indigo-200" />
                      <h3 className="text-lg md:text-xl font-black uppercase tracking-tighter">Business Invite ID</h3>
                   </div>
                   <p className="text-indigo-100 text-[10px] md:text-[11px] font-medium leading-relaxed mb-8 max-w-sm">Use this ID to link employees. When registering, they should enter this code to join your business terminal.</p>
                   
                   <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                      <div className="flex-1 bg-white/10 backdrop-blur-md rounded-2xl px-5 py-4 font-mono text-sm font-bold border border-white/20 truncate">
                         {currentUser?.id || 'PROVISIONING...'}
                      </div>
                      <button onClick={copyInviteId} className={`py-4 px-6 rounded-2xl transition-all flex items-center justify-center gap-2 ${copyFeedback ? 'bg-emerald-50 text-emerald-600' : 'bg-white text-indigo-600 shadow-lg active:scale-95'}`}>
                         {copyFeedback ? <CheckCircle2 size={18} /> : <Copy size={18} />}
                         <span className="text-[10px] font-black uppercase tracking-widest">{copyFeedback ? 'Copied' : 'Copy ID'}</span>
                      </button>
                   </div>
                </div>
                <Users className="absolute -bottom-10 -right-10 text-white/5 w-64 h-64" />
             </div>

             <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4">
                <div>
                   <h2 className="text-lg md:text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Staff Directory</h2>
                   <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Active personnel terminals</p>
                </div>
                <button onClick={() => setIsAddingStaff(true)} className="w-full sm:w-auto px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl flex items-center justify-center gap-3 font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-all"><Plus size={18} /> Add Member</button>
             </div>

             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                {staff.filter(u => u.role === 'staff' && u.parentId === currentUser?.id).map(member => (
                   <div key={member.id} className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between group hover:border-indigo-100 dark:hover:border-indigo-900 transition-all">
                      <div className="flex items-center gap-4 min-w-0">
                         <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black text-xs shrink-0">{member.name.charAt(0)}</div>
                         <div className="min-w-0">
                            <p className="text-sm font-black text-slate-900 dark:text-white uppercase truncate">{member.name}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase truncate">{member.email}</p>
                         </div>
                      </div>
                      <button onClick={() => onRemoveStaff(member.id)} className="p-2.5 text-slate-300 hover:text-rose-500 sm:opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={16} /></button>
                   </div>
                ))}
                {staff.filter(u => u.role === 'staff' && u.parentId === currentUser?.id).length === 0 && (
                   <div className="col-span-full py-16 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700 text-center">
                      <Users size={40} className="mx-auto text-slate-200 mb-4" />
                      <p className="text-slate-400 font-black uppercase text-[9px] tracking-widest">No active staff linked</p>
                   </div>
                )}
             </div>

             {isAddingStaff && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl">
                   <div className="bg-white dark:bg-slate-900 rounded-t-[2.5rem] sm:rounded-[3rem] w-full max-md:p-8 p-10 shadow-2xl animate-in slide-in-from-bottom-10 sm:zoom-in-95">
                      <h3 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-8">Deploy Account</h3>
                      <form onSubmit={handleAddStaff} className="space-y-4">
                         <div className="space-y-2">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                            <input required className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl font-bold dark:text-white" value={staffFormData.name} onChange={e => setStaffFormData({...staffFormData, name: e.target.value})} />
                         </div>
                         <div className="space-y-2">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Work Email</label>
                            <input type="email" required className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl font-bold dark:text-white" value={staffFormData.email} onChange={e => setStaffFormData({...staffFormData, email: e.target.value})} />
                         </div>
                         <div className="space-y-2">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Temporary Password</label>
                            <input type="password" required className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl font-bold dark:text-white" value={staffFormData.password} onChange={e => setStaffFormData({...staffFormData, password: e.target.value})} />
                         </div>
                         <div className="pt-6 flex flex-col sm:flex-row gap-3">
                            <button type="button" onClick={() => setIsAddingStaff(false)} className="flex-1 py-4 text-slate-400 font-black uppercase text-[10px]">Discard</button>
                            <button type="submit" disabled={isSaving} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] shadow-xl shadow-indigo-600/20">{isSaving ? 'Processing...' : 'Link Account'}</button>
                         </div>
                      </form>
                   </div>
                </div>
             )}
          </div>
        )}

        {activeTab === 'billing' && (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-300">
             <div className="flex justify-center mb-6 md:mb-10">
                <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl flex w-full max-w-[320px]">
                  <button onClick={() => setBillingCycle('monthly')} className={`flex-1 px-4 py-2.5 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all ${billingCycle === 'monthly' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-400'}`}>Monthly</button>
                  <button onClick={() => setBillingCycle('annual')} className={`flex-1 px-4 py-2.5 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all ${billingCycle === 'annual' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-400'}`}>Annual (-15%)</button>
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                <PlanCard 
                   title="StockBit Beta" 
                   price={billingCycle === 'monthly' ? "₦5,000/mo" : "₦50,000/yr"}
                   desc="Entry-level protocol for small kiosks."
                   active={currentUser?.plan === 'beta'}
                   features={['3 Staff Terminals', 'Cloud Inventory', 'Sales History', 'Barcode Support']}
                   onSelect={() => handlePaystackActivation('beta', billingCycle)}
                   icon={<Layout size={20} />}
                />
                <PlanCard 
                   title="StockBit Mega" 
                   price={billingCycle === 'monthly' ? "₦7,999/mo" : "₦80,000/yr"}
                   desc="The professional standard for growing retail."
                   active={currentUser?.plan === 'mega'}
                   features={['8 Staff Terminals', 'Advanced Reports', 'Marketplace Sync', 'AI Insights']}
                   onSelect={() => handlePaystackActivation('mega', billingCycle)}
                   icon={<Rocket size={20} />}
                />
                <PlanCard 
                   title="Mega Pro" 
                   price={billingCycle === 'monthly' ? "₦12,999/mo" : "₦128,000/yr"}
                   desc="Enterprise industrial solution for logistics."
                   active={currentUser?.plan === 'mega_pro'}
                   features={['Unlimited Terminals', 'Gemini Pro Audit', 'Sustainability Hub', 'Dedicated Support']}
                   onSelect={() => handlePaystackActivation('mega_pro', billingCycle)}
                   icon={<Star size={20} />}
                />
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

const ChannelToggle = ({ label, desc, icon, active, onChange }: any) => (
  <div className="flex items-center justify-between p-4 md:p-5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl md:rounded-3xl border border-slate-100 dark:border-slate-800">
    <div className="flex items-center gap-4 min-w-0">
      <div className="w-10 h-10 bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center shadow-sm shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-[10px] md:text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-widest truncate">{label}</p>
        <p className="text-[8px] md:text-[9px] text-slate-400 font-bold uppercase truncate">{desc}</p>
      </div>
    </div>
    <button onClick={onChange} className={`w-10 h-5 md:w-12 md:h-6 rounded-full transition-all relative shrink-0 ${active ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'}`}>
       <div className={`absolute top-0.5 md:top-1 w-4 h-4 bg-white rounded-full transition-all ${active ? 'left-5.5 md:left-7' : 'left-0.5 md:left-1'}`} />
    </button>
  </div>
);

const PlanCard = ({ title, price, desc, active, features, onSelect, icon }: any) => (
  <div className={`p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] flex flex-col justify-between border-2 transition-all ${active ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xl scale-105' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-indigo-50 dark:hover:border-indigo-900 shadow-sm'}`}>
    <div>
      <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center mb-6 shadow-sm shrink-0 ${active ? 'bg-white/10 text-white' : 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600'}`}>
         {icon}
      </div>
      <h3 className="text-lg md:text-xl font-black uppercase tracking-tighter mb-2">{title}</h3>
      <p className={`text-sm md:text-base font-black mb-6 ${active ? 'text-indigo-100' : 'text-indigo-600'}`}>{price}</p>
      <p className={`text-[11px] md:text-xs font-medium leading-relaxed mb-8 ${active ? 'text-indigo-100/70' : 'text-slate-400'}`}>{desc}</p>
      <ul className="space-y-4">
        {features.map((f: string, i: number) => (
           <li key={i} className="flex items-center gap-3 text-[9px] md:text-[10px] font-black uppercase tracking-widest">
              <CheckCircle2 size={14} className={`shrink-0 ${active ? 'text-indigo-200' : 'text-emerald-500'}`} /> {f}
           </li>
        ))}
      </ul>
    </div>
    <button onClick={onSelect} disabled={active} className={`w-full py-4 mt-8 md:mt-10 rounded-2xl font-black uppercase text-[9px] md:text-[10px] tracking-widest transition-all ${active ? 'bg-white/20 text-white cursor-default' : 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 active:scale-95'}`}>
       {active ? 'Current Protocol' : 'Deploy Plan'}
    </button>
  </div>
);

export default Settings;
