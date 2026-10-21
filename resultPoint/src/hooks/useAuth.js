import { useAppSelector } from './useAppSelector';
import { selectCurrentUser, selectIsAuthenticated } from '../features/auth/authSlice';
import { authService } from '../services/authService';

/**
 * Custom hook providing a single canonical source of authentication status.
 * Reconciles Redux Toolkit state with authService/localStorage session.
 */
export function useAuth() {
  const reduxIsAuth = useAppSelector(selectIsAuthenticated);
  const reduxUser = useAppSelector(selectCurrentUser);
  const serviceUser = authService.getCurrentUser();
  const serviceIsAuth = authService.isAuthenticated();

  const currentUser = reduxUser || serviceUser;
  const isAuthenticated = Boolean((reduxIsAuth && currentUser) || serviceIsAuth);
  const role = currentUser?.role || null;
  const isStudent = isAuthenticated && role === 'student';
  const isAdmin = isAuthenticated && role === 'admin';

  return {
    isAuthenticated: isStudent || isAdmin,
    currentUser: (isStudent || isAdmin) ? currentUser : null,
    role: (isStudent || isAdmin) ? role : null,
    isStudent,
    isAdmin,
  };
}

export default useAuth;
