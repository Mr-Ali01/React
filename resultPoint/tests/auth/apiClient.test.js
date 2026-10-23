import { describe, it, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';

// Set up mock window, localStorage, and sessionStorage for Node environment
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
const { refreshCoordinator } = await import('../../src/services/api/refreshCoordinator.js');
const { apiClient, ApiError } = await import('../../src/services/api/apiClient.js');

describe('ResultPoint API Client & Authentication Unit Suite (WP-1)', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    tokenStorage.clearSession();
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    tokenStorage.clearSession();
  });

  it('1. should inject Bearer token into headers when access token is present', async () => {
    tokenStorage.setAccessToken('test-access-token-123');

    let capturedHeaders = null;
    globalThis.fetch = mock.fn(async (url, options) => {
      capturedHeaders = options.headers;
      return new Response(JSON.stringify({ success: true, data: { status: 'OK' } }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    });

    const res = await apiClient.get('/api/v1/test/resource');

    assert.equal(res.status, 'OK');
    assert.equal(capturedHeaders.get('Authorization'), 'Bearer test-access-token-123');
    assert.equal(capturedHeaders.get('Accept'), 'application/json');
  });

  it('2. should unwrap standard backend ApiResponse envelope', async () => {
    globalThis.fetch = mock.fn(async () => {
      return new Response(
        JSON.stringify({
          success: true,
          timestamp: '2026-10-23T12:00:00Z',
          data: { id: 'usr_01', fullName: 'Student User' },
          error: null,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    });

    const data = await apiClient.get('/api/v1/user');
    assert.deepEqual(data, { id: 'usr_01', fullName: 'Student User' });
  });

  it('3. should parse backend ApiErrorResponse on 400 Bad Request', async () => {
    globalThis.fetch = mock.fn(async () => {
      return new Response(
        JSON.stringify({
          success: false,
          timestamp: '2026-10-23T12:00:00Z',
          data: null,
          error: {
            code: 'VALIDATION_FAILED',
            message: 'Invalid email address',
            status: 400,
            details: [{ field: 'email', message: 'Must be a valid email' }],
          },
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    });

    await assert.rejects(
      async () => {
        await apiClient.post('/api/v1/auth/signup', { email: 'invalid' });
      },
      (err) => {
        assert(err instanceof ApiError);
        assert.equal(err.status, 400);
        assert.equal(err.code, 'VALIDATION_FAILED');
        assert.equal(err.message, 'Invalid email address');
        assert.equal(err.details[0].field, 'email');
        return true;
      }
    );
  });

  it('4. should normalize low-level network failure into ApiError', async () => {
    globalThis.fetch = mock.fn(async () => {
      throw new TypeError('Failed to fetch');
    });

    await assert.rejects(
      async () => {
        await apiClient.get('/api/v1/network-test');
      },
      (err) => {
        assert(err instanceof ApiError);
        assert.equal(err.status, 0);
        assert.equal(err.code, 'NETWORK_FAILURE');
        return true;
      }
    );
  });

  it('5. should intercept 401, refresh tokens, and replay request with fresh token', async () => {
    tokenStorage.setAccessToken('stale-access-token');
    tokenStorage.setRefreshToken('valid-refresh-token');

    let callCount = 0;
    let refreshCalled = false;

    // Register mock refresh executor in refreshCoordinator
    refreshCoordinator.setRefreshExecutor(async (refreshToken) => {
      assert.equal(refreshToken, 'valid-refresh-token');
      refreshCalled = true;
      return {
        accessToken: 'fresh-new-access-token',
        refreshToken: 'fresh-new-refresh-token',
        user: { id: 'usr_01', email: 'student@resultpoint.edu', role: 'STUDENT' },
      };
    });

    globalThis.fetch = mock.fn(async (url, options) => {
      callCount++;
      const authHeader = options.headers.get('Authorization');

      if (callCount === 1) {
        assert.equal(authHeader, 'Bearer stale-access-token');
        // Return 401 expired access token
        return new Response(
          JSON.stringify({
            success: false,
            error: { code: 'EXPIRED_JWT', message: 'JWT expired', status: 401 },
          }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }

      if (callCount === 2) {
        assert.equal(authHeader, 'Bearer fresh-new-access-token');
        return new Response(
          JSON.stringify({
            success: true,
            data: { result: 'Protected data retrieved successfully' },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
    });

    const result = await apiClient.get('/api/v1/student/results');

    assert.equal(refreshCalled, true);
    assert.equal(callCount, 2);
    assert.equal(result.result, 'Protected data retrieved successfully');
    assert.equal(tokenStorage.getAccessToken(), 'fresh-new-access-token');
    assert.equal(tokenStorage.getRefreshToken(), 'fresh-new-refresh-token');
  });

  it('6. should deduplicate concurrent 401 requests into single refresh network call', async () => {
    tokenStorage.setAccessToken('stale-token');
    tokenStorage.setRefreshToken('valid-refresh');

    let refreshExecutions = 0;
    refreshCoordinator.setRefreshExecutor(async () => {
      refreshExecutions++;
      // Simulate network latency for refresh call
      await new Promise((r) => setTimeout(r, 20));
      return {
        accessToken: 'shared-fresh-token',
        refreshToken: 'shared-fresh-refresh',
        user: { id: 'usr_01', email: 'student@resultpoint.edu' },
      };
    });

    let endpointAttempts = 0;
    globalThis.fetch = mock.fn(async (url, options) => {
      endpointAttempts++;
      const token = options.headers.get('Authorization');

      if (token === 'Bearer stale-token') {
        return new Response(JSON.stringify({ success: false, error: { status: 401 } }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (token === 'Bearer shared-fresh-token') {
        return new Response(JSON.stringify({ success: true, data: { endpoint: url } }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    });

    // Launch 3 concurrent requests simultaneously
    const [res1, res2, res3] = await Promise.all([
      apiClient.get('/api/v1/endpoint-a'),
      apiClient.get('/api/v1/endpoint-b'),
      apiClient.get('/api/v1/endpoint-c'),
    ]);

    assert.equal(refreshExecutions, 1, 'Only 1 refresh network call should execute');
    assert.equal(res1.endpoint, '/api/v1/endpoint-a');
    assert.equal(res2.endpoint, '/api/v1/endpoint-b');
    assert.equal(res3.endpoint, '/api/v1/endpoint-c');
  });

  it('7. should not trigger refresh for auth endpoints on 401 (prevent infinite loop)', async () => {
    let refreshAttempted = false;
    refreshCoordinator.setRefreshExecutor(async () => {
      refreshAttempted = true;
      return { accessToken: 'token', refreshToken: 'ref' };
    });

    globalThis.fetch = mock.fn(async () => {
      return new Response(
        JSON.stringify({
          success: false,
          error: { code: 'INVALID_CREDENTIALS', message: 'Invalid credentials', status: 401 },
        }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    });

    await assert.rejects(
      async () => {
        await apiClient.post('/api/v1/auth/login', { email: 'bad@cred.com', password: 'bad' });
      },
      (err) => {
        assert.equal(err.status, 401);
        assert.equal(err.code, 'INVALID_CREDENTIALS');
        return true;
      }
    );

    assert.equal(refreshAttempted, false, 'Auth login 401 must never trigger token refresh');
  });

  it('8. should purge session on fatal refresh failure and reject with 401', async () => {
    tokenStorage.setAccessToken('bad-access');
    tokenStorage.setRefreshToken('revoked-refresh');

    refreshCoordinator.setRefreshExecutor(async () => {
      throw new ApiError('Refresh token reuse detected. All active sessions revoked.', {
        status: 401,
        code: 'TOKEN_THEFT_DETECTED',
      });
    });

    globalThis.fetch = mock.fn(async () => {
      return new Response(
        JSON.stringify({ success: false, error: { status: 401 } }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    });

    await assert.rejects(
      async () => {
        await apiClient.get('/api/v1/student/profile');
      },
      (err) => {
        assert.equal(err.status, 401);
        assert.equal(err.code, 'SESSION_EXPIRED');
        return true;
      }
    );

    // Verify tokens were cleared
    assert.equal(tokenStorage.getAccessToken(), null);
    assert.equal(tokenStorage.getRefreshToken(), null);
  });
});
