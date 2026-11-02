/**
 * Matches scanned invoice lines to catalogue products (by SKU, then by name)
 * and the invoice supplier to a known supplier, so a scanned invoice can
 * prefill a draft purchase order.
 */

export interface MatchableProduct {
  id: string;
  name: string;
  sku: string;
}

export interface MatchableSupplier {
  id: string;
  name: string;
}

export interface InvoiceLineInput {
  name: string;
  sku?: string;
  quantity: number;
  unitCost: number;
}

const normalize = (v: string): string => v.toLowerCase().replace(/\s+/g, ' ').trim();

export const matchInvoiceLine = (
  line: InvoiceLineInput,
  products: MatchableProduct[],
): MatchableProduct | null => {
  const sku = (line.sku || '').trim();
  if (sku) {
    const bySku = products.find((p) => (p.sku || '').trim().toLowerCase() === sku.toLowerCase());
    if (bySku) return bySku;
  }
  const name = normalize(line.name);
  if (!name) return null;
  return (
    products.find((p) => normalize(p.name) === name)
    || products.find((p) => {
      const candidate = normalize(p.name);
      return candidate.includes(name) || name.includes(candidate);
    })
    || null
  );
};

export const matchInvoiceSupplier = (
  name: string | undefined,
  suppliers: MatchableSupplier[],
): MatchableSupplier | null => {
  const needle = normalize(name || '');
  if (!needle) return null;
  return (
    suppliers.find((s) => normalize(s.name) === needle)
    || suppliers.find((s) => {
      const candidate = normalize(s.name);
      return candidate.includes(needle) || needle.includes(candidate);
    })
    || null
  );
};
