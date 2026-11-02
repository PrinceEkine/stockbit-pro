import { describe, it, expect } from 'vitest';
import { shouldBlockAccess } from '../accessGate';

describe('shouldBlockAccess', () => {
  const expired = { isSubscribed: false, isExpired: true };
  const active = { isSubscribed: false, isExpired: false };
  const paid = { isSubscribed: true, isExpired: false };

  it('never blocks the platform admin, even with an expired trial', () => {
    expect(shouldBlockAccess('admin', expired, false)).toBe(false);
    expect(shouldBlockAccess('admin', expired, true)).toBe(false);
  });

  it('blocks expired owners and staff on app views', () => {
    expect(shouldBlockAccess('user', expired, false)).toBe(true);
    expect(shouldBlockAccess('staff', expired, false)).toBe(true);
  });

  it('lets active and subscribed accounts through', () => {
    expect(shouldBlockAccess('user', active, false)).toBe(false);
    expect(shouldBlockAccess('staff', active, false)).toBe(false);
    expect(shouldBlockAccess('user', paid, false)).toBe(false);
  });

  it('always leaves Settings reachable so billing can be fixed', () => {
    expect(shouldBlockAccess('user', expired, true)).toBe(false);
    expect(shouldBlockAccess('staff', expired, true)).toBe(false);
  });

  it('does not block signed-out visitors (login screen handles them)', () => {
    expect(shouldBlockAccess(null, expired, false)).toBe(false);
    expect(shouldBlockAccess(undefined, expired, false)).toBe(false);
  });
});
