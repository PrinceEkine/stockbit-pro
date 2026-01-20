
import React, { useState, useRef, useEffect } from 'react';
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
  Layers,
  HelpCircle,
  MessageSquare,
  Twitter,
  Phone,
  MessageCircle,
  Info,
  Lock,
  X,
  Send,
  Loader2,
  Users,
  Eye,
  Activity,
  Monitor,
  Layout,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  Package,
  CreditCard,
  Play
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
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-indigo-500 selection:text-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
              <Box size={24} className="text-white" />
            </div>
            <span className="font-black text-xl tracking-tighter uppercase">StockBit Pro</span>
          </div>
          <div className="flex items-center gap-8">
            <button onClick={() => onNavigateInfo(View.AboutUs)} className="hidden md:block text-[11px] font-black uppercase tracking-widest text-slate-500 hover:text-indigo-600 transition-colors">About</button>
            <button className="hidden md:block text-[11px] font-black uppercase tracking-widest text-slate-500 hover:text-indigo-600 transition-colors">Enterprise</button>
            <button onClick={() => onAuth('login')} className="text-[11px] font-black uppercase tracking-widest text-slate-500 hover:text-indigo-600 transition-colors">Login</button>
            <button onClick={() => onAuth('register')} className="px-8 py-3 bg-indigo-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-indigo-600/20 active:scale-95 transition-all">Start Free Trial</button>
          </div>
        </div>
      </nav>

      {/* Section 1: Hero / Dashboard Screenshot (Screenshot 1) */}
      <section className="pt-32 pb-20 px-6 bg-slate-50">
        <div className="max-w-7xl mx-auto relative">
          <div className="relative rounded-[3rem] overflow-hidden border-8 border-white shadow-2xl bg-[#020617]">
            <img 
              src="https://images.unsplash.com/photo-1551288049-bbbda536339a?q=80&w=2000&auto=format&fit=crop" 
              alt="StockBit Dashboard" 
              className="w-full aspect-[21/9] object-cover opacity-80"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-transparent to-transparent"></div>
            
            <div className="absolute bottom-12 left-12 space-y-2">
              <p className="text-[11px] font-black text-indigo-400 uppercase tracking-[0.4em]">Interface v4.2</p>
              <h1 className="text-5xl md:text-6xl font-black text-white uppercase tracking-tighter leading-none">Unified Mission Control</h1>
            </div>
            
            <div className="absolute bottom-12 left-12 transform -translate-x-1/2 -translate-y-1/2 opacity-0">
               {/* Hidden anchor for layout */}
            </div>
            
            <div className="absolute bottom-12 right-12">
               <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 hover:scale-110 transition-transform cursor-pointer">
                  <Play className="text-white fill-white ml-1" size={24} />
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: POS Terminal (Screenshot 2) */}
      <section className="py-24 px-6 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div className="relative">
            <div className="absolute -inset-4 bg-indigo-600/5 rounded-[4rem] blur-3xl"></div>
            <img 
              src="https://images.unsplash.com/photo-1556742044-3c52d6e88c02?q=80&w=1200&auto=format&fit=crop" 
              alt="POS Retail Terminal" 
              className="relative w-full aspect-[4/3] object-cover rounded-[3.5rem] shadow-2xl border border-slate-100"
            />
          </div>
          <div className="space-y-10 pl-0 lg:pl-10">
            <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm">
               <ShoppingCart size={28} />
            </div>
            <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-tight text-slate-900">
              Fastest POS Terminal <br/>in the market.
            </h2>
            <p className="text-slate-500 text-xl font-medium leading-relaxed max-w-xl">
              Record sales in milliseconds. Our optimized checkout flow handles barcodes, manual SKU entry, and instant digital payments with zero lag.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6 pt-4">
              {[
                "Multi-cart order queueing",
                "Offline sales preservation",
                "Instant thermal printing",
                "Split payment settlement"
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-3">
                  <CheckCircle2 size={20} className="text-emerald-500" />
                  <span className="text-[11px] font-black uppercase tracking-widest text-slate-600">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: AI Driven Audit (Screenshot 3) */}
      <section className="py-24 px-6 bg-slate-50">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div className="space-y-10">
            <div className="w-14 h-14 bg-indigo-600/10 rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm">
               <BarChart3 size={28} />
            </div>
            <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-tight text-slate-900">
              AI Driven <br/>Logistics Audit.
            </h2>
            <p className="text-slate-500 text-xl font-medium leading-relaxed max-w-xl">
              Gemini 3 Pro analyzes every movement. Identify shrinkage, optimize restocking cycles, and forecast demand before the weekend peak.
            </p>
            
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl space-y-5 max-w-md">
               <div className="flex justify-between items-center text-[11px] font-black uppercase tracking-widest text-indigo-600">
                  <span>Neural Analysis</span>
                  <span>89% Accuracy</span>
               </div>
               <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-600 w-[89%] rounded-full"></div>
               </div>
               <p className="text-[11px] italic text-slate-400 font-medium pt-2">
                 "Restock Type-C adapters immediately; velocity increased 14% since Tuesday."
               </p>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-10 bg-indigo-600/5 rounded-full blur-[100px]"></div>
            <img 
              src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=1200&auto=format&fit=crop" 
              alt="Analytics Interface" 
              className="relative w-full aspect-[16/10] object-cover rounded-[3rem] shadow-2xl border-4 border-white"
            />
          </div>
        </div>
      </section>

      {/* Section 4: Multi-Staff Governance (Screenshot 4) */}
      <section className="py-24 px-6 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div className="space-y-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 rounded-lg shadow-lg shadow-indigo-600/20">
               <Users size={16} className="text-white" />
               <span className="text-[11px] font-black text-white uppercase tracking-widest">Personnel Protocol</span>
            </div>
            <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-none text-slate-900">
              Elite Multi-Staff <br/>Governance Suite.
            </h2>
            <p className="text-slate-500 text-xl font-medium leading-relaxed max-w-xl">
              Maintain absolute operational integrity while delegating mission-critical tasks to your frontline team. Our enterprise suite ensures zero-leakage workflows.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {[
                { title: "Granular RBAC", icon: <ShieldCheck size={20}/>, desc: "Deploy Role-Based Access Control to enforce strict data silos for Cashiers." },
                { title: "Immutable Audit", icon: <Eye size={20}/>, desc: "Real-time activity logs with cryptographic timestamps for accountability." },
                { title: "Productivity Intel", icon: <Activity size={20}/>, desc: "Quantify individual terminal performance and staff throughput." },
                { title: "Terminal Sync", icon: <Smartphone size={20}/>, desc: "Concurrent multi-device synchronization with industrial-grade security." }
              ].map((item, i) => (
                <div key={i} className="space-y-3 group">
                  <div className="flex items-center gap-3 text-indigo-600 group-hover:scale-105 transition-transform">
                    {item.icon}
                    <h4 className="text-[11px] font-black uppercase tracking-widest">{item.title}</h4>
                  </div>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="relative group lg:ml-10">
            <div className="absolute -inset-4 bg-indigo-600/5 rounded-[4rem] blur-3xl"></div>
            <img 
              src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=1200&auto=format&fit=crop" 
              alt="Team Collaboration" 
              className="relative w-full aspect-square object-cover rounded-[4rem] shadow-2xl border border-slate-100"
            />
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-600 rounded-[2.5rem] flex items-center justify-center shadow-2xl rotate-12 transition-transform group-hover:rotate-6">
              <ShieldCheck size={48} className="text-white" />
            </div>
          </div>
        </div>
      </section>

      {/* Section 5: CTA (Screenshot 5) */}
      <section className="py-40 px-6 relative overflow-hidden bg-slate-950">
        <div className="absolute inset-0 opacity-30 grayscale hover:grayscale-0 transition-all duration-1000">
          <img 
            src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2000&auto=format&fit=crop" 
            alt="Retail Store Background" 
            className="w-full h-full object-cover"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-950/90 to-slate-950"></div>
        
        <div className="max-w-4xl mx-auto relative z-10 text-center space-y-12">
          <h2 className="text-6xl md:text-8xl font-black tracking-tighter uppercase leading-none text-white">
            Upgrade Your <br/>Operational Protocol.
          </h2>
          <p className="text-slate-400 text-xl md:text-2xl font-medium max-w-2xl mx-auto leading-relaxed">
            Deploy StockBit Pro across your entire organization and gain absolute control today.
          </p>
          <div className="pt-6">
            <button 
              onClick={() => onAuth('register')}
              className="px-16 py-8 bg-white text-slate-950 rounded-[2.5rem] font-black uppercase text-[12px] tracking-[0.3em] shadow-2xl active:scale-95 transition-all hover:bg-slate-50 flex items-center justify-center gap-4 mx-auto"
            >
              Deploy Terminal Now
            </button>
          </div>
        </div>
      </section>

      {/* Footer (Screenshot 6) */}
      <footer className="py-24 px-6 bg-[#010409] text-white border-t border-white/5">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-16">
          <div className="space-y-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
                <Box size={22} className="text-white" />
              </div>
              <span className="font-black text-xl tracking-tighter uppercase">StockBit Pro</span>
            </div>
            <p className="text-sm text-slate-500 font-medium leading-relaxed pr-6">
              Industrial-grade retail management for the next generation of African commerce.
            </p>
            <div className="flex gap-4">
               <a href="https://x.com/StockBitpro" target="_blank" className="p-3 bg-white/5 rounded-xl text-slate-400 hover:text-indigo-400 hover:bg-white/10 transition-all">
                  <Twitter size={20} />
               </a>
            </div>
          </div>

          <div className="space-y-8">
            <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-300">Navigation</h4>
            <ul className="space-y-5">
              <li><button onClick={() => onNavigateInfo(View.AboutUs)} className="text-sm text-slate-500 hover:text-indigo-400 transition-colors">About Us</button></li>
              <li><button onClick={() => onNavigateInfo(View.HelpCenter)} className="text-sm text-slate-500 hover:text-indigo-400 transition-colors">Help Center</button></li>
            </ul>
          </div>

          <div className="space-y-8">
            <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-300">Governance</h4>
            <ul className="space-y-5">
              <li><button onClick={() => onNavigateInfo(View.Governance)} className="text-sm text-slate-500 hover:text-indigo-400 transition-colors">Governance</button></li>
              <li><button onClick={() => onNavigateInfo(View.TermsOfService)} className="text-sm text-slate-500 hover:text-indigo-400 transition-colors">Terms of Service</button></li>
              <li><button onClick={() => onNavigateInfo(View.PrivacyPolicy)} className="text-sm text-slate-500 hover:text-indigo-400 transition-colors">Privacy Policy</button></li>
            </ul>
          </div>

          <div className="space-y-8">
            <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-300">Contact Control</h4>
            <div className="space-y-4">
              <div className="flex items-center gap-4 bg-white/5 p-5 rounded-2xl border border-white/5 group hover:border-indigo-500/30 transition-all">
                 <div className="w-10 h-10 bg-indigo-600/10 rounded-xl flex items-center justify-center text-indigo-400"><Phone size={18} /></div>
                 <div>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Direct Line</p>
                    <p className="text-sm font-bold text-slate-200">07010698264</p>
                 </div>
              </div>
              <div className="flex items-center gap-4 bg-white/5 p-5 rounded-2xl border border-white/5 group hover:border-emerald-500/30 transition-all">
                 <div className="w-10 h-10 bg-emerald-600/10 rounded-xl flex items-center justify-center text-emerald-400"><MessageCircle size={18} /></div>
                 <div>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">WhatsApp Ops</p>
                    <p className="text-sm font-bold text-slate-200">07072127949</p>
                 </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto mt-24 pt-8 border-t border-white/5 text-center">
          <p className="text-[11px] font-black text-slate-600 uppercase tracking-[0.6em]">
            © 2025 STOCKBIT TECHNOLOGIES LTD. POWERED BY GEMINI.
          </p>
        </div>
      </footer>

      {/* AI Chat Bot UI */}
      <div className="fixed bottom-8 right-8 z-[60]">
         {isChatOpen ? (
            <div className="w-80 md:w-96 h-[520px] bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 flex flex-col overflow-hidden animate-in slide-in-from-bottom-10">
               <div className="p-6 bg-indigo-600 text-white flex items-center justify-between">
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                        <Sparkles size={20} className="text-white" />
                     </div>
                     <div>
                        <p className="text-xs font-black uppercase tracking-tighter">StockBot AI</p>
                        <p className="text-[8px] font-bold uppercase text-indigo-200">Protocol Assistant</p>
                     </div>
                  </div>
                  <button onClick={() => setIsChatOpen(false)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                     <X size={20} />
                  </button>
               </div>

               <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide">
                  {chatMessages.map((msg, idx) => (
                     <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] p-4 rounded-2xl text-[11px] font-medium leading-relaxed ${
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
                        <div className="bg-slate-100 p-4 rounded-2xl rounded-bl-none flex gap-1">
                           <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></div>
                           <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-100"></div>
                           <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-200"></div>
                        </div>
                     </div>
                  )}
                  <div ref={chatEndRef} />
               </div>

               <form onSubmit={handleSendMessage} className="p-6 bg-slate-50 border-t border-slate-100 flex gap-2">
                  <input 
                     type="text" 
                     placeholder="Inquire about protocol..." 
                     className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-600"
                     value={chatInput}
                     onChange={e => setChatInput(e.target.value)}
                  />
                  <button type="submit" className="p-3 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-600/20 active:scale-95 transition-all">
                     <Send size={18} />
                  </button>
               </form>
            </div>
         ) : (
            <button 
               onClick={() => setIsChatOpen(true)}
               className="w-16 h-16 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-2xl shadow-indigo-600/40 hover:scale-110 active:scale-95 transition-all group"
            >
               <MessageSquare size={26} className="group-hover:rotate-12 transition-transform" />
            </button>
         )}
      </div>
    </div>
  );
};

export default LandingPage;
