import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X, LayoutDashboard } from 'lucide-react';
import { useAppSelector } from '../../hooks/useAppSelector';
import { selectCurrentUser, selectIsAuthenticated } from '../../features/auth/authSlice';
import { authService } from '../../services/authService';

export default function MobileDrawer({ isOpen, onClose }) {
  const reduxIsAuth = useAppSelector(selectIsAuthenticated);
  const reduxUser = useAppSelector(selectCurrentUser);
  const serviceUser = authService.getCurrentUser();
  const currentUser = reduxUser || serviceUser;
  const isAuthenticated = Boolean((reduxIsAuth && currentUser) || authService.isAuthenticated());

  const isStudent = isAuthenticated && currentUser?.role === 'student';
  const isAdmin = isAuthenticated && currentUser?.role === 'admin';
  const dashboardPath = isAdmin ? '/admin/dashboard' : '/student/dashboard';
  const dashboardLabel = isAdmin ? 'Go to Admin' : 'Go to Dashboard';

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.classList.remove('overflow-hidden');
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 z-[9998] bg-black/45 backdrop-blur-[2px] transition-opacity duration-300 lg:hidden ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      <div
        className={`fixed top-0 right-0 z-[9999] h-[100dvh] w-80 max-w-[85vw] bg-card border-l border-border shadow-2xl transition-transform duration-300 ease-in-out lg:hidden flex flex-col justify-between overflow-y-auto ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div>
          <div className="flex items-center justify-between px-5 py-5 border-b border-border">
            <span className="text-lg font-bold text-text-h">Menu</span>
            <button
              onClick={onClose}
              type="button"
              className="p-2 rounded-lg text-text-m hover:bg-bg-sec hover:text-text-h transition-colors"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="flex flex-col space-y-1.5 px-4 pt-5 text-sm font-medium">
            <Link onClick={onClose} to="/calculators" className="px-3 py-2.5 rounded-lg text-text-h hover:bg-bg-sec transition-colors">
              Calculators
            </Link>
            <Link onClick={onClose} to="/universities" className="px-3 py-2.5 rounded-lg text-text-h hover:bg-bg-sec transition-colors">
              Universities
            </Link>
            <Link onClick={onClose} to="/tools" className="px-3 py-2.5 rounded-lg text-text-h hover:bg-bg-sec transition-colors">
              Academic Tools
            </Link>
            <Link onClick={onClose} to="/resources" className="px-3 py-2.5 rounded-lg text-text-h hover:bg-bg-sec transition-colors">
              Resources
            </Link>
            <Link onClick={onClose} to="/about" className="px-3 py-2.5 rounded-lg text-text-h hover:bg-bg-sec transition-colors">
              About Us
            </Link>
            <Link onClick={onClose} to="/contact" className="px-3 py-2.5 rounded-lg text-text-h hover:bg-bg-sec transition-colors">
              Contact Us
            </Link>
          </nav>
        </div>

        <div className="mx-4 mb-6 pt-5 border-t border-border flex flex-col gap-2.5">
          {isStudent || isAdmin ? (
            <Link
              onClick={onClose}
              to={dashboardPath}
              className="w-full py-2.5 text-center text-sm font-bold rounded-xl bg-accent text-white shadow-accent hover:bg-accent-hover transition-colors flex items-center justify-center gap-2"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>{dashboardLabel}</span>
            </Link>
          ) : (
            <>
              <Link
                onClick={onClose}
                to="/login"
                className="w-full py-2.5 text-center text-sm font-semibold rounded-xl border border-border text-text-h hover:bg-bg-sec transition-colors"
              >
                Login
              </Link>
              <Link
                onClick={onClose}
                to="/signup"
                className="w-full py-2.5 text-center text-sm font-bold rounded-xl bg-accent text-white shadow-accent hover:bg-accent-hover transition-colors"
              >
                Sign Up Free →
              </Link>
            </>
          )}
        </div>
      </div>
    </>
  );
}