import React, { useState, useMemo, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X, Send, Sparkles, MessageSquare } from 'lucide-react';
import { Product, Sale } from '../types';
import { chatWithMuseStatus } from '../services/museService';
import { probeAiGateway, type ChatMessage } from '../services/aiClient';
import { chatNoticeFor } from '../lib/aiNotice';

interface StockBotWidgetProps {
  companyName: string;
  userName: string;
  currency: string;
  products: Product[];
  sales: Sale[];
}

const QUICK_QUESTIONS = [
  'What needs restocking?',
  'How did sales go this week?',
  'Which product sells best?',
];

/** Compact live snapshot so the AI answers about THIS shop, not in general. */
const buildSnapshot = (products: Product[], sales: Sale[], currency: string): string => {
  const low = products
    .filter((p) => p.quantity <= (p.min_threshold || 0))
    .slice(0, 5)
    .map((p) => `${p.name} (${p.quantity} left)`);
  const weekStart = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const weekSales = sales.filter((s) => {
    const t = new Date(s.date).getTime();
    return !Number.isNaN(t) && t >= weekStart;
  });
  const revenue = weekSales.reduce((sum, s) => sum + (s.total_price || 0), 0);
  const byProduct = new Map<string, number>();
  weekSales.forEach((s) => (s.items || []).forEach((i) => {
    byProduct.set(i.productName, (byProduct.get(i.productName) || 0) + i.quantity);
  }));
  const top = [...byProduct.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3)
    .map(([name, qty]) => `${name} (${qty})`);
  return [
    `${products.length} products on catalogue.`,
    low.length > 0 ? `Low stock: ${low.join(', ')}.` : 'No low-stock items.',
    `Last 7 days: ${currency}${Math.round(revenue).toLocaleString()} from ${weekSales.length} sales.`,
    top.length > 0 ? `Top sellers: ${top.join(', ')}.` : 'No sales this week yet.',
  ].join(' ');
};

const StockBotWidget: React.FC<StockBotWidgetProps> = ({ companyName, userName, currency, products, sales }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'bot'; text: string }[]>([
    { role: 'bot', text: `Hello ${userName || 'there'}! I can see ${companyName || 'your shop'}'s live numbers — ask me what needs restocking, how sales are going, or anything about the app.` },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [status, setStatus] = useState<'online' | 'offline' | 'unknown'>('unknown');
  const [notice, setNotice] = useState<string | null>(null);
  const fails = useRef(0);
  const mounted = useRef(true);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const snapshot = useMemo(() => buildSnapshot(products, sales, currency), [products, sales, currency]);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    inputRef.current?.focus();
    if (status === 'unknown') {
      probeAiGateway().then((r) => {
        if (!mounted.current) return;
        setStatus(r.ok ? 'online' : 'offline');
        if (!r.ok) setNotice(chatNoticeFor(r.code));
      });
    }
  }, [isOpen]);

  const send = async (raw: string) => {
    const userMsg = raw.trim();
    if (!userMsg || isTyping) return;
    setInput('');
    setNotice(null);
    setMessages((prev) => [...prev, { role: 'user', text: userMsg }]);
    setIsTyping(true);

    try {
      const systemInstruction = `You are StockBot, the in-app assistant for ${companyName || 'this shop'} on StockBit Pro (built for Nigerian retailers). The shop owner is ${userName || 'the owner'}. Answer about their business using ONLY the live snapshot below — never invent numbers. Keep answers short and plain. If a question needs data you do not have, say what to check. Live snapshot: ${snapshot}`;
      const recent: ChatMessage[] = messages.slice(-6).map((m) => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.text,
      }));
      const turns = [...recent, { role: 'user' as const, content: userMsg }].reverse();
      const kept: ChatMessage[] = [turns[0]];
      let budget = 3000 - turns[0].content.length;
      for (const m of turns.slice(1)) {
        if (m.role !== 'user') { kept.push(m); continue; }
        if (m.content.length <= budget) { kept.push(m); budget -= m.content.length; }
      }
      const result = await chatWithMuseStatus([
        { role: 'system', content: systemInstruction },
        ...kept.reverse(),
      ]);

      if (!mounted.current) return;
      if (result.source === 'ai') {
        fails.current = 0;
        setStatus('online');
      } else {
        fails.current += 1;
        if (fails.current >= 2) setStatus('offline');
        setNotice(chatNoticeFor(result.errorCode));
      }
      setMessages((prev) => [...prev, { role: 'bot', text: result.text }]);
    } catch {
      if (mounted.current) {
        fails.current += 1;
        if (fails.current >= 2) setStatus('offline');
        setMessages((prev) => [...prev, { role: 'bot', text: 'Service is temporarily unavailable. Please try again in a moment.' }]);
      }
    } finally {
      if (mounted.current) setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-24 md:bottom-6 right-4 md:right-6 z-[60] flex flex-col items-end gap-3 no-print">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            role="dialog"
            aria-label="StockBot assistant"
            className="w-[min(92vw,400px)] h-[min(560px,calc(100dvh-180px))] bg-white dark:bg-slate-900 rounded-3xl shadow-[0_24px_64px_rgba(0,0,0,0.22)] border border-slate-200/80 dark:border-slate-700/60 flex flex-col overflow-hidden"
          >
            <div className="px-4 py-3.5 bg-slate-900 dark:bg-slate-950 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shrink-0">
                  <Sparkles size={16} className="text-white" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs font-extrabold uppercase tracking-widest leading-none">StockBot AI</h3>
                  <p className="text-[9px] font-bold uppercase text-slate-400 mt-1">Knows your live numbers · Meta Muse</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-800/60 px-2.5 py-1 rounded-full border border-slate-700/40 shrink-0">
                <span className={`w-1.5 h-1.5 rounded-full ${status === 'offline' ? 'bg-amber-400' : status === 'online' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'}`}></span>
                <span className="text-[9px] font-extrabold text-slate-300 uppercase tracking-wider">
                  {status === 'offline' ? 'Local' : status === 'online' ? 'Online' : '···'}
                </span>
              </div>
            </div>

            {notice && (
              <div className="px-4 py-2 bg-amber-50 dark:bg-amber-500/10 border-b border-amber-100 dark:border-amber-500/20 shrink-0">
                <p className="text-[11px] font-semibold text-amber-700 dark:text-amber-300 leading-snug">{notice}</p>
              </div>
            )}

            <div className="flex-1 px-4 py-4 overflow-y-auto space-y-3 bg-slate-50/60 dark:bg-slate-950/30">
              {messages.map((m, i) => (
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

              {messages.length === 1 && (
                <div className="pt-1 flex flex-col gap-2">
                  <p className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Try asking</p>
                  <div className="flex flex-wrap gap-2">
                    {QUICK_QUESTIONS.map((q, idx) => (
                      <button
                        key={idx}
                        type="button"
                        disabled={isTyping}
                        onClick={() => void send(q)}
                        className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-slate-600 dark:text-slate-300 text-[11px] font-semibold rounded-xl border border-slate-200/70 dark:border-slate-700/60 transition-all shadow-sm disabled:opacity-50 text-left"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white dark:bg-slate-800 px-4 py-3 rounded-2xl rounded-bl-md border border-slate-200/70 dark:border-slate-700/60 shadow-sm flex gap-1 items-center">
                    <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce [animation-delay:0.15s]"></span>
                    <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce [animation-delay:0.3s]"></span>
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </div>

            <form onSubmit={(e) => { e.preventDefault(); void send(input); }} className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200/70 dark:border-slate-800 shrink-0">
              <div className="relative flex items-center">
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Ask about your shop..."
                  aria-label="Ask StockBot about your shop"
                  className="w-full pl-4 pr-12 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl text-[13px] font-medium outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 transition-all placeholder:text-slate-400 text-slate-900 dark:text-white"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isTyping}
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
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? 'Close StockBot assistant' : 'Open StockBot assistant'}
        className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl transition-all duration-300 ${isOpen ? 'bg-slate-900 text-white rotate-90' : 'bg-indigo-600 text-white hover:scale-105'}`}
      >
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
      </button>
    </div>
  );
};

export default StockBotWidget;
