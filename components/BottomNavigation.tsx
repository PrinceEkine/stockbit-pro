import React from 'react';
import { motion } from 'motion/react';
import { 
  LayoutDashboard, 
  Box, 
  ShoppingCart, 
  Sparkles, 
  Menu,
  BarChart3
} from 'lucide-react';
import { View, User as UserType, Settings as SettingsType } from '../types';
import { TRANSLATIONS } from '../constants/translations';

interface BottomNavigationProps {
  activeView: View;
  onViewChange: (view: View) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  user: UserType | null;
  settings: SettingsType;
}

const BottomNavigation: React.FC<BottomNavigationProps> = ({
  activeView,
  onViewChange,
  isSidebarOpen,
  setIsSidebarOpen,
  user,
  settings
}) => {
  const isStaff = user?.role === 'staff';
  const t = TRANSLATIONS[settings.language || 'en'] || TRANSLATIONS.en;

  // Define tab items
  const tabs = [
    {
      id: View.Dashboard,
      icon: LayoutDashboard,
      label: t.dashboard || 'Dashboard',
    },
    {
      id: View.Sales,
      icon: ShoppingCart,
      label: t.sales || 'Sales/POS',
    },
    ...(!isStaff ? [
      {
        id: View.Inventory,
        icon: Box,
        label: t.inventory || 'Inventory',
      },
      {
        id: View.Reports,
        icon: BarChart3,
        label: t.reports || 'Reports',
      }
    ] : [])
  ];

  const handleMoreClick = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="no-print lg:hidden fixed bottom-0 left-0 right-0 z-40 px-4 pb-4 md:pb-6 pt-2 bg-gradient-to-t from-slate-100/90 via-slate-50/75 to-transparent dark:from-slate-950/90 dark:via-slate-950/75 dark:to-transparent backdrop-blur-lg border-t border-slate-200/50 dark:border-slate-800/50">
      <div className="max-w-md mx-auto bg-white/90 dark:bg-slate-900/90 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl md:rounded-[1.8rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex items-center justify-around py-3 px-2">
        {tabs.map((tab) => {
          const isActive = activeView === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                onViewChange(tab.id);
                if (isSidebarOpen) setIsSidebarOpen(false);
              }}
              className="relative flex flex-col items-center justify-center flex-1 py-1 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors focus:outline-none"
            >
              {isActive && (
                <motion.div
                  layoutId="bottom-active-indicator"
                  className="absolute -top-1 w-10 h-1 bg-indigo-600 dark:bg-indigo-500 rounded-full"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              
              <div className={`p-1.5 rounded-xl transition-all ${
                isActive 
                  ? 'text-indigo-600 dark:text-indigo-400 scale-110' 
                  : 'group-hover:scale-105'
              }`}>
                <tab.icon size={22} className="stroke-[2px]" />
              </div>
              
              <span className={`text-[10px] font-black uppercase tracking-wider transition-all duration-300 ${
                isActive 
                  ? 'text-indigo-600 dark:text-indigo-400 font-black' 
                  : 'text-slate-400 dark:text-slate-500 font-bold'
              }`}>
                {tab.label}
              </span>
            </button>
          );
        })}

        {/* More/Sidebar toggle option */}
        <button
          onClick={handleMoreClick}
          className={`relative flex flex-col items-center justify-center flex-1 py-1 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors focus:outline-none ${
            isSidebarOpen ? 'text-indigo-600 dark:text-indigo-400' : ''
          }`}
        >
          <div className={`p-1.5 rounded-xl transition-all ${
            isSidebarOpen 
              ? 'text-indigo-600 dark:text-indigo-400 scale-110' 
              : 'group-hover:scale-105'
          }`}>
            <Menu size={22} className="stroke-[2px]" />
          </div>
          
          <span className={`text-[10px] font-black uppercase tracking-wider ${
            isSidebarOpen 
              ? 'text-indigo-600 dark:text-indigo-400 font-black' 
              : 'text-slate-400 dark:text-slate-500 font-bold'
          }`}>
            {t.menu || 'More'}
          </span>
        </button>
      </div>
    </div>
  );
};

export default BottomNavigation;
