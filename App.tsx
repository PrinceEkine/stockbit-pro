import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { View, User as UserType, SubscriptionPlan, Product, AppLanguage } from './types';
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
  Share,
  RefreshCw,
  Link,
  Building,
  RotateCcw,
  KeyRound,
  Mail
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
  const [isStaffSignup, setIsStaffSignup] = useState(false);
  
  // PWA & Install state
  const [isAppInstalled, setIsAppInstalled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  const store = useStore();
  const notificationRef = useRef<HTMLDivElement>(null);
  const barcodeBuffer = useRef<string>('');
  const lastKeyTime = useRef<number>(0);

  // Check if app is installed on load
  useEffect(() => {
    const checkInstallStatus = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                          (window.navigator as any).standalone === true ||
                          document.referrer.includes('android-app://');
      setIsAppInstalled(isStandalone);
    };
    
    checkInstallStatus();

    // Re-check on media query change
    const matcher = window.matchMedia('(display-mode: standalone)');
    const onChange = (e: MediaQueryListEvent) => setIsAppInstalled(e.matches);
    matcher.addEventListener('change', onChange);

    window.addEventListener('appinstalled', () => {
      setIsAppInstalled(true);
      setDeferredPrompt(null);
    });
    
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    
    return () => {
      matcher.removeEventListener('change', onChange);
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

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

  const handleInstallApp = async () => {
    if (isAppInstalled) return;
    
    if (!deferredPrompt) {
      alert("To install: Tap the browser menu (3 dots or share icon) and select 'Add to Home Screen'.");
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setIsAppInstalled(true);
    }
  };

  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#', '').toLowerCase();
      if (hash === 'about') setActiveView(View.AboutUs);
      else if (hash === 'help') setActiveView(View.HelpCenter);
      else if (hash === 'legal') setActiveView(View.TermsOfService);
      else if (hash === 'privacy') setActiveView(View.PrivacyPolicy);
      else if (hash === 'governance') setActiveView(View.Governance);
      else if (hash === 'dashboard' && store.isLoggedIn) setActiveView(View.Dashboard);
      else if (hash === 'update_password') setAuthStep('update_password');
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, [store.isLoggedIn]);

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
      if (error) {
        setAuthError("Email or password is not correct. Try again.");
      } else {
        setActiveView(View.Dashboard);
      }
    } catch (err: any) {
      setAuthError("Could not sign in. Please check your internet.");
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
      if (res.error) {
        setAuthError(res.error.message);
      } else {
        setPendingEmail(email);
        setAuthStep('verify_otp');
      }
    } catch (err: any) {
      setAuthError("Account creation failed. Please check your details.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAuthError('');
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;

    try {
      const { error } = await store.resetPassword(email);
      if (error) {
        setAuthError("We couldn't find this email. Please check the spelling.");
      } else {
        setPendingEmail(email);
        setAuthStep('verify_otp');
      }
    } catch (err: any) {
      setAuthError("Something went wrong. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = useCallback(() => {
    setActiveView(View.Landing);
    setAuthStep('landing');
    store.logout();
  }, [store.logout]);

  const handleManualOverride = () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = '/';
  };

  if (store.loading) {
    return (
      <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center p-6 gap-6 transition-colors">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-indigo-900/20 border-t-indigo-500 rounded-full animate-spin shadow-2xl"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Box size={24} className="text-indigo-500 animate-pulse" />
          </div>
        </div>
        <div className="text-center space-y-5">
          <p className="text-indigo-500/60 font-black text-[11px] uppercase tracking-[0.2em] animate-pulse">Opening Your Shop...</p>
          <div className="flex flex-col items-center gap-3">
              <button 
                onClick={handleManualOverride} 
                className="px-5 py-2.5 bg-slate-900 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all border border-slate-800"
              >
                <RotateCcw size={11} className="inline mr-2"/> Start Over
              </button>
          </div>
        </div>
      </div>
    );
  }

  if (!store.isLoggedIn || activeView === View.Landing || isInfoView) {
    if (isInfoView) {
      return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors flex flex-col">
          <nav className="fixed top-0 w-full z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 h-20 pt-[env(safe-area-inset-top)] box-content">
            <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
              <button onClick={() => { setActiveView(View.Landing); setAuthStep('landing'); }} className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#4f46e5] rounded-xl flex items-center justify-center shadow-lg"><Box size={22} className="text-white" /></div>
                <span className="font-black text-xl uppercase dark:text-white">StockBit Pro</span>
              </button>
              {store.isLoggedIn ? (
                <button onClick={() => setActiveView(View.Dashboard)} className="px-6 py-2.5 bg-[#4f46e5] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all flex items-center gap-2">
                  <ArrowLeft size={14} /> Back to Dashboard
                </button>
              ) : (
                <button onClick={() => { setAuthStep('login'); setActiveView(View.Landing); }} className="px-6 py-2.5 bg-[#4f46e5] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest">Sign In</button>
              )}
            </div>
          </nav>
          <div className="pt-36 pb-20 px-6 max-w-4xl mx-auto flex-1 w-full">
             {activeView === View.AboutUs && <AboutUs />}
             {activeView === View.HelpCenter && <HelpCenter />}
             {activeView === View.TermsOfService && <TermsOfService />}
             {activeView === View.PrivacyPolicy && <PrivacyPolicy />}
             {activeView === View.Governance && <Governance />}
          </div>
        </div>
      );
    }

    if (authStep === 'landing') {
      return (
        <LandingPage 
          isLoggedIn={store.isLoggedIn}
          isAppInstalled={isAppInstalled}
          language={store.settings.language}
          onLanguageChange={(lang: AppLanguage) => store.updateSettings({ language: lang })}
          onAuth={(step) => { setAuthStep(step); setActiveView(View.Landing); }} 
          onNavigateInfo={setActiveView} 
          onInstall={handleInstallApp}
          onEnterTerminal={() => setActiveView(View.Dashboard)}
        />
      );
    }

    if (!store.isLoggedIn) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-950 p-4 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] relative overflow-hidden transition-colors duration-500">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[3.5rem] p-8 md:p-16 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] animate-in zoom-in-95 duration-500 relative z-10 border border-slate-100 dark:border-slate-800 overflow-y-auto max-h-[95vh] scrollbar-hide">
             
             <div className="flex flex-col items-center mb-12 text-center">
                <div className="w-20 h-20 bg-[#4f46e5] rounded-[1.5rem] flex items-center justify-center mb-6 shadow-2xl shadow-indigo-600/20 active:scale-95 transition-all" onClick={() => { setAuthStep('landing'); setActiveView(View.Landing); }}>
                  <Box size={40} className="text-white" />
                </div>
                <h1 className="text-4xl font-black uppercase tracking-tight text-slate-900 dark:text-white leading-none">
                  STOCKBIT PRO
                </h1>
                <p className="text-[12px] text-slate-400 font-black uppercase tracking-[0.2em] mt-3">
                  {authStep === 'forgot' ? 'Find Your Account' : authStep === 'verify_otp' ? 'Verification Step' : 'SIGN IN TO YOUR SHOP'}
                </p>
             </div>

             {authError && (
               <div className="mb-8 p-5 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800 rounded-2xl flex items-center gap-4 text-rose-600 dark:text-rose-400 animate-in slide-in-from-top-2">
                 <ShieldAlert size={20} className="shrink-0" />
                 <p className="text-xs font-bold uppercase tracking-tight leading-relaxed">{authError}</p>
               </div>
             )}

             {authStep === 'login' && (
               <form onSubmit={handleLoginSubmit} className="space-y-8">
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-widest text-slate-400 mb-3 ml-1">EMAIL ADDRESS</label>
                    <input 
                      name="email" 
                      type="email" 
                      required 
                      className="w-full px-8 py-5 bg-slate-50 dark:bg-slate-800 rounded-[1.8rem] font-bold text-slate-900 dark:text-white border-none focus:ring-4 focus:ring-indigo-600/10 outline-none transition-all placeholder:text-slate-400" 
                      placeholder="name@email.com" 
                    />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-3 ml-1">
                      <label className="block text-[11px] font-black uppercase tracking-widest text-slate-400">PASSWORD</label>
                      <button type="button" onClick={() => setAuthStep('forgot')} className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-widest hover:underline">FORGOT PASSWORD?</button>
                    </div>
                    <div className="relative group">
                      <input 
                        name="password" 
                        type={showPassword ? "text" : "password"} 
                        required 
                        className="w-full px-8 py-5 bg-slate-50 dark:bg-slate-800 rounded-[1.8rem] font-bold text-slate-900 dark:text-white border-none focus:ring-4 focus:ring-indigo-600/10 outline-none transition-all placeholder:text-slate-400" 
                        placeholder="••••••••" 
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 hover:text-indigo-600 transition-colors p-2"
                      >
                        {showPassword ? <EyeOff size={24} /> : <Eye size={24} />}
                      </button>
                    </div>
                  </div>
                  
                  <button disabled={isSubmitting} type="submit" className="w-full py-6 bg-[#4f46e5] text-white font-black uppercase tracking-[0.2em] text-[13px] rounded-[2rem] shadow-2xl shadow-indigo-600/30 active:scale-[0.98] transition-all flex items-center justify-center gap-4 disabled:opacity-70 group">
                    {isSubmitting ? <Loader2 className="animate-spin" size={22} /> : <LogIn size={22} className="group-hover:translate-x-1 transition-transform" />}
                    {isSubmitting ? 'SYNCING...' : 'SIGN IN NOW'}
                  </button>
                  <div className="pt-6 text-center">
                    <p className="text-[12px] font-black uppercase text-slate-400 tracking-widest">
                      New business? <button type="button" onClick={() => { setAuthStep('register'); setAuthError(''); setShowPassword(false); }} className="text-[#4f46e5] dark:text-indigo-400 hover:underline">Create Shop</button>
                    </p>
                  </div>
               </form>
             )}

             {authStep === 'register' && (
               <form onSubmit={handleRegisterSubmit} className="space-y-6 animate-in fade-in slide-in-from-right-4">
                  <div className="flex bg-slate-50 dark:bg-slate-800 p-1.5 rounded-[1.8rem] mb-6">
                    <button type="button" onClick={() => setIsStaffSignup(false)} className={`flex-1 py-4 rounded-[1.4rem] text-[11px] font-black uppercase tracking-widest transition-all ${!isStaffSignup ? 'bg-white dark:bg-slate-700 text-[#4f46e5] shadow-[0_4px_12px_rgba(0,0,0,0.05)]' : 'text-slate-400'}`}>OWNER</button>
                    <button type="button" onClick={() => setIsStaffSignup(true)} className={`flex-1 py-4 rounded-[1.4rem] text-[11px] font-black uppercase tracking-widest transition-all ${isStaffSignup ? 'bg-white dark:bg-slate-700 text-[#4f46e5] shadow-[0_4px_12px_rgba(0,0,0,0.05)]' : 'text-slate-400'}`}>STAFF</button>
                  </div>

                  <div className="space-y-4">
                    <input name="name" type="text" required className="w-full px-8 py-5 bg-slate-50 dark:bg-slate-800 rounded-[1.8rem] font-bold text-slate-900 dark:text-white border-none focus:ring-4 focus:ring-indigo-600/10 outline-none transition-all placeholder:text-slate-400" placeholder="Full Name" />

                    {isStaffSignup ? (
                      <input name="inviteId" type="text" required className="w-full px-8 py-5 bg-slate-50 dark:bg-slate-800 rounded-[1.8rem] font-bold text-slate-900 dark:text-white border-none focus:ring-4 focus:ring-indigo-600/10 outline-none transition-all placeholder:text-slate-400" placeholder="Business Invite ID" />
                    ) : (
                      <input name="companyName" type="text" required className="w-full px-8 py-5 bg-slate-50 dark:bg-slate-800 rounded-[1.8rem] font-bold text-slate-900 dark:text-white border-none focus:ring-4 focus:ring-indigo-600/10 outline-none transition-all placeholder:text-slate-400" placeholder="Shop Name" />
                    )}

                    <input name="email" type="email" required className="w-full px-8 py-5 bg-slate-50 dark:bg-slate-800 rounded-[1.8rem] font-bold text-slate-900 dark:text-white border-none focus:ring-4 focus:ring-indigo-600/10 outline-none transition-all placeholder:text-slate-400" placeholder="Email Address" />
                    
                    <div className="relative">
                      <input 
                        name="password" 
                        type={showPassword ? "text" : "password"} 
                        required 
                        className="w-full px-8 py-5 bg-slate-50 dark:bg-slate-800 rounded-[1.8rem] font-bold text-slate-900 dark:text-white border-none focus:ring-4 focus:ring-indigo-600/10 outline-none transition-all placeholder:text-slate-400" 
                        placeholder="Choose Password" 
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 hover:text-indigo-600 transition-colors p-2"
                      >
                        {showPassword ? <EyeOff size={24} /> : <Eye size={24} />}
                      </button>
                    </div>
                  </div>

                  <button disabled={isSubmitting} type="submit" className="w-full py-6 bg-[#4f46e5] text-white font-black uppercase tracking-[0.2em] text-[13px] rounded-[2rem] shadow-2xl active:scale-[0.98] transition-all flex items-center justify-center gap-4 mt-4">
                    {isSubmitting ? <Loader2 className="animate-spin" size={22} /> : <UserPlus size={22} />}
                    {isSubmitting ? 'PROVISIONING...' : 'REGISTER BUSINESS'}
                  </button>

                  <div className="pt-6 text-center">
                    <button type="button" onClick={() => { setAuthStep('login'); setAuthError(''); setShowPassword(false); }} className="text-[11px] font-black uppercase text-slate-400 hover:text-[#4f46e5] tracking-[0.1em] flex items-center justify-center gap-2 mx-auto transition-colors">
                      <ChevronLeft size={16} /> BACK TO SIGN IN
                    </button>
                  </div>
               </form>
             )}

             {authStep === 'forgot' && (
               <form onSubmit={handleResetSubmit} className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                  <div className="text-center space-y-2 mb-4">
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Password Recovery</p>
                    <p className="text-[10px] text-slate-400 font-medium leading-relaxed">Enter your email to receive a secure recovery link to reset your account.</p>
                  </div>
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-widest text-slate-400 mb-3 ml-1">Email Address</label>
                    <input name="email" type="email" required className="w-full px-8 py-5 bg-slate-50 dark:bg-slate-800 rounded-[1.8rem] font-bold text-slate-900 dark:text-white border-none focus:ring-4 focus:ring-indigo-600/10 outline-none transition-all placeholder:text-slate-400" placeholder="name@email.com" />
                  </div>
                  <button disabled={isSubmitting} type="submit" className="w-full py-6 bg-[#4f46e5] text-white font-black uppercase tracking-[0.2em] text-[13px] rounded-[2rem] shadow-2xl active:scale-[0.98] transition-all flex items-center justify-center gap-3">
                    {isSubmitting ? <Loader2 className="animate-spin" size={22} /> : <Mail size={22} />}
                    {isSubmitting ? 'Sending...' : 'Send Recovery Link'}
                  </button>
                  <button type="button" onClick={() => { setAuthStep('login'); setAuthError(''); }} className="w-full text-[11px] font-black uppercase text-slate-400 tracking-widest flex items-center justify-center gap-2 hover:text-[#4f46e5] transition-colors">
                    <ChevronLeft size={16} /> Return to Sign In
                  </button>
               </form>
             )}

             {authStep === 'verify_otp' && (
               <div className="space-y-8 text-center animate-in zoom-in-95 duration-500">
                  <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner"><MailCheck size={40} /></div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Check Your Email</h3>
                  <p className="text-sm text-slate-500 font-medium leading-relaxed">We sent a verification link to <span className="text-indigo-600 dark:text-indigo-400 font-black">{pendingEmail}</span>. Please click it to finalize your deployment.</p>
                  <button onClick={() => setAuthStep('login')} className="w-full py-6 bg-[#4f46e5] text-white font-black uppercase text-[12px] rounded-[2rem] shadow-2xl active:scale-95 transition-all">Continue to Login</button>
               </div>
             )}
          </div>
          
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10">
             <button onClick={() => { setAuthStep('landing'); setActiveView(View.Landing); }} className="text-[10px] font-black uppercase text-slate-400 hover:text-[#4f46e5] tracking-[0.4em] flex items-center gap-3 transition-all opacity-50 hover:opacity-100">
               Return To StockBit Home
             </button>
          </div>
        </div>
      );
    }
  }

  // Loading screen for data sync
  if (!store.initialLoadComplete) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center p-6 gap-8">
        <div className="w-20 h-20 bg-[#4f46e5] rounded-[1.5rem] flex items-center justify-center shadow-[0_0_40px_rgba(79,70,229,0.3)] animate-pulse"><Box size={40} className="text-white" /></div>
        <div className="text-center space-y-4">
           <h2 className="text-white font-black uppercase tracking-widest text-xl">Loading Shop Data</h2>
           <div className="flex flex-col items-center gap-3">
              <div className="flex items-center gap-2">
                <RefreshCw size={12} className="text-indigo-400 animate-spin" />
                <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Connecting to your store...</p>
              </div>
              <button 
                onClick={handleManualOverride} 
                className="text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors"
              >
                Cancel & Start Over
              </button>
           </div>
        </div>
      </div>
    );
  }

  const renderView = () => {
    const isStaff = store.currentUser?.role === 'staff';
    const staffAllowedViews = [View.Dashboard, View.Sales];
    if (isStaff && !staffAllowedViews.includes(activeView)) return <Dashboard state={store} onNavigate={setActiveView} />;

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

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors overflow-x-hidden flex-col">
      <Sidebar activeView={activeView} onViewChange={setActiveView} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} user={store.currentUser} onLogout={handleLogout} onInstall={handleInstallApp} isAppInstalled={isAppInstalled} settings={store.settings} />
      <main className={`flex-1 flex flex-col min-w-0 relative transition-all duration-500 ease-in-out ${isSidebarOpen ? 'lg:pl-72' : 'pl-0'}`}>
        <header className="no-print bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800 px-4 md:px-10 flex items-center justify-between sticky top-0 z-30 transition-colors pt-[env(safe-area-inset-top)] box-content h-20">
          <div className="flex items-center gap-3 md:gap-5 min-w-0">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl active:scale-95 shrink-0">
              <Menu size={20} />
            </button>
            <div className="flex flex-col min-w-0">
               <h1 className="font-black text-slate-900 dark:text-white tracking-tight truncate max-w-[120px] sm:max-w-xs uppercase text-sm md:text-base leading-none">{store.currentUser?.companyName}</h1>
               {store.currentUser?.role !== 'staff' && !trialStatus.isSubscribed && (
                  <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest flex items-center gap-1 shrink-0 mt-1">
                     <Clock size={10} /> {trialStatus.daysLeft} Days Remaining (Free Trial)
                  </span>
               )}
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4 shrink-0">
            {!isAppInstalled && (
              <button onClick={handleInstallApp} className="hidden sm:flex items-center gap-2 px-3 py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-xl hover:bg-indigo-100 active:scale-95 transition-all">
                <DownloadCloud size={14} />
                <span className="text-[10px] font-black uppercase tracking-widest">Get the App</span>
              </button>
            )}
            <button onClick={toggleTheme} className="p-2.5 text-slate-400 hover:text-[#4f46e5] dark:hover:text-indigo-400 rounded-xl transition-all">
              {store.settings.theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>
            <div className="relative">
              <button onClick={() => setIsNotificationOpen(!isNotificationOpen)} className="p-2.5 text-slate-400 hover:text-indigo-600 transition-colors">
                <Bell size={20} />
                {(store.notifications || []).filter(n => !n.read).length > 0 && <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white dark:border-slate-900"></span>}
              </button>
            </div>
          </div>
        </header>
        <div className="p-3 md:p-10 flex-1 overflow-x-hidden min-h-0 pb-[env(safe-area-inset-bottom)]">{renderView()}</div>
      </main>
    </div>
  );
};

export default App;