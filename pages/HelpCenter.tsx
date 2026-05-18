
import React from 'react';
import { 
  HelpCircle, 
  MessageCircle, 
  Phone, 
  Wifi, 
  Camera, 
  Key, 
  RefreshCw, 
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Zap,
  CreditCard,
  ShieldCheck,
  Box,
  ChevronRight
} from 'lucide-react';

const HelpCenter: React.FC = () => {
  return (
    <div className="space-y-12 animate-in fade-in duration-500 max-w-full pb-20">
      <div className="space-y-4 text-left">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Help Center</h2>
        <p className="text-lg text-slate-500 dark:text-slate-400 font-normal leading-relaxed max-w-2xl">
          Resources and support to help you manage your business efficiently.
        </p>
      </div>

      {/* QUICK SOLUTIONS SECTION */}
      <section className="space-y-8">
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-4">
           <Zap className="text-amber-500" size={20} />
           <h3 className="text-lg font-bold text-slate-900 dark:text-white">Quick Troubleshooting</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FixCard 
            icon={<RefreshCw size={20} />}
            title="App Performance Issues"
            fix="If the applications feels slow, try refreshing your browser or clearing your cache. Most connectivity issues are resolved with a simple reload."
            color="bg-blue-50 text-blue-600 dark:bg-blue-900/10 dark:text-blue-400"
          />
          <FixCard 
            icon={<Camera size={20} />}
            title="Smarter Scanning"
            fix="Ensure browser permissions are granted for camera access. For best results, use the stock scan module in well-lit environments."
            color="bg-purple-50 text-purple-600 dark:bg-purple-900/10 dark:text-purple-400"
          />
          <FixCard 
            icon={<Wifi size={20} />}
            title="Data Synchronization"
            fix="Wait for the sync indicator to confirm updates. If working offline, your changes will be pushed once your connection is restored."
            color="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/10 dark:text-emerald-400"
          />
          <FixCard 
            icon={<Key size={20} />}
            title="Credential Access"
            fix="Verify staff 'Invite IDs' in the Team Management dashboard. Each staff member requires a valid ID for specialized account creation."
            color="bg-rose-50 text-rose-600 dark:bg-rose-900/10 dark:text-rose-400"
          />
        </div>
      </section>

      {/* DETAILED GUIDES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <HelpItem 
          title="Business Configuration" 
          desc="Setup your business profile, upload branding assets, and configure locale settings." 
          icon={<Box size={20} />} 
        />
        <HelpItem 
          title="Sales Intelligence" 
          desc="Understand how to record transactions and generate professional invoices." 
          icon={<Smartphone size={20} />} 
        />
        <HelpItem 
          title="Billing & Plans" 
          desc="Manage your subscription tier and view upcoming renewal schedules." 
          icon={<CreditCard size={20} />} 
        />
        <HelpItem 
          title="Data Stewardship" 
          desc="Learn about our encryption protocols and how we protect your commercial data." 
          icon={<ShieldCheck size={20} />} 
        />
      </div>

      {/* DIRECT CONTACT */}
      <div className="bg-slate-900 dark:bg-slate-800 p-8 md:p-10 rounded-2xl text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
           <div className="space-y-2 text-center md:text-left">
              <h3 className="text-2xl font-bold">Still need assistance?</h3>
              <p className="text-slate-400 text-sm font-normal max-w-sm">Our support engineers are available daily to resolve technical queries.</p>
           </div>
           <div className="flex flex-wrap justify-center gap-4">
              <a href="tel:07010698264" className="flex items-center gap-2 px-6 py-3 bg-white text-slate-900 rounded-xl font-bold text-xs hover:bg-slate-100 transition-all">
                <Phone size={16}/> Voice Support
              </a>
              <a href="https://wa.me/2347072127949" className="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-xl font-bold text-xs hover:bg-emerald-600 transition-all">
                <MessageCircle size={16}/> WhatsApp Chat
              </a>
           </div>
        </div>
      </div>
    </div>
  );
};

const FixCard = ({ icon, title, fix, color }: any) => (
  <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-transform hover:scale-[1.01]">
    <div className={`w-10 h-10 ${color} rounded-lg flex items-center justify-center mb-4`}>
      {icon}
    </div>
    <h4 className="text-md font-bold text-slate-900 dark:text-white mb-2">{title}</h4>
    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-normal">{fix}</p>
  </div>
);

const HelpItem = ({ title, desc, icon }: any) => (
  <button className="flex items-center justify-between p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-600 transition-all text-left">
    <div className="flex items-center gap-4">
      <div className="text-indigo-600 dark:text-indigo-400">{icon}</div>
      <div>
        <p className="text-sm font-bold text-slate-900 dark:text-white">{title}</p>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">{desc}</p>
      </div>
    </div>
    <ChevronRight size={16} className="text-slate-300" />
  </button>
);

export default HelpCenter;
