/**
 * ResultPoint Multi-Tab Token Refresh Coordinator.
 * 
 * Implements:
 * 1. In-process Promise deduplication for concurrent 401 requests in the same tab.
 * 2. Cross-tab coordination using the Web Locks API (`navigator.locks.request`) with fallback.
 * 3. Cross-tab notification via `BroadcastChannel` to synchronize new tokens and logouts.
 * 4. Cache-check inside the lock: If another tab already rotated the token while waiting,
 *    adopts the fresh tokens without hitting the backend endpoint again.
 * 5. Prevents infinite retry loops and triggers session-expired cleanup on fatal refresh failure.
 */

import { tokenStorage } from './tokenStorage.js';

let pendingRefreshPromise = null;
let broadcastChannel = null;

try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    broadcastChannel = new BroadcastChannel('rp_auth_channel');
    broadcastChannel.onmessage = (event) => {
      const { type, payload } = event.data || {};
      if (type === 'TOKEN_REFRESHED' && payload) {
        tokenStorage.setSession({
          accessToken: payload.accessToken,
          refreshToken: payload.refreshToken,
          user: payload.user,
        });
      } else if (type === 'SESSION_EXPIRED' || type === 'LOGOUT') {
        tokenStorage.clearSession();
        window.dispatchEvent(new CustomEvent('auth_session_expired', { detail: { reason: payload?.reason || 'Session expired' } }));
      }
    };
  }
} catch {
  // BroadcastChannel not supported or blocked
}

/**
 * Execute actual refresh API call. Passed in by apiClient or authApi.
 */
let refreshExecutor = null;

export const refreshCoordinator = {
  /**
   * Register the low-level network executor that calls POST /api/v1/auth/refresh.
   * Decouples the coordinator from circular imports.
   */
  setRefreshExecutor(executor) {
    refreshExecutor = executor;
  },

  /**
   * Primary entry point: Acquire fresh tokens safely across all concurrent requests & tabs.
   * 
   * @param {string} failedToken - The access token that failed with 401
   * @returns {Promise<{ accessToken: string, refreshToken: string, user: Object }>}
   */
  async acquireFreshTokens(failedToken = null) {
    // 1. If another request in this tab is already refreshing, join its promise
    if (pendingRefreshPromise) {
      return pendingRefreshPromise;
    }

    pendingRefreshPromise = this._executeCoordinatedRefresh(failedToken)
      .finally(() => {
        pendingRefreshPromise = null;
      });

    return pendingRefreshPromise;
  },

  async _executeCoordinatedRefresh(failedToken) {
    const initialRefreshToken = tokenStorage.getRefreshToken();
    const initialRefreshTimestamp = tokenStorage.getRefreshTimestamp();

    if (!initialRefreshToken) {
      this._handleRefreshFailure('No refresh token available');
      throw new Error('No refresh token available');
    }

    // 2. Web Locks API check if supported in browser
    if (typeof navigator !== 'undefined' && navigator.locks && navigator.locks.request) {
      return navigator.locks.request('rp_token_refresh_lock', async () => {
        return this._performRotation(initialRefreshToken, initialRefreshTimestamp, failedToken);
      });
    }

    // 3. Fallback for environments without Web Locks (e.g. Node tests or older browsers)
    return this._performRotation(initialRefreshToken, initialRefreshTimestamp, failedToken);
  },

  async _performRotation(initialRefreshToken, initialRefreshTimestamp, failedToken) {
    // Check if another tab refreshed the token while we were waiting for the lock
    const currentRefreshToken = tokenStorage.getRefreshToken();
    const currentAccessToken = tokenStorage.getAccessToken();
    const currentRefreshTimestamp = tokenStorage.getRefreshTimestamp();

    const isTokenDifferent = currentRefreshToken && currentRefreshToken !== initialRefreshToken;
    const isRecentlyRefreshed = currentRefreshTimestamp > initialRefreshTimestamp && (Date.now() - currentRefreshTimestamp) < 30000;
    const isAccessTokenNewer = currentAccessToken && currentAccessToken !== failedToken;

    if ((isTokenDifferent || isRecentlyRefreshed) && isAccessTokenNewer) {
      // Another tab successfully rotated the token! Reuse the fresh credentials.
      return {
        accessToken: currentAccessToken,
        refreshToken: currentRefreshToken,
        user: tokenStorage.getCurrentUser(),
      };
    }

    if (!refreshExecutor) {
      throw new Error('Refresh executor not registered in refreshCoordinator');
    }

    try {
      // Execute single-use rotation network call
      const authData = await refreshExecutor(currentRefreshToken || initialRefreshToken);

      const { accessToken, refreshToken, user } = authData;

      // Update storage
      tokenStorage.setSession({
        accessToken,
        refreshToken,
        user,
      });

      // Broadcast to sibling tabs
      if (broadcastChannel) {
        broadcastChannel.postMessage({
          type: 'TOKEN_REFRESHED',
          payload: { accessToken, refreshToken, user },
        });
      }

      return { accessToken, refreshToken, user };
    } catch (err) {
      this._handleRefreshFailure(err.message || 'Refresh token rotation failed');
      throw err;
    }
  },

  _handleRefreshFailure(reason) {
    tokenStorage.clearSession();

    if (broadcastChannel) {
      try {
        broadcastChannel.postMessage({
          type: 'SESSION_EXPIRED',
          payload: { reason },
        });
      } catch {
        // Fallback
      }
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('auth_session_expired', {
          detail: { reason },
        })
      );
    }
  },

  /**
   * Broadcast explicit user logout to other tabs.
   */
  broadcastLogout() {
    tokenStorage.clearSession();
    if (broadcastChannel) {
      try {
        broadcastChannel.postMessage({ type: 'LOGOUT' });
      } catch {
        // Fallback
      }
    }
  },
};
