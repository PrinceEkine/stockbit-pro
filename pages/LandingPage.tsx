
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
  Loader2
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

interface LandingPageProps {
  onAuth: (step: 'login' | 'register') => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onAuth }) => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<{role: 'user' | 'bot', text: string}[]>([
    { role: 'bot', text: 'Hi! I am StockBot. How can I help you scale your business today?' }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

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
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: userMsg,
        config: {
          systemInstruction: "You are StockBot, the official AI assistant for StockBit Pro. StockBit Pro is a high-performance cloud inventory and POS system for African enterprises, featuring AI scanning, marketplace sync (Jumia/Konga/WhatsApp), and multi-staff management. You are professional, helpful, and concise. If asked about contact, mention Call: 07010698264 or WhatsApp: 0707217949 or Twitter: @StockBitpro.",
        }
      });
      
      const botText = response.text || "I'm sorry, I'm having trouble connecting to my logic server. Please try again or contact support!";
      setChatMessages(prev => [...prev, { role: 'bot', text: botText }]);
    } catch (error) {
      setChatMessages(prev => [...prev, { role: 'bot', text: "Protocol error. Please use our direct support lines below." }]);
    } finally {
      setIsTyping(false);
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
          <div className="flex items-center gap-4">
            <a href="#about" className="hidden md:block text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-indigo-600 transition-colors">About</a>
            <a href="#help" className="hidden md:block text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-indigo-600 transition-colors px-4">Help</a>
            <button 
              onClick={() => onAuth('login')}
              className="px-6 py-2.5 text-sm font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 hover:text-indigo-600 transition-colors"
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
      <section className="pt-40 pb-20 px-6">
        <div className="max-w-5xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800 rounded-full">
            <Sparkles size={14} className="text-indigo-600" />
            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Powered by Gemini 3 Logic</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-none uppercase">
            The Future of Inventory <br className="hidden md:block"/> for <span className="text-indigo-600">African Enterprise</span>.
          </h1>
          <p className="max-w-2xl mx-auto text-lg md:text-xl text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
            High-speed cloud management built for Nigeria's retail landscape. 
            AI-powered scanning, real-time POS, and deep business intelligence.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button 
              onClick={() => onAuth('register')}
              className="w-full sm:w-auto px-10 py-5 bg-indigo-600 text-white rounded-[2rem] font-black uppercase text-xs tracking-[0.2em] shadow-2xl shadow-indigo-600/40 active:scale-95 transition-all flex items-center justify-center gap-3"
            >
              Start 60-Day Trial <ArrowRight size={20} />
            </button>
            <button 
              onClick={() => onAuth('login')}
              className="w-full sm:w-auto px-10 py-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] font-black uppercase text-xs tracking-[0.2em] active:scale-95 transition-all"
            >
              Explore Demo
            </button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 px-6 bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard 
              icon={<Zap className="text-amber-500" />} 
              title="Smart AI Scanner" 
              desc="Extract SKUs and details from packaging instantly using Gemini 3 Vision." 
            />
            <FeatureCard 
              icon={<ShoppingCart className="text-emerald-500" />} 
              title="Mobile POS" 
              desc="Sell anywhere. Record transactions, print receipts, and track debt flow." 
            />
            <FeatureCard 
              icon={<Globe className="text-indigo-500" />} 
              title="Cloud Sync" 
              desc="Synchronized inventory across phone, tablet, and PC in real-time." 
            />
            <FeatureCard 
              icon={<ShieldCheck className="text-slate-900 dark:text-white" />} 
              title="Secure Vault" 
              desc="Enterprise-grade encryption protecting your financial and stock data." 
            />
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-24 px-6 bg-slate-50 dark:bg-slate-950">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="lg:w-1/2 space-y-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-600 rounded-lg">
                <Info size={14} className="text-white" />
                <span className="text-[9px] font-black text-white uppercase tracking-widest">Our Mission</span>
              </div>
              <h2 className="text-4xl font-black uppercase tracking-tighter leading-tight">Empowering Nigeria's <br/>Retail Infrastructure.</h2>
              <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                StockBit Pro was born in the heart of Lagos with a single vision: to provide African business owners with the same level of technological sophistication as global retail giants. We combine advanced AI with local market insights to build tools that work where you are.
              </p>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="text-indigo-600 font-black text-2xl tracking-tighter">10k+</h4>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">SKUs Tracked Hourly</p>
                </div>
                <div>
                  <h4 className="text-indigo-600 font-black text-2xl tracking-tighter">99.9%</h4>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Uptime Record</p>
                </div>
              </div>
            </div>
            <div className="lg:w-1/2 grid grid-cols-2 gap-4">
              <div className="space-y-4 pt-12">
                <div className="h-48 bg-indigo-600 rounded-[2.5rem] shadow-2xl"></div>
                <div className="h-48 bg-slate-200 dark:bg-slate-800 rounded-[2.5rem]"></div>
              </div>
              <div className="space-y-4">
                <div className="h-48 bg-slate-300 dark:bg-slate-700 rounded-[2.5rem]"></div>
                <div className="h-48 bg-indigo-400 rounded-[2.5rem] shadow-xl"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Help Desk Section */}
      <section id="help" className="py-24 px-6 bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl font-black uppercase tracking-tighter">Help Desk & Resources</h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium">Everything you need to master your inventory protocol.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <HelpCard 
              title="Onboarding Guide" 
              desc="Learn how to sync your first warehouse in under 5 minutes." 
              link="#"
            />
            <HelpCard 
              title="API Documentation" 
              desc="Connect your existing software to our high-speed cloud ledger." 
              link="#"
            />
            <HelpCard 
              title="Video Tutorials" 
              desc="Watch how our AI scanner identifies SKUs in real-time." 
              link="#"
            />
          </div>
        </div>
      </section>

      {/* Privacy Disclosure */}
      <section className="py-24 px-6 bg-slate-50 dark:bg-slate-950">
        <div className="max-w-4xl mx-auto bg-white dark:bg-slate-900 p-12 rounded-[3rem] border border-slate-100 dark:border-slate-800 text-center space-y-8">
          <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
            <Lock size={32} />
          </div>
          <h2 className="text-3xl font-black uppercase tracking-tighter">Privacy & Security Disclosure</h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
            Your business data is your most valuable asset. StockBit Pro employs end-to-end military-grade encryption. We never sell your sales data or supplier lists. All operational logs are stored in secure cloud nodes with multi-region redundancy. Your privacy is hard-coded into our system architecture.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-full text-[9px] font-black uppercase tracking-widest border border-slate-100 dark:border-slate-700">ISO 27001 Standard</div>
            <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-full text-[9px] font-black uppercase tracking-widest border border-slate-100 dark:border-slate-700">NDPR Compliant</div>
            <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-full text-[9px] font-black uppercase tracking-widest border border-slate-100 dark:border-slate-700">AES-256 Encryption</div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 text-center bg-slate-900 text-white relative overflow-hidden">
        <Layers className="absolute -top-10 -left-10 w-64 h-64 text-white/5 rotate-12" />
        <Smartphone className="absolute -bottom-10 -right-10 w-64 h-64 text-white/5 -rotate-12" />
        
        <div className="max-w-3xl mx-auto relative z-10 space-y-8">
          <h2 className="text-4xl md:text-5xl font-black tracking-tighter uppercase">Ready to scale your business?</h2>
          <p className="text-slate-400 font-medium text-lg leading-relaxed">
            Join the elite circle of Nigerian retailers using high-performance logistics.
            No credit card required for trial.
          </p>
          <button 
            onClick={() => onAuth('register')}
            className="px-12 py-6 bg-white text-slate-900 rounded-[2rem] font-black uppercase text-sm tracking-widest shadow-2xl active:scale-95 transition-all"
          >
            Deploy StockBit Pro Now
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
                <li><a href="#about" className="text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-indigo-600">About Us</a></li>
                <li><a href="#help" className="text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-indigo-600">Help Center</a></li>
                <li><button onClick={() => onAuth('register')} className="text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-indigo-600">Deploy Terminal</button></li>
             </ul>
          </div>

          <div className="space-y-6">
             <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Legal</h4>
             <ul className="space-y-3">
                <li><a href="#" className="text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-indigo-600">Terms of Service</a></li>
                <li><a href="#" className="text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-indigo-600">Privacy Policy</a></li>
                <li><a href="#" className="text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-indigo-600">Cookie Protocol</a></li>
             </ul>
          </div>

          <div className="space-y-6">
             <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Contact Control</h4>
             <ul className="space-y-4">
                <li className="flex items-center gap-3">
                   <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg text-indigo-600"><Phone size={14} /></div>
                   <div className="flex flex-col">
                      <span className="text-[9px] font-black text-slate-400 uppercase">Direct Call</span>
                      <a href="tel:07010698264" className="text-xs font-bold">07010698264</a>
                   </div>
                </li>
                <li className="flex items-center gap-3">
                   <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg text-emerald-600"><MessageCircle size={14} /></div>
                   <div className="flex flex-col">
                      <span className="text-[9px] font-black text-slate-400 uppercase">WhatsApp Ops</span>
                      <a href="https://wa.me/234707217949" className="text-xs font-bold">0707217949</a>
                   </div>
                </li>
                <li className="flex items-center gap-3">
                   <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-blue-400"><Twitter size={14} /></div>
                   <div className="flex flex-col">
                      <span className="text-[9px] font-black text-slate-400 uppercase">Twitter Handle</span>
                      <a href="https://x.com/StockBitpro" target="_blank" className="text-xs font-bold">@StockBitpro</a>
                   </div>
                </li>
             </ul>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-slate-100 dark:border-slate-800 text-center">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">
            © 2025 STOCKBIT TECHNOLOGIES LTD. MADE IN LAGOS.
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
                        <p className="text-[8px] font-bold uppercase text-indigo-200">Terminal Assistant</p>
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
                     placeholder="Type message..." 
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
               <div className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 rounded-full border-4 border-slate-50 dark:border-slate-950 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping"></div>
               </div>
            </button>
         )}
      </div>
    </div>
  );
};

const FeatureCard = ({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) => (
  <div className="p-8 bg-slate-50 dark:bg-slate-800/50 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 hover:border-indigo-500/30 transition-all group">
    <div className="w-14 h-14 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center shadow-sm mb-6 group-hover:scale-110 transition-transform">
      {React.cloneElement(icon as React.ReactElement, { size: 28 })}
    </div>
    <h3 className="text-lg font-black uppercase tracking-tighter mb-2">{title}</h3>
    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{desc}</p>
  </div>
);

const StatItem = ({ title, desc }: { title: string, desc: string }) => (
  <div className="flex gap-4">
    <div className="mt-1">
      <CheckCircle2 size={20} className="text-emerald-500" />
    </div>
    <div>
      <h4 className="text-lg font-black uppercase tracking-tighter">{title}</h4>
      <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{desc}</p>
    </div>
  </div>
);

const HelpCard = ({ title, desc, link }: { title: string, desc: string, link: string }) => (
  <a href={link} className="p-8 bg-slate-50 dark:bg-slate-800/50 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 hover:border-indigo-500 transition-all group">
    <div className="w-10 h-10 bg-white dark:bg-slate-900 rounded-xl flex items-center justify-center mb-6 shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-all">
      <HelpCircle size={20} />
    </div>
    <h3 className="text-sm font-black uppercase tracking-widest mb-2">{title}</h3>
    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{desc}</p>
  </a>
);

export default LandingPage;
