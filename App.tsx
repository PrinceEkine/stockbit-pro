
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { View, User as UserType } from './types';
import { useStore } from './store';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import AIInsights from './pages/AIInsights';
import Stocktake from './pages/Stocktake';
import Sales from './pages/Sales';
import Reports from './pages/Reports';
import Suppliers from './pages/Suppliers';
import SettingsView from './pages/Settings';
import LaunchCenter from './pages/LaunchCenter';
import NotificationPanel from './components/NotificationPanel';
import OnboardingModal from './components/OnboardingModal';
import { 
  Menu, 
  Bell, 
  Search,
  Box,
  AlertCircle,
  Loader2,
  Mic
} from 'lucide-react';

type AuthStep = 'login' | 'register' | 'forgot' | 'verify-notice';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<View>(View.Dashboard);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authStep, setAuthStep] = useState<AuthStep>('login');
  const [isNigeria, setIsNigeria] = useState<boolean | null>(null);
  const [isListening, setIsListening] = useState(false);
  const store = useStore();
  const notificationRef = useRef<HTMLDivElement>(null);

  const unreadCount = useMemo(() => 
    store.notifications.filter(n => !n.read).length
  , [store.notifications]);

  useEffect(() => {
    if (store.isLoggedIn && store.products.length === 0) {
      const hasSeen = localStorage.getItem('stockbit_onboarding_seen');
      if (!hasSeen) setShowOnboarding(true);
    }
  }, [store.isLoggedIn, store.products.length]);

  const handleCloseOnboarding = () => {
    localStorage.setItem('stockbit_onboarding_seen', 'true');
    setShowOnboarding(false);
  };

  useEffect(() => {
    setIsNigeria(true);
  }, []);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const pass = formData.get('password') as string;
    const res = await store.login(email, pass);
    if (!res.success) setAuthError(res.error || 'Invalid credentials');
  };

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const companyName = formData.get('companyName') as string;
    const res = await store.register({ name, email, password, companyName });
    if (!res.success) setAuthError(res.error || 'Registration failed');
  };

  const handleVoiceSearch = () => {
    setIsListening(true);
    setTimeout(() => {
      setIsListening(false);
      alert("AI Voice Recognition active. Try saying: 'Show me electronics inventory'");
    }, 2000);
  };

  if (store.loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center gap-4">
        <Loader2 size={48} className="text-indigo-500 animate-spin" />
        <p className="text-slate-400 font-bold tracking-widest text-xs uppercase">Initializing StockBit Core...</p>
      </div>
    );
  }

  if (!store.isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl animate-in zoom-in-95 duration-500">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mb-4 shadow-xl"><Box size={32} className="text-white" /></div>
            <h1 className="text-3xl font-bold text-slate-900">StockBit Pro</h1>
            <p className="text-slate-500 mt-2 text-center text-sm">Professional Retail Management Suite</p>
          </div>
          {authError && <div className="mb-6 bg-rose-50 text-rose-600 p-4 rounded-2xl flex items-center gap-2 text-sm border border-rose-100"><AlertCircle size={18} /> {authError}</div>}
          {authStep === 'login' && (
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2"><label className="text-xs font-bold text-slate-700 uppercase">Email Address</label><input name="email" type="email" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" placeholder="name@company.com" required /></div>
              <div className="space-y-2"><label className="text-xs font-bold text-slate-700 uppercase">Password</label><input name="password" type="password" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" placeholder="••••••••" required /></div>
              <button type="submit" className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg transition-all hover:bg-indigo-700">Sign In</button>
              <p className="text-center text-sm text-slate-500">New business? <button type="button" onClick={() => setAuthStep('register')} className="text-indigo-600 font-bold">Register Now</button></p>
            </form>
          )}
          {authStep === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
               <div className="space-y-1"><label className="text-xs font-bold text-slate-500 uppercase">Business Name</label><input name="companyName" type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900" placeholder="e.g. Acme Nigerian Ltd" required /></div>
              <div className="space-y-1"><label className="text-xs font-bold text-slate-500 uppercase">Your Full Name</label><input name="name" type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900" placeholder="John Doe" required /></div>
              <div className="space-y-1"><label className="text-xs font-bold text-slate-500 uppercase">Email Address</label><input name="email" type="email" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900" placeholder="admin@company.com" required /></div>
              <div className="space-y-1"><label className="text-xs font-bold text-slate-500 uppercase">Password</label><input name="password" type="password" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900" placeholder="••••••••" required /></div>
              <button type="submit" className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl mt-4">Create Account</button>
              <button type="button" onClick={() => setAuthStep('login')} className="w-full py-2 text-slate-400 text-sm font-bold">Back to Login</button>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar activeView={activeView} onViewChange={setActiveView} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} user={store.currentUser} onLogout={store.logout} onShowHelp={() => setShowOnboarding(true)} />
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-20 bg-white border-b border-slate-100 px-4 md:px-8 flex items-center justify-between sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-4">
            <button className="md:hidden p-2 text-slate-600 hover:bg-slate-50 rounded-lg" onClick={() => setIsSidebarOpen(true)}><Menu size={24} /></button>
            <div className="hidden md:flex items-center gap-3 bg-slate-50 px-4 py-2.5 rounded-2xl w-64 lg:w-96 border border-slate-200 shadow-inner group transition-all focus-within:ring-2 focus-within:ring-indigo-500">
              <Search size={18} className="text-slate-400" />
              <input type="text" placeholder="AI Smart Search..." className="bg-transparent border-none outline-none text-sm w-full text-slate-900" />
              <button onClick={handleVoiceSearch} className={`p-1.5 rounded-lg transition-colors ${isListening ? 'bg-rose-100 text-rose-600' : 'text-slate-400 hover:text-indigo-600'}`}><Mic size={16} className={isListening ? 'animate-pulse' : ''} /></button>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative" ref={notificationRef}>
              <button onClick={() => setIsNotificationOpen(!isNotificationOpen)} className="relative p-3 text-slate-400 hover:text-indigo-600 rounded-2xl border border-transparent hover:border-slate-100"><Bell size={22} /> {unreadCount > 0 && <span className="absolute top-2 right-2 w-5 h-5 bg-rose-500 rounded-full border-2 border-white text-[10px] text-white flex items-center justify-center font-black">{unreadCount}</span>}</button>
              {isNotificationOpen && <NotificationPanel notifications={store.notifications} onMarkRead={store.markNotificationRead} onClear={store.clearNotifications} onClose={() => setIsNotificationOpen(false)} />}
            </div>
            <div className="flex items-center gap-3 pl-2"><div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white text-sm font-black">{store.currentUser?.name?.charAt(0)}</div><div className="hidden lg:flex flex-col text-right"><span className="text-sm font-bold text-slate-900 leading-tight">{store.currentUser?.name}</span><span className="text-[10px] text-slate-400 font-bold uppercase">{store.currentUser?.role}</span></div></div>
          </div>
        </header>
        <div className="p-4 md:p-8 overflow-y-auto flex-1"><div className="max-w-7xl mx-auto pb-12">{renderView()}</div></div>
      </main>
      {showOnboarding && <OnboardingModal onClose={handleCloseOnboarding} />}
    </div>
  );

  function renderView() {
    switch (activeView) {
      case View.Dashboard: return <Dashboard state={store} onNavigate={setActiveView} />;
      case View.Inventory: return <Inventory products={store.products} suppliers={store.suppliers} onAdd={store.addProduct} onUpdate={store.updateProduct} onDelete={store.deleteProduct} settings={store.settings} />;
      case View.Stocktake: return <Stocktake products={store.products} onReconcile={store.reconcileInventory} />;
      case View.AIInsights: return <AIInsights state={store} />;
      case View.Sales: return <Sales sales={store.sales} products={store.products} onRecordSale={store.recordSale} onDeleteSales={store.deleteSales} onUpdateSalesStatus={store.updateSalesStatus} settings={store.settings} />;
      case View.Reports: return <Reports state={store} />;
      case View.Suppliers: return <Suppliers suppliers={store.suppliers} onAdd={store.addSupplier} onUpdate={store.updateSupplier} onDelete={store.deleteSupplier} />;
      case View.Settings: return <SettingsView settings={store.settings} onUpdate={store.updateSettings} onAddCategory={store.addCategory} />;
      case View.LaunchCenter: return <LaunchCenter state={store} />;
      default: return <Dashboard state={store} onNavigate={setActiveView} />;
    }
  }
};

export default App;
