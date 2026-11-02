/**
 * Trial/subscription access gate.
 *
 * The platform administrator manages the whole app, so an admin account is
 * never blocked by trial expiry — otherwise the person who approves
 * subscriptions and manages accounts gets locked out by the very limit they
 * administer. Settings stays reachable for everyone (billing lives there).
 */

export interface TrialStatus {
  isSubscribed: boolean;
  isExpired: boolean;
}

export const shouldBlockAccess = (
  role: string | null | undefined,
  trial: TrialStatus,
  isSettingsView: boolean,
): boolean => {
  if (!role) return false;
  if (role === 'admin') return false;
  if (isSettingsView) return false;
  return trial.isExpired && !trial.isSubscribed;
};
