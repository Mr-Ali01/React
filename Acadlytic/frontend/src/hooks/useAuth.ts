import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authService } from '@/services/authService';
import { queryKeys } from '@/services/queryKeys';
import { useAuthStore } from '@/stores/authStore';
import { CurrentUser, LoginRequest } from '@/types';

/**
 * Hook to fetch and synchronize current user authentication state.
 * Uses HTTP-only cookie-based session verification with TanStack Query and Zustand.
 */
export const useCurrentUser = () => {
  const { setUser, clearAuth, setLoading } = useAuthStore();

  const query = useQuery<CurrentUser, Error>({
    queryKey: queryKeys.auth.currentUser(),
    queryFn: authService.getMe,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  useEffect(() => {
    setLoading(query.isLoading);
    if (query.data) {
      setUser(query.data);
    } else if (query.isError) {
      clearAuth();
    }
  }, [query.data, query.isError, query.isLoading, setUser, clearAuth, setLoading]);

  return query;
};

/**
 * Mutation hook for logging in.
 * Updates query cache and auth store on successful session establishment.
 */
export const useLogin = () => {
  const queryClient = useQueryClient();
  const { setUser } = useAuthStore();

  return useMutation({
    mutationFn: (credentials: LoginRequest) => authService.login(credentials),
    onSuccess: (user: CurrentUser) => {
      queryClient.setQueryData(queryKeys.auth.currentUser(), user);
      setUser(user);
    },
  });
};

/**
 * Mutation hook for logging out.
 * Clears session cookies on backend and purges local query and store cache.
 */
export const useLogout = () => {
  const queryClient = useQueryClient();
  const { clearAuth } = useAuthStore();

  return useMutation({
    mutationFn: () => authService.logout(),
    onSettled: () => {
      clearAuth();
      queryClient.removeQueries({ queryKey: queryKeys.auth.all });
    },
  });
};
