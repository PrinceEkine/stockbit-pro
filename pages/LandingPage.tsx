import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, animate, useInView, useMotionValue, useReducedMotion, useSpring, useTransform } from 'motion/react';
import {
  Box,
  Sparkles,
  Smartphone,
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
  CreditCard,
  Database,
  TrendingUp,
  Languages,
  ChevronDown,
  Layout,
  LogIn,
  Star,
  ShieldCheck,
  Check,
  Quote,
  Plus
} from 'lucide-react';
import { chatWithMuseStatus } from '../services/museService';
import { probeAiGateway } from '../services/aiClient';
import { View, AppLanguage, SubscriptionPlan } from '../types';
import { TRANSLATIONS } from '../constants/translations';
import { PLAN_ENTITLEMENTS, PLAN_PRICING, formatNaira } from '../constants/plans';

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

/* Placeholder quotes — replace with real customer testimonials before launch. */
const TESTIMONIALS = [
  {
    quote: 'I used to close shop for two days every month to count stock. Now I count on my phone in one evening — and I catch every missing carton.',
    name: 'Adaeze O.',
    detail: "Ada's Provisions · Onitsha",
    initials: 'AO',
  },
  {
    quote: 'My sales boy knows every sale is recorded. Shrinkage stopped in the first week, and my profit finally matches my bank balance.',
    name: 'Musa I.',
    detail: 'Phone accessories · Kano',
    initials: 'MI',
  },
  {
    quote: 'Payout days used to be guesswork. Now I see my profit for the day before I sleep, even when I never entered the shop.',
    name: 'Tunde B.',
    detail: 'Boutique · Lekki, Lagos',
    initials: 'TB',
  },
];

const FAQS = [
  {
    q: 'How does the 60-day free trial work?',
    a: 'Every new shop gets full access for 60 days — no card, no payment. When the trial ends, pick Entry, Business or Enterprise to keep going. Your stock, sales and staff data stays intact.',
  },
  {
    q: 'Do I need special hardware?',
    a: 'No. Any smartphone becomes a barcode scanner and a point of sale. Snap a photo of a product and StockBit fills in the name, SKU and price for you. Receipt printing works with standard Bluetooth printers.',
  },
  {
    q: 'What happens if my internet goes off?',
    a: 'Your records sync to the cloud, so nothing is lost if you lose your phone or your data runs out. The app always shows whether you are online, and your shop data stays backed up.',
  },
  {
    q: 'How do my staff join?',
    a: 'Send them your invite code. They join as staff and get the sales terminal, while you keep control of reports, pricing and billing. Entry allows 3 team members, Business 8, and Enterprise is unlimited.',
  },
  {
    q: 'How do I pay?',
    a: 'Securely with Paystack, in Naira — monthly, or annually with 2 months free. Entry is ₦5,000/month, Business ₦7,999/month, Enterprise ₦12,999/month.',
  },
  {
    q: 'How do I get help?',
    a: 'Call 07010698264 any time, chat on WhatsApp at 07072127949, or ask StockBot — the assistant on this page. Real humans, based in Nigeria.',
  },
];

const LIVE_FEED_TRANSACTIONS = [
  'Ikeja · New sale recorded · ₦18,500',
  'Abuja · Inventory synced · 140 units',
  'Lekki · Low-stock alert · Daneo Milk',
  'Port Harcourt · Receipt printed · #1042',
  'Kano · Walk-in checkout · ₦42,000',
  'Lagos Mainland · Supplier batch received',
];

const STATS = [
  { target: 60, decimals: 0, prefix: '', suffix: ' days', label: 'Free trial, no card required' },
  { target: 500, decimals: 0, prefix: '', suffix: '+', label: 'Shops run on StockBit Pro' },
  { target: 4.9, decimals: 1, prefix: '', suffix: ' / 5', label: 'Average owner rating' },
  { target: 24, decimals: 0, prefix: '', suffix: ' / 7', label: 'Nigerian support line' },
];

const PLAN_ORDER: { key: SubscriptionPlan; blurb: string; featured?: boolean }[] = [
  { key: 'beta', blurb: 'For kiosks and starting vendors.' },
  { key: 'mega', blurb: 'For growing retail stores.', featured: true },
  { key: 'mega_pro', blurb: 'For chains and large hubs.' },
];

const PLAN_FEATURES: Record<SubscriptionPlan, string[]> = {
  beta: ['Point of sale + receipts', 'Low-stock alerts', '3 team members', 'Cloud backup'],
  mega: ['Everything in Entry', '8 team members', 'Jumia + Konga sync', 'AI reports & forecasting'],
  mega_pro: ['Everything in Business', 'Unlimited team members', 'Sustainability audit', 'Multi-store + priority support'],
};

/** Number that counts up when scrolled into view (instant when reduced motion). */
const CountUp = ({ target, decimals, prefix, suffix }: { target: number; decimals: number; prefix: string; suffix: string }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const reduceMotion = useReducedMotion();
  const [display, setDisplay] = useState((0).toFixed(decimals));

  useEffect(() => {
    if (!inView) return;
    if (reduceMotion) {
      setDisplay(target.toFixed(decimals));
      return;
    }
    const controls = animate(0, target, {
      duration: 1.4,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setDisplay(v.toFixed(decimals)),
    });
    return () => controls.stop();
  }, [inView, target, decimals, reduceMotion]);

  return <span ref={ref} className="tabular-nums">{prefix}{display}{suffix}</span>;
};

const QUICK_QUESTIONS = [
  "What is StockBit Pro?",
  "How long is the free trial?",
  "Is barcode scanning supported?",
  "Show support contact"
];

/** Visitor-friendly notice for each AI gateway failure code. */
const chatNoticeFor = (code?: string): string => {
  switch (code) {
    case 'NOT_CONFIGURED':
    case 'FUNCTION_NOT_DEPLOYED':
      return 'Live AI is being set up — answering from local help for now. Call 07010698264 for urgent issues.';
    case 'MESSAGE_TOO_LONG':
      return 'That message was too long — please keep it to a few sentences and try again.';
    case 'RATE_LIMITED':
      return 'Too many messages at once — please wait a moment and try again.';
    default:
      return 'Live AI is unreachable — answering from local help. Call 07010698264 for urgent issues.';
  }
};

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
  const [chatStatus, setChatStatus] = useState<'online' | 'offline' | 'unknown'>('unknown');
  const [chatNotice, setChatNotice] = useState<string | null>(null);
  const [annualBilling, setAnnualBilling] = useState(true);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [now, setNow] = useState(() => new Date());
  const reduceMotion = useReducedMotion();
  const tiltX = useMotionValue(0);
  const tiltY = useMotionValue(0);
  const tiltRX = useSpring(useTransform(tiltY, [-0.5, 0.5], [6, -6]), { stiffness: 140, damping: 18 });
  const tiltRY = useSpring(useTransform(tiltX, [-0.5, 0.5], [-8, 8]), { stiffness: 140, damping: 18 });
  const nowLabel = `${now.toLocaleDateString('en-NG', { weekday: 'short' })} ${now.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })}`;

  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);
  const architectureRef = useRef<HTMLElement>(null);
  const pricingRef = useRef<HTMLElement>(null);
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
    const clockInterval = setInterval(() => setNow(new Date()), 15000);
    return () => clearInterval(clockInterval);
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

  // Focus the chat input when opened, let Escape close the panel, and probe
  // the AI gateway once so the status badge is honest before the first message.
  useEffect(() => {
    if (!isChatOpen) return;
    chatInputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsChatOpen(false);
    };
    document.addEventListener('keydown', onKey);
    if (chatStatus === 'unknown') {
      probeAiGateway().then((r) => {
        if (!isMounted.current) return;
        setChatStatus(r.ok ? 'online' : 'offline');
        if (!r.ok) setChatNotice(chatNoticeFor(r.code));
      });
    }
    return () => document.removeEventListener('keydown', onKey);
  }, [isChatOpen]);

  const handleHeroMouse = (e: React.MouseEvent<HTMLElement>) => {
    if (reduceMotion) return;
    const r = e.currentTarget.getBoundingClientRect();
    tiltX.set((e.clientX - r.left) / r.width - 0.5);
    tiltY.set((e.clientY - r.top) / r.height - 0.5);
  };
  const resetTilt = () => {
    tiltX.set(0);
    tiltY.set(0);
  };

  const scrollToSection = (ref: React.RefObject<HTMLElement | null>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages, isTyping, isChatOpen]);

  const sendChatMessage = async (raw: string) => {
    const userMsg = raw.trim();
    if (!userMsg || isTyping) return;

    setChatInput('');
    setChatNotice(null);
    setChatMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsTyping(true);

    try {
      const systemInstruction = `You are StockBot, the support assistant for StockBit Pro, an inventory and point-of-sale app for Nigerian retailers.
Facts: signup needs name, business name, email and password (no phone number); staff join with an invite code from their boss. 60-day free trial, no payment needed. Plans: Entry ₦5,000/mo (3 staff), Business ₦7,999/mo (8 staff, Jumia/Konga sync, AI reports), Enterprise ₦12,999/mo (unlimited staff, sustainability audit). Payments via Paystack. Phone barcode scanning and photo product capture included. Support: call 07010698264, WhatsApp 07072127949.
Be concise and professional. Never invent features or prices. Currently responding in ${language} mode.`;

      const result = await chatWithMuseStatus([
        { role: 'system', content: systemInstruction },
        { role: 'user', content: userMsg }
      ]);

      if (!isMounted.current) return;
      setChatStatus(result.source === 'ai' ? 'online' : 'offline');
      if (result.source === 'offline') {
        setChatNotice(chatNoticeFor(result.errorCode));
      }
      setChatMessages(prev => [...prev, { role: 'bot', text: result.text }]);
    } catch (error: any) {
      console.error("StockBot Call Failed:", error);
      if (isMounted.current) {
        setChatStatus('offline');
        const errorText = "Service is temporarily unavailable. Please call our direct helpline 07010698264 for immediate business support.";
        setChatMessages(prev => [...prev, { role: 'bot', text: errorText }]);
      }
    } finally {
      if (isMounted.current) {
        setIsTyping(false);
      }
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    void sendChatMessage(chatInput);
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
            <NavOption label="Pricing" onClick={() => scrollToSection(pricingRef)} />
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
      <section
        className="relative pt-28 md:pt-44 pb-16 px-4 sm:px-8 min-h-[85vh] flex items-center overflow-hidden"
        onMouseMove={handleHeroMouse}
        onMouseLeave={resetTilt}
      >
        {/* Restrained backdrop: hairline grid + single soft wash */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 select-none" aria-hidden="true">
          <div className="absolute inset-0 bg-grid [mask-image:radial-gradient(ellipse_75%_65%_at_50%_35%,black,transparent)] opacity-70 dark:opacity-40" />
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[52rem] h-[28rem] bg-indigo-500/[0.07] dark:bg-indigo-500/[0.12] blur-[110px] rounded-full" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-300/70 dark:via-slate-700/70 to-transparent" />
        </div>

        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center relative z-10 w-full">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="space-y-7 text-left w-full"
          >
            <div className="inline-flex items-center gap-2.5 pl-2 pr-4 py-1.5 bg-white dark:bg-slate-900 rounded-full border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="flex items-center gap-0.5 px-2 py-1 bg-amber-50 dark:bg-amber-500/10 rounded-full">
                {[1, 2, 3, 4, 5].map(i => <Star key={i} size={11} className="text-amber-500 fill-amber-500" />)}
              </span>
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">{t.smart_biz}</span>
            </div>

            <div className="space-y-4 w-full">
              <h1 className={language === 'en'
                ? 'font-editorial text-[clamp(2.75rem,6vw,4.6rem)] font-medium tracking-[-0.02em] leading-[1.02] text-slate-900 dark:text-white text-balance'
                : 'text-[clamp(1.9rem,5.5vw,2.75rem)] md:text-[clamp(2.4rem,4vw,3.5rem)] font-extrabold tracking-tight leading-[1.08] text-slate-900 dark:text-white text-balance'}>
                {t.hero_title_1}{' '}
                {language === 'en'
                  ? <em className="italic text-indigo-600 dark:text-indigo-400">{t.hero_title_2}</em>
                  : <span className="text-indigo-600">{t.hero_title_2}</span>}
              </h1>
            </div>

            <p className="max-w-xl text-base md:text-lg text-slate-600 dark:text-slate-400 font-normal leading-relaxed">
              {t.hero_subtitle}
            </p>

            <div className="pt-1 space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={isLoggedIn ? onEnterTerminal : () => onAuth('register')}
                  className="w-full sm:w-auto px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-semibold text-sm shadow-xl shadow-slate-900/15 dark:shadow-black/40 hover:bg-slate-800 dark:hover:bg-slate-100 active:scale-[0.98] transition-all flex items-center justify-center gap-2.5"
                >
                  {isLoggedIn ? t.dashboard : t.hero_cta} <ArrowRight size={17} />
                </button>
                <button
                  onClick={() => scrollToSection(architectureRef)}
                  className="w-full sm:w-auto px-8 py-4 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl font-semibold text-sm active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 shadow-sm"
                >
                  {t.see_how}
                </button>
              </div>

              {language === 'en' && (
                <p className="flex items-center gap-2 text-[13px] font-medium text-slate-500 dark:text-slate-400">
                  <ShieldCheck size={15} className="text-emerald-600 shrink-0" />
                  60-day free trial · No card required · Cancel anytime
                </p>
              )}

              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
                {!isAppInstalled && (
                  <button
                    onClick={onInstall}
                    className="flex items-center gap-2 text-[13px] font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors py-1"
                  >
                    <DownloadCloud size={16} /> {t.install_app}
                  </button>
                )}
                {!isLoggedIn && (
                  <button
                    onClick={() => onAuth('login')}
                    className="flex items-center gap-2 text-[13px] font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors py-1"
                  >
                    <LogIn size={16} /> {t.login}
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4 pt-6 border-t border-slate-200/80 dark:border-slate-800">
              <div className="flex -space-x-2.5 shrink-0">
                {[
                  { i: 'AO', c: 'bg-indigo-600' },
                  { i: 'MI', c: 'bg-emerald-600' },
                  { i: 'KA', c: 'bg-amber-600' },
                  { i: 'TB', c: 'bg-rose-600' },
                ].map(a => (
                  <div key={a.i} className={`w-9 h-9 rounded-full ${a.c} border-2 border-white dark:border-slate-950 flex items-center justify-center text-[10px] font-bold text-white`}>
                    {a.i}
                  </div>
                ))}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1 mb-0.5">
                  {[1, 2, 3, 4, 5].map(i => <Star key={i} size={12} className="text-amber-500 fill-amber-500" />)}
                  <span className="ml-1 text-xs font-bold text-slate-900 dark:text-white">4.9</span>
                </div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Loved by 500+ shop owners across Nigeria</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.25 }}
            className="relative hidden lg:block"
            style={{ perspective: 1400 }}
          >
           <motion.div
              style={reduceMotion ? undefined : { rotateX: tiltRX, rotateY: tiltRY, transformStyle: 'preserve-3d' }}
              className="relative"
            >
            {/* App window mockup */}
            <div className="relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-[0_32px_80px_-24px_rgba(15,23,42,0.35)] overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span className="ml-3 text-[11px] font-semibold text-slate-400 tabular-nums">{nowLabel} · Ikeja store</span>
                <span className="ml-auto flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
                </span>
              </div>

              <div className="p-6 space-y-5">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{t.total_money}</p>
                    <p className="font-editorial text-4xl text-slate-900 dark:text-white mt-1 tabular-nums">₦245,800</p>
                  </div>
                  <span className="flex items-center gap-1 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-lg">
                    <TrendingUp size={13} /> +18%
                  </span>
                </div>

                <div className="flex items-end gap-2 h-24" aria-hidden="true">
                  {[35, 55, 40, 70, 52, 88, 64].map((h, i) => (
                    <div key={i} className="flex-1 rounded-md bg-slate-100 dark:bg-slate-800 relative overflow-hidden" style={{ height: '100%' }}>
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${h}%` }}
                        transition={{ duration: 0.9, delay: 0.5 + i * 0.08, ease: 'easeOut' }}
                        className={`absolute bottom-0 inset-x-0 rounded-md ${i === 5 ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'}`}
                      />
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-3 px-4 py-3 bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 rounded-xl">
                  <Activity size={16} className="text-rose-500 shrink-0" />
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">Daneo Milk 400g · <span className="text-rose-600 dark:text-rose-400 font-bold">4 left</span> — restock suggested</p>
                </div>

                <div className="flex items-center gap-3 min-h-[20px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={feedIndex}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.3 }}
                      className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate"
                    >
                      {LIVE_FEED_TRANSACTIONS[feedIndex]}
                    </motion.p>
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Floating receipt card */}
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              style={{ z: 50 }}
              className="absolute -bottom-6 -left-8 px-5 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl shadow-2xl flex items-center gap-3"
            >
              <ShoppingCart size={18} />
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider opacity-60">Receipt #1042 printed</p>
                <p className="text-sm font-bold tabular-nums">₦42,000 · Paid</p>
              </div>
            </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Proof band */}
      <section className="border-y border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-950 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-10 py-12">
          {STATS.map((s) => (
            <div key={s.label}>
              <p className="font-editorial text-4xl text-slate-900 dark:text-white">
                <CountUp target={s.target} decimals={s.decimals} prefix={s.prefix} suffix={s.suffix} />
              </p>
              <p className="mt-1.5 text-[13px] font-medium text-slate-500 dark:text-slate-400">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Visual Benefits Section */}
      <section ref={architectureRef} className="py-20 md:py-28 px-6 bg-white dark:bg-slate-950 scroll-mt-24">
        <div className="max-w-7xl mx-auto space-y-14">
          <div className="max-w-2xl space-y-4">
            <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.2em]">{t.professional_grade}</p>
            <h2 className={language === 'en'
              ? 'font-editorial text-4xl md:text-5xl font-medium tracking-[-0.01em] text-slate-900 dark:text-white leading-[1.08]'
              : 'text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight'}>{t.everything_needs}</h2>
            <p className="text-base text-slate-600 dark:text-slate-400">{t.simple_powerful}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
            <FeatureImageCard
              index={1}
              image="https://images.unsplash.com/photo-1556740758-90de374c12ad?auto=format&fit=crop&q=80&w=800"
              title={t.sales}
              desc={t.fast_sales_desc || "Record sales in seconds. Print professional receipts for customers instantly."}
              icon={<ShoppingCart size={20} />}
            />
            <FeatureImageCard
              index={2}
              image="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=800"
              title={t.inventory}
              desc={t.smart_inv_desc || "Know exactly what is in your shop. Get alerts when stock is running low."}
              icon={<Box size={20} />}
            />
            <FeatureImageCard
              index={3}
              image="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=800"
              title={t.reports}
              desc={t.biz_insights_desc || "See your profit and loss at a glance. Make better decisions with AI reports."}
              icon={<BarChart3 size={20} />}
            />
          </div>
        </div>
      </section>

      {/* Trust Section - Nigerian Market Focus */}
      <section className="py-20 md:py-24 px-6 bg-white dark:bg-slate-950 overflow-hidden">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-10">
            <div className="space-y-5">
              <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.2em]">{t.built_for_nigeria}</p>
              <h3 className={language === 'en'
                ? 'font-editorial text-4xl md:text-5xl font-medium tracking-[-0.01em] text-slate-900 dark:text-white leading-[1.08]'
                : 'text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight'}>
                {t.manage_anywhere}
              </h3>
              <p className="text-[15px] md:text-base text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
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

      {/* Testimonials */}
      <section className="py-20 md:py-28 px-6 bg-slate-50 dark:bg-slate-900/40 border-y border-slate-200/60 dark:border-slate-800/60">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="max-w-2xl space-y-4">
            <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.2em]">Shop owners talk</p>
            <h2 className="font-editorial text-4xl md:text-5xl font-medium tracking-[-0.01em] text-slate-900 dark:text-white leading-[1.08]">
              Trusted from Onitsha to Kano.
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((tm) => (
              <figure key={tm.name} className="flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-7 shadow-sm">
                <Quote size={20} className="text-indigo-600 dark:text-indigo-400" />
                <blockquote className="mt-4 flex-1 text-[15px] leading-relaxed text-slate-700 dark:text-slate-300">
                  &ldquo;{tm.quote}&rdquo;
                </blockquote>
                <div className="mt-5 flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map(i => <Star key={i} size={12} className="text-amber-500 fill-amber-500" />)}
                </div>
                <figcaption className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3">
                  <span className="w-10 h-10 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center text-xs font-bold shrink-0">
                    {tm.initials}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-bold text-slate-900 dark:text-white">{tm.name}</span>
                    <span className="block text-xs font-medium text-slate-500 dark:text-slate-400">{tm.detail}</span>
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section ref={pricingRef} className="py-20 md:py-28 px-6 bg-white dark:bg-slate-950 scroll-mt-24">
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="max-w-2xl space-y-4">
            <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.2em]">Pricing</p>
            <h2 className="font-editorial text-4xl md:text-5xl font-medium tracking-[-0.01em] text-slate-900 dark:text-white leading-[1.08]">
              Pays for itself by Tuesday.
            </h2>
            <p className="text-base text-slate-600 dark:text-slate-400">One prevented stock-out covers a month of StockBit. Prices in Naira, secured by Paystack.</p>
          </div>

          <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800" role="tablist" aria-label="Billing period">
            <button
              role="tab"
              aria-selected={!annualBilling}
              onClick={() => setAnnualBilling(false)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${!annualBilling ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
            >
              Monthly
            </button>
            <button
              role="tab"
              aria-selected={annualBilling}
              onClick={() => setAnnualBilling(true)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${annualBilling ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
            >
              Annual
              <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 text-[11px] font-bold rounded-md">2 months free</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            {PLAN_ORDER.map(({ key, blurb, featured }) => {
              const price = annualBilling ? PLAN_PRICING[key].annual : PLAN_PRICING[key].monthly;
              return (
                <div
                  key={key}
                  className={featured
                    ? 'relative flex flex-col bg-slate-950 dark:bg-white text-white dark:text-slate-900 rounded-2xl p-8 shadow-[0_24px_64px_-24px_rgba(15,23,42,0.5)]'
                    : 'flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm'}
                >
                  {featured && (
                    <span className="absolute -top-3 left-8 px-3 py-1 bg-indigo-600 text-white text-[11px] font-bold uppercase tracking-wider rounded-full">
                      Most popular
                    </span>
                  )}
                  <h3 className="text-xs font-bold uppercase tracking-[0.15em] opacity-60">{PLAN_ENTITLEMENTS[key].label}</h3>
                  <p className="mt-1.5 text-sm font-medium opacity-70">{blurb}</p>
                  <p className="mt-5 flex items-baseline gap-1.5">
                    <span className="font-editorial text-5xl tabular-nums">{formatNaira(price)}</span>
                    <span className="text-sm font-medium opacity-60">/{annualBilling ? 'year' : 'month'}</span>
                  </p>
                  {annualBilling && (
                    <p className="mt-1 text-xs font-semibold opacity-50 tabular-nums">
                      {formatNaira(Math.round(price / 12))}/mo, billed annually
                    </p>
                  )}
                  <ul className="mt-6 space-y-3 flex-1">
                    {PLAN_FEATURES[key].map(f => (
                      <li key={f} className="flex items-start gap-2.5 text-sm font-medium">
                        <Check size={16} className={`mt-0.5 shrink-0 ${featured ? 'text-emerald-400' : 'text-emerald-600 dark:text-emerald-400'}`} />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => onAuth('register')}
                    className={featured
                      ? 'mt-8 w-full py-3.5 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl font-semibold text-sm hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-[0.98] transition-all'
                      : 'mt-8 w-full py-3.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-semibold text-sm hover:bg-slate-800 dark:hover:bg-slate-100 active:scale-[0.98] transition-all'}
                  >
                    Start free trial
                  </button>
                </div>
              );
            })}
          </div>
          <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400">
            Every plan starts with the 60-day free trial — no card required. Switch or cancel anytime; your data stays yours.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 md:py-28 px-6 bg-slate-50 dark:bg-slate-900/40 border-t border-slate-200/60 dark:border-slate-800/60">
        <div className="max-w-3xl mx-auto space-y-10">
          <div className="space-y-4">
            <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.2em]">Questions</p>
            <h2 className="font-editorial text-4xl md:text-5xl font-medium tracking-[-0.01em] text-slate-900 dark:text-white leading-[1.08]">
              Everything else you&rsquo;re wondering.
            </h2>
          </div>
          <div className="border-y border-slate-200 dark:border-slate-800 divide-y divide-slate-200 dark:divide-slate-800">
            {FAQS.map((f, i) => (
              <div key={f.q}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  aria-expanded={openFaq === i}
                  className="w-full flex items-center justify-between gap-4 py-5 text-left"
                >
                  <span className="text-[15px] font-semibold text-slate-900 dark:text-white">{f.q}</span>
                  <span className={`w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 transition-transform duration-300 ${openFaq === i ? 'rotate-45 bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent' : 'text-slate-500'}`}>
                    <Plus size={16} />
                  </span>
                </button>
                <AnimatePresence initial={false}>
                  {openFaq === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeOut' }}
                      className="overflow-hidden"
                    >
                      <p className="pb-6 pr-10 text-[15px] leading-relaxed text-slate-600 dark:text-slate-400">{f.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-28 px-6 bg-white dark:bg-slate-950">
        <div className="max-w-6xl mx-auto relative overflow-hidden bg-slate-950 dark:bg-slate-900 rounded-3xl border border-slate-800 dark:border-slate-700 px-8 py-16 md:py-20 text-center">
          <div className="absolute inset-0 bg-grid opacity-20 [mask-image:radial-gradient(ellipse_60%_80%_at_50%_50%,black,transparent)]" aria-hidden="true" />
          <div className="relative space-y-6 max-w-2xl mx-auto">
            <h2 className={language === 'en'
              ? 'font-editorial text-4xl md:text-5xl font-medium tracking-[-0.01em] text-white leading-[1.08]'
              : 'text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-tight'}>
              {t.ready_grow}
            </h2>
            <p className="text-slate-400 text-base leading-relaxed max-w-xl mx-auto">
              {t.join_hundreds}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
              <button onClick={() => onAuth('register')} className="w-full sm:w-auto px-8 py-4 bg-white text-slate-900 rounded-xl font-semibold text-sm hover:bg-slate-100 active:scale-[0.98] transition-all">
                {t.create_account}
              </button>
              {!isAppInstalled && (
                <button onClick={onInstall} className="w-full sm:w-auto px-8 py-4 bg-transparent text-white rounded-xl font-semibold text-sm border border-white/20 hover:border-white/40 active:scale-[0.98] transition-all">
                  {t.download_app}
                </button>
              )}
            </div>
            <p className="text-xs font-medium text-slate-500">60-day free trial · No card required</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 px-6 bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-16">
          <div className="space-y-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/30">
                <Box size={22} className="text-white" />
              </div>
              <span className="font-black text-xl tracking-tight uppercase dark:text-white">StockBit Pro</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold leading-relaxed uppercase tracking-widest">
              The professional operating system for the modern Nigerian retailer.
            </p>
            <div className="flex items-center gap-5">
              <SocialIcon icon={<Twitter size={20}/>} onClick={() => window.open('https://x.com/stockbitpro', '_blank')} />
              {!isAppInstalled && <SocialIcon icon={<Smartphone size={20}/>} onClick={onInstall} />}
            </div>
          </div>

          <FooterSection title="PRODUCTS" links={[
            { label: t.inventory, onClick: () => scrollToSection(architectureRef) },
            { label: t.sales, onClick: () => scrollToSection(architectureRef) },
            { label: 'Pricing', onClick: () => scrollToSection(pricingRef) },
            { label: 'Marketplace Sync', onClick: () => scrollToSection(architectureRef) },
            ...(!isAppInstalled ? [{ label: 'PWA Mobile App', onClick: onInstall }] : []),
          ]} />

          <FooterSection title="RESOURCES" links={[
            { label: t.about_us, onClick: () => onNavigateInfo(View.AboutUs) },
            { label: t.help_center, onClick: () => onNavigateInfo(View.HelpCenter) },
            { label: 'Terms & Privacy', onClick: () => onNavigateInfo(View.TermsOfService) },
            { label: 'Dashboard', onClick: onEnterTerminal },
          ]} />

          <div className="space-y-8">
            <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-900 dark:text-white">DIRECT SUPPORT</h4>
            <div className="space-y-6">
              <ContactLink icon={<Phone size={16} />} label="24/7 Helpline" value="07010698264" onClick={() => window.open('tel:07010698264')} />
              <ContactLink icon={<MessageCircle size={16} />} label="WhatsApp Concierge" value="07072127949" onClick={() => window.open('https://wa.me/2347072127949')} />
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-16 mt-16 border-t border-slate-100 dark:border-slate-800 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 dark:text-slate-600">© {new Date().getFullYear()} STOCKBIT TECHNOLOGIES NIGERIA. ALL RIGHTS RESERVED.</p>
        </div>
      </footer>

      {/* Floating AI ChatBot */}
      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[100] flex flex-col items-end gap-3">
        <AnimatePresence>
          {isChatOpen && (
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              role="dialog"
              aria-label="StockBot chat"
              className="w-[min(92vw,400px)] h-[min(560px,calc(100dvh-140px))] bg-white dark:bg-slate-900 rounded-3xl shadow-[0_24px_64px_rgba(0,0,0,0.22)] border border-slate-200/80 dark:border-slate-700/60 flex flex-col overflow-hidden"
            >
              <div className="px-4 py-3.5 bg-slate-900 dark:bg-slate-950 text-white flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shrink-0">
                    <Sparkles size={16} className="text-white" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xs font-extrabold uppercase tracking-widest leading-none">StockBot AI</h3>
                    <p className="text-[9px] font-bold uppercase text-slate-400 mt-1">Nigeria shop assistant</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 bg-slate-800/60 px-2.5 py-1 rounded-full border border-slate-700/40 shrink-0" title={chatStatus === 'offline' ? 'Live AI unreachable — local help active' : chatStatus === 'online' ? 'Live AI connected' : 'Checking AI status…'}>
                  <span className={`w-1.5 h-1.5 rounded-full ${chatStatus === 'offline' ? 'bg-amber-400' : chatStatus === 'online' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'}`}></span>
                  <span className="text-[9px] font-extrabold text-slate-300 uppercase tracking-wider">
                    {chatStatus === 'offline' ? 'Local' : chatStatus === 'online' ? 'Online' : '···'}
                  </span>
                </div>
              </div>

              {chatNotice && (
                <div className="px-4 py-2 bg-amber-50 dark:bg-amber-500/10 border-b border-amber-100 dark:border-amber-500/20 shrink-0">
                  <p className="text-[11px] font-semibold text-amber-700 dark:text-amber-300 leading-snug">{chatNotice}</p>
                </div>
              )}

              <div className="flex-1 px-4 py-4 overflow-y-auto space-y-3 bg-slate-50/60 dark:bg-slate-950/30">
                {chatMessages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[86%] px-3.5 py-2.5 rounded-2xl text-[13px] font-medium leading-relaxed shadow-sm whitespace-pre-wrap ${
                      m.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-md'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-bl-md border border-slate-200/70 dark:border-slate-700/60'
                    }`}>
                      {m.text}
                    </div>
                  </div>
                ))}

                {chatMessages.length === 1 && (
                  <div className="pt-1 flex flex-col gap-2">
                    <p className="text-[10px] font-extrabold uppercase text-slate-400 dark:text-slate-500 tracking-wider">Common questions</p>
                    <div className="flex flex-wrap gap-2">
                      {QUICK_QUESTIONS.map((promptText, idx) => (
                        <button
                          key={idx}
                          type="button"
                          disabled={isTyping}
                          onClick={() => void sendChatMessage(promptText)}
                          className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:border-indigo-200 dark:hover:border-indigo-800 text-slate-600 dark:text-slate-300 text-[11px] font-semibold rounded-xl border border-slate-200/70 dark:border-slate-700/60 transition-all shadow-sm cursor-pointer disabled:opacity-50 text-left"
                        >
                          {promptText}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-white dark:bg-slate-800 px-4 py-3 rounded-2xl rounded-bl-md border border-slate-200/70 dark:border-slate-700/60 shadow-sm flex gap-1 items-center">
                      <span className="w-1.5 h-1.5 bg-indigo-600 dark:bg-indigo-400 rounded-full animate-bounce"></span>
                      <span className="w-1.5 h-1.5 bg-indigo-600 dark:bg-indigo-400 rounded-full animate-bounce [animation-delay:0.15s]"></span>
                      <span className="w-1.5 h-1.5 bg-indigo-600 dark:bg-indigo-400 rounded-full animate-bounce [animation-delay:0.3s]"></span>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              <form onSubmit={handleSendMessage} className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200/70 dark:border-slate-800 shrink-0">
                <div className="relative flex items-center">
                  <input
                    ref={chatInputRef}
                    type="text"
                    placeholder="Ask StockBot a question..."
                    aria-label="Ask StockBot a question"
                    className="w-full pl-4 pr-12 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl text-[13px] font-medium outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 text-slate-900 dark:text-white"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                  />
                  <button
                    type="submit"
                    disabled={!chatInput.trim() || isTyping}
                    aria-label="Send message"
                    className="absolute right-1.5 w-9 h-9 bg-indigo-600 text-white rounded-xl flex items-center justify-center hover:bg-indigo-500 transition-all disabled:opacity-30 active:scale-90"
                  >
                    <Send size={15} />
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={() => setIsChatOpen(!isChatOpen)}
          aria-label={isChatOpen ? 'Close StockBot chat' : 'Open StockBot chat'}
          className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl transition-all duration-300 relative ${isChatOpen ? 'bg-slate-900 text-white rotate-90' : 'bg-indigo-600 text-white hover:scale-105'}`}
        >
          {isChatOpen ? <X size={24} /> : <MessageSquare size={24} />}
          {!isChatOpen && <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 border-[3px] border-white dark:border-slate-950 rounded-full"></span>}
        </button>
      </div>
    </div>
  );
};

const NavOption = ({ label, onClick }: any) => (
  <button onClick={onClick} className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-500 hover:text-indigo-600 transition-all">
    {label}
  </button>
);

const FeatureImageCard = ({ image, title, desc, icon, index }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-50px" }}
    transition={{ duration: 0.6 }}
    className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group overflow-hidden"
  >
     <div className="h-48 overflow-hidden relative">
        <img src={image} alt={title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
        <div className="absolute inset-0 bg-indigo-600/10"></div>
        <span className="absolute top-3 right-5 font-editorial text-5xl text-white/90 drop-shadow-md select-none">0{index}</span>
        <div className="absolute bottom-4 left-4 p-3 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md rounded-xl text-indigo-600 dark:text-indigo-400 shadow-xl">
           {icon}
        </div>
     </div>
     <div className="p-8 space-y-3">
        <h4 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">{title}</h4>
        <p className="text-[13px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{desc}</p>
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
      <h5 className="text-[13px] font-extrabold text-slate-900 dark:text-white tracking-tight">{title}</h5>
      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{desc}</p>
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
