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
import { Settings as SettingsType, User, SubscriptionPlan, AppLanguage, StaffInvite } from '../types';
import { TRANSLATIONS } from '../constants/translations';
import { getEntitlements, isUnlimited, PLAN_ENTITLEMENTS } from '../constants/plans';
import { checkPassword, PASSWORD_MIN_LENGTH } from '../lib/security';
import { useToast } from '../components/ui/Toast';

interface SettingsProps {
  settings: SettingsType;
  onUpdate: (updates: Partial<SettingsType>) => void;
  staff: User[];
  currentUser: User | null;
  onRemoveStaff: (id: string) => Promise<void>;
  invites?: StaffInvite[];
  onLoadInvites?: () => Promise<void>;
  onCreateInvite?: (email?: string) => Promise<StaffInvite>;
  onRevokeInvite?: (id: string) => Promise<void>;
  onJoinWithCode?: (code: string) => Promise<void>;
  onVerifyPayment: (reference: string, plan: SubscriptionPlan, cycle: 'monthly' | 'annual') => Promise<{ success: boolean; error?: string }>;
  onUpdatePassword?: (password: string) => Promise<any>;
  onRefreshStaff?: () => Promise<void>;
  onSignOutEverywhere?: () => Promise<void>;
  authProviders?: string[];
}

const Settings: React.FC<SettingsProps> = ({ settings, onUpdate, staff, currentUser, onRemoveStaff, invites = [], onLoadInvites, onCreateInvite, onRevokeInvite, onJoinWithCode, onVerifyPayment, onUpdatePassword, onRefreshStaff, onSignOutEverywhere, authProviders = [] }) => {
  const toast = useToast();
  const [signingOutAll, setSigningOutAll] = useState(false);
  const [removingStaffId, setRemovingStaffId] = useState<string | null>(null);
  const hasPasswordLogin = authProviders.includes('email');
  const [activeTab, setActiveTab] = useState<'profile' | 'market' | 'staff' | 'billing'>('profile');
  const [companyName, setCompanyName] = useState(settings.companyName);
  const [notificationEmail, setNotificationEmail] = useState(settings.notificationEmail);
  const [lowStockAlerts, setLowStockAlerts] = useState(settings.lowStockEmailAlerts);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [creatingInvite, setCreatingInvite] = useState(false);
  const [newInvite, setNewInvite] = useState<StaffInvite | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [paymentStatus, setPaymentStatus] = useState<{ type: 'verifying' | 'success' | 'error'; message: string } | null>(null);

  // Password Security state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const t = TRANSLATIONS[settings.language || 'en'];

  // Plan entitlements for the signed-in business (staff limits, marketplace access, etc.)
  const entitlements = getEntitlements(currentUser);
  const staffCount = staff.filter(u => u.role === 'staff' && u.parentId === currentUser?.id).length;
  const staffLimitReached = !isUnlimited(entitlements.staffLimit) && staffCount >= entitlements.staffLimit;
  const staffLimitLabel = isUnlimited(entitlements.staffLimit) ? 'Unlimited' : String(entitlements.staffLimit);

  const toggleMarketplace = (key: 'jumia' | 'konga' | 'whatsapp') => {
    if (!entitlements.marketplaces) return; // gated to Business plan and above
    onUpdate({ marketplaces: { ...settings.marketplaces, [key]: !settings.marketplaces[key] } });
  };

  // A plan is only "active" when the user is actually subscribed. A leftover `plan`
  // value on an expired/trial account must NOT mark a card as active.
  const activePlan = currentUser?.isSubscribed ? currentUser.plan : undefined;

  useEffect(() => {
    if (settings) {
      setCompanyName(settings.companyName);
      setNotificationEmail(settings.notificationEmail);
      setLowStockAlerts(settings.lowStockEmailAlerts);
    }
  }, [settings]);

  // Pull the latest team list whenever the Workforce tab is opened, so newly
  // joined staff appear even if realtime replication isn't enabled.
  useEffect(() => {
    if (activeTab === 'staff') {
      onRefreshStaff?.();
      onLoadInvites?.();
    }
  }, [activeTab, onRefreshStaff, onLoadInvites]);

  const handlePasswordUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    const strength = checkPassword(newPassword, [currentUser?.name || '', currentUser?.email || '']);
    if (!strength.valid) {
      setPasswordError(`Password needs: ${strength.unmet.join(', ').toLowerCase()}.`);
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
        setPasswordSuccess('Password saved. Other devices have been signed out.');
        toast.success('Password updated', 'Other devices have been signed out.');
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
      toast.error('Payment gateway not configured', 'Please contact support.');
      return;
    }

    const prices: Record<SubscriptionPlan, { monthly: number; annual: number }> = {
      beta: { monthly: 5000, annual: 50000 },
      mega: { monthly: 7999, annual: 80000 },
      mega_pro: { monthly: 12999, annual: 128000 }
    };

    const amount = cycle === 'monthly' ? prices[plan].monthly : prices[plan].annual;

    const PaystackPop = (window as any).PaystackPop;
    if (typeof PaystackPop !== 'function') {
      toast.warning('Payment gateway still loading', 'Check your connection, disable ad-blockers, and try again.');
      return;
    }

    setPaymentStatus(null);

    // Verify the payment server-side before activating — never trust the browser.
    const verify = (reference: string) => {
      setPaymentStatus({ type: 'verifying', message: 'Confirming your payment securely...' });
      onVerifyPayment(reference, plan, cycle)
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
    };

    try {
      // Paystack Popup v2 — a cleaner, single-page checkout UI.
      const popup = new PaystackPop();
      popup.newTransaction({
        key: publicKey,
        email: currentUser?.email || 'billing@stockbit.pro',
        amount: amount * 100,
        currency: "NGN",
        metadata: {
          plan,
          cycle,
          custom_fields: [
            {
              display_name: 'Subscription',
              variable_name: 'subscription',
              value: `${PLAN_ENTITLEMENTS[plan].label} · ${cycle === 'monthly' ? 'Monthly' : 'Annual'}`,
            },
          ],
        },
        onSuccess: (transaction: { reference: string }) => verify(transaction.reference),
        onCancel: () => setPaymentStatus(null),
        onError: (error: any) => {
          console.error("Paystack error:", error);
          setPaymentStatus({ type: 'error', message: 'Payment could not be completed. Please try again.' });
        },
      });
    } catch (err) {
      console.error("Paystack initialization failed:", err);
      toast.error('Could not open the payment window', 'Please try again in a moment.');
    }
  };

  const copyText = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      toast.error('Could not copy', 'Please select and copy the text manually.');
    }
  };

  const joinLinkFor = (code: string) => `${window.location.origin}/#join=${code}`;

  const shareInvite = (invite: StaffInvite) => {
    const text = `You're invited to join ${settings.companyName} on StockBit Pro.\n\nOpen ${joinLinkFor(invite.code)} or sign up and choose "Join as staff" with code ${invite.code}. The code expires ${new Date(invite.expires_at).toLocaleDateString()}.`;
    if (navigator.share) {
      navigator.share({ title: 'StockBit Pro invite', text }).catch(() => {});
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
    }
  };

  const handleCreateInvite = async () => {
    if (!onCreateInvite) return;
    setCreatingInvite(true);
    try {
      const invite = await onCreateInvite(inviteEmail || undefined);
      setNewInvite(invite);
      setInviteEmail('');
      toast.success('Invite created', invite.email ? `Only ${invite.email} can use this code.` : 'Anyone with this code can join until it expires.');
    } catch (err: any) {
      toast.error('Could not create invite', err?.message);
    } finally {
      setCreatingInvite(false);
    }
  };

  const handleRevoke = async (invite: StaffInvite) => {
    if (!onRevokeInvite) return;
    setRevokingId(invite.id);
    try {
      await onRevokeInvite(invite.id);
      toast.info('Invite revoked', `${invite.code} can no longer be used.`);
    } catch (err: any) {
      toast.error('Could not revoke invite', err?.message);
    } finally {
      setRevokingId(null);
    }
  };

  const handleJoin = async () => {
    if (!onJoinWithCode || !joinCode.trim()) return;
    setJoining(true);
    try {
      await onJoinWithCode(joinCode);
      toast.success('Welcome aboard', 'You have joined the business as staff.');
    } catch (err: any) {
      toast.error('Could not join', err?.message);
    } finally {
      setJoining(false);
    }
  };

  const pendingInvites = invites.filter(i => i.status === 'pending' && new Date(i.expires_at).getTime() > Date.now());
  const myStaff = staff.filter(u => u.role === 'staff' && u.parentId === currentUser?.id);
  const timeLeft = (iso: string) => {
    const ms = new Date(iso).getTime() - Date.now();
    const days = Math.floor(ms / 86_400_000);
    if (days >= 1) return `${days} day${days === 1 ? '' : 's'} left`;
    const hours = Math.max(1, Math.floor(ms / 3_600_000));
    return `${hours} hour${hours === 1 ? '' : 's'} left`;
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
                            placeholder={`At least ${PASSWORD_MIN_LENGTH} characters`}
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

                  <div className="relative z-10 pt-4 border-t border-slate-800 space-y-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-semibold text-slate-200">Active sessions</p>
                        <p className="text-[10px] text-slate-500 leading-relaxed">Signed in with {authProviders.length ? authProviders.join(' + ') : 'email'}. Lost a device? Sign out everywhere.</p>
                      </div>
                      <button
                        type="button"
                        disabled={signingOutAll || !onSignOutEverywhere}
                        onClick={async () => {
                          if (!onSignOutEverywhere) return;
                          if (!window.confirm('Sign out of StockBit on every device, including this one?')) return;
                          setSigningOutAll(true);
                          try { await onSignOutEverywhere(); } finally { setSigningOutAll(false); }
                        }}
                        className="shrink-0 px-3 py-2 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white border border-rose-500/20 text-[10px] font-semibold transition-all disabled:opacity-50"
                      >
                        {signingOutAll ? 'Signing out…' : 'Sign out everywhere'}
                      </button>
                    </div>
                    {!hasPasswordLogin && (
                      <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                        You signed in with Google. Setting a password also enables email sign-in and unlocking the app after idle time.
                      </p>
                    )}
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

                  {!entitlements.marketplaces && (
                    <div className="mb-10 px-6 py-4 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-700 dark:bg-indigo-900/10 dark:border-indigo-800 dark:text-indigo-300 flex items-center gap-3 text-sm font-medium">
                      <Lock size={18} className="shrink-0" />
                      <span>Marketplace Sync is available on the Business and Enterprise plans. Upgrade in the Subscription tab to connect these channels.</span>
                    </div>
                  )}

                  <div className={`grid grid-cols-1 gap-8 ${!entitlements.marketplaces ? 'opacity-60' : ''}`}>
                    <ChannelToggle
                      label="Jumia Seller Portal"
                      desc="Direct vendor portal synchronization"
                      icon={<Globe size={22} />}
                      active={entitlements.marketplaces && settings.marketplaces.jumia}
                      locked={!entitlements.marketplaces}
                      onChange={() => toggleMarketplace('jumia')}
                    />
                    <ChannelToggle
                      label="Konga Online"
                      desc="Automated logistics ledger linkage"
                      icon={<ShoppingBag size={22} />}
                      active={entitlements.marketplaces && settings.marketplaces.konga}
                      locked={!entitlements.marketplaces}
                      onChange={() => toggleMarketplace('konga')}
                    />
                    <ChannelToggle
                      label="WhatsApp Store"
                      desc="Intelligent catalog broadcasting"
                      icon={<MessageCircle size={22} />}
                      active={entitlements.marketplaces && settings.marketplaces.whatsapp}
                      locked={!entitlements.marketplaces}
                      onChange={() => toggleMarketplace('whatsapp')}
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
              className="space-y-8"
            >
              {/* Hero */}
              <div className="relative overflow-hidden rounded-[2.5rem] bg-slate-950 text-white p-8 md:p-12 border border-white/10 shadow-elevated">
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-indigo-600/30 blur-[110px]" />
                  <div className="absolute bottom-[-120px] right-[-80px] w-80 h-80 rounded-full bg-sky-500/20 blur-[110px]" />
                  <div className="absolute inset-0 bg-grid opacity-30 [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_75%)]" />
                </div>
                <div className="relative z-10 grid lg:grid-cols-[1fr_auto] gap-8 items-center">
                  <div className="max-w-xl space-y-4">
                    <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/10 px-3 py-1 text-[11px] font-semibold text-indigo-200">
                      <ShieldCheck size={12} /> Server-verified invitations
                    </div>
                    <h2 className="font-display text-3xl md:text-4xl font-semibold tracking-tight">Your team</h2>
                    <p className="text-sm text-slate-400 leading-relaxed">
                      Invite teammates with a short code or link. Codes expire in 7 days, can be locked to one email, and can be revoked at any time. Staff see the sales terminal only — never your reports, pricing or billing.
                    </p>
                    <div className="flex flex-wrap items-center gap-3 pt-1">
                      <button
                        onClick={() => { setNewInvite(null); setIsInviting(true); }}
                        disabled={staffLimitReached}
                        title={staffLimitReached ? 'Staff limit reached for your plan — upgrade to add more.' : undefined}
                        className="btn-primary disabled:opacity-40"
                      >
                        <Plus size={18} /> Invite teammate
                      </button>
                      <span className={`text-sm font-medium ${staffLimitReached ? 'text-rose-300' : 'text-slate-300'}`}>
                        {staffCount} / {staffLimitLabel} seats used · {entitlements.label}
                      </span>
                    </div>
                  </div>
                  <div className="hidden lg:grid grid-cols-2 gap-4 min-w-[300px]">
                    <div className="rounded-3xl bg-white/5 border border-white/10 p-6">
                      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Active staff</p>
                      <p className="font-display text-4xl font-semibold mt-2">{myStaff.length}</p>
                    </div>
                    <div className="rounded-3xl bg-white/5 border border-white/10 p-6">
                      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Pending invites</p>
                      <p className="font-display text-4xl font-semibold mt-2">{pendingInvites.length}</p>
                    </div>
                  </div>
                </div>
              </div>

              {staffLimitReached && (
                <div className="px-5 py-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-300 flex items-center gap-3 text-sm">
                  <ShieldAlert size={18} className="shrink-0" />
                  <span>You've reached the {staffLimitLabel}-member limit on the {entitlements.label} plan. <button onClick={() => setActiveTab('billing')} className="font-semibold underline">Upgrade</button> to invite more team members.</span>
                </div>
              )}

              {/* Pending invites */}
              {pendingInvites.length > 0 && (
                <section className="space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-white">Pending invites</h3>
                    <span className="text-xs text-slate-500">{pendingInvites.length} open</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {pendingInvites.map(invite => (
                      <div key={invite.id} className="surface rounded-3xl p-5 flex items-center justify-between gap-4">
                        <div className="min-w-0">
                          <p className="font-mono text-base font-semibold tracking-[0.12em] text-slate-900 dark:text-white">{invite.code}</p>
                          <p className="text-xs text-slate-500 mt-1 truncate">
                            {invite.email ? <>Locked to <span className="font-medium text-slate-700 dark:text-slate-300">{invite.email}</span> · </> : 'Open invite · '}
                            {timeLeft(invite.expires_at)}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button onClick={() => copyText(joinLinkFor(invite.code), invite.id)} title="Copy join link" className="p-2.5 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
                            {copiedKey === invite.id ? <CheckCircle2 size={18} className="text-emerald-500" /> : <Copy size={18} />}
                          </button>
                          <button onClick={() => shareInvite(invite)} title="Share" className="p-2.5 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
                            <Share2 size={18} />
                          </button>
                          <button onClick={() => handleRevoke(invite)} disabled={revokingId === invite.id} title="Revoke" className="p-2.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors disabled:opacity-50">
                            {revokingId === invite.id ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Team list */}
              <section className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-white">Team members</h3>
                  <span className="text-xs text-slate-500">{myStaff.length} active</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {myStaff.map(member => (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.97 }}
                      animate={{ opacity: 1, scale: 1 }}
                      key={member.id}
                      className="surface rounded-3xl p-5 flex items-center justify-between gap-4 group hover:border-indigo-300/60 dark:hover:border-indigo-500/30 transition-colors"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="relative shrink-0">
                          <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-semibold text-lg">
                            {member.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{member.name}</p>
                          <p className="text-xs text-slate-500 truncate">{member.email}</p>
                          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">Sales terminal access</p>
                        </div>
                      </div>
                      <button
                        disabled={removingStaffId === member.id}
                        aria-label={`Remove ${member.name}`}
                        onClick={async () => {
                          if (!window.confirm(`Remove ${member.name} from your business? They will lose access immediately.`)) return;
                          setRemovingStaffId(member.id);
                          try {
                            await onRemoveStaff(member.id);
                            toast.success('Staff removed', `${member.name} no longer has access.`);
                          } catch (err: any) {
                            toast.error('Could not remove staff', err?.message);
                          } finally {
                            setRemovingStaffId(null);
                          }
                        }}
                        className="p-2.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors disabled:opacity-50 shrink-0"
                      >
                        {removingStaffId === member.id ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                      </button>
                    </motion.div>
                  ))}

                  {myStaff.length === 0 && (
                    <div className="col-span-full py-16 rounded-[2.5rem] border-2 border-dashed border-slate-200 dark:border-white/10 text-center flex flex-col items-center gap-4">
                      <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                        <Users size={28} className="text-slate-400" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">No team members yet</p>
                        <p className="text-xs text-slate-500 mt-1">Invite a cashier or sales assistant to work from their own device.</p>
                      </div>
                      <button onClick={() => { setNewInvite(null); setIsInviting(true); }} disabled={staffLimitReached} className="btn-secondary !py-2.5 text-xs"><Plus size={14} /> Invite teammate</button>
                    </div>
                  )}
                </div>
              </section>

              {/* Join a business (for accounts that signed up without a code, or whose code failed) */}
              {myStaff.length === 0 && onJoinWithCode && (
                <section className="surface rounded-3xl p-6 md:p-7">
                  <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">Were you invited to someone else's shop?</p>
                      <p className="text-xs text-slate-500 mt-1">Enter the invite code from your business owner to join their team. This only works for accounts with no products or sales of their own.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        value={joinCode}
                        onChange={e => setJoinCode(e.target.value.toUpperCase())}
                        placeholder="SB-XXXX-XXXX"
                        maxLength={12}
                        className="input-premium !w-48 font-mono tracking-[0.15em] uppercase"
                        spellCheck={false}
                      />
                      <button onClick={handleJoin} disabled={joining || joinCode.length < 12} className="btn-secondary !py-3.5">
                        {joining ? <Loader2 size={16} className="animate-spin" /> : <Key size={16} />} Join
                      </button>
                    </div>
                  </div>
                </section>
              )}

              {/* Invite modal */}
              <AnimatePresence>
                {isInviting && (
                  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsInviting(false)} className="absolute inset-0 bg-slate-950/70 backdrop-blur-md" />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 16 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 16 }}
                      transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                      className="relative z-10 w-full max-w-lg surface rounded-[2rem] p-7 sm:p-9 max-h-[90vh] overflow-y-auto"
                      role="dialog" aria-modal="true"
                    >
                      {!newInvite ? (
                        <>
                          <div className="mb-6">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 text-indigo-600 dark:text-indigo-300 flex items-center justify-center mb-4"><Users size={22} /></div>
                            <h3 className="font-display text-xl font-semibold text-slate-900 dark:text-white">Invite a teammate</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">They'll create their own account and join <span className="font-medium text-slate-700 dark:text-slate-200">{settings.companyName}</span> as staff.</p>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[13px] font-semibold text-slate-700 dark:text-slate-200">Teammate's email <span className="font-normal text-slate-400">(optional)</span></label>
                            <div className="relative">
                              <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                              <input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} className="input-premium pl-11" placeholder="cashier@example.com" />
                            </div>
                            <p className="text-xs text-slate-500">If set, only that email can use the code. Leave blank for a code anyone can use once.</p>
                          </div>
                          <ul className="mt-5 space-y-2 text-xs text-slate-500 dark:text-slate-400">
                            <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-500" /> Expires automatically in 7 days</li>
                            <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-500" /> Single use, revocable any time</li>
                            <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-500" /> Plan seat limit enforced on the server</li>
                          </ul>
                          <div className="mt-7 flex gap-3">
                            <button onClick={() => setIsInviting(false)} className="btn-secondary flex-1">Cancel</button>
                            <button onClick={handleCreateInvite} disabled={creatingInvite} className="btn-primary flex-1">
                              {creatingInvite ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />} Create invite
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="mb-6 text-center">
                            <div className="mx-auto w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-4"><CheckCircle2 size={26} /></div>
                            <h3 className="font-display text-xl font-semibold text-slate-900 dark:text-white">Invite ready</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{newInvite.email ? `Only ${newInvite.email} can use it.` : 'Share it with your teammate.'} Expires {new Date(newInvite.expires_at).toLocaleDateString()}.</p>
                          </div>
                          <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-white/10 p-5 text-center">
                            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Invite code</p>
                            <p className="font-mono text-3xl font-semibold tracking-[0.2em] text-slate-900 dark:text-white mt-2 select-all">{newInvite.code}</p>
                          </div>
                          <div className="mt-4 grid grid-cols-2 gap-3">
                            <button onClick={() => copyText(newInvite.code, 'code')} className="btn-secondary">
                              {copiedKey === 'code' ? <CheckCircle2 size={16} className="text-emerald-500" /> : <Copy size={16} />} Copy code
                            </button>
                            <button onClick={() => copyText(joinLinkFor(newInvite.code), 'link')} className="btn-secondary">
                              {copiedKey === 'link' ? <CheckCircle2 size={16} className="text-emerald-500" /> : <ArrowUpRight size={16} />} Copy link
                            </button>
                          </div>
                          <button onClick={() => shareInvite(newInvite)} className="btn-primary w-full mt-3"><Share2 size={16} /> Share via WhatsApp / apps</button>
                          <p className="text-xs text-slate-500 text-center mt-4 leading-relaxed">Your teammate opens the link (or signs up and picks <span className="font-medium">Join as staff</span>), verifies their email, and appears here automatically.</p>
                          <button onClick={() => setIsInviting(false)} className="mt-4 w-full text-sm font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white">Done</button>
                        </>
                      )}
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
                     active={activePlan === 'beta'}
                     features={['3 Team Members', 'Cloud-Sync Inventory', 'Sales Tracking', 'Basic Reporting']}
                     onSelect={() => handlePaystackActivation('beta', billingCycle)}
                     icon={<Layout size={24} />}
                  />
                  <PlanCard 
                     title="StockBit Business" 
                     price={billingCycle === 'monthly' ? "₦7,999" : "₦80,000"}
                     cycle={billingCycle === 'monthly' ? "/mo" : "/yr"}
                     desc="The professional choice for growing retail stores."
                     active={activePlan === 'mega'}
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
                     active={activePlan === 'mega_pro'}
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

const ChannelToggle = ({ label, desc, icon, active, onChange, locked }: any) => (
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
      disabled={locked}
      title={locked ? 'Available on Business and Enterprise plans' : undefined}
      className={`w-18 h-10 rounded-full transition-all duration-500 relative shadow-inner shrink-0 ${
        locked ? 'bg-slate-200 dark:bg-slate-700 cursor-not-allowed opacity-70' : active ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'
      }`}
    >
       <motion.div
        animate={{ x: active ? 40 : 4 }}
        className="absolute top-1 w-8 h-8 bg-white rounded-full shadow-2xl flex items-center justify-center"
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
       >
        {locked && <Lock size={12} className="text-slate-400" />}
       </motion.div>
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
