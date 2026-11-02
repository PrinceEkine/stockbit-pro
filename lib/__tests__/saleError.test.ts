import { describe, it, expect, vi } from 'vitest';

// store.ts pulls the Supabase client at module load; stub it — this test only
// exercises the pure error-message helper.
vi.mock('../../supabase', () => ({ supabase: {} }));

import { saleInsertErrorMessage } from '../../store';

describe('saleInsertErrorMessage', () => {
  it('tells the cashier to apply the migration when total columns are missing', () => {
    expect(saleInsertErrorMessage({ code: '42703', message: 'column total_price does not exist' }))
      .toContain('migration');
  });

  it('explains permission failures plainly', () => {
    expect(saleInsertErrorMessage({ code: '42501', message: 'denied' }))
      .toContain('permission');
  });

  it('cleans up any other database message', () => {
    expect(saleInsertErrorMessage({ message: 'Error: something broke' })).toBe('something broke');
    expect(saleInsertErrorMessage({})).toBe('Sale could not be recorded.');
  });
});
