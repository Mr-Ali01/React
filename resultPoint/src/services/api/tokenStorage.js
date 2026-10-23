/**
 * ResultPoint Token & Session Storage Module.
 * 
 * Security Architecture:
 * - Access Token: Kept strictly in-memory (private module closure). Never written to localStorage/sessionStorage.
 * - Refresh Token: Stored in Web Storage (localStorage by default for cross-tab session persistence,
 *   or sessionStorage when rememberMe=false).
 * - Sensitive token values are never printed to console logs or error reports.
 */

import { STORAGE_KEYS } from '../storageKeys.js';

// In-memory access token store
let inMemoryAccessToken = null;
let tokenRefreshedAt = 0;

const REFRESH_TOKEN_KEY = 'rp_refresh_token';
const REFRESH_TIMESTAMP_KEY = 'rp_refresh_at';
const CURRENT_USER_KEY = 'rp_session_user';

function getStorage(remember = true) {
  if (typeof window === 'undefined') return null;
  return remember ? window.localStorage : window.sessionStorage;
}

export const tokenStorage = {
  /**
   * Returns current access token from memory.
   */
  getAccessToken() {
    return inMemoryAccessToken;
  },

  /**
   * Sets in-memory access token.
   */
  setAccessToken(token) {
    inMemoryAccessToken = token || null;
  },

  /**
   * Gets persisted refresh token (checks localStorage then sessionStorage).
   */
  getRefreshToken() {
    if (typeof window === 'undefined') return null;
    try {
      return (
        window.localStorage.getItem(REFRESH_TOKEN_KEY) ||
        window.sessionStorage.getItem(REFRESH_TOKEN_KEY) ||
        null
      );
    } catch {
      return null;
    }
  },

  /**
   * Stores refresh token in appropriate web storage partition.
   */
  setRefreshToken(token, remember = true) {
    if (typeof window === 'undefined') return;
    try {
      const target = getStorage(remember);
      const other = remember ? window.sessionStorage : window.localStorage;
      
      // Clear from the opposite storage to prevent duplicate stale tokens
      other.removeItem(REFRESH_TOKEN_KEY);
      
      if (token) {
        target.setItem(REFRESH_TOKEN_KEY, token);
        const now = Date.now();
        target.setItem(REFRESH_TIMESTAMP_KEY, String(now));
        tokenRefreshedAt = now;
      } else {
        target.removeItem(REFRESH_TOKEN_KEY);
        target.removeItem(REFRESH_TIMESTAMP_KEY);
      }
    } catch {
      // Storage access may be restricted (e.g. private mode)
    }
  },

  /**
   * Returns timestamp of last refresh rotation.
   */
  getRefreshTimestamp() {
    if (tokenRefreshedAt > 0) return tokenRefreshedAt;
    if (typeof window === 'undefined') return 0;
    try {
      const raw =
        window.localStorage.getItem(REFRESH_TIMESTAMP_KEY) ||
        window.sessionStorage.getItem(REFRESH_TIMESTAMP_KEY);
      return raw ? parseInt(raw, 10) : 0;
    } catch {
      return 0;
    }
  },

  /**
   * Stores both tokens and optionally caches the authenticated user summary.
   */
  setSession({ accessToken, refreshToken, user, remember = true }) {
    if (accessToken !== undefined) {
      this.setAccessToken(accessToken);
    }
    if (refreshToken !== undefined) {
      this.setRefreshToken(refreshToken, remember);
    }
    if (user !== undefined) {
      this.setCurrentUser(user, remember);
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('auth_session_changed', { detail: { isAuthenticated: Boolean(accessToken || refreshToken) } }));
    }
  },

  /**
   * Caches current authenticated user summary for synchronous UI components.
   */
  setCurrentUser(user, remember = true) {
    if (typeof window === 'undefined') return;
    try {
      const target = getStorage(remember);
      const other = remember ? window.sessionStorage : window.localStorage;
      other.removeItem(CURRENT_USER_KEY);
      
      if (user) {
        target.setItem(CURRENT_USER_KEY, JSON.stringify(user));
        // Also keep resultpoint_auth / resultpoint_student in sync for legacy compatibility
        window.localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(user));
      } else {
        target.removeItem(CURRENT_USER_KEY);
        window.localStorage.removeItem(STORAGE_KEYS.AUTH);
      }
    } catch {
      // Fallback
    }
  },

  /**
   * Reads cached user summary synchronously.
   */
  getCurrentUser() {
    if (typeof window === 'undefined') return null;
    try {
      const raw =
        window.localStorage.getItem(CURRENT_USER_KEY) ||
        window.sessionStorage.getItem(CURRENT_USER_KEY) ||
        window.localStorage.getItem(STORAGE_KEYS.AUTH);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  /**
   * Purges all tokens and cached user data.
   */
  clearSession() {
    inMemoryAccessToken = null;
    tokenRefreshedAt = 0;
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.removeItem(REFRESH_TOKEN_KEY);
        window.localStorage.removeItem(REFRESH_TIMESTAMP_KEY);
        window.localStorage.removeItem(CURRENT_USER_KEY);
        window.sessionStorage.removeItem(REFRESH_TOKEN_KEY);
        window.sessionStorage.removeItem(REFRESH_TIMESTAMP_KEY);
        window.sessionStorage.removeItem(CURRENT_USER_KEY);
        window.localStorage.removeItem(STORAGE_KEYS.AUTH);
        window.dispatchEvent(new CustomEvent('auth_session_changed', { detail: { isAuthenticated: false } }));
      } catch {
        // Fallback
      }
    }
  },
};
