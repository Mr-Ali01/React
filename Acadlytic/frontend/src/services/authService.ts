import { apiClient, fetchCsrfToken } from './api';
import {
  ApiResponse,
  CurrentUser,
  LoginRequest,
  ChangePasswordRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  ChangeEmailRequest,
  VerifyEmailChangeRequest,
} from '@/types';

/**
 * Authentication API Service.
 * Implements the backend authentication REST contracts (ADR-01 - ADR-19):
 * - Stateful HTTP-only session cookie authentication (no JWT)
 * - SPA CSRF token management
 * - Password and email lifecycle operations
 */
export const authService = {
  /**
   * Initializes the CSRF cookie by invoking GET /api/v1/auth/csrf.
   */
  bootstrapCsrf: async (): Promise<string | null> => {
    return fetchCsrfToken();
  },

  /**
   * Authenticates user with email and password.
   * On success, backend issues HTTP-only ACADLYTIC_SID cookie.
   */
  login: async (credentials: LoginRequest): Promise<CurrentUser> => {
    const response = await apiClient.post<ApiResponse<CurrentUser>>(
      '/auth/login',
      credentials
    );
    return response.data.data;
  },

  /**
   * Terminates active session and clears the server-side session row.
   */
  logout: async (): Promise<void> => {
    await apiClient.post<ApiResponse<void>>('/auth/logout');
  },

  /**
   * Retrieves the current authenticated user context and college approval status.
   */
  getMe: async (): Promise<CurrentUser> => {
    const response = await apiClient.get<ApiResponse<CurrentUser>>('/auth/me');
    return response.data.data;
  },

  /**
   * Changes password and revokes all other active sessions (ADR-08).
   */
  changePassword: async (payload: ChangePasswordRequest): Promise<void> => {
    await apiClient.post<ApiResponse<void>>('/auth/change-password', payload);
  },

  /**
   * Dispatches a self-service password reset email via transactional outbox.
   */
  forgotPassword: async (payload: ForgotPasswordRequest): Promise<void> => {
    await apiClient.post<ApiResponse<void>>('/auth/forgot-password', payload);
  },

  /**
   * Redeems a single-use SHA-256 hashed password reset token.
   */
  resetPassword: async (payload: ResetPasswordRequest): Promise<void> => {
    await apiClient.post<ApiResponse<void>>('/auth/reset-password', payload);
  },

  /**
   * Requests email change by setting pending_email and dispatching a token.
   */
  changeEmail: async (payload: ChangeEmailRequest): Promise<void> => {
    await apiClient.post<ApiResponse<void>>('/auth/change-email', payload);
  },

  /**
   * Confirms email change token and updates the primary email.
   */
  verifyEmailChange: async (
    payload: VerifyEmailChangeRequest
  ): Promise<void> => {
    await apiClient.post<ApiResponse<void>>(
      '/auth/verify-email-change',
      payload
    );
  },
};
