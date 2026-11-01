/**
 * Trial-nurture logic: escalating end-of-trial reminders and the new-shop
 * setup checklist. Pure functions + localStorage dismissal flags (user- and
 * stage-scoped, so shared devices don't leak one owner's dismissals).
 */

export type TrialStage = 'none' | 'notice' | 'warning' | 'urgent';

export interface TrialGate {
  isSubscribed: boolean;
  isExpired: boolean;
}

/**
 * Escalation ladder for a 60-day trial:
 * 15 days left (day 45) → notice, 7 left (day 53) → warning,
 * 2 left (day 58) → urgent. Silent for paid and expired accounts.
 */
export const getTrialStage = (daysLeft: number, gate: TrialGate): TrialStage => {
  if (gate.isSubscribed || gate.isExpired) return 'none';
  if (daysLeft <= 2) return 'urgent';
  if (daysLeft <= 7) return 'warning';
  if (daysLeft <= 15) return 'notice';
  return 'none';
};

export interface TrialStageCopy {
  title: string;
  body: string;
  cta: string;
}

export const trialStageCopy = (stage: Exclude<TrialStage, 'none'>, daysLeft: number): TrialStageCopy => {
  switch (stage) {
    case 'urgent':
      return {
        title: daysLeft <= 1 ? 'Your trial ends tomorrow' : `Your trial ends in ${daysLeft} days`,
        body: 'Your shop will pause when the trial ends. Subscribing takes about a minute.',
        cta: 'Subscribe now',
      };
    case 'warning':
      return {
        title: `Your trial ends in ${daysLeft} days`,
        body: 'Subscribe before it ends so your shop never pauses.',
        cta: 'Choose a plan',
      };
    case 'notice':
    default:
      return {
        title: `${daysLeft} days left in your free trial`,
        body: 'Pick a plan anytime — your stock, sales and team carry over automatically.',
        cta: 'See plans',
      };
  }
};

const readFlag = (key: string): boolean => {
  try {
    return typeof localStorage !== 'undefined' && localStorage.getItem(key) === '1';
  } catch {
    return false;
  }
};

const writeFlag = (key: string): void => {
  try {
    if (typeof localStorage !== 'undefined') localStorage.setItem(key, '1');
  } catch {
    /* Private mode etc. — the banner simply shows again next visit. */
  }
};

export const isTrialBannerDismissed = (userId: string, stage: Exclude<TrialStage, 'none'>): boolean =>
  readFlag(`sb-trial-banner:${userId}:${stage}`);

export const dismissTrialBanner = (userId: string, stage: Exclude<TrialStage, 'none'>): void =>
  writeFlag(`sb-trial-banner:${userId}:${stage}`);

export const isSetupDismissed = (userId: string): boolean =>
  readFlag(`sb-setup-checklist:${userId}`);

export const dismissSetup = (userId: string): void =>
  writeFlag(`sb-setup-checklist:${userId}`);

export interface SetupItem {
  id: 'product' | 'sale' | 'team';
  done: boolean;
}

export interface SetupChecklist {
  items: SetupItem[];
  doneCount: number;
  complete: boolean;
}

/** Three activation steps: first product, first sale, first teammate. */
export const getSetupChecklist = (
  products: { id: string }[],
  sales: { id: string }[],
  users: { id: string }[],
): SetupChecklist => {
  const items: SetupItem[] = [
    { id: 'product', done: products.length > 0 },
    { id: 'sale', done: sales.length > 0 },
    { id: 'team', done: users.length > 1 },
  ];
  const doneCount = items.filter(i => i.done).length;
  return { items, doneCount, complete: doneCount === items.length };
};
