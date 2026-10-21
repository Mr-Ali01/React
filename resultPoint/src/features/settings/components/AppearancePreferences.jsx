import React from 'react';
import { Palette, Monitor, Sun, Moon, LayoutGrid, Globe } from 'lucide-react';
import { useAppDispatch } from '../../../hooks/useAppDispatch.js';
import { useAppSelector } from '../../../hooks/useAppSelector.js';
import {
  selectDashboardView,
  setDashboardView,
} from '../settingsSlice.js';
import { useTheme } from '../../../context/ThemeContext.jsx';
import { useToast } from '../../../context/ToastContext.jsx';

export default function AppearancePreferences() {
  const dispatch = useAppDispatch();
  const dashboardView = useAppSelector(selectDashboardView);
  const { themeMode, setThemeMode } = useTheme();
  const { showToast } = useToast();

  const handleThemeChange = (mode) => {
    setThemeMode(mode);
    showToast(`Switched theme to ${mode.charAt(0).toUpperCase() + mode.slice(1)} Mode.`);
  };

  const handleDashboardViewChange = (view) => {
    dispatch(setDashboardView(view));
    showToast(`Dashboard view set to ${view.charAt(0).toUpperCase() + view.slice(1)}.`);
  };

  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-card border border-border shadow-subtle space-y-6">
      {/* Section Header */}
      <div className="flex items-start gap-3.5 pb-4 border-b border-border">
        <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/25 flex items-center justify-center text-accent flex-shrink-0 mt-0.5">
          <Palette className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-base font-bold text-text-h tracking-tight">
            Appearance & Preferences
          </h2>
          <p className="text-xs text-text-light mt-0.5">
            Customize the look and feel of ResultPoint.
          </p>
        </div>
      </div>

      <div className="space-y-5">
        {/* 1. Theme Mode */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div className="flex items-start gap-3">
            <Monitor className="w-4 h-4 text-text-light mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-xs font-bold text-text-h">Theme Mode</div>
              <div className="text-[11px] text-text-light">Choose your preferred theme.</div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-bg-sec border border-border">
            {/* Light */}
            <button
              type="button"
              onClick={() => handleThemeChange('light')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                themeMode === 'light'
                  ? 'bg-card text-text-h border border-accent shadow-sm'
                  : 'text-text-light hover:text-text-h'
              }`}
            >
              <Sun className="w-3.5 h-3.5 text-accent" />
              <span>Light</span>
            </button>

            {/* Dark */}
            <button
              type="button"
              onClick={() => handleThemeChange('dark')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                themeMode === 'dark'
                  ? 'bg-card text-text-h border border-accent shadow-sm'
                  : 'text-text-light hover:text-text-h'
              }`}
            >
              <Moon className="w-3.5 h-3.5 text-accent" />
              <span>Dark</span>
            </button>

            {/* System */}
            <button
              type="button"
              onClick={() => handleThemeChange('system')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                themeMode === 'system'
                  ? 'bg-card text-text-h border border-accent shadow-sm'
                  : 'text-text-light hover:text-text-h'
              }`}
            >
              <Monitor className="w-3.5 h-3.5 text-accent" />
              <span>System</span>
            </button>
          </div>
        </div>

        {/* 2. Dashboard View */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-border/60">
          <div className="flex items-start gap-3">
            <LayoutGrid className="w-4 h-4 text-text-light mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-xs font-bold text-text-h">Dashboard View</div>
              <div className="text-[11px] text-text-light">Choose default dashboard layout.</div>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            {[
              { id: 'compact', label: 'Compact' },
              { id: 'comfortable', label: 'Comfortable' },
              { id: 'expanded', label: 'Expanded' },
            ].map((option) => {
              const isSelected = dashboardView === option.id;
              return (
                <label
                  key={option.id}
                  onClick={() => handleDashboardViewChange(option.id)}
                  className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-text-m hover:text-text-h select-none"
                >
                  <span
                    className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                      isSelected ? 'border-accent' : 'border-border'
                    }`}
                  >
                    {isSelected && <span className="w-2 h-2 rounded-full bg-accent" />}
                  </span>
                  <span>{option.label}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* 3. Language */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-border/60">
          <div className="flex items-start gap-3">
            <Globe className="w-4 h-4 text-text-light mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-xs font-bold text-text-h">Language</div>
              <div className="text-[11px] text-text-light">Select application language.</div>
            </div>
          </div>

          <div className="relative">
            <select
              value="en"
              onChange={() => {
                showToast('Language preference saved.');
              }}
              className="calc-input px-3.5 py-1.5 rounded-xl text-xs font-semibold pr-8 cursor-pointer"
            >
              <option value="en">English (EN)</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
