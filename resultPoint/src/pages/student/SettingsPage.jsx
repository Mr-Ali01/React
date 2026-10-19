import React from 'react';
import { Settings, Sun, Moon, Shield, RefreshCw } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const { showToast } = useToast();

  const handleResetDemoData = () => {
    if (window.confirm('Reset all demo data (results, goals, student profile) to factory defaults?')) {
      localStorage.clear();
      showToast('Demo data reset to original template.');
      window.location.reload();
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="pb-2 border-b border-border/80">
        <h1 className="text-xl sm:text-2xl font-extrabold text-text-h tracking-tight flex items-center gap-2.5">
          <Settings className="w-6 h-6 text-brandBlue" />
          <span>Student Settings</span>
        </h1>
        <p className="text-xs sm:text-[13px] text-text-light mt-0.5">
          Configure interface theme, academic calculation scales, and local storage data.
        </p>
      </div>

      <div className="space-y-4">
        {/* Appearance */}
        <div className="p-5 rounded-2xl bg-card border border-border shadow-subtle flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-text-h">Theme Appearance</h3>
            <p className="text-xs text-text-light">
              Toggle between ResultPoint Light Mode and Deep Navy Dark Mode.
            </p>
          </div>

          <button
            onClick={toggleTheme}
            type="button"
            className="px-4 py-2 rounded-xl text-xs font-bold border border-border bg-bg hover:border-accent flex items-center gap-2 transition-colors"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-accent" /> : <Moon className="w-4 h-4 text-accent" />}
            <span className="capitalize">{theme} Mode</span>
          </button>
        </div>

        {/* Local Storage & Reset */}
        <div className="p-5 rounded-2xl bg-card border border-border shadow-subtle flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-text-h">Reset Demo Data</h3>
            <p className="text-xs text-text-light">
              Restore initial Samir Ali demo results, goals, and metrics to default state.
            </p>
          </div>

          <button
            onClick={handleResetDemoData}
            type="button"
            className="px-4 py-2 rounded-xl text-xs font-bold text-brandPink border border-brandPink/30 hover:bg-brandPink/10 flex items-center gap-2 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Reset Demo</span>
          </button>
        </div>
      </div>
    </div>
  );
}
