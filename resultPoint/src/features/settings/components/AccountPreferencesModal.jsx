import React, { useState } from 'react';
import { X, SlidersHorizontal, Shield, Clock, Check } from 'lucide-react';
import { useToast } from '../../../context/ToastContext.jsx';
import { authService } from '../../../services/authService.js';
import { studentService } from '../../../services/studentService.js';
import { settingsService } from '../settingsService.js';

export default function AccountPreferencesModal({ isOpen, onClose }) {
  const { showToast } = useToast();
  const user = authService.getCurrentUser() || {};
  const profile = studentService.getProfile() || {};
  const currentSettings = settingsService.getSettings();

  const [sessionDuration, setSessionDuration] = useState(
    currentSettings.accountPreferences?.sessionDuration || '7d'
  );
  const [gradePrivacy, setGradePrivacy] = useState(
    Boolean(currentSettings.accountPreferences?.gradePrivacy)
  );

  if (!isOpen) return null;

  const handleSave = () => {
    settingsService.saveSettings({
      accountPreferences: {
        sessionDuration,
        gradePrivacy,
      }
    });
    showToast('Account preferences updated.');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-scaleUp">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FF6B00]/10 border border-[#FF6B00]/25 flex items-center justify-center text-[#FF6B00]">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-text-h">Account Preferences</h3>
              <p className="text-xs text-text-light">Manage login sessions and privacy settings.</p>
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

        <div className="space-y-4">
          {/* Account Details */}
          <div className="p-3.5 rounded-xl bg-bg-sec border border-border text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-text-light">Registered Email:</span>
              <span className="font-semibold text-text-h">{user.email || profile.email || 'student@resultpoint.edu'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-light">Account Role:</span>
              <span className="font-semibold text-emerald-500 capitalize">{user.role || 'Student'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-light">Institution:</span>
              <span className="font-semibold text-text-h">{profile.university || 'Osmania University'}</span>
            </div>
          </div>

          {/* Session Duration */}
          <div>
            <label className="text-xs font-semibold text-text-h mb-1 flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-text-light" />
              <span>Active Session Inactivity Timeout</span>
            </label>
            <select
              value={sessionDuration}
              onChange={(e) => setSessionDuration(e.target.value)}
              className="calc-input w-full px-3 py-2 rounded-xl text-xs cursor-pointer"
            >
              <option value="24h" className="bg-card text-text-h">24 Hours</option>
              <option value="3d" className="bg-card text-text-h">3 Days</option>
              <option value="7d" className="bg-card text-text-h">7 Days (Default)</option>
              <option value="30d" className="bg-card text-text-h">30 Days</option>
            </select>
          </div>

          {/* Grade Privacy Flag */}
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <div>
              <div className="text-xs font-bold text-text-h">Hide Grade Points from Overview</div>
              <div className="text-[11px] text-text-light">Obfuscate exact grade points on quick dashboard cards.</div>
            </div>
            <button
              type="button"
              onClick={() => setGradePrivacy(!gradePrivacy)}
              className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer flex-shrink-0 ${
                gradePrivacy ? 'bg-[#FF6B00]' : 'bg-slate-300 dark:bg-[#1E293B]'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 bg-white w-4 h-4 rounded-full transition-transform ${
                  gradePrivacy ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-text-m hover:text-text-h bg-bg-sec hover:bg-border transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#FF6B00] hover:bg-[#E05D00] transition-colors cursor-pointer shadow-md shadow-[#FF6B00]/20 flex items-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Save Preferences</span>
          </button>
        </div>
      </div>
    </div>
  );
}
