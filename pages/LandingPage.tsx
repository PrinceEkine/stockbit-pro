
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
  PlayCircle
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

  const scrollToEnterprise = () => {
    const el = document.getElementById('staff');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
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
          <div className="flex items-center gap-2 md:gap-4">
            <button 
              onClick={() => onNavigateInfo(View.AboutUs)} 
              className="hidden md:block text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-indigo-600 transition-colors px-3 py-2"
            >
              About
            </button>
            <button 
              onClick={scrollToEnterprise}
              className="hidden md:block text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-indigo-600 transition-colors px-3 py-2"
            >
              Enterprise
            </button>
            <button 
              onClick={() => onAuth('login')}
              className="px-4 md:px-6 py-2.5 text-sm font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 hover:text-indigo-600 transition-colors"
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
      <section className="pt-40 pb-20 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto text-center space-y-8 relative">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800 rounded-full">
            <Sparkles size={14} className="text-indigo-600" />
            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Enterprise Architecture</span>
          </div>
          <h1 className="text-5xl md:text-8xl font-black tracking-tighter leading-[0.9] uppercase max-w-5xl mx-auto">
            Industrial Logistics <br className="hidden md:block"/> for <span className="text-indigo-600">African Growth</span>.
          </h1>
          <p className="max-w-2xl mx-auto text-lg md:text-xl text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
            A unified terminal ecosystem engineered for high-velocity retail. 
            AI-driven auditing, immutable ledgers, and multi-staff synchronization.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button 
              onClick={() => onAuth('register')}
              className="w-full sm:w-auto px-10 py-5 bg-indigo-600 text-white rounded-[2rem] font-black uppercase text-xs tracking-[0.2em] shadow-2xl shadow-indigo-600/40 active:scale-95 transition-all flex items-center justify-center gap-3"
            >
              Deploy Trial Terminal <ArrowRight size={20} />
            </button>
          </div>

          {/* APP PREVIEW IMAGE - HERO */}
          <div className="mt-20 relative perspective-1000 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-300">
            <div className="relative mx-auto max-w-6xl group">
              <div className="absolute -inset-4 bg-indigo-500/20 rounded-[3rem] blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
              <img 
                src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=2000" 
                alt="StockBit Dashboard Preview" 
                className="rounded-[2.5rem] md:rounded-[4rem] shadow-2xl border-4 border-white dark:border-slate-800 relative z-10 transform hover:rotate-1 hover:scale-[1.02] transition-all duration-700 cursor-pointer object-cover aspect-[21/9]"
              />
              <div className="absolute inset-0 rounded-[2.5rem] md:rounded-[4rem] bg-gradient-to-t from-slate-900/60 via-transparent to-transparent z-20 pointer-events-none"></div>
              <div className="absolute bottom-8 left-8 md:bottom-16 md:left-16 z-30 flex items-center gap-4">
                <div className="w-16 h-16 bg-white dark:bg-slate-900 rounded-full flex items-center justify-center shadow-2xl text-indigo-600">
                  <PlayCircle size={32} />
                </div>
                <div className="text-left text-white">
                  <p className="text-xs font-black uppercase tracking-widest opacity-80">Interface v4.2</p>
                  <h4 className="text-xl font-black uppercase tracking-tighter">Unified Mission Control</h4>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* App Capabilities Section - Detailed Visuals */}
      <section className="py-32 px-6">
        <div className="max-w-7xl mx-auto space-y-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
             <div className="order-2 lg:order-1">
                <img 
                  src="https://images.unsplash.com/photo-1556740738-b6a63e27c4df?auto=format&fit=crop&q=80&w=1200" 
                  alt="POS Terminal in Action" 
                  className="rounded-[3rem] shadow-2xl border border-slate-200 dark:border-slate-800 transform -rotate-2 hover:rotate-0 transition-transform duration-500"
                />
             </div>
             <div className="space-y-8 order-1 lg:order-2">
                <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center text-indigo-600">
                  <ShoppingCart size={24} />
                </div>
                <h3 className="text-4xl font-black uppercase tracking-tighter leading-tight">Fastest POS Terminal <br/>in the Market.</h3>
                <p className="text-slate-500 dark:text-slate-400 text-lg font-medium leading-relaxed">
                  Record sales in milliseconds. Our optimized checkout flow handles barcodes, manual SKU entry, and instant digital payments with zero lag.
                </p>
                <ul className="space-y-4">
                  {['Multi-cart order queueing', 'Offline sales preservation', 'Instant thermal printing', 'Split payment settlement'].map((f, i) => (
                    <li key={i} className="flex items-center gap-3 font-black uppercase text-[10px] tracking-widest text-slate-900 dark:text-white">
                      <CheckCircle2 size={16} className="text-emerald-500" /> {f}
                    </li>
                  ))}
                </ul>
             </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
             <div className="space-y-8">
                <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center text-indigo-600">
                  <BarChart3 size={24} />
                </div>
                <h3 className="text-4xl font-black uppercase tracking-tighter leading-tight">AI Driven <br/>Logistics Audit.</h3>
                <p className="text-slate-500 dark:text-slate-400 text-lg font-medium leading-relaxed">
                  Gemini 3 Pro analyzes every movement. Identify shrinkage, optimize restocking cycles, and forecast demand before the weekend peak.
                </p>
                <div className="p-6 bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl space-y-4">
                   <div className="flex justify-between items-center text-[10px] font-black uppercase text-indigo-400 tracking-widest">
                      <span>Neural Analysis</span>
                      <span>89% Accuracy</span>
                   </div>
                   <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-600 w-3/4"></div>
                   </div>
                   <p className="text-[11px] text-slate-400 italic">"Restock Type-C adapters immediately; velocity increased 14% since Tuesday."</p>
                </div>
             </div>
             <div>
                <img 
                  src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=1200" 
                  alt="StockBit AI Analytics" 
                  className="rounded-[3rem] shadow-2xl border border-slate-200 dark:border-slate-800 transform rotate-2 hover:rotate-0 transition-transform duration-500"
                />
             </div>
          </div>
        </div>
      </section>

      {/* Enterprise Staff Management Section */}
      <section id="staff" className="py-32 px-6 bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-20">
            <div className="lg:w-1/2 space-y-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-600 rounded-lg">
                <Users size={14} className="text-white" />
                <span className="text-[9px] font-black text-white uppercase tracking-widest">Personnel Protocol</span>
              </div>
              <h2 className="text-4xl font-black uppercase tracking-tighter leading-tight">Elite Multi-Staff <br/>Governance Suite.</h2>
              <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed text-lg">
                Maintain absolute operational integrity while delegating mission-critical tasks to your frontline team. Our enterprise suite ensures zero-leakage workflows.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-indigo-600">
                    <ShieldCheck size={20} />
                    <h4 className="font-black uppercase tracking-widest text-xs">Granular RBAC</h4>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                    Deploy Role-Based Access Control to enforce strict data silos for Cashiers, Supervisors, and Admins.
                  </p>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-indigo-600">
                    <Eye size={20} />
                    <h4 className="font-black uppercase tracking-widest text-xs">Immutable Audit</h4>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                    Real-time activity logs with cryptographic timestamps for total transaction accountability.
                  </p>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-indigo-600">
                    <Activity size={20} />
                    <h4 className="font-black uppercase tracking-widest text-xs">Productivity Intel</h4>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                    Quantify individual terminal performance and staff throughput across decentralized branches.
                  </p>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-indigo-600">
                    <Smartphone size={20} />
                    <h4 className="font-black uppercase tracking-widest text-xs">Terminal Sync</h4>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                    Concurrent multi-device synchronization with industrial-grade perimeter security.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="lg:w-1/2 relative">
              <div className="aspect-square md:aspect-video rounded-[3rem] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700">
                 <img 
                   src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&q=80&w=1200" 
                   alt="Multi-staff collaboration" 
                   className="w-full h-full object-cover"
                 />
                 <div className="absolute inset-0 bg-indigo-600/10 mix-blend-multiply"></div>
              </div>
              <div className="absolute -top-6 -right-6 w-32 h-32 bg-indigo-600 rounded-[2rem] flex items-center justify-center shadow-2xl rotate-12">
                 <ShieldCheck size={48} className="text-white" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Features Grid */}
      <section className="py-24 px-6 bg-slate-50 dark:bg-slate-950">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard 
              icon={<Zap className="text-amber-500" />} 
              title="Flash AI Scanner" 
              desc="Sub-second SKU extraction from heterogeneous packaging via Gemini 3 Vision." 
            />
            <FeatureCard 
              icon={<ShoppingCart className="text-emerald-500" />} 
              title="Unified POS" 
              desc="High-speed transaction processing with multi-payment settlement integration." 
            />
            <FeatureCard 
              icon={<Globe className="text-indigo-500" />} 
              title="Global Cloud" 
              desc="Persistent database replication across decentralized mobile and desktop nodes." 
            />
            <FeatureCard 
              icon={<ShieldCheck className="text-slate-900 dark:text-white" />} 
              title="Secured Ledger" 
              desc="Military-grade encryption protecting critical financial and stock asset data." 
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-6 text-center bg-slate-900 text-white relative overflow-hidden">
        <img 
          src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=2000" 
          alt="Retail Store Visual" 
          className="absolute inset-0 w-full h-full object-cover opacity-20"
        />
        <div className="max-w-3xl mx-auto relative z-10 space-y-8">
          <h2 className="text-4xl md:text-5xl font-black tracking-tighter uppercase leading-tight">Upgrade Your <br/>Operational Protocol.</h2>
          <p className="text-slate-400 font-medium text-lg leading-relaxed">
            Deploy StockBit Pro across your entire organization and gain absolute control today.
          </p>
          <button 
            onClick={() => onAuth('register')}
            className="px-12 py-6 bg-white text-slate-900 rounded-[2rem] font-black uppercase text-sm tracking-widest shadow-2xl active:scale-95 transition-all"
          >
            Deploy Terminal Now
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-24 px-6 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
                <Box size={18} className="text-white" />
              </div>
              <span className="font-black text-sm uppercase tracking-widest">StockBit Pro</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
              Industrial-grade retail management for the next generation of African commerce.
            </p>
            <div className="flex gap-4">
               <a href="https://x.com/StockBitpro" target="_blank" className="p-2 bg-slate-100 dark:bg-slate-900 rounded-lg text-slate-400 hover:text-indigo-600 transition-colors">
                  <Twitter size={18} />
               </a>
            </div>
          </div>

          <div className="space-y-6">
             <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Navigation</h4>
             <ul className="space-y-3">
                <li><button onClick={() => onNavigateInfo(View.AboutUs)} className="text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-indigo-600">About Us</button></li>
                <li><button onClick={() => onNavigateInfo(View.HelpCenter)} className="text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-indigo-600">Help Center</button></li>
             </ul>
          </div>

          <div className="space-y-6">
             <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Governance</h4>
             <ul className="space-y-3">
                <li><button onClick={() => onNavigateInfo(View.Governance)} className="text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-indigo-600">Governance</button></li>
                <li><button onClick={() => onNavigateInfo(View.TermsOfService)} className="text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-indigo-600">Terms of Service</button></li>
                <li><button onClick={() => onNavigateInfo(View.PrivacyPolicy)} className="text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-indigo-600">Privacy Policy</button></li>
             </ul>
          </div>

          <div className="space-y-6">
             <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Contact Control</h4>
             <ul className="space-y-4">
                <li className="flex items-center gap-3">
                   <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg text-indigo-600"><Phone size={14} /></div>
                   <div className="flex flex-col">
                      <span className="text-[9px] font-black text-slate-400 uppercase">Direct Line</span>
                      <a href="tel:07010698264" className="text-xs font-bold">07010698264</a>
                   </div>
                </li>
                <li className="flex items-center gap-3">
                   <div className="p-2 bg-emerald-50 dark:bg-indigo-900/30 rounded-lg text-emerald-600"><MessageCircle size={14} /></div>
                   <div className="flex flex-col">
                      <span className="text-[9px] font-black text-slate-400 uppercase">WhatsApp Ops</span>
                      <a href="https://wa.me/2347072127949" className="text-xs font-bold">07072127949</a>
                   </div>
                </li>
             </ul>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-slate-100 dark:border-slate-800 text-center">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">
            © 2025 STOCKBIT TECHNOLOGIES LTD. POWERED BY GEMINI.
          </p>
        </div>
      </footer>

      {/* AI Chat Bot UI */}
      <div className="fixed bottom-8 right-8 z-[60]">
         {isChatOpen ? (
            <div className="w-80 md:w-96 h-[500px] bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-in slide-in-from-bottom-10">
               {/* Chat Header */}
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

               {/* Chat Messages */}
               <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide">
                  {chatMessages.map((msg, idx) => (
                     <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] p-4 rounded-2xl text-[11px] font-medium leading-relaxed ${
                           msg.role === 'user' 
                           ? 'bg-indigo-600 text-white rounded-br-none' 
                           : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-bl-none'
                        }`}>
                           {msg.text}
                        </div>
                     </div>
                  ))}
                  {isTyping && (
                     <div className="flex justify-start">
                        <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-2xl rounded-bl-none flex gap-1">
                           <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></div>
                           <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-100"></div>
                           <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-200"></div>
                        </div>
                     </div>
                  )}
                  <div ref={chatEndRef} />
               </div>

               {/* Chat Input */}
               <form onSubmit={handleSendMessage} className="p-6 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex gap-2">
                  <input 
                     type="text" 
                     placeholder="Inquire about protocol..." 
                     className="flex-1 bg-white dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-600 dark:text-white"
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
               <MessageSquare size={24} className="group-hover:rotate-12 transition-transform" />
            </button>
         )}
      </div>
    </div>
  );
};

const FeatureCard = ({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) => (
  <div className="p-8 bg-slate-50 dark:bg-slate-800/50 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 hover:border-indigo-500/30 transition-all group">
    <div className="w-14 h-14 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center shadow-sm mb-6 group-hover:scale-110 transition-transform">
      {React.cloneElement(icon as React.ReactElement<any>, { size: 28 })}
    </div>
    <h3 className="text-lg font-black uppercase tracking-tighter mb-2">{title}</h3>
    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{desc}</p>
  </div>
);

export default LandingPage;
