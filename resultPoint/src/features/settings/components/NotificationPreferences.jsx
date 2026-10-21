import React from 'react';
import { Bell, Mail, Target, Layers } from 'lucide-react';
import { useAppDispatch } from '../../../hooks/useAppDispatch.js';
import { useAppSelector } from '../../../hooks/useAppSelector.js';
import {
  selectNotificationPreferences,
  setNotificationToggle,
} from '../settingsSlice.js';
import { useToast } from '../../../context/ToastContext.jsx';

export default function NotificationPreferences() {
  const dispatch = useAppDispatch();
  const notifPrefs = useAppSelector(selectNotificationPreferences);
  const { showToast } = useToast();

  const handleToggle = (key, label) => {
    const currentVal = Boolean(notifPrefs[key]);
    const nextVal = !currentVal;
    dispatch(setNotificationToggle({ key, value: nextVal }));
    showToast(`${label} ${nextVal ? 'enabled' : 'disabled'}.`);
  };

  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-card border border-border shadow-subtle space-y-6">
      {/* Section Header */}
      <div className="flex items-start gap-3.5 pb-4 border-b border-border">
        <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/25 flex items-center justify-center text-accent flex-shrink-0 mt-0.5">
          <Bell className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-base font-bold text-text-h tracking-tight">
            Notifications
          </h2>
          <p className="text-xs text-text-light mt-0.5">
            Choose what updates and reminders you want to receive.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* 1. Academic Updates */}
        <div className="flex items-center justify-between gap-3 pt-1">
          <div className="flex items-start gap-3 min-w-0">
            <Mail className="w-4 h-4 text-text-light mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <span className="text-xs font-bold text-text-h mr-2">Academic Updates</span>
              <span className="text-[11px] text-text-light">
                Important academic announcements and result reminders.
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleToggle('academicUpdates', 'Academic updates')}
            className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer flex-shrink-0 ${
              notifPrefs.academicUpdates !== false ? 'bg-accent' : 'bg-bg-sec border border-border'
            }`}
          >
            <span
              className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform shadow-xs ${
                notifPrefs.academicUpdates !== false ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* 2. Goal Reminders */}
        <div className="flex items-center justify-between gap-3 pt-2 border-t border-border/60">
          <div className="flex items-start gap-3 min-w-0">
            <Target className="w-4 h-4 text-text-light mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <span className="text-xs font-bold text-text-h mr-2">Goal Reminders</span>
              <span className="text-[11px] text-text-light">
                Notifications about your academic goals and progress.
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleToggle('goalReminders', 'Goal reminders')}
            className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer flex-shrink-0 ${
              notifPrefs.goalReminders !== false ? 'bg-accent' : 'bg-bg-sec border border-border'
            }`}
          >
            <span
              className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform shadow-xs ${
                notifPrefs.goalReminders !== false ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* 3. Backlog Alerts */}
        <div className="flex items-center justify-between gap-3 pt-2 border-t border-border/60">
          <div className="flex items-start gap-3 min-w-0">
            <Layers className="w-4 h-4 text-text-light mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <span className="text-xs font-bold text-text-h mr-2">Backlog Alerts</span>
              <span className="text-[11px] text-text-light">
                Alerts for active backlogs and re-evaluation reminders.
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleToggle('backlogAlerts', 'Backlog alerts')}
            className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer flex-shrink-0 ${
              notifPrefs.backlogAlerts !== false ? 'bg-accent' : 'bg-bg-sec border border-border'
            }`}
          >
            <span
              className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform shadow-xs ${
                notifPrefs.backlogAlerts !== false ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
