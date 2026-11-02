import { describe, it, expect } from 'vitest';
import { forecastDemand } from '../forecast';

const NOW = new Date('2026-11-02T12:00:00Z').getTime();
const daysAgo = (n: number) => new Date(NOW - n * 24 * 60 * 60 * 1000).toISOString();

describe('forecastDemand', () => {
  const products = [
    { id: 'p1', name: 'Fast Seller', sku: 'F1', quantity: 10 },
    { id: 'p2', name: 'Slow Mover', sku: 'S1', quantity: 100 },
    { id: 'p3', name: 'Empty Shelf', sku: 'E1', quantity: 0 },
  ];

  it('computes velocity, days left and a cover-based reorder suggestion', () => {
    // 60 units over the last 30 days = 2/day; 10 on hand = 5 days left.
    const sales = [
      { date: daysAgo(5), items: [{ productId: 'p1', quantity: 30 }] },
      { date: daysAgo(20), items: [{ productId: 'p1', quantity: 30 }] },
    ];
    const [row] = forecastDemand([products[0]], sales, NOW);
    expect(row.unitsSold).toBe(60);
    expect(row.avgDaily).toBe(2);
    expect(row.daysLeft).toBe(5);
    expect(row.status).toBe('critical');
    // Cover 14 days (28 units) minus 10 on hand = order 18.
    expect(row.suggestedOrder).toBe(18);
  });

  it('ignores sales outside the 30-day window', () => {
    const sales = [{ date: daysAgo(45), items: [{ productId: 'p1', quantity: 999 }] }];
    const [row] = forecastDemand([products[0]], sales, NOW);
    expect(row.unitsSold).toBe(0);
    expect(row.status).toBe('ok');
    expect(row.suggestedOrder).toBe(0);
  });

  it('flags out-of-stock and sorts riskiest first', () => {
    const sales = [{ date: daysAgo(2), items: [{ productId: 'p2', quantity: 3 }] }];
    const rows = forecastDemand(products, sales, NOW);
    expect(rows[0].productId).toBe('p3');
    expect(rows[0].status).toBe('out');
    expect(rows.find((r) => r.productId === 'p2')?.status).toBe('ok');
  });
});
