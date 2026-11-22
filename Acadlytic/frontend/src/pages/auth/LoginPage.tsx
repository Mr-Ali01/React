import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { LogIn } from 'lucide-react';

import { useLogin } from '@/hooks/useAuth';
import { isApiError } from '@/services/api';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';

/**
 * Login form validation schema using Zod.
 * Enforces valid email format and non-empty password.
 * Per security guidelines, complex password policies are NOT enforced on login.
 */
const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

/**
 * Maps backend error codes to user-friendly messages.
 * Never leaks account existence or sensitive institutional data.
 */
function getErrorMessage(error: unknown): string {
  if (isApiError(error)) {
    switch (error.errorCode) {
      case 'AUTH_INVALID_CREDENTIALS':
        return 'Invalid email or password.';
      case 'AUTH_ACCOUNT_LOCKED':
        return 'Account is temporarily locked due to multiple failed login attempts. Please try again later.';
      case 'COLLEGE_SUSPENDED':
        return 'This college account is currently suspended. Please contact Acadlytic support.';
      case 'COLLEGE_INACTIVE':
        return 'This college account is inactive. Please contact Acadlytic support.';
      case 'REGISTRATION_PERMANENTLY_REJECTED':
        return 'This college registration has been permanently rejected.';
      case 'AUTH_ROLE_NOT_SUPPORTED':
        return 'This account role is not enabled in the current release.';
      case 'AUTH_ACCOUNT_SUSPENDED':
        return 'Your account has been suspended. Please contact support.';
      case 'AUTH_ACCOUNT_INACTIVE':
        return 'Your account is inactive.';
      case 'CSRF_TOKEN_INVALID':
        return 'Security token expired. Please refresh the page and try again.';
      default:
        return (
          error.message ||
          'An unexpected authentication error occurred. Please try again.'
        );
    }
  }

  if (error instanceof Error) {
    if (error.message.includes('Network Error')) {
      return 'Unable to connect to the server. Please check your network connection.';
    }
    return error.message;
  }

  return 'A network or server error occurred. Please try again.';
}

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const loginMutation = useLogin();
  const [authError, setAuthError] = useState<string | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fromLocation = (location.state as any)?.from?.pathname;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
    mode: 'onTouched',
  });

  const onSubmit = async (values: LoginFormValues) => {
    setAuthError(null);
    try {
      const user = await loginMutation.mutateAsync(values);

      if (fromLocation && !fromLocation.startsWith('/auth')) {
        navigate(fromLocation, { replace: true });
      } else if (user.role === 'SUPER_ADMIN') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate('/college/dashboard', { replace: true });
      }
    } catch (err) {
      setAuthError(getErrorMessage(err));
    }
  };

  const isPending = isSubmitting || loginMutation.isPending;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          Sign in to Acadlytic
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Enter your institutional credentials to access your dashboard.
        </p>
      </div>

      {authError && <Alert variant="error">{authError}</Alert>}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Input
          label="Email Address"
          type="email"
          placeholder="admin@college.edu"
          autoComplete="email"
          error={errors.email?.message}
          disabled={isPending}
          required
          {...register('email')}
        />

        <div className="space-y-1">
          <Input
            label="Password"
            type="password"
            placeholder="••••••••••••"
            autoComplete="current-password"
            error={errors.password?.message}
            disabled={isPending}
            required
            {...register('password')}
          />
          <div className="flex justify-end pt-1">
            <Link
              to="/auth/forgot-password"
              className="text-xs font-medium text-sky-600 hover:text-sky-700 hover:underline"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        <Button
          type="submit"
          className="w-full gap-2"
          disabled={isPending}
          isLoading={isPending}
        >
          <LogIn className="h-4 w-4" />
          Sign In
        </Button>
      </form>

      <div className="pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
        <span>Need to onboard a college? </span>
        <Link
          to="/auth/register-college"
          className="font-medium text-sky-600 hover:text-sky-700 hover:underline"
        >
          Register College
        </Link>
      </div>
    </div>
  );
};
