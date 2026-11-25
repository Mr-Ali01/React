import { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useIsMutating } from '@tanstack/react-query';
import { authService } from '@/services/authService';
import { queryKeys } from '@/services/queryKeys';
import { VerifyEmailRequest, VerifyEmailResponse } from '@/types';
import { ApiError, isApiError, parseRetryAfter } from '@/services/api';
import { useAuthStore } from '@/stores/authStore';

// Synchronous invocation-level concurrency guards
let isVerificationInFlight = false;
let isResendInFlight = false;

export function _resetConcurrencyFlags() {
  isVerificationInFlight = false;
  isResendInFlight = false;
}

/**
 * Mutation hook for redeeming a single-use 48-hour email verification token.
 * Unauthenticated public endpoint; does not issue a session cookie.
 * If caller is authenticated, invalidates and updates currentUser to reflect verified status.
 */
export function useVerifyEmail() {
  const queryClient = useQueryClient();

  const mutation = useMutation<VerifyEmailResponse, ApiError, VerifyEmailRequest>({
    mutationKey: queryKeys.auth.verifyEmail(),
    mutationFn: async (payload: VerifyEmailRequest) => {
      // Invariant check inside mutationFn
      if (isResendInFlight) {
        throw new ApiError(
          'Cannot verify email while a verification email resend request is in progress.',
          { errorCode: 'CONCURRENT_RESEND_IN_PROGRESS', status: 409 }
        );
      }
      return authService.verifyEmail(payload);
    },
    onSuccess: () => {
      // Invalidate currentUser query cache
      queryClient.invalidateQueries({
        queryKey: queryKeys.auth.currentUser(),
      });

      // If user is currently authenticated, update emailVerified in the auth store immediately
      const { user, setUser } = useAuthStore.getState();
      if (user) {
        setUser({ ...user, emailVerified: true });
      }
    },
    onSettled: () => {
      isVerificationInFlight = false;
    },
  });

  const mutate = (
    variables: VerifyEmailRequest,
    options?: Parameters<typeof mutation.mutate>[1]
  ): void => {
    // Synchronous turn check at invocation time
    if (isResendInFlight || queryClient.isMutating({ mutationKey: queryKeys.auth.resendVerification() }) > 0) {
      const err = new ApiError(
        'Cannot verify email while a verification email resend request is in progress.',
        { errorCode: 'CONCURRENT_RESEND_IN_PROGRESS', status: 409 }
      );
      (options?.onError as any)?.(err, variables, undefined);
      return;
    }
    if (isVerificationInFlight || queryClient.isMutating({ mutationKey: queryKeys.auth.verifyEmail() }) > 0) {
      const err = new ApiError(
        'Email verification is already in progress.',
        { errorCode: 'CONCURRENT_VERIFICATION_IN_PROGRESS', status: 409 }
      );
      (options?.onError as any)?.(err, variables, undefined);
      return;
    }

    isVerificationInFlight = true;
    mutation.mutate(variables, {
      ...options,
      onSettled: (data, error, vars, context) => {
        isVerificationInFlight = false;
        (options?.onSettled as any)?.(data, error, vars, context);
      },
    });
  };

  const mutateAsync = async (
    variables: VerifyEmailRequest,
    options?: Parameters<typeof mutation.mutateAsync>[1]
  ): Promise<VerifyEmailResponse> => {
    // Synchronous turn check at invocation time
    if (isResendInFlight || queryClient.isMutating({ mutationKey: queryKeys.auth.resendVerification() }) > 0) {
      const err = new ApiError(
        'Cannot verify email while a verification email resend request is in progress.',
        { errorCode: 'CONCURRENT_RESEND_IN_PROGRESS', status: 409 }
      );
      (options?.onError as any)?.(err, variables, undefined);
      throw err;
    }
    if (isVerificationInFlight || queryClient.isMutating({ mutationKey: queryKeys.auth.verifyEmail() }) > 0) {
      const err = new ApiError(
        'Email verification is already in progress.',
        { errorCode: 'CONCURRENT_VERIFICATION_IN_PROGRESS', status: 409 }
      );
      (options?.onError as any)?.(err, variables, undefined);
      throw err;
    }

    isVerificationInFlight = true;
    try {
      return await mutation.mutateAsync(variables, options);
    } finally {
      isVerificationInFlight = false;
    }
  };

  return {
    ...mutation,
    mutate,
    mutateAsync,
  };
}

/**
 * Mutation hook for requesting a fresh 48-hour email verification link.
 * Strictly requires an authenticated COLLEGE_ADMIN session.
 * Enforces mutual exclusion against in-flight verification requests, manages
 * rate-limit countdowns, and clears session if unauthenticated.
 */
export function useResendVerification() {
  const queryClient = useQueryClient();
  const [countdown, setCountdown] = useState<number | null>(null);

  // Check if a verification request is currently in-flight anywhere in the app
  const isVerifying =
    useIsMutating({ mutationKey: queryKeys.auth.verifyEmail() }) > 0 || isVerificationInFlight;

  // Active countdown timer with automatic cleanup
  useEffect(() => {
    if (countdown === null || countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown]);

  const mutation = useMutation<void, ApiError, void>({
    mutationKey: queryKeys.auth.resendVerification(),
    mutationFn: async () => {
      // Invariant check inside mutationFn
      if (isVerificationInFlight) {
        throw new ApiError(
          'Cannot request a new verification email while email verification is in progress.',
          { errorCode: 'CONCURRENT_VERIFICATION_IN_PROGRESS', status: 409 }
        );
      }
      return authService.resendVerification();
    },
    onError: (err: unknown) => {
      if (isApiError(err)) {
        // 1. Rate limit exceeded (429)
        if (err.status === 429 || err.errorCode === 'RATE_LIMIT_EXCEEDED') {
          const parsedRetry = parseRetryAfter(err.retryAfter);
          if (parsedRetry !== null && parsedRetry > 0) {
            setCountdown(parsedRetry);
          }
        }

        // 2. Already verified (400)
        if (err.errorCode === 'EMAIL_ALREADY_VERIFIED') {
          queryClient.invalidateQueries({
            queryKey: queryKeys.auth.currentUser(),
          });
          const { user, setUser } = useAuthStore.getState();
          if (user) {
            setUser({ ...user, emailVerified: true });
          }
        }

        // 3. Unauthenticated session expired (401)
        if (err.status === 401 || err.errorCode === 'AUTH_UNAUTHENTICATED') {
          useAuthStore.getState().clearAuth();
        }
      }
    },
    onSettled: () => {
      isResendInFlight = false;
    },
  });

  const mutate = (
    variables: void,
    options?: Parameters<typeof mutation.mutate>[1]
  ): void => {
    // Synchronous turn check at invocation time
    if (isVerificationInFlight || queryClient.isMutating({ mutationKey: queryKeys.auth.verifyEmail() }) > 0) {
      const err = new ApiError(
        'Cannot request a new verification email while email verification is in progress.',
        { errorCode: 'CONCURRENT_VERIFICATION_IN_PROGRESS', status: 409 }
      );
      (options?.onError as any)?.(err, variables, undefined);
      return;
    }
    if (isResendInFlight || queryClient.isMutating({ mutationKey: queryKeys.auth.resendVerification() }) > 0) {
      const err = new ApiError(
        'A verification email resend request is already in progress.',
        { errorCode: 'CONCURRENT_RESEND_IN_PROGRESS', status: 409 }
      );
      (options?.onError as any)?.(err, variables, undefined);
      return;
    }

    isResendInFlight = true;
    mutation.mutate(variables, {
      ...options,
      onSettled: (data, error, vars, context) => {
        isResendInFlight = false;
        (options?.onSettled as any)?.(data, error, vars, context);
      },
    });
  };

  const mutateAsync = async (
    variables: void,
    options?: Parameters<typeof mutation.mutateAsync>[1]
  ): Promise<void> => {
    // Synchronous turn check at invocation time
    if (isVerificationInFlight || queryClient.isMutating({ mutationKey: queryKeys.auth.verifyEmail() }) > 0) {
      const err = new ApiError(
        'Cannot request a new verification email while email verification is in progress.',
        { errorCode: 'CONCURRENT_VERIFICATION_IN_PROGRESS', status: 409 }
      );
      (options?.onError as any)?.(err, variables, undefined);
      throw err;
    }
    if (isResendInFlight || queryClient.isMutating({ mutationKey: queryKeys.auth.resendVerification() }) > 0) {
      const err = new ApiError(
        'A verification email resend request is already in progress.',
        { errorCode: 'CONCURRENT_RESEND_IN_PROGRESS', status: 409 }
      );
      (options?.onError as any)?.(err, variables, undefined);
      throw err;
    }

    isResendInFlight = true;
    try {
      return await mutation.mutateAsync(variables, options);
    } finally {
      isResendInFlight = false;
    }
  };

  return {
    ...mutation,
    mutate,
    mutateAsync,
    countdown,
    isVerifying,
    isPending: mutation.isPending,
    resetCountdown: () => setCountdown(null),
  };
}
