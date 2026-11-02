/**
 * Builds a small, bounded digest of sales history for natural-language
 * questions ("what sold best this week?"). The digest — not raw rows — is
 * what gets sent to the AI, so prompts stay cheap and bounded.
 */

export interface ReportDigest {
  generatedAt: string;
  totals: { revenue: number; sales: number; items: number; avgTicket: number };
  last14Days: { date: string; revenue: number; sales: number }[];
  topProducts: { name: string; qty: number; revenue: number }[];
  paymentMix: { method: string; count: number; revenue: number }[];
}

interface DigestSale {
  date: string;
  total_price: number;
  payment_method: string;
  items: { productName: string; quantity: number; price: number }[];
}

/** Caps keep the AI prompt small no matter how long the history grows. */
export const DIGEST_SALES_WINDOW = 100;
export const DIGEST_TOP_PRODUCTS = 10;

export const buildReportDigest = (sales: DigestSale[], nowMs: number = Date.now()): ReportDigest => {
  const recent = [...sales]
    .filter((s) => !Number.isNaN(new Date(s.date).getTime()))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, DIGEST_SALES_WINDOW);

  const totals = {
    revenue: 0,
    sales: sales.length,
    items: 0,
    avgTicket: 0,
  };
  for (const s of sales) {
    totals.revenue += s.total_price || 0;
    for (const i of s.items || []) totals.items += i.quantity || 0;
  }
  totals.avgTicket = totals.sales > 0 ? Math.round((totals.revenue / totals.sales) * 100) / 100 : 0;
  totals.revenue = Math.round(totals.revenue * 100) / 100;

  const dayMap = new Map<string, { revenue: number; sales: number }>();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(nowMs - i * 24 * 60 * 60 * 1000);
    dayMap.set(d.toISOString().split('T')[0], { revenue: 0, sales: 0 });
  }
  for (const s of sales) {
    const key = new Date(s.date).toISOString().split('T')[0];
    const bucket = dayMap.get(key);
    if (bucket) {
      bucket.revenue += s.total_price || 0;
      bucket.sales += 1;
    }
  }
  const last14Days = [...dayMap.entries()].map(([date, v]) => ({
    date,
    revenue: Math.round(v.revenue * 100) / 100,
    sales: v.sales,
  }));

  const productMap = new Map<string, { qty: number; revenue: number }>();
  const payMap = new Map<string, { count: number; revenue: number }>();
  for (const s of recent) {
    const pay = payMap.get(s.payment_method) || { count: 0, revenue: 0 };
    pay.count += 1;
    pay.revenue += s.total_price || 0;
    payMap.set(s.payment_method, pay);
    for (const i of s.items || []) {
      const p = productMap.get(i.productName) || { qty: 0, revenue: 0 };
      p.qty += i.quantity || 0;
      p.revenue += (i.quantity || 0) * (i.price || 0);
      productMap.set(i.productName, p);
    }
  }
  const topProducts = [...productMap.entries()]
    .map(([name, v]) => ({ name, qty: v.qty, revenue: Math.round(v.revenue * 100) / 100 }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, DIGEST_TOP_PRODUCTS);
  const paymentMix = [...payMap.entries()]
    .map(([method, v]) => ({ method, count: v.count, revenue: Math.round(v.revenue * 100) / 100 }))
    .sort((a, b) => b.revenue - a.revenue);

  return { generatedAt: new Date(nowMs).toISOString(), totals, last14Days, topProducts, paymentMix };
};
