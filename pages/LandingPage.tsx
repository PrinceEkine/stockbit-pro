import React, { useState, useRef, useEffect } from 'react';
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
  LogIn
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
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
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const architectureRef = useRef<HTMLElement>(null);
  const langRef = useRef<HTMLDivElement>(null);
  const isMounted = useRef(true);

  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

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
        contents: [{ role: 'user', parts: [{ text: userMsg }] }],
        config: {
          systemInstruction: `You are StockBot, the official shop assistant for StockBit Pro. Contact: 07010698264. Response language should match the user's inquiry. Currently in ${language} mode. Always be professional, helpful, and focused on shop management benefits for Nigerian market people.`,
        }
      });
      
      if (isMounted.current) {
        const botText = response.text || "I'm having trouble connecting. Please call our support line directly at 07010698264.";
        setChatMessages(prev => [...prev, { role: 'bot', text: botText }]);
      }
    } catch (error: any) {
      console.error("StockBot Call Failed:", error);
      if (isMounted.current) {
        setChatMessages(prev => [...prev, { role: 'bot', text: "Service is temporarily unavailable. Please call our direct helpline 07010698264 for immediate business support." }]);
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
      <nav className="fixed top-0 w-full z-[100] bg-white/90 backdrop-blur-2xl border-b border-slate-100 pt-[env(safe-area-inset-top)] box-content h-16 md:h-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/30 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <Box size={22} className="text-white" />
            </div>
            <span className="font-black text-sm md:text-xl tracking-tighter uppercase text-slate-900 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>StockBit Pro</span>
          </div>
          
          <div className="hidden lg:flex items-center gap-10">
            <NavOption label={t.inventory} onClick={() => scrollToSection(architectureRef)} />
            <NavOption label={t.about_us} onClick={() => onNavigateInfo(View.AboutUs)} />
            <NavOption label={t.help_center} onClick={() => onNavigateInfo(View.HelpCenter)} />
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            {/* Language Switcher */}
            <div className="relative" ref={langRef}>
              <button 
                onClick={() => setIsLangOpen(!isLangOpen)}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-100 transition-all shadow-sm"
              >
                <Languages size={14} className="text-indigo-600" />
                <span className="hidden xs:inline">{language}</span>
                <ChevronDown size={12} className={`transition-transform duration-300 ${isLangOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {isLangOpen && (
                <div className="absolute top-full right-0 mt-2 w-40 bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.20)] border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-top-2 z-[110]">
                  {(['en', 'yo', 'ha', 'ig'] as AppLanguage[]).map((lang) => (
                    <button
                      key={lang}
                      onClick={() => { onLanguageChange(lang); setIsLangOpen(false); }}
                      className={`w-full px-4 py-3.5 text-left text-[10px] font-black uppercase tracking-widest hover:bg-indigo-50 transition-colors ${language === lang ? 'text-indigo-600 bg-indigo-50/50' : 'text-slate-500'}`}
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
                className="hidden sm:flex items-center gap-2 px-4 py-2.5 bg-indigo-50 text-indigo-600 rounded-2xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all border border-indigo-100"
              >
                <DownloadCloud size={14} /> {t.get_app}
              </button>
            )}
            
            {isLoggedIn ? (
              <button onClick={onEnterTerminal} className="px-4 md:px-5 py-2.5 bg-[#4f46e5] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all flex items-center gap-2">
                <Terminal size={14} /> <span className="hidden xs:inline">{t.dashboard}</span>
              </button>
            ) : (
              <div className="flex items-center gap-1">
                <button onClick={() => onAuth('login')} className="px-3 md:px-5 py-2.5 text-slate-500 hover:text-indigo-600 font-black uppercase text-[10px] tracking-widest transition-all">
                  {t.login}
                </button>
                <button onClick={() => onAuth('register')} className="px-5 md:px-6 py-2.5 bg-[#4f46e5] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all">
                  {t.start}
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-28 md:pt-48 pb-20 px-4 sm:px-8 min-h-[90vh] flex items-center overflow-hidden">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center relative z-10 w-full">
          <div className="space-y-8 md:space-y-12 text-left w-full">
            <div className="inline-flex items-center gap-3 px-5 py-2 bg-indigo-50/50 rounded-full border border-indigo-100">
              <Sparkles size={14} className="text-indigo-600" />
              <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em]">{t.smart_biz}</span>
            </div>
            
            <div className="space-y-4 w-full">
              <h1 className="text-[clamp(2.5rem,10vw,4rem)] md:text-[clamp(3.5rem,7vw,5.5rem)] font-black tracking-tight leading-[1.1] uppercase text-slate-900 drop-shadow-sm text-balance">
                {t.hero_title_1} <span className="text-indigo-600">{t.hero_title_2}</span>
              </h1>
            </div>
            
            <p className="max-w-xl text-base md:text-lg text-slate-600 font-medium leading-relaxed">
              {t.hero_subtitle}
            </p>

            <div className="pt-4 pr-2 space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={isLoggedIn ? onEnterTerminal : () => onAuth('register')}
                  className="w-full md:w-auto px-10 md:px-16 py-5 md:py-6 bg-[#4f46e5] text-white rounded-[1.5rem] md:rounded-[2rem] font-black uppercase text-[11px] md:text-[12px] tracking-[0.2em] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-4"
                >
                  {t.hero_cta} <ArrowRight size={20} />
                </button>
                <button 
                  onClick={() => scrollToSection(architectureRef)}
                  className="w-full md:w-auto px-10 md:px-16 py-5 md:py-6 bg-slate-100 text-slate-900 rounded-[1.5rem] md:rounded-[2rem] font-black uppercase text-[11px] md:text-[12px] tracking-[0.2em] active:scale-95 transition-all flex items-center justify-center gap-4 border border-slate-200"
                >
                  {t.see_how}
                </button>
              </div>
              
              <div className="flex flex-col sm:flex-row items-center gap-6">
                {!isAppInstalled && (
                  <button 
                    onClick={onInstall}
                    className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-white text-indigo-600 rounded-2xl text-[10px] font-black uppercase tracking-widest border-2 border-indigo-100 hover:bg-indigo-50 transition-all shadow-sm group"
                  >
                    <div className="p-1 bg-indigo-100 rounded-lg group-hover:scale-110 transition-transform">
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
            </div>

            <div className="flex flex-col xs:flex-row items-start xs:items-center gap-6 md:gap-8 pt-10 border-t border-slate-100">
              <div className="flex -space-x-3 shrink-0">
                {[1,2,3,4].map(i => (
                  <div key={i} className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-slate-100 border-4 border-white flex items-center justify-center overflow-hidden shadow-sm">
                    <img src={`https://i.pravatar.cc/150?u=stockbit_user_${i}`} alt="User" />
                  </div>
                ))}
              </div>
              <div className="flex flex-col min-w-0">
                <p className="text-[13px] font-black uppercase text-slate-900 leading-none mb-1">PROUDLY NIGERIAN</p>
                <p className="text-[9px] md:text-[10px] font-bold uppercase text-slate-500 tracking-widest truncate">TRUSTED BY 500+ SHOP OWNERS ACROSS NIGERIA</p>
              </div>
            </div>
          </div>

          <div className="relative group hidden lg:block pr-8">
            <div className="absolute inset-0 bg-indigo-600/5 rounded-[5rem] rotate-3 scale-105 group-hover:rotate-6 transition-transform duration-1000"></div>
            <div className="relative bg-white rounded-[5rem] p-5 border border-slate-100 shadow-2xl overflow-hidden aspect-[4/3]">
              <img 
                src="https://images.unsplash.com/photo-1556742044-3c52d6e88c62?auto=format&fit=crop&q=80&w=1200" 
                alt="StockBit Shop Dashboard" 
                className="w-full h-full object-cover rounded-[4rem] opacity-95 transition-transform duration-[2s] group-hover:scale-105"
                loading="eager"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-indigo-600/20 to-transparent"></div>
              {/* Overlay Badge */}
              <div className="absolute bottom-10 left-10 p-6 bg-white/90 backdrop-blur-xl rounded-[2rem] shadow-2xl animate-bounce-slow">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white">
                       <TrendingUp size={24} />
                    </div>
                    <div>
                       <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">{t.total_money}</p>
                       <p className="text-xl font-black text-slate-900">₦245,800.00</p>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Visual Benefits Section */}
      <section ref={architectureRef} className="py-24 md:py-32 px-6 bg-slate-50">
        <div className="max-w-7xl mx-auto space-y-24">
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <h2 className="text-[11px] font-black text-indigo-600 uppercase tracking-[0.4em]">{t.professional_grade}</h2>
            <h3 className="text-4xl md:text-5xl font-black text-slate-900 uppercase tracking-tighter leading-none">{t.everything_needs}</h3>
            <p className="text-base md:text-lg text-slate-500 font-medium">{t.simple_powerful}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-10">
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
      <section className="py-24 md:py-32 px-6 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-20 items-center">
          <div className="space-y-12">
            <div className="space-y-6">
              <h2 className="text-[11px] font-black text-indigo-600 uppercase tracking-[0.4em]">{t.built_for_nigeria}</h2>
              <h3 className="text-4xl md:text-5xl font-black text-slate-900 uppercase tracking-tighter leading-[0.95]">
                {t.manage_anywhere}
              </h3>
              <p className="text-lg text-slate-600 font-medium leading-relaxed">
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

            <button onClick={() => onAuth('register')} className="inline-flex items-center gap-4 text-[12px] font-black uppercase tracking-[0.3em] text-indigo-600 hover:text-indigo-800 transition-all py-4 group">
              START YOUR 60-DAY TRIAL <ArrowRight size={18} className="transition-transform group-hover:translate-x-2" />
            </button>
          </div>

          <div className="relative group">
            <div className="bg-slate-100 rounded-[5rem] overflow-hidden aspect-[4/5] shadow-2xl relative">
              <img 
                src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=1000" 
                alt="Nigerian Retail Excellence" 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[3s]"
              />
              <div className="absolute inset-0 bg-indigo-900/20"></div>
              {/* Floating UI Element */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] bg-white p-8 rounded-[3rem] shadow-[0_50px_100px_rgba(0,0,0,0.15)] space-y-6">
                 <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Inventory Status</span>
                    <Activity size={18} className="text-indigo-600 animate-pulse" />
                 </div>
                 <div className="space-y-4">
                    <div className="flex justify-between items-center">
                       <span className="text-sm font-black text-slate-900 uppercase">INDOMIE NOODLES</span>
                       <span className="text-sm font-black text-emerald-600">120 PKTS</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                       <div className="h-full bg-emerald-500 w-[80%]"></div>
                    </div>
                 </div>
                 <div className="space-y-4">
                    <div className="flex justify-between items-center">
                       <span className="text-sm font-black text-slate-900 uppercase">DANEO MILK 400G</span>
                       <span className="text-sm font-black text-rose-500">4 UNITS LEFT</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
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
            <Database className="w-full h-full scale-150 rotate-12" />
        </div>
      </section>

      {/* Footer */}
      <footer className="py-24 px-6 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 lg:gap-24">
          <div className="space-y-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/30">
                <Box size={22} className="text-white" />
              </div>
              <span className="font-black text-xl tracking-tighter uppercase">StockBit Pro</span>
            </div>
            <p className="text-[11px] text-slate-500 font-bold leading-relaxed uppercase tracking-widest">
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
            { label: 'PWA Mobile App', onClick: onInstall },
          ]} />

          <FooterSection title="RESOURCES" links={[
            { label: t.about_us, onClick: () => onNavigateInfo(View.AboutUs) },
            { label: t.help_center, onClick: () => onNavigateInfo(View.HelpCenter) },
            { label: 'Terms & Privacy', onClick: () => onNavigateInfo(View.TermsOfService) },
            { label: 'Launch Protocol', onClick: onEnterTerminal },
          ]} />

          <div className="space-y-10">
            <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-900">DIRECT SUPPORT</h4>
            <div className="space-y-6">
              <ContactLink icon={<Phone size={16} />} label="24/7 Helpline" value="07010698264" onClick={() => window.open('tel:07010698264')} />
              <ContactLink icon={<MessageCircle size={16} />} label="WhatsApp Concierge" value="07072127949" onClick={() => window.open('https://wa.me/2347072127949')} />
            </div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto pt-20 mt-20 border-t border-slate-100 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.6em] text-slate-400">© 2025 STOCKBIT TECHNOLOGIES NIGERIA. ALL RIGHTS RESERVED.</p>
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
          <div className="absolute bottom-24 right-0 w-[300px] xs:w-[320px] md:w-[480px] bg-white rounded-[2.5rem] md:rounded-[3rem] shadow-[0_40px_120px_rgba(0,0,0,0.25)] border border-slate-100 flex flex-col overflow-hidden animate-in slide-in-from-bottom-12 fade-in duration-500 z-[150]">
            <div className="p-6 md:p-10 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-4 md:gap-5">
                <div className="w-10 h-10 md:w-14 md:h-14 bg-indigo-600 rounded-xl md:rounded-2xl flex items-center justify-center shadow-xl">
                  <Cpu size={22} className="md:w-7 md:h-7" />
                </div>
                <div>
                  <h3 className="text-sm md:text-base font-black uppercase tracking-widest leading-none">STOCKBOT AI</h3>
                  <p className="text-[8px] md:text-[10px] font-bold uppercase opacity-60 mt-1">NIGERIA SHOP ASSISTANT</p>
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
                  placeholder="ASK ME A QUESTION..." 
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

const FeatureImageCard = ({ image, title, desc, icon }: any) => (
  <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group overflow-hidden">
     <div className="h-48 overflow-hidden relative">
        <img src={image} alt={title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
        <div className="absolute inset-0 bg-indigo-600/10"></div>
        <div className="absolute bottom-4 left-4 p-3 bg-white/90 backdrop-blur-md rounded-xl text-indigo-600 shadow-xl">
           {icon}
        </div>
     </div>
     <div className="p-10 space-y-3">
        <h4 className="text-xl font-black text-slate-900 uppercase tracking-tighter">{title}</h4>
        <p className="text-[12px] text-slate-500 font-medium leading-relaxed">{desc}</p>
     </div>
  </div>
);

const BenefitItem = ({ title, desc, icon }: any) => (
  <div className="flex items-start gap-4 group">
    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
      {icon}
    </div>
    <div>
      <h5 className="text-[12px] font-black uppercase text-slate-900 tracking-tight">{title}</h5>
      <p className="text-[10px] text-slate-500 font-bold leading-relaxed">{desc}</p>
    </div>
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