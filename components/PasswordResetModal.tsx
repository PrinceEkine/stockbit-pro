import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { KeyRound, Eye, EyeOff, Loader2, ShieldCheck, X, Lock } from 'lucide-react';
import { checkPassword, PASSWORD_MIN_LENGTH } from '../lib/security';
import { useToast } from './ui/Toast';

interface PasswordResetModalProps {
  onUpdate: (password: string) => Promise<{ error?: any }>;
  onClose: () => void;
}

const PasswordResetModal: React.FC<PasswordResetModalProps> = ({ onUpdate, onClose }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const toast = useToast();
  const strength = useMemo(() => checkPassword(password), [password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!strength.valid) {
      setError(`Password needs: ${strength.unmet.join(', ').toLowerCase()}.`);
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error: updateError } = await onUpdate(password);
      if (updateError) {
        setError(updateError.message);
      } else {
        toast.success('Password updated', 'Other devices have been signed out.');
        onClose();
      }
    } catch {
      setError('An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const barColor = ['bg-slate-200', 'bg-rose-500', 'bg-amber-500', 'bg-emerald-500', 'bg-emerald-600'][strength.score];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-md"
        onClick={onClose}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
        className="relative w-full max-w-md surface rounded-[2rem] p-7 sm:p-9"
        role="dialog"
        aria-modal="true"
      >
        <button onClick={onClose} aria-label="Close" className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
          <X size={18} />
        </button>

        <div className="mb-7">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 text-indigo-600 dark:text-indigo-300 flex items-center justify-center mb-4">
            <KeyRound size={22} />
          </div>
          <h2 className="font-display text-xl font-semibold text-slate-900 dark:text-white">Set a new password</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">At least {PASSWORD_MIN_LENGTH} characters with upper &amp; lower case letters and a number.</p>
        </div>

        {error && (
          <div role="alert" className="mb-5 rounded-2xl border border-rose-200 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-500/10 px-4 py-3 text-sm font-medium text-rose-700 dark:text-rose-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[13px] font-semibold text-slate-700 dark:text-slate-200">New password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="input-premium pl-11 pr-12"
                placeholder="Create a strong password"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label="Toggle visibility" className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {password && (
              <div className="flex items-center gap-1.5 pt-1">
                {[1, 2, 3, 4].map(i => <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= strength.score ? barColor : 'bg-slate-200 dark:bg-slate-700'}`} />)}
                <span className="text-[11px] font-semibold text-slate-500 ml-2 w-16 text-right">{strength.label}</span>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-[13px] font-semibold text-slate-700 dark:text-slate-200">Confirm new password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="input-premium pl-11"
                placeholder="Repeat your password"
              />
            </div>
          </div>

          <button disabled={isSubmitting} type="submit" className="btn-primary w-full mt-2">
            {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <ShieldCheck size={18} />}
            {isSubmitting ? 'Updating…' : 'Update password'}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default PasswordResetModal;
