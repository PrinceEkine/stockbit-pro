
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { KeyRound, Eye, EyeOff, Loader2, ShieldCheck, X } from 'lucide-react';

interface PasswordResetModalProps {
  onUpdate: (password: string) => Promise<{ error: any }>;
  onClose: () => void;
}

const PasswordResetModal: React.FC<PasswordResetModalProps> = ({ onUpdate, onClose }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error: updateError } = await onUpdate(password);
      if (updateError) {
        setError(updateError.message);
      } else {
        alert('Password updated successfully!');
        onClose();
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
        onClick={onClose}
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 md:p-12 shadow-2xl border border-slate-100 dark:border-slate-800"
      >
        <button 
          onClick={onClose}
          className="absolute top-8 right-8 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
        >
          <X size={24} />
        </button>

        <div className="flex flex-col items-center text-center mb-10">
          <div className="w-16 h-16 bg-indigo-600/10 text-indigo-600 rounded-2xl flex items-center justify-center mb-6">
            <KeyRound size={32} />
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Securing Access</h2>
          <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-2">Enter your new terminal password</p>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800 rounded-2xl text-rose-600 dark:text-rose-400 text-[11px] font-black uppercase tracking-tight text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-[11px] font-black tracking-[0.2em] text-slate-400 uppercase mb-3 ml-1">New Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-8 py-5 bg-slate-50 dark:bg-slate-800 rounded-[1.8rem] font-bold text-slate-900 dark:text-white border-2 border-transparent focus:border-indigo-600/20 outline-none transition-all"
                placeholder="••••••••"
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-black tracking-[0.2em] text-slate-400 uppercase mb-3 ml-1">Confirm New Password</label>
            <input
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full px-8 py-5 bg-slate-50 dark:bg-slate-800 rounded-[1.8rem] font-bold text-slate-900 dark:text-white border-2 border-transparent focus:border-indigo-600/20 outline-none transition-all"
              placeholder="••••••••"
            />
          </div>

          <button 
            disabled={isSubmitting}
            type="submit"
            className="w-full py-6 bg-indigo-600 text-white font-black uppercase tracking-[0.2em] text-[13px] rounded-[2rem] shadow-xl hover:bg-indigo-700 active:scale-[0.98] transition-all flex items-center justify-center gap-4"
          >
            {isSubmitting ? (
              <Loader2 className="animate-spin" size={22} />
            ) : (
              <ShieldCheck size={22} />
            )}
            {isSubmitting ? 'UPDATING...' : 'UPDATE PASSWORD'}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default PasswordResetModal;
