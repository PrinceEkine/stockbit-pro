
import React from 'react';
import { 
  LayoutDashboard, 
  Box, 
  ShoppingCart, 
  Users, 
  Sparkles,
  ClipboardCheck,
  Settings,
  LogOut,
  X,
  User,
  ShieldCheck,
  HelpCircle,
  Rocket
} from 'lucide-react';
import { View, User as UserType } from '../types';

interface SidebarProps {
  activeView: View;
  onViewChange: (view: View) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  user: UserType | null;
  onLogout: () => void;
  onShowHelp: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, onViewChange, isOpen, setIsOpen, user, onLogout, onShowHelp }) => {
  const isAdmin = user?.role === 'admin';

  const navItems = [
    { id: View.Dashboard, icon: LayoutDashboard, label: 'Dashboard', tooltip: 'View overall business performance' },
    { id: View.Inventory, icon: Box, label: 'Inventory', tooltip: 'Manage products and stock levels' },
    { id: View.Stocktake, icon: ClipboardCheck, label: 'Stocktaking', tooltip: 'Audit and reconcile physical inventory' },
    { id: View.Sales, icon: ShoppingCart, label: 'Sales', tooltip: 'Record transactions and view history' },
    { id: View.Suppliers, icon: Users, label: 'Suppliers', tooltip: 'Manage procurement contacts' },
    { id: View.AIInsights, icon: Sparkles, label: 'AI Insights', tooltip: 'AI-driven stock optimization tips' },
    { id: View.Settings, icon: Settings, label: 'Settings', tooltip: 'Configure system preferences' },
  ];

  if (isAdmin) {
    navItems.splice(1, 0, { id: View.UserManagement, icon: ShieldCheck, label: 'Admin Panel', tooltip: 'Manage users and subscriptions' });
    navItems.splice(navItems.length - 1, 0, { id: View.LaunchCenter, icon: Rocket, label: 'Launch Center', tooltip: 'Production readiness and backups' });
  }

  const handleNavClick = (view: View) => {
    onViewChange(view);
    if (window.innerWidth < 768) {
      setIsOpen(false);
    }
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setIsOpen(false)} />
      )}

      <aside className={`
        fixed top-0 left-0 h-full w-64 bg-slate-900 text-slate-100 z-50 transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 md:static flex flex-col
      `}>
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Box size={20} className="text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">StockBit Pro</span>
          </div>
          <button 
            className="md:hidden text-slate-400 hover:text-white" 
            onClick={() => setIsOpen(false)}
            data-tooltip="Close menu"
          >
            <X size={24} />
          </button>
        </div>

        <nav className="mt-6 px-4 flex-1 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              data-tooltip={item.tooltip}
              className={`
                w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all
                ${activeView === item.id 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'}
              `}
            >
              <item.icon size={18} />
              {item.label}
            </button>
          ))}
          
          <button
            onClick={onShowHelp}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-indigo-400 hover:bg-indigo-600/10 hover:text-indigo-300 transition-all mt-4 border border-indigo-500/20"
            data-tooltip="View the Quick Start Guide"
          >
            <HelpCircle size={18} />
            Quick Start Guide
          </button>
        </nav>

        <div className="p-4 mt-auto border-t border-slate-800">
          <div className="p-4 bg-slate-800 rounded-2xl mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-slate-400">
                <User size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate text-white">{isAdmin ? 'Admin Portal' : user?.name || 'Administrator'}</p>
                <p className="text-[10px] text-slate-500 truncate uppercase tracking-wider">{isAdmin ? 'System Root' : 'Store Account'}</p>
              </div>
            </div>
          </div>
          <button 
            onClick={onLogout}
            data-tooltip="Sign out of your account"
            className="w-full flex items-center gap-3 px-4 py-3 text-rose-400 hover:bg-rose-500/10 rounded-xl text-sm font-medium transition-colors"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
