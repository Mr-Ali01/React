import React, { useState, useRef, useEffect } from 'react';
import {
  FileText,
  Target,
  Calendar,
  AlertTriangle,
  TrendingUp,
  User,
  CheckCircle2,
  ArrowRight,
  MoreVertical,
  Check,
  Eye,
  Trash2,
  RotateCcw
} from 'lucide-react';
import { notificationService, NOTIFICATION_CATEGORIES } from '../../../services/notificationService.js';

export default function NotificationCard({
  notification,
  isDeletedView = false,
  onActionClick,
  onMarkRead,
  onMarkUnread,
  onDelete,
  onRestore,
  onPermanentDelete,
  onViewDetails
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Close menu on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Category Icon & Styling determination
  let Icon = FileText;
  let iconWrapperClass = 'bg-purple-500/10 border-purple-500/25 text-purple-600 dark:text-purple-400';

  if (notification.iconType === 'goal_progress' || notification.category === NOTIFICATION_CATEGORIES.GOAL) {
    Icon = Target;
    iconWrapperClass = 'bg-emerald-500/10 border-emerald-500/25 text-emerald-600 dark:text-emerald-400';
  } else if (notification.iconType === 'exam_schedule' || notification.category === NOTIFICATION_CATEGORIES.ACADEMIC_UPDATE) {
    Icon = Calendar;
    iconWrapperClass = 'bg-sky-500/10 border-sky-500/25 text-sky-600 dark:text-[#38BDF8]';
  } else if (notification.iconType === 'backlog_alert') {
    Icon = AlertTriangle;
    iconWrapperClass = 'bg-rose-500/10 border-rose-500/25 text-rose-500 dark:text-rose-400';
  } else if (notification.iconType === 'backlog_cleared') {
    Icon = CheckCircle2;
    iconWrapperClass = 'bg-emerald-500/10 border-emerald-500/25 text-emerald-600 dark:text-emerald-400';
  } else if (notification.iconType === 'cgpa_calc') {
    Icon = TrendingUp;
    iconWrapperClass = 'bg-purple-500/10 border-purple-500/25 text-purple-600 dark:text-purple-400';
  } else if (notification.iconType === 'profile_complete') {
    Icon = User;
    iconWrapperClass = 'bg-sky-500/10 border-sky-500/25 text-sky-600 dark:text-[#38BDF8]';
  } else if (notification.iconType === 'result_updated') {
    Icon = FileText;
    iconWrapperClass = 'bg-bg-sec border-border text-text-light';
  }

  // Category Pill Badge determination
  let badgeClass = 'bg-sky-500/10 text-sky-600 dark:text-[#38BDF8] border-sky-500/20';
  if (notification.category === NOTIFICATION_CATEGORIES.GOAL) {
    badgeClass = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
  } else if (notification.category === NOTIFICATION_CATEGORIES.BACKLOG) {
    badgeClass = 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
  } else if (notification.category === NOTIFICATION_CATEGORIES.SYSTEM) {
    badgeClass = 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20';
  }

  const relativeTime = notificationService.formatRelativeTime(notification.createdAt);

  return (
    <div
      className={`p-4 sm:p-5 rounded-2xl bg-card border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
        notification.unread && !isDeletedView
          ? 'border-[#FF6B00] shadow-sm'
          : 'border-border hover:border-slate-300 dark:hover:border-[#2A374A]'
      }`}
    >
      {/* Left: Icon & Text content */}
      <div className="flex items-start gap-3.5 min-w-0 flex-1">
        <div
          className={`w-11 h-11 rounded-xl border flex items-center justify-center flex-shrink-0 mt-0.5 ${iconWrapperClass}`}
        >
          <Icon className="w-5 h-5" />
        </div>

        <div className="space-y-1 min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            {notification.unread && !isDeletedView && (
              <span className="w-2.5 h-2.5 rounded-full bg-[#FF6B00] inline-block flex-shrink-0" />
            )}
            <h3 className="text-sm font-bold text-text-h tracking-tight truncate">
              {notification.title}
            </h3>
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${badgeClass}`}
            >
              {notification.categoryLabel || notification.category}
            </span>
          </div>

          <p className="text-xs text-text-m leading-relaxed line-clamp-2">
            {notification.message}
          </p>
        </div>
      </div>

      {/* Right: Timestamp, Action button, and 3-dot Menu */}
      <div className="flex items-center justify-between md:justify-end gap-3.5 flex-shrink-0 self-stretch md:self-auto pt-2 md:pt-0 border-t md:border-t-0 border-border/60">
        <span className="text-xs text-text-light whitespace-nowrap">
          {relativeTime}
        </span>

        <div className="flex items-center gap-2">
          {/* Action button */}
          {!isDeletedView && notification.action && (
            <button
              type="button"
              onClick={() => onActionClick(notification)}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-[#FF6B00] hover:text-white bg-transparent hover:bg-[#FF6B00] border border-[#FF6B00]/40 hover:border-[#FF6B00] flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap active:scale-95"
            >
              <span>{notification.action.label || 'View'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          {isDeletedView && (
            <button
              type="button"
              onClick={() => onRestore(notification.id)}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restore</span>
            </button>
          )}

          {/* Three-dot context menu */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setIsMenuOpen((prev) => !prev)}
              aria-label="Notification actions"
              className="w-8 h-8 rounded-lg bg-bg-sec hover:bg-border text-text-light hover:text-text-h flex items-center justify-center transition-colors cursor-pointer"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-48 bg-card border border-border rounded-xl shadow-2xl py-1.5 z-40 animate-scaleUp">
                {!isDeletedView && (
                  <>
                    {notification.unread ? (
                      <button
                        type="button"
                        onClick={() => {
                          onMarkRead(notification.id);
                          setIsMenuOpen(false);
                        }}
                        className="w-full px-3 py-2 text-xs font-medium text-left flex items-center gap-2 text-text-m hover:text-text-h hover:bg-bg-sec transition-colors cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Mark as Read</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          onMarkUnread(notification.id);
                          setIsMenuOpen(false);
                        }}
                        className="w-full px-3 py-2 text-xs font-medium text-left flex items-center gap-2 text-text-m hover:text-text-h hover:bg-bg-sec transition-colors cursor-pointer"
                      >
                        <span className="w-2.5 h-2.5 rounded-full bg-[#FF6B00]" />
                        <span>Mark as Unread</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        onViewDetails(notification);
                        setIsMenuOpen(false);
                      }}
                      className="w-full px-3 py-2 text-xs font-medium text-left flex items-center gap-2 text-text-m hover:text-text-h hover:bg-bg-sec transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-sky-500" />
                      <span>View Details</span>
                    </button>

                    <div className="my-1 border-t border-border" />

                    <button
                      type="button"
                      onClick={() => {
                        onDelete(notification.id);
                        setIsMenuOpen(false);
                      }}
                      className="w-full px-3 py-2 text-xs font-medium text-left flex items-center gap-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Notification</span>
                    </button>
                  </>
                )}

                {isDeletedView && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        onRestore(notification.id);
                        setIsMenuOpen(false);
                      }}
                      className="w-full px-3 py-2 text-xs font-medium text-left flex items-center gap-2 text-emerald-400 hover:bg-emerald-500/10 transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Restore to Active</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onPermanentDelete(notification.id);
                        setIsMenuOpen(false);
                      }}
                      className="w-full px-3 py-2 text-xs font-medium text-left flex items-center gap-2 text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Permanently Delete</span>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
