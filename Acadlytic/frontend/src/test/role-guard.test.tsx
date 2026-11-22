import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { RoleGuard } from '@/routes/guards/RoleGuard';
import { useAuthStore } from '@/stores/authStore';

describe('5. RoleGuard Navigation Security', () => {
  beforeEach(() => {
    useAuthStore.getState().clearAuth();
  });

  it('sends COLLEGE_ADMIN away to /unauthorized when attempting to access /admin/*', () => {
    useAuthStore.setState({
      isAuthenticated: true,
      user: {
        id: 2,
        email: 'collegeadmin@sxie.edu',
        firstName: 'College',
        lastName: 'Admin',
        role: 'COLLEGE_ADMIN',
        collegeId: 1,
        collegeCode: 'SXIE',
        collegeName: 'St. Xavier Institute',
        collegeApprovalStatus: 'APPROVED',
        managementUnlocked: true,
        emailVerified: true,
      },
      isLoading: false,
    });

    render(
      <MemoryRouter initialEntries={['/admin/dashboard']}>
        <Routes>
          <Route path="/unauthorized" element={<div>Access Denied Page</div>} />
          <Route element={<RoleGuard allowedRoles={['SUPER_ADMIN']} />}>
            <Route
              path="/admin/dashboard"
              element={<div>Super Admin Only Content</div>}
            />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Access Denied Page')).toBeInTheDocument();
    expect(
      screen.queryByText('Super Admin Only Content')
    ).not.toBeInTheDocument();
  });

  it('allows SUPER_ADMIN to access /admin/*', () => {
    useAuthStore.setState({
      isAuthenticated: true,
      user: {
        id: 1,
        email: 'owner@acadlytic.com',
        firstName: 'System',
        lastName: 'Owner',
        role: 'SUPER_ADMIN',
        managementUnlocked: true,
        emailVerified: true,
      },
      isLoading: false,
    });

    render(
      <MemoryRouter initialEntries={['/admin/dashboard']}>
        <Routes>
          <Route path="/unauthorized" element={<div>Access Denied Page</div>} />
          <Route element={<RoleGuard allowedRoles={['SUPER_ADMIN']} />}>
            <Route
              path="/admin/dashboard"
              element={<div>Super Admin Only Content</div>}
            />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Super Admin Only Content')).toBeInTheDocument();
    expect(screen.queryByText('Access Denied Page')).not.toBeInTheDocument();
  });
});
