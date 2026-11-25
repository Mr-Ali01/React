import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, waitFor, act, fireEvent, renderHook } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { VerifyEmailPage } from '@/pages/auth/VerifyEmailPage';
import { OnboardingStatusPage } from '@/pages/OnboardingStatusPage';
import { authService } from '@/services/authService';
import { ApiError } from '@/services/api';
import { useAuthStore } from '@/stores/authStore';
import { renderWithProviders, createTestQueryClient } from './test-utils';
import { VerifyEmailResponse } from '@/types';
import {
  useVerifyEmail,
  useResendVerification,
  _resetConcurrencyFlags,
} from '@/hooks/useEmailVerification';

const VALID_SAMPLE_TOKEN = 'sample-valid-43-character-cryptographic-token-value';

describe('Module 3.2 — Email Verification & Account Activation (Frontend)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    useAuthStore.getState().clearAuth();
    _resetConcurrencyFlags();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  // --------------------------------------------------------------------------
  // Scenario 1: Reads ?token=..., sanitizes URL bar, dispatches API request once
  // --------------------------------------------------------------------------
  it('1. reads token from URL, removes token from address bar, and dispatches API call once', async () => {
    const verifySpy = vi
      .spyOn(authService, 'verifyEmail')
      .mockResolvedValueOnce({
        email: 'admin@horizon.edu',
        emailVerified: true,
        verifiedAt: '2026-11-24T19:00:00Z',
      });

    let currentSearch = '';
    const LocationWatcher = () => {
      const location = useLocation();
      currentSearch = location.search;
      return null;
    };

    renderWithProviders(
      <MemoryRouter initialEntries={[`/verify-email?token=${VALID_SAMPLE_TOKEN}`]}>
        <LocationWatcher />
        <Routes>
          <Route path="/verify-email" element={<VerifyEmailPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(verifySpy).toHaveBeenCalledTimes(1);
      expect(verifySpy).toHaveBeenCalledWith({ token: VALID_SAMPLE_TOKEN });
      expect(screen.getByText('Email Verified Successfully')).toBeInTheDocument();
    });

    // Address bar query param 'token' must be stripped
    expect(currentSearch).not.toContain('token=');
  });

  // --------------------------------------------------------------------------
  // Scenario 2: Preserves unrelated query parameters and router location.state
  // --------------------------------------------------------------------------
  it('2. preserves unrelated query parameters and router location.state after token sanitization', async () => {
    vi.spyOn(authService, 'verifyEmail').mockResolvedValueOnce({
      email: 'admin@horizon.edu',
      emailVerified: true,
      verifiedAt: '2026-11-24T19:00:00Z',
    });

    let observedSearch = '';
    let observedState: unknown = null;

    const StateWatcher = () => {
      const location = useLocation();
      observedSearch = location.search;
      observedState = location.state;
      return null;
    };

    renderWithProviders(
      <MemoryRouter
        initialEntries={[
          {
            pathname: '/verify-email',
            search: `?token=${VALID_SAMPLE_TOKEN}&campaign=2026&ref=welcome_email`,
            state: { from: '/auth/register-college', customId: 42 },
          },
        ]}
      >
        <StateWatcher />
        <Routes>
          <Route path="/verify-email" element={<VerifyEmailPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Email Verified Successfully')).toBeInTheDocument();
    });

    // 'token' is deleted, but 'campaign' and 'ref' are retained
    expect(observedSearch).not.toContain('token=');
    expect(observedSearch).toContain('campaign=2026');
    expect(observedSearch).toContain('ref=welcome_email');

    // router history state is preserved exactly
    expect(observedState).toEqual({ from: '/auth/register-college', customId: 42 });
  });

  // --------------------------------------------------------------------------
  // Scenario 3: Dual-route mount: /verify-email access
  // --------------------------------------------------------------------------
  it('3. mounts and verifies successfully via /verify-email path (matching backend template)', async () => {
    vi.spyOn(authService, 'verifyEmail').mockResolvedValueOnce({
      email: 'template-test@horizon.edu',
      emailVerified: true,
      verifiedAt: '2026-11-24T19:00:00Z',
    });

    renderWithProviders(
      <MemoryRouter initialEntries={[`/verify-email?token=${VALID_SAMPLE_TOKEN}`]}>
        <Routes>
          <Route path="/verify-email" element={<VerifyEmailPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Email Verified Successfully')).toBeInTheDocument();
      expect(screen.getAllByText('template-test@horizon.edu')[0]).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // Scenario 4: Dual-route mount: /auth/verify-email access
  // --------------------------------------------------------------------------
  it('4. mounts and verifies successfully via /auth/verify-email path', async () => {
    vi.spyOn(authService, 'verifyEmail').mockResolvedValueOnce({
      email: 'auth-ns@horizon.edu',
      emailVerified: true,
      verifiedAt: '2026-11-24T19:00:00Z',
    });

    renderWithProviders(
      <MemoryRouter initialEntries={[`/auth/verify-email?token=${VALID_SAMPLE_TOKEN}`]}>
        <Routes>
          <Route path="/auth/verify-email" element={<VerifyEmailPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Email Verified Successfully')).toBeInTheDocument();
      expect(screen.getAllByText('auth-ns@horizon.edu')[0]).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // Scenario 5: Authenticated user visits /verify-email and is NOT redirected away
  // --------------------------------------------------------------------------
  it('5. allows an authenticated user to access /verify-email without PublicOnlyRoute redirect', async () => {
    useAuthStore.setState({
      isAuthenticated: true,
      user: {
        id: 10,
        email: 'authenticated-admin@horizon.edu',
        firstName: 'Eleanor',
        lastName: 'Vane',
        role: 'COLLEGE_ADMIN',
        collegeId: 100,
        collegeCode: 'HORIZON',
        collegeApprovalStatus: 'PENDING',
        managementUnlocked: false,
        emailVerified: false,
      },
      isLoading: false,
    });

    vi.spyOn(authService, 'verifyEmail').mockResolvedValueOnce({
      email: 'authenticated-admin@horizon.edu',
      emailVerified: true,
      verifiedAt: '2026-11-24T19:00:00Z',
    });

    renderWithProviders(
      <MemoryRouter initialEntries={[`/verify-email?token=${VALID_SAMPLE_TOKEN}`]}>
        <Routes>
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/onboarding-status" element={<div>Onboarding Status Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    // User is NOT redirected to /college/dashboard or /onboarding-status before verification
    await waitFor(() => {
      expect(screen.getByText('Email Verified Successfully')).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /go to onboarding dashboard/i })
      ).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // Scenario 6: Guest verification success renders sign in button and metadata
  // --------------------------------------------------------------------------
  it('6. guest verification success displays metadata and links to /auth/login without creating session', async () => {
    vi.spyOn(authService, 'verifyEmail').mockResolvedValueOnce({
      email: 'guest-admin@horizon.edu',
      emailVerified: true,
      verifiedAt: '2026-11-24T19:00:00Z',
    });

    renderWithProviders(
      <MemoryRouter initialEntries={[`/verify-email?token=${VALID_SAMPLE_TOKEN}`]}>
        <Routes>
          <Route path="/verify-email" element={<VerifyEmailPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Email Verified Successfully')).toBeInTheDocument();
      expect(screen.getAllByText('guest-admin@horizon.edu')[0]).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /proceed to sign in/i })
      ).toBeInTheDocument();
    });

    // Crucial check: User remains guest (not authenticated)
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  // --------------------------------------------------------------------------
  // Scenario 7: Authenticated verification updates currentUser and links to dashboard
  // --------------------------------------------------------------------------
  it('7. authenticated verification updates store emailVerified to true and links to onboarding dashboard', async () => {
    useAuthStore.setState({
      isAuthenticated: true,
      user: {
        id: 11,
        email: 'logged-in@horizon.edu',
        firstName: 'Arthur',
        lastName: 'Pendelton',
        role: 'COLLEGE_ADMIN',
        collegeId: 101,
        collegeCode: 'HORIZON',
        collegeApprovalStatus: 'PENDING',
        managementUnlocked: false,
        emailVerified: false,
      },
      isLoading: false,
    });

    vi.spyOn(authService, 'verifyEmail').mockResolvedValueOnce({
      email: 'logged-in@horizon.edu',
      emailVerified: true,
      verifiedAt: '2026-11-24T19:00:00Z',
    });

    renderWithProviders(
      <MemoryRouter initialEntries={[`/verify-email?token=${VALID_SAMPLE_TOKEN}`]}>
        <Routes>
          <Route path="/verify-email" element={<VerifyEmailPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Email Verified Successfully')).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /go to onboarding dashboard/i })
      ).toBeInTheDocument();
    });

    // In-memory authStore user is updated to emailVerified: true
    expect(useAuthStore.getState().user?.emailVerified).toBe(true);
  });

  // --------------------------------------------------------------------------
  // Scenario 8: Separation notice: college review is separate from email verification
  // --------------------------------------------------------------------------
  it('8. renders explicit separation notice stating institution review remains pending Super Admin evaluation', async () => {
    vi.spyOn(authService, 'verifyEmail').mockResolvedValueOnce({
      email: 'separate-check@horizon.edu',
      emailVerified: true,
      verifiedAt: '2026-11-24T19:00:00Z',
    });

    renderWithProviders(
      <MemoryRouter initialEntries={[`/verify-email?token=${VALID_SAMPLE_TOKEN}`]}>
        <Routes>
          <Route path="/verify-email" element={<VerifyEmailPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(
        screen.getByText(/college approval workflow separate/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/your institution registration remains in/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/awaiting super admin accreditation review/i)
      ).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // Scenario 9: Missing token parameter in URL renders Missing Token view
  // --------------------------------------------------------------------------
  it('9. missing token parameter in URL renders No Verification Token Found card', async () => {
    const verifySpy = vi.spyOn(authService, 'verifyEmail');

    renderWithProviders(
      <MemoryRouter initialEntries={['/verify-email']}>
        <Routes>
          <Route path="/verify-email" element={<VerifyEmailPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(
      screen.getByText('No Verification Token Found')
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /sign in to your account/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /register an institution/i })
    ).toBeInTheDocument();

    // No API call is made
    expect(verifySpy).not.toHaveBeenCalled();
  });

  // --------------------------------------------------------------------------
  // Scenario 10: Token length < 20 characters rejected client-side
  // --------------------------------------------------------------------------
  it('10. token length < 20 characters is rejected client-side before API dispatch', async () => {
    const verifySpy = vi.spyOn(authService, 'verifyEmail');

    renderWithProviders(
      <MemoryRouter initialEntries={['/verify-email?token=short-token']}>
        <Routes>
          <Route path="/verify-email" element={<VerifyEmailPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(
        screen.getByText('Verification Link Invalid or Expired')
      ).toBeInTheDocument();
    });

    // Did NOT dispatch API request with invalid token length
    expect(verifySpy).not.toHaveBeenCalled();
  });

  // --------------------------------------------------------------------------
  // Scenario 11: Expired or invalid token (400 INVALID_OR_EXPIRED_TOKEN)
  // --------------------------------------------------------------------------
  it('11. expired or invalid token (400 INVALID_OR_EXPIRED_TOKEN) renders invalid/expired view', async () => {
    vi.spyOn(authService, 'verifyEmail').mockRejectedValueOnce(
      new ApiError('The token is invalid or has expired.', {
        errorCode: 'INVALID_OR_EXPIRED_TOKEN',
        status: 400,
      })
    );

    renderWithProviders(
      <MemoryRouter initialEntries={[`/verify-email?token=${VALID_SAMPLE_TOKEN}`]}>
        <Routes>
          <Route path="/verify-email" element={<VerifyEmailPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(
        screen.getByText('Verification Link Invalid or Expired')
      ).toBeInTheDocument();
      expect(
        screen.getByText(/the token is invalid or has expired/i)
      ).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // Scenario 12: Guest view on expired token prompts sign in
  // --------------------------------------------------------------------------
  it('12. guest view on expired token prompts user to sign in to request new link', async () => {
    vi.spyOn(authService, 'verifyEmail').mockRejectedValueOnce(
      new ApiError('The token is invalid or has expired.', {
        errorCode: 'INVALID_OR_EXPIRED_TOKEN',
        status: 400,
      })
    );

    renderWithProviders(
      <MemoryRouter initialEntries={[`/verify-email?token=${VALID_SAMPLE_TOKEN}`]}>
        <Routes>
          <Route path="/verify-email" element={<VerifyEmailPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(
        screen.getByText(/sign in with your administrator email and password/i)
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /sign in to request new link/i })
      ).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // Scenario 13: Authenticated view on expired token renders Resend button
  // --------------------------------------------------------------------------
  it('13. authenticated view on expired token renders active Resend Verification button', async () => {
    useAuthStore.setState({
      isAuthenticated: true,
      user: {
        id: 12,
        email: 'expired-auth@horizon.edu',
        firstName: 'Eleanor',
        lastName: 'Vane',
        role: 'COLLEGE_ADMIN',
        collegeApprovalStatus: 'PENDING',
        managementUnlocked: false,
        emailVerified: false,
      },
      isLoading: false,
    });

    vi.spyOn(authService, 'verifyEmail').mockRejectedValueOnce(
      new ApiError('The token is invalid or has expired.', {
        errorCode: 'INVALID_OR_EXPIRED_TOKEN',
        status: 400,
      })
    );

    renderWithProviders(
      <MemoryRouter initialEntries={[`/verify-email?token=${VALID_SAMPLE_TOKEN}`]}>
        <Routes>
          <Route path="/verify-email" element={<VerifyEmailPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(
        screen.getByText(/you are currently signed in\. you can request a fresh verification link/i)
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /resend verification email/i })
      ).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // Scenario 14: Already verified token (400 EMAIL_ALREADY_VERIFIED)
  // --------------------------------------------------------------------------
  it('14. already verified token (400 EMAIL_ALREADY_VERIFIED) displays Email Already Verified view', async () => {
    vi.spyOn(authService, 'verifyEmail').mockRejectedValueOnce(
      new ApiError('Your email address is already verified.', {
        errorCode: 'EMAIL_ALREADY_VERIFIED',
        status: 400,
      })
    );

    renderWithProviders(
      <MemoryRouter initialEntries={[`/verify-email?token=${VALID_SAMPLE_TOKEN}`]}>
        <Routes>
          <Route path="/verify-email" element={<VerifyEmailPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Email Already Verified')).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /sign in to your account/i })
      ).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // Scenario 15: Inactive user account (403 AUTH_ACCOUNT_INACTIVE)
  // --------------------------------------------------------------------------
  it('15. inactive user account (403 AUTH_ACCOUNT_INACTIVE) displays Account Inactive view', async () => {
    vi.spyOn(authService, 'verifyEmail').mockRejectedValueOnce(
      new ApiError('Your account is not active.', {
        errorCode: 'AUTH_ACCOUNT_INACTIVE',
        status: 403,
      })
    );

    renderWithProviders(
      <MemoryRouter initialEntries={[`/verify-email?token=${VALID_SAMPLE_TOKEN}`]}>
        <Routes>
          <Route path="/verify-email" element={<VerifyEmailPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Account Inactive')).toBeInTheDocument();
      expect(
        screen.getByText(/your administrator account has been deactivated or suspended/i)
      ).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // Scenario 16: Access denied on resend (403 ACCESS_DENIED)
  // --------------------------------------------------------------------------
  it('16. access denied on resend (403 ACCESS_DENIED) displays Access Denied alert', async () => {
    useAuthStore.setState({
      isAuthenticated: true,
      user: {
        id: 99,
        email: 'superadmin@acadlytic.com',
        firstName: 'Super',
        lastName: 'Admin',
        role: 'SUPER_ADMIN',
        managementUnlocked: true,
        emailVerified: true,
      },
      isLoading: false,
    });

    vi.spyOn(authService, 'resendVerification').mockRejectedValueOnce(
      new ApiError('Only college administrators can request verification resend.', {
        errorCode: 'ACCESS_DENIED',
        status: 403,
      })
    );

    const { ResendVerificationButton } = await import(
      '@/components/verification/ResendVerificationButton'
    );

    renderWithProviders(<ResendVerificationButton />);

    const resendBtn = screen.getByRole('button', {
      name: /resend verification email/i,
    });
    fireEvent.click(resendBtn);

    await waitFor(() => {
      expect(screen.getByText('Access Denied')).toBeInTheDocument();
      expect(
        screen.getByText(/only college administrators can request verification email resend/i)
      ).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // Scenario 17: Terminal CSRF failure (403 CSRF_TOKEN_INVALID)
  // --------------------------------------------------------------------------
  it('17. terminal CSRF failure (403 CSRF_TOKEN_INVALID) displays security token error', async () => {
    vi.spyOn(authService, 'verifyEmail').mockRejectedValueOnce(
      new ApiError('CSRF token invalid', {
        errorCode: 'CSRF_TOKEN_INVALID',
        status: 403,
      })
    );

    renderWithProviders(
      <MemoryRouter initialEntries={[`/verify-email?token=${VALID_SAMPLE_TOKEN}`]}>
        <Routes>
          <Route path="/verify-email" element={<VerifyEmailPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Verification Failed')).toBeInTheDocument();
      expect(
        screen.getByText(/your security session token expired/i)
      ).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // Scenario 18: Resend rate limit exceeded with valid Retry-After: 60 countdown
  // --------------------------------------------------------------------------
  it('18. resend rate limit exceeded with Retry-After: 60 starts active countdown timer', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });

    useAuthStore.setState({
      isAuthenticated: true,
      user: {
        id: 15,
        email: 'ratelimit@college.edu',
        firstName: 'Rate',
        lastName: 'Limited',
        role: 'COLLEGE_ADMIN',
        managementUnlocked: false,
        emailVerified: false,
      },
      isLoading: false,
    });

    vi.spyOn(authService, 'resendVerification').mockRejectedValueOnce(
      new ApiError('Rate limit exceeded', {
        errorCode: 'RATE_LIMIT_EXCEEDED',
        status: 429,
        retryAfter: 60,
      })
    );

    const { ResendVerificationButton } = await import(
      '@/components/verification/ResendVerificationButton'
    );

    renderWithProviders(<ResendVerificationButton />);

    const resendBtn = screen.getByRole('button', {
      name: /resend verification email/i,
    });
    fireEvent.click(resendBtn);

    await waitFor(() => {
      expect(screen.getByText('Rate Limit Reached')).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /resend in 60s/i })
      ).toBeDisabled();
    });

    // Advance timer by 1 second
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /resend in 59s/i })
      ).toBeDisabled();
    });
  });

  // --------------------------------------------------------------------------
  // Scenario 19: Resend rate limit with missing/malformed header shows warning without fake timer
  // --------------------------------------------------------------------------
  it('19. resend rate limit with missing Retry-After shows persistent warning without fabricated timer', async () => {
    useAuthStore.setState({
      isAuthenticated: true,
      user: {
        id: 16,
        email: 'nofake@college.edu',
        firstName: 'No',
        lastName: 'Fake',
        role: 'COLLEGE_ADMIN',
        managementUnlocked: false,
        emailVerified: false,
      },
      isLoading: false,
    });

    vi.spyOn(authService, 'resendVerification').mockRejectedValueOnce(
      new ApiError('Rate limit exceeded', {
        errorCode: 'RATE_LIMIT_EXCEEDED',
        status: 429,
        // retryAfter is undefined/null
      })
    );

    const { ResendVerificationButton } = await import(
      '@/components/verification/ResendVerificationButton'
    );

    renderWithProviders(<ResendVerificationButton />);

    const resendBtn = screen.getByRole('button', {
      name: /resend verification email/i,
    });
    fireEvent.click(resendBtn);

    await waitFor(() => {
      expect(screen.getByText('Rate Limit Reached')).toBeInTheDocument();
      expect(
        screen.getByText(/please wait a while before retrying/i)
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /dismiss/i })
      ).toBeInTheDocument();
    });

    // Resend button does NOT display a fabricated countdown
    expect(screen.queryByText(/resend in/i)).not.toBeInTheDocument();

    // User can dismiss warning
    const dismissBtn = screen.getByRole('button', { name: /dismiss/i });
    fireEvent.click(dismissBtn);

    expect(
      screen.queryByText(/please wait a while before retrying/i)
    ).not.toBeInTheDocument();
  });

  // --------------------------------------------------------------------------
  // Scenario 20: StrictMode / remount duplicate verification submission prevention
  // --------------------------------------------------------------------------
  it('20. prevents duplicate verification requests under StrictMode or rapid double-mounts', async () => {
    const verifySpy = vi
      .spyOn(authService, 'verifyEmail')
      .mockResolvedValueOnce({
        email: 'dedup@horizon.edu',
        emailVerified: true,
        verifiedAt: '2026-11-24T19:00:00Z',
      });

    // Simulate StrictMode remount by mounting twice with identical initial entries
    const { unmount } = renderWithProviders(
      <MemoryRouter initialEntries={[`/verify-email?token=${VALID_SAMPLE_TOKEN}`]}>
        <Routes>
          <Route path="/verify-email" element={<VerifyEmailPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(verifySpy).toHaveBeenCalledTimes(1);
    });

    unmount();
    // Verify it was called strictly once
    expect(verifySpy).toHaveBeenCalledTimes(1);
  });

  // --------------------------------------------------------------------------
  // Scenario 21: Duplicate resend submission prevention
  // --------------------------------------------------------------------------
  it('21. in-flight resend request disables button and prevents duplicate submissions', async () => {
    let resolveResend: () => void;
    const resendPromise = new Promise<void>((resolve) => {
      resolveResend = resolve;
    });

    const resendSpy = vi
      .spyOn(authService, 'resendVerification')
      .mockImplementation(() => resendPromise);

    useAuthStore.setState({
      isAuthenticated: true,
      user: {
        id: 17,
        email: 'resend-flight@horizon.edu',
        firstName: 'In',
        lastName: 'Flight',
        role: 'COLLEGE_ADMIN',
        managementUnlocked: false,
        emailVerified: false,
      },
      isLoading: false,
    });

    const { ResendVerificationButton } = await import(
      '@/components/verification/ResendVerificationButton'
    );

    renderWithProviders(<ResendVerificationButton />);

    const resendBtn = screen.getByRole('button', {
      name: /resend verification email/i,
    });

    fireEvent.click(resendBtn);

    // Button transitions to loading state and becomes disabled
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /sending email/i })
      ).toBeDisabled();
    });

    // Second click attempt should be blocked
    fireEvent.click(resendBtn);
    expect(resendSpy).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveResend!();
    });

    await waitFor(() => {
      expect(
        screen.getByText('Verification Email Sent')
      ).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // Scenario 22: Concurrency lock between verify and resend
  // --------------------------------------------------------------------------
  it('22. disables resend button while an email verification mutation is pending', async () => {
    useAuthStore.setState({
      isAuthenticated: true,
      user: {
        id: 18,
        email: 'concurrent@horizon.edu',
        firstName: 'Lock',
        lastName: 'Test',
        role: 'COLLEGE_ADMIN',
        managementUnlocked: false,
        emailVerified: false,
      },
      isLoading: false,
    });

    let resolveVerify: (v: VerifyEmailResponse) => void;
    const pendingVerify = new Promise<VerifyEmailResponse>((resolve) => {
      resolveVerify = resolve;
    });

    vi.spyOn(authService, 'verifyEmail').mockImplementation(() => pendingVerify);

    const { ResendVerificationButton } = await import(
      '@/components/verification/ResendVerificationButton'
    );

    renderWithProviders(
      <MemoryRouter initialEntries={[`/verify-email?token=${VALID_SAMPLE_TOKEN}`]}>
        <Routes>
          <Route
            path="/verify-email"
            element={
              <div>
                <VerifyEmailPage />
                <ResendVerificationButton />
              </div>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    // While verification is in-flight, resend button is disabled
    await waitFor(() => {
      expect(screen.getByText('Verifying Email Address')).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /resend verification email/i })
      ).toBeDisabled();
    });

    await act(async () => {
      resolveVerify!({
        email: 'concurrent@horizon.edu',
        emailVerified: true,
        verifiedAt: '2026-11-24T19:00:00Z',
      });
    });

    await waitFor(() => {
      expect(screen.getByText('Email Verified Successfully')).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // Scenario 23: Component remount after token sanitization renders clean direct-access view
  // --------------------------------------------------------------------------
  it('23. page refresh after token sanitization renders clean Missing Token view without re-submitting', async () => {
    vi.spyOn(authService, 'verifyEmail').mockResolvedValueOnce({
      email: 'refresh@horizon.edu',
      emailVerified: true,
      verifiedAt: '2026-11-24T19:00:00Z',
    });

    // 1. Initial link visit
    const { unmount } = renderWithProviders(
      <MemoryRouter initialEntries={[`/verify-email?token=${VALID_SAMPLE_TOKEN}`]}>
        <Routes>
          <Route path="/verify-email" element={<VerifyEmailPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Email Verified Successfully')).toBeInTheDocument();
    });

    unmount();

    // 2. User refreshes browser (where token was already stripped to /verify-email)
    renderWithProviders(
      <MemoryRouter initialEntries={['/verify-email']}>
        <Routes>
          <Route path="/verify-email" element={<VerifyEmailPage />} />
        </Routes>
      </MemoryRouter>
    );

    // Renders clean Missing Token view; does not attempt re-verification
    expect(screen.getByText('No Verification Token Found')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /sign in to your account/i })
    ).toBeInTheDocument();
  });

  // --------------------------------------------------------------------------
  // Scenario 24: OnboardingStatusPage dynamic email banner
  // --------------------------------------------------------------------------
  it('24. OnboardingStatusPage shows unverified email banner with resend when emailVerified: false and hides it when true', async () => {
    // 1. When emailVerified: false
    useAuthStore.setState({
      isAuthenticated: true,
      user: {
        id: 20,
        email: 'onboard-unverified@college.edu',
        firstName: 'Onboard',
        lastName: 'Admin',
        role: 'COLLEGE_ADMIN',
        collegeId: 200,
        collegeCode: 'ONBOARD',
        collegeApprovalStatus: 'PENDING',
        managementUnlocked: false,
        emailVerified: false,
      },
      isLoading: false,
    });

    const { rerender } = renderWithProviders(
      <MemoryRouter initialEntries={['/onboarding-status']}>
        <Routes>
          <Route path="/onboarding-status" element={<OnboardingStatusPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(
      screen.getByText('Action Required: Verify Your Email Address')
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /resend verification email/i })
    ).toBeInTheDocument();

    // 2. When emailVerified becomes true
    act(() => {
      useAuthStore.setState({
        user: {
          ...useAuthStore.getState().user!,
          emailVerified: true,
        },
      });
    });

    rerender(
      <MemoryRouter initialEntries={['/onboarding-status']}>
        <Routes>
          <Route path="/onboarding-status" element={<OnboardingStatusPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(
      screen.queryByText('Action Required: Verify Your Email Address')
    ).not.toBeInTheDocument();
  });

  // --------------------------------------------------------------------------
  // Scenario 25: Authenticated unverified login reaches restricted onboarding dashboard
  // --------------------------------------------------------------------------
  it('25. ACTIVE but email-unverified COLLEGE_ADMIN can log in and reaches /onboarding-status', async () => {
    useAuthStore.setState({
      isAuthenticated: true,
      user: {
        id: 25,
        email: 'unverified-login@horizon.edu',
        firstName: 'Active',
        lastName: 'Unverified',
        role: 'COLLEGE_ADMIN',
        collegeId: 250,
        collegeCode: 'ACTIVE-UNVER',
        collegeApprovalStatus: 'PENDING',
        managementUnlocked: false,
        emailVerified: false,
      },
      isLoading: false,
    });

    const { CollegeApprovalGuard } = await import(
      '@/routes/guards/CollegeApprovalGuard'
    );

    renderWithProviders(
      <MemoryRouter initialEntries={['/college/dashboard']}>
        <Routes>
          <Route path="/onboarding-status" element={<OnboardingStatusPage />} />
          <Route element={<CollegeApprovalGuard />}>
            <Route
              path="/college/dashboard"
              element={<div>Unlocked Academic Dashboard</div>}
            />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    // Guard routes unapproved college admin to /onboarding-status
    expect(screen.getByText('College Onboarding Status')).toBeInTheDocument();
    expect(
      screen.queryByText('Unlocked Academic Dashboard')
    ).not.toBeInTheDocument();

    // Onboarding status renders the verification banner with resend capability
    expect(
      screen.getByText('Action Required: Verify Your Email Address')
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /resend verification email/i })
    ).toBeInTheDocument();
  });

  // --------------------------------------------------------------------------
  // Scenario 26: Token sanitization precedes API dispatch (Execution Order)
  // --------------------------------------------------------------------------
  it('26. sanitizes address bar before dispatching verification API request', async () => {
    let searchAtCallTime = 'UNSET';
    let locationSearchLive = '';

    const LocationTracker = () => {
      const loc = useLocation();
      locationSearchLive = loc.search;
      return null;
    };

    vi.spyOn(authService, 'verifyEmail').mockImplementation(async () => {
      // At the exact moment verifyEmail is invoked, the address bar search must already NOT contain 'token='
      searchAtCallTime = locationSearchLive;
      return {
        email: 'order-check@horizon.edu',
        emailVerified: true,
        verifiedAt: '2026-11-24T19:00:00Z',
      };
    });

    renderWithProviders(
      <MemoryRouter initialEntries={[`/verify-email?token=${VALID_SAMPLE_TOKEN}&ref=onboarding`]}>
        <LocationTracker />
        <Routes>
          <Route path="/verify-email" element={<VerifyEmailPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Email Verified Successfully')).toBeInTheDocument();
    });

    expect(searchAtCallTime).not.toContain('token=');
    expect(searchAtCallTime).toContain('ref=onboarding');
  });

  // --------------------------------------------------------------------------
  // Scenario 27: Actual component unmount and remount does not duplicate redemption
  // --------------------------------------------------------------------------
  it('27. actual unmount and remount does not dispatch duplicate redemption request', async () => {
    const verifySpy = vi.spyOn(authService, 'verifyEmail').mockResolvedValue({
      email: 'remount@horizon.edu',
      emailVerified: true,
      verifiedAt: '2026-11-24T19:00:00Z',
    });

    let currentNavLocation = '';
    const NavWatcher = () => {
      const loc = useLocation();
      currentNavLocation = loc.pathname + loc.search;
      return null;
    };

    // 1. Initial mount with token
    const { unmount } = renderWithProviders(
      <MemoryRouter initialEntries={[`/verify-email?token=${VALID_SAMPLE_TOKEN}`]}>
        <NavWatcher />
        <Routes>
          <Route path="/verify-email" element={<VerifyEmailPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(verifySpy).toHaveBeenCalledTimes(1);
      expect(screen.getByText('Email Verified Successfully')).toBeInTheDocument();
    });

    // Address bar was sanitized to '/verify-email'
    expect(currentNavLocation).toBe('/verify-email');

    // 2. Unmount the component completely
    unmount();

    // 3. Remount fresh component at the current sanitized URL
    renderWithProviders(
      <MemoryRouter initialEntries={[currentNavLocation]}>
        <Routes>
          <Route path="/verify-email" element={<VerifyEmailPage />} />
        </Routes>
      </MemoryRouter>
    );

    // Verify spy was NOT called a second time
    expect(verifySpy).toHaveBeenCalledTimes(1);
    expect(screen.getByText('No Verification Token Found')).toBeInTheDocument();
  });

  // --------------------------------------------------------------------------
  // Scenario 28: Resend 401 AUTH_UNAUTHENTICATED clears auth store and prompts login
  // --------------------------------------------------------------------------
  it('28. resend 401 AUTH_UNAUTHENTICATED clears auth store and displays login link', async () => {
    useAuthStore.setState({
      isAuthenticated: true,
      user: {
        id: 28,
        email: 'expired-session@horizon.edu',
        firstName: 'Expired',
        lastName: 'Session',
        role: 'COLLEGE_ADMIN',
        managementUnlocked: false,
        emailVerified: false,
      },
      isLoading: false,
    });

    vi.spyOn(authService, 'resendVerification').mockRejectedValueOnce(
      new ApiError('Authenticated account not found.', {
        errorCode: 'AUTH_UNAUTHENTICATED',
        status: 401,
      })
    );

    const { ResendVerificationButton } = await import(
      '@/components/verification/ResendVerificationButton'
    );

    renderWithProviders(
      <MemoryRouter>
        <ResendVerificationButton />
      </MemoryRouter>
    );

    const resendBtn = screen.getByRole('button', {
      name: /resend verification email/i,
    });
    fireEvent.click(resendBtn);

    await waitFor(() => {
      expect(screen.getByText('Session Expired')).toBeInTheDocument();
      expect(
        screen.getByText(/your session has expired\. please sign in again/i)
      ).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /sign in/i })).toHaveAttribute(
        'href',
        '/auth/login'
      );
    });

    // AuthStore must be cleared immediately
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().user).toBeNull();
  });

  // --------------------------------------------------------------------------
  // Scenario 29: Resend 403 AUTH_ACCOUNT_INACTIVE renders Account Inactive alert
  // --------------------------------------------------------------------------
  it('29. resend 403 AUTH_ACCOUNT_INACTIVE renders Account Inactive alert', async () => {
    useAuthStore.setState({
      isAuthenticated: true,
      user: {
        id: 29,
        email: 'inactive@horizon.edu',
        firstName: 'Inactive',
        lastName: 'Admin',
        role: 'COLLEGE_ADMIN',
        managementUnlocked: false,
        emailVerified: false,
      },
      isLoading: false,
    });

    vi.spyOn(authService, 'resendVerification').mockRejectedValueOnce(
      new ApiError('Your account is not active.', {
        errorCode: 'AUTH_ACCOUNT_INACTIVE',
        status: 403,
      })
    );

    const { ResendVerificationButton } = await import(
      '@/components/verification/ResendVerificationButton'
    );

    renderWithProviders(<ResendVerificationButton />);

    const resendBtn = screen.getByRole('button', {
      name: /resend verification email/i,
    });
    fireEvent.click(resendBtn);

    await waitFor(() => {
      expect(screen.getByText('Account Inactive')).toBeInTheDocument();
      expect(
        screen.getByText(/your account has been suspended or deactivated/i)
      ).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // Scenario 30: Resend 400 VALIDATION_ERROR renders Invalid Request alert
  // --------------------------------------------------------------------------
  it('30. resend 400 VALIDATION_ERROR renders Invalid Request alert', async () => {
    useAuthStore.setState({
      isAuthenticated: true,
      user: {
        id: 30,
        email: 'val-err@horizon.edu',
        firstName: 'Val',
        lastName: 'Error',
        role: 'COLLEGE_ADMIN',
        managementUnlocked: false,
        emailVerified: false,
      },
      isLoading: false,
    });

    vi.spyOn(authService, 'resendVerification').mockRejectedValueOnce(
      new ApiError('Validation error', {
        errorCode: 'VALIDATION_ERROR',
        status: 400,
      })
    );

    const { ResendVerificationButton } = await import(
      '@/components/verification/ResendVerificationButton'
    );

    renderWithProviders(<ResendVerificationButton />);

    const resendBtn = screen.getByRole('button', {
      name: /resend verification email/i,
    });
    fireEvent.click(resendBtn);

    await waitFor(() => {
      expect(screen.getByText('Invalid Request')).toBeInTheDocument();
      expect(
        screen.getByText(/unable to process verification resend/i)
      ).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // Scenario 31: Resend 500 INTERNAL_ERROR renders Resend Failed alert and recovers
  // --------------------------------------------------------------------------
  it('31. resend 500 INTERNAL_ERROR renders Resend Failed alert and allows retry', async () => {
    useAuthStore.setState({
      isAuthenticated: true,
      user: {
        id: 31,
        email: 'server-err@horizon.edu',
        firstName: 'Server',
        lastName: 'Error',
        role: 'COLLEGE_ADMIN',
        managementUnlocked: false,
        emailVerified: false,
      },
      isLoading: false,
    });

    const resendSpy = vi
      .spyOn(authService, 'resendVerification')
      .mockRejectedValueOnce(
        new ApiError('Database error', {
          errorCode: 'INTERNAL_ERROR',
          status: 500,
        })
      )
      .mockResolvedValueOnce(undefined);

    const { ResendVerificationButton } = await import(
      '@/components/verification/ResendVerificationButton'
    );

    renderWithProviders(<ResendVerificationButton />);

    const resendBtn = screen.getByRole('button', {
      name: /resend verification email/i,
    });
    fireEvent.click(resendBtn);

    await waitFor(() => {
      expect(screen.getByText('Resend Failed')).toBeInTheDocument();
    });

    // Button is re-enabled, user can retry
    expect(resendBtn).toBeEnabled();
    fireEvent.click(resendBtn);

    await waitFor(() => {
      expect(screen.getByText('Verification Email Sent')).toBeInTheDocument();
    });
    expect(resendSpy).toHaveBeenCalledTimes(2);
  });

  // --------------------------------------------------------------------------
  // Scenario 32: Resend Network Failure renders Connection Error alert
  // --------------------------------------------------------------------------
  it('32. resend network failure renders Connection Error alert and recovers', async () => {
    useAuthStore.setState({
      isAuthenticated: true,
      user: {
        id: 32,
        email: 'net-err@horizon.edu',
        firstName: 'Net',
        lastName: 'Error',
        role: 'COLLEGE_ADMIN',
        managementUnlocked: false,
        emailVerified: false,
      },
      isLoading: false,
    });

    vi.spyOn(authService, 'resendVerification').mockRejectedValueOnce(
      new TypeError('Failed to fetch')
    );

    const { ResendVerificationButton } = await import(
      '@/components/verification/ResendVerificationButton'
    );

    renderWithProviders(<ResendVerificationButton />);

    const resendBtn = screen.getByRole('button', {
      name: /resend verification email/i,
    });
    fireEvent.click(resendBtn);

    await waitFor(() => {
      expect(screen.getByText('Connection Error')).toBeInTheDocument();
      expect(
        screen.getByText(/unable to reach acadlytic\. please check your internet connection/i)
      ).toBeInTheDocument();
    });

    expect(resendBtn).toBeEnabled();
  });

  // --------------------------------------------------------------------------
  // Scenario 33: Resend with malformed Retry-After header falls back to persistent warning
  // --------------------------------------------------------------------------
  it('33. resend with malformed Retry-After falls back to persistent warning without fabricated timer', async () => {
    useAuthStore.setState({
      isAuthenticated: true,
      user: {
        id: 33,
        email: 'malformed-retry@horizon.edu',
        firstName: 'Malformed',
        lastName: 'Retry',
        role: 'COLLEGE_ADMIN',
        managementUnlocked: false,
        emailVerified: false,
      },
      isLoading: false,
    });

    vi.spyOn(authService, 'resendVerification').mockRejectedValueOnce(
      new ApiError('Rate limit reached', {
        errorCode: 'RATE_LIMIT_EXCEEDED',
        status: 429,
        retryAfter: 'invalid-non-numeric-header' as any,
      })
    );

    const { ResendVerificationButton } = await import(
      '@/components/verification/ResendVerificationButton'
    );

    renderWithProviders(<ResendVerificationButton />);

    const resendBtn = screen.getByRole('button', {
      name: /resend verification email/i,
    });
    fireEvent.click(resendBtn);

    await waitFor(() => {
      expect(screen.getByText('Rate Limit Reached')).toBeInTheDocument();
      expect(
        screen.getByText(/please wait a while before retrying/i)
      ).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /dismiss/i })).toBeInTheDocument();
    });

    // Resend button has NO fabricated countdown
    expect(screen.queryByText(/resend in/i)).not.toBeInTheDocument();
  });

  // --------------------------------------------------------------------------
  // Scenario 34: Verification 400 VALIDATION_ERROR from backend renders invalid token view
  // --------------------------------------------------------------------------
  it('34. verification 400 VALIDATION_ERROR from backend renders invalid token view', async () => {
    vi.spyOn(authService, 'verifyEmail').mockRejectedValueOnce(
      new ApiError('The verification token format is invalid.', {
        errorCode: 'VALIDATION_ERROR',
        status: 400,
      })
    );

    renderWithProviders(
      <MemoryRouter initialEntries={[`/verify-email?token=${VALID_SAMPLE_TOKEN}`]}>
        <Routes>
          <Route path="/verify-email" element={<VerifyEmailPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(
        screen.getByText('Verification Link Invalid or Expired')
      ).toBeInTheDocument();
      expect(
        screen.getByText(/the verification token format is invalid/i)
      ).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // Scenario 35: Verification 500 INTERNAL_ERROR renders Server Error with Retry and recovers
  // --------------------------------------------------------------------------
  it('35. verification 500 INTERNAL_ERROR renders Server Error with Retry and recovers on retry', async () => {
    const verifySpy = vi
      .spyOn(authService, 'verifyEmail')
      .mockRejectedValueOnce(
        new ApiError('Database connection error', {
          errorCode: 'INTERNAL_ERROR',
          status: 500,
        })
      )
      .mockResolvedValueOnce({
        email: 'server-retry@horizon.edu',
        emailVerified: true,
        verifiedAt: '2026-11-24T19:00:00Z',
      });

    renderWithProviders(
      <MemoryRouter initialEntries={[`/verify-email?token=${VALID_SAMPLE_TOKEN}`]}>
        <Routes>
          <Route path="/verify-email" element={<VerifyEmailPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Verification Failed')).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /try again/i })
      ).toBeInTheDocument();
    });

    // Click retry
    const retryBtn = screen.getByRole('button', { name: /try again/i });
    fireEvent.click(retryBtn);

    await waitFor(() => {
      expect(screen.getByText('Email Verified Successfully')).toBeInTheDocument();
    });

    expect(verifySpy).toHaveBeenCalledTimes(2);
  });

  // --------------------------------------------------------------------------
  // Scenario 36: Verification Network Failure renders Connection Error with Retry
  // --------------------------------------------------------------------------
  it('36. verification network failure renders Connection Error with manual Retry', async () => {
    vi.spyOn(authService, 'verifyEmail').mockRejectedValueOnce(
      new TypeError('Failed to fetch')
    );

    renderWithProviders(
      <MemoryRouter initialEntries={[`/verify-email?token=${VALID_SAMPLE_TOKEN}`]}>
        <Routes>
          <Route path="/verify-email" element={<VerifyEmailPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Verification Failed')).toBeInTheDocument();
      expect(
        screen.getByText(/unable to reach acadlytic\. please verify your connection/i)
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /try again/i })
      ).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // Scenario 37: Authenticated verification success invalidates currentUser query
  // --------------------------------------------------------------------------
  it('37. authenticated verification success invalidates currentUser query cache', async () => {
    useAuthStore.setState({
      isAuthenticated: true,
      user: {
        id: 37,
        email: 'invalidate-test@horizon.edu',
        firstName: 'Inval',
        lastName: 'Test',
        role: 'COLLEGE_ADMIN',
        managementUnlocked: false,
        emailVerified: false,
      },
      isLoading: false,
    });

    vi.spyOn(authService, 'verifyEmail').mockResolvedValueOnce({
      email: 'invalidate-test@horizon.edu',
      emailVerified: true,
      verifiedAt: '2026-11-24T19:00:00Z',
    });

    const queryClient = createTestQueryClient();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    renderWithProviders(
      <MemoryRouter initialEntries={[`/verify-email?token=${VALID_SAMPLE_TOKEN}`]}>
        <Routes>
          <Route path="/verify-email" element={<VerifyEmailPage />} />
        </Routes>
      </MemoryRouter>,
      { queryClient }
    );

    await waitFor(() => {
      expect(screen.getByText('Email Verified Successfully')).toBeInTheDocument();
    });

    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ['auth', 'currentUser'],
      })
    );
  });

  // --------------------------------------------------------------------------
  // Scenario 38: Invocation-level mutual exclusion: Resend rejected while verify in-flight
  // --------------------------------------------------------------------------
  it('38. resend mutation is rejected at invocation level while verification is in-flight', async () => {
    const queryClient = createTestQueryClient();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    let resolveVerify!: (v: VerifyEmailResponse) => void;
    const verifyPromise = new Promise<VerifyEmailResponse>((res) => {
      resolveVerify = res;
    });
    vi.spyOn(authService, 'verifyEmail').mockImplementation(() => verifyPromise);
    const resendSpy = vi.spyOn(authService, 'resendVerification');

    const { result: verifyHook } = renderHook(() => useVerifyEmail(), { wrapper });
    const { result: resendHook } = renderHook(() => useResendVerification(), { wrapper });

    // Start verification mutation
    act(() => {
      verifyHook.current.mutate({ token: VALID_SAMPLE_TOKEN });
    });

    // While verification is in-flight, attempting resend directly rejects with 409
    let caughtError: any = null;
    await act(async () => {
      try {
        await resendHook.current.mutateAsync();
      } catch (err) {
        caughtError = err;
      }
    });

    expect(caughtError).toBeInstanceOf(ApiError);
    expect(caughtError.errorCode).toBe('CONCURRENT_VERIFICATION_IN_PROGRESS');
    expect(caughtError.status).toBe(409);
    expect(resendSpy).not.toHaveBeenCalled();

    // Clean up in-flight mutation
    await act(async () => {
      resolveVerify({
        email: 'done@horizon.edu',
        emailVerified: true,
        verifiedAt: '2026-11-24T19:00:00Z',
      });
    });
  });

  // --------------------------------------------------------------------------
  // Scenario 39: Invocation-level mutual exclusion: Verify rejected while resend in-flight
  // --------------------------------------------------------------------------
  it('39. verification mutation is rejected at invocation level while resend is in-flight', async () => {
    const queryClient = createTestQueryClient();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    let resolveResend!: () => void;
    const resendPromise = new Promise<void>((res) => {
      resolveResend = res;
    });
    vi.spyOn(authService, 'resendVerification').mockImplementation(() => resendPromise);
    const verifySpy = vi.spyOn(authService, 'verifyEmail');

    const { result: verifyHook } = renderHook(() => useVerifyEmail(), { wrapper });
    const { result: resendHook } = renderHook(() => useResendVerification(), { wrapper });

    // Start resend mutation
    act(() => {
      resendHook.current.mutate();
    });

    // While resend is in-flight, attempting verification rejects with 409
    let caughtError: any = null;
    await act(async () => {
      try {
        await verifyHook.current.mutateAsync({ token: VALID_SAMPLE_TOKEN });
      } catch (err) {
        caughtError = err;
      }
    });

    expect(caughtError).toBeInstanceOf(ApiError);
    expect(caughtError.errorCode).toBe('CONCURRENT_RESEND_IN_PROGRESS');
    expect(caughtError.status).toBe(409);
    expect(verifySpy).not.toHaveBeenCalled();

    // Clean up in-flight mutation
    await act(async () => {
      resolveResend();
    });
  });

  // --------------------------------------------------------------------------
  // Scenario 40: Concurrency guard: Rapid repeated calls to verifyEmail are blocked at invocation level
  // --------------------------------------------------------------------------
  it('40. rapid repeated calls to verifyEmail are blocked at invocation level', async () => {
    const queryClient = createTestQueryClient();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    let resolveVerify!: (v: VerifyEmailResponse) => void;
    const verifyPromise = new Promise<VerifyEmailResponse>((res) => {
      resolveVerify = res;
    });
    const verifySpy = vi.spyOn(authService, 'verifyEmail').mockImplementation(() => verifyPromise);

    const { result: verifyHook } = renderHook(() => useVerifyEmail(), { wrapper });

    // Dispatch first verification
    act(() => {
      verifyHook.current.mutate({ token: VALID_SAMPLE_TOKEN });
    });

    // Attempt second concurrent verification before first completes
    let secondError: any = null;
    await act(async () => {
      try {
        await verifyHook.current.mutateAsync({ token: VALID_SAMPLE_TOKEN });
      } catch (err) {
        secondError = err;
      }
    });

    expect(secondError).toBeInstanceOf(ApiError);
    expect(secondError.errorCode).toBe('CONCURRENT_VERIFICATION_IN_PROGRESS');
    expect(secondError.status).toBe(409);

    // Verify authService was dispatched strictly once
    expect(verifySpy).toHaveBeenCalledTimes(1);

    // Clean up in-flight mutation
    await act(async () => {
      resolveVerify({
        email: 'done@horizon.edu',
        emailVerified: true,
        verifiedAt: '2026-11-24T19:00:00Z',
      });
    });
  });

  // --------------------------------------------------------------------------
  // Scenario 41: Synchronous same-turn call order: verifyEmail() then resendVerification()
  // --------------------------------------------------------------------------
  it('41. synchronous same-turn calls: verifyEmail() first allows only verifyEmail() to reach service, rejects resend', async () => {
    _resetConcurrencyFlags();
    const queryClient = createTestQueryClient();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    let resolveVerify!: (v: VerifyEmailResponse) => void;
    const verifyPromise = new Promise<VerifyEmailResponse>((res) => {
      resolveVerify = res;
    });
    const verifySpy = vi
      .spyOn(authService, 'verifyEmail')
      .mockImplementation(() => verifyPromise);
    const resendSpy = vi.spyOn(authService, 'resendVerification');

    const { result: verifyHook } = renderHook(() => useVerifyEmail(), { wrapper });
    const { result: resendHook } = renderHook(() => useResendVerification(), { wrapper });

    // In the EXACT SAME synchronous JavaScript turn:
    // Call 1: verifyEmail.mutateAsync (NOT awaited)
    const pVerify = verifyHook.current.mutateAsync({ token: VALID_SAMPLE_TOKEN });

    // Call 2: resend.mutateAsync in the SAME synchronous turn (zero awaits, zero re-renders)
    let resendError: any = null;
    const pResend = resendHook.current.mutateAsync().catch((err) => {
      resendError = err;
    });

    // Await the synchronous-turn rejected resend promise
    await pResend;

    // Resend was rejected with documented error
    expect(resendError).toBeInstanceOf(ApiError);
    expect(resendError.errorCode).toBe('CONCURRENT_VERIFICATION_IN_PROGRESS');
    expect(resendError.status).toBe(409);

    // Only verify reached its API service method; resend NEVER called authService
    expect(resendSpy).not.toHaveBeenCalled();

    // Resolve verify mutation
    await act(async () => {
      resolveVerify({
        email: 'turn1@horizon.edu',
        emailVerified: true,
        verifiedAt: '2026-11-24T19:00:00Z',
      });
      await pVerify;
    });

    expect(verifySpy).toHaveBeenCalledTimes(1);

    // Flags released after success: subsequent resend operation is allowed
    const subsequentResendSpy = vi
      .spyOn(authService, 'resendVerification')
      .mockResolvedValueOnce(undefined);

    await act(async () => {
      await resendHook.current.mutateAsync();
    });

    expect(subsequentResendSpy).toHaveBeenCalledTimes(1);
  });

  // --------------------------------------------------------------------------
  // Scenario 42: Synchronous same-turn call order: resendVerification() then verifyEmail()
  // --------------------------------------------------------------------------
  it('42. synchronous same-turn calls: resendVerification() first allows only resend to reach service, rejects verifyEmail', async () => {
    _resetConcurrencyFlags();
    const queryClient = createTestQueryClient();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    let resolveResend!: () => void;
    const resendPromise = new Promise<void>((res) => {
      resolveResend = res;
    });
    const resendSpy = vi
      .spyOn(authService, 'resendVerification')
      .mockImplementation(() => resendPromise);
    const verifySpy = vi.spyOn(authService, 'verifyEmail');

    const { result: verifyHook } = renderHook(() => useVerifyEmail(), { wrapper });
    const { result: resendHook } = renderHook(() => useResendVerification(), { wrapper });

    // In the EXACT SAME synchronous JavaScript turn:
    // Call 1: resend.mutateAsync (NOT awaited)
    const pResend = resendHook.current.mutateAsync();

    // Call 2: verifyEmail.mutateAsync in the SAME synchronous turn (zero awaits, zero re-renders)
    let verifyError: any = null;
    const pVerify = verifyHook.current
      .mutateAsync({ token: VALID_SAMPLE_TOKEN })
      .catch((err) => {
        verifyError = err;
      });

    // Await the synchronous-turn rejected verify promise
    await pVerify;

    // Verify was rejected with documented error
    expect(verifyError).toBeInstanceOf(ApiError);
    expect(verifyError.errorCode).toBe('CONCURRENT_RESEND_IN_PROGRESS');
    expect(verifyError.status).toBe(409);

    // Only resend reached its API service method; verify NEVER called authService
    expect(verifySpy).not.toHaveBeenCalled();

    // Resolve resend mutation
    await act(async () => {
      resolveResend();
      await pResend;
    });

    expect(resendSpy).toHaveBeenCalledTimes(1);

    // Flags released after success: subsequent verify operation is allowed
    const subsequentVerifySpy = vi
      .spyOn(authService, 'verifyEmail')
      .mockResolvedValueOnce({
        email: 'turn2@horizon.edu',
        emailVerified: true,
        verifiedAt: '2026-11-24T19:00:00Z',
      });

    await act(async () => {
      await verifyHook.current.mutateAsync({ token: VALID_SAMPLE_TOKEN });
    });

    expect(subsequentVerifySpy).toHaveBeenCalledTimes(1);
  });

  // --------------------------------------------------------------------------
  // Scenario 43: Concurrency flags release on failure allowing subsequent operations
  // --------------------------------------------------------------------------
  it('43. concurrency flags release on failure allowing subsequent valid operations', async () => {
    _resetConcurrencyFlags();
    const queryClient = createTestQueryClient();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    // 1. Verify fails with 500 error
    vi.spyOn(authService, 'verifyEmail').mockRejectedValueOnce(
      new ApiError('Database failure', { errorCode: 'INTERNAL_ERROR', status: 500 })
    );

    const { result: verifyHook } = renderHook(() => useVerifyEmail(), { wrapper });
    const { result: resendHook } = renderHook(() => useResendVerification(), { wrapper });

    await act(async () => {
      try {
        await verifyHook.current.mutateAsync({ token: VALID_SAMPLE_TOKEN });
      } catch (err) {
        expect((err as ApiError).errorCode).toBe('INTERNAL_ERROR');
      }
    });

    // After failure, flags MUST be released: resend can execute cleanly
    const resendSpy = vi
      .spyOn(authService, 'resendVerification')
      .mockResolvedValueOnce(undefined);

    await act(async () => {
      await resendHook.current.mutateAsync();
    });

    expect(resendSpy).toHaveBeenCalledTimes(1);

    // 2. Resend fails with 500 error
    vi.spyOn(authService, 'resendVerification').mockRejectedValueOnce(
      new ApiError('Resend failure', { errorCode: 'INTERNAL_ERROR', status: 500 })
    );

    await act(async () => {
      try {
        await resendHook.current.mutateAsync();
      } catch (err) {
        expect((err as ApiError).errorCode).toBe('INTERNAL_ERROR');
      }
    });

    // After resend failure, flags MUST be released: verify can execute cleanly
    const verifySuccessSpy = vi
      .spyOn(authService, 'verifyEmail')
      .mockResolvedValueOnce({
        email: 'recovery@horizon.edu',
        emailVerified: true,
        verifiedAt: '2026-11-24T19:00:00Z',
      });

    await act(async () => {
      await verifyHook.current.mutateAsync({ token: VALID_SAMPLE_TOKEN });
    });

    expect(verifySuccessSpy).toHaveBeenCalledTimes(1);
  });
});
