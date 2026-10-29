// RFC-4180 CSV helpers: proper quoting/escaping for export, and a small
// quote-aware parser for import (commas, quotes, and newlines inside fields).

const escapeCell = (value: unknown): string => {
  const s = value === null || value === undefined ? '' : String(value);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export const rowsToCsv = (rows: unknown[][]): string =>
  rows.map((row) => row.map(escapeCell).join(',')).join('\r\n');

export function downloadCsv(filename: string, rows: unknown[][]): void {
  // BOM so Excel opens UTF-8 (e.g. ₦) correctly.
  const blob = new Blob(['﻿' + rowsToCsv(rows)], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/** Parses CSV text into rows of fields. Handles quoted fields, "" escapes, CRLF. */
export function parseCsvText(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  const s = text.replace(/^﻿/, '');
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inQuotes) {
      if (c === '"') {
        if (s[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      row.push(field);
      field = '';
    } else if (c === '\n') {
      row.push(field);
      field = '';
      rows.push(row);
      row = [];
    } else if (c === '\r') {
      // skip — \n terminates the row
    } else {
      field += c;
    }
  }
  if (field !== '' || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => !(r.length === 1 && r[0].trim() === ''));
}

export const parseCsvNumber = (raw: string, fallback = 0): { value?: number; error?: string } => {
  const t = raw.trim().replace(/,/g, '');
  if (t === '') return { value: fallback };
  const n = Number(t);
  if (!Number.isFinite(n)) return { error: `"${raw}" is not a number` };
  return { value: n };
};

export const parseCsvDate = (raw: string): { value?: string; error?: string } => {
  const t = raw.trim();
  if (t === '') return { value: '' };
  const ms = Date.parse(t);
  if (Number.isNaN(ms)) return { error: `"${raw}" is not a date` };
  return { value: new Date(ms).toISOString().split('T')[0] };
};
