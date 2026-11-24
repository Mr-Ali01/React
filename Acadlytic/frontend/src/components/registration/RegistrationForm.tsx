import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { Building2, MapPin, UserCheck, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import {
  RegisterCollegeFormValues,
  registerCollegeSchema,
} from '@/schemas/registrationSchema';
import {
  useCollegeRegistration,
  extractRetryAfter,
} from '@/hooks/useCollegeRegistration';
import { RegistrationSectionHeader } from './RegistrationSectionHeader';
import { PasswordStrengthMeter } from './PasswordStrengthMeter';
import { CollegeRegistrationResponse } from '@/types';
import { isApiError } from '@/services/api';

interface RegistrationFormProps {
  onSuccess: (data: CollegeRegistrationResponse) => void;
}

export const RegistrationForm: React.FC<RegistrationFormProps> = ({
  onSuccess,
}) => {
  const [generalError, setGeneralError] = useState<{
    variant: 'error' | 'warning';
    title?: string;
    message: string;
    action?: React.ReactNode;
  } | null>(null);

  // Rate-limiting countdown state
  const [retryCountdown, setRetryCountdown] = useState<number | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterCollegeFormValues>({
    resolver: zodResolver(registerCollegeSchema),
    mode: 'onTouched',
    defaultValues: {
      legalName: '',
      code: '',
      affiliatedUniversityName: '',
      websiteUrl: '',
      contactPhone: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      country: '',
      postalCode: '',
      adminFirstName: '',
      adminLastName: '',
      adminEmail: '',
      password: '',
      confirmPassword: '',
    },
  });

  const registrationMutation = useCollegeRegistration();

  // Watch fields for interactive password policy validation
  const watchedPassword = watch('password');
  const watchedEmail = watch('adminEmail');

  // Handle active rate limit countdown timer with cleanup
  useEffect(() => {
    if (retryCountdown === null || retryCountdown <= 0) return;

    const timer = setInterval(() => {
      setRetryCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [retryCountdown]);

  const onSubmit = async (values: RegisterCollegeFormValues) => {
    setGeneralError(null);

    try {
      const response = await registrationMutation.mutateAsync(values);
      onSuccess(response);
    } catch (err: unknown) {
      if (isApiError(err)) {
        const errorCode = err.errorCode;

        // 1. Validation Error mapping to specific fields
        if (errorCode === 'VALIDATION_ERROR' && typeof err.errors === 'object' && err.errors !== null) {
          const fieldMap = err.errors as Record<string, string>;
          Object.entries(fieldMap).forEach(([field, msg]) => {
            setError(field as keyof RegisterCollegeFormValues, {
              type: 'server',
              message: msg,
            });
          });
          setGeneralError({
            variant: 'error',
            title: 'Validation Failed',
            message: 'Please correct the highlighted fields and try again.',
          });
          return;
        }

        // 2. Password Policy Violation
        if (errorCode === 'PASSWORD_POLICY_VIOLATION') {
          setError('password', {
            type: 'server',
            message: err.message,
          });
          setGeneralError({
            variant: 'error',
            title: 'Password Rejected',
            message: err.message,
          });
          return;
        }

        // 3. Duplicate College Code Conflict
        if (errorCode === 'COLLEGE_CODE_ALREADY_EXISTS') {
          setError('code', {
            type: 'server',
            message: 'This college code is already registered.',
          });
          setGeneralError({
            variant: 'error',
            title: 'College Code Unavailable',
            message:
              'The requested college code is already registered. Please choose a different code.',
          });
          return;
        }

        // 4. Duplicate Admin Email Conflict
        if (errorCode === 'EMAIL_ALREADY_EXISTS') {
          setError('adminEmail', {
            type: 'server',
            message: 'An active account with this email address already exists.',
          });
          setGeneralError({
            variant: 'error',
            title: 'Email Already Registered',
            message:
              'An active account with this administrator email address already exists.',
            action: (
              <Link
                to="/auth/login"
                className="font-semibold underline hover:text-red-950 ml-1"
              >
                Sign in to your account
              </Link>
            ),
          });
          return;
        }

        // 5. Rate Limit Exceeded
        if (errorCode === 'RATE_LIMIT_EXCEEDED' || err.status === 429) {
          const retryAfter = extractRetryAfter(err);
          if (retryAfter !== null && retryAfter > 0) {
            setRetryCountdown(retryAfter);
          } else {
            // Absent/invalid Retry-After: persistent warning, no invented countdown
            setGeneralError({
              variant: 'warning',
              title: 'Rate Limit Exceeded',
              message:
                'Too many registration requests from this IP address. Please wait a while before retrying.',
              action: (
                <button
                  type="button"
                  onClick={() => setGeneralError(null)}
                  className="font-semibold underline hover:text-amber-950 ml-2"
                >
                  Dismiss
                </button>
              ),
            });
          }
          return;
        }

        // 6. CSRF Handshake Failure after retry
        if (errorCode === 'CSRF_TOKEN_INVALID') {
          setGeneralError({
            variant: 'error',
            title: 'Security Token Error',
            message:
              'Your security token expired. Please refresh the page or try submitting again.',
          });
          return;
        }

        // Default API error
        setGeneralError({
          variant: 'error',
          title: 'Registration Error',
          message: err.message || 'An error occurred while submitting your application.',
        });
        return;
      }

      // Unexpected Network or System Error
      setGeneralError({
        variant: 'error',
        title: 'Connection Error',
        message:
          'Unable to reach the Acadlytic platform. Please verify your internet connection and try again.',
      });
    }
  };

  const isRateLimited = retryCountdown !== null && retryCountdown > 0;
  const isPending = isSubmitting || registrationMutation.isPending;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8" noValidate>
      {/* Rate Limit Active Countdown Alert */}
      {isRateLimited && (
        <Alert variant="warning" title="Rate Limit Exceeded">
          Too many registration requests from this IP address. Please wait{' '}
          <strong>{retryCountdown} seconds</strong> before trying again.
        </Alert>
      )}

      {/* General Alert Banner */}
      {generalError && (
        <Alert variant={generalError.variant} title={generalError.title}>
          <span>{generalError.message}</span>
          {generalError.action}
        </Alert>
      )}

      {/* =========================================================================
          SECTION 1: INSTITUTION DETAILS (5 Controls)
          ========================================================================= */}
      <section className="space-y-4">
        <RegistrationSectionHeader
          stepNumber={1}
          icon={<Building2 className="h-4 w-4" />}
          title="Institution Details"
          description="Legal identification, university affiliation, and institutional web presence."
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Input
              label="College Legal Name"
              placeholder="e.g. Horizon Institute of Science & Technology"
              error={errors.legalName?.message}
              disabled={isPending || isRateLimited}
              required
              autoComplete="organization"
              {...register('legalName')}
            />
          </div>

          <div>
            <Input
              label="College Code"
              placeholder="e.g. HORIZON-TECH"
              helperText="Letters, numbers, underscores, and hyphens (normalized to uppercase)."
              error={errors.code?.message}
              disabled={isPending || isRateLimited}
              required
              {...register('code')}
            />
          </div>

          <div>
            <Input
              label="Contact Phone"
              type="tel"
              placeholder="+1-555-0199"
              error={errors.contactPhone?.message}
              disabled={isPending || isRateLimited}
              required
              autoComplete="tel"
              {...register('contactPhone')}
            />
          </div>

          <div className="sm:col-span-2">
            <Input
              label="Affiliated University Name"
              placeholder="e.g. State Technological University"
              error={errors.affiliatedUniversityName?.message}
              disabled={isPending || isRateLimited}
              required
              {...register('affiliatedUniversityName')}
            />
          </div>

          <div className="sm:col-span-2">
            <Input
              label="Official Website URL"
              type="url"
              placeholder="https://www.horizon.edu (Optional)"
              error={errors.websiteUrl?.message}
              disabled={isPending || isRateLimited}
              autoComplete="url"
              {...register('websiteUrl')}
            />
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 2: CAMPUS ADDRESS & LOCATION (6 Controls)
          ========================================================================= */}
      <section className="space-y-4">
        <RegistrationSectionHeader
          stepNumber={2}
          icon={<MapPin className="h-4 w-4" />}
          title="Campus Address & Location"
          description="Physical campus address for accreditation and jurisdiction verification."
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Input
              label="Address Line 1"
              placeholder="Street Address, Campus Building"
              error={errors.addressLine1?.message}
              disabled={isPending || isRateLimited}
              required
              autoComplete="address-line1"
              {...register('addressLine1')}
            />
          </div>

          <div className="sm:col-span-2">
            <Input
              label="Address Line 2"
              placeholder="Suite, Wing, Landmark (Optional)"
              error={errors.addressLine2?.message}
              disabled={isPending || isRateLimited}
              autoComplete="address-line2"
              {...register('addressLine2')}
            />
          </div>

          <div>
            <Input
              label="City"
              placeholder="City"
              error={errors.city?.message}
              disabled={isPending || isRateLimited}
              required
              autoComplete="address-level2"
              {...register('city')}
            />
          </div>

          <div>
            <Input
              label="State / Province"
              placeholder="State"
              error={errors.state?.message}
              disabled={isPending || isRateLimited}
              required
              autoComplete="address-level1"
              {...register('state')}
            />
          </div>

          <div>
            <Input
              label="Country"
              placeholder="Country"
              error={errors.country?.message}
              disabled={isPending || isRateLimited}
              required
              autoComplete="country-name"
              {...register('country')}
            />
          </div>

          <div>
            <Input
              label="Postal / PIN Code"
              placeholder="Postal Code"
              error={errors.postalCode?.message}
              disabled={isPending || isRateLimited}
              required
              autoComplete="postal-code"
              {...register('postalCode')}
            />
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 3: PRIMARY ADMINISTRATOR ACCOUNT (5 Controls)
          ========================================================================= */}
      <section className="space-y-4">
        <RegistrationSectionHeader
          stepNumber={3}
          icon={<UserCheck className="h-4 w-4" />}
          title="Primary Administrator Account"
          description="Institutional administrator credentials. Used to log in after email verification."
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Input
              label="Administrator First Name"
              placeholder="First Name"
              error={errors.adminFirstName?.message}
              disabled={isPending || isRateLimited}
              required
              autoComplete="given-name"
              {...register('adminFirstName')}
            />
          </div>

          <div>
            <Input
              label="Administrator Last Name"
              placeholder="Last Name"
              error={errors.adminLastName?.message}
              disabled={isPending || isRateLimited}
              required
              autoComplete="family-name"
              {...register('adminLastName')}
            />
          </div>

          <div className="sm:col-span-2">
            <Input
              label="Administrator Official Email"
              type="email"
              placeholder="admin@horizon.edu"
              helperText="This email will be used for account verification and platform sign in."
              error={errors.adminEmail?.message}
              disabled={isPending || isRateLimited}
              required
              autoComplete="email"
              {...register('adminEmail')}
            />
          </div>

          <div>
            <Input
              label="Password"
              type="password"
              placeholder="••••••••••••"
              error={errors.password?.message}
              disabled={isPending || isRateLimited}
              required
              autoComplete="new-password"
              {...register('password')}
            />
          </div>

          <div>
            <Input
              label="Confirm Password"
              type="password"
              placeholder="••••••••••••"
              error={errors.confirmPassword?.message}
              disabled={isPending || isRateLimited}
              required
              autoComplete="new-password"
              {...register('confirmPassword')}
            />
          </div>

          <div className="sm:col-span-2">
            <PasswordStrengthMeter
              password={watchedPassword}
              adminEmail={watchedEmail}
            />
          </div>
        </div>
      </section>

      {/* Form Submit & Navigation */}
      <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
        <Link
          to="/auth/login"
          className="text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors order-2 sm:order-1"
        >
          Already registered? Sign in here
        </Link>

        <Button
          type="submit"
          variant="primary"
          isLoading={isPending}
          disabled={isPending || isRateLimited}
          className="w-full sm:w-auto px-6 py-2.5 gap-2 order-1 sm:order-2"
        >
          Submit Registration Application
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </form>
  );
};
