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
  ArrowRight,
  DownloadCloud,
  Terminal,
  Zap,
  Layers,
  Cpu,
  Shield,
  CreditCard,
  QrCode,
  Scan,
  Database
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { View } from '../types';

interface LandingPageProps {
  isLoggedIn: boolean;
  isAppInstalled: boolean;
  onAuth: (step: 'login' | 'register') => void;
  onNavigateInfo: (view: View) => void;
  onInstall: () => void;
  onEnterTerminal: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ isLoggedIn, isAppInstalled, onAuth, onNavigateInfo, onInstall, onEnterTerminal }) => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<{role: 'user' | 'bot', text: string}[]>([
    { role: 'bot', text: 'Hello! I am StockBot. How can I help you manage your shop today?' }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const architectureRef = useRef<HTMLElement>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const scrollToSection = (ref: React.RefObject<HTMLElement>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

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
          systemInstruction: "You are StockBot, the official shop assistant for StockBit Pro. Professional contact: Call: 07010698264, WhatsApp: 07072127949. Keep answers simple, professional, and helpful for market people.",
        }
      });
      
      if (isMounted.current) {
        const botText = response.text || "I'm having trouble connecting. Please call our support line directly.";
        setChatMessages(prev => [...prev, { role: 'bot', text: botText }]);
      }
    } catch (error: any) {
      if (isMounted.current) {
        setChatMessages(prev => [...prev, { role: 'bot', text: "Service is a bit slow. Please call 07010698264 for immediate help." }]);
      }
    } finally {
      if (isMounted.current) {
        setIsTyping(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-indigo-500 selection:text-white transition-colors duration-300 overflow-x-hidden flex flex-col">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-2xl border-b border-slate-100 pt-[env(safe-area-inset-top)] box-content h-16 md:h-20">
        <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/30 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <Box size={22} className="text-white" />
            </div>
            <span className="font-black text-lg md:text-xl tracking-tighter uppercase text-slate-900 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>StockBit Pro</span>
          </div>
          
          <div className="hidden lg:flex items-center gap-10">
            <NavOption label="Features" onClick={() => scrollToSection(architectureRef)} />
            <NavOption label="Privacy" onClick={() => onNavigateInfo(View.PrivacyPolicy)} />
            <NavOption label="About" onClick={() => onNavigateInfo(View.AboutUs)} />
            <NavOption label="Support" onClick={() => onNavigateInfo(View.HelpCenter)} />
          </div>

          <div className="flex items-center gap-3 md:gap-4">
            {isLoggedIn ? (
              <button onClick={onEnterTerminal} className="px-5 py-2.5 bg-[#0a0f1d] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all flex items-center gap-2">
                <Terminal size={14} /> Terminal
              </button>
            ) : (
              <button onClick={() => onAuth('register')} className="px-6 py-2.5 bg-[#0a0f1d] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all">Start Free</button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-24 md:pt-48 pb-20 px-4 sm:px-6 min-h-[90vh] flex items-center overflow-x-hidden">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center relative z-10 w-full overflow-x-hidden">
          <div className="space-y-6 md:space-y-12 text-left w-full">
            <div className="inline-flex items-center gap-3 px-5 py-2 bg-indigo-50/50 rounded-full border border-indigo-100">
              <Sparkles size={14} className="text-indigo-600" />
              <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em]">Version 2025 Online</span>
            </div>
            
            <div className="space-y-3 w-full max-w-full">
              <h1 className="text-[clamp(2.5rem,12vw,5rem)] md:text-[clamp(4rem,8vw,6rem)] font-black tracking-tighter leading-[0.9] uppercase text-slate-900 drop-shadow-sm text-balance hyphens-auto break-words">
                INDUSTRIAL GRADE
              </h1>
              <h1 className="text-[clamp(1.8rem,10vw,4.5rem)] md:text-[clamp(3.5rem,7vw,5.5rem)] font-black tracking-tighter leading-[0.95] uppercase text-indigo-600 drop-shadow-sm text-balance break-words">
                STOCK & SALES INFRASTRUCTURE
              </h1>
            </div>
            
            <p className="max-w-xl text-base md:text-lg text-slate-500 font-medium leading-relaxed text-pretty">
              The ultimate logistics ecosystem for Nigerian enterprise. 
              Deploy high-velocity stock tracking, AI-driven auditing, and unified sales terminals across all your devices.
            </p>

            <div className="pt-4 pr-4">
              <button 
                onClick={isLoggedIn ? onEnterTerminal : () => onAuth('register')}
                className="w-full md:w-auto px-10 md:px-16 py-5 md:py-6 bg-[#0a0f1d] text-white rounded-[1.5rem] md:rounded-[2rem] font-black uppercase text-[11px] md:text-[12px] tracking-[0.2em] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-4"
              >
                OPEN MY SHOP <ArrowRight size={20} />
              </button>
            </div>

            <div className="flex items-center gap-6 md:gap-8 pt-10 border-t border-slate-100">
              <div className="flex -space-x-3 shrink-0">
                {[1,2,3,4].map(i => (
                  <div key={i} className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-slate-100 border-4 border-white flex items-center justify-center overflow-hidden shadow-sm">
                    <img src={`https://i.pravatar.cc/150?u=stockbit_user_${i}`} alt="User" />
                  </div>
                ))}
              </div>
              <div className="flex flex-col min-w-0">
                <p className="text-[13px] font-black uppercase text-slate-900 leading-none mb-1">500+ SHOPS</p>
                <p className="text-[9px] md:text-[10px] font-bold uppercase text-slate-400 tracking-widest truncate">ALREADY USING STOCKBIT PRO</p>
              </div>
            </div>
          </div>

          <div className="relative group hidden lg:block pr-8">
            <div className="absolute inset-0 bg-indigo-600/5 rounded-[5rem] rotate-3 scale-105 group-hover:rotate-6 transition-transform duration-1000"></div>
            <div className="relative bg-white rounded-[5rem] p-5 border border-slate-100 shadow-2xl overflow-hidden aspect-[4/3]">
              <img 
                src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=1200" 
                alt="StockBit Shop Dashboard" 
                className="w-full h-full object-cover rounded-[4rem] opacity-95 transition-transform duration-[2s] group-hover:scale-105"
                loading="eager"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-indigo-600/20 to-transparent"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section ref={architectureRef} className="py-24 md:py-32 px-6 bg-slate-50 pb-[env(safe-area-inset-bottom)]">
        <div className="max-w-7xl mx-auto space-y-20">
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <h2 className="text-[11px] font-black text-indigo-600 uppercase tracking-[0.4em]">CORE CAPABILITIES</h2>
            <h3 className="text-4xl md:text-6xl font-black text-slate-900 uppercase tracking-tighter leading-none">ENTERPRISE ENGINEERING</h3>
            <p className="text-base md:text-lg text-slate-500 font-medium">Sophisticated tools designed to optimize asset velocity and operational transparency.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard 
              icon={<Scan size={28} />}
              title="Computer Vision SKU Tracking"
              desc="Leverage high-precision optical recognition to synchronize inventory nodes instantly via mobile camera."
              color="text-indigo-600"
              bg="bg-indigo-50"
            />
            <FeatureCard 
              icon={<Database size={28} />}
              title="Cloud Ledger Persistence"
              desc="Real-time multi-terminal synchronization ensures data integrity across all decentralized warehouse nodes."
              color="text-emerald-600"
              bg="bg-emerald-50"
            />
            <FeatureCard 
              icon={<Shield size={28} />}
              title="Military-Grade Security"
              desc="End-to-end encryption and Row-Level Security protocols safeguard your proprietary enterprise intelligence."
              color="text-slate-900"
              bg="bg-slate-200"
            />
            <FeatureCard 
              icon={<BarChart3 size={28} />}
              title="Fiscal Intelligence"
              desc="Generate exhaustive financial audits and predictive analytics to visualize capital flow and seasonal trends."
              color="text-amber-600"
              bg="bg-amber-50"
            />
          </div>
        </div>
      </section>

      {/* Unified Terminal Showcase */}
      <section className="py-24 md:py-32 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <div className="order-2 lg:order-1 relative flex justify-center">
            <div className="grid grid-cols-2 gap-3 max-w-xs md:max-w-md scale-90 lg:scale-[0.85] transform-origin-center">
              <div className="space-y-3 pt-8">
                <img src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80" className="w-full aspect-square object-cover rounded-[1.5rem] shadow-xl" alt="Retail" />
                <img src="https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=600&q=80" className="w-full aspect-[2/3] object-cover rounded-[1.5rem] shadow-xl" alt="Fashion" />
              </div>
              <div className="space-y-3">
                <img src="https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=600&q=80" className="w-full aspect-[2/3] object-cover rounded-[1.5rem] shadow-xl" alt="Tech" />
                <img src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80" className="w-full aspect-square object-cover rounded-[1.5rem] shadow-xl" alt="Warehouse" />
              </div>
            </div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-indigo-600 rounded-full border-[8px] border-white shadow-2xl flex flex-col items-center justify-center text-white p-2 text-center z-10 transition-transform hover:scale-110">
              <p className="text-[16px] font-black leading-none mb-0.5">SYNC</p>
              <p className="text-[8px] font-bold uppercase opacity-80 leading-tight">Persistence Node</p>
            </div>
          </div>

          <div className="order-1 lg:order-2 space-y-12">
            <div className="space-y-6">
              <h2 className="text-[11px] font-black text-indigo-600 uppercase tracking-[0.4em]">UNIFIED DEPLOYMENT</h2>
              <h3 className="text-4xl md:text-6xl font-black text-slate-900 uppercase tracking-tighter leading-none">UNIVERSAL <br/> ACCESS PROTOCOL.</h3>
              <p className="text-lg text-slate-500 font-medium leading-relaxed">Eliminate proprietary hardware overhead. Deploy industrial-grade point-of-sale functionality on any mobile device or desktop workstation.</p>
            </div>

            <div className="space-y-6">
              <Point icon={<CheckCircle2 size={24} />} text="INTEGRATED PAYSTACK GATEWAY SETTLEMENT." />
              <Point icon={<CheckCircle2 size={24} />} text="ESC/POS THERMAL PRINTER COMPATIBILITY." />
              <Point icon={<CheckCircle2 size={24} />} text="OPTIMIZED FOR LATENCY-SENSITIVE ENVIRONMENTS." />
              <Point icon={<CheckCircle2 size={24} />} text="HIERARCHICAL ROLE-BASED ACCESS CONTROL." />
            </div>

            <button onClick={() => onNavigateInfo(View.HelpCenter)} className="inline-flex items-center gap-4 text-[12px] font-black uppercase tracking-[0.3em] text-indigo-600 hover:text-indigo-800 transition-all py-4 group">
              EXAMINE SPECIFICATIONS <ArrowRight size={18} className="transition-transform group-hover:translate-x-2" />
            </button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-6 bg-[#020617] relative overflow-hidden">
        <div className="max-w-4xl mx-auto text-center space-y-12 relative z-10">
          <h2 className="text-4xl md:text-7xl font-black text-white uppercase tracking-tighter leading-none">
            READY TO SCALE <br/> <span className="text-indigo-400">YOUR ENTERPRISE?</span>
          </h2>
          <p className="text-slate-400 text-base md:text-lg font-medium max-w-xl mx-auto leading-relaxed">
            Onboard your business to the StockBit Pro ecosystem and gain absolute control over your operational logistics.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-6">
            <button onClick={() => onAuth('register')} className="w-full sm:w-auto px-16 py-7 bg-indigo-600 text-white rounded-[2.5rem] font-black uppercase text-[12px] tracking-[0.3em] shadow-[0_20px_60px_-15px_rgba(79,70,229,0.5)] active:scale-95 transition-all">
              INITIALIZE DEPLOYMENT
            </button>
          </div>
        </div>
        <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
            <Database className="w-full h-full scale-150 rotate-12" />
        </div>
      </section>

      {/* Footer */}
      <footer className="py-24 px-6 bg-white border-t border-slate-100 pb-[env(safe-area-inset-bottom)]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 lg:gap-24">
          <div className="space-y-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/30 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                <Box size={22} className="text-white" />
              </div>
              <span className="font-black text-xl tracking-tighter uppercase cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>StockBit Pro</span>
            </div>
            <p className="text-[11px] text-slate-500 font-bold leading-relaxed uppercase tracking-widest">
              High-performance logistics intelligence for African retail. 
              Reliable. Scalable. Precise.
            </p>
            <div className="flex items-center gap-5">
              <SocialIcon icon={<Twitter size={20}/>} onClick={() => window.open('https://twitter.com/stockbit', '_blank')} />
              {!isAppInstalled && <SocialIcon icon={<Smartphone size={20}/>} onClick={onInstall} />}
            </div>
          </div>

          <FooterSection title="INTELLIGENCE SUITE" links={[
            { label: 'Inventory Control', onClick: () => scrollToSection(architectureRef) },
            { label: 'Sales Terminal', onClick: () => scrollToSection(architectureRef) },
            { label: 'AI Analytics', onClick: () => scrollToSection(architectureRef) },
            { label: isAppInstalled ? 'Console Login' : 'Download Client', onClick: isAppInstalled ? onEnterTerminal : onInstall },
          ]} />

          <FooterSection title="CORPORATE" links={[
            { label: 'Platform Story', onClick: () => onNavigateInfo(View.AboutUs) },
            { label: 'Knowledge Base', onClick: () => onNavigateInfo(View.HelpCenter) },
            { label: 'Service Protocol', onClick: () => onNavigateInfo(View.TermsOfService) },
            { label: 'Privacy Doctrine', onClick: () => onNavigateInfo(View.PrivacyPolicy) },
          ]} />

          <div className="space-y-10">
            <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-900">SUPPORT DESK</h4>
            <div className="space-y-6">
              <ContactLink icon={<Phone size={16} />} label="Voice Channel" value="07010698264" onClick={() => window.open('tel:07010698264')} />
              <ContactLink icon={<MessageCircle size={16} />} label="Digital Channel" value="07072127949" onClick={() => window.open('https://wa.me/2347072127949')} />
            </div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto pt-20 mt-20 border-t border-slate-100 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.6em] text-slate-400">© 2025 STOCKBIT TECHNOLOGIES. ALL RIGHTS RESERVED.</p>
        </div>
      </footer>

      {/* Floating AI ChatBot Bubble */}
      <div className="fixed bottom-10 right-10 z-[100] group">
        <button 
          onClick={() => setIsChatOpen(!isChatOpen)}
          className={`w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all duration-500 relative ${isChatOpen ? 'bg-slate-900 text-white rotate-90 scale-110' : 'bg-indigo-600 text-white hover:scale-110'}`}
        >
          {isChatOpen ? <X size={28} /> : <MessageSquare size={28} />}
          {!isChatOpen && <span className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 border-4 border-white rounded-full"></span>}
        </button>
        
        {isChatOpen && (
          <div className="absolute bottom-20 right-0 w-[300px] xs:w-[320px] md:w-[480px] bg-white rounded-[2.5rem] md:rounded-[3rem] shadow-[0_40px_120px_rgba(0,0,0,0.25)] border border-slate-100 flex flex-col overflow-hidden animate-in slide-in-from-bottom-12 fade-in duration-500">
            <div className="p-6 md:p-10 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-4 md:gap-5">
                <div className="w-10 h-10 md:w-14 md:h-14 bg-indigo-600 rounded-xl md:rounded-2xl flex items-center justify-center shadow-xl">
                  <Cpu size={22} className="md:w-7 md:h-7" />
                </div>
                <div>
                  <h3 className="text-sm md:text-base font-black uppercase tracking-widest leading-none">STOCKBOT AI</h3>
                  <p className="text-[8px] md:text-[10px] font-bold uppercase opacity-60 mt-1">INTELLIGENCE HUB ONLINE</p>
                </div>
              </div>
              <Activity size={20} className="text-emerald-500 animate-pulse md:w-6 md:h-6" />
            </div>

            <div className="flex-1 p-6 md:p-10 overflow-y-auto max-h-[400px] md:max-h-[450px] space-y-6 md:space-y-8 scrollbar-hide bg-slate-50/50">
              {chatMessages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-4 duration-500`}>
                  <div className={`max-w-[90%] md:max-w-[85%] p-5 md:p-6 rounded-[1.8rem] md:rounded-[2.2rem] text-[12px] md:text-[13px] font-semibold leading-relaxed shadow-sm ${
                    m.role === 'user' 
                    ? 'bg-indigo-600 text-white rounded-tr-none' 
                    : 'bg-white text-slate-600 rounded-tl-none border border-slate-100'
                  }`}>
                    {m.text}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white p-5 md:p-6 rounded-[1.8rem] md:rounded-[2.2rem] rounded-tl-none border border-slate-100 shadow-sm flex gap-1.5 items-center">
                    <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce delay-100"></div>
                    <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce delay-200"></div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="p-6 md:p-8 bg-white border-t border-slate-100">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="INQUIRE..." 
                  className="w-full pl-6 md:pl-8 pr-16 md:pr-20 py-4 md:py-5 bg-slate-50 border-none rounded-[1.5rem] md:rounded-[1.8rem] text-[10px] md:text-xs font-black uppercase outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-slate-400"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                />
                <button 
                  type="submit"
                  disabled={!chatInput.trim() || isTyping}
                  className="absolute right-2 md:right-3 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 bg-slate-900 text-white rounded-xl md:rounded-2xl flex items-center justify-center hover:bg-indigo-600 transition-all disabled:opacity-20 active:scale-90"
                >
                  <Send size={18} className="md:w-5 md:h-5" />
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

const NavOption = ({ label, onClick }: any) => (
  <button onClick={onClick} className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-500 hover:text-indigo-600 transition-all">
    {label}
  </button>
);

const FeatureCard = ({ icon, title, desc, color, bg }: any) => (
  <div className="bg-white p-10 md:p-12 rounded-[2.5rem] md:rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:border-indigo-100 transition-all group active:scale-95 duration-700">
    <div className={`w-14 h-14 md:w-16 md:h-16 ${bg} ${color} rounded-[1.5rem] md:rounded-[1.8rem] flex items-center justify-center mb-8 md:mb-10 shadow-inner group-hover:scale-110 group-hover:rotate-6 transition-all`}>
      {icon}
    </div>
    <h4 className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-tighter mb-4 leading-tight">{title}</h4>
    <p className="text-[12px] md:text-[13px] text-slate-500 font-medium leading-relaxed">{desc}</p>
  </div>
);

const Point = ({ icon, text }: any) => (
  <div className="flex items-center gap-4 md:gap-5 group cursor-default">
    <div className="text-emerald-500 group-hover:scale-125 transition-transform duration-500 shrink-0">{icon}</div>
    <span className="text-[11px] md:text-[12px] font-black uppercase tracking-[0.15em] text-slate-700 leading-tight">{text}</span>
  </div>
);

const SocialIcon = ({ icon, onClick }: any) => (
  <button onClick={onClick} className="w-11 h-11 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-slate-900 text-slate-500 hover:text-white hover:bg-indigo-600 transition-all flex items-center justify-center border border-white/5 active:scale-90 shadow-md">
    {icon}
  </button>
);

const FooterSection = ({ title, links }: any) => (
  <div className="space-y-8 md:space-y-10">
    <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-900">{title}</h4>
    <ul className="space-y-4 md:space-y-5">
      {links.map((l: any, i: number) => (
        <li key={i}>
          <button onClick={l.onClick} className="text-[11px] md:text-[12px] text-slate-500 hover:text-indigo-600 font-bold transition-all uppercase tracking-widest text-left whitespace-nowrap">{l.label}</button>
        </li>
      ))}
    </ul>
  </div>
);

const ContactLink = ({ icon, label, value, onClick }: any) => (
  <div className="flex items-center gap-4 md:gap-5 group cursor-pointer" onClick={onClick}>
    <div className="w-10 h-10 md:w-11 md:h-11 bg-slate-100 text-indigo-600 rounded-lg md:rounded-xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all shrink-0 shadow-sm">
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">{label}</p>
      <p className="text-[12px] md:text-[13px] font-black text-slate-900 truncate tracking-tight">{value}</p>
    </div>
  </div>
);

export default LandingPage;