import { createBrowserRouter } from 'react-router-dom';
import { RootLayout } from '@/layouts/RootLayout';
import { AppLayout } from '@/layouts/AppLayout';
import { AuthLayout } from '@/layouts/AuthLayout';

// Route Guards
import { ProtectedRoute } from './guards/ProtectedRoute';
import { RoleGuard } from './guards/RoleGuard';
import { CollegeApprovalGuard } from './guards/CollegeApprovalGuard';
import { PublicOnlyRoute } from './guards/PublicOnlyRoute';

// Pages
import { HomePage } from '@/pages/HomePage';
import { HealthCheckPage } from '@/pages/HealthCheckPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { UnauthorizedPage } from '@/pages/UnauthorizedPage';
import { OnboardingStatusPage } from '@/pages/OnboardingStatusPage';
import { LoginPage } from '@/pages/auth/LoginPage';
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage';
import { RegisterCollegePage } from '@/pages/auth/RegisterCollegePage';
import { ChangePasswordPage } from '@/pages/auth/ChangePasswordPage';
import { SuperAdminDashboardPage } from '@/pages/dashboard/SuperAdminDashboardPage';
import { CollegeAdminDashboardPage } from '@/pages/dashboard/CollegeAdminDashboardPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      // Public / Overview Routes
      {
        element: <AppLayout />,
        children: [
          {
            index: true,
            element: <HomePage />,
          },
          {
            path: 'health',
            element: <HealthCheckPage />,
          },
          {
            path: 'unauthorized',
            element: <UnauthorizedPage />,
          },
          {
            path: 'onboarding-status',
            element: <OnboardingStatusPage />,
          },
        ],
      },

      // Guest-Only Authentication Routes
      {
        path: 'auth',
        element: <PublicOnlyRoute />,
        children: [
          {
            element: <AuthLayout />,
            children: [
              {
                path: 'login',
                element: <LoginPage />,
              },
              {
                path: 'forgot-password',
                element: <ForgotPasswordPage />,
              },
              {
                path: 'reset-password',
                element: <ResetPasswordPage />,
              },
              {
                path: 'register-college',
                element: <RegisterCollegePage />,
              },
            ],
          },
        ],
      },

      // Protected Super Admin Portal Routes
      {
        path: 'settings',
        element: <ProtectedRoute />,
        children: [
          {
            element: <AppLayout />,
            children: [
              {
                path: 'change-password',
                element: <ChangePasswordPage />,
              },
            ],
          },
        ],
      },
      {
        path: 'admin',
        element: <ProtectedRoute />,
        children: [
          {
            element: <RoleGuard allowedRoles={['SUPER_ADMIN']} />,
            children: [
              {
                element: <AppLayout />,
                children: [
                  {
                    path: 'dashboard',
                    element: <SuperAdminDashboardPage />,
                  },
                  {
                    path: 'colleges',
                    element: <SuperAdminDashboardPage />,
                  },
                ],
              },
            ],
          },
        ],
      },

      // Protected College Admin Portal Routes
      {
        path: 'college',
        element: <ProtectedRoute />,
        children: [
          {
            element: <RoleGuard allowedRoles={['COLLEGE_ADMIN']} />,
            children: [
              {
                element: <CollegeApprovalGuard />,
                children: [
                  {
                    element: <AppLayout />,
                    children: [
                      {
                        path: 'dashboard',
                        element: <CollegeAdminDashboardPage />,
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },

      // Fallback 404
      {
        element: <AppLayout />,
        children: [
          {
            path: '*',
            element: <NotFoundPage />,
          },
        ],
      },
    ],
  },
]);
