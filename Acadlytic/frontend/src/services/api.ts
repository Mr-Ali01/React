import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { ApiResponse } from '@/types';

/**
 * Reads a cookie value by name from document.cookie.
 * Safe for use in browser runtime.
 */
export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') {
    return null;
  }
  const match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
  return match ? decodeURIComponent(match[3]) : null;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

/**
 * Reusable Axios HTTP client.
 * Configured with:
 * - withCredentials: true (persists ACADLYTIC_SID session cookie across requests per ADR-03)
 * - CSRF cookie/header synchronization (X-XSRF-TOKEN per ADR-04)
 * - Standardized error extraction matching backend ApiResponse<T>
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
interface CustomRequestConfig extends InternalAxiosRequestConfig {
  _csrfRetry?: boolean;
}

/**
 * Request interceptor:
 * Automatically reads the XSRF-TOKEN cookie and attaches it as the
 * X-XSRF-TOKEN header for all state-changing requests.
 */
apiClient.interceptors.request.use(
  async (config: CustomRequestConfig) => {
    const method = config.method?.toLowerCase() || 'get';
    if (MUTATING_METHODS.has(method)) {
      let xsrfToken = getCookie('XSRF-TOKEN');

      // If no token exists yet in document.cookie, bootstrap it once
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
 * - Handles 403 CSRF_TOKEN_INVALID with a single automatic token refresh and request retry
 * - Extracts standardized error messages from ApiResponse<T>
 */
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiResponse<unknown>>) => {
    const originalRequest = error.config as CustomRequestConfig | undefined;

    // Handle CSRF token invalidation (e.g. server restarted or cookie expired)
    const isCsrfError =
      error.response?.status === 403 &&
      error.response?.data?.errorCode === 'CSRF_TOKEN_INVALID';

    if (isCsrfError && originalRequest && !originalRequest._csrfRetry) {
      originalRequest._csrfRetry = true;
      const freshToken = await fetchCsrfToken();
      if (freshToken) {
        originalRequest.headers.set('X-XSRF-TOKEN', freshToken);
        return apiClient(originalRequest);
      }
    }

    const errorMsg =
      error.response?.data?.message ||
      error.message ||
      'An unexpected network error occurred';

    // Attach structured error information for caller components
    const customError = new Error(errorMsg) as Error & {
      errorCode?: string;
      status?: number;
      data?: ApiResponse<unknown>;
    };
    customError.errorCode = error.response?.data?.errorCode;
    customError.status = error.response?.status;
    customError.data = error.response?.data;

    return Promise.reject(customError);
  }
);
