/**
 * ResultPoint Authentication API Service.
 * Maps to backend endpoints in AuthController.java (`/api/v1/auth/*`).
 */

import { apiClient } from './apiClient.js';
import { refreshCoordinator } from './refreshCoordinator.js';

export const authApi = {
  /**
   * Register a new student account.
   * Backend endpoint: POST /api/v1/auth/signup
   * 
   * @param {Object} params
   * @param {string} params.fullName
   * @param {string} params.email
   * @param {string} params.password
   * @param {string} [params.phone]
   * @returns {Promise<import('./types').AuthResponse>}
   */
  async register({ fullName, email, password, phone = null }) {
    return apiClient.post(
      '/api/v1/auth/signup',
      { fullName, email, password, phone },
      { skipAuth: true }
    );
  },

  /**
   * Authenticate user with credentials.
   * Backend endpoint: POST /api/v1/auth/login
   * 
   * @param {Object} params
   * @param {string} params.email
   * @param {string} params.password
   * @param {string} [params.deviceInfo]
   * @returns {Promise<import('./types').AuthResponse>}
   */
  async login({ email, password, deviceInfo = null }) {
    return apiClient.post(
      '/api/v1/auth/login',
      { email, password, deviceInfo },
      { skipAuth: true }
    );
  },

  /**
   * Exchange rotating refresh token for fresh access and refresh token pair.
   * Backend endpoint: POST /api/v1/auth/refresh
   * 
   * @param {Object} params
   * @param {string} params.refreshToken
   * @param {string} [params.deviceInfo]
   * @returns {Promise<import('./types').AuthResponse>}
   */
  async refresh({ refreshToken, deviceInfo = null }) {
    return apiClient.post(
      '/api/v1/auth/refresh',
      { refreshToken, deviceInfo },
      { skipAuth: true }
    );
  },

  /**
   * Revoke current device refresh token session.
   * Backend endpoint: POST /api/v1/auth/logout
   * 
   * @param {Object} [params]
   * @param {string} [params.refreshToken]
   * @returns {Promise<{ message: string }>}
   */
  async logout({ refreshToken = null } = {}) {
    return apiClient.post('/api/v1/auth/logout', { refreshToken });
  },

  /**
   * Revoke all active sessions for authenticated user.
   * Backend endpoint: POST /api/v1/auth/logout-all
   * 
   * @returns {Promise<{ message: string }>}
   */
  async logoutAll() {
    return apiClient.post('/api/v1/auth/logout-all', {});
  },

  /**
   * Retrieve current authenticated user profile.
   * Backend endpoint: GET /api/v1/auth/me
   * 
   * @returns {Promise<import('./types').UserSummaryDto>}
   */
  async getCurrentUser() {
    return apiClient.get('/api/v1/auth/me');
  },

  /**
   * Request password reset token.
   * Backend endpoint: POST /api/v1/auth/forgot-password
   * 
   * @param {Object} params
   * @param {string} params.email
   * @returns {Promise<{ message: string }>}
   */
  async forgotPassword({ email }) {
    return apiClient.post(
      '/api/v1/auth/forgot-password',
      { email },
      { skipAuth: true }
    );
  },

  /**
   * Reset password with verified token.
   * Backend endpoint: POST /api/v1/auth/reset-password
   * 
   * @param {Object} params
   * @param {string} params.token
   * @param {string} params.newPassword
   * @returns {Promise<{ message: string }>}
   */
  async resetPassword({ token, newPassword }) {
    return apiClient.post(
      '/api/v1/auth/reset-password',
      { token, newPassword },
      { skipAuth: true }
    );
  },
};

// Register refresh executor for coordinator to prevent circular dependencies
refreshCoordinator.setRefreshExecutor(async (refreshToken) => {
  return authApi.refresh({ refreshToken });
});
