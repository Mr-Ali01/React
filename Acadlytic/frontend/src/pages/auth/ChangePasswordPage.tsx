import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { KeyRound, ShieldCheck } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

import { authService } from '@/services/authService';
import { queryKeys } from '@/services/queryKeys';
import { isApiError } from '@/services/api';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(12, 'New password must be at least 12 characters')
      .max(128, 'New password must not exceed 128 characters')
      .regex(/[A-Z]/, 'New password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'New password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'New password must contain at least one digit')
      .regex(
        /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/,
        'New password must contain at least one special character'
      ),
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    message: 'New password must be different from current password',
    path: ['newPassword'],
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;

export const ChangePasswordPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
    mode: 'onTouched',
  });

  const onSubmit = async (values: ChangePasswordFormValues) => {
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await authService.changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });

      setSuccessMessage(
        'Your password has been changed successfully. All other active sessions have been revoked.'
      );
      reset();

      // Refresh authoritative /auth/me state
      await queryClient.invalidateQueries({
        queryKey: queryKeys.auth.currentUser(),
      });
    } catch (err) {
      if (isApiError(err)) {
        if (err.errorCode === 'INVALID_CURRENT_PASSWORD') {
          setErrorMessage('Current password is incorrect.');
        } else if (err.errorCode === 'PASSWORD_POLICY_VIOLATION') {
          setErrorMessage(
            err.message || 'New password violates policy requirements.'
          );
        } else {
          setErrorMessage(err.message || 'Failed to update password.');
        }
      } else if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('An unexpected error occurred.');
      }
    }
  };

  return (
    <PageContainer
      title="Security Settings"
      subtitle="Manage your credentials and password security."
      maxWidth="xl"
      breadcrumbs={[
        { label: 'Overview', href: '/' },
        { label: 'Change Password' },
      ]}
    >
      <Card title="Update Password">
        <div className="space-y-4 mt-2">
          {successMessage && (
            <Alert variant="success" title="Success">
              {successMessage}
            </Alert>
          )}

          {errorMessage && (
            <Alert variant="error" title="Error">
              {errorMessage}
            </Alert>
          )}

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 flex items-start gap-2">
            <ShieldCheck className="h-4 w-4 text-sky-600 flex-shrink-0 mt-0.5" />
            <p>
              Changing your password immediately revokes all other active
              sessions and securely rotates your current session ID.
            </p>
          </div>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4"
            noValidate
          >
            <Input
              label="Current Password"
              type="password"
              placeholder="••••••••••••"
              autoComplete="current-password"
              error={errors.currentPassword?.message}
              disabled={isSubmitting}
              required
              {...register('currentPassword')}
            />

            <Input
              label="New Password"
              type="password"
              placeholder="Minimum 12 characters"
              autoComplete="new-password"
              helperText="12-128 characters, upper, lower, digit, and special character"
              error={errors.newPassword?.message}
              disabled={isSubmitting}
              required
              {...register('newPassword')}
            />

            <Input
              label="Confirm New Password"
              type="password"
              placeholder="Re-enter new password"
              autoComplete="new-password"
              error={errors.confirmPassword?.message}
              disabled={isSubmitting}
              required
              {...register('confirmPassword')}
            />

            <div className="pt-2 flex justify-end">
              <Button
                type="submit"
                className="gap-2"
                disabled={isSubmitting}
                isLoading={isSubmitting}
              >
                <KeyRound className="h-4 w-4" />
                Change Password
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </PageContainer>
  );
};
