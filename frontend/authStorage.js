/**
 * Logged-in user snapshot + last route (localStorage).
 * Server HttpOnly cookie + remember_tokens handle real auth; this mirrors UI state.
 * Cleared only on logout.
 */

export const HRP_REMEMBER_KEY = 'hrp_remember';
export const HRP_USER_KEY = 'hrp_user';
export const HRP_LAST_PATH_KEY = 'hrp_last_path';

export function isRememberAuth() {
  return localStorage.getItem(HRP_REMEMBER_KEY) === '1';
}

export function readStoredUser() {
  try {
    const raw =
      localStorage.getItem(HRP_USER_KEY) || sessionStorage.getItem(HRP_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/** Persist user snapshot; always uses localStorage so reopening the app can restore UI. */
export function writeStoredUser(user) {
  if (!user) {
    clearAuthStorage();
    return;
  }
  localStorage.setItem(HRP_REMEMBER_KEY, '1');
  localStorage.setItem(HRP_USER_KEY, JSON.stringify(user));
  sessionStorage.removeItem(HRP_USER_KEY);
}

export function readLastPath() {
  const p = localStorage.getItem(HRP_LAST_PATH_KEY);
  if (!p || p === '/') return null;
  return p;
}

export function writeLastPath(pathname) {
  if (!pathname || pathname === '/') return;
  localStorage.setItem(HRP_LAST_PATH_KEY, pathname);
}

/** Whether the user may resume this route (e.g. admin-only path). */
export function pathAllowedForRole(pathname, role) {
  if (pathname === '/dashboard') return true;
  if (pathname === '/admin') return role === 'admin';
  return false;
}

export function resolveResumePath(saved, user) {
  if (!user) return '/';
  if (saved && pathAllowedForRole(saved, user.role)) return saved;
  return user.role === 'admin' ? '/admin' : '/dashboard';
}

export function clearAuthStorage() {
  localStorage.removeItem(HRP_USER_KEY);
  localStorage.removeItem(HRP_REMEMBER_KEY);
  localStorage.removeItem(HRP_LAST_PATH_KEY);
  sessionStorage.removeItem(HRP_USER_KEY);
}

/** Drop stale localStorage user from older builds that did not use hrp_remember. */
export function migrateLegacyLocalUser() {
  if (localStorage.getItem(HRP_USER_KEY) && !isRememberAuth()) {
    localStorage.removeItem(HRP_USER_KEY);
  }
}
