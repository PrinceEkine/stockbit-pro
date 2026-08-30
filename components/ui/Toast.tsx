import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from 'lucide-react';

type ToastKind = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: number;
  kind: ToastKind;
  title: string;
  description?: string;
}

interface ToastApi {
  toast: (kind: ToastKind, title: string, description?: string) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
  warning: (title: string, description?: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

const ICONS: Record<ToastKind, React.ReactNode> = {
  success: <CheckCircle2 size={18} className="text-emerald-500" />,
  error: <XCircle size={18} className="text-rose-500" />,
  info: <Info size={18} className="text-indigo-500" />,
  warning: <AlertTriangle size={18} className="text-amber-500" />,
};

const ACCENT: Record<ToastKind, string> = {
  success: 'before:bg-emerald-500',
  error: 'before:bg-rose-500',
  info: 'before:bg-indigo-500',
  warning: 'before:bg-amber-500',
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counter = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = useCallback((kind: ToastKind, title: string, description?: string) => {
    const id = ++counter.current;
    setToasts(prev => [...prev.slice(-3), { id, kind, title, description }]);
    window.setTimeout(() => dismiss(id), kind === 'error' ? 7000 : 4500);
  }, [dismiss]);

  const api = useMemo<ToastApi>(() => ({
    toast,
    success: (t, d) => toast('success', t, d),
    error: (t, d) => toast('error', t, d),
    info: (t, d) => toast('info', t, d),
    warning: (t, d) => toast('warning', t, d),
  }), [toast]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        className="no-print fixed z-[200] top-[calc(env(safe-area-inset-top)+1rem)] right-4 left-4 sm:left-auto sm:w-[380px] flex flex-col gap-3 pointer-events-none"
      >
        <AnimatePresence initial={false}>
          {toasts.map(t => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: -12, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className={`pointer-events-auto relative overflow-hidden rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-elevated px-4 py-3.5 flex items-start gap-3 before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 ${ACCENT[t.kind]}`}
            >
              <div className="mt-0.5 shrink-0">{ICONS[t.kind]}</div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-900 dark:text-white leading-snug">{t.title}</p>
                {t.description && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{t.description}</p>}
              </div>
              <button onClick={() => dismiss(t.id)} aria-label="Dismiss" className="shrink-0 p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastApi => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Safe fallback so components can be rendered outside the provider (tests, previews).
    const noop = () => {};
    return { toast: noop, success: noop, error: noop, info: noop, warning: noop };
  }
  return ctx;
};
