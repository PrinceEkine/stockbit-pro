
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
  ArrowLeft,
  DownloadCloud,
  Share
} from 'lucide-react';

type AuthStep = 'landing' | 'login' | 'register' | 'forgot' | 'verify_otp' | 'update_password';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<View>(View.Landing);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1024);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [authStep, setAuthStep] = useState<AuthStep>('landing');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');
  
  const [cameraAvailable, setCameraAvailable] = useState(false);
  const [globalScannerActive, setGlobalScannerActive] = useState(false);
  const [lastScannedProduct, setLastScannedProduct] = useState<Product | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  const store = useStore();
  const notificationRef = useRef<HTMLDivElement>(null);
  const barcodeBuffer = useRef<string>('');
  const lastKeyTime = useRef<number>(0);

  const isInfoView = useMemo(() => {
    const list = [
      View.AboutUs, 
      View.HelpCenter, 
      View.TermsOfService, 
      View.PrivacyPolicy, 
      View.Governance
    ];
    return list.includes(activeView);
  }, [activeView]);

  // Handle PWA Install Prompt
  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallApp = async () => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;

    if (isStandalone) {
      alert("StockBit Pro Terminal is already installed and running as a standalone app.");
      return;
    }

    if (isIOS) {
      alert("To install StockBit Pro on iOS:\n1. Tap the Share button in Safari (box with up arrow)\n2. Scroll down and tap 'Add to Home Screen'\n3. Tap 'Add' to deploy the terminal.");
      return;
    }

    if (!deferredPrompt) {
      alert("Installation protocol not triggered by browser yet. Ensure you are using a supported browser (Chrome/Edge/Android) and have a stable connection. Or manually use 'Install App' in browser settings.");
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  useEffect(() => {
    setIsSubmitting(false);
    setAuthError('');
  }, [authStep]);

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
      if (now - lastKeyTime.current > 50) barcodeBuffer.current = '';
      if (e.key === 'Enter') {
        if (barcodeBuffer.current.length > 2) {
          const sku = barcodeBuffer.current;
          const product = (store.products || []).find(p => p.sku === sku);
          if (product) {
            setLastScannedProduct(product);
            setTimeout(() => setLastScannedProduct(null), 3000);
          }
          barcodeBuffer.current = '';
        }
      } else if (e.key.length === 1) {
        barcodeBuffer.current += e.key;
      }
      lastKeyTime.current = now;
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [store.products]);

  useEffect(() => {
    const checkCamera = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        setCameraAvailable(devices.some(device => device.kind === 'videoinput'));
      } catch (e) { setCameraAvailable(false); }
    };
    checkCamera();
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    if (root) {
      if (store.settings.theme === 'dark') root.classList.add('dark');
      else root.classList.remove('dark');
    }
  }, [store.settings.theme]);

  const trialStatus = useMemo(() => getTrialStatus(store.currentUser), [store.currentUser]);

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
      if (error) setAuthError(error.message);
      else setActiveView(View.Dashboard);
    } catch (err: any) {
      setAuthError("Auth protocol failure.");
    } finally {
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
    const inviteId = formData.get('inviteId') as string || null;

    try {
      const res = await store.register({ email, password, name, companyName, inviteId });
      if (res.error) setAuthError(res.error.message);
      else {
        setPendingEmail(email);
        setAuthStep('verify_otp');
      }
    } catch (err: any) {
      setAuthError("Registration failure.");
    } finally {
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

  if (!store.isLoggedIn || activeView === View.Landing || isInfoView) {
    if (activeView === View.Landing && authStep === 'landing') {
      return (
        <LandingPage 
          isLoggedIn={store.isLoggedIn}
          onAuth={(step) => { setAuthStep(step); setActiveView(View.Landing); }} 
          onNavigateInfo={setActiveView} 
          onInstall={handleInstallApp}
          onEnterTerminal={() => setActiveView(View.Dashboard)}
        />
      );
    }

    if (isInfoView) {
      return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors">
          <nav className="fixed top-0 w-full z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800">
            <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
              <button onClick={() => { setActiveView(View.Landing); setAuthStep('landing'); window.location.hash = ''; }} className="flex items-center gap-3 group">
                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform">
                  <Box size={24} className="text-white" />
                </div>
                <span className="font-black text-xl tracking-tighter uppercase dark:text-white">StockBit Pro</span>
              </button>
              <div className="flex items-center gap-4">
                {store.isLoggedIn ? (
                  <button onClick={() => setActiveView(View.Dashboard)} className="px-6 py-2.5 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all flex items-center gap-2">
                    <ArrowLeft size={14} /> Back to Terminal
                  </button>
                ) : (
                  <button onClick={() => { setAuthStep('login'); setActiveView(View.Landing); }} className="px-6 py-2.5 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all">Portal Access</button>
                )}
              </div>
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
                <div className="space-y-4">
                  <input name="name" placeholder="Full Name" required className="w-full px-8 py-5 bg-slate-100 dark:bg-slate-800 rounded-2xl border-none font-bold dark:text-white focus:ring-2 focus:ring-indigo-600 transition-all" />
                  <input name="companyName" placeholder="Business Name" required className="w-full px-8 py-5 bg-slate-100 dark:bg-slate-800 rounded-2xl border-none font-bold dark:text-white focus:ring-2 focus:ring-indigo-600 transition-all" />
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
                <p className="text-[12px] text-slate-500 dark:text-slate-400 font-bold uppercase mt-4 leading-relaxed"> sent to <span className="text-slate-900 dark:text-white break-all">{pendingEmail}</span></p>
                <button onClick={() => setAuthStep('login')} className="w-full py-6 bg-indigo-600 text-white font-black uppercase text-sm rounded-[1.5rem] shadow-xl active:scale-95 transition-all">Proceed to Login <ArrowRight size={20} /></button>
              </div>
            )}
          </div>
        </div>
      );
    }
  }

  const renderView = () => {
    const isStaff = store.currentUser?.role === 'staff';
    const staffAllowedViews = [View.Dashboard, View.Sales];
    
    // Strict Guard: If staff attempts to reach any other view, force back to Dashboard
    if (isStaff && !staffAllowedViews.includes(activeView)) {
      return <Dashboard state={store} onNavigate={setActiveView} />;
    }

    switch (activeView) {
      case View.Dashboard: return <Dashboard state={store} onNavigate={setActiveView} />;
      case View.Inventory: return <Inventory products={store.products || []} suppliers={store.suppliers || []} onAdd={store.addProduct} onUpdate={store.updateProduct} onDelete={store.deleteProduct} settings={store.settings} currentUser={store.currentUser} />;
      case View.Sales: return <Sales sales={store.sales || []} products={store.products || []} onRecordSale={store.recordSale} settings={store.settings} currentUser={store.currentUser} />;
      case View.AIInsights: return <AIInsights state={store} />;
      case View.Stocktake: return <Stocktake products={store.products || []} onReconcile={store.reconcileInventory} />;
      case View.Returns: return <Returns returns={store.returns || []} products={store.products || []} onRecordReturn={store.recordReturn} settings={store.settings} />;
      case View.Reports: return <Reports state={store} />;
      case View.Suppliers: return <Suppliers suppliers={store.suppliers || []} onAdd={store.addSupplier} onUpdate={() => {}} onDelete={() => {}} />;
      case View.Settings: return <SettingsView settings={store.settings} onUpdate={store.updateSettings} staff={store.users || []} currentUser={store.currentUser} onAddStaff={store.addStaffMember} onRemoveStaff={store.removeStaffMember} onActivateSubscription={async (plan: SubscriptionPlan, cycle: 'monthly' | 'annual') => { await store.activateSubscription(plan, cycle); }} />;
      case View.LaunchCenter: return <LaunchCenter state={store} onUpdateSettings={store.updateSettings} />;
      default: return <Dashboard state={store} onNavigate={setActiveView} />;
    }
  };

  const isStaff = store.currentUser?.role === 'staff';

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors overflow-x-hidden">
      <Sidebar activeView={activeView} onViewChange={setActiveView} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} user={store.currentUser} onLogout={handleLogout} onInstall={handleInstallApp} />
      <main className={`flex-1 flex flex-col min-w-0 relative transition-all duration-500 ease-in-out ${isSidebarOpen ? 'lg:pl-72' : 'pl-0'}`}>
        <header className="no-print h-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800 px-3 md:px-10 flex items-center justify-between sticky top-0 z-30 transition-colors">
          <div className="flex items-center gap-2 md:gap-5 min-w-0">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 md:p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl transition-transform active:scale-95 shrink-0">
              <Menu size={20} />
            </button>
            <div className="flex flex-col min-w-0">
               <h1 className="font-black text-slate-900 dark:text-white tracking-tight truncate max-w-[100px] sm:max-w-xs uppercase text-[12px] md:text-base leading-none">{store.currentUser?.companyName}</h1>
               {!isStaff && !trialStatus.isSubscribed && (
                  <span className="text-[8px] md:text-[9px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest flex items-center gap-1 shrink-0 mt-1">
                     <Clock size={10} /> {trialStatus.daysLeft}d Trial left
                  </span>
               )}
            </div>
          </div>

          <div className="flex items-center gap-1 md:gap-4 shrink-0">
            <button 
              onClick={handleInstallApp}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-xl mr-2 hover:bg-indigo-100 transition-all active:scale-95"
            >
              <DownloadCloud size={14} />
              <span className="text-[10px] font-black uppercase tracking-widest">Install App</span>
            </button>
            <button onClick={toggleTheme} className="p-2 md:p-2.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors rounded-xl">
              {store.settings.theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>
            <div className="relative">
              <button onClick={() => setIsNotificationOpen(!isNotificationOpen)} className="p-2 md:p-3 text-slate-400 hover:text-indigo-600 relative transition-colors">
                <Bell size={20} />
                {(store.notifications || []).filter(n => !n.read).length > 0 && <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white dark:border-slate-900"></span>}
              </button>
            </div>
          </div>
        </header>

        <div className="p-2 md:p-10 flex-1 overflow-x-hidden min-h-0">
          {renderView()}
        </div>
      </main>
    </div>
  );
};

export default App;
