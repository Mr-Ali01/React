import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { ApiResponse } from '@/types';
import { useAuthStore } from '@/stores/authStore';

/**
 * Custom typed ApiError carrying backend response attributes
 * such as errorCode, HTTP status, and field validation errors.
 */
export class ApiError extends Error {
  errorCode?: string;
  status?: number;
  errors?: Record<string, string> | string;
  data?: ApiResponse<unknown>;
  retryAfter?: number;

  constructor(
    message: string,
    options?: {
      errorCode?: string;
      status?: number;
      errors?: Record<string, string> | string;
      data?: ApiResponse<unknown>;
      retryAfter?: number;
    }
  ) {
    super(message);
    this.name = 'ApiError';
    this.errorCode = options?.errorCode;
    this.status = options?.status;
    this.errors = options?.errors;
    this.data = options?.data;
    this.retryAfter = options?.retryAfter;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

export function isApiError(error: unknown): error is ApiError {
  if (error instanceof ApiError) {
    return true;
  }
  if (typeof error === 'object' && error !== null) {
    const candidate = error as Record<string, unknown>;
    return (
      candidate.name === 'ApiError' &&
      typeof candidate.message === 'string' &&
      (candidate.errorCode === undefined ||
        typeof candidate.errorCode === 'string') &&
      (candidate.status === undefined || typeof candidate.status === 'number')
    );
  }
  return false;
}

/**
 * Strict parser for HTTP Retry-After headers or values.
 * Accepts:
 * - Positive integers (number)
 * - String containing only digits representing positive integer seconds (e.g. "30", " 30 ")
 * Rejects:
 * - Non-integer strings with digit prefixes (e.g. "30abc")
 * - Non-numeric strings (e.g. "abc", "")
 * - Zero ("0", 0) and negative values ("-1", -1)
 * - Non-integer floats (30.5)
 * - null, undefined, objects, booleans
 *
 * Returns positive integer number of seconds, or null.
 */
export function parseRetryAfter(value: unknown): number | null {
  if (typeof value === 'number') {
    return Number.isInteger(value) && value > 0 ? value : null;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!/^\d+$/.test(trimmed)) {
      return null;
    }
    const parsed = parseInt(trimmed, 10);
    return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
  }
  if (Array.isArray(value) && value.length > 0) {
    return parseRetryAfter(value[0]);
  }
  return null;
}

/**
 * Reads a cookie value by name from document.cookie.
 * Safe for use in browser runtime.
 */
export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') {
    return null;
  }
  const match = document.cookie.match(
    new RegExp('(^|;\\s*)(' + name + ')=([^;]*)')
  );
  return match ? decodeURIComponent(match[3]) : null;
}

// Relative same-origin base URL via Vite proxy in development to avoid CORS & keep cookies same-site
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

/**
 * Reusable Axios HTTP client.
 * Configured with:
 * - withCredentials: true (persists ACADLYTIC_SID session cookie across requests per ADR-03)
 * - CSRF cookie/header synchronization (X-XSRF-TOKEN per ADR-04)
 * - Standardized error extraction mapping backend errors into ApiError
 */
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 15000,
});

/**
 * Callback hook to purge query cache when unauthorized session expiration occurs.
 */
let sessionPurgeCallback: (() => void) | null = null;
export function registerSessionPurgeHandler(handler: () => void) {
  sessionPurgeCallback = handler;
}

/**
 * Fetch a fresh CSRF token from the backend.
 * Calling GET /api/v1/auth/csrf instructs Spring Security to issue
 * an XSRF-TOKEN cookie (SameSite=Lax, Path=/).
 */
export async function fetchCsrfToken(): Promise<string | null> {
  try {
    await apiClient.get('/auth/csrf');
    return getCookie('XSRF-TOKEN');
  } catch (err) {
    console.warn('Failed to fetch CSRF token:', err);
    return null;
  }
}

// Mutating HTTP methods requiring CSRF protection
const MUTATING_METHODS = new Set(['post', 'put', 'patch', 'delete']);

// Track active retry requests to prevent infinite loops
export interface CustomRequestConfig extends InternalAxiosRequestConfig {
  _csrfRetry?: boolean;
}

/**
 * Request interceptor:
 * Automatically reads the XSRF-TOKEN cookie and attaches it as the
 * X-XSRF-TOKEN header for all state-changing requests.
 * Bootstraps the cookie before dispatching if missing, so the first login does NOT depend on a 403-retry.
 */
apiClient.interceptors.request.use(
  async (config: CustomRequestConfig) => {
    const method = config.method?.toLowerCase() || 'get';
    const isCsrfBootstrap = config.url?.includes('/auth/csrf');

    if (MUTATING_METHODS.has(method) && !isCsrfBootstrap) {
      let xsrfToken = getCookie('XSRF-TOKEN');

      // Bootstrap token if missing before the request is dispatched
      if (!xsrfToken && !config._csrfRetry) {
        xsrfToken = await fetchCsrfToken();
      }

      if (xsrfToken) {
        config.headers.set('X-XSRF-TOKEN', xsrfToken);
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Response interceptor:
 * - On 403 CSRF_TOKEN_INVALID: refetches token and retries request exactly once (no infinite loop).
 * - On 401: handles session expiration vs login failure vs guest check.
 * - Extracts structured errors into typed ApiError.
 */
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiResponse<unknown>>) => {
    const originalRequest = error.config as CustomRequestConfig | undefined;
    const url = originalRequest?.url || '';

    // 1. Handle CSRF token invalidation (single retry only; never retry /auth/csrf itself)
    const isCsrfError =
      error.response?.status === 403 &&
      error.response?.data?.errorCode === 'CSRF_TOKEN_INVALID';

    if (
      isCsrfError &&
      originalRequest &&
      !originalRequest._csrfRetry &&
      !url.includes('/auth/csrf')
    ) {
      originalRequest._csrfRetry = true;
      const freshToken = await fetchCsrfToken();
      if (freshToken) {
        originalRequest.headers.set('X-XSRF-TOKEN', freshToken);
        return apiClient(originalRequest);
      }
    }

    // 2. Handle 401 UNAUTHORIZED
    if (error.response?.status === 401) {
      const isAuthMe = url.includes('/auth/me');
      const isAuthLogin = url.includes('/auth/login');

      if (isAuthMe) {
        // Initial / background session probe on guest:
        // Quietly reset local state without error toasts or redirect loops.
        useAuthStore.getState().clearAuth();
      } else if (isAuthLogin) {
        // Invalid credentials during login attempt:
        // Reject so the login form displays inline error; do NOT trigger global redirect.
      } else {
        // Session expired on protected resource:
        // Clear auth store, invoke session purge callback, and redirect to login if browser
        useAuthStore.getState().clearAuth();
        sessionPurgeCallback?.();
        if (
          typeof window !== 'undefined' &&
          !window.location.pathname.startsWith('/auth/login')
        ) {
          window.location.assign('/auth/login');
        }
      }
    }

    // 3. Map into standardized typed ApiError
    const responseData = error.response?.data;
    const errorMsg =
      responseData?.message ||
      error.message ||
      'An unexpected network error occurred';

    const rawRetryHeader =
      error.response?.headers?.['retry-after'] ??
      (typeof error.response?.headers?.get === 'function'
        ? error.response.headers.get('retry-after')
        : undefined);
    const parsedRetry = parseRetryAfter(rawRetryHeader);
    const retryAfter = parsedRetry !== null ? parsedRetry : undefined;

    const apiError = new ApiError(errorMsg, {
      errorCode: responseData?.errorCode,
      status: error.response?.status,
      errors: responseData?.errors,
      data: responseData,
      retryAfter,
    });

    return Promise.reject(apiError);
  }
);
