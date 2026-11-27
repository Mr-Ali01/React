import { create } from 'zustand';
import { CurrentUser } from '@/types';

interface AuthState {
  user: CurrentUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  setUser: (user: CurrentUser | null) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
  setInitialized: (isInitialized: boolean) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true, // Start with loading true until initial getMe check completes
  isInitialized: false, // Distinguishes initial application bootstrap from background refetches
  setUser: (user: CurrentUser | null) =>
    set({
      user,
      isAuthenticated: !!user,
      isLoading: false,
      isInitialized: true,
    }),
  clearAuth: () =>
    set({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      isInitialized: true,
    }),
  setLoading: (isLoading: boolean) =>
    set({
      isLoading,
    }),
  setInitialized: (isInitialized: boolean) =>
    set({
      isInitialized,
    }),
  reset: () =>
    set({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      isInitialized: false,
    }),
}));
