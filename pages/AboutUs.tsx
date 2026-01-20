
import React from 'react';
import { Box, Target, Heart, Award } from 'lucide-react';

const AboutUs: React.FC = () => {
  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <div className="text-center space-y-6">
        <h1 className="text-5xl font-black tracking-tighter uppercase dark:text-white">Our Mission</h1>
        <p className="text-xl text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-2xl mx-auto">
          StockBit Pro is engineered to empower African retail enterprises with industrial-grade logistics intelligence.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm">
           <Target className="text-indigo-600 mb-6" size={40} />
           <h3 className="text-xl font-black uppercase tracking-tighter mb-4 dark:text-white">Precision Engineering</h3>
           <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed font-medium">
             We believe that inventory management shouldn't be a hurdle. Our software is built with high-velocity SKU tracking and AI-driven auditing at its core, ensuring zero-leakage workflows.
           </p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm">
           <Heart className="text-rose-500 mb-6" size={40} />
           <h3 className="text-xl font-black uppercase tracking-tighter mb-4 dark:text-white">Local Impact</h3>
           <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed font-medium">
             Built specifically for the Nigerian market, StockBit Pro handles local payment methods, multi-branch synchronization, and marketplace bridges that matter to growing businesses.
           </p>
        </div>
      </div>

      <div className="bg-slate-900 text-white p-12 rounded-[4rem] text-center space-y-8">
        <Award className="text-amber-400 mx-auto" size={56} />
        <h2 className="text-3xl font-black uppercase tracking-tighter">Gold Standard Logistics</h2>
        <p className="max-w-xl mx-auto text-slate-400 font-medium leading-relaxed">
          From neighborhood kiosks to industrial warehouses, our protocol provides the same military-grade data protection and real-time synchronization.
        </p>
      </div>
    </div>
  );
};

export default AboutUs;
