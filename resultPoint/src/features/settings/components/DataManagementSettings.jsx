import React, { useState } from 'react';
import { Database, Download, Trash2, RefreshCw, AlertTriangle } from 'lucide-react';
import { useAppDispatch } from '../../../hooks/useAppDispatch.js';
import { useToast } from '../../../context/ToastContext.jsx';
import { clearCalculationHistory } from '../../calculation/calculationSlice.js';
import { resultService, DEMO_STUDENT_RESULTS } from '../../../services/resultService.js';
import { goalService } from '../../../services/goalService.js';
import { backlogService } from '../../../services/backlogService.js';
import { exportStudentData } from '../utils/exportStudentData.js';
import ConfirmationModal from './ConfirmationModal.jsx';

export default function DataManagementSettings() {
  const dispatch = useAppDispatch();
  const { showToast } = useToast();

  const [isClearHistoryOpen, setIsClearHistoryOpen] = useState(false);
  const [isResetDemoOpen, setIsResetDemoOpen] = useState(false);

  // Handle Export
  const handleExport = () => {
    try {
      const res = exportStudentData();
      showToast(`Exported ${res.filename} with ${res.countResults} semester results and ${res.countRecords} education records.`);
    } catch (e) {
      showToast('Failed to export student data. Please try again.', 'error');
    }
  };

  // Handle Clear Calculation History
  const handleConfirmClearHistory = () => {
    dispatch(clearCalculationHistory());
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('calculation_history_updated'));
      window.dispatchEvent(new Event('calculations_data_updated'));
    }
    showToast('Calculation history cleared successfully.');
  };

  // Handle Reset Demo Data
  const handleConfirmResetDemo = () => {
    try {
      resultService.resetResults(DEMO_STUDENT_RESULTS);
      goalService.resetGoal('Bachelor of Computer Applications', 6);
      backlogService.resetBacklogs();

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('results_data_updated'));
        window.dispatchEvent(new Event('academic_goals_updated'));
        window.dispatchEvent(new Event('backlogs_data_updated'));
        window.dispatchEvent(new Event('academic_history_updated'));
      }
      showToast('Demo academic results, goals, and metrics reset to defaults.');
    } catch (e) {
      showToast('Failed to reset demo data.', 'error');
    }
  };

  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-card border border-border shadow-subtle space-y-6">
      {/* Section Header */}
      <div className="flex items-start gap-3.5 pb-4 border-b border-border">
        <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/25 flex items-center justify-center text-accent flex-shrink-0 mt-0.5">
          <Database className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-base font-bold text-text-h tracking-tight">
            Data Management
          </h2>
          <p className="text-xs text-text-light mt-0.5">
            Manage your application data and storage.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* 1. Export My Data */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div className="flex items-start gap-3">
            <Download className="w-4 h-4 text-text-light mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-xs font-bold text-text-h">Export My Data</div>
              <div className="text-[11px] text-text-light">
                Download your education records, results and settings.
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleExport}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-text-h bg-bg-sec hover:bg-card border border-border hover:border-accent transition-colors cursor-pointer flex-shrink-0 text-center shadow-2xs"
          >
            Export Data
          </button>
        </div>

        {/* 2. Clear Calculation History */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-border/60">
          <div className="flex items-start gap-3">
            <Trash2 className="w-4 h-4 text-rose-500 mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-xs font-bold text-text-h">Clear Calculation History</div>
              <div className="text-[11px] text-text-light">
                Remove all saved GPA/CGPA calculations from history.
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsClearHistoryOpen(true)}
            className="px-4 py-2 rounded-xl text-xs font-bold text-rose-500 hover:text-rose-600 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 hover:border-rose-500/50 transition-colors cursor-pointer flex-shrink-0 text-center"
          >
            Clear History
          </button>
        </div>

        {/* 3. Reset Demo Data */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-border/60">
          <div className="flex items-start gap-3">
            <RefreshCw className="w-4 h-4 text-rose-500 mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-xs font-bold text-text-h">Reset Demo Data</div>
              <div className="text-[11px] text-text-light">
                Restore initial demo results, goals, and metrics. This will not affect your account settings.
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsResetDemoOpen(true)}
            className="px-4 py-2 rounded-xl text-xs font-bold text-rose-500 hover:text-rose-600 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 hover:border-rose-500/50 flex items-center justify-center gap-1.5 transition-colors cursor-pointer flex-shrink-0 text-center"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Demo</span>
          </button>
        </div>

        {/* 4. Important Note Card matching screenshot */}
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 mt-2">
          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-amber-600 dark:text-amber-400">Important Note</h4>
            <p className="text-[11px] text-amber-800/90 dark:text-amber-200/80 leading-relaxed">
              Reset Demo Data is only for demo environment. It will restore the initial sample data and will not delete your actual education records or account information.
            </p>
          </div>
        </div>
      </div>

      {/* Confirmation Modals */}
      <ConfirmationModal
        isOpen={isClearHistoryOpen}
        onClose={() => setIsClearHistoryOpen(false)}
        onConfirm={handleConfirmClearHistory}
        title="Clear Calculation History"
        description="Are you sure you want to delete all saved GPA and CGPA calculations from your Calculation History? Your academic results and goals will not be affected."
        confirmLabel="Clear History"
        isDestructive={true}
      />

      <ConfirmationModal
        isOpen={isResetDemoOpen}
        onClose={() => setIsResetDemoOpen(false)}
        onConfirm={handleConfirmResetDemo}
        title="Reset Demo Data"
        description="This will restore the standard demo semester results (Sem 1 to 4) and default goal metrics. Your account profile, preferences, and custom education records will be preserved."
        confirmLabel="Reset Demo Data"
        isDestructive={true}
      />
    </div>
  );
}
