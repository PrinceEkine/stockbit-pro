
import React from 'react';
import { Box, Target, Heart, Award } from 'lucide-react';

const AboutUs: React.FC = () => {
  return (
    <div className="space-y-12 animate-in fade-in duration-500 max-w-full">
      <div className="text-center space-y-4">
        <h2 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white">Our Mission</h2>
        <p className="text-lg text-slate-500 dark:text-slate-400 font-normal leading-relaxed max-w-2xl mx-auto">
          Empowering African enterprises with intelligent, accessible, and efficient inventory management solutions.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-transform hover:scale-[1.01]">
           <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/10 text-indigo-600 rounded-xl flex items-center justify-center mb-6">
             <Target size={24} />
           </div>
           <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Smarter Operations</h3>
           <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
             We simplify complex inventory challenges. Our platform provides real-time tracking, automated stock alerts, and intelligent forecasting to help you maintain a lean and efficient supply chain.
           </p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-transform hover:scale-[1.01]">
           <div className="w-12 h-12 bg-rose-50 dark:bg-rose-900/10 text-rose-500 rounded-xl flex items-center justify-center mb-6">
             <Heart size={24} />
           </div>
           <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Localized for Africa</h3>
           <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
             Custom-built for local markets, StockBit Pro integrates seamlessly with regional payment gateways and supports multi-location synchronization relevant to growing businesses across the continent.
           </p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-10 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-6">
        <div className="w-16 h-16 bg-amber-50 dark:bg-amber-900/10 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-2">
          <Award size={32} />
        </div>
        <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Professional-Grade Reliability</h3>
        <p className="max-w-2xl mx-auto text-slate-500 font-normal leading-relaxed">
          From independent retailers to large distribution centers, our platform ensures data security and real-time accuracy, providing the oversight needed to scale your operations with confidence.
        </p>
      </div>
    </div>
  );
};

export default AboutUs;
