import { describe, it, expect } from 'vitest';
import { buildReportDigest, DIGEST_TOP_PRODUCTS } from '../reportQuery';

const NOW = new Date('2026-11-02T12:00:00Z').getTime();
const daysAgo = (n: number) => new Date(NOW - n * 24 * 60 * 60 * 1000).toISOString();

const sale = (date: string, total: number, method: string, items: { productName: string; quantity: number; price: number }[]) => ({
  date,
  total_price: total,
  payment_method: method,
  items,
});

describe('buildReportDigest', () => {
  it('totals revenue, items and average ticket across all sales', () => {
    const sales = [
      sale(daysAgo(1), 1000, 'cash', [{ productName: 'A', quantity: 2, price: 500 }]),
      sale(daysAgo(2), 500, 'transfer', [{ productName: 'B', quantity: 1, price: 500 }]),
    ];
    const d = buildReportDigest(sales, NOW);
    expect(d.totals).toEqual({ revenue: 1500, sales: 2, items: 3, avgTicket: 750 });
    expect(d.topProducts[0]).toEqual({ name: 'A', qty: 2, revenue: 1000 });
    expect(d.paymentMix).toHaveLength(2);
  });

  it('buckets the last 14 days including empty ones', () => {
    const d = buildReportDigest([sale(daysAgo(1), 100, 'cash', [])], NOW);
    expect(d.last14Days).toHaveLength(14);
    expect(d.last14Days[13].sales).toBe(0);
    expect(d.last14Days[12].sales).toBe(1);
    expect(d.last14Days[12].revenue).toBe(100);
  });

  it('caps top products no matter how many distinct items sold', () => {
    const sales = Array.from({ length: 30 }, (_, i) =>
      sale(daysAgo(1), 10, 'cash', [{ productName: `Item-${i}`, quantity: 1, price: 10 }]));
    const d = buildReportDigest(sales, NOW);
    expect(d.topProducts).toHaveLength(DIGEST_TOP_PRODUCTS);
  });

  it('handles an empty history without NaN', () => {
    const d = buildReportDigest([], NOW);
    expect(d.totals.avgTicket).toBe(0);
    expect(d.topProducts).toEqual([]);
    expect(d.last14Days).toHaveLength(14);
  });
});
