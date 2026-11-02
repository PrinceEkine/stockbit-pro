import { describe, it, expect } from 'vitest';
import { chatNoticeFor, insightsNoticeFor } from '../aiNotice';

describe('chatNoticeFor', () => {
  it('explains setup problems with the support fallback', () => {
    expect(chatNoticeFor('NOT_CONFIGURED')).toContain('being set up');
    expect(chatNoticeFor('FUNCTION_NOT_DEPLOYED')).toContain('being set up');
  });

  it('tells the visitor exactly what to do for long or fast messages', () => {
    expect(chatNoticeFor('MESSAGE_TOO_LONG')).toContain('few sentences');
    expect(chatNoticeFor('RATE_LIMITED')).toContain('wait a moment');
  });

  it('falls back to a generic unreachable notice', () => {
    expect(chatNoticeFor('PROVIDER_ERROR')).toContain('unreachable');
    expect(chatNoticeFor(undefined)).toContain('unreachable');
  });
});

describe('insightsNoticeFor', () => {
  it('points setup failures at the administrator, not the visitor helpline', () => {
    expect(insightsNoticeFor('NOT_CONFIGURED')).toContain('administrator');
    expect(insightsNoticeFor('FUNCTION_NOT_DEPLOYED')).toContain('administrator');
  });

  it('covers auth, rate limit and oversize snapshots', () => {
    expect(insightsNoticeFor('UNAUTHORIZED')).toContain('Sign in');
    expect(insightsNoticeFor('RATE_LIMITED')).toContain('wait a moment');
    expect(insightsNoticeFor('REQUEST_TOO_LARGE')).toContain('too large');
  });

  it('falls back to a retry notice', () => {
    expect(insightsNoticeFor('GATEWAY_ERROR')).toContain('retry');
    expect(insightsNoticeFor(undefined)).toContain('retry');
  });
});
