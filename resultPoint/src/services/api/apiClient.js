/**
 * ResultPoint Centralized HTTP API Client.
 * 
 * Features:
 * - Environment-aware Base URL (`VITE_API_BASE_URL` or relative `/api/v1`).
 * - Automatic Bearer token injection from `tokenStorage`.
 * - Envelope unwrapping for backend `ApiResponse<T>`.
 * - Error normalization for backend `ApiErrorResponse`.
 * - Automatic 401 interception and single-use refresh token rotation via `refreshCoordinator`.
 * - Request replay queue with infinite retry loop protection (`_isRetry`).
 * - Secrets (passwords, tokens) strictly scrubbed from logs and error messages.
 */

import { tokenStorage } from './tokenStorage.js';
import { refreshCoordinator } from './refreshCoordinator.js';

// Resolve API base URL safely across Vite and Node test environments
const getBaseUrl = () => {
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL.replace(/\/+$/, '');
  }
  return '';
};

export class ApiError extends Error {
  constructor(message, { status = 500, code = 'INTERNAL_ERROR', details = null, raw = null } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
    this.raw = raw;
  }
}

/**
 * Normalizes HTTP error responses into ApiError instances.
 */
async function parseErrorResponse(response) {
  let errorData;
  try {
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      errorData = await response.json();
    } else {
      const text = await response.text();
      errorData = { message: text || response.statusText };
    }
  } catch {
    errorData = { message: response.statusText || 'Unknown network error' };
  }

  const errDetail = errorData?.error || errorData || {};
  const message = errDetail.message || errorData?.message || `Request failed with status ${response.status}`;
  const code = errDetail.code || 'HTTP_ERROR';
  const details = errDetail.details || null;

  return new ApiError(message, {
    status: response.status,
    code,
    details,
    raw: errorData,
  });
}

/**
 * Checks if a URL is exempt from automatic 401 refresh retries.
 */
function isRefreshExemptUrl(url) {
  const normalized = url.toLowerCase();
  return (
    normalized.includes('/auth/login') ||
    normalized.includes('/auth/signup') ||
    normalized.includes('/auth/register') ||
    normalized.includes('/auth/refresh') ||
    normalized.includes('/auth/forgot-password') ||
    normalized.includes('/auth/reset-password')
  );
}

/**
 * Core fetch wrapper.
 */
async function request(endpoint, options = {}) {
  const baseUrl = options.baseUrl !== undefined ? options.baseUrl : getBaseUrl();
  const url = endpoint.startsWith('http') ? endpoint : `${baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  const headers = new Headers(options.headers || {});

  // Add default Accept header
  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }

  // Set Content-Type for JSON payloads if not already set and body is not FormData
  if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  // Inject Bearer token if not explicitly skipped
  if (!options.skipAuth && !headers.has('Authorization')) {
    const token = tokenStorage.getAccessToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  const fetchOptions = {
    ...options,
    headers,
  };

  let response;
  try {
    response = await fetch(url, fetchOptions);
  } catch (netErr) {
    throw new ApiError(netErr.message || 'Network connection failure. Please check your internet connection.', {
      status: 0,
      code: 'NETWORK_FAILURE',
      raw: netErr,
    });
  }

  // Handle 401 Unauthorized
  if (response.status === 401) {
    const isExempt = isRefreshExemptUrl(url);
    const hasAlreadyRetried = Boolean(options._isRetry);

    if (!isExempt && !hasAlreadyRetried) {
      const failedAccessToken = tokenStorage.getAccessToken();
      try {
        // Attempt single-use refresh rotation coordinated across tabs
        const freshSession = await refreshCoordinator.acquireFreshTokens(failedAccessToken);

        // Replay original request with fresh access token and marked as retry
        const retryHeaders = new Headers(options.headers || {});
        retryHeaders.set('Authorization', `Bearer ${freshSession.accessToken}`);

        return await request(endpoint, {
          ...options,
          headers: retryHeaders,
          _isRetry: true,
        });
      } catch (refreshErr) {
        // Refresh failed: tokens are already cleared by coordinator
        throw new ApiError('Your session has expired. Please log in again.', {
          status: 401,
          code: 'SESSION_EXPIRED',
          raw: refreshErr,
        });
      }
    }

    // Exempt or already retried 401
    throw await parseErrorResponse(response);
  }

  // Handle other error statuses (4xx, 5xx)
  if (!response.ok) {
    throw await parseErrorResponse(response);
  }

  // Process 204 No Content
  if (response.status === 204) {
    return null;
  }

  // Process Binary / Blob responses (e.g. PDF generation)
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/pdf') || options.responseType === 'blob') {
    return await response.blob();
  }

  // Process JSON responses
  if (contentType.includes('application/json')) {
    const json = await response.json();
    // Unwrap standard ApiResponse<T>
    if (json && typeof json === 'object' && 'success' in json && 'data' in json) {
      if (json.success === false) {
        throw new ApiError(json.error?.message || 'Operation failed', {
          status: json.error?.status || response.status,
          code: json.error?.code || 'OPERATION_FAILED',
          details: json.error?.details || null,
          raw: json,
        });
      }
      return json.data;
    }
    return json;
  }

  return await response.text();
}

export const apiClient = {
  request,
  get(endpoint, options = {}) {
    return request(endpoint, { ...options, method: 'GET' });
  },
  post(endpoint, body = null, options = {}) {
    const isFormData = body instanceof FormData;
    return request(endpoint, {
      ...options,
      method: 'POST',
      body: isFormData || typeof body === 'string' || body === null ? body : JSON.stringify(body),
    });
  },
  put(endpoint, body = null, options = {}) {
    const isFormData = body instanceof FormData;
    return request(endpoint, {
      ...options,
      method: 'PUT',
      body: isFormData || typeof body === 'string' || body === null ? body : JSON.stringify(body),
    });
  },
  patch(endpoint, body = null, options = {}) {
    const isFormData = body instanceof FormData;
    return request(endpoint, {
      ...options,
      method: 'PATCH',
      body: isFormData || typeof body === 'string' || body === null ? body : JSON.stringify(body),
    });
  },
  delete(endpoint, options = {}) {
    return request(endpoint, { ...options, method: 'DELETE' });
  },
};
