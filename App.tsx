import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { View, AppLanguage } from './types';
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
import LaunchCenter from './pages/LaunchCenter';
import UserManagement from './pages/UserManagement';
import LandingPage from './pages/LandingPage';
import NotificationPanel from './components/NotificationPanel';
import PasswordResetModal from './components/PasswordResetModal';
import BottomNavigation from './components/BottomNavigation';
import AboutUs from './pages/AboutUs';
import HelpCenter from './pages/HelpCenter';
import TermsOfService from './pages/TermsOfService';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Governance from './pages/Governance';
import AuthScreen, { AuthStep as ScreenStep } from './components/auth/AuthScreen';
import LockScreen, { useIdleLock } from './components/auth/LockScreen';
import { useToast } from './components/ui/Toast';
import { TRANSLATIONS } from './constants/translations';
import {
  Menu, Bell, Box, ShieldAlert, Moon, Sun, Clock, ArrowLeft, CreditCard, WifiOff
} from 'lucide-react';

type AuthStep = 'landing' | ScreenStep;

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<View>(View.Landing);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1024);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [authStep, setAuthStep] = useState<AuthStep>('landing');
  const [pendingEmail, setPendingEmail] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const toast = useToast();
  const store = useStore();

  useEffect(() => {
    // Recovery links carry a type=recovery / update_password marker; everything
    // else with an auth payload is a verification / sign-in link.
    const initialHash = window.location.hash;
    const isRecoveryLink = initialHash.includes('type=recovery') || initialHash.includes('update_password');

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || (isRecoveryLink && session)) {
        setAuthStep('update_password');
        setActiveView(View.Dashboard);
        return;
      }
      if (event === 'SIGNED_IN' && session) {
        setAuthStep('landing');
        setActiveView(View.Dashboard);
        if (window.location.search.includes('code=') || window.location.hash.includes('access_token=')) {
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // A staff invite that failed on first login (expired / wrong email / limit).
  useEffect(() => {
    if (store.pendingInviteError) {
      toast.warning('Invite not applied', `${store.pendingInviteError} You can enter a new code in Settings → Workforce.`);
      store.clearPendingInviteError();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.pendingInviteError]);

  // Surface store-level errors (e.g. "not enough stock") as toasts.
  useEffect(() => {
    if (store.error) {
      toast.error(store.error);
      store.clearError();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.error]);

  // ---------------- PWA install state ----------------
  const [isAppInstalled, setIsAppInstalled] = useState(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                        (window.navigator as any).standalone === true;
    const wasMarkedInstalled = localStorage.getItem('stockbit_pwa_installed') === 'true' ||
                               localStorage.getItem('stockbit_pwa_dismissed') === 'true';
    return isStandalone || wasMarkedInstalled;
  });
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const checkInstallStatus = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                          (window.navigator as any).standalone === true ||
                          document.referrer.includes('android-app://');
      const wasMarkedInstalled = localStorage.getItem('stockbit_pwa_installed') === 'true' ||
                                 localStorage.getItem('stockbit_pwa_dismissed') === 'true';
      if (isStandalone || wasMarkedInstalled) {
        setIsAppInstalled(true);
        if (isStandalone) localStorage.setItem('stockbit_pwa_installed', 'true');
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

    const onInstalled = () => {
      setIsAppInstalled(true);
      localStorage.setItem('stockbit_pwa_installed', 'true');
      setDeferredPrompt(null);
    };
    window.addEventListener('appinstalled', onInstalled);

    const handler = (e: any) => {
      e.preventDefault();
      if (!isAppInstalled) setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      matcher.removeEventListener('change', onChange);
      window.removeEventListener('appinstalled', onInstalled);
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, [isAppInstalled]);

  const isInfoView = useMemo(() => [
    View.AboutUs, View.HelpCenter, View.TermsOfService, View.PrivacyPolicy, View.Governance
  ].includes(activeView), [activeView]);

  const handleInstallApp = async () => {
    if (isAppInstalled) return;
    if (!deferredPrompt) {
      toast.info(
        'Install StockBit Pro',
        'iOS/Safari: Share → "Add to Home Screen". Android/Chrome: menu ⋮ → "Install app".'
      );
      localStorage.setItem('stockbit_pwa_dismissed', 'true');
      setIsAppInstalled(true);
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setIsAppInstalled(true);
      localStorage.setItem('stockbit_pwa_installed', 'true');
    } else {
      localStorage.setItem('stockbit_pwa_dismissed', 'true');
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
      else if (hash.startsWith('join=')) {
        // Shareable staff invite link: /#join=SB-XXXX-XXXX
        setJoinCode(decodeURIComponent(hash.slice(5)).toUpperCase());
        if (!store.isLoggedIn) { setActiveView(View.Landing); setAuthStep('register'); }
        else setActiveView(View.Settings);
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, [store.isLoggedIn]);

  useEffect(() => {
    const root = window.document.documentElement;
    if (store.settings.theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
  }, [store.settings.theme]);

  const trialStatus = useMemo(() => {
    const status = getTrialStatus(store.currentUser);
    if (store.currentUser?.role === 'staff' && store.currentUser?.parentId) {
      const owner = store.users.find(u => u.id === store.currentUser?.parentId);
      if (owner) return getTrialStatus(owner);
      if (store.loading) return { isSubscribed: false, daysLeft: 1, isExpired: false };
      return { isSubscribed: false, daysLeft: 0, isExpired: true };
    }
    return status;
  }, [store.currentUser, store.users, store.loading]);

  const isAccessBlocked = useMemo(() => {
    if (!store.isLoggedIn) return false;
    if (activeView === View.Settings) return false;
    return trialStatus.isExpired && !trialStatus.isSubscribed;
  }, [store.isLoggedIn, trialStatus.isExpired, trialStatus.isSubscribed, activeView]);

  const toggleTheme = () => {
    store.updateSettings({ theme: store.settings.theme === 'light' ? 'dark' : 'light' });
  };

  // ---------------- Auth handlers ----------------
  const handleLogin = useCallback(async (email: string, password: string) => {
    const { error } = await store.login(email, password);
    if (!error) setActiveView(View.Dashboard);
    return { error };
  }, [store.login]);

  const handleGoogle = useCallback(async () => {
    const res = await store.loginWithGoogle();
    if (!res.redirecting) {
      setActiveView(View.Dashboard);
      setAuthStep('landing');
    }
  }, [store.loginWithGoogle]);

  const handleForgot = useCallback(async (email: string) => {
    return await store.resetPassword(email);
  }, [store.resetPassword]);

  const handleUpdatePassword = useCallback(async (password: string) => {
    const res = await store.updatePassword(password);
    if (!res.error) {
      toast.success('Password updated', 'Other devices have been signed out.');
      setAuthStep('landing');
      if (window.location.hash) window.history.replaceState({}, document.title, window.location.pathname);
    }
    return res;
  }, [store.updatePassword, toast]);

  const handleLogout = useCallback(async () => {
    if (window.location.hash) window.location.hash = '';
    setActiveView(View.Landing);
    setAuthStep('landing');
    await store.logout();
  }, [store.logout]);

  useEffect(() => {
    if (!store.isLoggedIn && activeView !== View.Landing && !isInfoView) {
      setActiveView(View.Landing);
      setAuthStep('landing');
    }
  }, [store.isLoggedIn, activeView, isInfoView]);

  // ---------------- Idle lock ----------------
  const { locked, unlock } = useIdleLock(store.isLoggedIn);
  const hasPassword = store.authProviders.includes('email');

  const handleUnlock = useCallback(async (password: string) => {
    const res = await store.reauthenticate(password);
    if (!res.error) unlock();
    return res;
  }, [store.reauthenticate, unlock]);

  const handleGoogleUnlock = useCallback(async () => {
    await store.logout();
    setActiveView(View.Landing);
    setAuthStep('login');
  }, [store.logout]);

  // ---------------- Render ----------------
  if (store.loading && !store.isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 gap-8 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-indigo-600/15 blur-[140px] rounded-full" />
          <div className="absolute inset-0 bg-grid opacity-30 [mask-image:radial-gradient(ellipse_at_center,black_10%,transparent_70%)]" />
        </div>
        <div className="relative">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            className="w-20 h-20 border-2 border-indigo-500/20 border-t-indigo-400 rounded-[1.6rem]"
          />
          <div className="absolute inset-0 flex items-center justify-center text-white"><Box size={26} /></div>
        </div>
        <div className="text-center space-y-2 relative z-10">
          <p className="font-display text-lg font-semibold text-white tracking-tight">StockBit Pro</p>
          <p className="text-xs text-slate-500">Restoring your secure session…</p>
        </div>
      </div>
    );
  }

  if (!store.isLoggedIn || activeView === View.Landing || isInfoView) {
    if (isInfoView) {
      const infoLang = store.settings?.language || 'en';
      const tInfo = TRANSLATIONS[infoLang] || TRANSLATIONS.en;
      return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors flex flex-col">
          <nav className="fixed top-0 w-full z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200/70 dark:border-white/10 h-20 pt-[env(safe-area-inset-top)] box-content">
            <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
              <button onClick={() => { setActiveView(View.Landing); setAuthStep('landing'); }} className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/25"><Box size={22} className="text-white" /></div>
                <span className="font-display font-semibold text-base md:text-lg text-slate-900 dark:text-white">StockBit Pro</span>
              </button>

              <div className="hidden lg:flex items-center gap-8">
                <button onClick={() => { setActiveView(View.Landing); setAuthStep('landing'); }} className="text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors">{tInfo.inventory}</button>
                <button onClick={() => setActiveView(View.AboutUs)} className={`text-sm font-medium transition-colors ${activeView === View.AboutUs ? 'text-indigo-600' : 'text-slate-500 hover:text-indigo-600'}`}>{tInfo.about_us}</button>
                <button onClick={() => setActiveView(View.HelpCenter)} className={`text-sm font-medium transition-colors ${activeView === View.HelpCenter ? 'text-indigo-600' : 'text-slate-500 hover:text-indigo-600'}`}>{tInfo.help_center}</button>
              </div>

              {store.isLoggedIn ? (
                <button onClick={() => setActiveView(View.Dashboard)} className="btn-primary !py-2.5 !px-5 text-xs"><ArrowLeft size={14} /> Back to Dashboard</button>
              ) : (
                <button onClick={() => { setAuthStep('login'); setActiveView(View.Landing); }} className="btn-primary !py-2.5 !px-5 text-xs">Sign in</button>
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
        <AuthScreen
          step={authStep}
          onStepChange={(s) => setAuthStep(s)}
          onBackToSite={() => { setAuthStep('landing'); setActiveView(View.Landing); }}
          onLogin={handleLogin}
          onRegister={store.register}
          onGoogle={handleGoogle}
          onForgot={handleForgot}
          onUpdatePassword={handleUpdatePassword}
          onPreviewInvite={store.previewInvite}
          initialInviteCode={joinCode || undefined}
          pendingEmail={pendingEmail}
          setPendingEmail={setPendingEmail}
        />
      );
    }
  }

  const renderView = () => {
    if (isAccessBlocked) {
      const isStaff = store.currentUser?.role === 'staff';
      return (
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center space-y-8 animate-in fade-in zoom-in-95 duration-500 surface rounded-[2.5rem]">
          <div className="w-20 h-20 bg-rose-50 dark:bg-rose-500/10 text-rose-600 rounded-full flex items-center justify-center">
            <ShieldAlert size={40} />
          </div>
          <div className="space-y-3 max-w-md">
            <h2 className="font-display text-2xl font-semibold text-slate-900 dark:text-white">Your free trial has ended</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              {isStaff
                ? "Your business owner's 60-day free access has concluded. Ask your administrator to activate a subscription to resume operations."
                : "Your 60-day free access has concluded. Activate a subscription to keep managing your shop, inventory and team."}
            </p>
          </div>
          {!isStaff && (
            <button onClick={() => setActiveView(View.Settings)} className="btn-primary">
              <CreditCard size={18} /> View subscription plans
            </button>
          )}
        </div>
      );
    }

    switch (activeView) {
      case View.Dashboard: return <Dashboard state={store} onNavigate={setActiveView} />;
      case View.Inventory: return <Inventory products={store.products || []} suppliers={store.suppliers || []} onAdd={store.addProduct} onUpdate={store.updateProduct} onDelete={store.deleteProduct} settings={store.settings} currentUser={store.currentUser} loading={store.loading} />;
      case View.Sales: return <Sales sales={store.sales || []} products={store.products || []} onRecordSale={store.recordSale} settings={store.settings} currentUser={store.currentUser} />;
      case View.AIInsights: return <AIInsights state={store} />;
      case View.Stocktake: return <Stocktake products={store.products || []} onReconcile={store.reconcileInventory} settings={store.settings} />;
      case View.Returns: return <Returns returns={store.returns || []} products={store.products || []} onRecordReturn={store.recordReturn} settings={store.settings} />;
      case View.Reports: return <Reports state={store} />;
      case View.Suppliers: return <Suppliers suppliers={store.suppliers || []} onAdd={store.addSupplier} onUpdate={() => {}} onDelete={() => {}} settings={store.settings} />;
      case View.Settings: return <SettingsView settings={store.settings} onUpdate={store.updateSettings} staff={store.users || []} currentUser={store.currentUser} onRemoveStaff={store.removeStaffMember} invites={store.staffInvites} onLoadInvites={store.loadStaffInvites} onCreateInvite={store.createStaffInvite} onRevokeInvite={store.revokeStaffInvite} onJoinWithCode={store.joinBusinessWithCode} onVerifyPayment={store.verifyAndActivateSubscription} onUpdatePassword={store.updatePassword} onRefreshStaff={store.refreshUsers} onSignOutEverywhere={store.signOutEverywhere} authProviders={store.authProviders} />;
      case View.LaunchCenter: return <LaunchCenter state={store} onUpdateSettings={store.updateSettings} />;
      case View.UserManagement:
        if (store.currentUser?.role !== 'admin') return <Dashboard state={store} onNavigate={setActiveView} />;
        return <UserManagement users={store.adminUsers} currentUserId={store.currentUser.id} onLoad={store.adminLoadUsers} onUpdatePlan={store.adminUpdatePlan} onAssignParent={store.adminAssignParent} onSetRole={store.adminSetRole} />;
      default: return <Dashboard state={store} onNavigate={setActiveView} />;
    }
  };

  const unreadCount = (store.notifications || []).filter(n => !n.read).length;

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors overflow-x-hidden flex-col">
      <Sidebar activeView={activeView} onViewChange={setActiveView} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} user={store.currentUser} onLogout={handleLogout} onInstall={handleInstallApp} isAppInstalled={isAppInstalled} settings={store.settings} />
      <main className={`flex-1 flex flex-col min-w-0 relative transition-all duration-500 ease-in-out ${isSidebarOpen ? 'lg:pl-72' : 'pl-0'}`}>
        <header className="no-print bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/70 dark:border-white/10 px-4 md:px-8 flex items-center justify-between sticky top-0 z-30 transition-colors pt-[env(safe-area-inset-top)] box-content h-[68px]">
          <div className="flex items-center gap-3 md:gap-4 min-w-0">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} aria-label="Toggle navigation" className="p-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 active:scale-95 transition-all shrink-0">
              <Menu size={20} />
            </button>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2.5">
                <h1 className="font-display font-semibold text-slate-900 dark:text-white tracking-tight truncate max-w-[140px] sm:max-w-xs text-[15px] md:text-base leading-none">{store.currentUser?.companyName}</h1>
                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${store.isOnline ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200/70 dark:border-emerald-500/20' : 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-200/70 dark:border-rose-500/20'}`}>
                  {store.isOnline ? <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> : <WifiOff size={10} />}
                  {store.isOnline ? 'Live' : 'Offline'}
                </span>
              </div>
              {store.currentUser?.role !== 'staff' && !trialStatus.isSubscribed && (
                <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400 flex items-center gap-1 shrink-0 mt-1">
                  <Clock size={11} /> {trialStatus.daysLeft} day{trialStatus.daysLeft === 1 ? '' : 's'} left in trial
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 md:gap-2 shrink-0">
            <button onClick={toggleTheme} aria-label="Toggle theme" className="p-2.5 rounded-xl text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-300 hover:bg-slate-100 dark:hover:bg-white/10 transition-all">
              {store.settings.theme === 'light' ? <Moon size={19} /> : <Sun size={19} />}
            </button>
            <button onClick={() => setIsNotificationOpen(!isNotificationOpen)} aria-label="Notifications" className="p-2.5 rounded-xl text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-300 hover:bg-slate-100 dark:hover:bg-white/10 transition-all relative">
              <Bell size={19} />
              {unreadCount > 0 && <span className="absolute top-2 right-2 min-w-[8px] h-2 bg-rose-500 rounded-full ring-2 ring-white dark:ring-slate-900" />}
            </button>
          </div>
        </header>

        {isNotificationOpen && (
          <div className="absolute right-4 md:right-8 top-[calc(env(safe-area-inset-top)+68px)] z-40">
            <NotificationPanel
              notifications={store.notifications || []}
              onClose={() => setIsNotificationOpen(false)}
              onMarkRead={store.markNotificationRead}
              onClear={store.clearNotifications}
            />
          </div>
        )}

        <div className="p-3 pb-28 md:p-8 lg:p-10 flex-1 overflow-x-hidden min-h-0 md:pb-[env(safe-area-inset-bottom)]">{renderView()}</div>
        <BottomNavigation
          activeView={activeView}
          onViewChange={setActiveView}
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
          user={store.currentUser}
          settings={store.settings}
        />
        <AnimatePresence>
          {authStep === 'update_password' && store.isLoggedIn && (
            <PasswordResetModal
              onUpdate={store.updatePassword}
              onClose={() => { setAuthStep('landing'); if (window.location.hash) window.history.replaceState({}, document.title, window.location.pathname); }}
            />
          )}
        </AnimatePresence>
        {locked && store.currentUser && (
          <LockScreen
            user={store.currentUser}
            hasPassword={hasPassword}
            onUnlock={handleUnlock}
            onGoogleUnlock={handleGoogleUnlock}
            onSignOut={handleLogout}
          />
        )}
      </main>
    </div>
  );
};

export default App;
