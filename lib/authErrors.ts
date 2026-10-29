/**
 * Maps Supabase Auth errors to short, honest messages that never reveal
 * whether an account exists. Raw Supabase strings ("User already registered",
 * "email rate limit exceeded", "Database error saving new user") are not
 * suitable for end users and some of them leak account existence.
 */

export const NEUTRAL_SIGNUP_MESSAGE =
  'If this email is new, a verification code is on its way. If you already have an account, sign in instead.';

export interface AuthErrorLike {
  message?: string;
  code?: string;
  status?: number;
  error_code?: string;
}

const CODE_MESSAGES: Record<string, string> = {
  over_email_send_rate_limit: 'Too many emails were sent to this address recently. Wait a few minutes, then try again.',
  over_request_rate_limit: 'Too many attempts. Please wait a minute and try again.',
  over_sms_send_rate_limit: 'Too many attempts. Please wait a minute and try again.',
  user_already_exists: NEUTRAL_SIGNUP_MESSAGE,
  email_exists: NEUTRAL_SIGNUP_MESSAGE,
  weak_password: 'That password is too easy to guess. Use at least 10 characters with upper and lower case letters and a number.',
  same_password: 'Choose a password you have not used on this account before.',
  session_not_found: 'Your session has ended. Request a new reset code and try again.',
  session_expired: 'Your session has ended. Request a new reset code and try again.',
  reauthentication_needed: 'For your security, please sign in again before changing your password.',
  email_not_confirmed: 'Please verify your email first. Enter the code from your inbox or request a new one.',
  invalid_credentials: 'Email or password is incorrect.',
  otp_expired: 'That code or link has expired. Request a new one and try again.',
  otp_disabled: 'Email verification is not available right now. Please contact support.',
  signup_disabled: 'New sign-ups are temporarily closed. Please try again later.',
  email_provider_disabled: 'Email sign-up is not enabled. Please use Google sign-in.',
  validation_failed: 'Please check the details you entered and try again.',
  bad_code_verifier: 'This link was opened in a different browser from the one you signed up in. Enter the 6-digit code from the email instead.',
  flow_state_not_found: 'This link was opened in a different browser from the one you signed up in. Enter the 6-digit code from the email instead.',
  flow_state_expired: 'This link has expired. Request a new code and try again.',
  unexpected_failure: 'We could not create your account right now. Please try again in a moment.',
  access_denied: 'That link is no longer valid. Request a new one and try again.',
};

export const friendlyAuthError = (err: AuthErrorLike | null | undefined, fallback: string): string => {
  if (!err) return fallback;
  const code = (err.code || err.error_code || '').toLowerCase();
  if (code && CODE_MESSAGES[code]) return CODE_MESSAGES[code];

  const msg = (err.message || '').toLowerCase();
  if (!msg) return fallback;
  if (/rate limit/.test(msg)) return CODE_MESSAGES.over_email_send_rate_limit;
  if (/already registered|already exists|already been registered/.test(msg)) return NEUTRAL_SIGNUP_MESSAGE;
  if (/code verifier|flow state|pkce/.test(msg)) return CODE_MESSAGES.bad_code_verifier;
  if (/expired/.test(msg)) return CODE_MESSAGES.otp_expired;
  if (/token has expired or is invalid|invalid otp|otp/.test(msg)) return 'That code is not valid. Check the digits and try again, or request a new code.';
  if (/not confirmed/.test(msg)) return CODE_MESSAGES.email_not_confirmed;
  if (/invalid login credentials/.test(msg)) return CODE_MESSAGES.invalid_credentials;
  if (/different from the old password|same password/.test(msg)) return CODE_MESSAGES.same_password;
  if (/password/.test(msg)) return CODE_MESSAGES.weak_password;
  if (/database error/.test(msg)) return CODE_MESSAGES.unexpected_failure;
  if (/failed to fetch|network|load failed/.test(msg)) return 'Could not reach the server. Check your connection and try again.';
  return fallback;
};

/**
 * Supabase sends failed verification / OAuth redirects back to the site as
 * `#error=access_denied&error_code=otp_expired&error_description=...` (or the
 * same keys in the query string). Returns null when the URL carries no error.
 */
export const readAuthErrorFromUrl = (): { code: string; message: string } | null => {
  const sources = [window.location.hash.replace(/^#/, ''), window.location.search.replace(/^\?/, '')];
  for (const raw of sources) {
    if (!raw) continue;
    const params = new URLSearchParams(raw);
    const error = params.get('error');
    const code = params.get('error_code') || '';
    const description = params.get('error_description') || '';
    if (!error && !code) continue;
    return {
      code: code || error || 'unknown',
      message: friendlyAuthError({ code: code || error || undefined, message: description }, 'That link could not be used. Request a new one and try again.'),
    };
  }
  return null;
};

/** Token-hash verification links: `/?token_hash=...&type=email` (or in the hash). */
export const readTokenHashFromUrl = (): { tokenHash: string; type: string } | null => {
  const sources = [window.location.search.replace(/^\?/, ''), window.location.hash.replace(/^#/, '')];
  for (const raw of sources) {
    if (!raw) continue;
    const params = new URLSearchParams(raw);
    const tokenHash = params.get('token_hash');
    if (tokenHash) return { tokenHash, type: params.get('type') || 'email' };
  }
  return null;
};

export const isSixDigitCode = (value: string) => /^\d{6}$/.test(value.trim());
