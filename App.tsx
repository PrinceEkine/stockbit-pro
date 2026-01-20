
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { View, User as UserType, SubscriptionPlan, Product } from './types';
import { useStore, getTrialStatus } from './store';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import AIInsights from './pages/AIInsights';
import Stocktake from './pages/Stocktake';
import Sales from './pages/Sales';
import Returns from './pages/Returns';
import Reports from './pages/Reports';
import Suppliers from './pages/Suppliers';
import SettingsView from './pages/Settings';
import UserManagement from './pages/UserManagement';
import LaunchCenter from './pages/LaunchCenter';
import LandingPage from './pages/LandingPage';
import NotificationPanel from './components/NotificationPanel';
import ScannerModal from './components/ScannerModal';
import AboutUs from './pages/AboutUs';
import HelpCenter from './pages/HelpCenter';
import TermsOfService from './pages/TermsOfService';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Governance from './pages/Governance';
import { 
  Menu, Bell, Box, Loader2, 
  Eye, EyeOff, ShieldAlert,
  LogIn, Wifi, WifiOff,
  CheckCircle2,
  ShieldCheck,
  Moon,
  Sun,
  ShieldEllipsis,
  UserPlus,
  Clock,
  Scan,
  MailCheck,
  ArrowRight,
  ChevronLeft,
  ArrowLeft
} from 'lucide-react';

type AuthStep = 'landing' | 'login' | 'register' | 'forgot' | 'verify_otp' | 'update_password';

const App: React.FC = () => {
  // Fix: Set initial view to Landing so reloads/entry start there
  const [activeView, setActiveView] = useState<View>(View.Landing);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1024);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [authStep, setAuthStep] = useState<AuthStep>('landing');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingEmail, setPendingEmail] = useState('');
  const [otpPurpose, setOtpPurpose] = useState<'signup' | 'recovery'>('signup');
  const [isStaffReg, setIsStaffReg] = useState(false);
  
  const [cameraAvailable, setCameraAvailable] = useState(false);
  const [globalScannerActive, setGlobalScannerActive] = useState(false);
  const [lastScannedProduct, setLastScannedProduct] = useState<Product | null>(null);

  const store = useStore();
  const notificationRef = useRef<HTMLDivElement>(null);
  const barcodeBuffer = useRef<string>('');
  const lastKeyTime = useRef<number>(0);

  // Hash-based direct view navigation
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#', '').toLowerCase();
      if (hash === 'about') setActiveView(View.AboutUs);
      else if (hash === 'help') setActiveView(View.HelpCenter);
      else if (hash === 'legal') setActiveView(View.TermsOfService);
      else if (hash === 'privacy') setActiveView(View.PrivacyPolicy);
      else if (hash === 'governance') setActiveView(View.Governance);
      else if (hash === 'dashboard' && store.isLoggedIn) setActiveView(View.Dashboard);
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, [store.isLoggedIn]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const now = Date.now();
      if (now - lastKeyTime.current > 50) {
        barcodeBuffer.current = '';
      }
      
      if (e.key === 'Enter') {
        if (barcodeBuffer.current.length > 2) {
          handleGlobalScan(barcodeBuffer.current);
          barcodeBuffer.current = '';
        }
      } else if (e.key.length === 1) {
        barcodeBuffer.current += e.key;
      }
      lastKeyTime.current = now;
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [store.products, activeView]);

  useEffect(() => {
    const checkCamera = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const hasVideo = devices.some(device => device.kind === 'videoinput');
        setCameraAvailable(hasVideo);
      } catch (e) {
        setCameraAvailable(false);
      }
    };
    checkCamera();
  }, []);

  const handleGlobalScan = (sku: string) => {
    const product = store.products.find(p => p.sku === sku);
    if (product) {
      setLastScannedProduct(product);
      setTimeout(() => setLastScannedProduct(null), 3000);
    }
  };

  useEffect(() => {
    const root = window.document.documentElement;
    if (root) {
      if (store.settings.theme === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  }, [store.settings.theme]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.addEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const trialStatus = useMemo(() => getTrialStatus(store.currentUser), [store.currentUser]);

  useEffect(() => {
    if (store.currentUser?.role === 'staff') {
      const allowedViews = [View.Dashboard, View.Sales, View.AboutUs, View.HelpCenter, View.TermsOfService, View.PrivacyPolicy, View.Governance, View.Landing];
      if (!allowedViews.includes(activeView)) {
        setActiveView(View.Dashboard);
      }
    }
  }, [store.currentUser, activeView]);

  const toggleTheme = () => {
    store.updateSettings({ theme: store.settings.theme === 'light' ? 'dark' : 'light' });
  };

  const handleLoginSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAuthError('');
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      const { error } = await store.login(email, password);
      if (error) {
        setAuthError(error.message);
        setIsSubmitting(false);
      } else {
        setActiveView(View.Dashboard);
      }
    } catch (err: any) {
      setAuthError("Auth protocol failure.");
      setIsSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAuthError('');
    setIsSubmitting(true);
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const name = formData.get('name') as string;
    const companyName = formData.get('companyName') as string || '';
    const inviteId = isStaffReg ? (formData.get('inviteId') as string) : null;

    try {
      const res = await store.register({
        email,
        password,
        name,
        companyName,
        inviteId
      });

      if (res.error) {
        setAuthError(res.error.message);
        setIsSubmitting(false);
      } else {
        setPendingEmail(email);
        setOtpPurpose('signup');
        setAuthStep('verify_otp');
        setIsSubmitting(false);
      }
    } catch (err: any) {
      setAuthError("Registration failure.");
      setIsSubmitting(false);
    }
  };

  const handleLogout = useCallback(async () => {
    setAuthStep('landing');
    await store.logout();
    setActiveView(View.Landing);
  }, [store.logout]);

  if (store.loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 gap-6">
        <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
        <p className="text-slate-400 dark:text-slate-500 font-bold text-[10px] uppercase tracking-[0.3em] animate-pulse text-center">Entering StockBit Pro...</p>
      </div>
    );
  }

  const isInfoView = [View.AboutUs, View.HelpCenter, View.TermsOfService, View.PrivacyPolicy, View.Governance].includes(activeView);

  // AUTH SCREENS (FULL PAGE)
  if (!store.isLoggedIn || activeView === View.Landing) {
    if (activeView === View.Landing && authStep === 'landing') {
      return <LandingPage onAuth={(step) => { setAuthStep(step); setActiveView(View.Landing); }} onNavigateInfo={setActiveView} />;
    }

    if (isInfoView) {
      return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
           <nav className="fixed top-0 w-full z-50 bg-white/70 dark:bg-slate-950/70 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800">
            <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
              <button onClick={() => { setActiveView(View.Landing); setAuthStep('landing'); window.location.hash = ''; }} className="flex items-center gap-3 group">
                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform">
                  <Box size={24} className="text-white" />
                </div>
                <span className="font-black text-xl tracking-tighter uppercase dark:text-white">StockBit Pro</span>
              </button>
              <button onClick={() => { setAuthStep('login'); setActiveView(View.Landing); }} className="px-6 py-2.5 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all">Portal Access</button>
            </div>
          </nav>
          <div className="pt-32 pb-20 px-6 max-w-4xl mx-auto">
             {activeView === View.AboutUs && <AboutUs />}
             {activeView === View.HelpCenter && <HelpCenter />}
             {activeView === View.TermsOfService && <TermsOfService />}
             {activeView === View.PrivacyPolicy && <PrivacyPolicy />}
             {activeView === View.Governance && <Governance />}
          </div>
        </div>
      );
    }

    // Login/Register modals for unauthenticated or landing-auth-triggers
    if (!store.isLoggedIn) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-950 p-4">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[3rem] p-8 md:p-20 shadow-2xl animate-in zoom-in-95 duration-500">
            <div className="flex flex-col items-center mb-12 text-center">
              <button onClick={() => { setAuthStep('landing'); setActiveView(View.Landing); }} className="w-20 h-20 bg-indigo-600 rounded-[2rem] flex items-center justify-center mb-6 shadow-xl shadow-indigo-600/20 active:scale-95 transition-all">
                <Box size={40} className="text-white" />
              </button>
              <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight uppercase">StockBit Pro</h1>
              <p className="text-[12px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-[0.3em] mt-2">cloud inventory management</p>
            </div>

            {authError && (
              <div className="mb-8 p-4 bg-rose-50 dark:bg-rose-900/30 border border-rose-100 dark:border-rose-900 rounded-2xl text-[11px] font-bold text-rose-600 flex items-center gap-3">
                <ShieldAlert size={18} className="shrink-0" /> {authError}
              </div>
            )}

            {authStep === 'login' && (
              <form onSubmit={handleLoginSubmit} className="space-y-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1 block">Authorized Email</label>
                  <input name="email" type="email" required className="w-full px-8 py-5 bg-slate-100 dark:bg-slate-800 border-none rounded-[1.5rem] font-bold dark:text-white focus:ring-2 focus:ring-indigo-600 transition-all text-lg" placeholder="admin@shop.com" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Password</label>
                    <button type="button" onClick={() => setAuthStep('forgot')} className="text-[10px] font-black text-indigo-600 hover:text-indigo-700 uppercase tracking-widest">Lost Access?</button>
                  </div>
                  <div className="relative">
                    <input name="password" type={showPassword ? "text" : "password"} required className="w-full px-8 py-5 bg-slate-100 dark:bg-slate-800 border-none rounded-[1.5rem] font-bold dark:text-white focus:ring-2 focus:ring-indigo-600 transition-all text-lg" placeholder="••••••••" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 p-2 hover:text-indigo-600 transition-colors">
                      {showPassword ? <EyeOff size={24} /> : <Eye size={24} />}
                    </button>
                  </div>
                </div>
                <button disabled={isSubmitting} type="submit" className="w-full py-6 bg-indigo-600 text-white font-black uppercase tracking-widest text-sm rounded-[1.5rem] shadow-2xl shadow-indigo-600/30 active:scale-95 transition-all flex items-center justify-center gap-4">
                  {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <LogIn size={20} />}
                  {isSubmitting ? 'Verifying...' : 'Sign In'}
                </button>
                <div className="pt-6 text-center">
                  <p className="text-[12px] font-bold text-slate-400 uppercase tracking-wider">
                    New enterprise? <button type="button" onClick={() => setAuthStep('register')} className="text-indigo-600 hover:underline font-black">Register Business</button>
                  </p>
                </div>
              </form>
            )}

            {authStep === 'register' && (
              <form onSubmit={handleRegisterSubmit} className="space-y-6">
                <div className="bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl flex mb-6">
                  <button type="button" onClick={() => setIsStaffReg(false)} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${!isStaffReg ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-400'}`}>Business Owner</button>
                  <button type="button" onClick={() => setIsStaffReg(true)} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isStaffReg ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-400'}`}>Staff Member</button>
                </div>
                <div className="space-y-4">
                  <input name="name" placeholder="Full Name" required className="w-full px-8 py-5 bg-slate-100 dark:bg-slate-800 rounded-2xl border-none font-bold dark:text-white focus:ring-2 focus:ring-indigo-600 transition-all" />
                  {isStaffReg ? (
                    <input name="inviteId" placeholder="Invite ID (from owner)" required className="w-full px-8 py-5 bg-slate-100 dark:bg-slate-800 rounded-2xl border-none font-bold dark:text-white focus:ring-2 focus:ring-indigo-600 transition-all" />
                  ) : (
                    <input name="companyName" placeholder="Business Name" required className="w-full px-8 py-5 bg-slate-100 dark:bg-slate-800 rounded-2xl border-none font-bold dark:text-white focus:ring-2 focus:ring-indigo-600 transition-all" />
                  )}
                  <input name="email" type="email" placeholder="Email Address" required className="w-full px-8 py-5 bg-slate-100 dark:bg-slate-800 rounded-2xl border-none font-bold dark:text-white focus:ring-2 focus:ring-indigo-600 transition-all" />
                  <input name="password" type="password" placeholder="Password" required className="w-full px-8 py-5 bg-slate-100 dark:bg-slate-800 rounded-2xl border-none font-bold dark:text-white focus:ring-2 focus:ring-indigo-600 transition-all" />
                </div>
                <button disabled={isSubmitting} type="submit" className="w-full py-6 bg-indigo-600 text-white font-black uppercase tracking-widest text-sm rounded-[1.5rem] shadow-2xl flex items-center justify-center gap-4 active:scale-95 transition-all">
                  {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <UserPlus size={20} />}
                  {isSubmitting ? 'Registering...' : 'Sign Up'}
                </button>
                <button type="button" onClick={() => setAuthStep('login')} className="w-full text-[12px] font-black text-slate-400 hover:text-indigo-600 uppercase tracking-widest text-center flex items-center justify-center gap-3">
                  <ChevronLeft size={18} /> Back to Sign In
                </button>
              </form>
            )}

            {authStep === 'verify_otp' && (
              <div className="space-y-10 text-center">
                <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner animate-pulse">
                  <MailCheck size={40} />
                </div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Verification Dispatched</h3>
                <p className="text-[12px] text-slate-500 dark:text-slate-400 font-bold uppercase mt-4 leading-relaxed">
                  We've sent a link to:<br/>
                  <span className="text-slate-900 dark:text-white break-all">{pendingEmail}</span>
                </p>
                <button onClick={() => setAuthStep('login')} className="w-full py-6 bg-indigo-600 text-white font-black uppercase text-sm rounded-[1.5rem] shadow-xl active:scale-95 transition-all flex items-center justify-center gap-4">
                  Proceed to Login <ArrowRight size={20} />
                </button>
              </div>
            )}

            {authStep === 'forgot' && (
              <form onSubmit={async (e) => {
                e.preventDefault();
                setAuthError('');
                setIsSubmitting(true);
                const email = new FormData(e.currentTarget).get('email') as string;
                const res = await store.resetPassword(email);
                if (res.error) {
                  setAuthError(res.error.message);
                  setIsSubmitting(false);
                } else {
                  setPendingEmail(email);
                  setOtpPurpose('recovery');
                  setAuthStep('verify_otp');
                  setIsSubmitting(false);
                }
              }} className="space-y-8">
                <div className="text-center mb-8">
                  <ShieldEllipsis size={48} className="mx-auto text-indigo-600 mb-6" />
                  <h3 className="text-2xl font-black uppercase tracking-tighter">Account Recovery</h3>
                </div>
                <input name="email" type="email" required className="w-full px-8 py-5 bg-slate-100 dark:bg-slate-800 border-none rounded-2xl font-bold dark:text-white focus:ring-2 focus:ring-indigo-600 transition-all text-lg" placeholder="Registered Email" />
                <button disabled={isSubmitting} type="submit" className="w-full py-6 bg-indigo-600 text-white font-black uppercase text-sm rounded-[1.5rem] shadow-xl">
                  {isSubmitting ? 'Processing...' : 'Send Recovery Email'}
                </button>
                <button type="button" onClick={() => setAuthStep('login')} className="w-full text-[12px] font-black text-slate-400 uppercase tracking-widest text-center">
                  Back to Login
                </button>
              </form>
            )}

            <footer className="mt-16 text-center border-t border-slate-50 dark:border-slate-800 pt-8">
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.4em] opacity-30">Powered by StockBit Intelligence v4.2</p>
            </footer>
          </div>
        </div>
      );
    }
  }

  const renderView = () => {
    switch (activeView) {
      case View.Dashboard: return <Dashboard state={store} onNavigate={setActiveView} />;
      case View.Inventory: return <Inventory products={store.products} suppliers={store.suppliers} onAdd={store.addProduct} onUpdate={store.updateProduct} onDelete={store.deleteProduct} settings={store.settings} currentUser={store.currentUser} />;
      case View.AIInsights: return <AIInsights state={store} />;
      case View.Stocktake: return <Stocktake products={store.products} onReconcile={store.reconcileInventory} />;
      case View.Sales: return <Sales sales={store.sales} products={store.products} onRecordSale={store.recordSale} settings={store.settings} currentUser={store.currentUser} />;
      case View.Returns: return <Returns returns={store.returns} products={store.products} onRecordReturn={store.recordReturn} settings={store.settings} />;
      case View.Reports: return <Reports state={store} />;
      case View.Suppliers: return <Suppliers suppliers={store.suppliers} onAdd={store.addSupplier} onUpdate={() => {}} onDelete={() => {}} />;
      case View.Settings: return <SettingsView settings={store.settings} onUpdate={store.updateSettings} staff={store.users} currentUser={store.currentUser} onAddStaff={store.addStaffMember} onRemoveStaff={store.removeStaffMember} onActivateSubscription={async (plan: SubscriptionPlan, cycle: 'monthly' | 'annual') => { await store.activateSubscription(plan, cycle); }} />;
      case View.LaunchCenter: return <LaunchCenter state={store} onUpdateSettings={store.updateSettings} />;
      case View.UserManagement: return <UserManagement users={store.users} onUpdatePlan={async (id, t) => { await store.activateSubscription(t === 'revoke' ? 'beta' : 'mega', t === 'annual' ? 'annual' : 'monthly', id); return true; }} onAssignParent={store.assignParentToUser} />;
      case View.AboutUs: return <AboutUs />;
      case View.HelpCenter: return <HelpCenter />;
      case View.TermsOfService: return <TermsOfService />;
      case View.PrivacyPolicy: return <PrivacyPolicy />;
      case View.Governance: return <Governance />;
      default: return <Dashboard state={store} onNavigate={setActiveView} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors overflow-x-hidden">
      <Sidebar activeView={activeView} onViewChange={setActiveView} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} user={store.currentUser} onLogout={handleLogout} />
      <main className={`flex-1 flex flex-col min-w-0 relative transition-all duration-500 ease-in-out ${isSidebarOpen ? 'lg:pl-72' : 'pl-0'}`}>
        <header className="no-print h-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800 px-3 md:px-10 flex items-center justify-between sticky top-0 z-30 transition-colors">
          <div className="flex items-center gap-2 md:gap-5 min-w-0">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 md:p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl transition-transform active:scale-95 shrink-0">
              <Menu size={20} />
            </button>
            <div className="flex flex-col min-w-0">
              {isInfoView ? (
                <button 
                  onClick={() => setActiveView(View.Dashboard)}
                  className="flex items-center gap-2 text-indigo-600 font-black uppercase text-[10px] tracking-widest hover:translate-x-[-4px] transition-transform"
                >
                  <ArrowLeft size={14} /> Back to Terminal
                </button>
              ) : (
                <>
                  <h1 className="font-black text-slate-900 dark:text-white tracking-tight truncate max-w-[100px] sm:max-w-xs uppercase text-[12px] md:text-base leading-none">{store.currentUser?.companyName}</h1>
                  {!trialStatus.isSubscribed && (
                     <span className="text-[8px] md:text-[9px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest flex items-center gap-1 shrink-0 mt-1">
                        <Clock size={10} /> {trialStatus.daysLeft}d Trial left
                     </span>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 md:gap-4 shrink-0">
            {cameraAvailable && !isInfoView && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-xl mr-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Scanner Standby</span>
                <button onClick={() => setGlobalScannerActive(true)} className="p-1 text-emerald-600 hover:scale-110 transition-transform">
                  <Scan size={14} />
                </button>
              </div>
            )}
            <button onClick={toggleTheme} className="p-2 md:p-2.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors rounded-xl">
              {store.settings.theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>
            <div className="hidden sm:flex items-center gap-3 pl-2 border-l border-slate-200 dark:border-slate-800">
              <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-black text-xs">
                {store.currentUser?.name?.charAt(0)}
              </div>
            </div>
            <div className="relative" ref={notificationRef}>
              <button onClick={() => setIsNotificationOpen(!isNotificationOpen)} className="p-2 md:p-3 text-slate-400 hover:text-indigo-600 relative transition-colors">
                <Bell size={20} />
                {store.notifications.filter(n => !n.read).length > 0 && <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white dark:border-slate-900"></span>}
              </button>
              {isNotificationOpen && <NotificationPanel notifications={store.notifications} onClose={() => setIsNotificationOpen(false)} onMarkRead={() => {}} onClear={() => {}} />}
            </div>
          </div>
        </header>

        {lastScannedProduct && (
          <div className="fixed bottom-10 right-10 z-[100] bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-2xl border border-emerald-100 dark:border-emerald-800 animate-in slide-in-from-right-10 flex items-center gap-4">
            <div className="w-10 h-10 bg-emerald-500 text-white rounded-xl flex items-center justify-center shadow-lg">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Detected SKU: {lastScannedProduct.sku}</p>
              <p className="text-sm font-black text-slate-900 dark:text-white uppercase">{lastScannedProduct.name}</p>
            </div>
          </div>
        )}

        <div className="p-2 md:p-10 flex-1 overflow-x-hidden min-h-0">
          {renderView()}
        </div>

        {globalScannerActive && (
          <ScannerModal 
            onScan={(res) => {
              const sku = typeof res === 'string' ? res : res?.sku;
              if (sku) handleGlobalScan(sku);
            }} 
            onClose={() => setGlobalScannerActive(false)} 
          />
        )}
      </main>
    </div>
  );
};

export default App;
