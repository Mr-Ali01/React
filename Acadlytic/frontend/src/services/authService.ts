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
  VerifyEmailRequest,
  VerifyEmailResponse,
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

  /**
   * Redeems a single-use 48-hour email verification token.
   * Public endpoint; does NOT establish an authenticated session.
   */
  verifyEmail: async (
    payload: VerifyEmailRequest
  ): Promise<VerifyEmailResponse> => {
    const response = await apiClient.post<ApiResponse<VerifyEmailResponse>>(
      '/auth/verify-email',
      payload
    );
    return response.data.data;
  },

  /**
   * Requests a fresh 48-hour verification token for the authenticated COLLEGE_ADMIN.
   * Enforces dual-layer rate limits (3 requests / 15 min per user, 5 / 60 min per IP).
   */
  resendVerification: async (): Promise<void> => {
    await apiClient.post<ApiResponse<void>>('/auth/resend-verification');
  },
};
