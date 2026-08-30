import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Box, Eye, EyeOff, Loader2, ShieldAlert, ArrowLeft, Mail, KeyRound, MailCheck,
  Lock, ShieldCheck, Fingerprint, Sparkles, Check, Users, Building2, Ticket, Info, Loader2 as Spinner, XCircle
} from 'lucide-react';
import { checkPassword, PASSWORD_MIN_LENGTH, isValidEmail, isInviteCode, normalizeInviteCode, loginLockSeconds, recordLoginFailure, clearLoginFailures } from '../../lib/security';

export type AuthStep = 'login' | 'register' | 'forgot' | 'verify_otp' | 'update_password';

interface AuthScreenProps {
  step: AuthStep;
  onStepChange: (step: AuthStep) => void;
  onBackToSite: () => void;
  onLogin: (email: string, password: string) => Promise<{ error?: any }>;
  onRegister: (data: { email: string; password: string; name: string; companyName?: string; inviteCode?: string | null }) => Promise<{ error?: any }>;
  onPreviewInvite: (code: string) => Promise<{ valid: boolean; companyName?: string; reason?: string }>;
  /** Pre-filled from a /#join=CODE link. */
  initialInviteCode?: string;
  onGoogle: () => Promise<void>;
  onForgot: (email: string) => Promise<{ error?: any }>;
  onUpdatePassword: (password: string) => Promise<{ error?: any }>;
  pendingEmail: string;
  setPendingEmail: (email: string) => void;
}

const GoogleMark = () => (
  <svg className="w-[18px] h-[18px] shrink-0" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#EA4335" d="M12 5.04c1.64 0 3.12.56 4.28 1.67l3.2-3.2C17.52 1.58 14.93 1 12 1 7.35 1 3.37 3.65 1.41 7.51l3.79 2.94C6.12 7.51 8.85 5.04 12 5.04z" />
    <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.34H12v4.44h6.44c-.28 1.47-1.11 2.71-2.36 3.55l3.66 2.84c2.14-1.97 3.39-4.88 3.39-8.49z" />
    <path fill="#FBBC05" d="M5.2 14.51c-.24-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29L1.41 6.99C.51 8.79 0 10.82 0 13s.51 4.21 1.41 6.01l3.79-2.5z" />
    <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.92l-3.66-2.84c-1.1.74-2.51 1.18-4.3 1.18-3.15 0-5.88-2.47-6.8-5.41L1.41 15.95C3.37 19.81 7.35 23 12 23z" />
  </svg>
);

const Field: React.FC<{
  label: string; hint?: string; error?: string; children: React.ReactNode; right?: React.ReactNode;
}> = ({ label, hint, error, children, right }) => (
  <div className="space-y-1.5">
    <div className="flex items-center justify-between">
      <label className="text-[13px] font-semibold text-slate-700 dark:text-slate-200">{label}</label>
      {right}
    </div>
    {children}
    {error ? (
      <p className="text-xs font-medium text-rose-600 dark:text-rose-400">{error}</p>
    ) : hint ? (
      <p className="text-xs text-slate-500 dark:text-slate-400">{hint}</p>
    ) : null}
  </div>
);

const PasswordStrength: React.FC<{ password: string; context: string[] }> = ({ password, context }) => {
  const result = useMemo(() => checkPassword(password, context), [password, context]);
  if (!password) return null;
  const colors = ['bg-slate-200', 'bg-rose-500', 'bg-amber-500', 'bg-emerald-500', 'bg-emerald-600'];
  return (
    <div className="space-y-2 pt-1">
      <div className="flex items-center gap-1.5">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${i <= result.score ? colors[result.score] : 'bg-slate-200 dark:bg-slate-700'}`} />
        ))}
        <span className={`text-[11px] font-semibold ml-2 w-16 text-right ${result.score >= 3 ? 'text-emerald-600 dark:text-emerald-400' : result.score === 2 ? 'text-amber-600' : 'text-rose-600'}`}>{result.label}</span>
      </div>
      {result.unmet.length > 0 && (
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
          {result.unmet.map(u => (
            <li key={u} className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-slate-400" /> {u}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const PasswordInput: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { show: boolean; onToggle: () => void }> = ({ show, onToggle, className, ...rest }) => (
  <div className="relative">
    <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
    <input {...rest} type={show ? 'text' : 'password'} className={`input-premium pl-11 pr-12 ${className || ''}`} />
    <button type="button" onClick={onToggle} aria-label={show ? 'Hide password' : 'Show password'} className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
      {show ? <EyeOff size={18} /> : <Eye size={18} />}
    </button>
  </div>
);

const BrandPanel: React.FC = () => (
  <aside className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-slate-950 text-white p-12 xl:p-16">
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute -top-40 -left-32 w-[560px] h-[560px] rounded-full bg-indigo-600/30 blur-[140px]" />
      <div className="absolute bottom-[-200px] right-[-120px] w-[520px] h-[520px] rounded-full bg-sky-500/20 blur-[140px]" />
      <div className="absolute inset-0 bg-grid opacity-40 [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_75%)]" />
    </div>

    <div className="relative z-10 flex items-center gap-3">
      <div className="w-11 h-11 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-glow"><Box size={22} /></div>
      <div>
        <p className="font-display font-semibold text-lg leading-none">StockBit Pro</p>
        <p className="text-[11px] text-slate-400 mt-1 tracking-wide">Inventory · POS · Insights</p>
      </div>
    </div>

    <div className="relative z-10 max-w-md space-y-8">
      <h2 className="font-display text-4xl xl:text-5xl font-semibold leading-[1.05] tracking-tight">
        Run your shop with <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-sky-300 to-emerald-300">bank-grade</span> confidence.
      </h2>
      <p className="text-slate-400 text-[15px] leading-relaxed">
        Real-time stock, staff terminals and AI forecasting — protected by row-level security, verified payments and encrypted sessions.
      </p>
      <ul className="space-y-3.5">
        {[
          { icon: ShieldCheck, text: 'Per-business data isolation enforced in the database' },
          { icon: Fingerprint, text: 'Google sign-in and verified email accounts' },
          { icon: Sparkles, text: 'AI insights served through a secured gateway' },
        ].map(({ icon: Icon, text }) => (
          <li key={text} className="flex items-center gap-3 text-sm text-slate-300">
            <span className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-indigo-300"><Icon size={16} /></span>
            {text}
          </li>
        ))}
      </ul>
    </div>

    <div className="relative z-10 flex items-center gap-6 text-[11px] text-slate-500">
      <span className="flex items-center gap-1.5"><Lock size={12} /> TLS 1.3 encrypted</span>
      <span className="flex items-center gap-1.5"><ShieldCheck size={12} /> RLS-protected</span>
      <span>© {new Date().getFullYear()} StockBit Technologies</span>
    </div>
  </aside>
);

const AuthScreen: React.FC<AuthScreenProps> = ({
  step, onStepChange, onBackToSite, onLogin, onRegister, onGoogle, onForgot, onUpdatePassword, onPreviewInvite, initialInviteCode, pendingEmail, setPendingEmail
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [lockSeconds, setLockSeconds] = useState(loginLockSeconds());
  const [isStaffSignup, setIsStaffSignup] = useState(!!initialInviteCode);

  // Controlled values needed for live validation
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [inviteCode, setInviteCode] = useState(initialInviteCode || '');
  const [invitePreview, setInvitePreview] = useState<{ state: 'idle' | 'checking' | 'valid' | 'invalid'; companyName?: string; reason?: string }>({ state: 'idle' });
  const [forgotSent, setForgotSent] = useState(false);

  useEffect(() => {
    setFormError('');
    setFieldErrors({});
    setShowPassword(false);
    setPassword('');
    setConfirm('');
    setForgotSent(false);
  }, [step]);

  useEffect(() => {
    if (lockSeconds <= 0) return;
    const id = window.setInterval(() => setLockSeconds(loginLockSeconds()), 1000);
    return () => window.clearInterval(id);
  }, [lockSeconds]);

  // Live check of the invite code so the joiner sees which business they're joining.
  useEffect(() => {
    if (!isStaffSignup) return;
    const code = normalizeInviteCode(inviteCode);
    if (!isInviteCode(code)) { setInvitePreview({ state: 'idle' }); return; }
    let cancelled = false;
    setInvitePreview({ state: 'checking' });
    const t = window.setTimeout(async () => {
      try {
        const res = await onPreviewInvite(code);
        if (!cancelled) setInvitePreview(res.valid ? { state: 'valid', companyName: res.companyName } : { state: 'invalid', companyName: res.companyName, reason: res.reason });
      } catch {
        if (!cancelled) setInvitePreview({ state: 'invalid', reason: 'Could not check this code right now.' });
      }
    }, 350);
    return () => { cancelled = true; window.clearTimeout(t); };
  }, [inviteCode, isStaffSignup, onPreviewInvite]);

  const titles: Record<AuthStep, { title: string; subtitle: string }> = {
    login: { title: 'Welcome back', subtitle: 'Sign in to your shop terminal.' },
    register: { title: 'Create your account', subtitle: 'Start your 60-day free trial. No card required.' },
    forgot: { title: 'Reset your password', subtitle: 'We will email you a secure, single-use link.' },
    verify_otp: { title: 'Check your inbox', subtitle: 'One more step to activate your account.' },
    update_password: { title: 'Choose a new password', subtitle: 'Your previous sessions on other devices will be signed out.' },
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (loginLockSeconds() > 0) { setLockSeconds(loginLockSeconds()); return; }
    if (!isValidEmail(email)) { setFieldErrors({ email: 'Enter a valid email address.' }); return; }
    setSubmitting(true);
    try {
      const { error } = await onLogin(email, password);
      if (error) {
        const left = recordLoginFailure();
        setLockSeconds(loginLockSeconds());
        const msg = /confirm/i.test(error.message || '')
          ? 'Please verify your email first — check your inbox for the activation link.'
          : 'Email or password is incorrect.';
        setFormError(left > 0 && left < 3 ? `${msg} ${left} attempt${left === 1 ? '' : 's'} left before a cooldown.` : msg);
      } else {
        clearLoginFailures();
      }
    } catch {
      setFormError('Could not reach the server. Check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    const errs: Record<string, string> = {};
    if (name.trim().length < 2) errs.name = 'Enter your full name.';
    if (!isValidEmail(email)) errs.email = 'Enter a valid email address.';
    if (!isStaffSignup && company.trim().length < 2) errs.company = 'Enter your business name.';
    if (isStaffSignup) {
      if (!isInviteCode(normalizeInviteCode(inviteCode))) errs.inviteCode = 'Enter the invite code in the form SB-XXXX-XXXX.';
      else if (invitePreview.state === 'invalid') errs.inviteCode = invitePreview.reason || 'This invite code is not valid.';
    }
    const pw = checkPassword(password, [name, email]);
    if (!pw.valid) errs.password = `Password needs: ${pw.unmet.join(', ').toLowerCase()}.`;
    if (password !== confirm) errs.confirm = 'Passwords do not match.';
    setFieldErrors(errs);
    if (Object.keys(errs).length) return;

    setSubmitting(true);
    try {
      const res = await onRegister({
        email, password, name: name.trim(),
        companyName: isStaffSignup ? '' : company.trim(),
        inviteCode: isStaffSignup ? normalizeInviteCode(inviteCode) : null
      });
      if (res.error) {
        setFormError(res.error.message || 'Account creation failed.');
      } else {
        setPendingEmail(email);
        onStepChange('verify_otp');
      }
    } catch {
      setFormError('Account creation failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    setFormError('');
    setSubmitting(true);
    try {
      await onGoogle();
    } catch (err: any) {
      setFormError(err?.message || 'Google sign-in failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidEmail(email)) { setFieldErrors({ email: 'Enter a valid email address.' }); return; }
    setSubmitting(true);
    try {
      await onForgot(email);
    } finally {
      // Always show the same message so accounts cannot be enumerated.
      setForgotSent(true);
      setSubmitting(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    const pw = checkPassword(password, [pendingEmail]);
    const errs: Record<string, string> = {};
    if (!pw.valid) errs.password = `Password needs: ${pw.unmet.join(', ').toLowerCase()}.`;
    if (password !== confirm) errs.confirm = 'Passwords do not match.';
    setFieldErrors(errs);
    if (Object.keys(errs).length) return;
    setSubmitting(true);
    try {
      const { error } = await onUpdatePassword(password);
      if (error) setFormError(error.message || 'Could not update the password.');
    } catch {
      setFormError('Could not update the password.');
    } finally {
      setSubmitting(false);
    }
  };

  const GoogleButton = (
    <button type="button" disabled={submitting} onClick={handleGoogle} className="btn-secondary w-full">
      <GoogleMark /> Continue with Google
    </button>
  );

  const Divider = (
    <div className="flex items-center gap-4 my-1">
      <div className="flex-1 h-px bg-slate-200 dark:bg-white/10" />
      <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">or</span>
      <div className="flex-1 h-px bg-slate-200 dark:bg-white/10" />
    </div>
  );

  return (
    <div className="min-h-screen grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] xl:grid-cols-[5fr_6fr] bg-slate-50 dark:bg-slate-950 transition-colors">
      <BrandPanel />

      <main className="relative flex flex-col px-5 sm:px-10 py-8 sm:py-12 pt-[calc(env(safe-area-inset-top)+1.5rem)] pb-[calc(env(safe-area-inset-bottom)+2rem)]">
        <div className="absolute inset-0 lg:hidden pointer-events-none overflow-hidden">
          <div className="absolute -top-32 -right-24 w-80 h-80 rounded-full bg-indigo-500/15 blur-[90px]" />
        </div>

        <div className="relative z-10 flex items-center justify-between">
          <button onClick={onBackToSite} className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
            <ArrowLeft size={16} /> Back to site
          </button>
          <div className="lg:hidden flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white"><Box size={16} /></div>
            <span className="font-display font-semibold text-slate-900 dark:text-white">StockBit Pro</span>
          </div>
        </div>

        <div className="relative z-10 flex-1 flex items-center justify-center py-8">
          <motion.div
            layout
            className="w-full max-w-[440px] surface rounded-[2rem] p-6 sm:p-9"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
                className="space-y-6"
              >
                <header className="space-y-1.5">
                  <h1 className="font-display text-[26px] sm:text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">{titles[step].title}</h1>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{titles[step].subtitle}</p>
                </header>

                {formError && (
                  <div role="alert" className="flex items-start gap-3 rounded-2xl border border-rose-200 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-500/10 px-4 py-3 text-rose-700 dark:text-rose-300">
                    <ShieldAlert size={18} className="shrink-0 mt-0.5" />
                    <p className="text-sm font-medium leading-snug">{formError}</p>
                  </div>
                )}

                {/* ---------------- LOGIN ---------------- */}
                {step === 'login' && (
                  <form onSubmit={handleLogin} className="space-y-5" noValidate>
                    <Field label="Email" error={fieldErrors.email}>
                      <div className="relative">
                        <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        <input name="email" type="email" autoComplete="email" inputMode="email" required value={email} onChange={e => setEmail(e.target.value)} className="input-premium pl-11" placeholder="you@business.com" />
                      </div>
                    </Field>
                    <Field
                      label="Password"
                      right={<button type="button" onClick={() => onStepChange('forgot')} className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">Forgot password?</button>}
                    >
                      <PasswordInput name="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} show={showPassword} onToggle={() => setShowPassword(s => !s)} placeholder="Your password" />
                    </Field>

                    <button type="submit" disabled={submitting || lockSeconds > 0} className="btn-primary w-full">
                      {submitting ? <Loader2 size={18} className="animate-spin" /> : <KeyRound size={18} />}
                      {lockSeconds > 0 ? `Try again in ${lockSeconds}s` : submitting ? 'Signing in…' : 'Sign in'}
                    </button>

                    {Divider}
                    {GoogleButton}

                    <p className="text-center text-sm text-slate-500 dark:text-slate-400 pt-1">
                      New business?{' '}
                      <button type="button" onClick={() => onStepChange('register')} className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">Create an account</button>
                    </p>
                  </form>
                )}

                {/* ---------------- REGISTER ---------------- */}
                {step === 'register' && (
                  <form onSubmit={handleRegister} className="space-y-5" noValidate>
                    <div className="grid grid-cols-2 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80">
                      {[
                        { v: false, label: 'Shop owner', icon: Building2 },
                        { v: true, label: 'Join as staff', icon: Users },
                      ].map(({ v, label, icon: Icon }) => (
                        <button key={label} type="button" onClick={() => setIsStaffSignup(v)} className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-semibold transition-all ${isStaffSignup === v ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}>
                          <Icon size={15} /> {label}
                        </button>
                      ))}
                    </div>

                    <Field label="Full name" error={fieldErrors.name}>
                      <input name="name" autoComplete="name" required value={name} onChange={e => setName(e.target.value)} className="input-premium" placeholder="e.g. Adaeze Okafor" />
                    </Field>

                    {!isStaffSignup ? (
                      <Field label="Business name" error={fieldErrors.company}>
                        <input name="companyName" autoComplete="organization" required value={company} onChange={e => setCompany(e.target.value)} className="input-premium" placeholder="e.g. Lagos Supermart" />
                      </Field>
                    ) : (
                      <Field label="Invite code" error={fieldErrors.inviteCode} hint={invitePreview.state === 'idle' ? 'Your business owner creates this in Settings → Workforce.' : undefined}>
                        <div className="relative">
                          <Ticket size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                          <input
                            name="inviteCode" required value={inviteCode}
                            onChange={e => setInviteCode(e.target.value.toUpperCase())}
                            className="input-premium pl-11 pr-11 font-mono tracking-[0.15em] uppercase"
                            placeholder="SB-XXXX-XXXX" spellCheck={false} autoCapitalize="characters" maxLength={12}
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2">
                            {invitePreview.state === 'checking' && <Spinner size={16} className="animate-spin text-slate-400" />}
                            {invitePreview.state === 'valid' && <Check size={16} className="text-emerald-500" />}
                            {invitePreview.state === 'invalid' && <XCircle size={16} className="text-rose-500" />}
                          </span>
                        </div>
                        {invitePreview.state === 'valid' && (
                          <div className="mt-2 flex items-center gap-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200/70 dark:border-emerald-500/20 px-3 py-2.5">
                            <Building2 size={15} className="text-emerald-600 shrink-0" />
                            <p className="text-xs text-emerald-800 dark:text-emerald-300">You’re joining <span className="font-semibold">{invitePreview.companyName || 'this business'}</span> as staff.</p>
                          </div>
                        )}
                        {invitePreview.state === 'invalid' && !fieldErrors.inviteCode && (
                          <p className="mt-1.5 text-xs font-medium text-rose-600 dark:text-rose-400">{invitePreview.reason}</p>
                        )}
                      </Field>
                    )}

                    <Field label="Email" error={fieldErrors.email}>
                      <input name="email" type="email" autoComplete="email" inputMode="email" required value={email} onChange={e => setEmail(e.target.value)} className="input-premium" placeholder="you@business.com" />
                    </Field>

                    <Field label="Password" error={fieldErrors.password} hint={`At least ${PASSWORD_MIN_LENGTH} characters with upper & lower case letters and a number.`}>
                      <PasswordInput name="password" autoComplete="new-password" required value={password} onChange={e => setPassword(e.target.value)} show={showPassword} onToggle={() => setShowPassword(s => !s)} placeholder="Create a strong password" />
                      <PasswordStrength password={password} context={[name, email]} />
                    </Field>

                    <Field label="Confirm password" error={fieldErrors.confirm}>
                      <PasswordInput name="confirm" autoComplete="new-password" required value={confirm} onChange={e => setConfirm(e.target.value)} show={showPassword} onToggle={() => setShowPassword(s => !s)} placeholder="Repeat your password" />
                    </Field>

                    <button type="submit" disabled={submitting} className="btn-primary w-full">
                      {submitting ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                      {submitting ? 'Creating account…' : 'Create account'}
                    </button>

                    {Divider}
                    {GoogleButton}

                    <p className="text-[11px] leading-relaxed text-slate-400 text-center">
                      By continuing you agree to our <a href="#legal" className="underline hover:text-slate-600">Terms</a> and <a href="#privacy" className="underline hover:text-slate-600">Privacy Policy</a>.
                    </p>
                    <p className="text-center text-sm text-slate-500 dark:text-slate-400">
                      Already have an account?{' '}
                      <button type="button" onClick={() => onStepChange('login')} className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">Sign in</button>
                    </p>
                  </form>
                )}

                {/* ---------------- FORGOT ---------------- */}
                {step === 'forgot' && (
                  forgotSent ? (
                    <div className="space-y-6 text-center py-2">
                      <div className="mx-auto w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 flex items-center justify-center"><MailCheck size={30} /></div>
                      <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                        If an account exists for <span className="font-semibold text-slate-900 dark:text-white">{email}</span>, a reset link is on its way. It expires in 60 minutes.
                      </p>
                      <button type="button" onClick={() => onStepChange('login')} className="btn-primary w-full">Back to sign in</button>
                    </div>
                  ) : (
                    <form onSubmit={handleForgot} className="space-y-5" noValidate>
                      <Field label="Registered email" error={fieldErrors.email}>
                        <div className="relative">
                          <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                          <input name="email" type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} className="input-premium pl-11" placeholder="you@business.com" />
                        </div>
                      </Field>
                      <button type="submit" disabled={submitting} className="btn-primary w-full">
                        {submitting ? <Loader2 size={18} className="animate-spin" /> : <Mail size={18} />}
                        {submitting ? 'Sending…' : 'Send reset link'}
                      </button>
                      <button type="button" onClick={() => onStepChange('login')} className="w-full text-sm font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">Back to sign in</button>
                    </form>
                  )
                )}

                {/* ---------------- UPDATE PASSWORD ---------------- */}
                {step === 'update_password' && (
                  <form onSubmit={handleUpdate} className="space-y-5" noValidate>
                    <Field label="New password" error={fieldErrors.password}>
                      <PasswordInput name="password" autoComplete="new-password" required value={password} onChange={e => setPassword(e.target.value)} show={showPassword} onToggle={() => setShowPassword(s => !s)} placeholder="Create a strong password" />
                      <PasswordStrength password={password} context={[pendingEmail]} />
                    </Field>
                    <Field label="Confirm new password" error={fieldErrors.confirm}>
                      <PasswordInput name="confirm" autoComplete="new-password" required value={confirm} onChange={e => setConfirm(e.target.value)} show={showPassword} onToggle={() => setShowPassword(s => !s)} placeholder="Repeat your password" />
                    </Field>
                    <button type="submit" disabled={submitting} className="btn-primary w-full">
                      {submitting ? <Loader2 size={18} className="animate-spin" /> : <ShieldCheck size={18} />}
                      {submitting ? 'Updating…' : 'Update password'}
                    </button>
                  </form>
                )}

                {/* ---------------- VERIFY ---------------- */}
                {step === 'verify_otp' && (
                  <div className="space-y-6 text-center py-2">
                    <div className="relative mx-auto w-20 h-20">
                      <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping [animation-duration:2.5s]" />
                      <div className="relative w-full h-full rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 flex items-center justify-center border-4 border-white dark:border-slate-900 shadow-sm"><MailCheck size={34} /></div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-slate-600 dark:text-slate-300">We sent a secure activation link to</p>
                      <p className="font-semibold text-slate-900 dark:text-white break-all">{pendingEmail}</p>
                    </div>
                    <div className="flex items-start gap-3 text-left rounded-2xl border border-amber-200 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/10 px-4 py-3">
                      <Info size={16} className="text-amber-600 shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">Click the link in the email to verify your account. Can’t find it? Check your spam or promotions folder.</p>
                    </div>
                    <button type="button" onClick={() => onStepChange('login')} className="btn-primary w-full">Back to sign in</button>
                    <button type="button" onClick={() => onStepChange('register')} className="text-sm font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">Entered the wrong email? Start over</button>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>

        <p className="relative z-10 text-center text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
          <Lock size={11} /> Protected by encrypted sessions and row-level security.
        </p>
      </main>
    </div>
  );
};

export default AuthScreen;
