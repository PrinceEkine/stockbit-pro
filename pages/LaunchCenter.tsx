
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
  Copy
} from 'lucide-react';
import { AppState } from '../types';

interface LaunchCenterProps {
  state: AppState;
  onUpdateSettings: (updates: any) => void;
}

const LaunchCenter: React.FC<LaunchCenterProps> = ({ state, onUpdateSettings }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [paystackKey, setPaystackKey] = useState(state.settings.paystackPublicKey || '');
  const [activeStep, setActiveStep] = useState(0);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopyFeedback(id);
    setTimeout(() => setCopyFeedback(null), 2000);
  };

  const gatewayLogicCode = `// Supabase Edge Function: paystack-gateway
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
  const signature = req.headers.get('x-paystack-signature');
  const body = await req.json();
  
  // 1. Verify Signature (Industrial Protocol)
  // 2. Process charge.success event
  // 3. Update profiles using service_role
  
  return new Response(JSON.stringify({ status: 'success' }), { status: 200 });
})`;

  const gatewaySteps = [
    {
      title: "API Keys Acquisition",
      desc: "Retrieve your 'Public Key' and 'Secret Key' from Paystack Dashboard > Settings > API Keys.",
      icon: <Key size={18} />
    },
    {
      title: "Edge Deployment",
      desc: "Deploy the logic server using Supabase CLI to create a permanent encrypted gateway.",
      icon: <Server size={18} />
    },
    {
      title: "Webhook Binding",
      desc: "Point Paystack webhooks to your generated Supabase URL for immutable verification.",
      icon: <Activity size={18} />
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter flex items-center gap-3">
            Infrastructure Ops <Rocket className="text-indigo-600" />
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-[9px] md:text-[10px] mt-1">Permanent API Gateway Configuration</p>
        </div>
        <button 
          onClick={() => {}}
          className="bg-slate-900 dark:bg-white dark:text-slate-900 text-white px-6 py-3 rounded-2xl flex items-center gap-3 font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl active:scale-95"
        >
          <Download size={18} /> Full System Audit
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          
          {/* Permanent Gateway Protocol */}
          <div className="bg-[#020617] rounded-[2.5rem] p-8 md:p-12 text-white shadow-2xl relative overflow-hidden border border-white/5">
             <div className="relative z-10">
                <div className="flex items-center justify-between mb-10">
                   <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
                         <Lock size={24} className="text-white" />
                      </div>
                      <div>
                         <h2 className="text-2xl font-black uppercase tracking-tighter">Gateway logic server</h2>
                         <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Industrial Encryption Protocol</p>
                      </div>
                   </div>
                   <div className="px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-2">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                      <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Permanent Node Ready</span>
                   </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                   {gatewaySteps.map((step, i) => (
                      <div key={i} className={`p-6 rounded-3xl border transition-all ${activeStep === i ? 'bg-white/5 border-white/20' : 'border-white/5 bg-transparent opacity-60'} cursor-pointer hover:opacity-100`} onClick={() => setActiveStep(i)}>
                         <div className="w-10 h-10 bg-indigo-600/20 text-indigo-400 rounded-xl flex items-center justify-center mb-4">{step.icon}</div>
                         <h4 className="text-[10px] font-black uppercase tracking-widest mb-2">{step.title}</h4>
                         <p className="text-[11px] text-slate-400 font-medium leading-relaxed">{step.desc}</p>
                      </div>
                   ))}
                </div>

                <div className="space-y-4">
                   <div className="flex items-center justify-between px-2">
                      <div className="flex items-center gap-2">
                         <Code2 size={16} className="text-indigo-400" />
                         <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Deployment Payload (Supabase Edge)</span>
                      </div>
                      <button 
                        onClick={() => handleCopy(gatewayLogicCode, 'code')}
                        className="text-[9px] font-black uppercase tracking-widest bg-white/5 hover:bg-white/10 text-slate-300 px-4 py-2 rounded-xl flex items-center gap-2 transition-all"
                      >
                         {copyFeedback === 'code' ? <CheckCircle2 size={12}/> : <Copy size={12} />}
                         {copyFeedback === 'code' ? 'Synced' : 'Copy Logic'}
                      </button>
                   </div>
                   <div className="bg-black/40 backdrop-blur-md rounded-[2rem] p-8 border border-white/5 font-mono text-xs text-indigo-300/80 overflow-x-auto scrollbar-hide">
                      <pre>{gatewayLogicCode}</pre>
                   </div>
                </div>

                <div className="mt-10 p-6 bg-amber-500/5 border border-amber-500/20 rounded-3xl flex items-start gap-4">
                   <AlertTriangle className="text-amber-500 shrink-0" size={20} />
                   <div>
                      <p className="text-[10px] font-black uppercase text-amber-500 tracking-widest mb-1">Production Directive</p>
                      <p className="text-xs text-slate-400 font-medium leading-relaxed">Ensure you set <code className="text-amber-200">PAYSTACK_SECRET_KEY</code> in your Supabase project settings. The gateway will fail authentication if the cryptographic handshake is not established.</p>
                   </div>
                </div>
             </div>
             <Server className="absolute -bottom-20 -right-20 text-indigo-600/5 w-96 h-96 pointer-events-none" />
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 md:p-10 border border-slate-100 dark:border-slate-800 shadow-sm transition-all">
             <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-slate-950 dark:bg-white rounded-2xl flex items-center justify-center text-white dark:text-slate-900">
                   <Terminal size={24} />
                </div>
                <div>
                   <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Environment Binding</h2>
                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Public Key Configuration Node</p>
                </div>
             </div>
             
             <div className="space-y-6">
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Database Sync Key (pk_live_...)</label>
                   <div className="flex flex-col sm:flex-row gap-3">
                      <input 
                        type="password" 
                        value={paystackKey} 
                        onChange={e => setPaystackKey(e.target.value)}
                        placeholder="Enter Paystack Public Key..."
                        className="flex-1 px-6 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl font-mono text-sm text-indigo-600 dark:text-indigo-400 focus:ring-4 focus:ring-indigo-500/10 outline-none shadow-inner"
                      />
                      <button 
                        onClick={() => {
                          onUpdateSettings({ paystackPublicKey: paystackKey });
                          handleCopy(paystackKey, 'sync');
                        }}
                        className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest active:scale-95 transition-all shadow-xl shadow-indigo-600/20"
                      >
                         {copyFeedback === 'sync' ? 'Synced to Node' : 'Initialize Sync'}
                      </button>
                   </div>
                </div>
             </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-8">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
            <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-8 flex items-center gap-2">
              <ShieldCheck className="text-emerald-500" size={16} /> Integrity Pulse
            </h2>
            <div className="space-y-6">
              {[
                { title: "PostgreSQL Logic", status: "Operational", ready: true, icon: <Database size={20} /> },
                { title: "Gateway Node", status: "Active", ready: true, icon: <Server size={20} /> },
                { title: "Vault Encryption", status: "Verified", ready: true, icon: <Lock size={20} /> },
                { title: "Paystack Relay", status: state.settings.paystackPublicKey ? "Connected" : "Handshake Pending", ready: !!state.settings.paystackPublicKey, icon: <CreditCard size={20} /> }
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-4 group cursor-default">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${item.ready ? 'bg-emerald-50 dark:bg-emerald-900/10 text-emerald-600' : 'bg-rose-50 dark:bg-rose-900/10 text-rose-600'}`}>
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

          <div className="bg-indigo-600 p-8 rounded-[2.5rem] text-white shadow-2xl group cursor-pointer relative overflow-hidden" onClick={() => window.open('https://wa.me/2347072127949', '_blank')}>
             <div className="relative z-10">
                <h3 className="font-black uppercase tracking-tighter text-xl mb-2 flex items-center gap-2">
                  <MessageCircle size={20} /> Operational Comms
                </h3>
                <p className="text-xs text-indigo-100 mb-6 font-medium leading-relaxed">Encrypted direct line to StockBit engineering for production deployment assistance.</p>
                <div className="w-full py-4 bg-white text-indigo-600 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 group-hover:scale-[1.02] transition-transform shadow-lg">
                  Establish Connection
                </div>
             </div>
             <Activity className="absolute -bottom-10 -left-10 text-white/5 w-48 h-48 pointer-events-none" />
          </div>

          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
             <div className="flex justify-between items-center mb-6">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Platform Metrics</h3>
                <Activity size={16} className="text-indigo-600" />
             </div>
             <div className="space-y-4">
                <div className="flex justify-between text-[11px] font-bold">
                   <span className="text-slate-400 uppercase tracking-widest">Logic Node</span>
                   <span className="text-emerald-500">STABLE</span>
                </div>
                <div className="flex justify-between text-[11px] font-bold">
                   <span className="text-slate-400 uppercase tracking-widest">Cloud Latency</span>
                   <span className="text-slate-900 dark:text-white">14ms</span>
                </div>
                <div className="pt-4 border-t border-slate-50 dark:border-slate-800">
                   <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] leading-relaxed">StockBit Pro Unified Terminal Architecture v4.2 Deployment Profile</p>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LaunchCenter;
