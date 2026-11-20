import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Menu,
  Activity,
  LayoutDashboard,
  LogOut,
  User as UserIcon,
  Shield,
  Building2,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useAppStore } from '@/stores/appStore';
import { useLogout } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const { toggleSidebar } = useAppStore();
  const logoutMutation = useLogout();

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    navigate('/auth/login');
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: Sidebar toggle + Brand */}
        <div className="flex items-center gap-3">
          {isAuthenticated && (
            <button
              type="button"
              onClick={toggleSidebar}
              aria-label="Toggle Navigation Sidebar"
              className="p-2 -ml-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 md:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}

          <Link to="/" className="flex items-center gap-3 group">
            <div className="h-9 w-9 rounded-lg bg-sky-600 flex items-center justify-center text-white font-bold text-lg shadow-sm group-hover:bg-sky-700 transition-colors">
              A
            </div>
            <div>
              <span className="font-bold text-lg text-slate-900 tracking-tight">
                Acadlytic
              </span>
              <span className="hidden sm:inline-block ml-2 text-xs font-medium px-2 py-0.5 bg-sky-100 text-sky-800 rounded">
                MVP v1.0
              </span>
            </div>
          </Link>
        </div>

        {/* Center: Quick navigation links */}
        <nav className="hidden md:flex items-center gap-1">
          <Link
            to="/"
            className="text-sm font-medium text-slate-600 hover:text-sky-600 px-3 py-2 rounded-md hover:bg-slate-100 transition-colors flex items-center gap-1.5"
          >
            <LayoutDashboard className="h-4 w-4" />
            Home
          </Link>
          <Link
            to="/health"
            className="text-sm font-medium text-slate-600 hover:text-sky-600 px-3 py-2 rounded-md hover:bg-slate-100 transition-colors flex items-center gap-1.5"
          >
            <Activity className="h-4 w-4 text-emerald-600" />
            System Health
          </Link>
        </nav>

        {/* Right: Auth status / Actions */}
        <div className="flex items-center gap-3">
          {isAuthenticated && user ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-sm font-medium text-slate-900 flex items-center justify-end gap-1">
                  {user.role === 'SUPER_ADMIN' ? (
                    <Shield className="h-3.5 w-3.5 text-sky-600" />
                  ) : (
                    <Building2 className="h-3.5 w-3.5 text-indigo-600" />
                  )}
                  {user.firstName} {user.lastName}
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  {user.role} {user.collegeCode ? `(${user.collegeCode})` : ''}
                </span>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                isLoading={logoutMutation.isPending}
                className="gap-1.5 text-slate-700 hover:text-red-700 hover:border-red-200 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/auth/login">
                <Button size="sm" className="gap-1.5">
                  <UserIcon className="h-4 w-4" />
                  Sign In
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
