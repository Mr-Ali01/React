import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useCurrentUser } from '@/hooks/useAuth';
import { authService } from '@/services/authService';
import { useAuthStore } from '@/stores/authStore';
import { ApiError } from '@/services/api';
import { createTestQueryClient } from './test-utils';
import { QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

describe('3. /auth/me Unauthenticated Startup Handling', () => {
  beforeEach(() => {
    useAuthStore.getState().clearAuth();
    vi.clearAllMocks();
  });

  it('/auth/me 401 on startup results in unauthenticated state with no redirect loop', async () => {
    vi.spyOn(authService, 'getMe').mockRejectedValue(
      new ApiError('Authentication required', {
        errorCode: 'AUTH_UNAUTHENTICATED',
        status: 401,
      })
    );

    const queryClient = createTestQueryClient();
    const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useCurrentUser(), { wrapper });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    // Check store state: not authenticated, not loading, user is null, initialized is true
    const store = useAuthStore.getState();
    expect(store.isAuthenticated).toBe(false);
    expect(store.user).toBeNull();
    expect(store.isLoading).toBe(false);
    expect(store.isInitialized).toBe(true);
    expect(result.current.isInitializing).toBe(false);
  });

  it('background refetch on known guest retains initialized state and does not revert to initializing', async () => {
    vi.spyOn(authService, 'getMe').mockRejectedValue(
      new ApiError('Authentication required', {
        errorCode: 'AUTH_UNAUTHENTICATED',
        status: 401,
      })
    );

    const queryClient = createTestQueryClient();
    const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useCurrentUser(), { wrapper });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(useAuthStore.getState().isInitialized).toBe(true);
    expect(result.current.isInitializing).toBe(false);

    // Trigger background refetch
    await result.current.refetch();

    // After refetch completes, store remains initialized and not initializing
    const store = useAuthStore.getState();
    expect(store.isAuthenticated).toBe(false);
    expect(store.isInitialized).toBe(true);
    expect(store.isLoading).toBe(false);
    expect(result.current.isInitializing).toBe(false);
  });
});
