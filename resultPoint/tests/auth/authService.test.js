import { describe, it, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';

const mockStorage = () => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = String(value); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; },
  };
};

globalThis.window = {
  localStorage: mockStorage(),
  sessionStorage: mockStorage(),
  dispatchEvent: () => true,
};
globalThis.localStorage = globalThis.window.localStorage;
globalThis.sessionStorage = globalThis.window.sessionStorage;
globalThis.CustomEvent = class CustomEvent {
  constructor(name, params = {}) {
    this.name = name;
    this.detail = params.detail;
  }
};

const { tokenStorage } = await import('../../src/services/api/tokenStorage.js');
const { authApi } = await import('../../src/services/api/authApi.js');
const { authService } = await import('../../src/services/authService.js');
const { refreshCoordinator } = await import('../../src/services/api/refreshCoordinator.js');

describe('ResultPoint AuthService & Multi-Tab Web Locks Unit Suite (WP-1)', () => {
  const originalFetch = globalThis.fetch;
  const originalNavigator = globalThis.navigator;

  beforeEach(() => {
    tokenStorage.clearSession();
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    try {
      Object.defineProperty(globalThis, 'navigator', { value: originalNavigator, configurable: true, writable: true });
    } catch {}
    tokenStorage.clearSession();
  });

  it('1. authApi should format and send POST /api/v1/auth/signup', async () => {
    let capturedBody = null;
    let capturedUrl = null;

    globalThis.fetch = mock.fn(async (url, options) => {
      capturedUrl = url;
      capturedBody = JSON.parse(options.body);
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            tokenType: 'Bearer',
            accessToken: 'jwt_access_123',
            expiresIn: 900,
            refreshToken: 'ref_123',
            user: { id: 'usr_new', fullName: 'Alice Student', email: 'alice@test.edu', role: 'STUDENT' },
          },
        }),
        { status: 201, headers: { 'Content-Type': 'application/json' } }
      );
    });

    const res = await authApi.register({
      fullName: 'Alice Student',
      email: 'alice@test.edu',
      password: 'Password123!',
      phone: '+919999988888',
    });

    assert.equal(capturedUrl, '/api/v1/auth/signup');
    assert.equal(capturedBody.fullName, 'Alice Student');
    assert.equal(capturedBody.email, 'alice@test.edu');
    assert.equal(res.accessToken, 'jwt_access_123');
    assert.equal(res.user.role, 'STUDENT');
  });

  it('2. authService.login should call authApi.login, normalize user role, and store tokens', async () => {
    globalThis.fetch = mock.fn(async (url, options) => {
      assert.equal(url, '/api/v1/auth/login');
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            tokenType: 'Bearer',
            accessToken: 'jwt_login_token',
            expiresIn: 900,
            refreshToken: 'refresh_login_token',
            user: {
              id: 'usr_student_01',
              fullName: 'Student User',
              email: 'student@resultpoint.edu',
              role: 'STUDENT',
              status: 'ACTIVE',
            },
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    });

    const result = await authService.login({
      email: 'student@resultpoint.edu',
      password: 'password123',
      expectedRole: 'student',
    });

    assert.equal(result.success, true);
    assert.equal(result.user.role, 'student', 'Should normalize role to lowercase');
    assert.equal(result.user.email, 'student@resultpoint.edu');
    assert.equal(tokenStorage.getAccessToken(), 'jwt_login_token');
    assert.equal(tokenStorage.getRefreshToken(), 'refresh_login_token');
    assert.equal(authService.isAuthenticated(), true);
  });

  it('3. authService.login should enforce role restrictions when expectedRole is admin', async () => {
    globalThis.fetch = mock.fn(async () => {
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            accessToken: 'jwt_student',
            refreshToken: 'ref_student',
            user: { id: 'usr_s', email: 's@test.com', role: 'STUDENT' },
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    });

    const result = await authService.login({
      email: 's@test.com',
      password: 'password123',
      expectedRole: 'admin',
    });

    assert.equal(result.success, false);
    assert(result.error.includes('Administrator privileges required'));
    assert.equal(authService.isAuthenticated(), false);
  });

  it('4. authService.logout should call POST /api/v1/auth/logout with refreshToken and clear local session', async () => {
    tokenStorage.setSession({
      accessToken: 'access-to-revoke',
      refreshToken: 'refresh-to-revoke',
      user: { id: 'usr_1', email: 'u@test.com', role: 'student' },
    });

    let logoutPayload = null;
    globalThis.fetch = mock.fn(async (url, options) => {
      if (url === '/api/v1/auth/logout') {
        logoutPayload = JSON.parse(options.body);
        return new Response(JSON.stringify({ success: true, data: { message: 'Logged out successfully.' } }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    });

    await authService.logout();

    assert.equal(logoutPayload.refreshToken, 'refresh-to-revoke');
    assert.equal(tokenStorage.getAccessToken(), null);
    assert.equal(tokenStorage.getRefreshToken(), null);
    assert.equal(authService.isAuthenticated(), false);
  });

  it('5. Web Locks multi-tab coordination: should detect token refreshed by sibling tab inside lock', async () => {
    // Initial state: tab A has stale tokens
    tokenStorage.setAccessToken('stale-access-tab-a');
    tokenStorage.setRefreshToken('stale-refresh-tab-a');

    let backendRefreshCalls = 0;
    refreshCoordinator.setRefreshExecutor(async () => {
      backendRefreshCalls++;
      return {
        accessToken: 'network-fresh-access',
        refreshToken: 'network-fresh-refresh',
        user: { id: 'usr_01', email: 'student@resultpoint.edu' },
      };
    });

    // Mock navigator.locks
    Object.defineProperty(globalThis, 'navigator', {
      value: {
        locks: {
          request: async (lockName, callback) => {
            assert.equal(lockName, 'rp_token_refresh_lock');
            // Simulate: while waiting for the lock, sibling Tab B refreshed the token!
            tokenStorage.setAccessToken('tab-b-fresh-access');
            tokenStorage.setRefreshToken('tab-b-fresh-refresh');
            return await callback();
          },
        },
      },
      configurable: true,
      writable: true,
    });

    const fresh = await refreshCoordinator.acquireFreshTokens('stale-access-tab-a');

    assert.equal(fresh.accessToken, 'tab-b-fresh-access');
    assert.equal(fresh.refreshToken, 'tab-b-fresh-refresh');
    assert.equal(backendRefreshCalls, 0, 'Tab A should reuse Tab B tokens and skip backend call');
  });

  it('6. authService.checkSession should refresh and restore user on app reload when access token is missing', async () => {
    // Reload state: refresh token is in storage, but in-memory access token is null
    tokenStorage.setRefreshToken('persisted-refresh-token');

    let refreshCalled = false;
    refreshCoordinator.setRefreshExecutor(async (token) => {
      refreshCalled = true;
      assert.equal(token, 'persisted-refresh-token');
      return {
        accessToken: 'reloaded-access-token',
        refreshToken: 'rotated-refresh-token',
        user: { id: 'usr_01', email: 'student@resultpoint.edu', role: 'STUDENT' },
      };
    });

    const session = await authService.checkSession();

    assert.equal(refreshCalled, true);
    assert.equal(session.token, 'reloaded-access-token');
    assert.equal(session.user.email, 'student@resultpoint.edu');
    assert.equal(tokenStorage.getAccessToken(), 'reloaded-access-token');
    assert.equal(tokenStorage.getRefreshToken(), 'rotated-refresh-token');
  });

  it('7. should block silent mock authentication fallback when backend is unreachable and VITE_ENABLE_MOCK_AUTH is disabled', async () => {
    // Backend throws network failure
    globalThis.fetch = mock.fn(async () => {
      throw new TypeError('Failed to fetch');
    });

    const result = await authService.login({
      email: 'student@resultpoint.edu',
      password: 'password123',
    });

    assert.equal(result.success, false);
    assert(result.error.includes('Unable to connect to ResultPoint authentication server'));
    assert.equal(tokenStorage.getAccessToken(), null);
    assert.equal(authService.isAuthenticated(), false);
  });

  it('8. should cleanly clear local credentials on logout even if backend returns 500 error', async () => {
    tokenStorage.setSession({
      accessToken: 'access-to-revoke',
      refreshToken: 'refresh-to-revoke',
      user: { id: 'usr_01', email: 'student@resultpoint.edu', role: 'student' },
    });

    // Backend endpoint crashes with 500 Internal Server Error
    globalThis.fetch = mock.fn(async () => {
      return new Response(JSON.stringify({ success: false, error: { message: 'DB crash', status: 500 } }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    });

    await authService.logout();

    // Local credentials MUST still be wiped clean
    assert.equal(tokenStorage.getAccessToken(), null);
    assert.equal(tokenStorage.getRefreshToken(), null);
    assert.equal(authService.isAuthenticated(), false);
  });

  it('9. Redux store rootReducer pattern should cleanly wipe all state on logout action', async () => {
    const { configureStore, combineReducers } = await import('@reduxjs/toolkit');
    const { default: authReducer } = await import('../../src/features/auth/authSlice.js');

    const testDomainSlice = (state = { results: ['sem_initial'] }, action) => {
      if (action.type === 'test/setResults') return { results: action.payload };
      return state;
    };

    const appReducer = combineReducers({
      auth: authReducer,
      domain: testDomainSlice,
    });

    const rootReducer = (state, action) => {
      if (
        action.type === 'auth/logout' ||
        action.type === 'auth/logoutUser/fulfilled' ||
        action.type === 'auth/logoutUser/rejected'
      ) {
        state = undefined;
      }
      return appReducer(state, action);
    };

    const store = configureStore({ reducer: rootReducer });

    // Set populated user session data
    store.dispatch({ type: 'test/setResults', payload: ['sem_1', 'sem_2', 'sem_3'] });
    assert.deepEqual(store.getState().domain.results, ['sem_1', 'sem_2', 'sem_3']);

    // Dispatch logout action
    store.dispatch({ type: 'auth/logout' });

    // Verify all domain state was reset to clean initial defaults
    assert.deepEqual(store.getState().domain.results, ['sem_initial']);
    assert.equal(store.getState().auth.isAuthenticated, false);
    assert.equal(store.getState().auth.user, null);
  });

  it('10. Production isolation: backend unavailability MUST NEVER authenticate mock users in production mode even if VITE_ENABLE_MOCK_AUTH is set', async () => {
    const origEnv = process.env.NODE_ENV;
    const origMockFlag = process.env.VITE_ENABLE_MOCK_AUTH;
    try {
      process.env.NODE_ENV = 'production';
      process.env.VITE_ENABLE_MOCK_AUTH = 'true';

      globalThis.fetch = mock.fn(async () => {
        throw new TypeError('Failed to fetch');
      });

      const result = await authService.login({
        email: 'student@resultpoint.edu',
        password: 'password123',
      });

      assert.equal(result.success, false);
      assert(result.error.includes('Unable to connect to ResultPoint authentication server'));
      assert.equal(tokenStorage.getAccessToken(), null);
      assert.equal(authService.isAuthenticated(), false);
    } finally {
      process.env.NODE_ENV = origEnv;
      process.env.VITE_ENABLE_MOCK_AUTH = origMockFlag;
    }
  });

  it('11. Non-production controlled override: mock authentication works ONLY when VITE_ENABLE_MOCK_AUTH=true in dev', async () => {
    const origEnv = process.env.NODE_ENV;
    const origMockFlag = process.env.VITE_ENABLE_MOCK_AUTH;
    try {
      process.env.NODE_ENV = 'development';
      process.env.VITE_ENABLE_MOCK_AUTH = 'true';

      globalThis.fetch = mock.fn(async () => {
        throw new TypeError('Failed to fetch');
      });

      const result = await authService.login({
        email: 'student@resultpoint.edu',
        password: 'password123',
        expectedRole: 'student',
      });

      assert.equal(result.success, true);
      assert.equal(result.user.email, 'student@resultpoint.edu');
      assert.equal(authService.isAuthenticated(), true);
    } finally {
      process.env.NODE_ENV = origEnv;
      process.env.VITE_ENABLE_MOCK_AUTH = origMockFlag;
    }
  });

  it('12. Production isolation: checkSession with stale mock tokens in storage immediately purges tokens and returns null', async () => {
    const origEnv = process.env.NODE_ENV;
    try {
      process.env.NODE_ENV = 'production';
      tokenStorage.setRefreshToken('mock_refresh_stale_123');
      tokenStorage.setCurrentUser({ id: 'usr_01', email: 'student@resultpoint.edu', role: 'student' });

      const session = await authService.checkSession();

      assert.equal(session, null);
      assert.equal(tokenStorage.getRefreshToken(), null);
      assert.equal(tokenStorage.getCurrentUser(), null);
    } finally {
      process.env.NODE_ENV = origEnv;
    }
  });
});

