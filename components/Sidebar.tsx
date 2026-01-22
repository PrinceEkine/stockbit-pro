import React from 'react';
import { 
  LayoutDashboard, 
  Box, 
  ShoppingCart, 
  Settings,
  LogOut,
  X,
  Sparkles,
  ClipboardCheck,
  Users,
  BarChart3,
  Rocket,
  ArrowLeftRight,
  Leaf,
  ChevronRight,
  HelpCircle,
  ShieldAlert,
  Info,
  Scale,
  DownloadCloud
} from 'lucide-react';
import { View, User as UserType } from '../types';

interface SidebarProps {
  activeView: View;
  onViewChange: (view: View) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  user: UserType | null;
  onLogout: () => void;
  onInstall: () => void;
  isAppInstalled: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  activeView, 
  onViewChange, 
  isOpen, 
  setIsOpen, 
  user, 
  onLogout,
  onInstall,
  isAppInstalled
}) => {
  const isStaff = user?.role === 'staff';

  const sections = [
    {
      label: 'Main Menu',
      items: [
        { id: View.Dashboard, icon: LayoutDashboard, label: 'Home Dashboard' },
        { id: View.Inventory, icon: Box, label: 'My Stock', hidden: isStaff },
        { id: View.Sales, icon: ShoppingCart, label: 'Sell Items (POS)' },
        { id: View.Returns, icon: ArrowLeftRight, label: 'Returns', hidden: isStaff },
      ]
    },
    {
      label: 'AI & Analysis',
      hidden: isStaff,
      items: [
        { id: View.AIInsights, icon: Sparkles, label: 'AI Help & Tips', hidden: isStaff },
        { id: View.Reports, icon: BarChart3, label: 'Sales Reports', hidden: isStaff },
      ]
    },
    {
      label: 'Tools',
      hidden: isStaff,
      items: [
        { id: View.Stocktake, icon: ClipboardCheck, label: 'Check Stock', hidden: isStaff },
        { id: View.Suppliers, icon: Users, label: 'Suppliers', hidden: isStaff },
      ]
    },
    {
      label: 'Support',
      hidden: isStaff,
      items: [
        { id: View.AboutUs, icon: Info, label: 'About Us' },
        { id: View.HelpCenter, icon: HelpCircle, label: 'Help Center' },
      ]
    },
    {
      label: 'App Settings',
      hidden: isStaff,
      items: [
        { id: View.Settings, icon: Settings, label: 'My Settings', hidden: isStaff },
        { id: View.LaunchCenter, icon: Rocket, label: 'Advanced Settings', hidden: user?.role !== 'admin' },
      ]
    }
  ];

  return (
    <>
      <aside className={`fixed top-0 left-0 h-full w-72 bg-slate-900/98 backdrop-blur-xl z-50 transform transition-all duration-500 border-r border-slate-800 ${isOpen ? 'translate-x-0' : '-translate-x-full'} flex flex-col`}>
        <div className="p-8 flex flex-col gap-6 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 group cursor-pointer" onClick={() => onViewChange(View.Dashboard)}>
              <div className="w-11 h-11 bg-indigo-600 rounded-[1.2rem] flex items-center justify-center shadow-2xl transition-transform duration-500">
                <Box size={24} className="text-white" />
              </div>
              <div className="flex flex-col">
                <span className="font-black text-white text-xl tracking-tighter uppercase leading-none">StockBit Pro</span>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="lg:hidden text-slate-400 p-2 hover:bg-slate-800 rounded-xl transition-colors">
              <X size={20} />
            </button>
          </div>
          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-[0.2em] leading-relaxed">
            EASY SHOP & STOCK MANAGEMENT
          </p>
        </div>

        <nav className="flex-1 px-4 space-y-8 overflow-y-auto scrollbar-hide py-4">
          {sections.map((section, sIdx) => {
            const visibleItems = section.items.filter(i => !i.hidden);
            if (visibleItems.length === 0 || section.hidden) return null;

            return (
              <div key={sIdx} className="space-y-1">
                <h3 className="px-5 text-[9px] font-black text-slate-600 uppercase tracking-[0.3em] mb-3">
                  {section.label}
                </h3>
                {visibleItems.map((item) => (
                  <button 
                    key={item.id} 
                    onClick={() => {
                      onViewChange(item.id);
                      if (window.innerWidth < 1024) setIsOpen(false);
                    }} 
                    className={`w-full group flex items-center justify-between px-5 py-3 rounded-2xl text-[11px] font-bold uppercase tracking-widest transition-all duration-300 ${
                      activeView === item.id 
                      ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20' 
                      : 'text-slate-500 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-1.5 rounded-lg transition-all duration-300 ${activeView === item.id ? 'bg-white/10 scale-110' : ''}`}>
                        <item.icon 
                          size={18} 
                          className={`transition-colors duration-300 ${
                            activeView === item.id ? 'text-white' : 'text-slate-600 group-hover:text-indigo-400'
                          }`} 
                        />
                      </div>
                      <span className="transition-all duration-300">
                        {item.label}
                      </span>
                    </div>
                    {activeView === item.id && (
                      <ChevronRight size={14} className="animate-in fade-in slide-in-from-left-2" />
                    )}
                  </button>
                ))}
              </div>
            );
          })}
        </nav>

        <div className="shrink-0 p-6 bg-slate-900/50 backdrop-blur-md border-t border-slate-800/60 space-y-4">
          {!isAppInstalled && (
            <button 
              onClick={onInstall} 
              className="w-full flex items-center gap-3 px-5 py-4 bg-indigo-600/10 text-indigo-400 hover:bg-indigo-600 hover:text-white rounded-2xl transition-all duration-300 text-[10px] font-black uppercase tracking-[0.2em]"
            >
              <DownloadCloud size={16} /> Save to My Home Screen
            </button>
          )}
          
          <div className="flex items-center gap-3 p-4 bg-slate-800/40 rounded-2xl border border-slate-700/30">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-sm uppercase">
              {user?.name?.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-white truncate uppercase tracking-tighter">
                {user?.name}
              </p>
              <p className="text-[8px] text-slate-500 truncate uppercase font-bold tracking-[0.2em]">
                {user?.role === 'admin' ? 'Shop Admin' : user?.role === 'staff' ? 'Shop Staff' : 'Shop Owner'}
              </p>
            </div>
            <button onClick={onLogout} className="p-2 text-slate-500 hover:text-rose-500 transition-colors" title="Log Out">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
      {isOpen && window.innerWidth < 1024 && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-40 lg:hidden" onClick={() => setIsOpen(false)} />
      )}
    </>
  );
};

export default Sidebar;