import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Settings,
  ShieldCheck,
  Database,
  History,
  HardDrive,
  Download,
  Upload,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Clock,
  User,
  Tag,
  ChevronLeft,
  ChevronRight,
  X,
  FileJson,
  Layers,
  Sliders,
  Check,
  Save,
  Trash2,
  RotateCcw,
  Sparkles,
  Info
} from 'lucide-react';

import {
  platformSettingsService,
  SETTINGS_UPDATED_EVENT,
  BACKUP_SCHEMA_VERSION,
  APP_VERSION
} from '../../services/platformSettingsService';
import {
  auditHistoryService
} from '../../services/auditHistoryService';
import { useToast } from '../../context/ToastContext';

export default function SettingsManager() {
  const { showToast } = useToast();

  // Active Tab
  const [activeTab, setActiveTab] = useState('settings'); // 'settings' | 'audit' | 'backup' | 'storage'

  // Platform Settings State
  const [settingsForm, setSettingsForm] = useState(() => platformSettingsService.getSettings());
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isResetSettingsModalOpen, setIsResetSettingsModalOpen] = useState(false);

  // Audit Viewer State
  const [auditSearch, setAuditSearch] = useState('');
  const [auditEntityType, setAuditEntityType] = useState('all');
  const [auditDateRange, setAuditDateRange] = useState('all');
  const [auditSortBy, setAuditSortBy] = useState('latest');
  const [auditCurrentPage, setAuditCurrentPage] = useState(1);
  const [isClearAuditModalOpen, setIsClearAuditModalOpen] = useState(false);

  // Storage Diagnostics State
  const [storageDiagnostics, setStorageDiagnostics] = useState(() =>
    platformSettingsService.getStorageDiagnostics()
  );

  // Backup & Restore State
  const [backupPreview, setBackupPreview] = useState(null);
  const [backupFileError, setBackupFileError] = useState('');
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [isRollbackModalOpen, setIsRollbackModalOpen] = useState(false);

  // Reload diagnostics & settings
  const refreshData = useCallback(() => {
    setSettingsForm(platformSettingsService.getSettings());
    setStorageDiagnostics(platformSettingsService.getStorageDiagnostics());
  }, []);

  useEffect(() => {
    refreshData();

    const handleUpdate = () => {
      refreshData();
    };

    window.addEventListener(SETTINGS_UPDATED_EVENT, handleUpdate);
    window.addEventListener('rp_audit_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener(SETTINGS_UPDATED_EVENT, handleUpdate);
      window.removeEventListener('rp_audit_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [refreshData]);

  // Query Audit Events
  const auditResult = useMemo(() => {
    return auditHistoryService.getFilteredAuditEvents({
      search: auditSearch,
      entityType: auditEntityType,
      dateRange: auditDateRange,
      sortBy: auditSortBy,
      page: auditCurrentPage,
      pageSize: 12
    });
  }, [auditSearch, auditEntityType, auditDateRange, auditSortBy, auditCurrentPage, storageDiagnostics]);

  const auditStats = useMemo(() => {
    return auditHistoryService.getAuditStats();
  }, [storageDiagnostics]);

  // Handle Save Settings
  const handleSaveSettings = (e) => {
    e.preventDefault();
    setIsSavingSettings(true);
    try {
      platformSettingsService.updateSettings(settingsForm);
      showToast('Platform settings saved successfully!', 'success');
      refreshData();
    } catch (err) {
      showToast(err.message || 'Failed to update settings.', 'error');
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Handle Reset Defaults
  const handleConfirmResetSettings = () => {
    try {
      const reset = platformSettingsService.resetToDefaults();
      setSettingsForm(reset);
      setIsResetSettingsModalOpen(false);
      showToast('Restored baseline platform settings.', 'success');
      refreshData();
    } catch (err) {
      showToast(err.message || 'Reset failed.', 'error');
    }
  };

  // Handle Clear Audit
  const handleConfirmClearAudit = () => {
    try {
      auditHistoryService.clearAuditHistory();
      setIsClearAuditModalOpen(false);
      showToast('Audit trail history cleared.', 'success');
      refreshData();
    } catch (err) {
      showToast(err.message || 'Failed to clear audit trail.', 'error');
    }
  };

  // Handle Download Backup
  const handleDownloadBackup = () => {
    try {
      const backup = platformSettingsService.generateBackup();
      const jsonStr = JSON.stringify(backup, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      const dateStr = new Date().toISOString().slice(0, 10);
      link.download = `resultpoint_backup_v${BACKUP_SCHEMA_VERSION}_${dateStr}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showToast('Platform backup downloaded successfully! Store it securely.', 'success');
      refreshData();
    } catch (err) {
      showToast('Error generating backup: ' + err.message, 'error');
    }
  };

  // Handle File Upload for Restore
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setBackupFileError('');
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result);
        const validation = platformSettingsService.validateBackup(parsed);
        if (!validation.isValid) {
          setBackupFileError(validation.errors.join(' '));
          setBackupPreview(null);
        } else {
          setBackupPreview(parsed);
          setBackupFileError('');
          setIsRestoreModalOpen(true);
        }
      } catch (err) {
        setBackupFileError('Invalid JSON file format. Please upload a valid ResultPoint backup.');
        setBackupPreview(null);
      }
    };
    reader.readAsText(file);
    // Reset input
    e.target.value = '';
  };

  // Handle Confirm Restore
  const handleConfirmRestore = () => {
    if (!backupPreview) return;
    try {
      const res = platformSettingsService.restoreBackup(backupPreview, { createSafetySnapshot: true });
      showToast('Platform data restored successfully! Emergency snapshot saved.', 'success');
      setIsRestoreModalOpen(false);
      setBackupPreview(null);
      refreshData();
    } catch (err) {
      showToast(err.message || 'Restore failed.', 'error');
    }
  };

  // Handle Rollback
  const handleConfirmRollback = () => {
    try {
      platformSettingsService.rollbackSafetySnapshot();
      showToast('Emergency snapshot restored successfully.', 'success');
      setIsRollbackModalOpen(false);
      refreshData();
    } catch (err) {
      showToast(err.message || 'Rollback failed.', 'error');
    }
  };

  // Action badge color
  const getActionBadge = (action = '') => {
    const act = action.toUpperCase();
    if (act.includes('CREATED') || act.includes('PUBLISHED') || act.includes('ADDED')) {
      return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
    }
    if (act.includes('UPDATED') || act.includes('CONFIG')) {
      return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
    }
    if (act.includes('ARCHIVED') || act.includes('RESTORED') || act.includes('STATUS')) {
      return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20';
    }
    if (act.includes('DELETED') || act.includes('CLEAR') || act.includes('RESET')) {
      return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20';
    }
    return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20';
  };

  return (
    <div className="space-y-6 pb-12 text-left">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-white/10">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-accent/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-blue-200 border border-white/15">
              <ShieldCheck className="w-3.5 h-3.5 text-accent" />
              <span>Phase 3H: Platform Settings & Platform Audit Trail</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Settings & Platform Audit Trail
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Configure system preferences, review immutable administrator audit trails, monitor client storage consumption, and generate sanitized versioned backups.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleDownloadBackup}
              className="px-4 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-white text-xs font-bold shadow-lg shadow-accent/25 transition-all flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>Export Backup (.json)</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mt-8 pt-4 border-t border-white/10 flex items-center gap-2 overflow-x-auto text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'settings'
                ? 'bg-white text-slate-900 shadow-md font-bold'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Platform Settings</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('audit')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'audit'
                ? 'bg-white text-slate-900 shadow-md font-bold'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Audit Trail Viewer ({auditStats.totalEvents})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('backup')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'backup'
                ? 'bg-white text-slate-900 shadow-md font-bold'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Backup & Restore</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('storage')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'storage'
                ? 'bg-white text-slate-900 shadow-md font-bold'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <HardDrive className="w-3.5 h-3.5" />
            <span>Storage & Health ({storageDiagnostics.formattedTotal})</span>
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* TAB 1: Platform Settings                                      */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'settings' && (
        <form onSubmit={handleSaveSettings} className="space-y-6">
          {/* General Platform Preferences */}
          <div className="rounded-3xl bg-card border border-border p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-border/70 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-accent-soft text-accent">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-text-h">General Application Preferences</h2>
                  <p className="text-xs text-text-light">Branding, support channels, and default portal behaviour</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="font-semibold text-text-h block mb-1">
                  Portal Brand Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={settingsForm.siteName}
                  onChange={(e) => setSettingsForm({ ...settingsForm, siteName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-bg text-text-h focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>

              <div>
                <label className="font-semibold text-text-h block mb-1">
                  Support Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={settingsForm.supportEmail}
                  onChange={(e) => setSettingsForm({ ...settingsForm, supportEmail: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-bg text-text-h focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>

              <div>
                <label className="font-semibold text-text-h block mb-1">
                  Contact Phone
                </label>
                <input
                  type="text"
                  value={settingsForm.contactPhone}
                  onChange={(e) => setSettingsForm({ ...settingsForm, contactPhone: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-bg text-text-h focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs pt-2">
              <div>
                <label className="font-semibold text-text-h block mb-1">
                  Default Theme Mode
                </label>
                <select
                  value={settingsForm.defaultThemeMode}
                  onChange={(e) => setSettingsForm({ ...settingsForm, defaultThemeMode: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-bg text-text-h focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="dark">Dark Theme (Default)</option>
                  <option value="light">Light Theme</option>
                  <option value="system">System Preference</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-text-h block mb-1">
                  Default Table Page Size
                </label>
                <select
                  value={settingsForm.defaultItemsPerPage}
                  onChange={(e) => setSettingsForm({ ...settingsForm, defaultItemsPerPage: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-bg text-text-h focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value={5}>5 items per page</option>
                  <option value={10}>10 items per page</option>
                  <option value={15}>15 items per page</option>
                  <option value={20}>20 items per page</option>
                  <option value={25}>25 items per page</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-text-h block mb-1">
                  Audit Log Retention
                </label>
                <select
                  value={settingsForm.auditRetentionDays}
                  onChange={(e) => setSettingsForm({ ...settingsForm, auditRetentionDays: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-bg text-text-h focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value={30}>30 Days</option>
                  <option value={60}>60 Days</option>
                  <option value={90}>90 Days (Recommended)</option>
                  <option value={180}>180 Days</option>
                  <option value={365}>1 Year</option>
                </select>
              </div>
            </div>

            {/* Platform Toggles */}
            <div className="pt-4 border-t border-border/70 space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settingsForm.allowStudentRegistration}
                  onChange={(e) => setSettingsForm({ ...settingsForm, allowStudentRegistration: e.target.checked })}
                  className="rounded text-accent focus:ring-accent"
                />
                <span className="text-xs font-semibold text-text-h">
                  Allow New Student Self-Registration (Open Signup)
                </span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settingsForm.allowPublicCalculators}
                  onChange={(e) => setSettingsForm({ ...settingsForm, allowPublicCalculators: e.target.checked })}
                  className="rounded text-accent focus:ring-accent"
                />
                <span className="text-xs font-semibold text-text-h">
                  Allow Public Guest Access to SGPA/CGPA Calculators
                </span>
              </label>

              {/* Maintenance Mode */}
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-3 mt-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settingsForm.maintenanceMode}
                    onChange={(e) => setSettingsForm({ ...settingsForm, maintenanceMode: e.target.checked })}
                    className="rounded text-amber-500 focus:ring-amber-500"
                  />
                  <div>
                    <span className="text-xs font-bold text-amber-600 dark:text-amber-400 block">
                      Enable Platform Maintenance Mode
                    </span>
                    <span className="text-[11px] text-text-m">
                      Displays a global maintenance banner across student interfaces
                    </span>
                  </div>
                </label>

                {settingsForm.maintenanceMode && (
                  <input
                    type="text"
                    value={settingsForm.maintenanceMessage}
                    onChange={(e) => setSettingsForm({ ...settingsForm, maintenanceMessage: e.target.value })}
                    placeholder="Enter maintenance banner announcement message..."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-amber-500/30 bg-bg text-text-h focus:outline-none"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Academic Platform Defaults */}
          <div className="rounded-3xl bg-card border border-border p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-border/70 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-text-h">Academic Platform Baseline Defaults</h2>
                  <p className="text-xs text-text-light">
                    Fallback defaults when not defined by university-specific ordinances in the Academic Catalog
                  </p>
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-600 dark:text-blue-300 flex items-start gap-2.5">
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                <strong>Academic Authority Notice:</strong> These settings serve as global calculation fallbacks. University ordinances configured in the <strong>Academic Catalog</strong> (such as Osmania S-Grade or JNTUH R18/R22 formula \`(CGPA - 0.5) × 10\`) always take strict precedence during evaluations.
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <label className="font-semibold text-text-h block mb-1">
                  Default Grading Scale
                </label>
                <select
                  value={settingsForm.defaultGradingScale}
                  onChange={(e) => setSettingsForm({ ...settingsForm, defaultGradingScale: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-bg text-text-h focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="ugc-10-point">UGC 10-Point Scale (Standard)</option>
                  <option value="ou-10-point">OU 10-Point (S-Grade Scale)</option>
                  <option value="jntuh-10-point">JNTUH 10-Point (R18/R22)</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-text-h block mb-1">
                  Default Decimal Precision
                </label>
                <select
                  value={settingsForm.defaultCalculationPrecision}
                  onChange={(e) => setSettingsForm({ ...settingsForm, defaultCalculationPrecision: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-bg text-text-h focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value={1}>1 Decimal (e.g. 8.5)</option>
                  <option value={2}>2 Decimals (e.g. 8.54 - Recommended)</option>
                  <option value={3}>3 Decimals (e.g. 8.542)</option>
                  <option value={4}>4 Decimals (e.g. 8.5425)</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-text-h block mb-1">
                  Default Rounding Mode
                </label>
                <select
                  value={settingsForm.defaultRoundingMode}
                  onChange={(e) => setSettingsForm({ ...settingsForm, defaultRoundingMode: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-bg text-text-h focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="half-up">Standard Round (Half-Up)</option>
                  <option value="floor">Floor (Round Down)</option>
                  <option value="ceil">Ceil (Round Up)</option>
                  <option value="truncate">Direct Truncate</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-text-h block mb-1">
                  Default Pass Marks Threshold
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={settingsForm.defaultPassingMarks}
                  onChange={(e) => setSettingsForm({ ...settingsForm, defaultPassingMarks: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-bg text-text-h focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => setIsResetSettingsModalOpen(true)}
              className="px-4 py-2.5 rounded-xl border border-border hover:bg-bg-sec text-xs font-semibold text-text-h transition-colors flex items-center gap-2"
            >
              <RotateCcw className="w-3.5 h-3.5 text-text-light" />
              <span>Restore Baseline Defaults</span>
            </button>

            <button
              type="submit"
              disabled={isSavingSettings}
              className="px-6 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-white text-xs font-bold shadow-lg shadow-accent/25 transition-all flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>{isSavingSettings ? 'Saving...' : 'Save Configuration'}</span>
            </button>
          </div>
        </form>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 2: Audit Trail Viewer                                     */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="rounded-2xl bg-card border border-border p-4 shadow-sm space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
              {/* Search */}
              <div className="md:col-span-4 relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-light pointer-events-none" />
                <input
                  type="text"
                  value={auditSearch}
                  onChange={(e) => {
                    setAuditSearch(e.target.value);
                    setAuditCurrentPage(1);
                  }}
                  placeholder="Search action, actor, entity, details..."
                  className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-border bg-bg text-text-h placeholder:text-text-light focus:outline-none focus:ring-2 focus:ring-accent"
                />
                {auditSearch && (
                  <button
                    type="button"
                    onClick={() => setAuditSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-light hover:text-text-h"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Entity Type Filter */}
              <div className="md:col-span-3">
                <select
                  value={auditEntityType}
                  onChange={(e) => {
                    setAuditEntityType(e.target.value);
                    setAuditCurrentPage(1);
                  }}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-bg text-text-h focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="all">All Entity Types</option>
                  <option value="university">Universities</option>
                  <option value="course">Courses</option>
                  <option value="regulation">Regulations</option>
                  <option value="subject">Subjects</option>
                  <option value="grading_scale">Grading Scales</option>
                  <option value="calculation_rule">Calculation Rules</option>
                  <option value="user">Users</option>
                  <option value="support_query">Support Tickets</option>
                  <option value="announcement">Announcements</option>
                  <option value="tool">Tools & Calculators</option>
                  <option value="resource">Resources</option>
                  <option value="blog">Blogs & Articles</option>
                  <option value="settings">Settings & Backups</option>
                  <option value="result">Semester Results</option>
                </select>
              </div>

              {/* Date Range */}
              <div className="md:col-span-3">
                <select
                  value={auditDateRange}
                  onChange={(e) => {
                    setAuditDateRange(e.target.value);
                    setAuditCurrentPage(1);
                  }}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-bg text-text-h focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="all">All Recorded History</option>
                  <option value="today">Today</option>
                  <option value="7d">Last 7 Days</option>
                  <option value="30d">Last 30 Days</option>
                  <option value="90d">Last 90 Days</option>
                </select>
              </div>

              {/* Sort By */}
              <div className="md:col-span-2">
                <select
                  value={auditSortBy}
                  onChange={(e) => {
                    setAuditSortBy(e.target.value);
                    setAuditCurrentPage(1);
                  }}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-bg text-text-h focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="latest">Latest First</option>
                  <option value="oldest">Oldest First</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-text-light pt-1 border-t border-border/50">
              <span>
                Showing <strong className="text-text-h">{auditResult.events.length}</strong> of{' '}
                <strong className="text-text-h">{auditResult.totalCount}</strong> audit events (24h Activity:{' '}
                {auditStats.eventsLast24h})
              </span>

              <div className="flex items-center gap-3">
                {(auditSearch || auditEntityType !== 'all' || auditDateRange !== 'all') && (
                  <button
                    type="button"
                    onClick={() => {
                      setAuditSearch('');
                      setAuditEntityType('all');
                      setAuditDateRange('all');
                    }}
                    className="text-accent hover:underline font-semibold"
                  >
                    Clear filters
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsClearAuditModalOpen(true)}
                  className="text-red-500 hover:underline font-semibold"
                >
                  Clear history
                </button>
              </div>
            </div>
          </div>

          {/* Audit Events Table */}
          <div className="rounded-2xl bg-card border border-border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-bg-sec/50 border-b border-border text-text-light font-bold uppercase tracking-wider text-[10.5px]">
                    <th className="py-3.5 px-4">Timestamp</th>
                    <th className="py-3.5 px-3">Action & Entity</th>
                    <th className="py-3.5 px-3">Actor</th>
                    <th className="py-3.5 px-4">Target Entity</th>
                    <th className="py-3.5 px-4">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {auditResult.events.length > 0 ? (
                    auditResult.events.map((evt) => (
                      <tr key={evt.id} className="hover:bg-bg-sec/30 transition-colors">
                        {/* Timestamp */}
                        <td className="py-3.5 px-4 whitespace-nowrap text-text-light font-mono text-[11px]">
                          {evt.timestamp ? new Date(evt.timestamp).toLocaleString() : '—'}
                        </td>

                        {/* Action & Entity */}
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          <div className="space-y-1">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-bold border ${getActionBadge(
                                evt.action
                              )}`}
                            >
                              {evt.action}
                            </span>
                            <span className="text-[10.5px] text-text-light block capitalize">
                              {evt.entityType || 'General'}
                            </span>
                          </div>
                        </td>

                        {/* Actor */}
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          <span className="font-semibold text-text-h text-[11.5px]">{evt.actor || 'System'}</span>
                        </td>

                        {/* Target Entity */}
                        <td className="py-3.5 px-4 max-w-xs">
                          <div className="space-y-0.5">
                            <strong className="text-text-h text-[11.5px] block truncate">
                              {evt.entityName || evt.title || evt.entityId || '—'}
                            </strong>
                            {evt.entityId && (
                              <span className="text-[10px] text-text-light font-mono block truncate">
                                ID: {evt.entityId}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Details */}
                        <td className="py-3.5 px-4 text-text-m text-[11.5px] leading-relaxed max-w-md">
                          {evt.details}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-text-light">
                        <History className="w-8 h-8 mx-auto mb-2 text-text-light/50" />
                        <p className="text-sm font-semibold text-text-h">No audit records found</p>
                        <p className="text-xs text-text-m mt-1">Adjust your search keyword or date range filter.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {auditResult.totalPages > 1 && (
              <div className="p-4 border-t border-border flex items-center justify-between text-xs text-text-m">
                <div>
                  Page <strong className="text-text-h">{auditCurrentPage}</strong> of{' '}
                  <strong className="text-text-h">{auditResult.totalPages}</strong>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={auditCurrentPage === 1}
                    onClick={() => setAuditCurrentPage((p) => Math.max(1, p - 1))}
                    className="px-3 py-1.5 rounded-lg border border-border hover:bg-bg-sec disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Previous</span>
                  </button>

                  <button
                    type="button"
                    disabled={auditCurrentPage === auditResult.totalPages}
                    onClick={() => setAuditCurrentPage((p) => Math.min(auditResult.totalPages, p + 1))}
                    className="px-3 py-1.5 rounded-lg border border-border hover:bg-bg-sec disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 3: Backup & Restore                                       */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'backup' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Export Card */}
          <div className="rounded-3xl bg-card border border-border p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-3 border-b border-border/70 pb-3">
              <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-500">
                <Download className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-text-h">Export Platform Backup</h2>
                <p className="text-xs text-text-light">Generate serialized JSON snapshot</p>
              </div>
            </div>

            <p className="text-xs text-text-m leading-relaxed">
              Downloads a complete snapshot of ResultPoint application data (Users, Academic Catalog, Tools Configurations, Resources, Announcements, Blogs, Support Queries, and Settings).
            </p>

            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-600 dark:text-amber-300 space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <ShieldCheck className="w-4 h-4" />
                <span>Security Notice:</span>
              </div>
              <p className="text-[11.5px] leading-relaxed">
                Passwords, authentication tokens, and session secrets are <strong>automatically excluded</strong> from the backup. However, this file contains academic grades and student directory records. Store it in a secure location.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleDownloadBackup}
                className="w-full py-3 rounded-xl bg-accent hover:bg-accent-hover text-white text-xs font-bold shadow-md shadow-accent/20 transition-all flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>Download Platform Backup (.json)</span>
              </button>
            </div>
          </div>

          {/* Import / Restore Card */}
          <div className="rounded-3xl bg-card border border-border p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-3 border-b border-border/70 pb-3">
              <div className="p-2.5 rounded-2xl bg-purple-500/10 text-purple-500">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-text-h">Restore Platform Data</h2>
                <p className="text-xs text-text-light">Upload validated JSON backup</p>
              </div>
            </div>

            <p className="text-xs text-text-m leading-relaxed">
              Upload an authentic ResultPoint backup file. The system performs pre-flight schema validation and automatically saves an emergency recovery snapshot before applying changes.
            </p>

            {backupFileError && (
              <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs">
                {backupFileError}
              </div>
            )}

            <div className="pt-2 space-y-3">
              <label className="block w-full cursor-pointer">
                <span className="sr-only">Choose backup file</span>
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileChange}
                  className="block w-full text-xs text-text-light file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-bg-sec file:text-text-h hover:file:bg-accent hover:file:text-white file:transition-colors cursor-pointer border border-border rounded-xl bg-bg"
                />
              </label>

              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-text-light">Schema Version: {BACKUP_SCHEMA_VERSION}</span>
                <button
                  type="button"
                  onClick={() => setIsRollbackModalOpen(true)}
                  className="text-purple-500 hover:underline font-semibold"
                >
                  Rollback to last snapshot
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 4: Storage & Health Diagnostics                           */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'storage' && (
        <div className="space-y-6">
          {/* Storage Quota Gauge */}
          <div className="rounded-3xl bg-card border border-border p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-border/70 pb-3">
              <div>
                <h2 className="text-base font-bold text-text-h">Client Storage Health & Quota</h2>
                <p className="text-xs text-text-light">Standard 5 MB browser localStorage utilization</p>
              </div>
              <div className="text-right">
                <span className="text-xl font-black text-text-h">{storageDiagnostics.formattedTotal}</span>
                <span className="text-xs text-text-light block">of ~5.0 MB quota ({storageDiagnostics.quotaPercent}%)</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-3 rounded-full bg-bg-sec overflow-hidden border border-border">
              <div
                className="h-full bg-accent transition-all duration-500 rounded-full"
                style={{ width: `${Math.max(2, storageDiagnostics.quotaPercent)}%` }}
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-2">
              <div className="p-3 rounded-xl bg-bg-sec/50 border border-border/60">
                <span className="text-text-light block text-[11px]">Application Version</span>
                <strong className="text-text-h text-xs">{APP_VERSION}</strong>
              </div>
              <div className="p-3 rounded-xl bg-bg-sec/50 border border-border/60">
                <span className="text-text-light block text-[11px]">Backup Schema</span>
                <strong className="text-text-h text-xs">v{BACKUP_SCHEMA_VERSION}</strong>
              </div>
              <div className="p-3 rounded-xl bg-bg-sec/50 border border-border/60">
                <span className="text-text-light block text-[11px]">Storage Engine</span>
                <strong className="text-text-h text-xs">HTML5 LocalStorage</strong>
              </div>
              <div className="p-3 rounded-xl bg-bg-sec/50 border border-border/60">
                <span className="text-text-light block text-[11px]">Future Backend</span>
                <strong className="text-text-h text-xs">Spring Boot + MySQL</strong>
              </div>
            </div>
          </div>

          {/* Key Breakdown Table */}
          <div className="rounded-2xl bg-card border border-border shadow-sm overflow-hidden">
            <div className="p-4 border-b border-border bg-bg-sec/30">
              <h3 className="text-xs font-bold text-text-h uppercase tracking-wider">
                Canonical Storage Registry Breakdown
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-bg-sec/50 border-b border-border text-text-light font-bold uppercase tracking-wider text-[10.5px]">
                    <th className="py-3 px-4">Entity Store</th>
                    <th className="py-3 px-3">Storage Key</th>
                    <th className="py-3 px-3">Record Count</th>
                    <th className="py-3 px-4 text-right">Size (Bytes)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {storageDiagnostics.keyBreakdown.map((item) => (
                    <tr key={item.name} className="hover:bg-bg-sec/30 transition-colors">
                      <td className="py-3 px-4 font-semibold text-text-h">{item.name}</td>
                      <td className="py-3 px-3 font-mono text-text-light text-[11px]">{item.key}</td>
                      <td className="py-3 px-3 text-text-m">{item.itemCount} items</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-text-h">
                        {item.formattedSize}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: Restore Confirmation                                   */}
      {/* ------------------------------------------------------------- */}
      {isRestoreModalOpen && backupPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg bg-card border border-border rounded-3xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3 text-purple-500">
              <div className="p-3 rounded-2xl bg-purple-500/10">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-text-h">Confirm Platform Restore</h3>
                <p className="text-xs text-text-light">Pre-flight validation passed</p>
              </div>
            </div>

            <p className="text-xs text-text-m leading-relaxed">
              You are about to restore data exported on{' '}
              <strong className="text-text-h">{new Date(backupPreview.exportedAt).toLocaleString()}</strong>.
              An emergency recovery snapshot will be automatically created before applying changes.
            </p>

            {/* Summary Grid */}
            <div className="p-4 rounded-2xl bg-bg-sec/50 border border-border/60 grid grid-cols-2 gap-2.5 text-xs">
              <div>
                <span className="text-text-light block text-[11px]">Users Directory:</span>
                <strong className="text-text-h">{backupPreview.data?.users?.length || 0} accounts</strong>
              </div>
              <div>
                <span className="text-text-light block text-[11px]">Academic Catalog:</span>
                <strong className="text-text-h">
                  {backupPreview.data?.academicCatalog ? 'Present' : 'None'}
                </strong>
              </div>
              <div>
                <span className="text-text-light block text-[11px]">Tools Config:</span>
                <strong className="text-text-h">{backupPreview.data?.tools?.length || 0} tools</strong>
              </div>
              <div>
                <span className="text-text-light block text-[11px]">Resources & Blogs:</span>
                <strong className="text-text-h">
                  {(backupPreview.data?.resources?.length || 0) + (backupPreview.data?.blogs?.length || 0)} items
                </strong>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => {
                  setIsRestoreModalOpen(false);
                  setBackupPreview(null);
                }}
                className="px-4 py-2 rounded-xl border border-border hover:bg-bg-sec text-xs font-semibold text-text-h"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRestore}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-600/20"
              >
                Proceed With Restore
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: Rollback Confirmation                                  */}
      {/* ------------------------------------------------------------- */}
      {isRollbackModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-card border border-border rounded-3xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3 text-amber-500">
              <div className="p-3 rounded-2xl bg-amber-500/10">
                <RotateCcw className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-text-h">Emergency Snapshot Rollback</h3>
                <p className="text-xs text-text-light">Revert to pre-restore state</p>
              </div>
            </div>

            <p className="text-xs text-text-m leading-relaxed">
              This will restore the emergency safety snapshot created during the most recent backup restore.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setIsRollbackModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-border hover:bg-bg-sec text-xs font-semibold text-text-h"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRollback}
                className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md shadow-amber-600/20"
              >
                Confirm Rollback
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: Reset Defaults Confirmation                           */}
      {/* ------------------------------------------------------------- */}
      {isResetSettingsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-card border border-border rounded-3xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3 text-amber-500">
              <div className="p-3 rounded-2xl bg-amber-500/10">
                <RotateCcw className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-text-h">Restore Baseline Settings</h3>
                <p className="text-xs text-text-light">Reset portal configurations</p>
              </div>
            </div>

            <p className="text-xs text-text-m leading-relaxed">
              Are you sure you want to restore baseline platform settings? Academic data and university catalog rules will remain intact.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setIsResetSettingsModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-border hover:bg-bg-sec text-xs font-semibold text-text-h"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmResetSettings}
                className="px-4 py-2 rounded-xl bg-accent hover:bg-accent-hover text-white text-xs font-bold shadow-md shadow-accent/20"
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: Clear Audit History Confirmation                       */}
      {/* ------------------------------------------------------------- */}
      {isClearAuditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-card border border-border rounded-3xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3 text-red-500">
              <div className="p-3 rounded-2xl bg-red-500/10">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-text-h">Clear Audit Trail History</h3>
                <p className="text-xs text-text-light">Destructive operation</p>
              </div>
            </div>

            <p className="text-xs text-text-m leading-relaxed">
              Are you sure you want to clear all recorded administrative audit events? Consider downloading a backup first to preserve historical audit logs.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setIsClearAuditModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-border hover:bg-bg-sec text-xs font-semibold text-text-h"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmClearAudit}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md shadow-red-600/20"
              >
                Clear History
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
