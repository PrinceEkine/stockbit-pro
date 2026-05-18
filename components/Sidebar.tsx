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
import { View, User as UserType, Settings as SettingsType } from '../types';
import { TRANSLATIONS } from '../constants/translations';

interface SidebarProps {
  activeView: View;
  onViewChange: (view: View) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  user: UserType | null;
  onLogout: () => void;
  onInstall: () => void;
  isAppInstalled: boolean;
  settings: SettingsType;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  activeView, 
  onViewChange, 
  isOpen, 
  setIsOpen, 
  user, 
  onLogout,
  onInstall,
  isAppInstalled,
  settings
}) => {
  const isStaff = user?.role === 'staff';
  const t = TRANSLATIONS[settings.language || 'en'];

  const sections: { label: string; hidden?: boolean; items: { id: View; icon: any; label: string; hidden?: boolean }[] }[] = [
    {
      label: 'Main Menu',
      items: [
        { id: View.Dashboard, icon: LayoutDashboard, label: t.dashboard },
        { id: View.Inventory, icon: Box, label: t.inventory, hidden: isStaff },
        { id: View.Sales, icon: ShoppingCart, label: t.sales },
        { id: View.Returns, icon: ArrowLeftRight, label: t.returns, hidden: isStaff },
      ]
    },
    {
      label: 'AI & Analysis',
      hidden: isStaff,
      items: [
        { id: View.AIInsights, icon: Sparkles, label: t.ai_insights, hidden: isStaff },
        { id: View.Reports, icon: BarChart3, label: t.reports, hidden: isStaff },
      ]
    },
    {
      label: 'Tools',
      hidden: isStaff,
      items: [
        { id: View.Stocktake, icon: ClipboardCheck, label: t.stocktake, hidden: isStaff },
        { id: View.Suppliers, icon: Users, label: t.suppliers, hidden: isStaff },
      ]
    },
    {
      label: 'Support',
      hidden: isStaff,
      items: [
        { id: View.AboutUs, icon: Info, label: t.about_us },
        { id: View.HelpCenter, icon: HelpCircle, label: t.help_center },
      ]
    },
    {
      label: 'App Settings',
      hidden: isStaff,
      items: [
        { id: View.Settings, icon: Settings, label: t.settings, hidden: isStaff },
        { id: View.LaunchCenter, icon: Rocket, label: t.launch_center, hidden: user?.role !== 'admin' },
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
                <span className="font-bold text-white text-xl tracking-tight">StockBit Pro</span>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="lg:hidden text-slate-400 p-2 hover:bg-slate-800 rounded-lg transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-6 overflow-y-auto scrollbar-hide py-2">
          {sections.map((section, sIdx) => {
            const visibleItems = section.items.filter(i => !i.hidden);
            if (visibleItems.length === 0 || section.hidden) return null;

            return (
              <div key={sIdx} className="space-y-1">
                <h3 className="px-4 text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  {section.label}
                </h3>
                {visibleItems.map((item) => (
                  <button 
                    key={item.id} 
                    onClick={() => {
                      onViewChange(item.id);
                      if (window.innerWidth < 1024) setIsOpen(false);
                    }} 
                    className={`w-full group flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      activeView === item.id 
                      ? 'bg-indigo-600 text-white shadow-md' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon 
                        size={18} 
                        className={`transition-colors ${
                          activeView === item.id ? 'text-white' : 'text-slate-500 group-hover:text-indigo-400'
                        }`} 
                      />
                      <span>{item.label}</span>
                    </div>
                    {activeView === item.id && (
                      <ChevronRight size={14} />
                    )}
                  </button>
                ))}
              </div>
            );
          })}
        </nav>

        <div className="shrink-0 p-4 border-t border-slate-800 space-y-4">
          {!isAppInstalled && (
            <button 
              onClick={onInstall} 
              className="w-full flex items-center gap-3 px-4 py-3 bg-slate-800 text-slate-300 hover:bg-indigo-600 hover:text-white rounded-xl transition-all text-sm font-medium"
            >
              <DownloadCloud size={16} /> Install App
            </button>
          )}
          
          <div className="flex flex-col gap-3 p-3 bg-slate-800/50 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold text-sm">
                {user?.name?.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white truncate">
                  {user?.name}
                </p>
                <p className="text-xs text-slate-500 truncate">
                  {user?.role === 'admin' ? 'Administrator' : user?.role === 'staff' ? 'Staff' : 'Owner'}
                </p>
              </div>
            </div>
            <button 
              onClick={onLogout} 
              className="w-full py-2.5 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white rounded-lg transition-all text-xs font-semibold flex items-center justify-center gap-2"
            >
              <LogOut size={14} /> Logout
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