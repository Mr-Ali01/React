import React, { useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Home,
  FileSpreadsheet,
  PlusSquare,
  History,
  TrendingUp,
  Target,
  Layers,
  Calculator,
  UserCheck,
  BookOpen,
  Bell,
  Settings,
  LogOut,
  X
} from 'lucide-react';
import { notificationService } from '../../services/notificationService';

export const SIDEBAR_ITEMS = [
  { name: 'Dashboard', path: '/student/dashboard', icon: Home },
  { name: 'My Results', path: '/student/results', icon: FileSpreadsheet },
  { name: 'Add Result', path: '/student/add-result', icon: PlusSquare },
  { name: 'Academic History', path: '/student/academic-history', icon: History },
  { name: 'Performance Analytics', path: '/student/analytics', icon: TrendingUp },
  { name: 'Academic Goals', path: '/student/goals', icon: Target },
  { name: 'Backlog Tracker', path: '/student/backlogs', icon: Layers },
  { name: 'Calculation History', path: '/student/calculation-history', icon: Calculator },
  { name: 'Academic Profile', path: '/student/profile', icon: UserCheck },
  { name: 'Resources', path: '/resources', icon: BookOpen },
  { name: 'Notifications', path: '/student/notifications', icon: Bell, badge: 3 },
  { name: 'Settings', path: '/student/settings', icon: Settings },
];

export default function StudentSidebar({
  isCollapsed,
  isMobileOpen,
  onCloseMobile,
  onLogoutRequest
}) {
  const location = useLocation();
  const unreadCount = notificationService.getUnreadCount();

  // Handle ESC key to close mobile sidebar
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isMobileOpen) {
        onCloseMobile();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileOpen, onCloseMobile]);

  // Lock body scroll on mobile open
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
    <div className="flex flex-col h-full justify-between py-4 select-none">
      {/* Navigation List - Exact Order, NO headings */}
      <nav className="space-y-1 px-3" aria-label="Student Sidebar Navigation">
        {SIDEBAR_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || (item.path === '/student/dashboard' && location.pathname === '/student');

          return (
            <div key={item.name} className="relative group">
              <NavLink
                to={item.path}
                onClick={onCloseMobile}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-accent to-[#FF8A1A] text-white shadow-accent shadow-sm'
                    : 'text-text-m hover:text-text-h hover:bg-bg-sec/80 dark:hover:bg-[#15202D]'
                } ${isCollapsed ? 'justify-center px-0' : ''}`}
              >
                <Icon className={`w-4 h-4 shrink-0 transition-transform ${isActive ? 'scale-110 text-white' : 'text-text-m group-hover:text-accent'}`} />
                
                {!isCollapsed && (
                  <span className="truncate">{item.name}</span>
                )}

                {/* Notification Badge */}
                {!isCollapsed && item.badge && unreadCount > 0 && (
                  <span className="ml-auto px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-brandPink text-white">
                    {unreadCount}
                  </span>
                )}

                {/* Collapsed Badge Dot */}
                {isCollapsed && item.badge && unreadCount > 0 && (
                  <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-brandPink ring-2 ring-card" />
                )}
              </NavLink>

              {/* Tooltip for Collapsed Mode */}
              {isCollapsed && (
                <div className="hidden lg:group-hover:flex absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50 px-2.5 py-1 rounded-lg bg-card border border-border shadow-theme text-xs font-semibold text-text-h whitespace-nowrap pointer-events-none items-center gap-1.5">
                  <span>{item.name}</span>
                  {item.badge && unreadCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-brandPink text-white">
                      {unreadCount}
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Logout Button at bottom - exact 13th item */}
      <div className="px-3 pt-3 border-t border-border/80">
        <div className="relative group">
          <button
            onClick={() => {
              if (onCloseMobile) onCloseMobile();
              onLogoutRequest();
            }}
            type="button"
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-brandPink hover:bg-brandPink/10 transition-colors ${
              isCollapsed ? 'justify-center px-0' : ''
            }`}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span>Logout</span>}
          </button>

          {isCollapsed && (
            <div className="hidden lg:group-hover:block absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50 px-2.5 py-1 rounded-lg bg-card border border-border shadow-theme text-xs font-semibold text-brandPink whitespace-nowrap pointer-events-none">
              Logout
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside
        className={`hidden lg:block shrink-0 border-r border-border bg-card/60 dark:bg-[#0B0F17]/95 backdrop-blur-md transition-all duration-300 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto ${
          isCollapsed ? 'w-[72px]' : 'w-60'
        }`}
        aria-label="Desktop Student Sidebar"
      >
        {navContent}
      </aside>

      {/* Mobile Off-Canvas Drawer Overlay */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-xs z-50 lg:hidden transition-opacity duration-300 ${
          isMobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onCloseMobile}
        aria-hidden={!isMobileOpen}
      />

      {/* Mobile Off-Canvas Drawer Container */}
      <div
        className={`fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-card dark:bg-[#0B0F17] z-50 lg:hidden shadow-2xl border-r border-border flex flex-col transition-transform duration-300 ease-out ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile Navigation Menu"
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-4 h-16 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-accent flex items-center justify-center text-white">
              <Home className="w-4 h-4" />
            </div>
            <span className="font-extrabold text-sm text-text-h">
              Student <span className="text-accent">Portal</span>
            </span>
          </div>

          <button
            onClick={onCloseMobile}
            className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-text-light hover:text-text-h"
            aria-label="Close Sidebar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Drawer Navigation */}
        <div className="flex-1 overflow-y-auto">
          {navContent}
        </div>
      </div>
    </>
  );
}
