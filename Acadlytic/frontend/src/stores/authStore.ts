import { create } from 'zustand';
import { CurrentUser } from '@/types';

interface AuthState {
  user: CurrentUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: CurrentUser | null) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true, // Start with loading true until initial getMe check completes
  setUser: (user: CurrentUser | null) =>
    set({
      user,
      isAuthenticated: !!user,
      isLoading: false,
    }),
  clearAuth: () =>
    set({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    }),
  setLoading: (isLoading: boolean) =>
    set({
      isLoading,
    }),
}));
