import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { notificationService, NOTIFICATION_CATEGORIES } from '../../services/notificationService.js';

const getInitialData = () => {
  try {
    const notifications = notificationService.getNotifications();
    const deleted = notificationService.getDeletedNotifications();
    const counts = notificationService.getCounts();
    return { notifications, deleted, counts };
  } catch {
    return {
      notifications: [],
      deleted: [],
      counts: { all: 0, unread: 0, read: 0, deleted: 0 }
    };
  }
};

const initialData = getInitialData();

const initialState = {
  notifications: initialData.notifications,
  deletedNotifications: initialData.deleted,
  counts: initialData.counts,
  unreadCount: initialData.counts.unread,
  activeFilter: 'ALL', // 'ALL' | 'UNREAD' | 'RESULT' | 'GOAL' | 'BACKLOG' | 'ACADEMIC_UPDATE' | 'SYSTEM' | 'DELETED'
  searchQuery: '',
  sortBy: 'newest', // 'newest' | 'oldest' | 'unread_first'
  selectedNotification: null,
  loading: false,
  error: null
};

export const fetchNotifications = createAsyncThunk(
  'notifications/fetchNotifications',
  async (_, { rejectWithValue }) => {
    try {
      const notifications = notificationService.getNotifications();
      const deleted = notificationService.getDeletedNotifications();
      const counts = notificationService.getCounts();
      return { notifications, deleted, counts };
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to fetch notifications');
    }
  }
);

export const markAllNotificationsRead = createAsyncThunk(
  'notifications/markAllNotificationsRead',
  async (_, { rejectWithValue }) => {
    try {
      const updated = notificationService.markAllAsRead();
      const counts = notificationService.getCounts();
      return { notifications: updated, counts };
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to mark all as read');
    }
  }
);

export const markSingleNotificationRead = createAsyncThunk(
  'notifications/markSingleNotificationRead',
  async (id, { rejectWithValue }) => {
    try {
      const updated = notificationService.markAsRead(id);
      const counts = notificationService.getCounts();
      return { id, notifications: updated, counts };
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to mark notification as read');
    }
  }
);

export const markSingleNotificationUnread = createAsyncThunk(
  'notifications/markSingleNotificationUnread',
  async (id, { rejectWithValue }) => {
    try {
      const updated = notificationService.markAsUnread(id);
      const counts = notificationService.getCounts();
      return { id, notifications: updated, counts };
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to mark notification as unread');
    }
  }
);

export const deleteNotificationAction = createAsyncThunk(
  'notifications/deleteNotificationAction',
  async (id, { rejectWithValue }) => {
    try {
      const updated = notificationService.deleteNotification(id);
      const deleted = notificationService.getDeletedNotifications();
      const counts = notificationService.getCounts();
      return { id, notifications: updated, deleted, counts };
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to delete notification');
    }
  }
);

export const restoreNotificationAction = createAsyncThunk(
  'notifications/restoreNotificationAction',
  async (id, { rejectWithValue }) => {
    try {
      const updated = notificationService.restoreNotification(id);
      const deleted = notificationService.getDeletedNotifications();
      const counts = notificationService.getCounts();
      return { id, notifications: updated, deleted, counts };
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to restore notification');
    }
  }
);

export const permanentlyDeleteNotificationAction = createAsyncThunk(
  'notifications/permanentlyDeleteNotificationAction',
  async (id, { rejectWithValue }) => {
    try {
      const updated = notificationService.permanentlyDelete(id);
      const deleted = notificationService.getDeletedNotifications();
      const counts = notificationService.getCounts();
      return { id, notifications: updated, deleted, counts };
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to permanently delete notification');
    }
  }
);

export const clearAllDeletedAction = createAsyncThunk(
  'notifications/clearAllDeletedAction',
  async (_, { rejectWithValue }) => {
    try {
      const updated = notificationService.clearAllDeleted();
      const deleted = notificationService.getDeletedNotifications();
      const counts = notificationService.getCounts();
      return { notifications: updated, deleted, counts };
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to clear trash');
    }
  }
);

export const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    setActiveFilter: (state, action) => {
      state.activeFilter = action.payload;
    },
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
    },
    setSortBy: (state, action) => {
      state.sortBy = action.payload;
    },
    setSelectedNotification: (state, action) => {
      state.selectedNotification = action.payload;
    },
    clearSelectedNotification: (state) => {
      state.selectedNotification = null;
    },
    clearNotificationsError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.notifications = action.payload.notifications;
        state.deletedNotifications = action.payload.deleted;
        state.counts = action.payload.counts;
        state.unreadCount = action.payload.counts.unread;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Mark All Read
      .addCase(markAllNotificationsRead.fulfilled, (state, action) => {
        state.notifications = action.payload.notifications;
        state.counts = action.payload.counts;
        state.unreadCount = 0;
      })

      // Mark Single Read
      .addCase(markSingleNotificationRead.fulfilled, (state, action) => {
        state.notifications = action.payload.notifications;
        state.counts = action.payload.counts;
        state.unreadCount = action.payload.counts.unread;
        if (state.selectedNotification?.id === action.payload.id) {
          state.selectedNotification.unread = false;
          state.selectedNotification.readAt = new Date().toISOString();
        }
      })

      // Mark Single Unread
      .addCase(markSingleNotificationUnread.fulfilled, (state, action) => {
        state.notifications = action.payload.notifications;
        state.counts = action.payload.counts;
        state.unreadCount = action.payload.counts.unread;
        if (state.selectedNotification?.id === action.payload.id) {
          state.selectedNotification.unread = true;
          state.selectedNotification.readAt = null;
        }
      })

      // Delete (Archive to Trash)
      .addCase(deleteNotificationAction.fulfilled, (state, action) => {
        state.notifications = action.payload.notifications;
        state.deletedNotifications = action.payload.deleted;
        state.counts = action.payload.counts;
        state.unreadCount = action.payload.counts.unread;
        if (state.selectedNotification?.id === action.payload.id) {
          state.selectedNotification = null;
        }
      })

      // Restore from Trash
      .addCase(restoreNotificationAction.fulfilled, (state, action) => {
        state.notifications = action.payload.notifications;
        state.deletedNotifications = action.payload.deleted;
        state.counts = action.payload.counts;
        state.unreadCount = action.payload.counts.unread;
      })

      // Permanently Delete
      .addCase(permanentlyDeleteNotificationAction.fulfilled, (state, action) => {
        state.notifications = action.payload.notifications;
        state.deletedNotifications = action.payload.deleted;
        state.counts = action.payload.counts;
        state.unreadCount = action.payload.counts.unread;
      })

      // Clear Trash
      .addCase(clearAllDeletedAction.fulfilled, (state, action) => {
        state.notifications = action.payload.notifications;
        state.deletedNotifications = action.payload.deleted;
        state.counts = action.payload.counts;
      });
  }
});

export const {
  setActiveFilter,
  setSearchQuery,
  setSortBy,
  setSelectedNotification,
  clearSelectedNotification,
  clearNotificationsError
} = notificationSlice.actions;

// Selectors
export const selectNotifications = (state) => state.notifications.notifications || [];
export const selectDeletedNotifications = (state) => state.notifications.deletedNotifications || [];
export const selectNotificationCounts = (state) => state.notifications.counts || { all: 0, unread: 0, read: 0, deleted: 0 };
export const selectUnreadNotificationsCount = (state) => state.notifications.unreadCount || 0;
export const selectActiveFilter = (state) => state.notifications.activeFilter || 'ALL';
export const selectSearchQuery = (state) => state.notifications.searchQuery || '';
export const selectSortBy = (state) => state.notifications.sortBy || 'newest';
export const selectSelectedNotification = (state) => state.notifications.selectedNotification || null;
export const selectNotificationsLoading = (state) => state.notifications.loading || false;
export const selectNotificationsError = (state) => state.notifications.error || null;

export const selectFilteredNotifications = (state) => {
  const filter = state.notifications.activeFilter;
  const query = (state.notifications.searchQuery || '').toLowerCase().trim();
  const sort = state.notifications.sortBy;

  let list = filter === 'DELETED'
    ? [...state.notifications.deletedNotifications]
    : [...state.notifications.notifications];

  // 1. Filter by category or read state
  if (filter === 'UNREAD') {
    list = list.filter((n) => n.unread);
  } else if (filter === 'READ') {
    list = list.filter((n) => !n.unread);
  } else if (filter === 'RESULT') {
    list = list.filter((n) => n.category === NOTIFICATION_CATEGORIES.RESULT);
  } else if (filter === 'GOAL') {
    list = list.filter((n) => n.category === NOTIFICATION_CATEGORIES.GOAL);
  } else if (filter === 'BACKLOG') {
    list = list.filter((n) => n.category === NOTIFICATION_CATEGORIES.BACKLOG);
  } else if (filter === 'ACADEMIC_UPDATE') {
    list = list.filter((n) => n.category === NOTIFICATION_CATEGORIES.ACADEMIC_UPDATE);
  } else if (filter === 'SYSTEM') {
    list = list.filter((n) => n.category === NOTIFICATION_CATEGORIES.SYSTEM);
  }

  // 2. Search query filter
  if (query) {
    list = list.filter((n) => {
      const matchTitle = (n.title || '').toLowerCase().includes(query);
      const matchMessage = (n.message || '').toLowerCase().includes(query);
      const matchCategory = (n.categoryLabel || n.category || '').toLowerCase().includes(query);
      return matchTitle || matchMessage || matchCategory;
    });
  }

  // 3. Sorting
  list.sort((a, b) => {
    const timeA = new Date(a.createdAt || 0).getTime();
    const timeB = new Date(b.createdAt || 0).getTime();

    if (sort === 'unread_first') {
      if (a.unread && !b.unread) return -1;
      if (!a.unread && b.unread) return 1;
      return timeB - timeA;
    }

    if (sort === 'oldest') {
      return timeA - timeB;
    }

    // Default newest first
    return timeB - timeA;
  });

  return list;
};

export default notificationSlice.reducer;
