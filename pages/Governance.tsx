
import React from 'react';
import { Shield, Eye, Lock, FileCheck } from 'lucide-react';

const Governance: React.FC = () => {
  return (
    <div className="space-y-12 animate-in fade-in duration-500 max-w-full">
      <div className="space-y-4">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Governance & Compliance</h2>
        <p className="text-lg text-slate-500 dark:text-slate-400 font-normal leading-relaxed max-w-2xl">
          Maintain operational integrity and accountability through structured personnel protocols and auditing.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="space-y-10">
           <GovCard 
            title="Access Protocols (RBAC)" 
            desc="Role-Based Access Control ensures that staff members only access tools relevant to their specific business duties." 
            icon={<Shield size={20}/>} 
           />
           <GovCard 
            title="Transaction Integrity" 
            desc="Every business action is logged with an immutable timestamp, creating a reliable audit trail for financial reviews." 
            icon={<Lock size={20}/>} 
           />
        </div>
        <div className="space-y-10">
           <GovCard 
            title="Anomaly Surveillance" 
            desc="A monitoring layer detects unusual sales patterns, helping to identify and prevent inventory shrinkage." 
            icon={<Eye size={20}/>} 
           />
           <GovCard 
            title="Regulatory Compliance" 
            desc="Export ledgers formatted for standard financial reporting, ensuring alignment with tax and audit requirements." 
            icon={<FileCheck size={20}/>} 
           />
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Accountability Suite</h3>
        <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-6">
          Our governance tools provide business owners with a centralized overview of all staff activities. This structure promotes a transparent work environment and protects organizational assets through intelligent oversight.
        </p>
        <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-indigo-600 rounded-full w-full"></div>
        </div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 mt-4 text-center">System Integrity Verified</p>
      </div>
    </div>
  );
};

const GovCard = ({ title, desc, icon }: any) => (
  <div className="flex gap-5">
    <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/10 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center shrink-0">
      {icon}
    </div>
    <div>
      <h3 className="text-md font-bold text-slate-900 dark:text-white mb-1">{title}</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-normal">{desc}</p>
    </div>
  </div>
);

export default Governance;
