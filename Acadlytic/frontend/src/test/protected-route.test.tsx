import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import { ProtectedRoute } from '@/routes/guards/ProtectedRoute';
import { useAuthStore } from '@/stores/authStore';

// Component to inspect redirect state
const LoginPageWithState = () => {
  const location = useLocation();
  return (
    <div>
      <h1>Login Page</h1>
      <span data-testid="from-pathname">{location.state?.from?.pathname}</span>
    </div>
  );
};

describe('4. ProtectedRoute Guard', () => {
  beforeEach(() => {
    useAuthStore.getState().clearAuth();
  });

  it('redirects an unauthenticated guest to login and preserves target URL', () => {
    useAuthStore.setState({
      isAuthenticated: false,
      user: null,
      isLoading: false,
    });

    render(
      <MemoryRouter initialEntries={['/admin/dashboard']}>
        <Routes>
          <Route path="/auth/login" element={<LoginPageWithState />} />
          <Route element={<ProtectedRoute />}>
            <Route
              path="/admin/dashboard"
              element={<div>Protected Admin Dashboard</div>}
            />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Login Page')).toBeInTheDocument();
    expect(screen.getByTestId('from-pathname').textContent).toBe(
      '/admin/dashboard'
    );
    expect(
      screen.queryByText('Protected Admin Dashboard')
    ).not.toBeInTheDocument();
  });

  it('renders child outlet when user is authenticated', () => {
    useAuthStore.setState({
      isAuthenticated: true,
      user: {
        id: 1,
        email: 'admin@acadlytic.com',
        firstName: 'Super',
        lastName: 'Admin',
        role: 'SUPER_ADMIN',
        managementUnlocked: true,
        emailVerified: true,
      },
      isLoading: false,
    });

    render(
      <MemoryRouter initialEntries={['/admin/dashboard']}>
        <Routes>
          <Route path="/auth/login" element={<LoginPageWithState />} />
          <Route element={<ProtectedRoute />}>
            <Route
              path="/admin/dashboard"
              element={<div>Protected Admin Dashboard</div>}
            />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Protected Admin Dashboard')).toBeInTheDocument();
    expect(screen.queryByText('Login Page')).not.toBeInTheDocument();
  });
});
