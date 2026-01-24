
import React, { useState } from 'react';
import { 
  Rocket, 
  Download, 
  AlertTriangle,
  CheckCircle2,
  Terminal,
  Play,
  Video,
  Sparkles,
  RefreshCw,
  Triangle,
  ArrowRightLeft,
  ExternalLink,
  Copy,
  Info,
  CreditCard
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { AppState } from '../types';

interface LaunchCenterProps {
  state: AppState;
  onUpdateSettings: (updates: any) => void;
}

const LaunchCenter: React.FC<LaunchCenterProps> = ({ state, onUpdateSettings }) => {
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'vercel' | 'marketing'>('marketing');
  
  // Video Generation States
  const [isVideoGenerating, setIsVideoGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [videoError, setVideoError] = useState<{message: string, isPermission: boolean, isFreeTier: boolean} | null>(null);

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

  const handleSelectKey = async () => {
    await (window as any).aistudio.openSelectKey();
    setVideoError(null);
  };

  const handleGeneratePromo = async () => {
    setVideoError(null);
    setGeneratedVideoUrl(null);

    const hasKey = await (window as any).aistudio.hasSelectedApiKey();
    if (!hasKey) {
      await handleSelectKey();
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
          aspectRatio: '9:16'
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
        throw new Error("No video URI returned.");
      }
    } catch (err: any) {
      console.error("Video Gen Error:", err);
      const errorStr = JSON.stringify(err);
      
      if (errorStr.includes("403") || errorStr.toLowerCase().includes("permission")) {
        setVideoError({
          message: "Free Tier Detected: Video generation (Veo 3.1) requires a PAID billing account. In Google AI Studio, your project quota must show 'Pay-as-you-go'.",
          isPermission: true,
          isFreeTier: true
        });
      } else {
        setVideoError({
          message: "The generation node is currently busy. Please retry in a few moments.",
          isPermission: false,
          isFreeTier: false
        });
      }
    } finally {
      setIsVideoGenerating(false);
    }
  };

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
                <div className="w-16 h-16 bg-indigo-600 text-white rounded-[1.5rem] flex items-center justify-center shadow-xl shadow-indigo-600/30">
                  <Sparkles size={32} />
                </div>
                <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">AI Video Producer</h2>
                <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                  Generate high-impact video advertisements. This tool uses <strong>Google Veo 3.1</strong> to create custom marketing assets.
                </p>

                {videoError && (
                  <div className="p-6 bg-rose-50 dark:bg-rose-900/20 border-2 border-rose-100 dark:border-rose-800 rounded-[1.5rem] space-y-4 animate-in fade-in">
                    <div className="flex items-start gap-3">
                      <AlertTriangle size={24} className="text-rose-600 shrink-0 mt-1" />
                      <div>
                        <p className="text-xs font-black uppercase text-rose-600 tracking-widest mb-1">Billing Requirement</p>
                        <p className="text-xs font-bold text-rose-900 dark:text-rose-200 leading-relaxed">{videoError.message}</p>
                      </div>
                    </div>
                    
                    {videoError.isFreeTier && (
                      <div className="pt-2 flex flex-col gap-3">
                        <a 
                          href="https://aistudio.google.com/api-keys" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="w-full py-3 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all"
                        >
                          <CreditCard size={14} /> Open AI Studio & Enable Billing
                        </a>
                        <a 
                          href="https://ai.google.dev/gemini-api/docs/billing" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-[9px] font-black uppercase tracking-widest text-rose-600 hover:underline flex items-center justify-center gap-1.5"
                        >
                          How Billing Works <ExternalLink size={12} />
                        </a>
                      </div>
                    )}
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
                  <h3 className="text-xl font-black text-white uppercase tracking-tighter">{loadingMessage}</h3>
                </div>
              ) : generatedVideoUrl ? (
                <div className="w-full h-full flex flex-col items-center justify-center animate-in zoom-in-95 duration-500">
                  <video src={generatedVideoUrl} controls className="max-h-[500px] rounded-[2rem] shadow-2xl border-4 border-white/5" autoPlay />
                  <div className="mt-8 flex gap-4">
                    <button onClick={() => window.open(generatedVideoUrl, '_blank')} className="px-8 py-4 bg-white text-slate-900 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center gap-3 shadow-xl active:scale-95 transition-all">
                      <Download size={18} /> Download
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-6">
                  <Terminal size={40} className="text-slate-600 mx-auto" />
                  <p className="text-slate-500 font-black uppercase text-[10px] tracking-widest">Awaiting Paid Key Input</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LaunchCenter;
