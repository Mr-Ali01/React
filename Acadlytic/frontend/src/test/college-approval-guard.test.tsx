import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { CollegeApprovalGuard } from '@/routes/guards/CollegeApprovalGuard';
import { useAuthStore } from '@/stores/authStore';

describe('6. CollegeApprovalGuard Workflow', () => {
  beforeEach(() => {
    useAuthStore.getState().clearAuth();
  });

  it('sends an unapproved (PENDING) COLLEGE_ADMIN to /onboarding-status', () => {
    useAuthStore.setState({
      isAuthenticated: true,
      user: {
        id: 5,
        email: 'pendingadmin@college.edu',
        firstName: 'Pending',
        lastName: 'Admin',
        role: 'COLLEGE_ADMIN',
        collegeId: 10,
        collegeCode: 'PCOL',
        collegeApprovalStatus: 'PENDING',
        managementUnlocked: false,
        emailVerified: true,
      },
      isLoading: false,
    });

    render(
      <MemoryRouter initialEntries={['/college/dashboard']}>
        <Routes>
          <Route
            path="/onboarding-status"
            element={<div>College Onboarding Status View</div>}
          />
          <Route element={<CollegeApprovalGuard />}>
            <Route
              path="/college/dashboard"
              element={<div>Unlocked College Dashboard</div>}
            />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(
      screen.getByText('College Onboarding Status View')
    ).toBeInTheDocument();
    expect(
      screen.queryByText('Unlocked College Dashboard')
    ).not.toBeInTheDocument();
  });

  it('allows an APPROVED COLLEGE_ADMIN to access /college/dashboard', () => {
    useAuthStore.setState({
      isAuthenticated: true,
      user: {
        id: 5,
        email: 'approved@college.edu',
        firstName: 'Approved',
        lastName: 'Admin',
        role: 'COLLEGE_ADMIN',
        collegeId: 10,
        collegeCode: 'PCOL',
        collegeApprovalStatus: 'APPROVED',
        collegeStatus: 'ACTIVE',
        managementUnlocked: true,
        emailVerified: true,
      },
      isLoading: false,
    });

    render(
      <MemoryRouter initialEntries={['/college/dashboard']}>
        <Routes>
          <Route
            path="/onboarding-status"
            element={<div>College Onboarding Status View</div>}
          />
          <Route element={<CollegeApprovalGuard />}>
            <Route
              path="/college/dashboard"
              element={<div>Unlocked College Dashboard</div>}
            />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Unlocked College Dashboard')).toBeInTheDocument();
    expect(
      screen.queryByText('College Onboarding Status View')
    ).not.toBeInTheDocument();
  });
});
