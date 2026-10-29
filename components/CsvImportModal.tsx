import React, { useState } from 'react';
import { X, Upload, Download, AlertCircle, CheckCircle2, FileText, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { parseCsvText, downloadCsv } from '../lib/csv';

export interface ImportColumn {
  key: string;
  label: string;
  required?: boolean;
  parse?: (raw: string) => { value?: unknown; error?: string };
}

interface CsvImportModalProps {
  title: string;
  description: string;
  templateFilename: string;
  columns: ImportColumn[];
  /** Return a reason to skip this row (e.g. duplicate), or null to keep it. */
  skipCheck?: (row: Record<string, unknown>) => string | null;
  onImport: (rows: Record<string, unknown>[]) => Promise<number>;
  onClose: () => void;
}

interface ParsedRow {
  rowNumber: number;
  data: Record<string, unknown>;
  error: string | null;
  skipped: string | null;
}

const CsvImportModal: React.FC<CsvImportModalProps> = ({
  title, description, templateFilename, columns, skipCheck, onImport, onClose
}) => {
  const [fileName, setFileName] = useState('');
  const [fileError, setFileError] = useState('');
  const [parsed, setParsed] = useState<ParsedRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ imported: number; skipped: number; invalid: number } | null>(null);

  const downloadTemplate = () => {
    downloadCsv(templateFilename, [columns.map((c) => c.label)]);
  };

  const handleFile = async (file: File | undefined) => {
    setFileError('');
    setParsed([]);
    setResult(null);
    if (!file) return;
    setFileName(file.name);
    const text = await file.text();
    const rows = parseCsvText(text);
    if (rows.length < 2) {
      setFileError('This file has no data rows. Download the template to see the expected format.');
      return;
    }
    const headers = rows[0].map((h) => h.trim().toLowerCase());
    const missing = columns.filter((c) => c.required && !headers.includes(c.label.toLowerCase()) && !headers.includes(c.key.toLowerCase()));
    if (missing.length > 0) {
      setFileError(`Missing required column${missing.length === 1 ? '' : 's'}: ${missing.map((c) => c.label).join(', ')}`);
      return;
    }
    const colIndex = columns.map((c) => {
      const i = headers.indexOf(c.label.toLowerCase());
      return i >= 0 ? i : headers.indexOf(c.key.toLowerCase());
    });

    const out: ParsedRow[] = [];
    for (let r = 1; r < rows.length; r++) {
      const cells = rows[r];
      const data: Record<string, unknown> = {};
      let error: string | null = null;
      columns.forEach((col, ci) => {
        const raw = (colIndex[ci] >= 0 ? cells[colIndex[ci]] : '') ?? '';
        if (col.required && raw.trim() === '') {
          error = error || `${col.label} is required`;
          return;
        }
        if (col.parse) {
          const res = col.parse(raw);
          if (res.error) error = error || `${col.label}: ${res.error}`;
          else data[col.key] = res.value;
        } else {
          data[col.key] = raw.trim();
        }
      });
      out.push({ rowNumber: r + 1, data, error, skipped: !error && skipCheck ? skipCheck(data) : null });
    }
    setParsed(out);
  };

  const validRows = parsed.filter((p) => !p.error && !p.skipped);
  const invalidRows = parsed.filter((p) => p.error);
  const skippedRows = parsed.filter((p) => !p.error && p.skipped);

  const handleImport = async () => {
    setImporting(true);
    try {
      const imported = await onImport(validRows.map((p) => p.data));
      setResult({ imported, skipped: skippedRows.length, invalid: invalidRows.length });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm no-print">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-800 max-h-[90vh] flex flex-col"
      >
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">{title}</h3>
            <p className="text-sm text-slate-500 mt-1">{description}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto">
          {result ? (
            <div className="text-center py-8 space-y-4">
              <CheckCircle2 size={48} className="mx-auto text-emerald-500" />
              <div>
                <p className="text-lg font-bold text-slate-900 dark:text-white">{result.imported} row{result.imported === 1 ? '' : 's'} imported</p>
                <p className="text-sm text-slate-500 mt-1">
                  {result.skipped} skipped · {result.invalid} invalid
                </p>
              </div>
              <button onClick={onClose} className="px-8 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all">
                Done
              </button>
            </div>
          ) : (
            <>
              <div className="flex flex-col sm:flex-row gap-3">
                <label className="flex-1 cursor-pointer px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all flex items-center justify-center gap-2">
                  <Upload size={18} /> {fileName || 'Choose CSV file'}
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    className="hidden"
                    onChange={(e) => handleFile(e.target.files?.[0])}
                  />
                </label>
                <button
                  onClick={downloadTemplate}
                  className="px-6 py-3 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-sm hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                >
                  <Download size={18} /> Template
                </button>
              </div>

              {fileError && (
                <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-800 flex items-start gap-3">
                  <AlertCircle size={18} className="text-rose-500 shrink-0 mt-0.5" />
                  <p className="text-sm font-medium text-rose-700 dark:text-rose-300">{fileError}</p>
                </div>
              )}

              {parsed.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-4 text-sm font-bold">
                    <span className="flex items-center gap-1.5 text-emerald-600"><FileText size={16} /> {validRows.length} ready</span>
                    {skippedRows.length > 0 && <span className="text-amber-600">{skippedRows.length} skipped</span>}
                    {invalidRows.length > 0 && <span className="text-rose-500">{invalidRows.length} invalid</span>}
                  </div>

                  {(invalidRows.length > 0 || skippedRows.length > 0) && (
                    <div className="max-h-32 overflow-y-auto rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 p-3 space-y-1.5">
                      {invalidRows.slice(0, 20).map((p) => (
                        <p key={p.rowNumber} className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                          Row {p.rowNumber}: {p.error}
                        </p>
                      ))}
                      {skippedRows.slice(0, 20).map((p) => (
                        <p key={p.rowNumber} className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                          Row {p.rowNumber}: skipped — {p.skipped}
                        </p>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={handleImport}
                    disabled={importing || validRows.length === 0}
                    className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-600/20 hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {importing ? (<><Loader2 size={18} className="animate-spin" /> Importing…</>) : (
                      <><CheckCircle2 size={18} /> Import {validRows.length} row{validRows.length === 1 ? '' : 's'}</>
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default CsvImportModal;
