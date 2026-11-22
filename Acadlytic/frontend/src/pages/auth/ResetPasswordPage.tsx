import React, { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { KeyRound, CheckCircle, ArrowLeft } from 'lucide-react';

import { authService } from '@/services/authService';
import { isApiError } from '@/services/api';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';

/**
 * Password policy schema mirroring backend rules:
 * - 12 to 128 characters
 * - Uppercase, lowercase, digit, and special character
 * - Confirmation match
 */
const passwordPolicySchema = z
  .object({
    newPassword: z
      .string()
      .min(12, 'Password must be at least 12 characters')
      .max(128, 'Password must not exceed 128 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one digit')
      .regex(
        /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/,
        'Password must contain at least one special character'
      ),
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type ResetPasswordFormValues = z.infer<typeof passwordPolicySchema>;

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Extract reset token once and remove from URL to prevent history leakage
  const tokenRef = useRef<string>(searchParams.get('token') || '');
  const [hasToken, setHasToken] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  useEffect(() => {
    const rawToken = searchParams.get('token');
    if (rawToken) {
      tokenRef.current = rawToken;
      setHasToken(true);
      // Clean up token from browser address bar
      if (typeof window !== 'undefined') {
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, '', cleanUrl);
      }
    } else if (!tokenRef.current) {
      setHasToken(false);
      setErrorMessage(
        'Missing password reset token. Please request a new password reset link from the sign-in page.'
      );
    }
  }, [searchParams]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(passwordPolicySchema),
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
    mode: 'onTouched',
  });

  const onSubmit = async (values: ResetPasswordFormValues) => {
    if (!tokenRef.current) {
      setErrorMessage(
        'Missing reset token. Please request a new password reset link.'
      );
      return;
    }

    setErrorMessage(null);

    try {
      await authService.resetPassword({
        token: tokenRef.current,
        newPassword: values.newPassword,
      });

      setIsSuccess(true);
      setTimeout(() => {
        navigate('/auth/login', { replace: true });
      }, 3000);
    } catch (err) {
      if (isApiError(err)) {
        if (err.errorCode === 'INVALID_OR_EXPIRED_TOKEN') {
          setErrorMessage(
            'This password reset link is invalid, has expired, or has already been used. Please request a new one.'
          );
        } else if (err.errorCode === 'PASSWORD_POLICY_VIOLATION') {
          setErrorMessage(
            err.message ||
              'The new password violates the security policy. Please choose a different password.'
          );
        } else {
          setErrorMessage(
            err.message || 'Failed to reset password. Please try again.'
          );
        }
      } else if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage(
          'An unexpected error occurred while resetting password.'
        );
      }
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          Create New Password
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Set a secure password meeting institutional security policies.
        </p>
      </div>

      {isSuccess ? (
        <div className="text-center py-4 space-y-4">
          <div className="h-12 w-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle className="h-6 w-6" />
          </div>
          <Alert variant="success" title="Password Reset Successfully">
            Your password has been securely updated and all prior sessions have
            been revoked. Redirecting to sign in...
          </Alert>
          <div className="pt-2">
            <Link to="/auth/login">
              <Button size="sm">Go to Sign In Now</Button>
            </Link>
          </div>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
          noValidate
        >
          {errorMessage && <Alert variant="error">{errorMessage}</Alert>}

          <Input
            label="New Password"
            type="password"
            placeholder="Minimum 12 characters"
            autoComplete="new-password"
            helperText="12-128 characters, uppercase, lowercase, digit, and special character"
            error={errors.newPassword?.message}
            disabled={!hasToken || isSubmitting}
            required
            {...register('newPassword')}
          />

          <Input
            label="Confirm New Password"
            type="password"
            placeholder="Re-enter your new password"
            autoComplete="new-password"
            error={errors.confirmPassword?.message}
            disabled={!hasToken || isSubmitting}
            required
            {...register('confirmPassword')}
          />

          <Button
            type="submit"
            className="w-full gap-2"
            disabled={!hasToken || isSubmitting}
            isLoading={isSubmitting}
          >
            <KeyRound className="h-4 w-4" />
            Set New Password
          </Button>

          <div className="pt-2 text-center">
            <Link
              to="/auth/login"
              className="text-xs font-medium text-slate-600 hover:text-slate-900 inline-flex items-center gap-1.5"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Cancel and Return to Sign In
            </Link>
          </div>
        </form>
      )}
    </div>
  );
};
