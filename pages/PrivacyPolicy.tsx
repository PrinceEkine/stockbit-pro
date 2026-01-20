
import React from 'react';

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="space-y-12 animate-in fade-in duration-700 max-w-3xl">
      <div className="space-y-6">
        <h1 className="text-5xl font-black tracking-tighter uppercase dark:text-white">Privacy Doctrine</h1>
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-600">Secured Node Protocol v2.0</p>
      </div>

      <div className="prose prose-slate dark:prose-invert max-w-none space-y-10">
        <section>
          <h3 className="text-xl font-black uppercase tracking-tight">Encryption Standards</h3>
          <p className="text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
            All inventory metadata and sales transactions are encrypted in transit and at rest. We utilize industrial-grade perimeter security to ensure that staff terminals only access data fragments authorized by the Business Owner.
          </p>
        </section>

        <section>
          <h3 className="text-xl font-black uppercase tracking-tight">AI Audit Logs</h3>
          <p className="text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
            When using the Gemini Vision Flash Scanner, image data is processed momentarily for SKU identification and is not stored in persistent logs unless specifically flagged for inventory training by the admin.
          </p>
        </section>

        <section>
          <h3 className="text-xl font-black uppercase tracking-tight">Personnel Tracking</h3>
          <p className="text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
            Staff activity is logged locally for the Business Owner's audit trails. This data is used exclusively for internal accountability and is not shared with third-party advertising algorithms.
          </p>
        </section>

        <div className="p-8 bg-slate-900 text-white rounded-[2.5rem]">
           <p className="text-[10px] font-black uppercase tracking-widest leading-relaxed">
             StockBit Technologies maintains a strict zero-sell policy regarding your enterprise data. Your operational intelligence remains your competitive advantage.
           </p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
