import { SubscriptionPlan, User } from '../types';

export interface PlanEntitlements {
  label: string;
  /** Maximum number of staff/team members a business may have. */
  staffLimit: number;
  /** Marketplace channel sync (Jumia, Konga, WhatsApp). */
  marketplaces: boolean;
  /** Advanced analytics / inventory forecasting. */
  advancedAnalytics: boolean;
  /** ESG / sustainability audit. */
  esgAudit: boolean;
}

// Unlimited is represented with a large finite number so it survives JSON and
// simple comparisons without special-casing Infinity everywhere.
export const UNLIMITED = 999999;

export const PLAN_ENTITLEMENTS: Record<SubscriptionPlan, PlanEntitlements> = {
  beta:     { label: 'StockBit Entry',      staffLimit: 3,         marketplaces: false, advancedAnalytics: false, esgAudit: false },
  mega:     { label: 'StockBit Business',   staffLimit: 8,         marketplaces: true,  advancedAnalytics: true,  esgAudit: false },
  mega_pro: { label: 'StockBit Enterprise', staffLimit: UNLIMITED, marketplaces: true,  advancedAnalytics: true,  esgAudit: true },
};

// Free-trial and unsubscribed accounts get entry-tier limits. This keeps the
// trial consistent with the entry plan and avoids a painful "remove staff to
// downgrade" situation when the user later subscribes to Beta.
export const DEFAULT_ENTITLEMENTS: PlanEntitlements = PLAN_ENTITLEMENTS.beta;

/**
 * Resolves the active entitlements for a user based on their subscription.
 * Unsubscribed / trial users fall back to entry-tier limits.
 */
export const getEntitlements = (user: User | null): PlanEntitlements => {
  if (user?.isSubscribed && user.plan && PLAN_ENTITLEMENTS[user.plan]) {
    return PLAN_ENTITLEMENTS[user.plan];
  }
  return DEFAULT_ENTITLEMENTS;
};

export const isUnlimited = (value: number): boolean => value >= UNLIMITED;
