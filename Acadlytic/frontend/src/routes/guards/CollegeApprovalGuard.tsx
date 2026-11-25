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

  // Fail-closed authorization: dashboard access requires all three exact conditions:
  // 1. collegeApprovalStatus === 'APPROVED'
  // 2. collegeStatus === 'ACTIVE'
  // 3. managementUnlocked === true
  const isApproved = user.collegeApprovalStatus === 'APPROVED';
  const isActive = user.collegeStatus === 'ACTIVE';
  const isUnlocked = user.managementUnlocked === true;

  if (
    user.role === 'COLLEGE_ADMIN' &&
    (!isApproved || !isActive || !isUnlocked)
  ) {
    return <Navigate to="/onboarding-status" replace />;
  }

  return <Outlet />;
};
