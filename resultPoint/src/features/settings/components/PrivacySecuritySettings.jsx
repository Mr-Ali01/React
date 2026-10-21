import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, ShieldCheck, LogOut, ChevronRight } from 'lucide-react';
import { useToast } from '../../../context/ToastContext.jsx';
import { authService } from '../../../services/authService.js';
import DataPrivacyModal from './DataPrivacyModal.jsx';
import ConfirmationModal from './ConfirmationModal.jsx';

export default function PrivacySecuritySettings() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false);

  const handleConfirmSignOutAll = () => {
    try {
      authService.logout();
      showToast('All active student sessions ended. Please sign in again.');
      navigate('/login');
    } catch {
      navigate('/login');
    }
  };

  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-card border border-border shadow-subtle space-y-6">
      {/* Section Header */}
      <div className="flex items-start gap-3.5 pb-4 border-b border-border">
        <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/25 flex items-center justify-center text-accent flex-shrink-0 mt-0.5">
          <Shield className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-base font-bold text-text-h tracking-tight">
            Privacy & Security
          </h2>
          <p className="text-xs text-text-light mt-0.5">
            Your data security and privacy settings.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* 1. Data Privacy */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div className="flex items-start gap-3">
            <ShieldCheck className="w-4 h-4 text-text-light mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-xs font-bold text-text-h">Data Privacy</div>
              <div className="text-[11px] text-text-light">
                Manage how your data is used in the application.
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsPrivacyModalOpen(true)}
            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-text-m hover:text-text-h bg-bg-sec hover:bg-card border border-border hover:border-accent flex items-center gap-1 transition-colors cursor-pointer flex-shrink-0"
          >
            <span>View Policy</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 2. Sign Out from All Devices */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-border/60">
          <div className="flex items-start gap-3">
            <LogOut className="w-4 h-4 text-rose-500 mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-xs font-bold text-text-h">Sign Out from All Devices</div>
              <div className="text-[11px] text-text-light">
                End all active sessions except this one.
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsSignOutModalOpen(true)}
            className="px-4 py-2 rounded-xl text-xs font-bold text-rose-500 hover:text-rose-600 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 hover:border-rose-500/50 transition-colors cursor-pointer flex-shrink-0 text-center"
          >
            Sign Out All
          </button>
        </div>
      </div>

      {/* Modals */}
      <DataPrivacyModal
        isOpen={isPrivacyModalOpen}
        onClose={() => setIsPrivacyModalOpen(false)}
      />

      <ConfirmationModal
        isOpen={isSignOutModalOpen}
        onClose={() => setIsSignOutModalOpen(false)}
        onConfirm={handleConfirmSignOutAll}
        title="Sign Out from All Devices"
        description="Are you sure you want to end all active sessions? You will be signed out on this device and all other stored sessions."
        confirmLabel="Sign Out All"
        isDestructive={true}
      />
    </div>
  );
}
