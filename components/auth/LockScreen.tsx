import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Lock, Loader2, LogOut, Eye, EyeOff, Box } from 'lucide-react';
import { User } from '../../types';
import { IDLE_LOCK_MS } from '../../lib/security';

interface LockScreenProps {
  user: User;
  /** Whether the account has a password (email provider). Google-only users re-authenticate with Google. */
  hasPassword: boolean;
  onUnlock: (password: string) => Promise<{ error?: any }>;
  onGoogleUnlock: () => Promise<void>;
  onSignOut: () => void;
}

/**
 * Tracks user activity and reports when the app has been idle long enough to lock.
 * Also locks when the tab was hidden for longer than the idle window (e.g. phone in pocket).
 */
export const useIdleLock = (enabled: boolean, idleMs: number = IDLE_LOCK_MS) => {
  const [locked, setLocked] = useState(false);
  const lastActivity = useRef(Date.now());

  useEffect(() => {
    if (!enabled) { setLocked(false); return; }

    const bump = () => { lastActivity.current = Date.now(); };
    const events: (keyof WindowEventMap)[] = ['mousemove', 'keydown', 'pointerdown', 'touchstart', 'scroll', 'wheel'];
    events.forEach(e => window.addEventListener(e, bump, { passive: true }));

    const check = () => {
      if (Date.now() - lastActivity.current >= idleMs) setLocked(true);
    };
    const interval = window.setInterval(check, 15_000);
    const onVisibility = () => { if (document.visibilityState === 'visible') check(); };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      events.forEach(e => window.removeEventListener(e, bump));
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [enabled, idleMs]);

  const unlock = () => { lastActivity.current = Date.now(); setLocked(false); };
  return { locked, unlock };
};

const LockScreen: React.FC<LockScreenProps> = ({ user, hasPassword, onUnlock, onGoogleUnlock, onSignOut }) => {
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    setBusy(true);
    setError('');
    try {
      const { error } = await onUnlock(password);
      if (error) setError('Incorrect password.');
    } catch {
      setError('Could not verify. Check your connection.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-2xl">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 26 }}
        className="w-full max-w-sm surface rounded-[2rem] p-8 text-center"
        role="dialog"
        aria-modal="true"
        aria-labelledby="lock-title"
      >
        <div className="mx-auto w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-glow mb-5">
          <Lock size={24} />
        </div>
        <h2 id="lock-title" className="font-display text-xl font-semibold text-slate-900 dark:text-white">Session locked</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">
          For your protection, StockBit locked after a period of inactivity.
        </p>

        <div className="mt-6 flex items-center gap-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-white/10 px-4 py-3 text-left">
          <div className="w-9 h-9 rounded-xl bg-indigo-600/10 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-semibold">
            {user.name?.charAt(0) || <Box size={16} />}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{user.name}</p>
            <p className="text-xs text-slate-500 truncate">{user.email}</p>
          </div>
        </div>

        {hasPassword ? (
          <form onSubmit={submit} className="mt-5 space-y-3">
            <div className="relative">
              <input
                ref={inputRef}
                type={show ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="input-premium pr-12"
              />
              <button type="button" onClick={() => setShow(s => !s)} aria-label="Toggle password visibility" className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white">
                {show ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {error && <p className="text-xs font-medium text-rose-600 dark:text-rose-400">{error}</p>}
            <button type="submit" disabled={busy || !password} className="btn-primary w-full">
              {busy ? <Loader2 size={18} className="animate-spin" /> : <Lock size={16} />} Unlock
            </button>
          </form>
        ) : (
          <button type="button" onClick={onGoogleUnlock} className="btn-primary w-full mt-5">Re-authenticate with Google</button>
        )}

        <button type="button" onClick={onSignOut} className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-rose-600 transition-colors">
          <LogOut size={14} /> Sign out instead
        </button>
      </motion.div>
    </div>
  );
};

export default LockScreen;
