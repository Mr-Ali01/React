import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

export const PublicOnlyRoute: React.FC = () => {
  const { isAuthenticated, user, isLoading, isInitialized } = useAuthStore();

  // Block rendering ONLY during initial application bootstrap.
  // During background refetches (when isInitialized is true), keep child routes mounted
  // so form state (Login, College Registration) is not destroyed.
  const isInitializing = !isInitialized && isLoading;
  if (isInitializing) {
    return null;
  }

  if (isAuthenticated && user) {
    if (user.role === 'SUPER_ADMIN') {
      return <Navigate to="/admin/dashboard" replace />;
    }
    return <Navigate to="/college/dashboard" replace />;
  }

  return <Outlet />;
};
