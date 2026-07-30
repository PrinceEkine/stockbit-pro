
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Box, 
  Sparkles, 
  Smartphone,
  CheckCircle2,
  BarChart3,
  ShoppingCart,
  MessageSquare,
  Twitter,
  Phone,
  MessageCircle,
  X,
  Send,
  Users,
  Activity,
  ArrowRight,
  DownloadCloud,
  Terminal,
  Cpu,
  CreditCard,
  Scan,
  Database,
  TrendingUp,
  Languages,
  ChevronDown,
  Layout,
  LogIn
} from 'lucide-react';
import { callQwenPlus } from '../services/qwenService';
import { View, AppLanguage } from '../types';
import { TRANSLATIONS } from '../constants/translations';

interface LandingPageProps {
  isLoggedIn: boolean;
  isAppInstalled: boolean;
  language: AppLanguage;
  onLanguageChange: (lang: AppLanguage) => void;
  onAuth: (step: 'login' | 'register') => void;
  onNavigateInfo: (view: View) => void;
  onInstall: () => void;
  onEnterTerminal: () => void;
}

const FLOATING_PARTICLES = [
  { Icon: Box, size: 32, top: '12%', left: '6%', duration: 14, delay: 0, color: 'text-indigo-500/20 dark:text-indigo-400/30' },
  { Icon: ShoppingCart, size: 26, top: '25%', left: '84%', duration: 18, delay: 1, color: 'text-emerald-500/20 dark:text-emerald-400/30' },
  { Icon: TrendingUp, size: 28, top: '58%', left: '10%', duration: 22, delay: 2, color: 'text-blue-500/20 dark:text-blue-400/30' },
  { Icon: Sparkles, size: 20, top: '70%', left: '76%', duration: 12, delay: 0.5, color: 'text-amber-500/25 dark:text-amber-400/35' },
  { Icon: Database, size: 24, top: '38%', left: '90%', duration: 16, delay: 1.5, color: 'text-indigo-500/20 dark:text-indigo-400/30' },
  { Icon: Scan, size: 26, top: '84%', left: '16%', duration: 20, delay: 3, color: 'text-rose-500/20 dark:text-rose-400/30' },
  { Icon: BarChart3, size: 22, top: '45%', left: '5%', duration: 19, delay: 4, color: 'text-sky-500/20 dark:text-sky-400/30' },
  { Icon: CreditCard, size: 24, top: '8%', left: '75%', duration: 15, delay: 2.5, color: 'text-emerald-500/20 dark:text-emerald-400/30' },
  { Icon: Cpu, size: 20, top: '50%', left: '82%', duration: 21, delay: 1.2, color: 'text-indigo-500/15 dark:text-indigo-400/25' },
  { Icon: Smartphone, size: 22, top: '30%', left: '18%', duration: 17, delay: 3.5, color: 'text-purple-500/20 dark:text-purple-400/30' },
  { Icon: Layout, size: 24, top: '65%', left: '88%', duration: 24, delay: 0.8, color: 'text-pink-500/15 dark:text-pink-400/25' },
  { Icon: CheckCircle2, size: 18, top: '78%', left: '42%', duration: 11, delay: 5, color: 'text-teal-500/20 dark:text-teal-400/30' },
  { Icon: Terminal, size: 20, top: '92%', left: '68%', duration: 16, delay: 2.2, color: 'text-violet-500/20 dark:text-violet-400/30' },
  { Icon: Activity, size: 22, top: '5%', left: '35%', duration: 13, delay: 1.8, color: 'text-rose-500/15 dark:text-rose-400/25' },
  { Icon: MessageSquare, size: 18, top: '18%', left: '52%', duration: 15, delay: 4.1, color: 'text-blue-500/15 dark:text-blue-400/25' }
];

const LIVE_FEED_TRANSACTIONS = [
  "🛒 Ikeja: New sale recorded • ₦18,500.00",
  "📦 Abuja: Inventory synced • 140 units",
  "⚡ Lekki: Auto-restock triggered for Category A",
  "💳 PH Hub: Retail invoice generated",
  "🌱 Mega Pro: Sustainability score of 85 verified",
  "📈 Jumia Mall: Multi-channel stock updated",
  "🛒 Kano: Walk-in customer checked out • ₦42,000.00",
  "📦 Lagos Main: Received batch from Supplier A",
];

const LandingPage: React.FC<LandingPageProps> = ({ 
  isLoggedIn, 
  isAppInstalled, 
  language,
  onLanguageChange,
  onAuth, 
  onNavigateInfo, 
  onInstall, 
  onEnterTerminal 
}) => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{role: 'user' | 'bot', text: string}[]>([
    { role: 'bot', text: 'Hello! I am StockBot. How can I help you manage your shop today?' }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [feedIndex, setFeedIndex] = useState(0);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const architectureRef = useRef<HTMLElement>(null);
  const langRef = useRef<HTMLDivElement>(null);
  const isMounted = useRef(true);

  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  useEffect(() => {
    const feedInterval = setInterval(() => {
      setFeedIndex((prev) => (prev + 1) % LIVE_FEED_TRANSACTIONS.length);
    }, 4000);
    return () => clearInterval(feedInterval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(event.target as Node)) {
        setIsLangOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  const scrollToSection = (ref: React.RefObject<HTMLElement | null>) => {
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
      const systemInstruction = `You are StockBot, the official industrial-grade retail consultant for StockBit Pro, powered by Alibaba Qwen Plus. 
      Technical Context for you:
      1. APP REGISTRATION: Users sign up with Name, Business Name, Email, and Password. We do NOT ask for a Phone Number on the signup form. Staff join via an "Invite ID" from their boss.
      2. CORE TOOLS: 
         - "Strict Sensor": Advanced mobile barcode scanning.
         - "Smart Extractor": Gemini-powered metadata capture from product photos.
         - "Multi-Channel Bridge": Syncing inventory with Jumia Mall and Konga.
         - "Sustainability Audit": Only on Mega Pro, gives Eco-scores to inventory.
      3. BUSINESS MODEL: 2 Months (60 days) free trial. Plans: Beta (₦5k), Mega (₦8k), Mega Pro (₦13k). Payments via Paystack.
      4. MARKET: Nigerian retailers (Lagos, Abuja, PH, etc.). Currency is Naira (₦).
      5. CONTACT SUPPORT: 07010698264 for calls, 07072127949 for WhatsApp.
      
      Always be professional, concise, and accurate to these specific app features. Do not hallucinate non-existent features or requirements. Currently responding in ${language} mode.`;

      const botText = await callQwenPlus([
        { role: 'system', content: systemInstruction },
        { role: 'user', content: userMsg }
      ], "I'm having trouble connecting. Please call our support line directly at 07010698264.");
      
      if (isMounted.current) {
        setChatMessages(prev => [...prev, { role: 'bot', text: botText }]);
      }
    } catch (error: any) {
      console.error("StockBot Call Failed:", error);
      if (isMounted.current) {
        const errorText = "Service is temporarily unavailable. Please call our direct helpline 07010698264 for immediate business support.";
        setChatMessages(prev => [...prev, { role: 'bot', text: errorText }]);
      }
    } finally {
      if (isMounted.current) {
        setIsTyping(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-sans selection:bg-indigo-500 selection:text-white transition-colors duration-300 overflow-x-hidden flex flex-col">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-[100] bg-white/90 dark:bg-slate-950/90 backdrop-blur-2xl border-b border-slate-100 dark:border-slate-800 pt-[env(safe-area-inset-top)] box-content h-16 md:h-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/30 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <Box size={22} className="text-white" />
            </div>
            <span className="font-bold text-sm md:text-xl tracking-tight text-slate-900 dark:text-white cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>StockBit Pro</span>
          </div>
          
          <div className="hidden lg:flex items-center gap-10">
            <NavOption label={t.inventory} onClick={() => scrollToSection(architectureRef)} />
            <NavOption label={t.about_us} onClick={() => onNavigateInfo(View.AboutUs)} />
            <NavOption label={t.help_center} onClick={() => onNavigateInfo(View.HelpCenter)} />
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <div className="relative" ref={langRef}>
              <button 
                onClick={() => setIsLangOpen(!isLangOpen)}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all shadow-sm"
              >
                <Languages size={14} className="text-indigo-600" />
                <span className="hidden xs:inline">{language}</span>
                <ChevronDown size={12} className={`transition-transform duration-300 ${isLangOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {isLangOpen && (
                <div className="absolute top-full right-0 mt-2 w-40 bg-white dark:bg-slate-900 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.20)] border border-slate-100 dark:border-slate-800 overflow-hidden animate-in fade-in slide-in-from-top-2 z-[110]">
                  {(['en', 'yo', 'ha', 'ig'] as AppLanguage[]).map((lang) => (
                    <button
                      key={lang}
                      onClick={() => { onLanguageChange(lang); setIsLangOpen(false); }}
                      className={`w-full px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors ${language === lang ? 'text-indigo-600 bg-indigo-50/50' : 'text-slate-500 dark:text-slate-400'}`}
                    >
                      {TRANSLATIONS[language][`lang_${lang}`] || lang}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {!isAppInstalled && (
              <button 
                onClick={onInstall}
                className="hidden sm:flex items-center gap-2 px-4 py-2.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-xl text-[10px] font-bold uppercase tracking-wider active:scale-95 transition-all border border-indigo-100 dark:border-indigo-900/30"
              >
                <DownloadCloud size={14} /> {t.get_app}
              </button>
            )}
            
            {isLoggedIn ? (
              <button onClick={onEnterTerminal} className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider shadow-lg shadow-indigo-600/20 active:scale-95 transition-all flex items-center gap-2">
                <Layout size={14} /> <span className="hidden xs:inline">{t.dashboard}</span>
              </button>
            ) : (
              <div className="flex items-center gap-1">
                <button onClick={() => onAuth('login')} className="px-4 py-2.5 text-slate-500 dark:text-slate-400 hover:text-indigo-600 font-bold uppercase text-[10px] tracking-wider transition-all">
                  {t.login}
                </button>
                <button onClick={() => onAuth('register')} className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider shadow-lg shadow-indigo-600/20 active:scale-95 transition-all">
                  {t.start}
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-28 md:pt-48 pb-20 px-4 sm:px-8 min-h-[90vh] flex items-center overflow-hidden">
        {/* Floating Particles and Ambient Blurs background layer */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 select-none">
          {/* Ambient blur gradients */}
          <motion.div 
            animate={{ x: [0, 45, 0], y: [0, -35, 0] }}
            transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1/4 left-1/12 w-[30rem] h-[30rem] bg-indigo-500/5 dark:bg-indigo-500/10 blur-[120px] rounded-full" 
          />
          <motion.div 
            animate={{ x: [0, -45, 0], y: [0, 35, 0] }}
            transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-1/4 right-1/12 w-[35rem] h-[35rem] bg-emerald-500/5 dark:bg-emerald-500/5 blur-[140px] rounded-full" 
          />
          
          {/* Retail Floating Particles */}
          {FLOATING_PARTICLES.map((p, idx) => {
            const IconComponent = p.Icon;
            return (
              <motion.div
                key={idx}
                initial={{ y: 0, x: 0, scale: 0.8, opacity: 0.05, rotate: 0 }}
                animate={{ 
                  y: [0, -40, 0],
                  x: [0, idx % 2 === 0 ? 30 : -30, 0],
                  scale: [0.8, 1.15, 0.8],
                  rotate: [0, idx % 2 === 0 ? 360 : -360],
                  opacity: [0.12, 0.35, 0.12]
                }}
                transition={{ 
                  duration: p.duration, 
                  delay: p.delay, 
                  repeat: Infinity, 
                  ease: "easeInOut" 
                }}
                style={{
                  position: 'absolute',
                  top: p.top,
                  left: p.left,
                }}
                className={`hidden sm:block ${p.color || 'text-indigo-600 dark:text-indigo-400'} filter drop-shadow-[0_0_12px_rgba(99,102,241,0.12)]`}
              >
                <IconComponent size={p.size} />
              </motion.div>
            );
          })}
        </div>

        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center relative z-10 w-full">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="space-y-8 md:space-y-12 text-left w-full"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-50/50 dark:bg-indigo-900/20 rounded-full border border-indigo-100 dark:border-indigo-900/30"
            >
              <Sparkles size={14} className="text-indigo-600 dark:text-indigo-400" />
              <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">{t.smart_biz}</span>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="space-y-4 w-full"
            >
              <h1 className="text-[clamp(2.2rem,8vw,3.5rem)] md:text-[clamp(3rem,6vw,5rem)] font-bold tracking-tight leading-[1.1] text-slate-900 dark:text-white text-balance">
                {t.hero_title_1} <span className="text-indigo-600">{t.hero_title_2}</span>
              </h1>
            </motion.div>
            
            <motion.p 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="max-w-xl text-base md:text-lg text-slate-500 dark:text-slate-400 font-normal leading-relaxed"
            >
              {t.hero_subtitle}
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="pt-4 pr-2 space-y-4"
            >
              <div className="flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={isLoggedIn ? onEnterTerminal : () => onAuth('register')}
                  className="w-full md:w-auto px-10 md:px-12 py-4 md:py-5 bg-indigo-600 text-white rounded-2xl font-bold uppercase text-[11px] md:text-[12px] tracking-wider shadow-xl shadow-indigo-600/20 active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                  {t.hero_cta} <ArrowRight size={18} />
                </button>
                <button 
                  onClick={() => scrollToSection(architectureRef)}
                  className="w-full md:w-auto px-10 md:px-12 py-4 md:py-5 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-2xl font-bold uppercase text-[11px] md:text-[12px] tracking-wider active:scale-95 transition-all flex items-center justify-center gap-3 border border-slate-200 dark:border-slate-800"
                >
                  {t.see_how}
                </button>
              </div>
              
              <div className="flex flex-col sm:flex-row items-center gap-6">
                {!isAppInstalled && (
                  <button 
                    onClick={onInstall}
                    className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-white dark:bg-slate-900 text-indigo-600 rounded-2xl text-[10px] font-black uppercase tracking-widest border-2 border-indigo-100 dark:border-indigo-900/30 hover:bg-indigo-50 dark:hover:bg-indigo-950 transition-all shadow-sm group"
                  >
                    <div className="p-1 bg-indigo-100 dark:bg-indigo-900 rounded-lg group-hover:scale-110 transition-transform">
                      <DownloadCloud size={18} />
                    </div>
                    {t.install_app}
                  </button>
                )}
                {!isLoggedIn && (
                  <button 
                    onClick={() => onAuth('login')}
                    className="flex items-center gap-2 text-slate-400 hover:text-indigo-600 font-black uppercase text-[11px] tracking-widest transition-colors py-2"
                  >
                    <LogIn size={16} /> Already have a shop? {t.login}
                  </button>
                )}
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="flex flex-col xs:flex-row items-start xs:items-center gap-6 md:gap-8 pt-10 border-t border-slate-100 dark:border-slate-800"
            >
              <div className="flex -space-x-3 shrink-0">
                {[1,2,3,4].map(i => (
                  <div key={i} className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-slate-100 dark:bg-slate-800 border-4 border-white dark:border-slate-950 flex items-center justify-center overflow-hidden shadow-sm">
                    <img src={`https://i.pravatar.cc/150?u=stockbit_user_${i}`} alt="User" />
                  </div>
                ))}
              </div>
              <div className="flex flex-col min-w-0">
                <p className="text-[13px] font-black uppercase text-slate-900 dark:text-white leading-none mb-1">PROUDLY NIGERIAN</p>
                <p className="text-[9px] md:text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 tracking-widest truncate">TRUSTED BY 500+ SHOP OWNERS ACROSS NIGERIA</p>
              </div>
            </motion.div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 40, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
            className="relative group hidden lg:block pr-8"
          >
            <div className="absolute inset-0 bg-indigo-600/5 rounded-[5rem] rotate-3 scale-105 group-hover:rotate-6 transition-transform duration-1000"></div>
            <div className="relative bg-white dark:bg-slate-900 rounded-[5rem] p-5 border border-slate-100 dark:border-slate-800 shadow-2xl overflow-hidden aspect-[4/3]">
              <img 
                src="https://images.unsplash.com/photo-1556742044-3c52d6e88c62?auto=format&fit=crop&q=80&w=1200" 
                alt="StockBit Shop Dashboard" 
                className="w-full h-full object-cover rounded-[4rem] opacity-95 transition-transform duration-[2s] group-hover:scale-105"
                loading="eager"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-indigo-600/20 to-transparent"></div>
              
              {/* Simulated Live Ledger Feed Overlay */}
              <motion.div 
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                className="absolute top-8 right-8 p-4 bg-slate-950/90 backdrop-blur-xl rounded-[1.8rem] border border-white/10 shadow-2xl w-72 pointer-events-none select-none"
              >
                 <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-indigo-500/20 text-indigo-400 rounded-xl flex items-center justify-center shrink-0">
                       <Activity size={16} className="animate-pulse" />
                    </div>
                    <div className="min-w-0 flex-1">
                       <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-1.5 leading-none mb-1">
                         <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                         LIVE TERMINAL FEED
                       </p>
                       <AnimatePresence mode="wait">
                         <motion.p 
                           key={feedIndex}
                           initial={{ opacity: 0, y: 5 }}
                           animate={{ opacity: 1, y: 0 }}
                           exit={{ opacity: 0, y: -5 }}
                           transition={{ duration: 0.3 }}
                           className="text-[10px] font-bold text-white mt-0.5 leading-normal uppercase truncate"
                         >
                           {LIVE_FEED_TRANSACTIONS[feedIndex]}
                         </motion.p>
                       </AnimatePresence>
                    </div>
                 </div>
              </motion.div>

              <motion.div 
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute bottom-10 left-10 p-6 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-[2rem] shadow-2xl"
              >
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white">
                       <TrendingUp size={24} />
                    </div>
                    <div>
                       <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">{t.total_money}</p>
                       <p className="text-xl font-black text-slate-900 dark:text-white">₦245,800.00</p>
                    </div>
                 </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Visual Benefits Section */}
      <section ref={architectureRef} className="py-24 md:py-32 px-6 bg-slate-50 dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto space-y-24">
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <h2 className="text-[11px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.4em]">{t.professional_grade}</h2>
            <h3 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">{t.everything_needs}</h3>
            <p className="text-base md:text-lg text-slate-500 dark:text-slate-400 font-medium">{t.simple_powerful}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
            <FeatureImageCard 
              image="https://images.unsplash.com/photo-1556740758-90de374c12ad?auto=format&fit=crop&q=80&w=800"
              title={t.sales}
              desc={t.fast_sales_desc || "Record sales in seconds. Print professional receipts for customers instantly."}
              icon={<ShoppingCart size={20} />}
            />
            <FeatureImageCard 
              image="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=800"
              title={t.inventory}
              desc={t.smart_inv_desc || "Know exactly what is in your shop. Get alerts when stock is running low."}
              icon={<Box size={20} />}
            />
            <FeatureImageCard 
              image="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=800"
              title={t.reports}
              desc={t.biz_insights_desc || "See your profit and loss at a glance. Make better decisions with AI reports."}
              icon={<BarChart3 size={20} />}
            />
          </div>
        </div>
      </section>

      {/* Trust Section - Nigerian Market Focus */}
      <section className="py-24 md:py-32 px-6 bg-white dark:bg-slate-950 overflow-hidden">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-20 items-center">
          <div className="space-y-12">
            <div className="space-y-6">
              <h2 className="text-[11px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.4em]">{t.built_for_nigeria}</h2>
              <h3 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-[0.95]">
                {t.manage_anywhere}
              </h3>
              <p className="text-lg text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                {t.nigeria_desc}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <BenefitItem 
                title={t.staff_acc} 
                desc={t.staff_acc_desc} 
                icon={<Users className="text-indigo-600" />} 
              />
              <BenefitItem 
                title={t.secure_pay} 
                desc={t.secure_pay_desc} 
                icon={<CreditCard className="text-emerald-600" />} 
              />
              <BenefitItem 
                title={t.phone_scan} 
                desc={t.phone_scan_desc} 
                icon={<Smartphone className="text-amber-600" />} 
              />
              <BenefitItem 
                title={t.cloud_backup} 
                desc={t.cloud_backup_desc} 
                icon={<Database className="text-indigo-600" />} 
              />
            </div>

            <button onClick={() => onAuth('register')} className="inline-flex items-center gap-4 text-[12px] font-black uppercase tracking-[0.3em] text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 transition-all py-4 group">
              START YOUR 60-DAY TRIAL <ArrowRight size={18} className="transition-transform group-hover:translate-x-2" />
            </button>
          </div>

          <div className="relative group">
            <div className="bg-slate-100 dark:bg-slate-900 rounded-[5rem] overflow-hidden aspect-[4/5] shadow-2xl relative">
              <img 
                src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=1000" 
                alt="Nigerian Retail Excellence" 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[3s]"
              />
              <div className="absolute inset-0 bg-indigo-900/20"></div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] bg-white dark:bg-slate-800 p-8 rounded-[3rem] shadow-[0_50px_100px_rgba(0,0,0,0.15)] space-y-6">
                 <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Inventory Status</span>
                    <Activity size={18} className="text-indigo-600 animate-pulse" />
                 </div>
                 <div className="space-y-4">
                    <div className="flex justify-between items-center">
                       <span className="text-sm font-black text-slate-900 dark:text-white uppercase">INDOMIE NOODLES</span>
                       <span className="text-sm font-black text-emerald-600 uppercase">120 PKTS</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                       <div className="h-full bg-emerald-500 w-[80%]"></div>
                    </div>
                 </div>
                 <div className="space-y-4">
                    <div className="flex justify-between items-center">
                       <span className="text-sm font-black text-slate-900 dark:text-white uppercase">DANEO MILK 400G</span>
                       <span className="text-sm font-black text-rose-500 uppercase">4 UNITS LEFT</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                       <div className="h-full bg-rose-500 w-[15%]"></div>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-6 bg-[#4f46e5] relative overflow-hidden">
        <div className="max-w-4xl mx-auto text-center space-y-12 relative z-10">
          <h2 className="text-4xl md:text-7xl font-black text-white uppercase tracking-tighter leading-none">
            {t.ready_grow}
          </h2>
          <p className="text-white/80 text-base md:text-lg font-medium max-w-xl mx-auto leading-relaxed">
            {t.join_hundreds}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-6">
            <button onClick={() => onAuth('register')} className="w-full sm:w-auto px-16 py-8 bg-white text-indigo-600 rounded-[2.5rem] font-black uppercase text-[12px] tracking-[0.3em] shadow-2xl active:scale-95 transition-all">
              {t.create_account}
            </button>
            {!isAppInstalled && (
              <button onClick={onInstall} className="w-full sm:w-auto px-16 py-8 bg-indigo-800/40 text-white rounded-[2.5rem] font-black uppercase text-[12px] tracking-[0.3em] backdrop-blur-xl border border-white/10 active:scale-95 transition-all">
                {t.download_app}
              </button>
            )}
          </div>
        </div>
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <Database className="w-full h-full scale-150 rotate-12 text-white" />
        </div>
      </section>

      {/* Footer */}
      <footer className="py-24 px-6 bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 lg:gap-24">
          <div className="space-y-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/30">
                <Box size={22} className="text-white" />
              </div>
              <span className="font-black text-xl tracking-tighter uppercase dark:text-white">StockBit Pro</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold leading-relaxed uppercase tracking-widest">
              The professional operating system for the modern Nigerian retailer.
            </p>
            <div className="flex items-center gap-5">
              <SocialIcon icon={<Twitter size={20}/>} onClick={() => window.open('https://twitter.com/stockbit', '_blank')} />
              {!isAppInstalled && <SocialIcon icon={<Smartphone size={20}/>} onClick={onInstall} />}
            </div>
          </div>

          <FooterSection title="PRODUCTS" links={[
            { label: t.inventory, onClick: () => scrollToSection(architectureRef) },
            { label: t.sales, onClick: () => scrollToSection(architectureRef) },
            { label: 'Marketplace Sync', onClick: () => scrollToSection(architectureRef) },
            ...(!isAppInstalled ? [{ label: 'PWA Mobile App', onClick: onInstall }] : []),
          ]} />

          <FooterSection title="RESOURCES" links={[
            { label: t.about_us, onClick: () => onNavigateInfo(View.AboutUs) },
            { label: t.help_center, onClick: () => onNavigateInfo(View.HelpCenter) },
            { label: 'Terms & Privacy', onClick: () => onNavigateInfo(View.TermsOfService) },
            { label: 'Dashboard', onClick: onEnterTerminal },
          ]} />

          <div className="space-y-10">
            <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-900 dark:text-white">DIRECT SUPPORT</h4>
            <div className="space-y-6">
              <ContactLink icon={<Phone size={16} />} label="24/7 Helpline" value="07010698264" onClick={() => window.open('tel:07010698264')} />
              <ContactLink icon={<MessageCircle size={16} />} label="WhatsApp Concierge" value="07072127949" onClick={() => window.open('https://wa.me/2347072127949')} />
            </div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto pt-20 mt-20 border-t border-slate-100 dark:border-slate-800 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.6em] text-slate-400 dark:text-slate-600">© 2025 STOCKBIT TECHNOLOGIES NIGERIA. ALL RIGHTS RESERVED.</p>
        </div>
      </footer>

      {/* Floating AI ChatBot Bubble */}
      <div className="fixed bottom-6 right-6 md:bottom-10 md:right-10 z-[100]">
        <button 
          onClick={() => setIsChatOpen(!isChatOpen)}
          className={`w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center shadow-2xl transition-all duration-500 relative ${isChatOpen ? 'bg-slate-900 text-white rotate-90 scale-110' : 'bg-indigo-600 text-white hover:scale-110'}`}
        >
          {isChatOpen ? <X size={24} className="md:w-7 md:h-7" /> : <MessageSquare size={24} className="md:w-7 md:h-7" />}
          {!isChatOpen && <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 bg-emerald-500 border-4 border-white rounded-full"></span>}
        </button>
        
        {isChatOpen && (
          <div className="absolute bottom-18 md:bottom-20 right-0 w-[280px] xs:w-[320px] sm:w-[380px] md:w-[420px] h-[460px] sm:h-[520px] bg-white dark:bg-slate-900 rounded-[2rem] sm:rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.35)] border border-slate-100 dark:border-slate-800/80 flex flex-col overflow-hidden animate-in slide-in-from-bottom-6 fade-in duration-300 z-[150]">
            <div className="p-4 sm:p-6 bg-slate-900 dark:bg-slate-950 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-8 h-8 sm:w-11 sm:h-11 bg-indigo-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg">
                  <Sparkles size={18} className="sm:w-5 sm:h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-[11px] sm:text-xs font-black uppercase tracking-widest leading-none">STOCKBOT AI</h3>
                  <p className="text-[7px] sm:text-[9px] font-bold uppercase opacity-60 mt-1">NIGERIA SHOP ASSISTANT</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-800/50 dark:bg-slate-900/50 px-2.5 py-1 rounded-full border border-slate-700/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-[8px] sm:text-[10px] font-black text-slate-300 uppercase tracking-wider">ONLINE</span>
              </div>
            </div>

            <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 scrollbar-hide bg-slate-50/50 dark:bg-slate-950/20">
              {chatMessages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
                  <div className={`max-w-[85%] p-3.5 sm:p-4 rounded-[1.2rem] sm:rounded-[1.5rem] text-[11px] sm:text-xs font-semibold leading-relaxed shadow-sm ${
                    m.role === 'user' 
                    ? 'bg-indigo-600 text-white rounded-tr-none' 
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-tl-none border border-slate-100 dark:border-slate-800/80'
                  }`}>
                    {m.text}
                  </div>
                </div>
              ))}
              
              {chatMessages.length === 1 && (
                <div className="pt-2 flex flex-col gap-2">
                  <p className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider mb-1">Common Questions:</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      "What is StockBit Pro?",
                      "How long is the free trial?",
                      "Is barcode scanning supported?",
                      "Show support contact"
                    ].map((promptText, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setChatInput(promptText)}
                        className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-slate-600 dark:text-slate-300 text-[10px] font-bold rounded-xl border border-slate-200/50 dark:border-slate-800 transition-all shadow-sm cursor-pointer"
                      >
                        {promptText}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white dark:bg-slate-800 px-4 py-3 rounded-[1.2rem] rounded-tl-none border border-slate-100 dark:border-slate-800 shadow-sm flex gap-1 items-center">
                    <span className="w-1.5 h-1.5 bg-indigo-600 dark:bg-indigo-400 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-indigo-600 dark:bg-indigo-400 rounded-full animate-bounce [animation-delay:0.15s]"></span>
                    <span className="w-1.5 h-1.5 bg-indigo-600 dark:bg-indigo-400 rounded-full animate-bounce [animation-delay:0.3s]"></span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 shrink-0">
              <div className="relative flex items-center">
                <input 
                  type="text" 
                  placeholder="Ask StockBot a question..." 
                  className="w-full pl-5 pr-12 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800/50 rounded-xl text-xs font-semibold normal-case tracking-normal outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 text-slate-900 dark:text-white"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                />
                <button 
                  type="submit"
                  disabled={!chatInput.trim() || isTyping}
                  className="absolute right-1.5 w-8 h-8 bg-slate-900 dark:bg-indigo-600 text-white rounded-lg flex items-center justify-center hover:bg-indigo-600 dark:hover:bg-indigo-500 transition-all disabled:opacity-20 active:scale-90"
                >
                  <Send size={14} />
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

const FeatureImageCard = ({ image, title, desc, icon }: any) => (
  <motion.div 
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-50px" }}
    transition={{ duration: 0.6 }}
    className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group overflow-hidden"
  >
     <div className="h-48 overflow-hidden relative">
        <img src={image} alt={title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
        <div className="absolute inset-0 bg-indigo-600/10"></div>
        <div className="absolute bottom-4 left-4 p-3 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md rounded-xl text-indigo-600 dark:text-indigo-400 shadow-xl">
           {icon}
        </div>
     </div>
     <div className="p-10 space-y-3">
        <h4 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">{title}</h4>
        <p className="text-[12px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{desc}</p>
     </div>
  </motion.div>
);

const BenefitItem = ({ title, desc, icon }: any) => (
  <motion.div 
    initial={{ opacity: 0, x: -15 }}
    whileInView={{ opacity: 1, x: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5 }}
    className="flex items-start gap-4 group"
  >
    <div className="w-10 h-10 bg-slate-50 dark:bg-slate-900 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
      {icon}
    </div>
    <div>
      <h5 className="text-[12px] font-black uppercase text-slate-900 dark:text-white tracking-tight">{title}</h5>
      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold leading-relaxed">{desc}</p>
    </div>
  </motion.div>
);

const SocialIcon = ({ icon, onClick }: any) => (
  <button onClick={onClick} className="w-11 h-11 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-slate-900 dark:bg-indigo-950 text-slate-500 hover:text-white hover:bg-indigo-600 transition-all flex items-center justify-center border border-white/5 dark:border-white/10 active:scale-90 shadow-md">
    {icon}
  </button>
);

const FooterSection = ({ title, links }: any) => (
  <div className="space-y-8 md:space-y-10">
    <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-900 dark:text-white">{title}</h4>
    <ul className="space-y-4 md:space-y-5">
      {links.map((l: any, i: number) => (
        <li key={i}>
          <button onClick={l.onClick} className="text-[11px] md:text-[12px] text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 font-bold transition-all uppercase tracking-widest text-left whitespace-nowrap">{l.label}</button>
        </li>
      ))}
    </ul>
  </div>
);

const ContactLink = ({ icon, label, value, onClick }: any) => (
  <div className="flex items-center gap-4 md:gap-5 group cursor-pointer" onClick={onClick}>
    <div className="w-10 h-10 md:w-11 md:h-11 bg-slate-100 dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 rounded-lg md:rounded-xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all shrink-0 shadow-sm">
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-[8px] md:text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mb-1.5">{label}</p>
      <p className="text-[12px] md:text-[13px] font-black text-slate-900 dark:text-white truncate tracking-tight">{value}</p>
    </div>
  </div>
);

export default LandingPage;
