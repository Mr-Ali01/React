import React from 'react';
import {
  X,
  Bell,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Target,
  TrendingUp,
  User,
  ArrowRight,
  Trash2,
  Check
} from 'lucide-react';
import { NOTIFICATION_CATEGORIES, notificationService } from '../../../services/notificationService.js';

export default function NotificationDetailModal({
  notification,
  isOpen,
  onClose,
  onActionClick,
  onMarkRead,
  onMarkUnread,
  onDelete
}) {
  if (!isOpen || !notification) return null;

  let Icon = Bell;
  let iconColor = 'text-[#FF6B00] bg-[#FF6B00]/10 border-[#FF6B00]/25';

  if (notification.category === NOTIFICATION_CATEGORIES.RESULT) {
    Icon = FileText;
    iconColor = 'text-purple-400 bg-purple-500/10 border-purple-500/25';
  } else if (notification.category === NOTIFICATION_CATEGORIES.GOAL) {
    Icon = Target;
    iconColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25';
  } else if (notification.category === NOTIFICATION_CATEGORIES.BACKLOG) {
    Icon = notification.iconType === 'backlog_cleared' ? CheckCircle2 : AlertTriangle;
    iconColor = notification.iconType === 'backlog_cleared'
      ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25'
      : 'text-rose-400 bg-rose-500/10 border-rose-500/25';
  } else if (notification.category === NOTIFICATION_CATEGORIES.ACADEMIC_UPDATE) {
    Icon = Calendar;
    iconColor = 'text-[#38BDF8] bg-[#38BDF8]/10 border-[#38BDF8]/25';
  } else if (notification.category === NOTIFICATION_CATEGORIES.SYSTEM) {
    Icon = notification.iconType === 'profile_complete' ? User : TrendingUp;
    iconColor = 'text-[#38BDF8] bg-[#38BDF8]/10 border-[#38BDF8]/25';
  }

  const exactDate = notification.createdAt
    ? new Date(notification.createdAt).toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short'
      })
    : 'Unknown date';

  const relativeTime = notificationService.formatRelativeTime(notification.createdAt);

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-scaleUp">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3.5">
            <div className={`w-11 h-11 rounded-xl border flex items-center justify-center flex-shrink-0 mt-0.5 ${iconColor}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-bold text-text-h tracking-tight">
                  {notification.title}
                </h3>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-600 dark:text-[#38BDF8] border border-sky-500/20">
                  {notification.categoryLabel || notification.category}
                </span>
              </div>
              <p className="text-xs text-text-light mt-0.5">
                {exactDate} • <span className="text-[#FF6B00]">{relativeTime}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-bg-sec hover:bg-border text-text-light hover:text-text-h flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Message Box */}
        <div className="p-4 bg-bg-sec rounded-xl border border-border text-xs leading-relaxed text-text-m space-y-2">
          <p>{notification.message}</p>

          {notification.metadata && Object.keys(notification.metadata).length > 0 && (
            <div className="pt-2 mt-2 border-t border-border grid grid-cols-2 gap-2 text-[11px] text-text-light">
              {Object.entries(notification.metadata).map(([key, val]) => (
                <div key={key}>
                  <span className="uppercase text-[9px] font-bold tracking-wider block text-text-light/75">
                    {key}
                  </span>
                  <span className="font-semibold text-text-h">
                    {String(val)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Row */}
        <div className="flex items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={() => {
              onDelete(notification.id);
              onClose();
            }}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-500 hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/30 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>

          <div className="flex items-center gap-2">
            {notification.unread ? (
              <button
                type="button"
                onClick={() => onMarkRead(notification.id)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-text-m hover:text-text-h bg-bg-sec hover:bg-border border border-border flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span>Mark as Read</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onMarkUnread(notification.id)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-text-m hover:text-text-h bg-bg-sec hover:bg-border border border-border flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <span className="w-2 h-2 rounded-full bg-[#FF6B00]" />
                <span>Mark as Unread</span>
              </button>
            )}

            {notification.action && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onActionClick(notification);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#FF6B00] hover:bg-[#E05D00] shadow-md shadow-[#FF6B00]/25 flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
              >
                <span>{notification.action.label || 'View'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
