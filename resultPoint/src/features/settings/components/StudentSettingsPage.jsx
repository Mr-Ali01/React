import React, { useEffect } from 'react';
import { Settings as SettingsIcon } from 'lucide-react';
import { useAppDispatch } from '../../../hooks/useAppDispatch.js';
import { fetchSettings } from '../settingsSlice.js';
import { settingsService } from '../settingsService.js';
import AppearancePreferences from './AppearancePreferences.jsx';
import AcademicPreferences from './AcademicPreferences.jsx';
import NotificationPreferences from './NotificationPreferences.jsx';
import ProfileAccountSettings from './ProfileAccountSettings.jsx';
import DataManagementSettings from './DataManagementSettings.jsx';
import PrivacySecuritySettings from './PrivacySecuritySettings.jsx';

export default function StudentSettingsPage() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(fetchSettings());
    settingsService.initTheme();
  }, [dispatch]);

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 animate-fadeIn">
      {/* Page Header matching screenshot */}
      <div className="flex items-start gap-3.5 pb-2 border-b border-border">
        <div className="w-11 h-11 rounded-2xl bg-[#FF6B00]/10 border border-[#FF6B00]/25 flex items-center justify-center text-[#FF6B00] flex-shrink-0 mt-0.5 shadow-sm">
          <SettingsIcon className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-text-h tracking-tight">
            Student Settings
          </h1>
          <p className="text-xs sm:text-sm text-text-light mt-0.5 leading-relaxed">
            Manage your preferences, academic settings, notifications, and data.
          </p>
        </div>
      </div>

      {/* Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left Column */}
        <div className="space-y-6">
          <AppearancePreferences />
          <AcademicPreferences />
          <NotificationPreferences />
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <ProfileAccountSettings />
          <DataManagementSettings />
          <PrivacySecuritySettings />
        </div>
      </div>
    </div>
  );
}
