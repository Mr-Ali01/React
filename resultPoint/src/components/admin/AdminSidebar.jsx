import React, { useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Building2,
  BookOpen,
  FileSpreadsheet,
  TableProperties,
  Award,
  Sliders,
  Wrench,
  FolderOpen,
  Newspaper,
  Bell,
  BarChart2,
  MessageSquare,
  Settings,
  X,
  GraduationCap
} from 'lucide-react';

import { contactService } from '../../services/contactService';

export const ADMIN_NAV_ITEMS = [
  { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Users Management', path: '/admin/users', icon: Users },
  { name: 'Universities Management', path: '/admin/universities', icon: Building2 },
  { name: 'Courses Management', path: '/admin/courses', icon: BookOpen },
  { name: 'Regulations Management', path: '/admin/regulations', icon: FileSpreadsheet },
  { name: 'Subjects & Credits', path: '/admin/subjects', icon: TableProperties },
  { name: 'Grading Rules', path: '/admin/grading-rules', icon: Award },
  { name: 'Calculation Rules', path: '/admin/calculation-rules', icon: Sliders },
  { name: 'Tools Management', path: '/admin/tools', icon: Wrench },
  { name: 'Resources Management', path: '/admin/resources', icon: FolderOpen },
  { name: 'Blog Management', path: '/admin/blogs', icon: Newspaper },
  { name: 'Announcements', path: '/admin/announcements', icon: Bell },
  { name: 'Reports & Analytics', path: '/admin/reports', icon: BarChart2 },
  { name: 'Support Queries', path: '/admin/support', icon: MessageSquare, badgeKey: 'support' },
  { name: 'Settings & Activity Logs', path: '/admin/settings', icon: Settings }
];

export default function AdminSidebar({
  isCollapsed,
  isMobileOpen,
  onCloseMobile
}) {
  const location = useLocation();

  const [openSupportCount, React_setOpenSupportCount] = React.useState(() => {
    try {
      return contactService.getAllQueries().filter((q) => (q.status || 'open').toLowerCase() === 'open').length;
    } catch {
      return 0;
    }
  });

  React.useEffect(() => {
    const handleUpdate = () => {
      try {
        React_setOpenSupportCount(
          contactService.getAllQueries().filter((q) => (q.status || 'open').toLowerCase() === 'open').length
        );
      } catch {
        React_setOpenSupportCount(0);
      }
    };

    window.addEventListener('storage', handleUpdate);
    window.addEventListener('focus', handleUpdate);

    return () => {
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('focus', handleUpdate);
    };
  }, []);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isMobileOpen) {
        onCloseMobile();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileOpen, onCloseMobile]);

  // Lock body scroll on mobile drawer
  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileOpen]);

  const navContent = (
    <div className="flex flex-col h-full bg-[#0B111E] text-slate-300 select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-4 border-b border-slate-800/80 shrink-0">
        <NavLink
          to="/admin/dashboard"
          className="flex items-center gap-3 overflow-hidden group focus:outline-none"
        >
          <div className="w-9 h-9 rounded-xl bg-[#FF6B00] flex items-center justify-center text-white shrink-0 shadow-sm transition-transform group-hover:scale-105">
            <GraduationCap className="w-5 h-5 stroke-[2.2]" />
          </div>

          {!isCollapsed && (
            <div className="flex flex-col min-w-0 transition-opacity duration-200">
              <span className="font-extrabold text-base text-white tracking-tight leading-tight">
                Result<span className="text-[#FF6B00]">Point</span>
              </span>
              <span className="text-[10px] text-slate-400 font-medium tracking-tight truncate">
                Calculate. Analyze. Improve.
              </span>
            </div>
          )}
        </NavLink>
      </div>

      {/* Admin Panel Section Label */}
      <div className="px-4 pt-4 pb-2">
        {!isCollapsed ? (
          <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase flex items-center gap-1.5">
            <span className="text-xs">⚙</span> ADMIN PANEL
          </span>
        ) : (
          <div className="w-full flex justify-center text-slate-500 text-xs">
            ⚙
          </div>
        )}
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto custom-scrollbar pb-6" aria-label="Admin Navigation">
        {ADMIN_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          // Determine if current route matches this item
          const isActive =
            location.pathname === item.path ||
            (item.path === '/admin/dashboard' && (location.pathname === '/admin' || location.pathname === '/admin/'));

          const effectiveBadge = item.badgeKey === 'support' ? (openSupportCount > 0 ? openSupportCount : null) : item.badge;

          return (
            <div key={item.name} className="relative group">
              <NavLink
                to={item.path}
                onClick={() => {
                  if (onCloseMobile) onCloseMobile();
                }}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-[#FF6B00] text-white shadow-sm font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                } ${isCollapsed ? 'justify-center px-0' : ''}`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 transition-transform ${
                    isActive ? 'scale-110 text-white' : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                />

                {!isCollapsed && (
                  <span className="truncate flex-1">{item.name}</span>
                )}

                {!isCollapsed && effectiveBadge && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500 text-white leading-none">
                    {effectiveBadge}
                  </span>
                )}
              </NavLink>

              {/* Tooltip when collapsed */}
              {isCollapsed && (
                <div className="hidden lg:group-hover:flex items-center gap-1.5 absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 shadow-xl text-xs font-semibold text-white whitespace-nowrap pointer-events-none">
                  <span>{item.name}</span>
                  {effectiveBadge && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-500 text-white">
                      {effectiveBadge}
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside
        className={`hidden lg:block shrink-0 bg-[#0B111E] border-r border-slate-800/80 transition-all duration-300 sticky top-0 h-screen overflow-hidden z-40 ${
          isCollapsed ? 'w-[72px]' : 'w-[238px]'
        }`}
        aria-label="Desktop Admin Sidebar"
      >
        {navContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-xs z-50 lg:hidden transition-opacity duration-300 ${
          isMobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onCloseMobile}
        aria-hidden={!isMobileOpen}
      />

      {/* Mobile Off-Canvas Drawer */}
      <div
        className={`fixed inset-y-0 left-0 w-[260px] max-w-[85vw] bg-[#0B111E] z-50 lg:hidden shadow-2xl border-r border-slate-800 flex flex-col transition-transform duration-300 ease-out ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile Admin Navigation"
      >
        {/* Mobile Close Button in Header */}
        <div className="absolute top-4 right-3 z-10">
          <button
            onClick={onCloseMobile}
            className="w-8 h-8 rounded-lg bg-slate-800/80 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
            aria-label="Close Sidebar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {navContent}
        </div>
      </div>
    </>
  );
}
