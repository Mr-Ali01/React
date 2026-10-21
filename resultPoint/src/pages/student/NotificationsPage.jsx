import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  Check,
  Trash2,
  RotateCcw,
  Search,
  Sparkles,
  Inbox
} from 'lucide-react';
import { useAppDispatch } from '../../hooks/useAppDispatch.js';
import { useAppSelector } from '../../hooks/useAppSelector.js';
import {
  fetchNotifications,
  markAllNotificationsRead,
  markSingleNotificationRead,
  markSingleNotificationUnread,
  deleteNotificationAction,
  restoreNotificationAction,
  permanentlyDeleteNotificationAction,
  clearAllDeletedAction,
  setActiveFilter,
  setSearchQuery,
  setSortBy,
  setSelectedNotification,
  clearSelectedNotification,
  selectNotifications,
  selectDeletedNotifications,
  selectFilteredNotifications,
  selectNotificationCounts,
  selectUnreadNotificationsCount,
  selectActiveFilter,
  selectSearchQuery,
  selectSortBy,
  selectSelectedNotification,
  selectNotificationsLoading
} from '../../features/notifications/notificationSlice.js';
import { useToast } from '../../context/ToastContext.jsx';

import NotificationSummaryCards from '../../features/notifications/components/NotificationSummaryCards.jsx';
import NotificationFilters from '../../features/notifications/components/NotificationFilters.jsx';
import NotificationCard from '../../features/notifications/components/NotificationCard.jsx';
import NotificationDetailModal from '../../features/notifications/components/NotificationDetailModal.jsx';

export default function NotificationsPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { showToast } = useToast();

  const notifications = useAppSelector(selectNotifications);
  const filteredNotifications = useAppSelector(selectFilteredNotifications);
  const counts = useAppSelector(selectNotificationCounts);
  const unreadCount = useAppSelector(selectUnreadNotificationsCount);
  const activeFilter = useAppSelector(selectActiveFilter);
  const searchQuery = useAppSelector(selectSearchQuery);
  const sortBy = useAppSelector(selectSortBy);
  const selectedNotification = useAppSelector(selectSelectedNotification);
  const isLoading = useAppSelector(selectNotificationsLoading);

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Sync notifications on mount and on storage events
  useEffect(() => {
    dispatch(fetchNotifications());

    const handleSync = () => {
      dispatch(fetchNotifications());
    };

    window.addEventListener('notifications_data_updated', handleSync);
    window.addEventListener('storage', handleSync);

    return () => {
      window.removeEventListener('notifications_data_updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, [dispatch]);

  // Mark all as read
  const handleMarkAllRead = async () => {
    if (unreadCount === 0) {
      showToast('All notifications are already marked as read.', 'info');
      return;
    }
    await dispatch(markAllNotificationsRead()).unwrap();
    showToast('All notifications marked as read.');
  };

  // Mark single read/unread
  const handleMarkRead = (id) => {
    dispatch(markSingleNotificationRead(id));
  };

  const handleMarkUnread = (id) => {
    dispatch(markSingleNotificationUnread(id));
    showToast('Marked as unread.');
  };

  // Delete / Archive to trash
  const handleDelete = (id) => {
    dispatch(deleteNotificationAction(id));
    showToast('Notification moved to trash.');
  };

  // Restore from trash
  const handleRestore = (id) => {
    dispatch(restoreNotificationAction(id));
    showToast('Notification restored.');
  };

  // Permanent Delete
  const handlePermanentDelete = (id) => {
    dispatch(permanentlyDeleteNotificationAction(id));
    showToast('Notification permanently deleted.');
  };

  // Clear all trash
  const handleClearTrash = () => {
    if (counts.deleted === 0) return;
    if (window.confirm('Permanently delete all notifications in trash? This cannot be undone.')) {
      dispatch(clearAllDeletedAction());
      showToast('Trash cleared.');
    }
  };

  // View details
  const handleViewDetails = (notification) => {
    dispatch(setSelectedNotification(notification));
    setIsDetailModalOpen(true);
    if (notification.unread) {
      dispatch(markSingleNotificationRead(notification.id));
    }
  };

  // Contextual action button click (e.g. "View Result ->")
  const handleActionClick = (notification) => {
    if (notification.unread) {
      dispatch(markSingleNotificationRead(notification.id));
    }

    if (notification.action) {
      if (notification.action.isModal) {
        handleViewDetails(notification);
        return;
      }

      if (notification.action.route) {
        navigate(notification.action.route, { state: notification.action.params || {} });
      }
    }
  };

  const isDeletedView = activeFilter === 'DELETED';

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 animate-fadeIn">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#FF6B00]/10 border border-[#FF6B00]/25 flex items-center justify-center text-[#FF6B00] flex-shrink-0 mt-0.5 shadow-sm">
            <Bell className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-text-h tracking-tight">
              Notifications
            </h1>
            <p className="text-xs sm:text-sm text-text-light mt-0.5 leading-relaxed">
              Academic updates, results, goals, and important reminders.
            </p>
          </div>
        </div>

        {/* Mark All as Read Button */}
        <button
          type="button"
          onClick={handleMarkAllRead}
          disabled={unreadCount === 0}
          className={`px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer flex-shrink-0 shadow-lg ${
            unreadCount > 0
              ? 'bg-[#FF6B00] hover:bg-[#E05D00] text-white shadow-[#FF6B00]/25 active:scale-95'
              : 'bg-bg-sec border border-border text-text-light cursor-default opacity-60'
          }`}
        >
          <Check className="w-4 h-4 stroke-[3]" />
          <span>Mark all as read</span>
        </button>
      </div>

      {/* 2. Summary Metrics Cards (All, Unread, Read, Deleted) */}
      <NotificationSummaryCards
        counts={counts}
        activeFilter={activeFilter}
        onSelectFilter={(filterKey) => dispatch(setActiveFilter(filterKey))}
      />

      {/* 3. Filter Bar (All, Unread, Categories, Search, Sort) */}
      <NotificationFilters
        activeFilter={activeFilter}
        onSelectFilter={(filterKey) => dispatch(setActiveFilter(filterKey))}
        searchQuery={searchQuery}
        onSearchChange={(query) => dispatch(setSearchQuery(query))}
        sortBy={sortBy}
        onSortChange={(sortKey) => dispatch(setSortBy(sortKey))}
      />

      {/* 4. Trash Toolbar Header when viewing Deleted Notifications */}
      {isDeletedView && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-rose-300">
            <Trash2 className="w-4 h-4 text-rose-400" />
            <span className="font-semibold">
              Viewing Trash ({counts.deleted} deleted notifications)
            </span>
          </div>

          {counts.deleted > 0 && (
            <button
              type="button"
              onClick={handleClearTrash}
              className="px-3 py-1.5 rounded-lg text-xs font-bold text-rose-400 hover:text-white bg-rose-500/20 hover:bg-rose-500/30 transition-colors cursor-pointer"
            >
              Clear Trash Permanently
            </button>
          )}
        </div>
      )}

      {/* 5. Notification Cards List */}
      <div className="space-y-3">
        {filteredNotifications.length > 0 ? (
          filteredNotifications.map((notification) => (
            <NotificationCard
              key={notification.id}
              notification={notification}
              isDeletedView={isDeletedView}
              onActionClick={handleActionClick}
              onMarkRead={handleMarkRead}
              onMarkUnread={handleMarkUnread}
              onDelete={handleDelete}
              onRestore={handleRestore}
              onPermanentDelete={handlePermanentDelete}
              onViewDetails={handleViewDetails}
            />
          ))
        ) : (
          /* Empty States */
          <div className="bg-card border border-border rounded-2xl p-8 sm:p-12 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-bg-sec border border-border text-text-light flex items-center justify-center mx-auto">
              <Inbox className="w-6 h-6" />
            </div>

            <div className="space-y-1.5 max-w-sm mx-auto">
              <h3 className="text-sm sm:text-base font-bold text-text-h">
                {activeFilter === 'UNREAD'
                  ? 'All Caught Up!'
                  : activeFilter === 'DELETED'
                  ? 'Trash is Empty'
                  : searchQuery
                  ? 'No Matching Notifications'
                  : 'No Notifications in this Category'}
              </h3>
              <p className="text-xs text-text-light leading-relaxed">
                {activeFilter === 'UNREAD'
                  ? 'You have read all your notifications. New academic updates will appear here.'
                  : activeFilter === 'DELETED'
                  ? 'No notifications currently stored in trash.'
                  : searchQuery
                  ? `No notifications found matching "${searchQuery}".`
                  : 'There are currently no notifications under this category filter.'}
              </p>
            </div>

            {(activeFilter !== 'ALL' || searchQuery) && (
              <button
                type="button"
                onClick={() => {
                  dispatch(setActiveFilter('ALL'));
                  dispatch(setSearchQuery(''));
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-text-m hover:text-text-h bg-bg-sec hover:bg-border border border-border inline-flex items-center gap-2 transition-all cursor-pointer"
              >
                <span>View All Notifications</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* 6. Detail View Modal */}
      <NotificationDetailModal
        notification={selectedNotification}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          dispatch(clearSelectedNotification());
        }}
        onActionClick={handleActionClick}
        onMarkRead={handleMarkRead}
        onMarkUnread={handleMarkUnread}
        onDelete={handleDelete}
      />
    </div>
  );
}
