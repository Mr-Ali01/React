import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent, render } from '@testing-library/react';
import React from 'react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClientProvider, QueryClient, focusManager } from '@tanstack/react-query';
import { RootLayout } from '@/layouts/RootLayout';
import { AuthLayout } from '@/layouts/AuthLayout';
import { PublicOnlyRoute } from '@/routes/guards/PublicOnlyRoute';
import { ProtectedRoute } from '@/routes/guards/ProtectedRoute';
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterCollegePage } from '@/pages/auth/RegisterCollegePage';
import { authService } from '@/services/authService';
import { useAuthStore } from '@/stores/authStore';
import { ApiError } from '@/services/api';
import { CurrentUser } from '@/types';

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        refetchOnWindowFocus: true,
      },
    },
  });
}

const mockSuperAdmin: CurrentUser = {
  id: 1,
  email: 'owner@acadlytic.com',
  firstName: 'Super',
  lastName: 'Admin',
  role: 'SUPER_ADMIN',
  managementUnlocked: true,
  emailVerified: true,
};

describe('Frontend Authentication Form State Persistence & Route Integrity', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.getState().reset();
  });

  // 1 & 8: Initial application loading displays appropriate initialization UI
  it('1. displays initialization spinner during initial guest bootstrap, then transitions to login', async () => {
    let resolveGetMe: (value: any) => void;
    const getMePromise = new Promise((_resolve, reject) => {
      resolveGetMe = () =>
        reject(
          new ApiError('Authentication required', {
            errorCode: 'AUTH_UNAUTHENTICATED',
            status: 401,
          })
        );
    });

    vi.spyOn(authService, 'getMe').mockReturnValue(getMePromise as any);

    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/auth/login']}>
          <Routes>
            <Route element={<RootLayout />}>
              <Route path="auth" element={<PublicOnlyRoute />}>
                <Route element={<AuthLayout />}>
                  <Route path="login" element={<LoginPage />} />
                </Route>
              </Route>
            </Route>
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    // Initial state: spinner is visible, child login form is not rendered yet
    expect(screen.getByText('Initializing Acadlytic platform...')).toBeInTheDocument();
    expect(screen.getByText('Verifying secure session...')).toBeInTheDocument();
    expect(screen.queryByLabelText(/email address/i)).not.toBeInTheDocument();

    // Resolve /auth/me with 401
    resolveGetMe!({});

    // After resolution: spinner is gone, login page is rendered
    await waitFor(() => {
      expect(screen.queryByText('Initializing Acadlytic platform...')).not.toBeInTheDocument();
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    });

    expect(useAuthStore.getState().isInitialized).toBe(true);
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  // 2 & 3: Guest user returning to browser window triggers auth refetch, but Login form remains mounted and preserves values
  it('2. preserves Login form inputs and maintains component mount during window focus auth refetch', async () => {
    // Initial bootstrap returns 401
    vi.spyOn(authService, 'getMe').mockRejectedValue(
      new ApiError('Authentication required', {
        errorCode: 'AUTH_UNAUTHENTICATED',
        status: 401,
      })
    );

    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/auth/login']}>
          <Routes>
            <Route element={<RootLayout />}>
              <Route path="auth" element={<PublicOnlyRoute />}>
                <Route element={<AuthLayout />}>
                  <Route path="login" element={<LoginPage />} />
                </Route>
              </Route>
            </Route>
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    // Wait for initial bootstrap to complete
    await waitFor(() => {
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    });

    const emailInput = screen.getByLabelText(/email address/i) as HTMLInputElement;
    const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;

    // User types credentials into form
    fireEvent.change(emailInput, { target: { value: 'applicant@college.edu' } });
    fireEvent.change(passwordInput, { target: { value: 'SecretPassword!2026' } });

    expect(emailInput.value).toBe('applicant@college.edu');
    expect(passwordInput.value).toBe('SecretPassword!2026');

    // Capture the exact DOM node references before window focus
    const emailNodeBeforeFocus = emailInput;
    const passwordNodeBeforeFocus = passwordInput;

    // Simulate user switching away and returning to the tab (window focus)
    focusManager.setFocused(false);
    focusManager.setFocused(true);

    // Verify background refetch occurred
    await waitFor(() => {
      expect(authService.getMe).toHaveBeenCalledTimes(2);
    });

    // CRITICAL: The full-screen spinner must NOT be shown
    expect(screen.queryByText('Initializing Acadlytic platform...')).not.toBeInTheDocument();

    // CRITICAL: Inputs must still be in the document and have the EXACT same DOM identity (not remounted)
    const emailNodeAfterFocus = screen.getByLabelText(/email address/i);
    const passwordNodeAfterFocus = screen.getByLabelText(/password/i);

    expect(emailNodeAfterFocus).toBe(emailNodeBeforeFocus);
    expect(passwordNodeAfterFocus).toBe(passwordNodeBeforeFocus);

    // Values must remain populated
    expect((emailNodeAfterFocus as HTMLInputElement).value).toBe('applicant@college.edu');
    expect((passwordNodeAfterFocus as HTMLInputElement).value).toBe('SecretPassword!2026');

    // Wait for the background 401 to complete
    await waitFor(() => {
      expect(useAuthStore.getState().isInitialized).toBe(true);
    });

    // Inputs still intact after 401 settles
    expect((screen.getByLabelText(/email address/i) as HTMLInputElement).value).toBe(
      'applicant@college.edu'
    );
    expect((screen.getByLabelText(/password/i) as HTMLInputElement).value).toBe(
      'SecretPassword!2026'
    );
    expect(screen.getByLabelText(/email address/i)).toBe(emailNodeBeforeFocus);
  });

  // 4: College Registration form remains mounted and preserves entered values during auth refetch
  it('3. preserves College Registration form inputs and validation state during window focus refetch', async () => {
    vi.spyOn(authService, 'getMe').mockRejectedValue(
      new ApiError('Authentication required', {
        errorCode: 'AUTH_UNAUTHENTICATED',
        status: 401,
      })
    );

    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/auth/register-college']}>
          <Routes>
            <Route element={<RootLayout />}>
              <Route path="auth" element={<PublicOnlyRoute />}>
                <Route element={<AuthLayout />}>
                  <Route path="register-college" element={<RegisterCollegePage />} />
                </Route>
              </Route>
            </Route>
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    // Wait for initial bootstrap
    await waitFor(() => {
      expect(screen.getByLabelText(/college legal name/i)).toBeInTheDocument();
    });

    const legalNameInput = screen.getByLabelText(/college legal name/i) as HTMLInputElement;
    const codeInput = screen.getByLabelText(/college code/i) as HTMLInputElement;
    const phoneInput = screen.getByLabelText(/contact phone/i) as HTMLInputElement;
    const emailInput = screen.getByLabelText(/administrator official email/i) as HTMLInputElement;

    // Fill in several registration fields
    fireEvent.change(legalNameInput, { target: { value: 'Horizon Institute of Technology' } });
    fireEvent.change(codeInput, { target: { value: 'horizon-tech' } });
    fireEvent.change(phoneInput, { target: { value: '+1-555-0199' } });
    fireEvent.change(emailInput, { target: { value: 'admin@horizon.edu' } });

    // Capture DOM element identities
    const legalNameBefore = legalNameInput;
    const codeBefore = codeInput;
    const emailBefore = emailInput;

    // Trigger tab switch return (window focus)
    focusManager.setFocused(false);
    focusManager.setFocused(true);

    // Spinner must NOT be shown
    expect(screen.queryByText('Initializing Acadlytic platform...')).not.toBeInTheDocument();

    // DOM nodes must be identical instances (component remained mounted)
    expect(screen.getByLabelText(/college legal name/i)).toBe(legalNameBefore);
    expect(screen.getByLabelText(/college code/i)).toBe(codeBefore);
    expect(screen.getByLabelText(/administrator official email/i)).toBe(emailBefore);

    // Values must be completely preserved
    expect((screen.getByLabelText(/college legal name/i) as HTMLInputElement).value).toBe(
      'Horizon Institute of Technology'
    );
    expect((screen.getByLabelText(/college code/i) as HTMLInputElement).value).toBe('horizon-tech');
    expect((screen.getByLabelText(/administrator official email/i) as HTMLInputElement).value).toBe(
      'admin@horizon.edu'
    );
  });

  // 5: Background refetch returning 401 does not unnecessarily remount public routes
  it('4. background refetch returning 401 does not unmount or remount public routes', async () => {
    let getMeCallCount = 0;
    vi.spyOn(authService, 'getMe').mockImplementation(() => {
      getMeCallCount++;
      return Promise.reject(
        new ApiError('Authentication required', {
          errorCode: 'AUTH_UNAUTHENTICATED',
          status: 401,
        })
      );
    });

    // Custom test component tracking mount/unmount lifecycle
    let mountCount = 0;
    let unmountCount = 0;
    const LifecycleTracker: React.FC = () => {
      React.useEffect(() => {
        mountCount++;
        return () => {
          unmountCount++;
        };
      }, []);
      return <div data-testid="lifecycle-tracker">Public Content</div>;
    };

    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/auth/test']}>
          <Routes>
            <Route element={<RootLayout />}>
              <Route path="auth" element={<PublicOnlyRoute />}>
                <Route path="test" element={<LifecycleTracker />} />
              </Route>
            </Route>
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    // Initial bootstrap completes
    await waitFor(() => {
      expect(screen.getByTestId('lifecycle-tracker')).toBeInTheDocument();
    });

    expect(mountCount).toBe(1);
    expect(unmountCount).toBe(0);
    expect(getMeCallCount).toBe(1);

    // Trigger window focus refetch
    focusManager.setFocused(false);
    focusManager.setFocused(true);

    await waitFor(() => {
      expect(getMeCallCount).toBe(2);
    });

    // Verify component was NEVER unmounted or remounted
    expect(mountCount).toBe(1);
    expect(unmountCount).toBe(0);
    expect(screen.getByTestId('lifecycle-tracker')).toBeInTheDocument();
  });

  // 6: Authenticated user behavior remains correct
  it('5. allows authenticated user access and maintains session on window focus', async () => {
    vi.spyOn(authService, 'getMe').mockResolvedValue(mockSuperAdmin);

    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/admin/dashboard']}>
          <Routes>
            <Route element={<RootLayout />}>
              <Route element={<ProtectedRoute />}>
                <Route path="/admin/dashboard" element={<div>Super Admin Dashboard</div>} />
              </Route>
            </Route>
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    // Waits for initial bootstrap to authenticate
    await waitFor(() => {
      expect(screen.getByText('Super Admin Dashboard')).toBeInTheDocument();
    });

    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().user?.role).toBe('SUPER_ADMIN');

    // Trigger window focus
    focusManager.setFocused(false);
    focusManager.setFocused(true);

    // Dashboard remains mounted and accessible
    expect(screen.getByText('Super Admin Dashboard')).toBeInTheDocument();
  });

  // 7: Expired/invalid authenticated session follows security and redirect behavior
  it('6. redirects authenticated user to /auth/login when session expires on background refetch', async () => {
    // Start authenticated
    useAuthStore.setState({
      user: mockSuperAdmin,
      isAuthenticated: true,
      isLoading: false,
      isInitialized: true,
    });

    // Next getMe returns 401 (session revoked / expired)
    vi.spyOn(authService, 'getMe').mockRejectedValue(
      new ApiError('Session expired', {
        errorCode: 'AUTH_UNAUTHENTICATED',
        status: 401,
      })
    );

    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/admin/dashboard']}>
          <Routes>
            <Route element={<RootLayout />}>
              <Route path="/auth/login" element={<div>Login Page Redirect Target</div>} />
              <Route element={<ProtectedRoute />}>
                <Route path="/admin/dashboard" element={<div>Protected Dashboard</div>} />
              </Route>
            </Route>
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(screen.getByText('Protected Dashboard')).toBeInTheDocument();

    // Trigger window focus (discovering session expiration)
    focusManager.setFocused(false);
    focusManager.setFocused(true);

    // Must redirect to login once 401 is processed
    await waitFor(() => {
      expect(screen.getByText('Login Page Redirect Target')).toBeInTheDocument();
    });

    expect(screen.queryByText('Protected Dashboard')).not.toBeInTheDocument();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().user).toBeNull();
  });

  // 8: React Hook Form touched/dirty state and validation errors are preserved
  it('7. preserves React Hook Form validation errors across tab switch and background refetch', async () => {
    vi.spyOn(authService, 'getMe').mockRejectedValue(
      new ApiError('Authentication required', {
        errorCode: 'AUTH_UNAUTHENTICATED',
        status: 401,
      })
    );

    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/auth/login']}>
          <Routes>
            <Route element={<RootLayout />}>
              <Route path="auth" element={<PublicOnlyRoute />}>
                <Route element={<AuthLayout />}>
                  <Route path="login" element={<LoginPage />} />
                </Route>
              </Route>
            </Route>
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    });

    // Submit without filling fields to trigger client-side validation errors
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    fireEvent.click(submitButton);

    // Validation errors appear
    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    });

    // Simulate tab switch (window blur -> focus)
    focusManager.setFocused(false);
    focusManager.setFocused(true);

    // Validation errors must still be present (not wiped by unmount/remount)
    expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    expect(screen.getByText(/password is required/i)).toBeInTheDocument();
  });

  // 9: Normal login navigation continues to work
  it('8. normal login flow succeeds and transitions to authenticated redirect', async () => {
    vi.spyOn(authService, 'getMe').mockRejectedValue(
      new ApiError('Authentication required', {
        errorCode: 'AUTH_UNAUTHENTICATED',
        status: 401,
      })
    );
    vi.spyOn(authService, 'login').mockResolvedValue(mockSuperAdmin);

    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/auth/login']}>
          <Routes>
            <Route element={<RootLayout />}>
              <Route path="auth" element={<PublicOnlyRoute />}>
                <Route element={<AuthLayout />}>
                  <Route path="login" element={<LoginPage />} />
                </Route>
              </Route>
              <Route element={<ProtectedRoute />}>
                <Route path="admin/dashboard" element={<div>Super Admin Dashboard Landing</div>} />
              </Route>
            </Route>
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'owner@acadlytic.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'SuperAdmin@Acadlytic2026!' },
    });

    // For the login invalidation call
    vi.spyOn(authService, 'getMe').mockResolvedValue(mockSuperAdmin);

    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText('Super Admin Dashboard Landing')).toBeInTheDocument();
    });

    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().user?.role).toBe('SUPER_ADMIN');
  });
});
