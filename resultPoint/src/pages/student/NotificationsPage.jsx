import React, { useState } from 'react';
import { Bell, CheckCheck, Trash2 } from 'lucide-react';
import { notificationService } from '../../services/notificationService';
import { useToast } from '../../context/ToastContext';

export default function NotificationsPage() {
  const { showToast } = useToast();
  const [notifications, setNotifications] = useState(() => notificationService.getNotifications());

  const handleMarkAllRead = () => {
    notificationService.markAllAsRead();
    setNotifications(notificationService.getNotifications());
    showToast('All notifications marked as read.');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between pb-2 border-b border-border/80">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-text-h tracking-tight flex items-center gap-2.5">
            <Bell className="w-6 h-6 text-brandPink" />
            <span>Notifications</span>
          </h1>
          <p className="text-xs sm:text-[13px] text-text-light mt-0.5">
            Academic exam announcements, goal achievements, and grade alerts.
          </p>
        </div>

        <button
          onClick={handleMarkAllRead}
          type="button"
          className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-accent hover:bg-accent/10 border border-accent/30 flex items-center gap-1.5 transition-colors"
        >
          <CheckCheck className="w-4 h-4" />
          <span>Mark all as read</span>
        </button>
      </div>

      <div className="space-y-3">
        {notifications.map((n) => (
          <div
            key={n.id}
            className={`p-4 rounded-2xl border transition-all ${
              n.unread ? 'bg-card border-accent/40 shadow-subtle' : 'bg-card/70 border-border'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-text-h">{n.title}</h3>
                  {n.unread && (
                    <span className="w-2 h-2 rounded-full bg-accent" />
                  )}
                </div>
                <p className="text-xs text-text-m mt-1 leading-relaxed">{n.message}</p>
              </div>
              <span className="text-[11px] text-text-light whitespace-nowrap">{n.time}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
