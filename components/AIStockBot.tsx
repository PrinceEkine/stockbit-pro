import React, { useState, useRef, useEffect } from 'react';
import { 
  MessageSquare, 
  X, 
  Send, 
  Cpu, 
  Activity, 
  ArrowRight 
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { AppLanguage, User } from '../types';
import { TRANSLATIONS } from '../constants/translations';

interface AIStockBotProps {
  language: AppLanguage;
  user: User | null;
}

const AIStockBot: React.FC<AIStockBotProps> = ({ language, user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{role: 'user' | 'bot', text: string}[]>([
    { role: 'bot', text: user 
        ? `Hello ${user.name}! I am StockBot. How is ${user.companyName} doing today? Need help with sales or stock?`
        : 'Hello! I am StockBot. How can I help you manage your shop today?' 
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen, isTyping]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsTyping(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const contextStr = user 
        ? `User Name: ${user.name}, Business: ${user.companyName}, Role: ${user.role}.`
        : "Guest User on landing page.";

      const systemInstruction = `
        You are StockBot, the official AI assistant for StockBit Pro. 
        Current Context: ${contextStr}
        Language Mode: ${language}.
        
        CRITICAL RULES:
        1. INSTALLATION: StockBit Pro is a PWA (Progressive Web App). It is NOT on the Google Play Store or Apple App Store yet.
        2. TO DOWNLOAD: Tell users to click the "Install" or "Get App" button found in the navigation bar (if on landing) or in the sidebar (if logged in).
        3. FEATURES: We have a "Strict Sensor" for barcode scanning and "Market Intelligence" for AI-powered reports.
        4. SUPPORT: Our direct support line is 07010698264.
        5. TONE: Be helpful, professional, and use a friendly Nigerian business tone.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [{ role: 'user', parts: [{ text: userMsg }] }],
        config: { systemInstruction }
      });
      
      if (isMounted.current) {
        const botText = response.text || "I'm having a slight connection issue. Please try again or call 07010698264.";
        setMessages(prev => [...prev, { role: 'bot', text: botText }]);
      }
    } catch (error: any) {
      if (isMounted.current) {
        setMessages(prev => [...prev, { role: 'bot', text: "The network is a bit slow right now. You can reach our help desk at 07010698264 for immediate assistance." }]);
      }
    } finally {
      if (isMounted.current) {
        setIsTyping(false);
      }
    }
  };

  return (
    <div className="fixed bottom-6 right-6 md:bottom-10 md:right-10 z-[200]">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center shadow-2xl transition-all duration-500 relative ${isOpen ? 'bg-slate-900 text-white rotate-90 scale-110' : 'bg-indigo-600 text-white hover:scale-110'}`}
      >
        {isOpen ? <X size={28} /> : <MessageSquare size={28} />}
        {!isOpen && <span className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 border-4 border-white dark:border-slate-900 rounded-full"></span>}
      </button>
      
      {isOpen && (
        <div className="absolute bottom-20 md:bottom-24 right-0 w-[85vw] xs:w-[320px] md:w-[450px] bg-white dark:bg-slate-900 rounded-[2.5rem] md:rounded-[3rem] shadow-[0_40px_120px_rgba(0,0,0,0.25)] border border-slate-100 dark:border-slate-800 flex flex-col overflow-hidden animate-in slide-in-from-bottom-12 fade-in duration-500">
          <div className="p-6 md:p-8 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-indigo-600 rounded-xl flex items-center justify-center shadow-xl">
                <Cpu size={22} />
              </div>
              <div>
                <h3 className="text-sm md:text-base font-black uppercase tracking-widest leading-none">STOCKBOT AI</h3>
                <p className="text-[8px] md:text-[9px] font-bold uppercase opacity-60 mt-1">Nigeria Retail Assistant</p>
              </div>
            </div>
            <Activity size={20} className="text-emerald-500 animate-pulse" />
          </div>

          <div className="flex-1 p-6 md:p-8 overflow-y-auto max-h-[400px] md:max-h-[450px] space-y-6 md:space-y-8 scrollbar-hide bg-slate-50/50 dark:bg-slate-950/50">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-4 duration-500`}>
                <div className={`max-w-[90%] md:max-w-[85%] p-4 md:p-5 rounded-[1.8rem] md:rounded-[2rem] text-[12px] md:text-[13px] font-semibold leading-relaxed shadow-sm ${
                  m.role === 'user' 
                  ? 'bg-indigo-600 text-white rounded-tr-none' 
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-tl-none border border-slate-100 dark:border-slate-700'
                }`}>
                  {m.text}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-slate-800 p-4 md:p-5 rounded-[1.8rem] rounded-tl-none border border-slate-100 dark:border-slate-700 shadow-sm flex gap-1.5 items-center">
                  <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce delay-100"></div>
                  <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce delay-200"></div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <form onSubmit={handleSend} className="p-6 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
            <div className="relative">
              <input 
                type="text" 
                placeholder="ASK ME A QUESTION..." 
                className="w-full pl-6 pr-14 py-4 md:py-5 bg-slate-50 dark:bg-slate-800 border-none rounded-[1.5rem] text-[10px] md:text-xs font-black uppercase outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-slate-400 dark:text-white"
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
              <button 
                type="submit"
                disabled={!input.trim() || isTyping}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 md:w-11 md:h-11 bg-slate-900 dark:bg-indigo-600 text-white rounded-xl md:rounded-2xl flex items-center justify-center hover:bg-indigo-600 transition-all disabled:opacity-20 active:scale-90"
              >
                <Send size={18} />
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default AIStockBot;
