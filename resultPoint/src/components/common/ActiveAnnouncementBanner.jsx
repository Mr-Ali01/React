import React, { useState, useEffect } from 'react';
import { Megaphone, Bell, ExternalLink, X, Pin, Sparkles, Building2, Flame } from 'lucide-react';
import { Link } from 'react-router-dom';
import { announcementService, ANNOUNCEMENT_UPDATED_EVENT } from '../../services/announcementService';
import { useAuth } from '../../hooks/useAuth';

export default function ActiveAnnouncementBanner({ isPublicOnly = false }) {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [dismissedIds, setDismissedIds] = useState(() => {
    try {
      const stored = sessionStorage.getItem('rp_dismissed_banners');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const loadAnnouncements = () => {
    try {
      if (isPublicOnly) {
        const publicNotices = announcementService.getPublicAnnouncements();
        setAnnouncements(publicNotices.filter((a) => a.isBanner));
      } else {
        const applicable = announcementService.getApplicableAnnouncements(user);
        // Include notices marked as banner or pinned
        setAnnouncements(applicable.filter((a) => a.isBanner || a.isPinned));
      }
    } catch {
      setAnnouncements([]);
    }
  };

  useEffect(() => {
    loadAnnouncements();

    const handleUpdate = () => {
      loadAnnouncements();
    };

    window.addEventListener(ANNOUNCEMENT_UPDATED_EVENT, handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener(ANNOUNCEMENT_UPDATED_EVENT, handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [user, isPublicOnly]);

  const handleDismiss = (id) => {
    const updated = [...dismissedIds, id];
    setDismissedIds(updated);
    try {
      sessionStorage.setItem('rp_dismissed_banners', JSON.stringify(updated));
    } catch {}
  };

  // Filter out dismissed
  const visibleNotices = announcements.filter((a) => !dismissedIds.includes(a.id));

  if (visibleNotices.length === 0) return null;

  return (
    <div className="space-y-2 mb-4">
      {visibleNotices.slice(0, 2).map((notice) => {
        const isUrgent = (notice.priority || '').toLowerCase() === 'urgent';
        const isHigh = (notice.priority || '').toLowerCase() === 'high';

        return (
          <div
            key={notice.id}
            className={`relative overflow-hidden rounded-2xl border p-3.5 sm:p-4 transition-all duration-200 shadow-2xs ${
              isUrgent
                ? 'bg-gradient-to-r from-rose-500/10 via-rose-500/5 to-rose-500/10 border-rose-200 dark:border-rose-900/40'
                : isHigh
                ? 'bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-orange-500/5 border-orange-200 dark:border-orange-900/40'
                : 'bg-gradient-to-r from-blue-500/10 via-indigo-500/5 to-blue-500/10 border-blue-200 dark:border-blue-900/40'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                    isUrgent
                      ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-600'
                      : isHigh
                      ? 'bg-orange-100 dark:bg-orange-950/60 text-[#FF6B00]'
                      : 'bg-blue-100 dark:bg-blue-950/60 text-blue-600'
                  }`}
                >
                  {isUrgent ? (
                    <Flame className="w-5 h-5 fill-rose-500/20" />
                  ) : (
                    <Megaphone className="w-5 h-5" />
                  )}
                </div>

                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                        isUrgent
                          ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-400'
                          : isHigh
                          ? 'bg-orange-100 dark:bg-orange-950/80 text-orange-700 dark:text-orange-400'
                          : 'bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-400'
                      }`}
                    >
                      {notice.category || 'Announcement'}
                    </span>

                    {notice.targetUniversityName && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                        <Building2 className="w-3 h-3 text-[#FF6B00]" />
                        {notice.targetUniversityName}
                      </span>
                    )}

                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                      {notice.title}
                    </h4>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                    {notice.content}
                  </p>

                  {notice.actionLink && (
                    <div className="pt-1">
                      {notice.actionLink.startsWith('http') ? (
                        <a
                          href={notice.actionLink}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-bold text-[#FF6B00] hover:underline"
                        >
                          <span>{notice.actionText || 'Read Official Circular'}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <Link
                          to={notice.actionLink}
                          className="inline-flex items-center gap-1 text-xs font-bold text-[#FF6B00] hover:underline"
                        >
                          <span>{notice.actionText || 'View Details'}</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Dismiss Button */}
              <button
                onClick={() => handleDismiss(notice.id)}
                type="button"
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-colors shrink-0"
                title="Dismiss Notice"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
