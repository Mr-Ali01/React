import { STORAGE_KEYS } from './storageKeys';

const DEFAULT_NOTIFICATIONS = [
  {
    id: 'notif_1',
    title: 'Semester 4 Result Verified',
    message: 'Your SGPA of 8.72 has been computed and locked into your academic record.',
    time: '2 hours ago',
    unread: true,
    type: 'success'
  },
  {
    id: 'notif_2',
    title: 'Academic Goal Progress Update',
    message: 'You are now at 92% of your Target CGPA of 8.50. Keep up the high score in Sem 5!',
    time: '1 day ago',
    unread: true,
    type: 'goal'
  },
  {
    id: 'notif_3',
    title: 'Osmania University Exam Schedule',
    message: 'Upcoming internal assessment timetable published for MCA CBCS regulation.',
    time: '3 days ago',
    unread: true,
    type: 'info'
  }
];

function safeGet(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (err) {
    return fallback;
  }
}

function safeSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(err);
  }
}

export const notificationService = {
  initialize() {
    const existing = safeGet(STORAGE_KEYS.NOTIFICATIONS, null);
    if (!existing) {
      safeSet(STORAGE_KEYS.NOTIFICATIONS, DEFAULT_NOTIFICATIONS);
    }
  },

  getNotifications() {
    this.initialize();
    return safeGet(STORAGE_KEYS.NOTIFICATIONS, DEFAULT_NOTIFICATIONS);
  },

  getUnreadCount() {
    const notifs = this.getNotifications();
    return notifs.filter((n) => n.unread).length;
  },

  markAllAsRead() {
    const notifs = this.getNotifications();
    const updated = notifs.map((n) => ({ ...n, unread: false }));
    safeSet(STORAGE_KEYS.NOTIFICATIONS, updated);
    return updated;
  }
};

notificationService.initialize();
