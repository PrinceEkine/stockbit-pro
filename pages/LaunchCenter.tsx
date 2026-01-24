import React, { useState, useEffect } from 'react';
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
  Cloud,
  Play,
  Video,
  Sparkles,
  Loader2,
  Share2,
  X,
  RefreshCw,
  Triangle,
  ArrowRightLeft
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { AppState } from '../types';

interface LaunchCenterProps {
  state: AppState;
  onUpdateSettings: (updates: any) => void;
}

const LaunchCenter: React.FC<LaunchCenterProps> = ({ state, onUpdateSettings }) => {
  const [paystackKey, setPaystackKey] = useState(state.settings.paystackPublicKey || '');
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'vercel' | 'gcp' | 'marketing'>('marketing');
  
  // Video Generation States
  const [isVideoGenerating, setIsVideoGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);

  const ENV_VAR_NAME = "VITE_PAYSTACK_PUBLIC_KEY";

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopyFeedback(id);
    setTimeout(() => setCopyFeedback(null), 2000);
  };

  const loadingMessages = [
    "Analyzing shop logistics...",
    "Rendering cinematic business frames...",
    "Applying industrial color grading...",
    "Syncing AI voice-over narration...",
    "Finalizing high-velocity marketing asset...",
    "Polishing 4K retail textures..."
  ];

  const handleGeneratePromo = async () => {
    setVideoError(null);
    setGeneratedVideoUrl(null);

    // 1. Check for API Key
    const hasKey = await (window as any).aistudio.hasSelectedApiKey();
    if (!hasKey) {
      await (window as any).aistudio.openSelectKey();
    }

    setIsVideoGenerating(true);
    setGenerationProgress(10);
    setLoadingMessage(loadingMessages[0]);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const prompt = `A cinematic, high-quality professional advertisement video for StockBit Pro. 
      Visuals: A stressed Nigerian shop owner in a retail store looking at empty shelves and a messy paper ledger. 
      Bold red text overlay appears: "STOCK LEAKAGE?". 
      Transition: A fast dynamic motion to a modern smartphone screen showing the StockBit Pro dashboard with vibrant, high-tech UI elements, 
      scrolling through inventory and showing a big green "SYNC COMPLETE" checkmark. 
      Professional lighting, high-contrast, 4k detail, dramatic and high-energy tone.`;

      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: prompt,
        config: {
          numberOfVideos: 1,
          resolution: '720p',
          aspectRatio: '9:16' // Portrait for mobile marketing
        }
      });

      let pollCount = 0;
      while (!operation.done) {
        pollCount++;
        setGenerationProgress(Math.min(15 + (pollCount * 5), 95));
        setLoadingMessage(loadingMessages[pollCount % loadingMessages.length]);
        
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
      }

      if (operation.response?.generatedVideos?.[0]?.video?.uri) {
        const downloadLink = operation.response.generatedVideos[0].video.uri;
        const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setGeneratedVideoUrl(url);
        setGenerationProgress(100);
      } else {
        throw new Error("Generation completed but no URI returned.");
      }
    } catch (err: any) {
      console.error("Video Gen Error:", err);
      if (err.message?.includes("Requested entity was not found")) {
        setVideoError("API Key session expired. Please re-select your key.");
        await (window as any).aistudio.openSelectKey();
      } else {
        setVideoError("The generation node is currently busy. Please retry in a few moments.");
      }
    } finally {
      setIsVideoGenerating(false);
    }
  };

  const vercelCmd = `# Set via Vercel CLI
vercel env add ${ENV_VAR_NAME} production

# Or add in Vercel Dashboard: 
# Project Settings -> Environment Variables -> Add New`;

  const netlifyRedirectCode = `[[redirects]]
  from = "/*"
  to = "https://your-new-app.vercel.app/:splat"
  status = 301
  force = true`;

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20 max-w-6xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">Launch Center</h1>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-1 flex items-center gap-2">
            <Rocket size={14} className="text-indigo-600" /> Enterprise Deployment Engine
          </p>
        </div>
        <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl border border-slate-200 dark:border-slate-800">
          <button onClick={() => setActiveTab('marketing')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'marketing' ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-sm' : 'text-slate-400'}`}>Marketing Lab</button>
          <button onClick={() => setActiveTab('vercel')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'vercel' ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-sm' : 'text-slate-400'}`}>Cloud Migration</button>
        </div>
      </header>

      {activeTab === 'marketing' && (
        <div className="space-y-8 px-4 animate-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group">
              <Video className="absolute -top-10 -right-10 text-indigo-500/5 w-64 h-64 rotate-12 group-hover:scale-110 transition-transform duration-1000" />
              <div className="relative z-10 space-y-6">
                <div className="w-16 h-16 bg-indigo-600 text-white rounded-[1.5rem] flex items-center justify-center shadow-xl shadow-indigo-600/20">
                  <Sparkles size={32} />
                </div>
                <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">AI Video Producer</h2>
                <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                  Generate high-impact, professional video advertisements for your shop. 
                  This tool uses Google Veo 3.1 to create custom 4K marketing assets tailored for Nigerian retail.
                </p>
                <div className="space-y-4 pt-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 size={18} className="text-emerald-500" />
                    <span className="text-xs font-bold uppercase tracking-widest text-slate-600 dark:text-slate-300">Portrait 9:16 (optimized for Reels/TikTok)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 size={18} className="text-emerald-500" />
                    <span className="text-xs font-bold uppercase tracking-widest text-slate-600 dark:text-slate-300">Industrial Audio Synthesis</span>
                  </div>
                </div>
                
                {videoError && (
                  <div className="p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800 rounded-2xl text-[11px] font-bold text-rose-600 flex items-center gap-3 animate-in fade-in">
                    <AlertTriangle size={18} className="shrink-0" /> {videoError}
                  </div>
                )}

                <button 
                  onClick={handleGeneratePromo}
                  disabled={isVideoGenerating}
                  className="w-full py-6 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[2rem] font-black uppercase text-xs tracking-[0.2em] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-4 disabled:opacity-50"
                >
                  {isVideoGenerating ? <RefreshCw size={20} className="animate-spin" /> : <Play size={20} />}
                  {isVideoGenerating ? 'GEN NODE ACTIVE...' : 'INITIALIZE GENERATION'}
                </button>
              </div>
            </div>

            <div className="bg-slate-900 rounded-[3rem] p-10 flex flex-col items-center justify-center relative overflow-hidden shadow-2xl min-h-[500px]">
              {isVideoGenerating ? (
                <div className="text-center space-y-8 animate-in fade-in">
                  <div className="relative inline-block">
                    <div className="w-32 h-32 border-8 border-indigo-900/20 border-t-indigo-500 rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xl font-black text-white">{generationProgress}%</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-black text-white uppercase tracking-tighter">{loadingMessage}</h3>
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Veo 3.1 Pro Cloud Cluster</p>
                  </div>
                  <div className="w-64 h-2 bg-slate-800 rounded-full mx-auto overflow-hidden">
                    <div className="h-full bg-indigo-500 transition-all duration-1000" style={{ width: `${generationProgress}%` }}></div>
                  </div>
                </div>
              ) : generatedVideoUrl ? (
                <div className="w-full h-full flex flex-col items-center justify-center animate-in zoom-in-95 duration-500">
                  <video 
                    src={generatedVideoUrl} 
                    controls 
                    className="max-h-[500px] rounded-[2rem] shadow-2xl border-4 border-white/5"
                    autoPlay
                  />
                  <div className="mt-8 flex gap-4">
                    <button 
                      onClick={() => window.open(generatedVideoUrl, '_blank')}
                      className="px-8 py-4 bg-white text-slate-900 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center gap-3 shadow-xl active:scale-95 transition-all"
                    >
                      <Download size={18} /> Download Ad
                    </button>
                    <button 
                      onClick={handleGeneratePromo}
                      className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center gap-3 shadow-xl active:scale-95 transition-all"
                    >
                      <RefreshCw size={18} /> Re-Generate
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-6">
                  <div className="w-24 h-24 bg-white/5 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                    <Terminal size={40} className="text-slate-600" />
                  </div>
                  <p className="text-slate-500 font-black uppercase text-[10px] tracking-widest">Awaiting Command Input</p>
                  <p className="text-slate-600 text-xs font-medium max-w-xs">Your generated marketing assets will appear here after initialization.</p>
                </div>
              )}
              <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
                <GridOverlay />
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'vercel' && (
        <div className="space-y-8 px-4 animate-in slide-in-from-bottom-4 duration-500">
          <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-8 flex items-center gap-4">
              <Triangle className="text-slate-900 dark:text-white rotate-180" /> Vercel Migration Logic
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="bg-slate-50 dark:bg-slate-800/50 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Step 1: Environment Variables</h3>
                    <button onClick={() => handleCopy(vercelCmd, 'vercel')} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
                      {copyFeedback === 'vercel' ? <CheckCircle2 size={18} /> : <Copy size={18} />}
                    </button>
                  </div>
                  <pre className="font-mono text-xs text-slate-600 dark:text-slate-400 overflow-x-auto p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                    {vercelCmd}
                  </pre>
                </div>
                
                <div className="p-6 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-800 flex items-start gap-4">
                  <Info size={20} className="text-indigo-600 shrink-0 mt-1" />
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-indigo-900 dark:text-indigo-200 uppercase tracking-widest">Seamless Transition Tip</p>
                    <p className="text-[11px] text-indigo-800/70 dark:text-indigo-300/70 leading-relaxed font-medium">
                      If you use a custom domain (e.g. yourshop.com), simply point your DNS to Vercel. Existing PWA users will automatically update without needing to re-download.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-slate-50 dark:bg-slate-800/50 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Step 2: Netlify Redirects</h3>
                    <button onClick={() => handleCopy(netlifyRedirectCode, 'netlify')} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
                      {copyFeedback === 'netlify' ? <CheckCircle2 size={18} /> : <Copy size={18} />}
                    </button>
                  </div>
                  <pre className="font-mono text-xs text-slate-600 dark:text-slate-400 overflow-x-auto p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                    {netlifyRedirectCode}
                  </pre>
                  <p className="text-[9px] font-bold text-slate-400 uppercase mt-4">Place in your netlify.toml file</p>
                </div>

                <div className="p-6 bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-100 dark:border-amber-800 flex items-start gap-4">
                  <ArrowRightLeft size={20} className="text-amber-600 shrink-0 mt-1" />
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-amber-900 dark:text-amber-200 uppercase tracking-widest">PWA Note</p>
                    <p className="text-[11px] text-amber-800/70 dark:text-amber-300/70 leading-relaxed font-medium">
                      If you do NOT use a custom domain, users on the netlify URL will see a "redirect." They will need to "Add to Home Screen" again from the new Vercel URL.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const GridOverlay = () => (
  <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5"/>
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#grid)" />
  </svg>
);

export default LaunchCenter;