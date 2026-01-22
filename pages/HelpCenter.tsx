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
  Box
} from 'lucide-react';

const HelpCenter: React.FC = () => {
  return (
    <div className="space-y-12 animate-in fade-in duration-700 max-w-5xl mx-auto">
      <div className="space-y-6 text-center md:text-left">
        <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase dark:text-white">Help & Simple Fixes</h1>
        <p className="text-lg md:text-xl text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-2xl">
          Easy answers to help you run your shop without any stress.
        </p>
      </div>

      {/* QUICK SOLUTIONS SECTION */}
      <section className="space-y-8">
        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
           <Zap className="text-amber-500" size={24} />
           <h2 className="text-xl font-black uppercase tracking-tight dark:text-white">Quick Fixes</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FixCard 
            icon={<RefreshCw size={24} />}
            title="App is hanging or slow?"
            fix="Simply click the 'Start Over' button on the loading screen or refresh your browser page. This fixes 90% of connection problems."
            color="bg-blue-50 text-blue-600"
          />
          <FixCard 
            icon={<Camera size={24} />}
            title="Camera won't scan?"
            fix="Check your phone settings to make sure you 'Allowed' the app to use your camera. Also, wipe your camera lens to make it clear."
            color="bg-purple-50 text-purple-600"
          />
          <FixCard 
            icon={<Wifi size={24} />}
            title="Stock is not updating?"
            fix="Wait a few seconds for the green 'Sync' light. If your internet is very slow, turn your data off and on again to reconnect."
            color="bg-emerald-50 text-emerald-600"
          />
          <FixCard 
            icon={<Key size={24} />}
            title="Staff can't sign in?"
            fix="Make sure you gave them the correct 'Invite ID' from your settings. They must use that ID when they create their staff account."
            color="bg-rose-50 text-rose-600"
          />
        </div>
      </section>

      {/* DETAILED GUIDES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <HelpItem 
          title="Setting up your Shop" 
          desc="Learn how to add your business name, logo, and staff members correctly." 
          icon={<Box size={24} />} 
        />
        <HelpItem 
          title="Sales & Receipts" 
          desc="How to record a sale and print the receipt for your customers." 
          icon={<Smartphone size={24} />} 
        />
        <HelpItem 
          title="Managing Subscriptions" 
          desc="How to pay for your plan using Paystack or Bank Transfer." 
          icon={<CreditCard size={24} />} 
        />
        <HelpItem 
          title="Security & Privacy" 
          desc="How we keep your shop records safe from other people." 
          icon={<ShieldCheck size={24} />} 
        />
      </div>

      {/* DIRECT CONTACT */}
      <div className="bg-indigo-600 dark:bg-indigo-900/40 p-8 md:p-12 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
           <div className="space-y-4 text-center md:text-left">
              <h2 className="text-3xl font-black uppercase tracking-tighter">Still Need Help?</h2>
              <p className="text-indigo-100/80 text-sm font-medium max-w-sm">Our team is online from 8am to 6pm daily. Chat with us on WhatsApp for a fast response.</p>
           </div>
           <div className="flex flex-wrap justify-center gap-4">
              <a href="tel:07010698264" className="flex items-center gap-3 px-8 py-5 bg-white text-indigo-600 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:scale-105 transition-all">
                <Phone size={18}/> Call Support
              </a>
              <a href="https://wa.me/2347072127949" className="flex items-center gap-3 px-8 py-5 bg-emerald-500 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:scale-105 transition-all">
                <MessageCircle size={18}/> Chat WhatsApp
              </a>
           </div>
        </div>
        <HelpCircle className="absolute -bottom-10 -right-10 text-white/5 w-64 h-64" />
      </div>
    </div>
  );
};

const FixCard = ({ icon, title, fix, color }: any) => (
  <div className="p-8 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm flex gap-6">
    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${color}`}>
      {icon}
    </div>
    <div className="space-y-2">
      <h3 className="text-sm font-black uppercase tracking-tight dark:text-white">{title}</h3>
      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{fix}</p>
    </div>
  </div>
);

const HelpItem = ({ title, desc, icon }: any) => (
  <div className="p-8 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm group hover:border-indigo-500/30 transition-all cursor-pointer">
    <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all mb-6">
      {icon}
    </div>
    <h3 className="text-lg font-black uppercase tracking-tighter mb-2 dark:text-white">{title}</h3>
    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{desc}</p>
  </div>
);

export default HelpCenter;