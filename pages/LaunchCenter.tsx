
import React, { useState, useEffect } from 'react';
import { 
  Rocket, 
  Download, 
  CheckCircle2,
  Terminal,
  RefreshCw,
  Triangle, 
  ArrowRightLeft,
  Copy,
  Info,
  Globe,
  Server,
  Database,
  ShieldCheck,
  Cpu,
  ExternalLink,
  Wifi,
  Cloud,
  AlertTriangle
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { AppState } from '../types';

interface LaunchCenterProps {
  state: AppState;
  onUpdateSettings: (updates: any) => void;
}

const LaunchCenter: React.FC<LaunchCenterProps> = ({ state, onUpdateSettings }) => {
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'deploy' | 'connectivity'>('deploy');
  
  // Connectivity Test States
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{status: 'success' | 'error', message: string} | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopyFeedback(id);
    setTimeout(() => setCopyFeedback(null), 2000);
  };

  const testConnectivity = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: "Respond with: 'SYSTEM_ONLINE'",
      });
      
      if (response.text?.includes('SYSTEM_ONLINE')) {
        setTestResult({
          status: 'success',
          message: "Gemini API Link Active. Your Free Tier key is correctly configured and authenticated."
        });
      } else {
        throw new Error("Unexpected response from AI node.");
      }
    } catch (err: any) {
      setTestResult({
        status: 'error',
        message: err.message || "Connection failed. Please ensure your API key is correctly entered in the browser dialog."
      });
    } finally {
      setIsTesting(false);
    }
  };

  const netlifyCmd = `npm install -g netlify-cli
netlify login
netlify init
# Build & Deploy to Production
npm run build
netlify deploy --prod --dir=dist`;

  const firebaseCmd = `npm install -g firebase-tools
firebase login
firebase init
# Select Hosting, public: dist, SPA: Yes
npm run build
firebase deploy`;

  const envVariables = `VITE_PAYSTACK_PUBLIC_KEY=pk_live_...
VITE_GEMINI_API_KEY=...
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...`;

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20 max-w-6xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">Launch Center</h1>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-1 flex items-center gap-2">
            <Rocket size={14} className="text-indigo-600" /> Infrastructure & Deployment Control
          </p>
        </div>
        <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl border border-slate-200 dark:border-slate-800">
          <button onClick={() => setActiveTab('deploy')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'deploy' ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-sm' : 'text-slate-400'}`}>Cloud Deployment</button>
          <button onClick={() => setActiveTab('connectivity')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'connectivity' ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-sm' : 'text-slate-400'}`}>API Health</button>
        </div>
      </header>

      {activeTab === 'connectivity' && (
        <div className="space-y-8 px-4 animate-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-8">
              <div className="w-16 h-16 bg-indigo-600 text-white rounded-[1.5rem] flex items-center justify-center shadow-xl shadow-indigo-600/30">
                <Cpu size={32} />
              </div>
              <div className="space-y-4">
                <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">AI Connectivity Check</h2>
                <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                  Validate your Google AI Studio key. This test uses the <strong>Gemini 3 Flash</strong> model which supports the **Free Tier** for inventory insights and scanning.
                </p>
              </div>

              {testResult && (
                <div className={`p-6 rounded-[1.5rem] border-2 flex items-start gap-4 animate-in fade-in zoom-in-95 ${testResult.status === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-800 dark:bg-emerald-900/10 dark:border-emerald-900' : 'bg-rose-50 border-rose-100 text-rose-800 dark:bg-rose-900/10 dark:border-rose-900'}`}>
                  {testResult.status === 'success' ? <CheckCircle2 className="shrink-0" /> : <AlertTriangle className="shrink-0" />}
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest mb-1">{testResult.status === 'success' ? 'Link Secured' : 'Link Failed'}</p>
                    <p className="text-xs font-bold leading-relaxed">{testResult.message}</p>
                  </div>
                </div>
              )}

              <button 
                onClick={testConnectivity}
                disabled={isTesting}
                className="w-full py-6 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[2rem] font-black uppercase text-xs tracking-[0.2em] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-4 disabled:opacity-50"
              >
                {isTesting ? <RefreshCw size={20} className="animate-spin" /> : <Wifi size={20} />}
                {isTesting ? 'PINGING AI NODE...' : 'RUN CONNECTIVITY TEST'}
              </button>
            </div>

            <div className="bg-slate-900 rounded-[3rem] p-10 flex flex-col justify-between relative overflow-hidden shadow-2xl">
              <div className="space-y-6 relative z-10">
                <h3 className="text-xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                  <ShieldCheck className="text-indigo-400" /> Key Security Protocol
                </h3>
                <div className="space-y-4">
                  <SecurityFeature label="End-to-End Encryption" desc="Keys never leave your browser memory." />
                  <SecurityFeature label="Local Execution" desc="AI requests are made directly from your device." />
                  <SecurityFeature label="No Data Retention" desc="StockBit Pro does not store your API keys." />
                </div>
              </div>
              <div className="absolute -bottom-20 -right-20 text-white/5">
                <ShieldCheck size={300} />
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'deploy' && (
        <div className="space-y-8 px-4 animate-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/30">
                  <Globe size={24} />
                </div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Netlify Cloud (Primary)</h2>
              </div>
              
              <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-[2rem] relative group">
                <div className="flex justify-between items-center mb-4">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">NETLIFY CLI WORKFLOW</p>
                  <button onClick={() => handleCopy(netlifyCmd, 'netlify')} className="text-indigo-600">
                    {copyFeedback === 'netlify' ? <CheckCircle2 size={16} /> : <Copy size={16} />}
                  </button>
                </div>
                <pre className="text-xs font-mono text-slate-600 dark:text-slate-400 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                  {netlifyCmd}
                </pre>
              </div>

              <div className="p-6 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-start gap-4">
                <Info size={20} className="text-indigo-600 shrink-0 mt-1" />
                <p className="text-[11px] font-bold text-indigo-900 dark:text-indigo-200 leading-relaxed uppercase">
                  Netlify is the verified deployment standard for StockBit Pro. It supports our SPA routing doctrine and global CDN requirements.
                </p>
              </div>
              
              <a 
                href="https://app.netlify.com/start" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-black uppercase text-[10px] tracking-widest shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all"
              >
                Go to Netlify App <ExternalLink size={14} />
              </a>
            </div>

            <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl flex items-center justify-center shadow-lg">
                  <Server size={24} />
                </div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Environment Configuration</h2>
              </div>
              
              <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-[2rem] relative group">
                <div className="flex justify-between items-center mb-4">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">REQUIRED SECRET KEYS</p>
                  <button onClick={() => handleCopy(envVariables, 'env')} className="text-indigo-600">
                    {copyFeedback === 'env' ? <CheckCircle2 size={16} /> : <Copy size={16} />}
                  </button>
                </div>
                <pre className="text-xs font-mono text-slate-600 dark:text-slate-400 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                  {envVariables}
                </pre>
              </div>

              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-3">
                  <CheckCircle2 size={18} className="text-emerald-500" />
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-600 dark:text-slate-300">Automatic PWA caching</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 size={18} className="text-emerald-500" />
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-600 dark:text-slate-300">Continuous Integration</span>
                </div>
              </div>
              
              <div className="p-4 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                 <p className="text-[9px] font-black uppercase text-slate-400 text-center leading-relaxed">Ensure you add these in your Netlify Site Settings &gt; Build &amp; Deploy &gt; Environment Variables.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const SecurityFeature = ({ label, desc }: any) => (
  <div className="flex items-start gap-4">
    <div className="mt-1">
      <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
    </div>
    <div>
      <p className="text-[10px] font-black uppercase text-white tracking-widest leading-none mb-1">{label}</p>
      <p className="text-[10px] text-slate-500 font-bold uppercase">{desc}</p>
    </div>
  </div>
);

export default LaunchCenter;
