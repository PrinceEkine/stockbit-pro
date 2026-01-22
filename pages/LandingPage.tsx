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
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-indigo-500 selection:text-white transition-colors duration-300 overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-2xl border-b border-slate-100 h-16 md:h-20">
        <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-[1.2rem] flex items-center justify-center shadow-lg shadow-indigo-600/30 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
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
              <button onClick={onEnterTerminal} className="px-6 py-2.5 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-600/20 active:scale-95 transition-all flex items-center gap-2">
                <Terminal size={14} /> My Shop
              </button>
            ) : (
              <>
                <button onClick={() => onAuth('login')} className="hidden sm:block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-indigo-600 transition-colors">Login</button>
                <button onClick={() => onAuth('register')} className="px-6 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl active:scale-95 hover:bg-slate-800 transition-all">Start Free</button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 md:pt-48 pb-20 px-6 overflow-hidden min-h-[90vh] flex items-center">
        <div className="absolute inset-0 z-[-2]">
          <img 
            src="https://images.unsplash.com/photo-1551288049-bbbda595c7b8?auto=format&fit=crop&q=80&w=2000" 
            alt="Hero Background" 
            className="w-full h-full object-cover opacity-[0.05]"
            loading="eager"
          />
        </div>
        
        <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] -z-10 animate-pulse"></div>
        <div className="absolute -bottom-20 -left-20 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[120px] -z-10"></div>
        
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-16 items-center relative z-10">
          <div className="space-y-8 text-left">
            <div className="inline-flex items-center gap-3 px-4 py-2 bg-indigo-50 rounded-full border border-indigo-100">
              <Sparkles size={14} className="text-indigo-600" />
              <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.25em]">Version 2025 Online</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-[0.9] uppercase text-slate-900">
              Super Simple <br/>
              <span className="text-indigo-600">Stock & Sales <br/> Helper.</span>
            </h1>
            
            <p className="max-w-md text-sm md:text-base text-slate-500 font-medium leading-relaxed">
              The easiest way to track your shop inventory in Nigeria. 
              Works on your phone, tablet, or computer. Know exactly what you have in stock.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row gap-4">
              <button 
                onClick={isLoggedIn ? onEnterTerminal : () => onAuth('register')}
                className="group px-10 py-5 bg-slate-900 text-white rounded-[2rem] font-black uppercase text-[10px] md:text-[11px] tracking-[0.2em] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-4"
              >
                {isLoggedIn ? 'Go to My Shop' : 'Open My Shop'} <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
              
              {!isAppInstalled && (
                <button 
                  onClick={onInstall}
                  className="px-10 py-5 bg-white text-slate-900 border-2 border-slate-100 rounded-[2rem] font-black uppercase text-[10px] md:text-[11px] tracking-[0.2em] hover:bg-slate-50 active:scale-95 transition-all flex items-center justify-center gap-4"
                >
                  Save to My Phone <DownloadCloud size={18} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-8 pt-8 border-t border-slate-100">
              <div className="flex -space-x-3">
                {[1,2,3,4].map(i => (
                  <div key={i} className="w-10 h-10 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center overflow-hidden">
                    <img src={`https://i.pravatar.cc/150?u=stockbit_user_${i}`} alt="User" />
                  </div>
                ))}
              </div>
              <div className="flex flex-col">
                <p className="text-[11px] font-black uppercase text-slate-900">500+ Shops</p>
                <p className="text-[9px] font-bold uppercase text-slate-400">Already using StockBit Pro</p>
              </div>
            </div>
          </div>

          <div className="relative group hidden lg:block">
            <div className="absolute inset-0 bg-indigo-600/5 rounded-[4rem] rotate-3 scale-105 group-hover:rotate-6 transition-transform duration-700"></div>
            <div className="relative bg-white rounded-[4rem] p-4 border border-slate-100 shadow-2xl overflow-hidden">
              <img 
                src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=1200" 
                alt="StockBit Shop Dashboard" 
                className="w-full h-full object-cover rounded-[3.5rem] opacity-95"
                loading="eager"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-indigo-600/10 to-transparent"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section ref={architectureRef} className="py-24 md:py-32 px-6 bg-slate-50">
        <div className="max-w-7xl mx-auto space-y-20">
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <h2 className="text-[11px] font-black text-indigo-600 uppercase tracking-[0.4em]">What you get</h2>
            <h3 className="text-4xl md:text-5xl font-black text-slate-900 uppercase tracking-tighter leading-none">Made for Your Business</h3>
            <p className="text-sm md:text-base text-slate-500 font-medium">Simple tools to help you manage your stock and make more money.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard 
              icon={<Scan size={28} />}
              title="Easy QR Scanning"
              desc="Just use your phone camera to scan products. It adds them to your stock instantly."
              color="text-indigo-600"
              bg="bg-indigo-50"
            />
            <FeatureCard 
              icon={<Database size={28} />}
              title="Automatic Sync"
              desc="Information updates on your phone and computer at the same time."
              color="text-emerald-600"
              bg="bg-emerald-50"
            />
            <FeatureCard 
              icon={<Shield size={28} />}
              title="Safe & Secure"
              desc="Your shop data is private and protected. Only you can see your sales records."
              color="text-slate-900"
              bg="bg-slate-200"
            />
            <FeatureCard 
              icon={<BarChart3 size={28} />}
              title="Sales Reports"
              desc="See how much money you made today, this week, or this month clearly."
              color="text-amber-600"
              bg="bg-amber-50"
            />
          </div>
        </div>
      </section>

      {/* Unified Terminal Showcase */}
      <section className="py-24 md:py-32 px-6">
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
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 bg-indigo-600 rounded-full border-[6px] border-white shadow-2xl flex flex-col items-center justify-center text-white p-2 text-center z-10">
              <p className="text-[14px] font-black leading-none mb-0.5">FAST</p>
              <p className="text-[7px] font-bold uppercase opacity-80 leading-tight">Always Online</p>
            </div>
          </div>

          <div className="order-1 lg:order-2 space-y-10">
            <div className="space-y-4">
              <h2 className="text-[11px] font-black text-indigo-600 uppercase tracking-[0.4em]">Works on any phone</h2>
              <h3 className="text-4xl md:text-5xl font-black text-slate-900 uppercase tracking-tighter leading-none">Your Shop. <br/> in your Pocket.</h3>
              <p className="text-base text-slate-500 font-medium leading-relaxed">No expensive machines needed. Use your own phone to record sales and print receipts easily.</p>
            </div>

            <div className="space-y-6">
              <Point icon={<CheckCircle2 size={20} />} text="COLLECT PAYMENTS WITH PAYSTACK." />
              <Point icon={<CheckCircle2 size={20} />} text="CONNECT TO BLUETOOTH PRINTERS." />
              <Point icon={<CheckCircle2 size={20} />} text="STILL WORKS WHEN INTERNET IS SLOW." />
              <Point icon={<CheckCircle2 size={20} />} text="ADD STAFF TO HELP YOU SELL." />
            </div>

            <button onClick={() => onNavigateInfo(View.HelpCenter)} className="inline-flex items-center gap-4 text-[11px] font-black uppercase tracking-[0.25em] text-indigo-600 hover:text-indigo-800 transition-colors py-4">
              SEE HOW IT WORKS <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 bg-[#020617] relative overflow-hidden">
        <div className="max-w-4xl mx-auto text-center space-y-10 relative z-10">
          <h2 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter leading-none">
            Ready to Start <br/> <span className="text-indigo-400">Growing Your Shop?</span>
          </h2>
          <p className="text-slate-400 text-sm md:text-base font-medium max-w-xl mx-auto">
            Take your business online today. Open your shop in less than a minute.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <button onClick={() => onAuth('register')} className="w-full sm:w-auto px-12 py-5 bg-indigo-600 text-white rounded-[2rem] font-black uppercase text-[10px] tracking-[0.3em] shadow-2xl shadow-indigo-600/20 active:scale-95 transition-all">
              Join StockBit Pro
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 px-6 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-20">
          <div className="space-y-8">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/30 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                <Box size={18} className="text-white" />
              </div>
              <span className="font-black text-lg tracking-tighter uppercase cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>StockBit Pro</span>
            </div>
            <p className="text-[10px] text-slate-500 font-bold leading-relaxed uppercase tracking-wider">
              Smart shop management for Nigeria. 
              Easy. Fast. Professional.
            </p>
            <div className="flex items-center gap-4">
              <SocialIcon icon={<Twitter size={18}/>} onClick={() => window.open('https://twitter.com/stockbit', '_blank')} />
              {!isAppInstalled && <SocialIcon icon={<Smartphone size={18}/>} onClick={onInstall} />}
            </div>
          </div>

          <FooterSection title="Shop Tools" links={[
            { label: 'Stock Manager', onClick: () => scrollToSection(architectureRef) },
            { label: 'Sales Counter', onClick: () => scrollToSection(architectureRef) },
            { label: 'AI Help', onClick: () => scrollToSection(architectureRef) },
            { label: isAppInstalled ? 'My Shop' : 'Download App', onClick: isAppInstalled ? onEnterTerminal : onInstall },
          ]} />

          <FooterSection title="About" links={[
            { label: 'Our Story', onClick: () => onNavigateInfo(View.AboutUs) },
            { label: 'Help Desk', onClick: () => onNavigateInfo(View.HelpCenter) },
            { label: 'Rules of Service', onClick: () => onNavigateInfo(View.TermsOfService) },
            { label: 'Your Privacy', onClick: () => onNavigateInfo(View.PrivacyPolicy) },
          ]} />

          <div className="space-y-8">
            <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-900">Need Help?</h4>
            <div className="space-y-4">
              <ContactLink icon={<Phone size={14} />} label="Call Us" value="07010698264" onClick={() => window.open('tel:07010698264')} />
              <ContactLink icon={<MessageCircle size={14} />} label="WhatsApp Us" value="07072127949" onClick={() => window.open('https://wa.me/2347072127949')} />
            </div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto pt-16 mt-16 border-t border-slate-100 text-center">
          <p className="text-[9px] font-black uppercase tracking-[0.5em] text-slate-400">© 2025 StockBit Technologies. All Rights Reserved.</p>
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
          <div className="absolute bottom-20 right-0 w-[350px] md:w-[450px] bg-white rounded-[2.5rem] shadow-[0_30px_100px_rgba(0,0,0,0.15)] border border-slate-100 flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-500">
            <div className="p-8 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Cpu size={24} />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-widest">StockBot AI</h3>
                  <p className="text-[9px] font-bold uppercase opacity-60">Help Desk Online</p>
                </div>
              </div>
              <Activity size={20} className="text-emerald-500 animate-pulse" />
            </div>

            <div className="flex-1 p-8 overflow-y-auto max-h-[400px] space-y-6 scrollbar-hide bg-slate-50/50">
              {chatMessages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
                  <div className={`max-w-[85%] p-5 rounded-[1.8rem] text-xs font-medium leading-relaxed shadow-sm ${
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
                  <div className="bg-white p-5 rounded-[1.8rem] rounded-tl-none border border-slate-100 shadow-sm flex gap-1">
                    <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce delay-100"></div>
                    <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce delay-200"></div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="p-6 bg-white border-t border-slate-100">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Ask me a question about the app..." 
                  className="w-full pl-6 pr-16 py-4 bg-slate-50 border-none rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                />
                <button 
                  type="submit"
                  disabled={!chatInput.trim() || isTyping}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center hover:bg-indigo-600 transition-colors disabled:opacity-20"
                >
                  <Send size={16} />
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
  <button onClick={onClick} className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 hover:text-indigo-600 transition-colors">
    {label}
  </button>
);

const FeatureCard = ({ icon, title, desc, color, bg }: any) => (
  <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:border-indigo-100 transition-all group active:scale-95 duration-500">
    <div className={`w-16 h-16 ${bg} ${color} rounded-[1.5rem] flex items-center justify-center mb-10 shadow-inner group-hover:scale-110 transition-transform`}>
      {icon}
    </div>
    <h4 className="text-xl font-black text-slate-900 uppercase tracking-tighter mb-4">{title}</h4>
    <p className="text-[12px] text-slate-500 font-medium leading-relaxed">{desc}</p>
  </div>
);

const Point = ({ icon, text }: any) => (
  <div className="flex items-center gap-4 group">
    <div className="text-emerald-500 group-hover:scale-125 transition-transform duration-300">{icon}</div>
    <span className="text-[11px] font-black uppercase tracking-widest text-slate-700">{text}</span>
  </div>
);

const SocialIcon = ({ icon, onClick }: any) => (
  <button onClick={onClick} className="w-10 h-10 rounded-xl bg-slate-900 text-slate-500 hover:text-white hover:bg-indigo-600 transition-all flex items-center justify-center border border-white/5">
    {icon}
  </button>
);

const FooterSection = ({ title, links }: any) => (
  <div className="space-y-8">
    <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-900">{title}</h4>
    <ul className="space-y-4">
      {links.map((l: any, i: number) => (
        <li key={i}>
          <button onClick={l.onClick} className="text-[11px] text-slate-500 hover:text-indigo-600 font-bold transition-colors uppercase tracking-widest text-left">{l.label}</button>
        </li>
      ))}
    </ul>
  </div>
);

const ContactLink = ({ icon, label, value, onClick }: any) => (
  <div className="flex items-center gap-4 group cursor-pointer" onClick={onClick}>
    <div className="w-9 h-9 bg-slate-100 text-indigo-600 rounded-lg flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all">
      {icon}
    </div>
    <div>
      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{label}</p>
      <p className="text-[11px] font-bold text-slate-900">{value}</p>
    </div>
  </div>
);

export default LandingPage;