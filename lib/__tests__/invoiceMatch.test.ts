import { describe, it, expect } from 'vitest';
import { matchInvoiceLine, matchInvoiceSupplier } from '../invoiceMatch';

const products = [
  { id: 'p1', name: 'Golden Penny Flour 50kg', sku: 'GP-50' },
  { id: 'p2', name: 'Milo Sachet Roll', sku: '' },
];

describe('matchInvoiceLine', () => {
  it('prefers an exact SKU match', () => {
    expect(matchInvoiceLine({ name: 'Flour', sku: 'gp-50', quantity: 2, unitCost: 100 }, products)?.id).toBe('p1');
  });

  it('falls back to exact then partial name matches', () => {
    expect(matchInvoiceLine({ name: 'Milo Sachet Roll', quantity: 1, unitCost: 5 }, products)?.id).toBe('p2');
    expect(matchInvoiceLine({ name: 'Golden Penny Flour', quantity: 1, unitCost: 5 }, products)?.id).toBe('p1');
  });

  it('returns null when nothing matches', () => {
    expect(matchInvoiceLine({ name: 'Unknown Item XYZ', quantity: 1, unitCost: 5 }, products)).toBeNull();
    expect(matchInvoiceLine({ name: '', quantity: 1, unitCost: 5 }, products)).toBeNull();
  });
});

describe('matchInvoiceSupplier', () => {
  const suppliers = [{ id: 's1', name: 'DN Tyre Distributors' }];

  it('matches exact and partial supplier names', () => {
    expect(matchInvoiceSupplier('DN Tyre Distributors', suppliers)?.id).toBe('s1');
    expect(matchInvoiceSupplier('dn tyre', suppliers)?.id).toBe('s1');
  });

  it('returns null for blank or unknown names', () => {
    expect(matchInvoiceSupplier(undefined, suppliers)).toBeNull();
    expect(matchInvoiceSupplier('  ', suppliers)).toBeNull();
    expect(matchInvoiceSupplier('Nobody Ltd', suppliers)).toBeNull();
  });
});
