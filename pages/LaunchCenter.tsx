
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
  AlertTriangle,
  Lock
} from 'lucide-react';
import { invokeAi } from "../services/aiClient";
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
      // Round-trip through the server-side gateway (no API key in the browser).
      const response = await invokeAi({
        provider: 'gemini',
        model: 'gemini-2.5-flash',
        contents: [{ role: 'user', parts: [{ text: "Respond with: 'SYSTEM_ONLINE'" }] }],
      });
      const text = response.text;
      if (text?.includes('SYSTEM_ONLINE')) {
        setTestResult({
          status: 'success',
          message: "AI gateway connection successful. The server-side Gemini key is configured and authenticated."
        });
      } else {
        throw new Error("Unexpected response from AI service.");
      }
    } catch (err: any) {
      setTestResult({
        status: 'error',
        message: err.message || "Connection failed. Deploy the ai-gateway Edge Function and set GEMINI_API_KEY with `supabase secrets set`."
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

  const vercelCmd = `npm install -g vercel
vercel login
# vercel.json already carries the SPA rewrite + security headers
npm run build
vercel --prod`;

  const envVariables = `VITE_PAYSTACK_PUBLIC_KEY=pk_live_...
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...`;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 max-w-full">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Setup & Deployment</h2>
          <p className="text-sm text-slate-500">Configure your cloud infrastructure and validate API connectivity.</p>
        </div>
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
          <button 
            onClick={() => setActiveTab('deploy')} 
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'deploy' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-500'}`}
          >
            Infrastructure
          </button>
          <button 
            onClick={() => setActiveTab('connectivity')} 
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'connectivity' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-500'}`}
          >
            API Health
          </button>
        </div>
      </header>

      {activeTab === 'connectivity' && (
        <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
              <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/10 text-indigo-600 rounded-xl flex items-center justify-center">
                <Cpu size={24} />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">AI Diagnostics</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Verify your Gemini API integration. This check ensures the intelligent inventory modules can communicate with Google's services.
                </p>
              </div>

              {testResult && (
                <div className={`p-4 rounded-xl border flex items-start gap-3 ${testResult.status === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-800 dark:bg-emerald-900/5 dark:border-emerald-800 dark:text-emerald-400' : 'bg-rose-50 border-rose-100 text-rose-800 dark:bg-rose-900/5 dark:border-rose-800 dark:text-rose-400'}`}>
                  {testResult.status === 'success' ? <CheckCircle2 size={18} className="shrink-0 mt-0.5" /> : <AlertTriangle size={18} className="shrink-0 mt-0.5" />}
                  <div className="text-sm">
                    <p className="font-bold">{testResult.status === 'success' ? 'Connection Verified' : 'Connection Failed'}</p>
                    <p className="opacity-80">{testResult.message}</p>
                  </div>
                </div>
              )}

              <button 
                onClick={testConnectivity}
                disabled={isTesting}
                className="w-full py-3 bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-700 text-white rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50"
              >
                {isTesting ? <RefreshCw size={18} className="animate-spin" /> : <Wifi size={18} />}
                {isTesting ? 'Testing Link...' : 'Run Connectivity Check'}
              </button>
            </div>

            <div className="bg-slate-900 rounded-2xl p-8 flex flex-col justify-between relative overflow-hidden">
              <div className="space-y-6 relative z-10">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Lock className="text-indigo-400" size={20} /> Security Architecture
                </h3>
                <div className="space-y-6">
                  <SecurityFeature label="Local Key Storage" desc="Secrets are managed via environment variables and never persisted in our database." />
                  <SecurityFeature label="Proxied Requests" desc="Communication with external APIs is encrypted and follows secure protocols." />
                  <SecurityFeature label="Privacy First" desc="Your business data remains your own. Minimal telemetry is used for health checks." />
                </div>
              </div>
              <div className="absolute -bottom-12 -right-12 text-white/5 pointer-events-none">
                <ShieldCheck size={200} />
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'deploy' && (
        <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-900/10 text-indigo-600 rounded-lg">
                  <Globe size={20} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Hosting Guidelines</h3>
              </div>
              
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl relative group">
                <div className="flex justify-between items-center mb-4">
                  <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Netlify CLI Workflow</p>
                  <button onClick={() => handleCopy(netlifyCmd, 'netlify')} className="text-indigo-600 hover:text-indigo-700 transition-colors">
                    {copyFeedback === 'netlify' ? <CheckCircle2 size={16} /> : <Copy size={16} />}
                  </button>
                </div>
                <pre className="text-xs font-mono text-slate-600 dark:text-slate-400 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                  {netlifyCmd}
                </pre>
              </div>

              <div className="p-4 bg-indigo-50 dark:bg-indigo-900/10 rounded-xl border border-indigo-100 dark:border-indigo-800 flex items-start gap-3">
                <Info size={18} className="text-indigo-600 shrink-0 mt-0.5" />
                <p className="text-xs text-indigo-900 dark:text-indigo-300 leading-relaxed font-medium">
                  We recommend Netlify for static hosting due to its excellent support for SPA routing and global distribution.
                </p>
              </div>
              
              <a 
                href="https://app.netlify.com/start" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
              >
                Go to Netlify Dashboard <ExternalLink size={16} />
              </a>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-900 dark:bg-slate-800 text-white rounded-lg">
                  <Server size={20} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Environment Variables</h3>
              </div>
              
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl relative group">
                <div className="flex justify-between items-center mb-4">
                  <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Required Config</p>
                  <button onClick={() => handleCopy(envVariables, 'env')} className="text-indigo-600 hover:text-indigo-700 transition-colors">
                    {copyFeedback === 'env' ? <CheckCircle2 size={16} /> : <Copy size={16} />}
                  </button>
                </div>
                <pre className="text-xs font-mono text-slate-600 dark:text-slate-400 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                  {envVariables}
                </pre>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-500" />
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Continuous Integration Ready</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-500" />
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-400">PWA Manifest Optimized</span>
                </div>
              </div>
              
              <div className="p-3 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900">
                 <p className="text-[10px] font-medium text-slate-400 text-center leading-relaxed">Add these to your provider's Build & Deploy settings manually.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const SecurityFeature = ({ label, desc }: any) => (
  <div className="flex items-start gap-3">
    <div className="mt-1.5">
      <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
    </div>
    <div>
      <p className="text-xs font-bold text-white mb-0.5">{label}</p>
      <p className="text-[11px] text-slate-400 leading-normal">{desc}</p>
    </div>
  </div>
);

export default LaunchCenter;
