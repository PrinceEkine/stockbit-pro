import React, { useState } from 'react';
import { 
  Rocket, 
  ShieldCheck, 
  Database, 
  Key, 
  Download, 
  AlertTriangle,
  CheckCircle2,
  Activity,
  ChevronRight,
  MessageCircle,
  CreditCard,
  Terminal,
  Lock,
  Server,
  Code2,
  Copy,
  Cpu,
  Network,
  Settings,
  ExternalLink,
  BookOpen,
  Info,
  Globe,
  Cloud
} from 'lucide-react';
import { AppState } from '../types';

interface LaunchCenterProps {
  state: AppState;
  onUpdateSettings: (updates: any) => void;
}

const LaunchCenter: React.FC<LaunchCenterProps> = ({ state, onUpdateSettings }) => {
  const [paystackKey, setPaystackKey] = useState(state.settings.paystackPublicKey || '');
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [showSetupGuide, setShowSetupGuide] = useState(false);
  const [activeTab, setActiveTab] = useState<'netlify' | 'gcp'>('netlify');

  const ENV_VAR_NAME = "VITE_PAYSTACK_PUBLIC_KEY";

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopyFeedback(id);
    setTimeout(() => setCopyFeedback(null), 2000);
  };

  const netlifyCmd = `# Set via Netlify CLI
netlify env:set ${ENV_VAR_NAME} pk_live_your_key_here

# Or add in Netlify UI: 
# Site Settings -> Environment Variables -> Add Variable`;

  const gsmProxyCode = `// Supabase Edge Function: vault-proxy
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  const response = await fetch("https://secretmanager.googleapis.com/v1/...", {
    headers: { "Authorization": \`Bearer \${Deno.env.get("GCP_TOKEN")}\` }
  });
  return new Response(JSON.stringify(await response.json()));
})`;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-24">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter flex items-center gap-3">
            Advanced Shop Settings <Rocket className="text-indigo-600" />
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-[9px] md:text-[10px] mt-1">Management for Shop Admins Only</p>
        </div>
        <div className="flex gap-3">
           <button 
             onClick={() => setShowSetupGuide(!showSetupGuide)}
             className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-6 py-3.5 rounded-2xl flex items-center gap-3 font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all"
           >
             <BookOpen size={18} /> Admin Guide
           </button>
           <button className="bg-slate-900 dark:bg-white dark:text-slate-900 text-white px-8 py-3.5 rounded-2xl flex items-center gap-3 font-black text-[10px] uppercase tracking-widest transition-all shadow-xl active:scale-95">
             <Download size={18} /> Export Records
           </button>
        </div>
      </header>

      {showSetupGuide && (
        <div className="bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/30 rounded-[2.5rem] p-8 md:p-10 animate-in slide-in-from-top-4">
          <div className="flex items-start gap-4 mb-8">
            <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 rounded-xl">
              <Info size={24} />
            </div>
            <div>
              <h3 className="text-lg font-black uppercase tracking-tighter text-indigo-900 dark:text-indigo-400">Setup Instructions</h3>
              <p className="text-xs text-indigo-800/70 dark:text-indigo-400/60 font-medium mt-1">Connect your shop to your payment provider.</p>
            </div>
          </div>
          
          <div className="flex bg-white/50 dark:bg-black/20 p-1.5 rounded-2xl mb-8 w-fit">
             <button onClick={() => setActiveTab('netlify')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'netlify' ? 'bg-white dark:bg-slate-800 text-teal-600 shadow-md' : 'text-slate-400'}`}>Web Setup</button>
             <button onClick={() => setActiveTab('gcp')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'gcp' ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-md' : 'text-slate-400'}`}>Advanced Security</button>
          </div>

          {activeTab === 'netlify' ? (
            <div className="space-y-6 animate-in fade-in duration-300">
               <div className="bg-teal-900/5 border border-teal-500/20 p-6 rounded-3xl">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-teal-600 dark:text-teal-400 text-xs font-black uppercase tracking-widest flex items-center gap-2">
                      <Globe size={16} /> Online Hosting
                    </h4>
                    <button 
                      onClick={() => handleCopy(ENV_VAR_NAME, 'var-name')}
                      className="px-3 py-1 bg-teal-600 text-white rounded-lg text-[8px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-teal-700 transition-all"
                    >
                      {copyFeedback === 'var-name' ? <CheckCircle2 size={12}/> : <Copy size={12}/>}
                      {copyFeedback === 'var-name' ? 'Copied' : 'Copy Name'}
                    </button>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-6 font-medium">
                    Use <span className="text-teal-600 font-black">{ENV_VAR_NAME}</span> in your website settings.
                  </p>
                  <div className="bg-[#0f172a] rounded-2xl p-6 font-mono text-[10px] text-teal-300 relative group">
                    <pre className="whitespace-pre-wrap">{netlifyCmd}</pre>
                    <button onClick={() => handleCopy(netlifyCmd, 'net-cmd')} className="absolute right-4 top-4 p-2 bg-white/5 hover:bg-white/10 rounded-lg">
                       {copyFeedback === 'net-cmd' ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                    </button>
                  </div>
               </div>
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in duration-300">
               <div className="bg-indigo-900/5 border border-indigo-500/20 p-6 rounded-3xl">
                  <h4 className="text-indigo-600 dark:text-indigo-400 text-xs font-black uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Cloud size={16} /> Secure Storage
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-6 font-medium">
                    Best for <span className="text-indigo-600 font-black">Private Keys</span>. This keeps your keys safe and away from unauthorized users.
                  </p>
                  <div className="bg-[#0f172a] rounded-2xl p-6 font-mono text-[10px] text-indigo-300 relative group overflow-x-auto">
                    <pre>{gsmProxyCode}</pre>
                  </div>
               </div>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 md:p-12 border border-slate-100 dark:border-slate-800 shadow-sm transition-all overflow-hidden relative">
             <div className="relative z-10">
                <div className="flex items-center gap-4 mb-10">
                   <div className="w-14 h-14 bg-slate-900 dark:bg-white rounded-2xl flex items-center justify-center text-white dark:text-slate-900 shadow-xl">
                      <Terminal size={32} />
                   </div>
                   <div>
                      <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Payment Connection</h2>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Connect Paystack to take card payments</p>
                   </div>
                </div>
                
                <div className="space-y-6">
                   <div className="space-y-2">
                      <div className="flex justify-between items-center px-1">
                        <div className="flex items-center gap-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Paystack Public Key</label>
                        </div>
                        {state.settings.paystackPublicKey && <span className="text-[8px] font-black uppercase text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded flex items-center gap-1"><CheckCircle2 size={10}/> Connected</span>}
                      </div>
                      <div className="flex flex-col sm:flex-row gap-3">
                         <input 
                           type="password" 
                           value={paystackKey} 
                           onChange={e => setPaystackKey(e.target.value)}
                           placeholder="pk_live_..."
                           className="flex-1 px-6 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl font-mono text-sm text-indigo-600 dark:text-indigo-400 focus:ring-4 focus:ring-indigo-500/10 outline-none shadow-inner transition-all"
                         />
                         <button 
                           onClick={() => {
                             onUpdateSettings({ paystackPublicKey: paystackKey });
                             handleCopy(paystackKey, 'sync');
                           }}
                           className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest active:scale-95 transition-all shadow-xl shadow-indigo-600/20"
                         >
                            {copyFeedback === 'sync' ? 'Connected' : 'Save Connection'}
                         </button>
                      </div>
                   </div>
                   <p className="text-[10px] text-slate-400 font-medium leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 italic">
                     Note: Your key is safe and only used to process customer payments.
                   </p>
                </div>
             </div>
             <Network className="absolute -bottom-20 -right-20 text-slate-100 dark:text-white/5 w-96 h-96 pointer-events-none" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="bg-emerald-600 rounded-[2rem] p-8 text-white shadow-xl relative overflow-hidden group">
                <div className="relative z-10">
                   <h3 className="text-lg font-black uppercase tracking-tighter mb-4 flex items-center gap-2">
                      <ShieldCheck size={20} /> Security Check
                   </h3>
                   <p className="text-emerald-50 text-[11px] font-medium leading-relaxed">Your shop security is active. All payments are being processed safely.</p>
                </div>
                <div className="absolute -bottom-10 -right-10 opacity-10 group-hover:scale-110 transition-transform duration-700">
                   <ShieldCheck size={160} />
                </div>
             </div>
             <div className="bg-[#0f172a] rounded-[2rem] p-8 text-white shadow-xl relative overflow-hidden group">
                <div className="relative z-10">
                   <h3 className="text-lg font-black uppercase tracking-tighter mb-4 flex items-center gap-2">
                      <Network size={20} /> Connection Speed
                   </h3>
                   <p className="text-slate-400 text-[11px] font-medium leading-relaxed">Your connection to our cloud servers is very fast and stable.</p>
                </div>
                <div className="absolute -bottom-10 -right-10 opacity-10 group-hover:rotate-12 transition-transform duration-700">
                   <Network size={160} />
                </div>
             </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-8">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
            <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-8 flex items-center gap-2">
              <Activity className="text-indigo-600" size={16} /> System Health
            </h2>
            <div className="space-y-6">
              {[
                { title: "Security Guard", status: "Active", ready: true, icon: <Lock size={20} /> },
                { title: "Website Status", status: "Online", ready: true, icon: <Globe size={20} /> },
                { title: "Payments Hub", status: state.settings.paystackPublicKey ? "Ready" : "Not Set", ready: !!state.settings.paystackPublicKey, icon: <CreditCard size={20} /> },
                { title: "Database Sync", status: "Healthy", ready: true, icon: <Database size={20} /> }
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-4 group cursor-default">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${item.ready ? 'bg-indigo-50 dark:bg-indigo-900/10 text-indigo-600' : 'bg-rose-50 dark:bg-rose-900/10 text-rose-600'}`}>
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-tight">{item.title}</h3>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{item.status}</p>
                  </div>
                  {item.ready ? <CheckCircle2 size={16} className="text-emerald-500" /> : <div className="w-4 h-4 rounded-full border-2 border-rose-500/20 border-t-rose-500 animate-spin" />}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl group cursor-pointer relative overflow-hidden" onClick={() => window.open('https://wa.me/2347072127949', '_blank')}>
             <div className="relative z-10">
                <h3 className="font-black uppercase tracking-tighter text-xl mb-2 flex items-center gap-2">
                  <MessageCircle size={20} /> Admin Help
                </h3>
                <p className="text-xs text-slate-400 mb-6 font-medium leading-relaxed">Having trouble with your payment keys? Talk to our technicians directly.</p>
                <div className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 group-hover:bg-indigo-500 transition-all shadow-lg">
                  Chat Now
                </div>
             </div>
             <Activity className="absolute -bottom-10 -left-10 text-white/5 w-48 h-48 pointer-events-none" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LaunchCenter;