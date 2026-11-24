import { useMutation } from '@tanstack/react-query';
import { collegeRegistrationService } from '@/services/collegeRegistrationService';
import { queryKeys } from '@/services/queryKeys';
import {
  RegisterCollegeFormValues,
  CollegeRegistrationResponse,
} from '@/types';
import { toRegisterCollegeRequest } from '@/schemas/registrationSchema';
import { ApiError, isApiError, parseRetryAfter } from '@/services/api';

/**
 * Safely extracts and validates the Retry-After value from an error.
 * Returns positive integer seconds, or null if absent or non-numeric.
 * Never invents or hardcodes a fallback duration.
 */
export function extractRetryAfter(error: unknown): number | null {
  if (!error) return null;

  if (isApiError(error) && error.retryAfter !== undefined) {
    const fromApiError = parseRetryAfter(error.retryAfter);
    if (fromApiError !== null) {
      return fromApiError;
    }
  }

  const maybeAxios = error as {
    response?: {
      headers?: Record<string, unknown> & {
        get?: (name: string) => unknown;
      };
    };
  };

  const rawHeader =
    maybeAxios?.response?.headers?.['retry-after'] ??
    (typeof maybeAxios?.response?.headers?.get === 'function'
      ? maybeAxios.response.headers.get('retry-after')
      : null);

  return parseRetryAfter(rawHeader);
}

/**
 * TanStack Query mutation hook for submitting the public college registration form.
 * Transforms 16-control form values to the exact 15-field backend payload.
 */
export function useCollegeRegistration() {
  return useMutation<
    CollegeRegistrationResponse,
    ApiError,
    RegisterCollegeFormValues
  >({
    mutationKey: queryKeys.colleges.registration(),
    mutationFn: async (formValues: RegisterCollegeFormValues) => {
      const payload = toRegisterCollegeRequest(formValues);
      return collegeRegistrationService.registerCollege(payload);
    },
  });
}
