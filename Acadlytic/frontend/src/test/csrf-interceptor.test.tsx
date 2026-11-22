import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { AxiosResponse, InternalAxiosRequestConfig, AxiosError } from 'axios';
import { apiClient } from '@/services/api';

describe('7. Axios CSRF Interceptor & Single Retry Defense', () => {
  const originalAdapter = apiClient.defaults.adapter;

  beforeEach(() => {
    document.cookie = '';
  });

  afterEach(() => {
    apiClient.defaults.adapter = originalAdapter;
  });

  it('triggers exactly one CSRF refetch and request retry on 403 CSRF_TOKEN_INVALID, avoiding infinite loops', async () => {
    let callCount = 0;
    let csrfFetched = false;

    apiClient.defaults.adapter = async (
      config: InternalAxiosRequestConfig
    ): Promise<AxiosResponse> => {
      const url = config.url || '';

      if (url.includes('/auth/csrf')) {
        csrfFetched = true;
        document.cookie = 'XSRF-TOKEN=fresh-csrf-token-abc; path=/';
        return {
          data: null,
          status: 204,
          statusText: 'No Content',
          headers: {},
          config,
        };
      }

      if (url.includes('/test-mutate')) {
        callCount++;
        // First attempt: simulate 403 CSRF_TOKEN_INVALID error from server
        if (callCount === 1) {
          const error = new AxiosError('Request failed with status code 403');
          error.config = config;
          error.response = {
            data: {
              success: false,
              errorCode: 'CSRF_TOKEN_INVALID',
              message: 'Invalid or missing CSRF token.',
              timestamp: new Date().toISOString(),
            },
            status: 403,
            statusText: 'Forbidden',
            headers: {},
            config,
          };
          return Promise.reject(error);
        }

        // Second attempt (retry): verify fresh X-XSRF-TOKEN header was set by interceptor
        expect(config.headers?.get('X-XSRF-TOKEN')).toBe(
          'fresh-csrf-token-abc'
        );

        return {
          data: { success: true, message: 'Mutation successful' },
          status: 200,
          statusText: 'OK',
          headers: {},
          config,
        };
      }

      return {
        data: {},
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      };
    };

    // Pre-populate old invalid token
    document.cookie = 'XSRF-TOKEN=old-invalid-token; path=/';

    const response = await apiClient.post('/test-mutate', { sample: 123 });

    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    expect(csrfFetched).toBe(true);
    // Verified: Exactly 2 calls (initial failed attempt + 1 successful retry)
    expect(callCount).toBe(2);
  });

  it('does NOT loop infinitely if the retried request still returns 403 CSRF_TOKEN_INVALID', async () => {
    let callCount = 0;

    apiClient.defaults.adapter = async (
      config: InternalAxiosRequestConfig
    ): Promise<AxiosResponse> => {
      const url = config.url || '';

      if (url.includes('/auth/csrf')) {
        document.cookie = 'XSRF-TOKEN=another-token; path=/';
        return {
          data: null,
          status: 204,
          statusText: 'No Content',
          headers: {},
          config,
        };
      }

      if (url.includes('/persistent-csrf-fail')) {
        callCount++;
        const error = new AxiosError('Persistent CSRF failure');
        error.config = config;
        error.response = {
          data: {
            success: false,
            errorCode: 'CSRF_TOKEN_INVALID',
            message: 'Token still invalid.',
            timestamp: new Date().toISOString(),
          },
          status: 403,
          statusText: 'Forbidden',
          headers: {},
          config,
        };
        return Promise.reject(error);
      }

      return {
        data: {},
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      };
    };

    document.cookie = 'XSRF-TOKEN=bad-token; path=/';

    await expect(apiClient.post('/persistent-csrf-fail', {})).rejects.toThrow();

    // Call count must be exactly 2: 1 initial attempt + 1 retry, NOT an infinite loop
    expect(callCount).toBe(2);
  });
});
