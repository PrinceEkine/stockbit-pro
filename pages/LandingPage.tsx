
import React, { useState, useRef, useEffect } from 'react';
import { 
  Box, 
  ShieldCheck, 
  Sparkles, 
  ShoppingCart, 
  Globe, 
  Smartphone,
  CheckCircle2,
  BarChart3,
  MessageSquare,
  Twitter,
  Phone,
  MessageCircle,
  X,
  Send,
  Users,
  Eye,
  Activity,
  Plus,
  Play,
  ArrowRight
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { View } from '../types';

interface LandingPageProps {
  onAuth: (step: 'login' | 'register') => void;
  onNavigateInfo: (view: View) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onAuth, onNavigateInfo }) => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<{role: 'user' | 'bot', text: string}[]>([
    { role: 'bot', text: 'Protocol initialized. I am StockBot. How can I assist with your enterprise operations today?' }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isTyping) return;

    const userMsg = chatInput;
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsTyping(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: userMsg,
        config: {
          systemInstruction: "You are StockBot, the official enterprise assistant for StockBit Pro. Professional contact: Call: 07010698264, WhatsApp: 07072127949.",
        }
      });
      
      if (isMounted.current) {
        const botText = response.text || "Protocol offline. Please contact the help desk directly.";
        setChatMessages(prev => [...prev, { role: 'bot', text: botText }]);
      }
    } catch (error: any) {
      if (isMounted.current) {
        setChatMessages(prev => [...prev, { role: 'bot', text: "Support logic delayed. Please call 07010698264 for immediate help." }]);
      }
    } finally {
      if (isMounted.current) {
        setIsTyping(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-indigo-500 selection:text-white transition-colors duration-300">
      {/* Header - Precise Professional Scale */}
      <nav className="fixed top-0 w-full z-50 bg-white/95 backdrop-blur-xl border-b border-slate-100 h-14 md:h-16">
        <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-600/30">
              <Box size={16} className="text-white" />
            </div>
            <span className="font-black text-sm md:text-base tracking-tight uppercase text-slate-900">StockBit Pro</span>
          </div>
          
          <div className="flex items-center gap-4 md:gap-8 lg:gap-10">
            <button onClick={() => onNavigateInfo(View.AboutUs)} className="hidden sm:block text-[8px] md:text-[9px] font-black uppercase tracking-[0.15em] text-slate-500 hover:text-indigo-600 transition-colors">About</button>
            <button className="hidden sm:block text-[8px] md:text-[9px] font-black uppercase tracking-[0.15em] text-slate-500 hover:text-indigo-600 transition-colors">Enterprise</button>
            <button onClick={() => onAuth('login')} className="text-[8px] md:text-[9px] font-black uppercase tracking-[0.15em] text-slate-500 hover:text-indigo-600 transition-colors">Login</button>
            <button onClick={() => onAuth('register')} className="px-5 py-2 md:px-6 md:py-2.5 bg-indigo-600 text-white rounded-full text-[8px] md:text-[9px] font-black uppercase tracking-widest shadow-xl shadow-indigo-600/20 active:scale-95 hover:bg-indigo-700 transition-all">Free Trial</button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-28 md:pt-40 pb-12 md:pb-16 px-6 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
            <img src="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=2000" className="w-full h-full object-cover" alt="" />
        </div>
        <div className="max-w-4xl mx-auto text-center space-y-5 md:space-y-7 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-indigo-50 rounded-full border border-indigo-100 mx-auto">
            <Sparkles size={12} className="text-indigo-600" />
            <span className="text-[8px] md:text-[9px] font-black text-indigo-600 uppercase tracking-[0.2em]">Enterprise Architecture</span>
          </div>
          
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tighter leading-[0.95] uppercase text-slate-900">
            Industrial <br className="md:hidden"/>Logistics for <br/>
            <span className="text-indigo-600">African <br className="md:hidden"/>Growth.</span>
          </h1>
          
          <p className="max-w-md mx-auto text-xs md:text-sm text-slate-500 font-medium leading-relaxed">
            A unified terminal ecosystem engineered for high-velocity retail. 
            AI-driven auditing, immutable ledgers, and multi-staff synchronization.
          </p>

          <div className="pt-4 flex justify-center">
            <button 
              onClick={() => onAuth('register')}
              className="w-full sm:w-auto px-10 py-4 bg-slate-900 text-white rounded-[2rem] font-black uppercase text-[8px] md:text-[10px] tracking-[0.2em] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3"
            >
              Deploy Terminal <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* Section 1: Dashboard (Verified High-Fidelity Analytics Image) */}
      <section className="py-10 md:py-16 px-5 md:px-10 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="relative rounded-[1.5rem] md:rounded-[3rem] overflow-hidden border-[4px] md:border-[8px] border-white shadow-2xl bg-[#020617] group">
            <img 
              src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2000&auto=format&fit=crop" 
              alt="StockBit Dashboard Intelligence" 
              className="w-full aspect-[1.5] md:aspect-[2.2] object-cover opacity-90 group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#020617]/90 via-transparent to-transparent"></div>
            
            <div className="absolute bottom-6 left-6 md:bottom-12 md:left-12 space-y-2">
              <p className="text-[8px] md:text-[9px] font-black text-indigo-400 uppercase tracking-[0.4em]">Interface v4.2</p>
              <h2 className="text-xl md:text-3xl font-black text-white uppercase tracking-tighter leading-none">Unified Mission Control</h2>
            </div>
            
            <div className="absolute bottom-6 right-6 md:bottom-12 md:right-12">
               <div className="w-12 h-12 md:w-20 md:h-20 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 hover:scale-110 transition-transform cursor-pointer group-hover:bg-white/20">
                  <Play className="text-white fill-white ml-1" size={window.innerWidth < 768 ? 16 : 28} />
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: POS Terminal (Verified Retail Experience Image) */}
      <section className="py-16 md:py-24 px-6 overflow-hidden bg-white">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 md:gap-20 items-center">
          <div className="relative order-2 lg:order-1">
            <div className="absolute -inset-4 bg-indigo-600/5 rounded-[4rem] blur-3xl"></div>
            <img 
              src="https://images.unsplash.com/photo-1556740738-b6a63e27c4df?q=80&w=1200&auto=format&fit=crop" 
              alt="Professional POS Terminal" 
              className="relative w-full aspect-[4/3] object-cover rounded-[2rem] md:rounded-[2.5rem] shadow-2xl border border-slate-100"
            />
          </div>
          <div className="space-y-6 md:space-y-10 order-1 lg:order-2">
            <div className="w-11 h-11 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 shadow-sm">
               <ShoppingCart size={22} />
            </div>
            <h2 className="text-2xl md:text-4xl font-black uppercase tracking-tighter leading-[0.95] text-slate-900">
              Fastest POS Terminal <br className="hidden md:block"/>in the market.
            </h2>
            <p className="text-slate-500 text-sm font-medium leading-relaxed max-w-xl">
              Record sales in milliseconds. Our optimized checkout flow handles barcodes, manual SKU entry, and instant digital payments with zero lag.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5 pt-2">
              {[
                "Multi-cart order queueing",
                "Offline sales preservation",
                "Instant thermal printing",
                "Split payment settlement"
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-3">
                  <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                  <span className="text-[8px] md:text-[9px] font-black uppercase tracking-widest text-slate-700">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: AI Driven Logistics (Verified Modern Logistics Image) */}
      <section className="py-16 md:py-24 px-6 bg-slate-50">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 md:gap-20 items-center">
          <div className="space-y-6 md:space-y-10">
            <div className="w-11 h-11 bg-indigo-600/10 rounded-xl flex items-center justify-center text-indigo-600 shadow-sm">
               <BarChart3 size={22} />
            </div>
            <h2 className="text-2xl md:text-4xl font-black uppercase tracking-tighter leading-[0.95] text-slate-900">
              AI Driven <br/>Logistics Audit.
            </h2>
            <p className="text-slate-500 text-sm font-medium leading-relaxed max-w-xl">
              Gemini 3 Pro analyzes every movement. Identify shrinkage, optimize restocking cycles, and forecast demand before the weekend peak.
            </p>
            
            <div className="bg-white p-6 md:p-8 rounded-[1.5rem] border border-slate-200 shadow-xl space-y-5 max-sm:max-w-full max-w-sm">
               <div className="flex justify-between items-center text-[8px] md:text-[9px] font-black uppercase tracking-widest text-indigo-600">
                  <span>Neural Analysis</span>
                  <span>89% Accuracy</span>
               </div>
               <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-600 w-[89%] rounded-full"></div>
               </div>
               <p className="text-[9px] italic text-slate-400 font-medium leading-relaxed">
                 "Restock Type-C adapters immediately; velocity increased 14% since Tuesday."
               </p>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-10 bg-indigo-600/5 rounded-full blur-[100px]"></div>
            <img 
              src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=1200&auto=format&fit=crop" 
              alt="Inventory Logistics Insight" 
              className="relative w-full aspect-[16/10] object-cover rounded-[2rem] md:rounded-[2.5rem] shadow-2xl border-4 border-white"
            />
          </div>
        </div>
      </section>

      {/* Section 4: Governance */}
      <section className="py-16 md:py-24 px-6 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 md:gap-20 items-center">
          <div className="space-y-8 md:space-y-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 rounded-xl shadow-xl shadow-indigo-600/20">
               <Users size={16} className="text-white" />
               <span className="text-[8px] md:text-[9px] font-black text-white uppercase tracking-widest">Personnel Protocol</span>
            </div>
            <h2 className="text-2xl md:text-4xl font-black uppercase tracking-tighter leading-[0.95] text-slate-900">
              Elite Multi-Staff <br className="hidden md:block"/>Governance Suite.
            </h2>
            <p className="text-slate-500 text-sm font-medium leading-relaxed max-w-xl">
              Maintain absolute operational integrity while delegating mission-critical tasks to your frontline team. Our enterprise suite ensures zero-leakage workflows.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              {[
                { title: "Granular RBAC", icon: <ShieldCheck size={18}/>, desc: "Deploy Role-Based Access Control to enforce strict data silos." },
                { title: "Immutable Audit", icon: <Eye size={18}/>, desc: "Real-time activity logs with cryptographic timestamps." },
                { title: "Productivity Intel", icon: <Activity size={18}/>, desc: "Quantify individual terminal performance and throughput." },
                { title: "Terminal Sync", icon: <Smartphone size={18}/>, desc: "Concurrent multi-device synchronization with industrial security." }
              ].map((item, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex items-center gap-3 text-indigo-600">
                    {item.icon}
                    <h4 className="text-[9px] font-black uppercase tracking-widest">{item.title}</h4>
                  </div>
                  <p className="text-[9px] md:text-[10px] text-slate-500 font-medium leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="relative group lg:ml-10">
            <div className="absolute -inset-4 bg-indigo-600/5 rounded-[4rem] blur-3xl"></div>
            <img 
              src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=1200&auto=format&fit=crop" 
              alt="Staff Governance Team" 
              className="relative w-full aspect-square object-cover rounded-[2.5rem] md:rounded-[3rem] shadow-2xl border border-slate-100"
            />
            <div className="absolute -top-6 -right-6 w-20 h-20 bg-indigo-600 rounded-[1.5rem] flex items-center justify-center shadow-2xl rotate-12 transition-transform group-hover:rotate-6">
              <ShieldCheck size={32} className="text-white" />
            </div>
          </div>
        </div>
      </section>

      {/* Section 5: CTA with BACKGROUND IMAGE (Requested Screenshot Background) */}
      <section className="py-28 md:py-48 px-6 relative overflow-hidden bg-slate-950">
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2000&auto=format&fit=crop" 
            alt="Retail Infrastructure Backdrop" 
            className="w-full h-full object-cover grayscale brightness-[0.3]"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/90 via-transparent to-slate-950/90"></div>
        
        <div className="max-w-4xl mx-auto relative z-10 text-center space-y-6 md:space-y-8">
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-black tracking-tight uppercase leading-[0.95] text-white drop-shadow-2xl">
            Upgrade Your <br className="hidden md:block"/>Operational Protocol.
          </h2>
          <p className="text-slate-300 text-xs md:text-lg lg:text-xl font-medium max-w-lg mx-auto leading-relaxed">
            Deploy StockBit Pro across your entire organization and gain absolute control today.
          </p>
          <div className="pt-6 flex justify-center">
            <button 
              onClick={() => onAuth('register')}
              className="w-full sm:w-auto px-12 py-5 bg-white text-slate-950 rounded-full font-black uppercase text-[10px] md:text-[11px] tracking-[0.3em] shadow-[0_20px_50px_rgba(255,255,255,0.1)] active:scale-95 transition-all hover:bg-slate-100 flex items-center justify-center gap-4"
            >
              Deploy Terminal Now
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-6 bg-[#010409] text-white border-t border-white/5">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-16">
          <div className="space-y-8">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
                <Box size={18} className="text-white" />
              </div>
              <span className="font-black text-lg tracking-tighter uppercase">StockBit Pro</span>
            </div>
            <p className="text-[9px] md:text-[10px] text-slate-500 font-medium leading-relaxed pr-6">
              Industrial-grade retail management for the next generation of African commerce. Powered by Gemini AI.
            </p>
            <div className="flex gap-4">
               <a href="https://x.com/StockBitpro" target="_blank" className="p-2.5 bg-white/5 rounded-xl text-slate-400 hover:text-indigo-400 hover:bg-white/10 transition-all">
                  <Twitter size={16} />
               </a>
            </div>
          </div>

          <div className="space-y-6">
            <h4 className="text-[8px] md:text-[9px] font-black uppercase tracking-[0.4em] text-slate-300">Navigation</h4>
            <ul className="space-y-4">
              <li><button onClick={() => onNavigateInfo(View.AboutUs)} className="text-[10px] text-slate-500 hover:text-indigo-400 transition-colors">About Us</button></li>
              <li><button onClick={() => onNavigateInfo(View.HelpCenter)} className="text-[10px] text-slate-500 hover:text-indigo-400 transition-colors">Help Center</button></li>
            </ul>
          </div>

          <div className="space-y-6">
            <h4 className="text-[8px] md:text-[9px] font-black uppercase tracking-[0.4em] text-slate-300">Governance</h4>
            <ul className="space-y-4">
              <li><button onClick={() => onNavigateInfo(View.Governance)} className="text-[10px] text-slate-500 hover:text-indigo-400 transition-colors">Governance</button></li>
              <li><button onClick={() => onNavigateInfo(View.TermsOfService)} className="text-[10px] text-slate-500 hover:text-indigo-400 transition-colors">Terms of Service</button></li>
              <li><button onClick={() => onNavigateInfo(View.PrivacyPolicy)} className="text-[10px] text-slate-500 hover:text-indigo-400 transition-colors">Privacy Policy</button></li>
            </ul>
          </div>

          <div className="space-y-6">
            <h4 className="text-[8px] md:text-[9px] font-black uppercase tracking-[0.4em] text-slate-300">Contact Control</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-3 bg-white/5 p-4 rounded-xl border border-white/5 group hover:border-indigo-500/30 transition-all">
                 <div className="w-7 h-7 bg-indigo-600/10 rounded-lg flex items-center justify-center text-indigo-400"><Phone size={14} /></div>
                 <div>
                    <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Direct Line</p>
                    <p className="text-[10px] font-bold text-slate-200">07010698264</p>
                 </div>
              </div>
              <div className="flex items-center gap-3 bg-white/5 p-4 rounded-xl border border-white/5 group hover:border-emerald-500/30 transition-all">
                 <div className="w-7 h-7 bg-emerald-600/10 rounded-lg flex items-center justify-center text-emerald-400"><MessageCircle size={14} /></div>
                 <div>
                    <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">WhatsApp Ops</p>
                    <p className="text-[10px] font-bold text-slate-200">07072127949</p>
                 </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-white/5 text-center">
          <p className="text-[8px] md:text-[9px] font-black text-slate-600 uppercase tracking-[0.6em]">
            © 2025 STOCKBIT TECHNOLOGIES LTD. POWERED BY GEMINI.
          </p>
        </div>
      </footer>

      {/* AI Chat Bot UI */}
      <div className="fixed bottom-6 right-6 z-[60]">
         {isChatOpen ? (
            <div className="w-[calc(100vw-3rem)] md:w-80 h-[480px] bg-white rounded-[2rem] shadow-2xl border border-slate-100 flex flex-col overflow-hidden animate-in slide-in-from-bottom-10">
               <div className="p-5 bg-indigo-600 text-white flex items-center justify-between">
                  <div className="flex items-center gap-3">
                     <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center">
                        <Sparkles size={18} className="text-white" />
                     </div>
                     <div>
                        <p className="text-[10px] font-black uppercase tracking-tighter leading-none">StockBot AI</p>
                        <p className="text-[7px] font-bold uppercase text-indigo-200 mt-1">Protocol Assistant</p>
                     </div>
                  </div>
                  <button onClick={() => setIsChatOpen(false)} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
                     <X size={18} />
                  </button>
               </div>

               <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-hide">
                  {chatMessages.map((msg, idx) => (
                     <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] p-3.5 rounded-2xl text-[10px] md:text-[11px] font-medium leading-relaxed ${
                           msg.role === 'user' 
                           ? 'bg-indigo-600 text-white rounded-br-none' 
                           : 'bg-slate-100 text-slate-700 rounded-bl-none'
                        }`}>
                           {msg.text}
                        </div>
                     </div>
                  ))}
                  {isTyping && (
                     <div className="flex justify-start">
                        <div className="bg-slate-100 p-3.5 rounded-2xl rounded-bl-none flex gap-1">
                           <div className="w-1 h-1 bg-indigo-400 rounded-full animate-bounce"></div>
                           <div className="w-1 h-1 bg-indigo-400 rounded-full animate-bounce delay-100"></div>
                           <div className="w-1 h-1 bg-indigo-400 rounded-full animate-bounce delay-200"></div>
                        </div>
                     </div>
                  )}
                  <div ref={chatEndRef} />
               </div>

               <form onSubmit={handleSendMessage} className="p-4 bg-slate-50 border-t border-slate-100 flex gap-2">
                  <input 
                     type="text" 
                     placeholder="Inquire about protocol..." 
                     className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-[9px] md:text-[10px] font-black uppercase outline-none focus:ring-2 focus:ring-indigo-600 shadow-inner"
                     value={chatInput}
                     onChange={e => setChatInput(e.target.value)}
                  />
                  <button type="submit" className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-lg active:scale-95 transition-all">
                     <Send size={16} />
                  </button>
               </form>
            </div>
         ) : (
            <button 
               onClick={() => setIsChatOpen(true)}
               className="w-14 h-14 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-2xl shadow-indigo-600/40 hover:scale-110 active:scale-95 transition-all group"
            >
               <MessageSquare size={22} className="group-hover:rotate-12 transition-transform" />
            </button>
         )}
      </div>
    </div>
  );
};

export default LandingPage;
