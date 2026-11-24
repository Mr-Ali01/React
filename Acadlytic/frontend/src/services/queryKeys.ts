/**
 * Centralized TanStack Query Keys Factory.
 * Prevents key collision and provides consistent query invalidation patterns.
 */
export const queryKeys = {
  auth: {
    all: ['auth'] as const,
    currentUser: () => [...queryKeys.auth.all, 'currentUser'] as const,
    verifyEmail: () => [...queryKeys.auth.all, 'verifyEmail'] as const,
    resendVerification: () =>
      [...queryKeys.auth.all, 'resendVerification'] as const,
  },
  system: {
    all: ['system'] as const,
    health: () => [...queryKeys.system.all, 'health'] as const,
  },
  colleges: {
    all: ['colleges'] as const,
    detail: (id: number) => [...queryKeys.colleges.all, id] as const,
    registration: () => [...queryKeys.colleges.all, 'registration'] as const,
  },
};
