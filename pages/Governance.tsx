
import React from 'react';
import { Shield, Eye, Lock, FileCheck } from 'lucide-react';

const Governance: React.FC = () => {
  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <div className="space-y-6">
        <h1 className="text-5xl font-black tracking-tighter uppercase dark:text-white">Governance & Compliance</h1>
        <p className="text-xl text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-2xl">
          Maintaining absolute operational integrity through strict personnel protocols.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-8">
           <GovCard 
            title="RBAC Protocol" 
            desc="Role-Based Access Control ensures that Cashiers, Inventory Managers, and Admins operate within strictly defined silos." 
            icon={<Shield size={24}/>} 
           />
           <GovCard 
            title="Immutable Ledger" 
            desc="Every transaction creates a cryptographic record that cannot be altered or deleted, ensuring an absolute audit trail." 
            icon={<Lock size={24}/>} 
           />
        </div>
        <div className="space-y-8">
           <GovCard 
            title="Real-time Auditing" 
            desc="AI-driven anomaly detection monitors sales patterns for potential internal shrinkage or logistics leakages." 
            icon={<Eye size={24}/>} 
           />
           <GovCard 
            title="Compliance Bridge" 
            desc="Exportable tax-ready ledgers compliant with Nigerian financial regulations and VAT standards." 
            icon={<FileCheck size={24}/>} 
           />
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm">
        <h3 className="text-xl font-black uppercase tracking-tighter mb-6 dark:text-white">Security Perimeter</h3>
        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed font-medium mb-6">
          Our governance suite is engineered for the highest level of accountability. By deploying StockBit Pro, business owners gain a central command terminal to oversee all decentralized staff activities in real-time.
        </p>
        <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-indigo-600 rounded-full w-full"></div>
        </div>
        <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600 mt-4 text-center">Protocol Integrity 100% Verified</p>
      </div>
    </div>
  );
};

const GovCard = ({ title, desc, icon }: any) => (
  <div className="flex gap-6">
    <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center shrink-0 shadow-inner">
      {icon}
    </div>
    <div>
      <h3 className="text-lg font-black uppercase tracking-tighter mb-2 dark:text-white">{title}</h3>
      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{desc}</p>
    </div>
  </div>
);

export default Governance;
