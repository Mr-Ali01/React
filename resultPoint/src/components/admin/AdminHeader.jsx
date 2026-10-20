import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Menu,
  Search,
  Bell,
  Sun,
  Moon,
  ChevronDown,
  User,
  Settings,
  Activity,
  LogOut,
  X,
  Check
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { authService } from '../../services/authService';

export default function AdminHeader({
  onToggleSidebar,
  searchQuery,
  onSearchChange,
  onLogoutRequest
}) {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);

  const profileRef = useRef(null);
  const notifRef = useRef(null);

  const user = authService.getCurrentUser() || { fullName: 'Admin' };

  // Sample Admin Notifications
  const [notifications, setNotifications] = useState([
    { id: 1, text: 'New student registration: Ayesha Khan', time: '10m ago', unread: true },
    { id: 2, text: 'AP Grading System rule updated', time: '3h ago', unread: true },
    { id: 3, text: '12 new support queries awaiting review', time: '4h ago', unread: true },
    { id: 4, text: 'Monthly backup completed successfully', time: '1d ago', unread: false },
    { id: 5, text: 'Kakatiya University catalog published', time: '1d ago', unread: false }
  ]);

  const unreadCount = notifications.filter((n) => n.unread).length;

  // Handle clicking outside to close dropdowns
  useEffect(() => {
    function handleClickOutside(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAllRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, unread: false })));
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchQuery?.trim()) return;
    // Route to users or tools if query matches
    navigate(`/admin/users?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white dark:bg-[#111418] border-b border-slate-200/80 dark:border-[#1E2A35] px-4 sm:px-6 flex items-center justify-between gap-4 transition-colors">
      {/* Left Area: Hamburger & Search Bar */}
      <div className="flex items-center gap-3 sm:gap-4 flex-1 max-w-2xl">
        <button
          onClick={onToggleSidebar}
          type="button"
          aria-label="Toggle Sidebar"
          className="w-9 h-9 rounded-xl border border-slate-200 dark:border-[#1E2A35] bg-slate-50/60 dark:bg-[#0D141F] flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-[#FF6B00] hover:border-[#FF6B00]/40 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Search Field */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery || ''}
            onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
            placeholder="Search users, universities, courses, tools..."
            className="w-full pl-9 pr-3.5 py-2 rounded-xl text-xs sm:text-[13px] bg-slate-50/70 dark:bg-[#0D141F] border border-slate-200 dark:border-[#1E2A35] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00]/20 transition-all"
          />
        </form>
      </div>

      {/* Right Area: Theme Toggle, Notifications, Admin Profile */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Day/Night Theme Pill Toggle matching image */}
        <button
          onClick={toggleTheme}
          type="button"
          aria-label="Toggle Theme"
          className="flex items-center gap-1.5 p-1 rounded-full bg-slate-100 dark:bg-[#0D141F] border border-slate-200 dark:border-[#1E2A35] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
        >
          <span
            className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
              theme === 'light'
                ? 'bg-white text-amber-500 shadow-xs'
                : 'text-slate-400'
            }`}
          >
            <Sun className="w-3.5 h-3.5" />
          </span>
          <span
            className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
              theme === 'dark'
                ? 'bg-[#1E2A35] text-sky-400 shadow-xs'
                : 'text-slate-400'
            }`}
          >
            <Moon className="w-3.5 h-3.5" />
          </span>
        </button>

        {/* Notifications Bell */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
            type="button"
            aria-label="Notifications"
            className="w-9 h-9 rounded-xl border border-slate-200 dark:border-[#1E2A35] bg-slate-50/60 dark:bg-[#0D141F] flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-[#FF6B00] hover:border-[#FF6B00]/40 transition-colors relative"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {notifDropdownOpen && (
            <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-white dark:bg-[#111418] border border-slate-200 dark:border-[#1E2A35] shadow-xl p-3 z-50 animate-in fade-in zoom-in-95 text-xs">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-[#1E2A35]">
                <span className="font-bold text-slate-900 dark:text-white">Admin Notifications</span>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[11px] text-[#FF6B00] hover:underline font-semibold"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="space-y-1.5 max-h-64 overflow-y-auto">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`p-2 rounded-xl transition-colors ${
                      n.unread
                        ? 'bg-orange-50/60 dark:bg-orange-950/20 text-slate-900 dark:text-white'
                        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-[#0D141F]'
                    }`}
                  >
                    <p className="font-medium">{n.text}</p>
                    <span className="text-[10px] text-slate-400 mt-0.5 block">{n.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Admin Profile Area */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            type="button"
            className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-slate-100/70 dark:hover:bg-[#0D141F] transition-all cursor-pointer"
          >
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=128&q=80"
              alt="Admin Avatar"
              className="w-8 h-8 rounded-full object-cover ring-2 ring-[#FF6B00]/30 shadow-xs"
            />
            <div className="hidden sm:block text-left text-xs">
              <span className="font-bold text-slate-900 dark:text-white block leading-tight">Admin</span>
              <span className="text-[10px] text-slate-400 font-medium block">Platform Owner</span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>

          {/* Profile Dropdown */}
          {profileDropdownOpen && (
            <div className="absolute right-0 mt-2 w-52 rounded-2xl bg-white dark:bg-[#111418] border border-slate-200 dark:border-[#1E2A35] shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 text-xs font-semibold">
              <div className="p-2 border-b border-slate-100 dark:border-[#1E2A35] mb-1">
                <span className="font-bold text-slate-900 dark:text-white block">Platform Admin</span>
                <span className="text-[11px] text-slate-400 font-normal">admin@resultpoint.edu</span>
              </div>

              <Link
                to="/admin/settings"
                onClick={() => setProfileDropdownOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#0D141F] transition-colors"
              >
                <User className="w-4 h-4 text-slate-400" />
                <span>Admin Profile</span>
              </Link>

              <Link
                to="/admin/settings"
                onClick={() => setProfileDropdownOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#0D141F] transition-colors"
              >
                <Settings className="w-4 h-4 text-slate-400" />
                <span>Settings</span>
              </Link>

              <Link
                to="/admin/settings?tab=activity"
                onClick={() => setProfileDropdownOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#0D141F] transition-colors"
              >
                <Activity className="w-4 h-4 text-slate-400" />
                <span>Activity Logs</span>
              </Link>

              <div className="pt-1 border-t border-slate-100 dark:border-[#1E2A35] mt-1">
                <button
                  onClick={() => {
                    setProfileDropdownOpen(false);
                    onLogoutRequest && onLogoutRequest();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors text-left"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
