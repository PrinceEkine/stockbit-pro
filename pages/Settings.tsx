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
  Key,
  Languages,
  ArrowUpRight,
  ShieldAlert,
  Fingerprint,
  Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Settings as SettingsType, User, SubscriptionPlan, AppLanguage } from '../types';
import { TRANSLATIONS } from '../constants/translations';

interface SettingsProps {
  settings: SettingsType;
  onUpdate: (updates: Partial<SettingsType>) => void;
  staff: User[];
  currentUser: User | null;
  onAddStaff: (data: any) => Promise<void>;
  onRemoveStaff: (id: string) => Promise<void>;
  onVerifyPayment: (reference: string, plan: SubscriptionPlan, cycle: 'monthly' | 'annual') => Promise<{ success: boolean; error?: string }>;
  onUpdatePassword?: (password: string) => Promise<any>;
}

const Settings: React.FC<SettingsProps> = ({ settings, onUpdate, staff, currentUser, onAddStaff, onRemoveStaff, onVerifyPayment, onUpdatePassword }) => {
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
  const [paymentStatus, setPaymentStatus] = useState<{ type: 'verifying' | 'success' | 'error'; message: string } | null>(null);

  // Password Security state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const t = TRANSLATIONS[settings.language || 'en'];

  useEffect(() => {
    if (settings) {
      setCompanyName(settings.companyName);
      setNotificationEmail(settings.notificationEmail);
      setLowStockAlerts(settings.lowStockEmailAlerts);
    }
  }, [settings]);

  const handlePasswordUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!newPassword || newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }

    if (!onUpdatePassword) {
      setPasswordError('Password update service is currently unavailable.');
      return;
    }

    setPasswordSaving(true);
    try {
      const res = await onUpdatePassword(newPassword);
      if (res?.error) {
        setPasswordError(res.error.message || 'Failed to update password.');
      } else {
        setPasswordSuccess('Account password configured successfully! You can now log in using your email and password.');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setPasswordSuccess(''), 5000);
      }
    } catch (err: any) {
      setPasswordError(err.message || 'An error occurred while setting your password.');
    } finally {
      setPasswordSaving(false);
    }
  };

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
    const publicKey = settings.paystackPublicKey || import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;
    
    if (!publicKey) {
      alert("CRITICAL: Payment gateway not configured. Please contact support.");
      return;
    }

    const prices: Record<SubscriptionPlan, { monthly: number; annual: number }> = {
      beta: { monthly: 5000, annual: 50000 },
      mega: { monthly: 7999, annual: 80000 },
      mega_pro: { monthly: 12999, annual: 128000 }
    };

    const amount = cycle === 'monthly' ? prices[plan].monthly : prices[plan].annual;

    const PaystackPop = (window as any).PaystackPop;
    if (!PaystackPop || typeof PaystackPop.setup !== 'function') {
      alert("Payment gateway is still loading or was blocked by your browser. Please check your connection, disable any ad-blockers, and try again.");
      return;
    }

    setPaymentStatus(null);

    try {
      const handler = PaystackPop.setup({
        key: publicKey,
        email: currentUser?.email || 'billing@stockbit.pro',
        amount: amount * 100,
        currency: "NGN",
        // Do NOT trust the browser: send the reference to the server for verification
        // against Paystack before the subscription is activated.
        callback: (response: { reference: string }) => {
          setPaymentStatus({ type: 'verifying', message: 'Confirming your payment securely...' });
          onVerifyPayment(response.reference, plan, cycle)
            .then((res) => {
              if (res.success) {
                setPaymentStatus({ type: 'success', message: 'Payment confirmed. Your subscription is now active!' });
              } else {
                setPaymentStatus({ type: 'error', message: res.error || 'We received your payment but could not verify it automatically. Please contact support with your reference.' });
              }
            })
            .catch(() => {
              setPaymentStatus({ type: 'error', message: 'Payment verification failed. Please contact support with your reference.' });
            });
        },
        onClose: () => console.log("Payment window closed.")
      });
      handler.openIframe();
    } catch (err) {
      console.error("Paystack initialization failed:", err);
      alert("Could not open the payment window. Please try again in a moment.");
    }
  };

  const handleAddStaff = () => {
    // We remove the manual addition as it triggers logout. 
    // Instead, we show instructions.
    copyInviteId();
    alert("Protocol Initiated: Share your Link ID with team members. They should use 'Join with Link' during registration to connect to your terminal network.");
  };

  const copyInviteId = () => {
    if (currentUser?.id) {
      navigator.clipboard.writeText(currentUser.id);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Organization', icon: Building },
    { id: 'market', label: 'Marketplaces', icon: ShoppingBag },
    { id: 'staff', label: 'Workforce', icon: Users },
    { id: 'billing', label: 'Subscription', icon: CreditCard }
  ] as const;

  return (
    <div className="space-y-10 animate-in fade-in duration-1000 max-w-6xl no-print mx-auto px-4">
      {/* Header Section */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
              <SettingsIcon className="text-white" size={24} />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              Settings
            </h1>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-normal">
            Manage your business profile, staff, and account preferences.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="px-5 py-2.5 bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-100 dark:border-slate-800 rounded-2xl flex items-center gap-3 shadow-sm">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">System Online</span>
          </div>
          {saveSuccess && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="px-5 py-2.5 bg-emerald-500 text-white rounded-2xl flex items-center gap-2 shadow-lg shadow-emerald-500/20"
            >
              <CheckCircle2 size={16} />
              <span className="text-[10px] font-black uppercase tracking-widest">Saved</span>
            </motion.div>
          )}
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="flex bg-white/50 dark:bg-slate-950/50 backdrop-blur-2xl p-2 rounded-[2.5rem] border border-slate-200/50 dark:border-slate-800/50 overflow-x-auto scrollbar-hide shadow-2xl sticky top-24 z-20">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`relative flex-1 flex items-center justify-center gap-3 px-8 py-4 rounded-[1.8rem] text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap group ${
              activeTab === tab.id 
                ? 'text-indigo-600 dark:text-white' 
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
            }`}
          >
            {activeTab === tab.id && (
              <motion.div 
                layoutId="activeTab"
                className="absolute inset-0 bg-white dark:bg-indigo-600 shadow-xl dark:shadow-indigo-600/20 rounded-[1.8rem]"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            <tab.icon size={16} className={`relative z-10 transition-colors ${activeTab === tab.id ? 'text-indigo-600 dark:text-white' : 'group-hover:text-indigo-500'}`} />
            <span className="relative z-10">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <main className="min-h-[600px] mb-20">
        <AnimatePresence mode="wait">
          {activeTab === 'profile' && (
            <motion.div 
              key="profile"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8"
            >
              <div className="lg:col-span-8 space-y-8">
                {/* General Settings Bento Card */}
                <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl border border-slate-200/50 dark:border-slate-800 p-8 md:p-12 rounded-[3.5rem] shadow-2xl space-y-12 text-slate-900 dark:text-white">
                  <header className="flex justify-between items-start">
                    <div>
                      <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
                        General Identity <Building size={20} className="text-indigo-500" />
                      </h2>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Foundational business credentials</p>
                    </div>
                  </header>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase ml-2 tracking-widest block">Legal Business Name</label>
                      <input 
                        className="w-full px-8 py-5 bg-slate-100 dark:bg-slate-950 border-2 border-transparent focus:border-indigo-600/50 dark:focus:border-indigo-500 rounded-[2rem] font-bold text-sm dark:text-white outline-none transition-all shadow-inner" 
                        value={companyName} 
                        onChange={e => setCompanyName(e.target.value)} 
                        placeholder="e.g. Acme Corporation"
                      />
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase ml-2 tracking-widest block">Operational Language</label>
                      <div className="relative">
                        <Languages size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-indigo-500 pointer-events-none" />
                        <select 
                          className="w-full pl-16 pr-8 py-5 bg-slate-100 dark:bg-slate-950 border-2 border-transparent focus:border-indigo-600/50 dark:focus:border-indigo-500 rounded-[2rem] font-bold text-sm dark:text-white outline-none transition-all appearance-none cursor-pointer shadow-inner" 
                          value={settings.language} 
                          onChange={e => onUpdate({ language: e.target.value as AppLanguage })}
                        >
                          <option value="en">Global (English)</option>
                          <option value="yo">Yorùbá</option>
                          <option value="ha">Hausa</option>
                          <option value="ig">Igbo</option>
                        </select>
                        <ChevronRight size={18} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 rotate-90 pointer-events-none" />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase ml-2 tracking-widest block">Transaction Currency</label>
                      <select 
                        className="w-full px-8 py-5 bg-slate-100 dark:bg-slate-950 border-2 border-transparent focus:border-indigo-600/50 dark:focus:border-indigo-500 rounded-[2rem] font-bold text-sm dark:text-white outline-none transition-all cursor-pointer shadow-inner" 
                        value={settings.currency} 
                        onChange={e => onUpdate({ currency: e.target.value })}
                      >
                        <option value="₦">Nigerian Naira (₦)</option>
                        <option value="$">US Dollar ($)</option>
                        <option value="£">British Pound (£)</option>
                        <option value="€">Euro (€)</option>
                      </select>
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase ml-2 tracking-widest block">Visual Theme Mode</label>
                      <div className="flex bg-slate-100 dark:bg-slate-950 p-1.5 rounded-[2rem] h-[64px] shadow-inner">
                        <button 
                          onClick={() => onUpdate({ theme: 'light' })} 
                          className={`flex-1 rounded-[1.5rem] flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest transition-all ${
                            settings.theme === 'light' 
                              ? 'bg-white shadow-xl text-indigo-600' 
                              : 'text-slate-400 hover:text-slate-600'
                          }`}
                        >
                          <Sun size={16}/> Light
                        </button>
                        <button 
                          onClick={() => onUpdate({ theme: 'dark' })} 
                          className={`flex-1 rounded-[1.5rem] flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest transition-all ${
                            settings.theme === 'dark' 
                              ? 'bg-slate-800 shadow-xl text-indigo-400' 
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <Moon size={16}/> Dark
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="pt-8 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-8">
                      <div>
                        <h3 className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                          Smart Stock Alerts <BellRing size={16} className="text-amber-500" />
                        </h3>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">Real-time inventory risk notifications</p>
                      </div>
                      <button 
                        onClick={() => setLowStockAlerts(!lowStockAlerts)} 
                        className={`w-16 h-8 rounded-full transition-all duration-500 relative ${
                          lowStockAlerts ? 'bg-indigo-600 shadow-lg shadow-indigo-600/30' : 'bg-slate-200 dark:bg-slate-800'
                        }`}
                      >
                        <motion.div 
                          animate={{ x: lowStockAlerts ? 34 : 4 }}
                          className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-md"
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        />
                      </button>
                    </div>
                    
                    {lowStockAlerts && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="space-y-4 pt-2 overflow-hidden"
                      >
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-2 block tracking-widest">Notification Recipient</label>
                        <div className="relative group">
                          <Mail size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                          <input 
                            type="email" 
                            placeholder="stock-team@business.com" 
                            className="w-full pl-16 pr-8 py-5 bg-slate-100/50 dark:bg-slate-950/50 border-2 border-transparent focus:border-indigo-600/50 rounded-[2rem] font-bold text-sm dark:text-white outline-none transition-all shadow-inner" 
                            value={notificationEmail} 
                            onChange={e => setNotificationEmail(e.target.value)} 
                          />
                        </div>
                      </motion.div>
                    )}
                  </div>

                  <button 
                    onClick={handleApplyChanges} 
                    disabled={isSaving} 
                    className={`w-full py-6 rounded-[2.5rem] font-black uppercase text-xs tracking-[0.3em] transition-all transform flex items-center justify-center gap-4 shadow-2xl active:scale-95 disabled:opacity-50 ${
                      saveSuccess ? 'bg-emerald-600 text-white shadow-emerald-600/20' : 'bg-indigo-600 text-white shadow-indigo-600/30 hover:bg-indigo-700'
                    }`}
                  >
                    {isSaving ? (
                      <><Loader2 size={20} className="animate-spin"/> Syncing...</>
                    ) : saveSuccess ? (
                      <><CheckCircle2 size={20} /> Success</>
                    ) : (
                      <><Save size={20} /> Deploy Changes</>
                    )}
                  </button>
                </div>
              </div>
              
              <div className="lg:col-span-4 space-y-8">
                {/* Security & Password Card */}
                <div className="bg-slate-900 rounded-[3.5rem] p-8 md:p-10 text-white relative overflow-hidden shadow-2xl space-y-6 border border-slate-800">
                  <div className="relative z-10 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="w-14 h-14 bg-indigo-500/20 rounded-2xl flex items-center justify-center backdrop-blur-xl border border-indigo-500/30">
                        <Key size={26} className="text-indigo-400" />
                      </div>
                      <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5">
                        <ShieldCheck size={12} /> Account Active
                      </span>
                    </div>

                    <div>
                      <h3 className="text-xl font-black uppercase tracking-tight text-white flex items-center gap-2">
                        Account Password
                      </h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                        Set or update your password for email sign-in
                      </p>
                    </div>

                    {currentUser && (
                      <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800/80 space-y-1">
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Signed In As</p>
                        <p className="text-xs font-bold text-slate-200 truncate">{currentUser.email}</p>
                        <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-wider">
                          {currentUser.name} ({currentUser.role})
                        </p>
                      </div>
                    )}

                    <form onSubmit={handlePasswordUpdateSubmit} className="space-y-4 pt-2">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">New Password</label>
                        <div className="relative">
                          <Lock size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" />
                          <input 
                            type="password" 
                            required
                            placeholder="At least 6 characters"
                            className="w-full pl-12 pr-4 py-3.5 bg-slate-950 border border-slate-800 rounded-2xl text-xs font-bold text-white placeholder:text-slate-600 outline-none focus:border-indigo-500 transition-all"
                            value={newPassword}
                            onChange={e => setNewPassword(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Confirm Password</label>
                        <div className="relative">
                          <Lock size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" />
                          <input 
                            type="password" 
                            required
                            placeholder="Re-enter password"
                            className="w-full pl-12 pr-4 py-3.5 bg-slate-950 border border-slate-800 rounded-2xl text-xs font-bold text-white placeholder:text-slate-600 outline-none focus:border-indigo-500 transition-all"
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                          />
                        </div>
                      </div>

                      {passwordError && (
                        <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-[10px] font-bold">
                          {passwordError}
                        </div>
                      )}

                      {passwordSuccess && (
                        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-[10px] font-bold flex items-center gap-2">
                          <CheckCircle2 size={14} /> {passwordSuccess}
                        </div>
                      )}

                      <button 
                        type="submit"
                        disabled={passwordSaving}
                        className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 active:scale-95 disabled:opacity-50"
                      >
                        {passwordSaving ? <Loader2 size={16} className="animate-spin" /> : <Lock size={14} />}
                        {passwordSaving ? 'Updating Password...' : 'Save Password'}
                      </button>
                    </form>
                  </div>

                  <div className="relative z-10 pt-4 border-t border-slate-800">
                    <p className="text-[9px] text-slate-500 font-medium leading-relaxed">
                      💡 Google Users: Setting a password enables direct email & password sign-in for your account on any device.
                    </p>
                  </div>
                </div>

                {/* Info Bento Card */}
                <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl border border-slate-100 dark:border-slate-800 p-8 rounded-[3rem] shadow-lg space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 text-amber-600 rounded-xl flex items-center justify-center">
                      <Zap size={20} />
                    </div>
                    <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-900 dark:text-white">Quick Tip</h4>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
                    Set up low-stock alerts to receive automated procurement lists directly in your inbox before you run out.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'market' && (
            <motion.div 
              key="market"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-4xl mx-auto space-y-8"
            >
               <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl border border-slate-200/50 dark:border-slate-800 p-8 md:p-16 rounded-[4rem] shadow-3xl text-slate-900 dark:text-white">
                  <div className="max-w-xl mb-12">
                    <div className="flex items-center gap-3 mb-4">
                      <Globe size={32} className="text-indigo-600" />
                      <h2 className="text-3xl font-black uppercase tracking-tighter">Global <span className="text-indigo-600">Expansion</span></h2>
                    </div>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed uppercase tracking-wider">
                      Connect your warehouse to Nigeria's largest e-commerce networks. Orders will automatically synchronize and deduct from your primary inventory pool.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-8">
                    <ChannelToggle 
                      label="Jumia Seller Portal" 
                      desc="Direct vendor portal synchronization" 
                      icon={<Globe size={22} />} 
                      active={settings.marketplaces.jumia} 
                      onChange={() => onUpdate({ marketplaces: { ...settings.marketplaces, jumia: !settings.marketplaces.jumia }})} 
                    />
                    <ChannelToggle 
                      label="Konga Online" 
                      desc="Automated logistics ledger linkage" 
                      icon={<ShoppingBag size={22} />} 
                      active={settings.marketplaces.konga} 
                      onChange={() => onUpdate({ marketplaces: { ...settings.marketplaces, konga: !settings.marketplaces.konga }})} 
                    />
                    <ChannelToggle 
                      label="WhatsApp Store" 
                      desc="Intelligent catalog broadcasting" 
                      icon={<MessageCircle size={22} />} 
                      active={settings.marketplaces.whatsapp} 
                      onChange={() => onUpdate({ marketplaces: { ...settings.marketplaces, whatsapp: !settings.marketplaces.whatsapp }})} 
                    />
                  </div>
                  
                  <div className="mt-12 p-10 bg-indigo-50 dark:bg-indigo-900/20 rounded-[3rem] border border-indigo-100 dark:border-indigo-800 flex items-start gap-6 shadow-sm">
                    <div className="p-4 bg-white dark:bg-indigo-600 rounded-3xl shadow-xl shrink-0">
                      <Rocket size={24} className="text-indigo-600 dark:text-white" />
                    </div>
                    <div>
                      <h4 className="text-[11px] font-black uppercase tracking-widest text-indigo-900 dark:text-indigo-100 mb-2">Automated Fulfilment Control</h4>
                      <p className="text-[11px] text-indigo-600/70 dark:text-indigo-300 font-bold uppercase tracking-widest leading-relaxed">
                        Marketplace orders trigger immediate notification and reserve stock quantities automatically across all active channels.
                      </p>
                    </div>
                  </div>
               </div>
            </motion.div>
          )}

          {activeTab === 'staff' && (
            <motion.div 
              key="staff"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-12"
            >
                  <div className="bg-gradient-to-br from-indigo-600 to-indigo-900 p-10 md:p-16 rounded-[4.5rem] text-white shadow-[0_50px_100px_-20px_rgba(79,70,229,0.3)] relative overflow-hidden group border border-white/10">
                  <div className="relative z-10 grid grid-cols-1 xl:grid-cols-2 gap-8 items-center">
                    <div>
                       <div className="flex items-center gap-4 mb-8">
                          <div className="w-16 h-16 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/20">
                             <Share2 size={32} className="text-white" />
                          </div>
                          <h3 className="text-3xl font-black uppercase tracking-tighter leading-tight">Terminal <br/><span className="text-indigo-300 italic">Provisioning</span></h3>
                       </div>
                       <p className="text-indigo-100 text-[11px] font-medium leading-relaxed mb-12 max-w-sm uppercase tracking-widest">
                          Distributed workforce protocol. To link a new team member, ask them to select 'Join a Business' during sign-up and enter this identifier.
                       </p>
                       
                       <div className="flex flex-col gap-3 w-full">
                          <div className="w-full flex items-center gap-4 bg-black/20 backdrop-blur-md rounded-2xl px-6 py-4 font-mono text-sm font-bold border border-white/10 group-hover:border-white/30 transition-all shadow-inner">
                             <Fingerprint size={18} className="text-indigo-300 shrink-0" />
                             <span className="truncate tracking-tighter text-xs">{currentUser?.id || 'PROVISIONING...'}</span>
                          </div>
                          <button 
                            onClick={copyInviteId} 
                            className={`w-full py-4 px-6 rounded-2xl transition-all flex items-center justify-center gap-3 font-black uppercase text-[11px] tracking-widest ${
                              copyFeedback 
                                ? 'bg-emerald-400 text-white shadow-emerald-400/40' 
                                : 'bg-white text-indigo-900 shadow-2xl active:scale-95 hover:bg-slate-50'
                            }`}
                          >
                             {copyFeedback ? <CheckCircle2 size={18} /> : <Copy size={18} />}
                             {copyFeedback ? 'LINK READY' : 'COPY PROTOCOL'}
                          </button>
                       </div>
                    </div>
                    
                    <div className="hidden xl:grid grid-cols-2 gap-6">
                      <div className="space-y-6">
                        <div className="bg-white/10 backdrop-blur-md rounded-[2.5rem] p-10 border border-white/5 shadow-xl">
                          <h5 className="text-[11px] font-black uppercase tracking-[0.2em] text-white/50 mb-3">Active Squad</h5>
                          <p className="text-5xl font-black tracking-tighter">{staff.filter(u => u.role === 'staff' && u.parentId === currentUser?.id).length}</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md rounded-[2.5rem] p-10 border border-white/5 shadow-xl">
                          <h5 className="text-[11px] font-black uppercase tracking-[0.2em] text-white/50 mb-3">Sync Node</h5>
                          <div className="text-[11px] font-black uppercase tracking-[0.3em] text-emerald-400 flex items-center gap-2">
                             <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block" /> Operational
                          </div>
                        </div>
                      </div>
                      <div className="pt-12">
                        <div className="bg-white/10 backdrop-blur-md rounded-[2.5rem] p-10 border border-white/5 h-full flex flex-col justify-between shadow-xl">
                          <div className="w-14 h-14 bg-indigo-500 rounded-2xl flex items-center justify-center shadow-lg">
                            <ShieldCheck size={28} />
                          </div>
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] leading-relaxed text-indigo-100">Encrypted Personnel Channels Active</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <Users className="absolute -bottom-20 -right-20 text-white/5 w-[500px] h-[500px] group-hover:scale-110 transition-transform duration-[4000ms]" />
               </div>

               {/* Staff List Section */}
               <div className="space-y-10">
                  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 px-6">
                     <div>
                        <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">Terminal <span className="text-indigo-600">Squad</span></h2>
                        <p className="text-[11px] text-slate-400 font-bold uppercase tracking-[0.3em] mt-4">Authorized personnel with system permissions</p>
                     </div>
                     <button 
                       onClick={() => setIsAddingStaff(true)} 
                       className="group px-10 py-6 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[2.5rem] flex items-center justify-center gap-4 font-black text-[12px] uppercase tracking-[0.3em] shadow-2xl active:scale-95 transition-all"
                     >
                       <Plus size={22} className="group-hover:rotate-90 transition-transform" /> Add Crew Member
                     </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                     {staff.filter(u => u.role === 'staff' && u.parentId === currentUser?.id).map(member => (
                        <motion.div 
                         initial={{ opacity: 0, scale: 0.95 }}
                         animate={{ opacity: 1, scale: 1 }}
                         key={member.id} 
                         className="bg-white/70 dark:bg-slate-900/40 backdrop-blur-2xl p-8 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-2xl flex items-center justify-between group hover:border-indigo-500/30 transition-all hover:translate-y-[-8px]"
                        >
                           <div className="flex items-center gap-6 min-w-0">
                              <div className="relative">
                                <div className="w-16 h-16 rounded-[1.5rem] bg-indigo-600 text-white flex items-center justify-center font-black text-xl shadow-xl">
                                 {member.name.charAt(0)}
                                </div>
                                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 border-4 border-white dark:border-slate-950 rounded-full" />
                              </div>
                              <div className="min-w-0">
                                 <p className="text-base font-black text-slate-900 dark:text-white uppercase truncate tracking-tight">{member.name}</p>
                                 <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase truncate tracking-widest mt-1">Terminal Active</p>
                              </div>
                           </div>
                           <button 
                             onClick={() => onRemoveStaff(member.id)} 
                             className="p-4 text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950 rounded-2xl transition-all"
                           >
                             <Trash2 size={20} />
                           </button>
                        </motion.div>
                     ))}
                     
                     {staff.filter(u => u.role === 'staff' && u.parentId === currentUser?.id).length === 0 && (
                        <div className="col-span-full py-24 bg-slate-50/50 dark:bg-slate-900/20 rounded-[4rem] border-2 border-dashed border-slate-200 dark:border-slate-800 text-center flex flex-col items-center">
                           <div className="w-24 h-24 bg-white dark:bg-slate-800 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-xl">
                             <Users size={48} className="text-slate-200 dark:text-slate-600" />
                           </div>
                           <h4 className="text-[13px] font-black uppercase text-slate-400 tracking-[0.4em]">Grid Empty</h4>
                           <p className="text-[10px] text-slate-300 font-bold uppercase mt-3 tracking-widest">Awaiting personnel deployment invitations</p>
                        </div>
                     )}
                  </div>
               </div>

               {/* Add Staff Info Modal */}
               <AnimatePresence>
                {isAddingStaff && (
                  <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setIsAddingStaff(false)}
                      className="absolute inset-0 bg-slate-950/90 backdrop-blur-3xl" 
                    />
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9, y: 40 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: 40 }}
                      className="bg-white dark:bg-slate-900 rounded-[2rem] sm:rounded-[4.5rem] w-full max-w-2xl p-6 sm:p-12 md:p-16 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] relative z-10 border border-white/5 max-h-[90vh] overflow-y-auto"
                    >
                        <header className="mb-6 sm:mb-12">
                          <h3 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-4 sm:mb-6 leading-none animate-in fade-in">Adding <span className="text-indigo-600">Personnel</span></h3>
                          <div className="p-6 sm:p-10 bg-indigo-50 dark:bg-indigo-950/30 rounded-[2rem] sm:rounded-[3rem] border border-indigo-100 dark:border-indigo-900 focus-within:border-indigo-500 transition-all text-center">
                            <div className="w-20 h-20 bg-indigo-600 text-white rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-2xl">
                              <Plus size={40} />
                            </div>
                            <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-4 uppercase">Invitation Recommended</h4>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest leading-relaxed mb-10">
                              For data security, team members should create their own accounts. Share your <span className="text-indigo-600 font-black">Link ID</span> with them. They must select <span className="text-indigo-600 font-black">'Join a Business'</span> during registration.
                            </p>
                            
                            <div className="bg-slate-100 dark:bg-slate-800 p-6 rounded-2xl font-mono text-sm font-bold text-indigo-600 dark:text-indigo-400 mb-8 border border-indigo-500/20">
                              {currentUser?.id}
                            </div>
                            
                            <button 
                              onClick={handleAddStaff}
                              className="w-full py-6 bg-indigo-600 text-white rounded-[2rem] font-black uppercase text-xs tracking-widest active:scale-95 transition-all shadow-xl"
                            >
                              Copy ID & Close
                            </button>
                          </div>
                        </header>
                    </motion.div>
                  </div>
                )}
               </AnimatePresence>
            </motion.div>
          )}

          {activeTab === 'billing' && (
            <motion.div 
              key="billing"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -40 }}
              className="space-y-16"
            >
               <div className="flex flex-col items-center justify-center text-center space-y-8">
                  <div className="space-y-4">
                    <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white tracking-tight">Choose Your <span className="text-indigo-600">Plan</span></h2>
                    <p className="text-base text-slate-500 dark:text-slate-400 font-normal max-w-2xl px-4">Elevate your business with professional inventory management and real-time insights.</p>
                  </div>

                  <div className="bg-white dark:bg-slate-900 p-1.5 rounded-2xl flex w-full max-w-[340px] border border-slate-200 dark:border-slate-800 shadow-sm mx-auto">
                    <button 
                      onClick={() => setBillingCycle('monthly')} 
                      className={`flex-1 px-6 py-3 rounded-xl text-xs font-bold transition-all ${
                        billingCycle === 'monthly' 
                          ? 'bg-indigo-600 text-white shadow-md' 
                          : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                      }`}
                    >
                      Monthly
                    </button>
                    <button
                      onClick={() => setBillingCycle('annual')}
                      className={`flex-1 px-6 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                        billingCycle === 'annual'
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                      }`}
                    >
                      Annual <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-[10px] rounded-md">-15%</span>
                    </button>
                  </div>

                  {paymentStatus && (
                    <div className={`w-full max-w-xl mx-auto px-6 py-4 rounded-2xl border flex items-center gap-3 text-sm font-medium ${
                      paymentStatus.type === 'success'
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/10 dark:border-emerald-800 dark:text-emerald-400'
                        : paymentStatus.type === 'error'
                        ? 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-900/10 dark:border-rose-800 dark:text-rose-400'
                        : 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-900/10 dark:border-indigo-800 dark:text-indigo-400'
                    }`}>
                      {paymentStatus.type === 'success' ? <CheckCircle2 size={18} className="shrink-0" />
                        : paymentStatus.type === 'error' ? <ShieldAlert size={18} className="shrink-0" />
                        : <Loader2 size={18} className="shrink-0 animate-spin" />}
                      <span className="text-left">{paymentStatus.message}</span>
                    </div>
                  )}
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 pb-32">
                  <PlanCard 
                     title="StockBit Entry" 
                     price={billingCycle === 'monthly' ? "₦5,000" : "₦50,000"}
                     cycle={billingCycle === 'monthly' ? "/mo" : "/yr"}
                     desc="Perfect for starting vendors and small retail kiosks."
                     active={currentUser?.plan === 'beta'}
                     features={['3 Team Members', 'Cloud-Sync Inventory', 'Sales Tracking', 'Basic Reporting']}
                     onSelect={() => handlePaystackActivation('beta', billingCycle)}
                     icon={<Layout size={24} />}
                  />
                  <PlanCard 
                     title="StockBit Business" 
                     price={billingCycle === 'monthly' ? "₦7,999" : "₦80,000"}
                     cycle={billingCycle === 'monthly' ? "/mo" : "/yr"}
                     desc="The professional choice for growing retail stores."
                     active={currentUser?.plan === 'mega'}
                     features={['8 Team Members', 'Advanced Analytics', 'Marketplace Sync', 'Inventory Forecasting']}
                     onSelect={() => handlePaystackActivation('mega', billingCycle)}
                     icon={<Rocket size={24} />}
                     popular
                  />
                  <PlanCard 
                     title="StockBit Enterprise" 
                     price={billingCycle === 'monthly' ? "₦12,999" : "₦128,000"}
                     cycle={billingCycle === 'monthly' ? "/mo" : "/yr"}
                     desc="Scalable solutions for chains and large distribution hubs."
                     active={currentUser?.plan === 'mega_pro'}
                     features={['Unlimited Members', 'Multi-Store Control', 'API Access', 'Priority Support']}
                     onSelect={() => handlePaystackActivation('mega_pro', billingCycle)}
                     icon={<Star size={24} />}
                  />
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

const ChannelToggle = ({ label, desc, icon, active, onChange }: any) => (
  <div className={`flex items-center justify-between p-8 md:p-10 bg-white/50 dark:bg-slate-900/40 backdrop-blur-2xl rounded-[3.5rem] border-2 transition-all group ${
    active ? 'border-indigo-600/30 bg-white dark:bg-slate-800/60 shadow-2xl' : 'border-slate-50 dark:border-slate-800/50 hover:border-slate-200 dark:hover:border-slate-700'
  }`}>
    <div className="flex items-center gap-8 min-w-0">
      <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center shadow-xl transition-all group-hover:scale-110 ${
        active ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400'
      }`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-sm md:text-base font-black text-slate-900 dark:text-white uppercase tracking-tighter truncate">{label}</p>
        <p className="text-[10px] md:text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-[0.3em] truncate mt-2">{desc}</p>
      </div>
    </div>
    <button 
      onClick={onChange} 
      className={`w-18 h-10 rounded-full transition-all duration-500 relative shadow-inner shrink-0 ${
        active ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'
      }`}
    >
       <motion.div 
        animate={{ x: active ? 40 : 4 }}
        className="absolute top-1 w-8 h-8 bg-white rounded-full shadow-2xl"
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
       />
    </button>
  </div>
);

const PlanCard = ({ title, price, cycle, desc, active, features, onSelect, icon, popular }: any) => (
  <div className={`relative p-8 md:p-10 rounded-[3rem] flex flex-col transition-all duration-500 h-full border-2 ${
    active 
      ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xl shadow-indigo-600/30 scale-[1.02] z-10' 
      : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-indigo-500/30 shadow-sm'
  }`}>
    {popular && !active && (
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-5 py-2 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-full shadow-xl whitespace-nowrap z-20">
        Highly Recommended
      </div>
    )}
    
    <div className="flex-1 flex flex-col">
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-8 shadow-sm shrink-0 ${
        active ? 'bg-white/20 text-white' : 'bg-indigo-50 dark:bg-indigo-400/10 text-indigo-600 dark:text-indigo-400'
      }`}>
         {icon}
      </div>
      
      <h3 className={`text-2xl md:text-3xl font-black mb-2 tracking-tighter uppercase ${active ? 'text-white' : 'text-slate-900 dark:text-white'}`}>{title}</h3>
      <div className="flex items-baseline gap-2 mb-6">
        <span className={`text-4xl md:text-5xl font-black tracking-tighter ${active ? 'text-white' : 'text-slate-900 dark:text-white'}`}>{price}</span>
        <span className={`text-[10px] md:text-sm font-black uppercase tracking-widest ${active ? 'text-indigo-100/90' : 'text-slate-400 dark:text-slate-500'}`}>{cycle}</span>
      </div>
      
      <p className={`text-sm font-medium leading-relaxed mb-10 ${active ? 'text-indigo-100/90' : 'text-slate-600 dark:text-slate-400'}`}>
        {desc}
      </p>
      
      <div className="space-y-6 mb-10">
        <p className={`text-[10px] font-black uppercase tracking-[0.3em] ${active ? 'text-indigo-200' : 'text-indigo-600 dark:text-indigo-400'}`}>System Capabilities</p>
        <ul className="space-y-5">
          {features.map((f: string, i: number) => (
             <li key={i} className="flex items-start gap-4 text-[12px] md:text-[14px] font-bold leading-snug">
                <CheckCircle2 size={18} className={`shrink-0 mt-0.5 ${active ? 'text-indigo-200' : 'text-emerald-500 dark:text-emerald-400'}`} /> 
                <span className={active ? 'text-white' : 'text-slate-700 dark:text-slate-200'}>{f}</span>
             </li>
          ))}
        </ul>
      </div>
    </div>
    
    <div className="mt-auto">
      <button 
        onClick={onSelect} 
        disabled={active} 
        className={`w-full py-5 rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] transition-all flex items-center justify-center gap-3 ${
          active 
            ? 'bg-white/10 text-white cursor-default border border-white/20' 
            : 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10 active:scale-[0.98] hover:bg-indigo-700 group'
        }`}
      >
         {active ? (
           <><ShieldCheck size={18} /> Protocol Active</>
         ) : (
           <>Choose Protocol <ArrowUpRight size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" /></>
         )}
      </button>
    </div>
  </div>
);

export default Settings;
