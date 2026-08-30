/**
 * Client-side security helpers: password policy, login throttling and idle
 * detection. These complement (never replace) the server-side controls in
 * Supabase Auth and the Postgres RLS policies in supabase/sql/security.sql.
 */

export const PASSWORD_MIN_LENGTH = 10;

export interface PasswordCheck {
  /** 0 (empty) – 4 (excellent). */
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
  /** Requirements that are still unmet. */
  unmet: string[];
  valid: boolean;
}

const COMMON_PASSWORDS = new Set([
  'password', 'password1', 'password123', '1234567890', 'qwertyuiop', 'iloveyou1',
  'admin12345', 'letmein123', 'welcome123', 'stockbit123', 'abcdefghij', '1q2w3e4r5t'
]);

export const checkPassword = (password: string, context: string[] = []): PasswordCheck => {
  const unmet: string[] = [];
  if (password.length < PASSWORD_MIN_LENGTH) unmet.push(`At least ${PASSWORD_MIN_LENGTH} characters`);
  if (!/[a-z]/.test(password)) unmet.push('A lowercase letter');
  if (!/[A-Z]/.test(password)) unmet.push('An uppercase letter');
  if (!/[0-9]/.test(password)) unmet.push('A number');

  const lower = password.toLowerCase();
  if (COMMON_PASSWORDS.has(lower)) unmet.push('Not a commonly used password');
  for (const c of context) {
    const token = (c || '').toLowerCase().split('@')[0];
    if (token.length >= 4 && lower.includes(token)) {
      unmet.push('Must not contain your name or email');
      break;
    }
  }

  let score = 0;
  if (password.length >= PASSWORD_MIN_LENGTH) score++;
  if (password.length >= 14) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password) && /[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (unmet.length > 0) score = Math.min(score, 2);
  if (!password) score = 0;

  const labels = ['', 'Weak', 'Fair', 'Strong', 'Excellent'];
  return {
    score: score as PasswordCheck['score'],
    label: labels[score],
    unmet,
    valid: unmet.length === 0
  };
};

// ---------------------------------------------------------------------------
// Login throttling (per browser). Supabase also rate-limits server-side; this
// adds friction for credential stuffing on a shared device and gives the user a
// clear, honest countdown instead of silent failures.
// ---------------------------------------------------------------------------
const THROTTLE_KEY = 'stockbit_auth_throttle_v1';
const MAX_ATTEMPTS = 5;
const BASE_LOCK_MS = 30_000;

interface ThrottleState { failures: number; lockedUntil: number }

const readThrottle = (): ThrottleState => {
  try {
    const raw = sessionStorage.getItem(THROTTLE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { failures: 0, lockedUntil: 0 };
};

const writeThrottle = (s: ThrottleState) => {
  try { sessionStorage.setItem(THROTTLE_KEY, JSON.stringify(s)); } catch { /* ignore */ }
};

/** Seconds remaining on the lock, or 0 if sign-in is allowed. */
export const loginLockSeconds = (): number => {
  const { lockedUntil } = readThrottle();
  return Math.max(0, Math.ceil((lockedUntil - Date.now()) / 1000));
};

export const recordLoginFailure = (): number => {
  const s = readThrottle();
  s.failures += 1;
  if (s.failures >= MAX_ATTEMPTS) {
    // Exponential back-off: 30s, 60s, 120s ... capped at 15 minutes.
    const exponent = s.failures - MAX_ATTEMPTS;
    s.lockedUntil = Date.now() + Math.min(BASE_LOCK_MS * 2 ** exponent, 15 * 60_000);
  }
  writeThrottle(s);
  return Math.max(0, MAX_ATTEMPTS - s.failures);
};

export const clearLoginFailures = () => writeThrottle({ failures: 0, lockedUntil: 0 });

// ---------------------------------------------------------------------------
// Misc
// ---------------------------------------------------------------------------
export const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());

export const isUuid = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value.trim());

/** Staff invite codes look like SB-7K3M-9Q2X (no 0/O/1/I). */
export const normalizeInviteCode = (raw: string) => {
  const cleaned = raw.toUpperCase().replace(/[^A-Z0-9]/g, '').replace(/^SB/, '');
  if (cleaned.length !== 8) return raw.trim().toUpperCase();
  return `SB-${cleaned.slice(0, 4)}-${cleaned.slice(4)}`;
};
export const isInviteCode = (value: string) => /^SB-[A-Z2-9]{4}-[A-Z2-9]{4}$/.test(value);

/** Idle time (ms) after which the app locks and asks the user to re-authenticate. */
export const IDLE_LOCK_MS = 15 * 60_000;
