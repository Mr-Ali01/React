import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Menu,
  GraduationCap,
  Sun,
  Moon,
  Bell,
  ChevronDown,
  User,
  Settings,
  LogOut
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { studentService } from '../../services/studentService';
import { notificationService } from '../../services/notificationService';
import { academicCatalogService } from '../../services/academicCatalogService';
import { useAppSelector } from '../../hooks/useAppSelector';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { selectUserProfile } from '../../features/user/userSlice';
import { selectAcademicProfile } from '../../features/academicProfile/academicProfileSlice';
import {
  selectNotifications,
  selectUnreadNotificationsCount,
  markAllNotificationsRead,
} from '../../features/notifications/notificationSlice';

function getShortCourse(student) {
  if (!student) return '';
  if (student.courseShortName) return student.courseShortName;
  if (student.universityId && student.courseId) {
    const course = academicCatalogService.getCourse(student.universityId, student.courseId);
    if (course?.shortName) return course.shortName;
  }
  if (student.course) {
    const clean = student.course.split(/[—–-]/)[0].trim();
    if (clean) return clean;
  }
  return student.courseId ? student.courseId.toUpperCase() : '';
}

function getUnivAbbr(student) {
  if (!student) return '';
  if (student.universityAbbr || student.universityShortName) {
    return student.universityAbbr || student.universityShortName;
  }
  if (student.universityId) {
    const univ = academicCatalogService.getUniversityById(student.universityId);
    if (univ?.shortName) return univ.shortName;
  }
  if (student.university) {
    if (/osmania/i.test(student.university)) return 'OU';
    if (/jawaharlal|jntuh/i.test(student.university)) return 'JNTUH';
    if (/hyderabad/i.test(student.university)) return 'UoH';
    if (student.university.length <= 6 && student.university === student.university.toUpperCase()) {
      return student.university;
    }
    const words = student.university.replace(/university/i, '').trim().split(/\s+/);
    const acronym = words.map((w) => w[0]).join('').toUpperCase() + 'U';
    return acronym || student.university;
  }
  return student.universityId ? student.universityId.toUpperCase() : '';
}

export default function StudentHeader({ onToggleSidebar, onLogoutRequest }) {
  const dispatch = useAppDispatch();
  const { theme, toggleTheme } = useTheme();
  const { showToast } = useToast();

  const reduxProfile = useAppSelector(selectUserProfile);
  const reduxAcademicProfile = useAppSelector(selectAcademicProfile);
  const reduxNotifications = useAppSelector(selectNotifications);
  const reduxUnreadCount = useAppSelector(selectUnreadNotificationsCount);

  const student = {
    ...studentService.getProfile(),
    ...(reduxProfile || {}),
    ...(reduxAcademicProfile || {}),
  };

  const notifications = reduxNotifications && reduxNotifications.length > 0
    ? reduxNotifications
    : notificationService.getNotifications();
  const unreadCount = reduxUnreadCount ?? notificationService.getUnreadCount();

  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const notifRef = useRef(null);
  const profileRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotifDropdownOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAllRead = () => {
    dispatch(markAllNotificationsRead());
    showToast('All notifications marked as read.');
  };

  const username = student.username || student.fullName || 'Student';
  const shortCourse = getShortCourse(student);
  const univAbbr = getUnivAbbr(student);
  const profileSubtitle = shortCourse && univAbbr ? `${shortCourse} • ${univAbbr}` : (shortCourse || univAbbr || 'Student');

  return (
    <header className="sticky top-0 z-40 w-full bg-card/90 dark:bg-[#0D141F]/90 backdrop-blur-md border-b border-border transition-colors">
      <div className="px-3 sm:px-6 h-16 flex items-center justify-between gap-2 sm:gap-4">

        {/* Left: Hamburger & Logo (Clicking logo or brand navigates to public home page) */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <Link
            to="/"
            id="student-header-logo-link"
            className="flex items-center gap-2.5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-xl cursor-pointer"
            aria-label="ResultPoint Home"
            title="Navigate to ResultPoint Public Homepage"
          >
            <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center text-white shadow-accent transition-transform duration-300 group-hover:scale-105 shrink-0">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-[17px] font-extrabold tracking-tight text-text-h leading-none">
                Result<span className="text-accent">Point</span>
              </span>
              <span className="text-[9.5px] font-medium tracking-tight text-text-light mt-0.5">
                Calculate. Analyze. Improve.
              </span>
            </div>
          </Link>
          <button
            onClick={onToggleSidebar}
            type="button"
            aria-label="Toggle Navigation Sidebar"
            className="w-9 h-9 rounded-xl border border-border bg-card hover:bg-bg-sec flex items-center justify-center text-text-h hover:text-accent transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <Menu className="w-4 h-4" />
          </button>
        </div>

        {/* Center: Search input removed as requested */}
        <div className="flex-1" />

        {/* Right: Actions & User Info */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            type="button"
            aria-label="Toggle Theme"
            className="w-9 h-9 rounded-xl border border-border bg-card flex items-center justify-center text-text-m hover:text-accent hover:border-accent/40 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-accent" /> : <Moon className="w-4 h-4 text-accent" />}
          </button>

          {/* Notification Bell */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
              type="button"
              aria-label="View notifications"
              className="w-9 h-9 rounded-xl border border-border bg-card flex items-center justify-center text-text-m hover:text-accent hover:border-accent/40 relative transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-brandPink text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {notifDropdownOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-card border border-border p-3 shadow-theme z-50 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-border/80">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-text-h">Notifications</span>
                    {unreadCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-accent/10 text-accent">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-[11px] font-semibold text-accent hover:underline"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>

                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-2.5 rounded-xl border transition-colors ${n.unread ? 'bg-accent-soft/40 border-accent/30' : 'bg-bg border-border/60'
                        }`}
                    >
                      <div className="flex items-start justify-between gap-1">
                        <span className="text-xs font-bold text-text-h">{n.title}</span>
                        <span className="text-[10px] text-text-light whitespace-nowrap">{n.time}</span>
                      </div>
                      <p className="text-[11px] text-text-m mt-1 leading-snug">{n.message}</p>
                    </div>
                  ))}
                </div>

                <div className="pt-2 mt-2 border-t border-border/80 text-center">
                  <Link
                    to="/student/notifications"
                    onClick={() => setNotifDropdownOpen(false)}
                    className="text-xs font-semibold text-accent hover:underline"
                  >
                    View All Notifications →
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Student Profile Pill / Trigger */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              type="button"
              className="flex items-center gap-2 sm:gap-2.5 p-1 sm:pr-2.5 rounded-xl border border-border bg-card hover:bg-bg-sec hover:border-accent/40 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <img
                src={student.avatar}
                alt={username}
                className="w-8 h-8 rounded-lg object-cover ring-2 ring-accent/30 shrink-0"
              />
              <div className="hidden md:flex flex-col text-left">
                <span className="text-xs font-bold text-text-h leading-none">
                  {username}
                </span>
                <span className="text-[10px] font-medium text-text-light mt-0.5">
                  {profileSubtitle}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-text-light hidden md:block" />
            </button>

            {/* Profile Dropdown */}
            {profileDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-card border border-border p-2 shadow-theme z-50 animate-in fade-in zoom-in-95">
                <div className="px-3 py-2 border-b border-border/80 mb-1">
                  <p className="text-xs font-bold text-text-h">{username}</p>
                  <p className="text-[11px] text-text-light truncate">{student.email}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded text-[9.5px] font-bold bg-accent/10 text-accent">
                    {profileSubtitle} • Sem {student.currentSemester || 1}
                  </span>
                </div>

                <Link
                  to="/student/profile"
                  onClick={() => setProfileDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-text-m hover:text-accent hover:bg-bg-sec transition-colors"
                >
                  <User className="w-4 h-4 text-accent" />
                  <span>Academic Profile</span>
                </Link>

                <Link
                  to="/student/settings"
                  onClick={() => setProfileDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-text-m hover:text-accent hover:bg-bg-sec transition-colors"
                >
                  <Settings className="w-4 h-4 text-brandBlue" />
                  <span>Settings</span>
                </Link>

                <div className="my-1 border-t border-border/80" />

                <button
                  onClick={() => {
                    setProfileDropdownOpen(false);
                    onLogoutRequest();
                  }}
                  type="button"
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-brandPink hover:bg-brandPink/10 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>

        </div>

      </div>
    </header>
  );
}
