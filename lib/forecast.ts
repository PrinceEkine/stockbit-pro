/**
 * Demand forecasting from on-hand sales history. Pure math, works offline:
 * sales velocity per product, days of stock left, and a suggested reorder
 * quantity that covers supplier lead time plus a review buffer.
 */

export interface ForecastRow {
  productId: string;
  productName: string;
  sku: string;
  onHand: number;
  unitsSold: number;
  avgDaily: number;
  /** Days until stockout at current velocity; Infinity when nothing sells. */
  daysLeft: number;
  suggestedOrder: number;
  status: 'out' | 'critical' | 'low' | 'ok';
}

interface ForecastInput {
  id: string;
  name: string;
  sku: string;
  quantity: number;
}

interface SaleInput {
  date: string;
  items: { productId: string; quantity: number }[];
}

export const FORECAST_WINDOW_DAYS = 30;
export const LEAD_TIME_DAYS = 7;
export const REVIEW_BUFFER_DAYS = 7;

const statusRank = (s: ForecastRow['status']): number =>
  s === 'out' ? 0 : s === 'critical' ? 1 : s === 'low' ? 2 : 3;

export const forecastDemand = (
  products: ForecastInput[],
  sales: SaleInput[],
  nowMs: number = Date.now(),
): ForecastRow[] => {
  const windowStart = nowMs - FORECAST_WINDOW_DAYS * 24 * 60 * 60 * 1000;
  const soldByProduct = new Map<string, number>();

  for (const sale of sales) {
    const t = new Date(sale.date).getTime();
    if (Number.isNaN(t) || t < windowStart || t > nowMs) continue;
    for (const item of sale.items || []) {
      soldByProduct.set(item.productId, (soldByProduct.get(item.productId) || 0) + item.quantity);
    }
  }

  return products.map((p) => {
    const unitsSold = soldByProduct.get(p.id) || 0;
    const avgDaily = unitsSold / FORECAST_WINDOW_DAYS;
    const daysLeft = avgDaily > 0 ? p.quantity / avgDaily : Number.POSITIVE_INFINITY;
    const coverTarget = Math.ceil(avgDaily * (LEAD_TIME_DAYS + REVIEW_BUFFER_DAYS));
    const suggestedOrder = Math.max(0, coverTarget - p.quantity);
    const status: ForecastRow['status'] =
      p.quantity <= 0 ? 'out'
      : daysLeft <= LEAD_TIME_DAYS ? 'critical'
      : daysLeft <= LEAD_TIME_DAYS + REVIEW_BUFFER_DAYS ? 'low'
      : 'ok';
    return {
      productId: p.id,
      productName: p.name,
      sku: p.sku,
      onHand: p.quantity,
      unitsSold,
      avgDaily: Math.round(avgDaily * 100) / 100,
      daysLeft: daysLeft === Number.POSITIVE_INFINITY ? daysLeft : Math.round(daysLeft * 10) / 10,
      suggestedOrder,
      status,
    };
  }).sort((a, b) => statusRank(a.status) - statusRank(b.status) || (a.daysLeft - b.daysLeft || 0));
};
