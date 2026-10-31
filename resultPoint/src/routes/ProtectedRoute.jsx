import { Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '../hooks/useAppSelector';
import { selectIsAuthenticated, selectCurrentUser } from '../features/auth/authSlice';
import { authService } from '../services/authService';

export default function ProtectedRoute({ children }) {
  const location = useLocation();
  const isAuthRedux = useAppSelector(selectIsAuthenticated);
  const reduxUser = useAppSelector(selectCurrentUser);
  const serviceUser = authService.getCurrentUser();
  const currentUser = reduxUser || serviceUser;
  const isAuthenticated = Boolean((isAuthRedux && currentUser) || authService.isAuthenticated());

  if (!isAuthenticated || !currentUser) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
console.log("how are you");
console.log("how are you");
console.log("how are you");
console.log("how are you");
console.log("how are you");
console.log("how are you");


  // If authenticated as Admin, redirect to Admin dashboard
  if (currentUser.role === 'admin') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  // Strictly student role only
  if (currentUser.role !== 'student') {
    authService.clearInvalidSession('Unauthorized role attempting student portal access');
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}
