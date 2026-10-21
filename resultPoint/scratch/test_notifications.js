import { notificationService, NOTIFICATION_CATEGORIES } from '../src/services/notificationService.js';
import { authService } from '../src/services/authService.js';

// Setup mock localStorage
const store = {};
global.localStorage = {
  getItem: (key) => store[key] || null,
  setItem: (key, val) => { store[key] = String(val); },
  removeItem: (key) => { delete store[key]; },
  clear: () => { Object.keys(store).forEach(k => delete store[k]); }
};

// Setup mock window & events
global.window = {
  dispatchEvent: (event) => {}
};
global.Event = class { constructor(name) { this.name = name; } };

console.log('--- Starting Notifications Module Verification ---');

// 1. Initial seeds check
notificationService.initialize();
const initialNotifs = notificationService.getNotifications();
console.log(`Initial active notifications count: ${initialNotifs.length}`);
if (initialNotifs.length !== 8) {
  console.error(`FAIL: Expected 8 seed notifications, got ${initialNotifs.length}`);
  process.exit(1);
}

const counts = notificationService.getCounts();
console.log(`Initial counts: All=${counts.all}, Unread=${counts.unread}, Read=${counts.read}, Deleted=${counts.deleted}`);
if (counts.all !== 8 || counts.unread !== 3 || counts.read !== 5 || counts.deleted !== 0) {
  console.error(`FAIL: Unexpected initial counts:`, counts);
  process.exit(1);
}
console.log('PASS: Initial 8 notifications (3 unread, 5 read, 0 deleted) verified.');

// 2. Mark single as read
const firstUnread = initialNotifs.find(n => n.unread);
console.log(`Marking notification as read: ${firstUnread.title}`);
notificationService.markAsRead(firstUnread.id);
const countsAfterRead = notificationService.getCounts();
console.log(`Counts after single read: Unread=${countsAfterRead.unread}, Read=${countsAfterRead.read}`);
if (countsAfterRead.unread !== 2 || countsAfterRead.read !== 6) {
  console.error('FAIL: Unread count did not decrement correctly');
  process.exit(1);
}
console.log('PASS: Single mark as read verified.');

// 3. Mark single as unread
notificationService.markAsUnread(firstUnread.id);
const countsAfterUnread = notificationService.getCounts();
if (countsAfterUnread.unread !== 3) {
  console.error('FAIL: Mark as unread did not restore unread count');
  process.exit(1);
}
console.log('PASS: Single mark as unread verified.');

// 4. Mark all as read
console.log('Testing markAllAsRead()...');
notificationService.markAllAsRead();
const countsAfterAllRead = notificationService.getCounts();
console.log(`Counts after markAllAsRead: Unread=${countsAfterAllRead.unread}, Read=${countsAfterAllRead.read}`);
if (countsAfterAllRead.unread !== 0 || countsAfterAllRead.read !== 8) {
  console.error('FAIL: Mark all as read failed');
  process.exit(1);
}
console.log('PASS: Mark all as read verified.');

// 5. Soft delete (move to trash)
const targetToDelete = initialNotifs[0];
console.log(`Deleting notification: ${targetToDelete.title}`);
notificationService.deleteNotification(targetToDelete.id);
const countsAfterDelete = notificationService.getCounts();
console.log(`Counts after delete: All=${countsAfterDelete.all}, Deleted=${countsAfterDelete.deleted}`);
if (countsAfterDelete.all !== 7 || countsAfterDelete.deleted !== 1) {
  console.error('FAIL: Notification was not moved to trash properly');
  process.exit(1);
}
const trashList = notificationService.getDeletedNotifications();
if (trashList.length !== 1 || trashList[0].id !== targetToDelete.id) {
  console.error('FAIL: Trash list content mismatch');
  process.exit(1);
}
console.log('PASS: Soft delete to recoverable trash verified.');

// 6. Restore from trash
console.log(`Restoring notification: ${targetToDelete.title}`);
notificationService.restoreNotification(targetToDelete.id);
const countsAfterRestore = notificationService.getCounts();
if (countsAfterRestore.all !== 8 || countsAfterRestore.deleted !== 0) {
  console.error('FAIL: Restore failed');
  process.exit(1);
}
console.log('PASS: Restore from trash verified.');

// 7. Event-driven notification generation
console.log('Testing event-driven notification generation...');
const newResultNotif = notificationService.notifyResultSaved(5, 9.15);
console.log(`Generated result notification: ${newResultNotif.title}`);
const countsAfterEvent = notificationService.getCounts();
if (countsAfterEvent.all !== 9 || countsAfterEvent.unread !== 1) {
  console.error('FAIL: Event notification did not update counts');
  process.exit(1);
}
console.log('PASS: Event generation notifyResultSaved verified.');

// 8. Idempotency test
const duplicateNotif = notificationService.addNotification({
  title: 'Duplicate Test',
  message: 'Duplicate Message',
  idempotencyKey: 'test_idemp_key_123'
});
const countBeforeDup = notificationService.getCounts().all;
const duplicateAttempt = notificationService.addNotification({
  title: 'Duplicate Test',
  message: 'Duplicate Message',
  idempotencyKey: 'test_idemp_key_123'
});
const countAfterDup = notificationService.getCounts().all;
if (countBeforeDup !== countAfterDup) {
  console.error('FAIL: Duplicate notification was not prevented by idempotencyKey');
  process.exit(1);
}
console.log('PASS: Duplicate prevention via idempotency verified.');

// 9. Notification preferences test
console.log('Testing notification preferences...');
notificationService.updatePreferences({ resultNotifications: false });
const suppressedNotif = notificationService.notifyResultSaved(6, 9.5);
if (suppressedNotif !== null) {
  console.error('FAIL: Disabled notification category was not suppressed');
  process.exit(1);
}
console.log('PASS: Preferences category suppression verified.');
// Re-enable
notificationService.updatePreferences({ resultNotifications: true });

// 10. Relative time formatting test
const nowRel = notificationService.formatRelativeTime(new Date().toISOString());
const minAgoRel = notificationService.formatRelativeTime(new Date(Date.now() - 5 * 60 * 1000).toISOString());
const hoursAgoRel = notificationService.formatRelativeTime(new Date(Date.now() - 3 * 3600 * 1000).toISOString());
const daysAgoRel = notificationService.formatRelativeTime(new Date(Date.now() - 2 * 86400 * 1000).toISOString());

console.log(`Relative times: "${nowRel}", "${minAgoRel}", "${hoursAgoRel}", "${daysAgoRel}"`);
if (nowRel !== 'Just now' || minAgoRel !== '5 minutes ago' || hoursAgoRel !== '3 hours ago' || daysAgoRel !== '2 days ago') {
  console.error('FAIL: formatRelativeTime produced unexpected output');
  process.exit(1);
}
console.log('PASS: formatRelativeTime verified.');

console.log('\n--- ALL NOTIFICATIONS MODULE VERIFICATION TESTS PASSED SUCCESSFULLY! ---');
