
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { View, User as UserType, SubscriptionPlan, Product, AppLanguage } from './types';
import { useStore, getTrialStatus } from './store';
import { supabase } from './supabase';
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
  Mail,
  Activity
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
  
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setAuthStep('update_password');
      }
    });

    // Handle recovery token in URL on initial mount
    const hash = window.location.hash;
    if (hash && (hash.includes('type=recovery') || hash.includes('access_token='))) {
      // Give Supabase a moment to process the hash
      setTimeout(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (session) {
            setAuthStep('update_password');
          }
        });
      }, 500);
    }

    return () => subscription.unsubscribe();
  }, []);

  // PWA & Install state - Check if standalone OR if we previously marked it as installed
  const [isAppInstalled, setIsAppInstalled] = useState(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                        (window.navigator as any).standalone === true;
    const wasMarkedInstalled = localStorage.getItem('stockbit_pwa_installed') === 'true';
    return isStandalone || wasMarkedInstalled;
  });
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  const store = useStore();
  const notificationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkInstallStatus = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                          (window.navigator as any).standalone === true ||
                          document.referrer.includes('android-app://');
      
      if (isStandalone) {
        setIsAppInstalled(true);
        localStorage.setItem('stockbit_pwa_installed', 'true');
      }
    };
    
    checkInstallStatus();

    const matcher = window.matchMedia('(display-mode: standalone)');
    const onChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        setIsAppInstalled(true);
        localStorage.setItem('stockbit_pwa_installed', 'true');
      }
    };
    matcher.addEventListener('change', onChange);

    window.addEventListener('appinstalled', () => {
      setIsAppInstalled(true);
      localStorage.setItem('stockbit_pwa_installed', 'true');
      setDeferredPrompt(null);
    });
    
    const handler = (e: any) => {
      e.preventDefault();
      // Only set prompt if we haven't already detected an install
      if (!isAppInstalled) {
        setDeferredPrompt(e);
      }
    };
    window.addEventListener('beforeinstallprompt', handler);
    
    return () => {
      matcher.removeEventListener('change', onChange);
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, [isAppInstalled]);

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
      localStorage.setItem('stockbit_pwa_installed', 'true');
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
        // Clear any previous errors
        setAuthError('');
      }
    } catch (err: any) {
      setAuthError("Account creation failed. Please check your details.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = useCallback(() => {
    setActiveView(View.Landing);
    setAuthStep('landing');
    store.logout();
  }, [store.logout]);

  const handleUpdatePasswordSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAuthError('');
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const password = formData.get('password') as string;

    try {
      const { error } = await store.updatePassword(password);
      if (error) {
        setAuthError(error.message);
      } else {
        setAuthStep('login');
        alert("Password updated successfully. Please sign in with your new password.");
      }
    } catch (err: any) {
      setAuthError("Failed to update password.");
    } finally {
      setIsSubmitting(false);
    }
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
        <p className="text-indigo-500/60 font-black text-[11px] uppercase tracking-[0.2em] animate-pulse">Opening Your Shop...</p>
      </div>
    );
  }

  if (!store.isLoggedIn || activeView === View.Landing || isInfoView) {
    if (isInfoView) {
      return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors flex flex-col">
          <nav className="fixed top-0 w-full z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 h-20 pt-[env(safe-area-inset-top)] box-content">
            <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
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
                  {authStep === 'login' ? 'SIGN IN' : authStep === 'register' ? 'CREATE SHOP' : 'ACCOUNT RECOVERY'}
                </h1>
             </div>

             {authError && (
               <div className="mb-8 p-5 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800 rounded-2xl flex items-center gap-4 text-rose-600 dark:text-rose-400">
                 <ShieldAlert size={20} className="shrink-0" />
                 <p className="text-xs font-bold uppercase tracking-tight leading-relaxed">{authError}</p>
               </div>
             )}

             {authStep === 'login' && (
               <form onSubmit={handleLoginSubmit} className="space-y-8">
                  <div className="space-y-6">
                    <div>
                      <label className="block text-[11px] font-black uppercase tracking-widest text-slate-400 mb-3 ml-1">EMAIL ADDRESS</label>
                      <input name="email" type="email" required className="w-full px-8 py-5 bg-slate-50 dark:bg-slate-800 rounded-[1.8rem] font-bold text-slate-900 dark:text-white border-none focus:ring-4 focus:ring-indigo-600/10 outline-none transition-all placeholder:text-slate-400" placeholder="name@email.com" />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-3 ml-1">
                        <label className="block text-[11px] font-black uppercase tracking-widest text-slate-400">PASSWORD</label>
                        <button type="button" onClick={() => setAuthStep('forgot')} className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-widest hover:underline">FORGOT PASSWORD?</button>
                      </div>
                      <div className="relative">
                        <input name="password" type={showPassword ? "text" : "password"} required className="w-full px-8 py-5 bg-slate-50 dark:bg-slate-800 rounded-[1.8rem] font-bold text-slate-900 dark:text-white border-none focus:ring-4 focus:ring-indigo-600/10 outline-none transition-all placeholder:text-slate-400" placeholder="••••••••" />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400">
                          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <button disabled={isSubmitting} type="submit" className="w-full py-6 bg-[#4f46e5] text-white font-black uppercase tracking-[0.2em] text-[13px] rounded-[2rem] shadow-2xl active:scale-[0.98] transition-all flex items-center justify-center gap-4">
                    {isSubmitting ? <Loader2 className="animate-spin" size={22} /> : <LogIn size={22} />}
                    {isSubmitting ? 'SYNCING...' : 'SIGN IN NOW'}
                  </button>
                  <div className="pt-6 text-center">
                    <p className="text-[12px] font-black uppercase text-slate-400 tracking-widest">
                      New business? <button type="button" onClick={() => setAuthStep('register')} className="text-[#4f46e5] dark:text-indigo-400 hover:underline">Create Shop</button>
                    </p>
                  </div>
               </form>
             )}

             {authStep === 'register' && (
               <form onSubmit={handleRegisterSubmit} className="space-y-6">
                  <div className="flex bg-slate-50 dark:bg-slate-800 p-1.5 rounded-2xl mb-8">
                    <button type="button" onClick={() => setIsStaffSignup(false)} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${!isStaffSignup ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-500'}`}>Shop Owner</button>
                    <button type="button" onClick={() => setIsStaffSignup(true)} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isStaffSignup ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-500'}`}>Shop Staff</button>
                  </div>

                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">FULL NAME</label>
                    <input name="name" required className="w-full px-8 py-4 bg-slate-50 dark:bg-slate-800 rounded-[1.5rem] font-bold text-slate-900 dark:text-white border-none outline-none" placeholder="e.g. John Doe" />
                  </div>

                  {!isStaffSignup ? (
                    <div>
                      <label className="block text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">BUSINESS NAME</label>
                      <input name="companyName" required className="w-full px-8 py-4 bg-slate-50 dark:bg-slate-800 rounded-[1.5rem] font-bold text-slate-900 dark:text-white border-none outline-none" placeholder="e.g. Lagos Supermart" />
                    </div>
                  ) : (
                    <div className="p-5 bg-indigo-50/50 dark:bg-indigo-900/10 border-2 border-indigo-100 dark:border-indigo-800/50 rounded-[1.5rem]">
                      <label className="block text-[11px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-2 ml-1 flex items-center gap-2"><Link size={14}/> INVITE ID FROM OWNER</label>
                      <input name="inviteId" required className="w-full px-6 py-4 bg-white dark:bg-slate-900 rounded-xl font-mono text-sm font-bold border-none outline-none" placeholder="e.g. 123e4567-e89b..." />
                      <p className="text-[9px] font-bold text-indigo-400 uppercase mt-3 tracking-widest">ASK YOUR BOSS FOR THE LINK CODE IN THEIR SETTINGS.</p>
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">EMAIL ADDRESS</label>
                    <input name="email" type="email" required className="w-full px-8 py-4 bg-slate-50 dark:bg-slate-800 rounded-[1.5rem] font-bold text-slate-900 dark:text-white border-none outline-none" placeholder="business@email.com" />
                  </div>

                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">CREATE PASSWORD</label>
                    <input name="password" type="password" required className="w-full px-8 py-4 bg-slate-50 dark:bg-slate-800 rounded-[1.5rem] font-bold text-slate-900 dark:text-white border-none outline-none" placeholder="••••••••" />
                  </div>

                  <button disabled={isSubmitting} type="submit" className="w-full py-5 bg-[#4f46e5] text-white font-black uppercase tracking-[0.2em] text-[12px] rounded-[1.5rem] shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-4 disabled:opacity-50 disabled:cursor-not-allowed">
                    {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <UserPlus size={20} />}
                    {isSubmitting ? 'PLEASE WAIT...' : 'INITIATE PROTOCOL'}
                  </button>
                  
                  <div className="text-center pt-4">
                    <button type="button" onClick={() => setAuthStep('login')} className="text-[11px] font-black uppercase text-slate-400 hover:text-indigo-600 transition-colors tracking-widest flex items-center justify-center gap-2 mx-auto"><ArrowLeft size={14}/> Already have an account?</button>
                  </div>
               </form>
             )}

             {authStep === 'forgot' && (
               <form onSubmit={async (e) => {
                 e.preventDefault();
                 setIsSubmitting(true);
                 const email = new FormData(e.currentTarget).get('email') as string;
                 await store.resetPassword(email);
                 setAuthStep('login');
                 alert("Check your email for the reset link.");
                 setIsSubmitting(false);
               }} className="space-y-8">
                 <div className="p-6 bg-indigo-50 dark:bg-indigo-900/20 rounded-3xl border border-indigo-100 dark:border-indigo-800">
                    <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 leading-relaxed uppercase">Enter your email address and we'll send you a secure link to reset your shop credentials.</p>
                 </div>
                 <div>
                   <label className="block text-[11px] font-black uppercase tracking-widest text-slate-400 mb-3 ml-1">REGISTERED EMAIL</label>
                   <input name="email" type="email" required className="w-full px-8 py-5 bg-slate-50 dark:bg-slate-800 rounded-[1.8rem] font-bold text-slate-900 dark:text-white border-none outline-none" placeholder="business@email.com" />
                 </div>
                 <button disabled={isSubmitting} type="submit" className="w-full py-6 bg-[#4f46e5] text-white font-black uppercase tracking-[0.2em] text-[13px] rounded-[2rem] shadow-2xl active:scale-[0.98] transition-all flex items-center justify-center gap-4">
                    {isSubmitting ? <Loader2 className="animate-spin" size={22} /> : <Mail size={22} />}
                    {isSubmitting ? 'SENDING...' : 'SEND RECOVERY LINK'}
                  </button>
                  <div className="text-center">
                    <button type="button" onClick={() => setAuthStep('login')} className="text-[11px] font-black uppercase text-slate-400 hover:text-indigo-600 transition-colors tracking-widest">Back to Sign In</button>
                  </div>
               </form>
             )}

             {authStep === 'update_password' && (
               <form onSubmit={handleUpdatePasswordSubmit} className="space-y-8">
                 <div className="p-6 bg-indigo-50 dark:bg-indigo-900/20 rounded-3xl border border-indigo-100 dark:border-indigo-800">
                    <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 leading-relaxed uppercase">Create a new secure password for your shop account.</p>
                 </div>
                 <div>
                   <label className="block text-[11px] font-black uppercase tracking-widest text-slate-400 mb-3 ml-1">NEW PASSWORD</label>
                   <div className="relative">
                     <input name="password" type={showPassword ? "text" : "password"} required className="w-full px-8 py-5 bg-slate-50 dark:bg-slate-800 rounded-[1.8rem] font-bold text-slate-900 dark:text-white border-none outline-none focus:ring-4 focus:ring-indigo-600/10 transition-all" placeholder="••••••••" />
                     <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400">
                       {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                     </button>
                   </div>
                 </div>
                 <button disabled={isSubmitting} type="submit" className="w-full py-6 bg-[#4f46e5] text-white font-black uppercase tracking-[0.2em] text-[13px] rounded-[2rem] shadow-2xl active:scale-[0.98] transition-all flex items-center justify-center gap-4">
                   {isSubmitting ? <Loader2 className="animate-spin" size={22} /> : <KeyRound size={22} />}
                   {isSubmitting ? 'UPDATING...' : 'UPDATE PASSWORD'}
                 </button>
               </form>
             )}

             {authStep === 'verify_otp' && (
               <div className="text-center space-y-12 py-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
                   <div className="relative mx-auto w-32 h-32">
                      <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping duration-[3000ms]" />
                      <div className="relative w-full h-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-full flex items-center justify-center shadow-inner border-4 border-white dark:border-slate-800">
                        <MailCheck size={56} className="animate-bounce" />
                      </div>
                   </div>

                   <div className="space-y-6">
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none">Check your inbox</h2>
                    <div className="space-y-4">
                       <p className="text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs mx-auto">
                         We've sent a secure activation link to:
                         <br />
                         <span className="text-indigo-600 dark:text-indigo-400 font-black text-base mt-2 block">{pendingEmail}</span>
                       </p>
                       <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/50 rounded-2xl">
                          <p className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-widest leading-normal">
                            Please click the link in the email to verify your account. If you don't see it, check your spam folder.
                          </p>
                       </div>
                    </div>
                  </div>
                   <div className="pt-6 space-y-4">
                      <button onClick={() => setAuthStep('login')} className="w-full py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black uppercase text-[12px] tracking-[0.2em] rounded-[1.5rem] shadow-xl active:scale-95 transition-all">
                        Back to Sign In
                      </button>
                      <button onClick={() => setAuthStep('register')} className="text-[10px] font-black uppercase text-slate-400 hover:text-indigo-600 tracking-widest transition-colors">
                        Entered wrong email? Start over
                      </button>
                   </div>
               </div>
             )}
          </div>
        </div>
      );
    }
  }

  const renderView = () => {
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
               <div className="flex items-center gap-2">
                 <h1 className="font-black text-slate-900 dark:text-white tracking-tight truncate max-w-[120px] sm:max-w-xs uppercase text-sm md:text-base leading-none">{store.currentUser?.companyName}</h1>
                 {/* Real-time Indicator */}
                 <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-full border border-slate-200 dark:border-white/5">
                    <div className={`w-1.5 h-1.5 rounded-full ${store.isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                    <span className="text-[7px] font-black uppercase text-slate-400 tracking-widest">{store.isOnline ? 'Live' : 'Offline'}</span>
                 </div>
               </div>
               {store.currentUser?.role !== 'staff' && !trialStatus.isSubscribed && (
                  <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest flex items-center gap-1 shrink-0 mt-1">
                     <Clock size={10} /> {trialStatus.daysLeft} Days Remaining
                  </span>
               )}
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4 shrink-0">
            <button onClick={toggleTheme} className="p-2.5 text-slate-400 hover:text-[#4f46e5] dark:hover:text-indigo-400 rounded-xl transition-all">
              {store.settings.theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>
            <button onClick={() => setIsNotificationOpen(!isNotificationOpen)} className="p-2.5 text-slate-400 hover:text-indigo-600 transition-colors relative">
                <Bell size={20} />
                {(store.notifications || []).filter(n => !n.read).length > 0 && <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full"></span>}
            </button>
          </div>
        </header>
        <div className="p-3 md:p-10 flex-1 overflow-x-hidden min-h-0 pb-[env(safe-area-inset-bottom)]">{renderView()}</div>
      </main>
    </div>
  );
};

export default App;
