
import React from 'react';

const TermsOfService: React.FC = () => {
  return (
    <div className="space-y-12 animate-in fade-in duration-700 max-w-3xl">
      <div className="space-y-6">
        <h1 className="text-5xl font-black tracking-tighter uppercase dark:text-white">Service Protocol</h1>
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-600">Revision 4.2 - Effective Jan 2025</p>
      </div>

      <div className="prose prose-slate dark:prose-invert max-w-none space-y-10">
        <section>
          <h3 className="text-xl font-black uppercase tracking-tight">1. Enterprise Terminal Usage</h3>
          <p className="text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
            By accessing the StockBit Pro terminal, you agree to deploy it for lawful business purposes within the Federal Republic of Nigeria. Unauthorized extraction of system logic or perimeter breaches will result in immediate protocol revocation.
          </p>
        </section>

        <section>
          <h3 className="text-xl font-black uppercase tracking-tight">2. Data Sovereignty</h3>
          <p className="text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
            Operational data entered into the StockBit cloud remains the property of the primary Business Owner. We provide the infrastructure and persistent encryption but maintain no ownership of your inventory ledgers.
          </p>
        </section>

        <section>
          <h3 className="text-xl font-black uppercase tracking-tight">3. Billing Compliance</h3>
          <p className="text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
            Subscriptions are processed via Paystack. Failure to synchronize payment for the "Mega" or "Mega Pro" tiers will revert terminal access to "Beta" protocol limits. No refunds are issued for partially used deployment cycles.
          </p>
        </section>

        <section>
          <h3 className="text-xl font-black uppercase tracking-tight">4. System Uptime</h3>
          <p className="text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
            While we target 99.9% uptime, StockBit Pro relies on decentralized cloud nodes. We are not liable for operational losses during scheduled maintenance windows or regional infrastructure failures.
          </p>
        </section>
      </div>
    </div>
  );
};

export default TermsOfService;
