
import React from 'react';
import { 
  Box, 
  Zap, 
  ShieldCheck, 
  Sparkles, 
  TrendingUp, 
  ShoppingCart, 
  Globe, 
  Smartphone,
  CheckCircle2,
  ArrowRight,
  BarChart3,
  Layers
} from 'lucide-react';

interface LandingPageProps {
  onAuth: (step: 'login' | 'register') => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onAuth }) => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-sans selection:bg-indigo-500 selection:text-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/70 dark:bg-slate-950/70 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
              <Box size={24} className="text-white" />
            </div>
            <span className="font-black text-xl tracking-tighter uppercase">StockBit Pro</span>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => onAuth('login')}
              className="px-6 py-2.5 text-sm font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 hover:text-indigo-600 transition-colors"
            >
              Login
            </button>
            <button 
              onClick={() => onAuth('register')}
              className="hidden sm:block px-8 py-3 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-600/20 active:scale-95 transition-all"
            >
              Start Free Trial
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-6">
        <div className="max-w-5xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800 rounded-full">
            <Sparkles size={14} className="text-indigo-600" />
            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Powered by Gemini 3 Logic</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-none uppercase">
            The Future of Inventory <br className="hidden md:block"/> for <span className="text-indigo-600">African Enterprise</span>.
          </h1>
          <p className="max-w-2xl mx-auto text-lg md:text-xl text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
            High-speed cloud management built for Nigeria's retail landscape. 
            AI-powered scanning, real-time POS, and deep business intelligence.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button 
              onClick={() => onAuth('register')}
              className="w-full sm:w-auto px-10 py-5 bg-indigo-600 text-white rounded-[2rem] font-black uppercase text-xs tracking-[0.2em] shadow-2xl shadow-indigo-600/40 active:scale-95 transition-all flex items-center justify-center gap-3"
            >
              Start 60-Day Trial <ArrowRight size={20} />
            </button>
            <button 
              onClick={() => onAuth('login')}
              className="w-full sm:w-auto px-10 py-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] font-black uppercase text-xs tracking-[0.2em] active:scale-95 transition-all"
            >
              Explore Demo
            </button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 px-6 bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard 
              icon={<Zap className="text-amber-500" />} 
              title="Smart AI Scanner" 
              desc="Extract SKUs and details from packaging instantly using Gemini 3 Vision." 
            />
            <FeatureCard 
              icon={<ShoppingCart className="text-emerald-500" />} 
              title="Mobile POS" 
              desc="Sell anywhere. Record transactions, print receipts, and track debt flow." 
            />
            <FeatureCard 
              icon={<Globe className="text-indigo-500" />} 
              title="Cloud Sync" 
              desc="Synchronized inventory across phone, tablet, and PC in real-time." 
            />
            <FeatureCard 
              icon={<ShieldCheck className="text-slate-900 dark:text-white" />} 
              title="Secure Vault" 
              desc="Enterprise-grade encryption protecting your financial and stock data." 
            />
          </div>
        </div>
      </section>

      {/* Social Proof / Stats */}
      <section className="py-24 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <h2 className="text-4xl font-black uppercase tracking-tighter">Designed for Growth.</h2>
            <div className="space-y-6">
              <StatItem title="99.9% Uptime" desc="Built on high-availability cloud architecture for zero downtime." />
              <StatItem title="Multi-Staff" desc="Deploy terminals for cashiers and warehouse managers instantly." />
              <StatItem title="Marketplace Sync" desc="Connect directly to Jumia, Konga, and WhatsApp catalogs." />
            </div>
          </div>
          <div className="relative">
            <div className="bg-indigo-600 rounded-[3rem] p-12 text-white shadow-2xl relative z-10 overflow-hidden">
              <BarChart3 size={120} className="absolute -bottom-10 -right-10 text-white/10" />
              <h3 className="text-2xl font-black uppercase mb-4 italic">"Transformative."</h3>
              <p className="text-lg font-medium text-indigo-100 mb-8 leading-relaxed">
                "StockBit Pro cut our inventory leakage by 40% in the first month. 
                The AI scanner makes restocking actually enjoyable."
              </p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center font-black">OE</div>
                <div>
                  <p className="font-black uppercase text-sm">Olabisi E.</p>
                  <p className="text-[10px] font-bold uppercase text-indigo-300">CEO, Apex Electronics</p>
                </div>
              </div>
            </div>
            <div className="absolute inset-0 bg-indigo-600 blur-[100px] opacity-20 -z-10"></div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 text-center bg-slate-900 text-white relative overflow-hidden">
        <Layers className="absolute -top-10 -left-10 w-64 h-64 text-white/5 rotate-12" />
        <Smartphone className="absolute -bottom-10 -right-10 w-64 h-64 text-white/5 -rotate-12" />
        
        <div className="max-w-3xl mx-auto relative z-10 space-y-8">
          <h2 className="text-4xl md:text-5xl font-black tracking-tighter uppercase">Ready to scale your business?</h2>
          <p className="text-slate-400 font-medium text-lg leading-relaxed">
            Join the elite circle of Nigerian retailers using high-performance logistics.
            No credit card required for trial.
          </p>
          <button 
            onClick={() => onAuth('register')}
            className="px-12 py-6 bg-white text-slate-900 rounded-[2rem] font-black uppercase text-sm tracking-widest shadow-2xl active:scale-95 transition-all"
          >
            Deploy StockBit Pro Now
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-slate-200 dark:border-slate-800 text-center">
        <div className="flex flex-col items-center gap-6">
          <div className="flex items-center gap-3 grayscale opacity-50">
            <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
              <Box size={18} className="text-white" />
            </div>
            <span className="font-black text-sm uppercase tracking-widest">StockBit Pro</span>
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">
            © 2025 STOCKBIT TECHNOLOGIES LTD. MADE IN LAGOS.
          </p>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) => (
  <div className="p-8 bg-slate-50 dark:bg-slate-800/50 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 hover:border-indigo-500/30 transition-all group">
    <div className="w-14 h-14 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center shadow-sm mb-6 group-hover:scale-110 transition-transform">
      {React.cloneElement(icon as React.ReactElement, { size: 28 })}
    </div>
    <h3 className="text-lg font-black uppercase tracking-tighter mb-2">{title}</h3>
    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{desc}</p>
  </div>
);

const StatItem = ({ title, desc }: { title: string, desc: string }) => (
  <div className="flex gap-4">
    <div className="mt-1">
      <CheckCircle2 size={20} className="text-emerald-500" />
    </div>
    <div>
      <h4 className="text-lg font-black uppercase tracking-tighter">{title}</h4>
      <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{desc}</p>
    </div>
  </div>
);

export default LandingPage;
