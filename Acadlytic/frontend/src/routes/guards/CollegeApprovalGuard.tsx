import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

export const CollegeApprovalGuard: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/auth/login" replace />;
  }

  // Super admins bypass college onboarding checks
  if (user.role === 'SUPER_ADMIN') {
    return <Outlet />;
  }

  // For college admins, if college is not approved, redirect to onboarding status
  if (
    user.role === 'COLLEGE_ADMIN' &&
    user.collegeApprovalStatus !== 'APPROVED'
  ) {
    return <Navigate to="/onboarding-status" replace />;
  }

  return <Outlet />;
};
