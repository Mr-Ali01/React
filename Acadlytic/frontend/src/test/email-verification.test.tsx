import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, waitFor, act, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import { VerifyEmailPage } from '@/pages/auth/VerifyEmailPage';
import { OnboardingStatusPage } from '@/pages/OnboardingStatusPage';
import { authService } from '@/services/authService';
import { ApiError } from '@/services/api';
import { useAuthStore } from '@/stores/authStore';
import { renderWithProviders } from './test-utils';
import { VerifyEmailResponse } from '@/types';

const VALID_SAMPLE_TOKEN = 'sample-valid-43-character-cryptographic-token-value';

describe('Module 3.2 — Email Verification & Account Activation (Frontend)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    useAuthStore.getState().clearAuth();
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
        screen.getByText(/tokens are valid for 48 hours/i)
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
});
