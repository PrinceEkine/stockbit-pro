import { describe, it, expect, beforeEach } from 'vitest';
import {
  getTrialStage,
  trialStageCopy,
  getSetupChecklist,
  isTrialBannerDismissed,
  dismissTrialBanner,
  isSetupDismissed,
  dismissSetup,
} from '../trialNurture';

class MemoryStorage {
  private data = new Map<string, string>();
  getItem(key: string): string | null {
    return this.data.has(key) ? this.data.get(key)! : null;
  }
  setItem(key: string, value: string): void {
    this.data.set(key, value);
  }
  removeItem(key: string): void {
    this.data.delete(key);
  }
  clear(): void {
    this.data.clear();
  }
}

beforeEach(() => {
  (globalThis as any).localStorage = new MemoryStorage();
});

describe('getTrialStage', () => {
  const active = { isSubscribed: false, isExpired: false };

  it('stays silent for subscribed and expired accounts', () => {
    expect(getTrialStage(1, { isSubscribed: true, isExpired: false })).toBe('none');
    expect(getTrialStage(15, { isSubscribed: false, isExpired: true })).toBe('none');
  });

  it('escalates at 15, 7 and 2 days left', () => {
    expect(getTrialStage(60, active)).toBe('none');
    expect(getTrialStage(16, active)).toBe('none');
    expect(getTrialStage(15, active)).toBe('notice');
    expect(getTrialStage(8, active)).toBe('notice');
    expect(getTrialStage(7, active)).toBe('warning');
    expect(getTrialStage(3, active)).toBe('warning');
    expect(getTrialStage(2, active)).toBe('urgent');
    expect(getTrialStage(1, active)).toBe('urgent');
    expect(getTrialStage(0, active)).toBe('urgent');
  });
});

describe('trialStageCopy', () => {
  it('names the exact days left and escalates wording', () => {
    expect(trialStageCopy('notice', 15).title).toContain('15 days left');
    expect(trialStageCopy('warning', 7).title).toContain('7 days');
    expect(trialStageCopy('urgent', 2).title).toContain('2 days');
  });

  it('says tomorrow instead of "1 days"', () => {
    expect(trialStageCopy('urgent', 1).title).toMatch(/tomorrow/i);
  });
});

describe('getSetupChecklist', () => {
  it('starts with all three steps undone', () => {
    const list = getSetupChecklist([], [], [{ id: 'owner' } as any]);
    expect(list.complete).toBe(false);
    expect(list.items.map(i => i.done)).toEqual([false, false, false]);
  });

  it('ticks steps off as the shop fills up', () => {
    const products = [{ id: 'p1' } as any];
    const sales = [{ id: 's1' } as any];
    const team = [{ id: 'owner' } as any, { id: 'staff' } as any];
    expect(getSetupChecklist(products, [], [{ id: 'owner' } as any]).items[0].done).toBe(true);
    expect(getSetupChecklist(products, sales, [{ id: 'owner' } as any]).items[1].done).toBe(true);
    expect(getSetupChecklist(products, sales, team).complete).toBe(true);
  });
});

describe('dismissal storage', () => {
  it('hides the banner per user and per stage', () => {
    expect(isTrialBannerDismissed('u1', 'notice')).toBe(false);
    dismissTrialBanner('u1', 'notice');
    expect(isTrialBannerDismissed('u1', 'notice')).toBe(true);
    // A new stage shows again; another user is unaffected.
    expect(isTrialBannerDismissed('u1', 'warning')).toBe(false);
    expect(isTrialBannerDismissed('u2', 'notice')).toBe(false);
  });

  it('hides the setup checklist per user', () => {
    expect(isSetupDismissed('u1')).toBe(false);
    dismissSetup('u1');
    expect(isSetupDismissed('u1')).toBe(true);
    expect(isSetupDismissed('u2')).toBe(false);
  });
});
