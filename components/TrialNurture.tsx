import React, { useState } from 'react';
import { AlertTriangle, ArrowRight, Box, Check, Clock, ShoppingCart, Users, X } from 'lucide-react';
import { View } from '../types';
import {
  TrialStage,
  dismissSetup,
  dismissTrialBanner,
  getSetupChecklist,
  getTrialStage,
  isSetupDismissed,
  isTrialBannerDismissed,
  trialStageCopy,
} from '../lib/trialNurture';

interface TrialBannerProps {
  daysLeft: number;
  isSubscribed: boolean;
  isExpired: boolean;
  userId: string;
  role: string;
  onSeePlans: () => void;
}

const STAGE_STYLES: Record<Exclude<TrialStage, 'none'>, { bar: string; cta: string; icon: React.ReactNode }> = {
  notice: {
    bar: 'bg-amber-50 dark:bg-amber-500/10 border-amber-200/80 dark:border-amber-500/25 text-amber-900 dark:text-amber-100',
    cta: 'bg-amber-600 hover:bg-amber-500 text-white',
    icon: <Clock size={18} className="text-amber-600 dark:text-amber-400" />,
  },
  warning: {
    bar: 'bg-amber-100/70 dark:bg-amber-500/15 border-amber-300/70 dark:border-amber-500/30 text-amber-950 dark:text-amber-50',
    cta: 'bg-amber-600 hover:bg-amber-500 text-white',
    icon: <AlertTriangle size={18} className="text-amber-600 dark:text-amber-400" />,
  },
  urgent: {
    bar: 'bg-rose-50 dark:bg-rose-500/10 border-rose-200/80 dark:border-rose-500/25 text-rose-950 dark:text-rose-50',
    cta: 'bg-rose-600 hover:bg-rose-500 text-white',
    icon: <AlertTriangle size={18} className="text-rose-600 dark:text-rose-400" />,
  },
};

/**
 * Escalating end-of-trial reminder (15 / 7 / 2 days left). Owners only;
 * dismissing one stage never hides the next escalation.
 */
export const TrialBanner: React.FC<TrialBannerProps> = ({
  daysLeft,
  isSubscribed,
  isExpired,
  userId,
  role,
  onSeePlans,
}) => {
  const [dismissed, setDismissed] = useState(false);
  const stage = getTrialStage(daysLeft, { isSubscribed, isExpired });
  if (role === 'staff' || stage === 'none' || dismissed || isTrialBannerDismissed(userId, stage)) {
    return null;
  }

  const copy = trialStageCopy(stage, daysLeft);
  const styles = STAGE_STYLES[stage];

  return (
    <div className={`no-print border-b ${styles.bar}`}>
      <div className="px-4 md:px-8 lg:px-10 py-3 flex items-center gap-3 md:gap-4 max-w-[1600px] mx-auto">
        <span className="shrink-0">{styles.icon}</span>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] md:text-sm font-bold leading-tight">{copy.title}</p>
          <p className="text-xs md:text-[13px] font-medium opacity-80 leading-snug hidden sm:block">{copy.body}</p>
        </div>
        <button
          onClick={onSeePlans}
          className={`shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs md:text-[13px] font-bold active:scale-95 transition-all ${styles.cta}`}
        >
          {copy.cta} <ArrowRight size={14} />
        </button>
        <button
          onClick={() => {
            dismissTrialBanner(userId, stage);
            setDismissed(true);
          }}
          aria-label="Dismiss reminder"
          className="shrink-0 p-1.5 rounded-lg opacity-60 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10 transition-all"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

interface SetupChecklistProps {
  products: { id: string }[];
  sales: { id: string }[];
  users: { id: string }[];
  userId: string;
  role: string;
  onNavigate: (view: View) => void;
}

const SETUP_META = {
  product: {
    icon: Box,
    title: 'Add your first product',
    sub: 'Scan a barcode or snap a photo — AI fills in the details',
    view: View.Inventory,
  },
  sale: {
    icon: ShoppingCart,
    title: 'Record your first sale',
    sub: 'Ring up a sale and print a professional receipt',
    view: View.Sales,
  },
  team: {
    icon: Users,
    title: 'Invite your team',
    sub: 'Send staff an invite code from Settings',
    view: View.Settings,
  },
} as const;

/** Activation checklist for owners with an empty shop. Vanishes when done. */
export const SetupChecklist: React.FC<SetupChecklistProps> = ({
  products,
  sales,
  users,
  userId,
  role,
  onNavigate,
}) => {
  const [dismissed, setDismissed] = useState(false);
  if (role === 'staff') return null;

  const list = getSetupChecklist(products, sales, users);
  if (list.complete || dismissed || isSetupDismissed(userId)) return null;

  return (
    <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 md:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base md:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
            Set up your shop
          </h2>
          <p className="text-[13px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            {list.doneCount} of {list.items.length} done — about 3 minutes total
          </p>
        </div>
        <button
          onClick={() => {
            dismissSetup(userId);
            setDismissed(true);
          }}
          className="text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors shrink-0 py-1"
        >
          I&rsquo;ll do this later
        </button>
      </div>

      <div className="mt-4 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-indigo-600 rounded-full transition-all duration-500"
          style={{ width: `${(list.doneCount / list.items.length) * 100}%` }}
        />
      </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
        {list.items.map(item => {
          const meta = SETUP_META[item.id];
          const Icon = meta.icon;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(meta.view)}
              className={`flex items-start gap-3 p-4 rounded-xl border text-left transition-all active:scale-[0.98] ${
                item.done
                  ? 'border-emerald-200 dark:border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-500/5'
                  : 'border-slate-200 dark:border-slate-700/60 hover:border-indigo-300 dark:hover:border-indigo-500/50 hover:bg-indigo-50/40 dark:hover:bg-indigo-500/5'
              }`}
            >
              <span className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                item.done
                  ? 'bg-emerald-500 text-white'
                  : 'bg-indigo-600/10 text-indigo-600 dark:text-indigo-400'
              }`}>
                {item.done ? <Check size={17} /> : <Icon size={17} />}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-bold text-slate-900 dark:text-white leading-snug">
                  {meta.title}
                </span>
                <span className="block text-xs font-medium text-slate-500 dark:text-slate-400 leading-snug mt-0.5">
                  {meta.sub}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
};
