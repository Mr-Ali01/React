import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Shield,
  Building2,
  Activity,
  FileText,
  Clock,
  ClipboardCheck,
  ChevronLeft,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useAuthStore } from '@/stores/authStore';
import { useAppStore } from '@/stores/appStore';

export const Sidebar: React.FC = () => {
  const { user, isAuthenticated } = useAuthStore();
  const { sidebarOpen, setSidebarOpen } = useAppStore();

  if (!isAuthenticated || !user) {
    return null;
  }

  const isSuperAdmin = user.role === 'SUPER_ADMIN';
  const isCollegeAdmin = user.role === 'COLLEGE_ADMIN';

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    clsx(
      'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
      isActive
        ? 'bg-sky-600 text-white shadow-sm'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
    );

  return (
    <>
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-slate-200 transform transition-transform duration-200 ease-in-out md:translate-x-0 md:static md:inset-auto',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full justify-between p-4">
          <div className="space-y-6">
            {/* User Profile summary */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
              <div className="truncate">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Signed in as
                </p>
                <p className="text-sm font-medium text-slate-900 truncate">
                  {user.email}
                </p>
                <div className="mt-1 flex items-center gap-1.5">
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-sky-100 text-sky-800">
                    {user.role}
                  </span>
                  {user.collegeApprovalStatus && (
                    <span
                      className={clsx(
                        'inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold',
                        user.collegeApprovalStatus === 'APPROVED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      )}
                    >
                      {user.collegeApprovalStatus}
                    </span>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 md:hidden"
                aria-label="Close sidebar"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            </div>

            {/* Navigation Menus */}
            <nav className="space-y-1">
              <p className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Navigation
              </p>

              <NavLink to="/" end className={navLinkClass}>
                <LayoutDashboard className="h-4 w-4" />
                Home Overview
              </NavLink>

              {isSuperAdmin && (
                <>
                  <NavLink to="/admin/dashboard" className={navLinkClass}>
                    <Shield className="h-4 w-4 text-sky-500" />
                    Super Admin Portal
                  </NavLink>
                  <NavLink to="/admin/colleges/reviews" className={navLinkClass}>
                    <ClipboardCheck className="h-4 w-4 text-amber-500" />
                    Approval Queue
                  </NavLink>
                  <NavLink to="/admin/colleges" className={navLinkClass}>
                    <Building2 className="h-4 w-4 text-indigo-500" />
                    College Directory
                  </NavLink>
                </>
              )}

              {isCollegeAdmin && (
                <>
                  <NavLink to="/college/dashboard" className={navLinkClass}>
                    <Building2 className="h-4 w-4 text-indigo-500" />
                    College Dashboard
                  </NavLink>
                  {user.collegeApprovalStatus !== 'APPROVED' && (
                    <NavLink to="/onboarding-status" className={navLinkClass}>
                      <Clock className="h-4 w-4 text-amber-500" />
                      Approval Status
                    </NavLink>
                  )}
                </>
              )}

              <NavLink to="/health" className={navLinkClass}>
                <Activity className="h-4 w-4 text-emerald-500" />
                System Health Check
              </NavLink>
            </nav>

            {/* Post-MVP Architecture Notice */}
            <div className="p-3 bg-slate-50 border border-slate-200/60 rounded-xl text-xs space-y-1 text-slate-500">
              <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                <FileText className="h-3.5 w-3.5 text-sky-600" />
                <span>MVP Boundaries</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Staff & Student portals are designated as Post-MVP extensions.
              </p>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 text-center py-2 border-t border-slate-100">
            Acadlytic Foundation v1.0
          </div>
        </div>
      </aside>
    </>
  );
};
