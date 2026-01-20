
import React from 'react';
import { HelpCircle, Search, MessageCircle, Phone, FileText } from 'lucide-react';

const HelpCenter: React.FC = () => {
  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <div className="space-y-6">
        <h1 className="text-5xl font-black tracking-tighter uppercase dark:text-white">Support Protocol</h1>
        <p className="text-xl text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-2xl">
          Everything you need to master your operational terminal.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <HelpItem 
          title="Terminal Setup" 
          desc="How to configure your inventory logic and staff accounts." 
          icon={<Box size={24} />} 
        />
        <HelpItem 
          title="AI Auditing" 
          desc="Maximizing the utility of Flash SKU identification." 
          icon={<Zap size={24} />} 
        />
        <HelpItem 
          title="Billing & Subs" 
          desc="Managing your enterprise license and Paystack renewals." 
          icon={<CreditCard size={24} />} 
        />
        <HelpItem 
          title="Security Sync" 
          desc="Understanding data persistence and device perimeter safety." 
          icon={<ShieldCheck size={24} />} 
        />
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/20 p-10 rounded-[3rem] border border-indigo-100 dark:border-indigo-800">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
           <div className="space-y-4">
              <h2 className="text-2xl font-black uppercase tracking-tighter dark:text-white">Direct Command Support</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Connect with our engineering team for critical ticket resolution.</p>
           </div>
           <div className="flex flex-wrap gap-4">
              <a href="tel:07010698264" className="flex items-center gap-3 px-8 py-4 bg-white dark:bg-slate-800 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-sm hover:scale-105 transition-transform dark:text-white"><Phone size={16}/> Voice</a>
              <a href="https://wa.me/234707217949" className="flex items-center gap-3 px-8 py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg hover:scale-105 transition-transform"><MessageCircle size={16}/> WhatsApp</a>
           </div>
        </div>
      </div>
    </div>
  );
};

const HelpItem = ({ title, desc, icon }: any) => (
  <div className="p-8 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm group hover:border-indigo-500/30 transition-all cursor-pointer">
    <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all mb-6">
      {icon}
    </div>
    <h3 className="text-lg font-black uppercase tracking-tighter mb-2 dark:text-white">{title}</h3>
    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{desc}</p>
  </div>
);

import { Box, Zap, CreditCard, ShieldCheck } from 'lucide-react';
export default HelpCenter;
